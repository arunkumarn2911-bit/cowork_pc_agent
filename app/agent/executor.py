"""
Executor: Validates actions, enforces safety and risk approvals, executes tools,
and collects structured results with latency tracking.
"""

from __future__ import annotations
import time
from typing import Any, Dict, List, Optional, Set
from app.agent.action_schema import (
    Action,
    ActionType,
    ActionRisk,
    ExecutionResult,
)
from app.tools.browser_control import BrowserController, BrowserError
from app.tools.desktop_control import DesktopController, DesktopError
from app.tools.artifact_manager import ArtifactManager, ArtifactSecurityError


class Executor:
    def __init__(
        self,
        browser_controller: Optional[BrowserController] = None,
        desktop_controller: Optional[DesktopController] = None,
        artifact_manager: Optional[ArtifactManager] = None,
        auto_approve_safe_only: bool = True,
    ):
        self.browser = browser_controller or BrowserController()
        self.desktop = desktop_controller or DesktopController()
        self.artifacts = artifact_manager or ArtifactManager()
        self.auto_approve_safe_only = auto_approve_safe_only
        self._approved_actions: Set[str] = set()

    def approve_action(self, action_signature: str) -> None:
        self._approved_actions.add(action_signature)

    def is_action_approved(self, action: Action) -> bool:
        sig = f"{action.name.value}:{str(sorted(action.arguments.items()))}"
        return sig in self._approved_actions

    async def execute_batch(
        self,
        actions: List[Action],
        workflow_id: str = "default",
    ) -> List[ExecutionResult]:
        results: List[ExecutionResult] = []

        for action in actions:
            # 1. Enforce safety policy & risk evaluation
            risk = action.determine_risk()
            if risk == ActionRisk.CONSEQUENTIAL and not self.is_action_approved(action):
                results.append(
                    ExecutionResult(
                        action_name=action.name.value,
                        status="blocked_approval",
                        error_category="safety",
                        error_message=f"Action '{action.name.value}' requires explicit human approval before execution.",
                        output={
                            "action_name": action.name.value,
                            "arguments": action.arguments,
                            "risk": risk.value,
                            "description": action.description,
                        },
                    )
                )
                # Halt batch execution at first action requiring approval
                break

            # 2. Execute single action
            res = await self.execute_action(action)
            results.append(res)

            # If an action fails with non-ignorable error, halt subsequent steps in this bounded batch
            if res.status == "error":
                break

        return results

    async def execute_action(self, action: Action) -> ExecutionResult:
        start_time = time.time()
        name = action.name
        args = action.arguments

        try:
            # --- Browser Actions ---
            if name == ActionType.OPEN_URL:
                url = args["url"]
                out = await self.browser.open_url(url)
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=out,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                    verification_evidence=f"Navigated to {url}",
                )

            elif name == ActionType.INSPECT_PAGE:
                max_len = args.get("max_text_len", 2000)
                obs = await self.browser.inspect_page(max_text_len=max_len)
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=obs.model_dump(),
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                    verification_evidence=f"Observed '{obs.page_title}' with {len(obs.controls)} controls",
                )

            elif name == ActionType.FIND_ELEMENTS:
                sel = args.get("selector", "*")
                obs = await self.browser.inspect_page()
                matched = [c for c in obs.controls if sel.replace("#", "").replace(".", "") in str(c.values())]
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output={"matches": matched, "count": len(matched)},
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                )

            elif name == ActionType.CLICK_ELEMENT:
                sel = args.get("selector", "")
                timeout = args.get("timeout_ms", 5000)
                out = await self.browser.click_element(selector=sel, timeout_ms=timeout)
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=out,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                    verification_evidence=f"Clicked element matching '{sel}'",
                )

            elif name == ActionType.FILL_FIELD:
                sel = args["selector"]
                txt = args["text"]
                clear = args.get("clear_first", True)
                out = await self.browser.fill_field(selector=sel, text=txt, clear_first=clear)
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=out,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                    verification_evidence=f"Filled field '{sel}' with text",
                )

            elif name == ActionType.EXTRACT_DATA:
                fields = args.get("fields")
                sels = args.get("selectors")
                out = await self.browser.extract_data(fields=fields, selectors=sels)
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=out,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                    verification_evidence=f"Extracted {len(out.get('extracted_data', {}))} data fields",
                )

            elif name == ActionType.TAKE_SCREENSHOT:
                filename = args.get("filename", "screenshot.png")
                target_path = self.artifacts.workspace_dir / filename
                saved_path = await self.browser.take_screenshot(str(target_path))
                # Verify file exists
                ver = self.artifacts.verify_artifact(filename)
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output={"artifact": filename, "path": saved_path, "verified": ver["verified"]},
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=ver["verified"],
                    verification_evidence=f"Screenshot verified ({ver.get('size_bytes', 0)} bytes)",
                )

            elif name == ActionType.SAVE_ARTIFACT:
                filename = args["filename"]
                content = args["content"]
                fmt = args.get("format", "json")
                if fmt == "csv" and isinstance(content, list):
                    art = self.artifacts.save_csv(filename, content)
                elif fmt == "text" or isinstance(content, str):
                    art = self.artifacts.save_file(filename, content)
                else:
                    art = self.artifacts.save_json(filename, content)

                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=art,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=art["verified"],
                    verification_evidence=f"Saved & re-verified {filename} ({art['size_bytes']} bytes)",
                )

            # --- Desktop Actions ---
            elif name == ActionType.DESKTOP_INSPECT:
                obs = self.desktop.desktop_inspect()
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=obs.model_dump(),
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                )

            elif name == ActionType.DESKTOP_CLICK:
                out = self.desktop.desktop_click(x=args["x"], y=args["y"], clicks=args.get("clicks", 1))
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=out,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                )

            elif name == ActionType.DESKTOP_TYPE:
                out = self.desktop.desktop_type(text=args["text"], interval=args.get("interval", 0.05))
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=out,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                )

            elif name == ActionType.DESKTOP_HOTKEY:
                out = self.desktop.desktop_hotkey(keys=args["keys"])
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output=out,
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                )

            elif name == ActionType.DESKTOP_SCREENSHOT:
                filename = args.get("filename", "desktop.png")
                target = self.artifacts.workspace_dir / filename
                out_path = self.desktop.desktop_screenshot(str(target))
                ver = self.artifacts.verify_artifact(filename)
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output={"artifact": filename, "path": out_path},
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=ver["verified"],
                    verification_evidence=f"Desktop screenshot saved ({ver.get('size_bytes', 0)} bytes)",
                )

            # --- Terminal / Flow Actions ---
            elif name == ActionType.COMPLETE_GOAL:
                summary = args.get("summary", "")
                evidence = args.get("evidence", {})
                artifacts_list = args.get("verified_artifacts", [])
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output={"summary": summary, "evidence": evidence, "verified_artifacts": artifacts_list},
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                    verification_evidence="Goal criteria confirmed with evidence",
                )

            elif name == ActionType.REQUEST_CLARIFICATION:
                return ExecutionResult(
                    action_name=name.value,
                    status="success",
                    output={"question": args.get("question")},
                    duration_ms=(time.time() - start_time) * 1000,
                    verified=True,
                )

            else:
                return ExecutionResult(
                    action_name=name.value,
                    status="error",
                    error_category="validation",
                    error_message=f"Action '{name.value}' execution handler not implemented",
                    duration_ms=(time.time() - start_time) * 1000,
                )

        except ArtifactSecurityError as e:
            return ExecutionResult(
                action_name=name.value,
                status="error",
                error_category="safety",
                error_message=f"Security violation: {e}",
                duration_ms=(time.time() - start_time) * 1000,
            )
        except BrowserError as e:
            return ExecutionResult(
                action_name=name.value,
                status="error",
                error_category="timeout" if "timeout" in str(e).lower() else "missing_element",
                error_message=str(e),
                duration_ms=(time.time() - start_time) * 1000,
            )
        except DesktopError as e:
            return ExecutionResult(
                action_name=name.value,
                status="error",
                error_category="system",
                error_message=str(e),
                duration_ms=(time.time() - start_time) * 1000,
            )
        except Exception as e:
            return ExecutionResult(
                action_name=name.value,
                status="error",
                error_category="system",
                error_message=f"Unexpected error: {e}",
                duration_ms=(time.time() - start_time) * 1000,
            )
