"""
Action schemas, validation models, risk classification, and observation definitions.
Supports both Pydantic v2 and Python 3.10 standard library fallback.
"""

from __future__ import annotations
from enum import Enum
import time
from typing import Any, Callable, Dict, List, Optional, Union

# Attempt import of Pydantic; if unavailable, provide standard library dataclass shim
try:
    from pydantic import BaseModel as _PydanticBaseModel, Field, field_validator
    _HAS_PYDANTIC = True
except ImportError:
    _HAS_PYDANTIC = False

    class _PydanticBaseModel:
        def __init__(self, **kwargs: Any):
            for k, v in kwargs.items():
                setattr(self, k, v)
            # Run custom field validators if defined
            for attr_name in dir(self.__class__):
                attr = getattr(self.__class__, attr_name)
                if hasattr(attr, "_is_field_validator"):
                    fields = getattr(attr, "_validator_fields", [])
                    for f in fields:
                        if f in kwargs:
                            val = getattr(self, f)
                            val = attr(self.__class__, val, kwargs)
                            setattr(self, f, val)

        def model_dump(self) -> Dict[str, Any]:
            res: Dict[str, Any] = {}
            for k, v in self.__dict__.items():
                if not k.startswith("_"):
                    if isinstance(v, _PydanticBaseModel):
                        res[k] = v.model_dump()
                    elif isinstance(v, list):
                        res[k] = [item.model_dump() if isinstance(item, _PydanticBaseModel) else item for item in v]
                    elif isinstance(v, Enum):
                        res[k] = v.value
                    else:
                        res[k] = v
            return res

        def dict(self) -> Dict[str, Any]:
            return self.model_dump()

    def Field(default: Any = ..., default_factory: Optional[Callable[[], Any]] = None, description: str = "") -> Any:
        if default_factory is not None:
            return default_factory()
        return default if default is not ... else None

    def field_validator(*fields: str, mode: str = "after") -> Callable[[Any], Any]:
        def decorator(fn: Any) -> Any:
            fn._is_field_validator = True
            fn._validator_fields = fields
            return fn
        return decorator


class ActionRisk(str, Enum):
    SAFE = "SAFE"
    CONSEQUENTIAL = "CONSEQUENTIAL"


class ActionType(str, Enum):
    # Browser actions
    OPEN_URL = "open_url"
    ATTACH_BROWSER = "attach_browser"
    INSPECT_PAGE = "inspect_page"
    FIND_ELEMENTS = "find_elements"
    CLICK_ELEMENT = "click_element"
    HOVER_ELEMENT = "hover_element"
    FILL_FIELD = "fill_field"
    SELECT_OPTION = "select_option"
    SCROLL_TO = "scroll_to"
    WAIT_FOR_CONDITION = "wait_for_condition"
    EXTRACT_DATA = "extract_data"
    VERIFY_CANDLE_OHLC = "verify_candle_ohlc"
    TAKE_SCREENSHOT = "take_screenshot"
    SAVE_ARTIFACT = "save_artifact"

    # Desktop actions
    DESKTOP_INSPECT = "desktop_inspect"
    DESKTOP_CLICK = "desktop_click"
    DESKTOP_TYPE = "desktop_type"
    DESKTOP_HOTKEY = "desktop_hotkey"
    DESKTOP_SCREENSHOT = "desktop_screenshot"

    # Human-in-the-loop & terminal actions
    REQUEST_APPROVAL = "request_approval"
    REQUEST_CLARIFICATION = "request_clarification"
    COMPLETE_GOAL = "complete_goal"


ACTION_RISK_MAP: Dict[ActionType, ActionRisk] = {
    ActionType.OPEN_URL: ActionRisk.SAFE,
    ActionType.ATTACH_BROWSER: ActionRisk.SAFE,
    ActionType.INSPECT_PAGE: ActionRisk.SAFE,
    ActionType.FIND_ELEMENTS: ActionRisk.SAFE,
    ActionType.CLICK_ELEMENT: ActionRisk.SAFE,
    ActionType.HOVER_ELEMENT: ActionRisk.SAFE,
    ActionType.FILL_FIELD: ActionRisk.SAFE,
    ActionType.SELECT_OPTION: ActionRisk.SAFE,
    ActionType.SCROLL_TO: ActionRisk.SAFE,
    ActionType.WAIT_FOR_CONDITION: ActionRisk.SAFE,
    ActionType.EXTRACT_DATA: ActionRisk.SAFE,
    ActionType.VERIFY_CANDLE_OHLC: ActionRisk.SAFE,
    ActionType.TAKE_SCREENSHOT: ActionRisk.SAFE,
    ActionType.SAVE_ARTIFACT: ActionRisk.SAFE,
    ActionType.DESKTOP_INSPECT: ActionRisk.SAFE,
    ActionType.DESKTOP_CLICK: ActionRisk.SAFE,
    ActionType.DESKTOP_TYPE: ActionRisk.SAFE,
    ActionType.DESKTOP_HOTKEY: ActionRisk.SAFE,
    ActionType.DESKTOP_SCREENSHOT: ActionRisk.SAFE,
    ActionType.REQUEST_APPROVAL: ActionRisk.SAFE,
    ActionType.REQUEST_CLARIFICATION: ActionRisk.SAFE,
    ActionType.COMPLETE_GOAL: ActionRisk.SAFE,
}

CONSEQUENTIAL_KEYWORDS = [
    "delete",
    "remove",
    "destroy",
    "buy",
    "purchase",
    "order",
    "pay",
    "transfer",
    "submit_payment",
    "send_email",
    "publish",
    "post_message",
    "modify_security",
    "drop_table",
    "execute_trade",
]


class Action(_PydanticBaseModel):
    name: ActionType = Field(..., description="The unique name of the action to execute")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments for the action")
    description: Optional[str] = Field(None, description="Human-readable description of intent")
    risk_level: Optional[ActionRisk] = Field(None, description="Assigned risk level")

    def __init__(self, **kwargs: Any):
        name_val = kwargs.get("name")
        if isinstance(name_val, str):
            try:
                kwargs["name"] = ActionType(name_val.lower())
            except ValueError:
                raise ValueError(f"Unsupported action: '{name_val}'. Must be one of {[a.value for a in ActionType]}")
        elif not isinstance(name_val, ActionType):
            raise ValueError(f"Invalid action name: {name_val}")

        args_val = kwargs.get("arguments", {})
        if not isinstance(args_val, dict):
            raise ValueError("Arguments must be a dictionary")
        self._validate_arguments(kwargs["name"], args_val)

        if "description" not in kwargs:
            kwargs["description"] = None
        if "risk_level" not in kwargs:
            kwargs["risk_level"] = None

        super().__init__(**kwargs)

    @staticmethod
    def _validate_arguments(name: ActionType, v: Dict[str, Any]) -> None:
        if name == ActionType.OPEN_URL:
            url = v.get("url")
            if not url or not isinstance(url, str):
                raise ValueError("open_url requires 'url' argument as a string")
            if not (url.startswith("http://") or url.startswith("https://") or url.startswith("about:") or url.startswith("file://")):
                raise ValueError(f"Invalid URL protocol: '{url}'. Only HTTP/HTTPS/about/file protocols are permitted")

        elif name == ActionType.ATTACH_BROWSER:
            if "cdp_url" not in v:
                v["cdp_url"] = "http://localhost:9222"

        elif name in (ActionType.CLICK_ELEMENT, ActionType.HOVER_ELEMENT, ActionType.WAIT_FOR_CONDITION):
            if "selector" not in v and "role" not in v and "text" not in v:
                raise ValueError(f"{name.value} requires a 'selector', 'role', or 'text' identifier")

        elif name == ActionType.VERIFY_CANDLE_OHLC:
            if "symbol" not in v:
                v["symbol"] = "AAPL"

        elif name == ActionType.FILL_FIELD:
            if "selector" not in v:
                raise ValueError("fill_field requires 'selector'")
            if "text" not in v:
                raise ValueError("fill_field requires 'text'")

        elif name == ActionType.EXTRACT_DATA:
            if "fields" not in v and "selectors" not in v:
                raise ValueError("extract_data requires 'fields' or 'selectors'")

        elif name == ActionType.SAVE_ARTIFACT:
            filename = v.get("filename")
            if not filename or not isinstance(filename, str):
                raise ValueError("save_artifact requires 'filename' string")
            if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
                raise ValueError("save_artifact rejects path traversal ('..') or absolute paths")
            if "content" not in v:
                raise ValueError("save_artifact requires 'content'")

        elif name == ActionType.REQUEST_APPROVAL:
            if "action_description" not in v:
                raise ValueError("request_approval requires 'action_description'")

        elif name == ActionType.REQUEST_CLARIFICATION:
            if "question" not in v:
                raise ValueError("request_clarification requires 'question'")

        elif name == ActionType.COMPLETE_GOAL:
            if "summary" not in v:
                raise ValueError("complete_goal requires 'summary'")

    def determine_risk(self) -> ActionRisk:
        if self.risk_level:
            return self.risk_level
        base_risk = ACTION_RISK_MAP.get(self.name, ActionRisk.SAFE)
        text_dump = f"{self.name.value} {self.description or ''} {str(self.arguments)}".lower()
        for kw in CONSEQUENTIAL_KEYWORDS:
            if kw in text_dump:
                return ActionRisk.CONSEQUENTIAL
        return base_risk


class StagePlan(_PydanticBaseModel):
    stage_number: int = Field(default=1, description="Current workflow stage number")
    stage_objective: str = Field(..., description="Specific goal for this bounded stage")
    steps: List[Action] = Field(default_factory=list, description="Bounded sequence of actions (max 5)")
    continue_task: bool = Field(default=True, description="Whether more stages are anticipated")
    completion_reason: Optional[str] = Field(None, description="Explanation if goal is completed")
    clarification: Optional[str] = Field(None, description="Question for the user if blocked")
    requires_approval: bool = Field(default=False, description="Whether a step requires human approval")
    approval_details: Optional[Dict[str, Any]] = Field(None, description="Details of the action requiring approval")

    def __init__(self, **kwargs: Any):
        steps = kwargs.get("steps", [])
        if len(steps) > 5:
            raise ValueError(f"A stage plan cannot contain more than 5 actions (received {len(steps)}). Decompose into smaller stages.")
        # Cast dicts to Actions if needed
        converted_steps = []
        for s in steps:
            if isinstance(s, dict):
                converted_steps.append(Action(**s))
            else:
                converted_steps.append(s)
        kwargs["steps"] = converted_steps
        if "stage_number" not in kwargs:
            kwargs["stage_number"] = 1
        if "continue_task" not in kwargs:
            kwargs["continue_task"] = True
        if "requires_approval" not in kwargs:
            kwargs["requires_approval"] = False
        super().__init__(**kwargs)


class Observation(_PydanticBaseModel):
    timestamp: float = Field(default_factory=time.time)
    url: Optional[str] = Field(None)
    page_title: Optional[str] = Field(None)
    visible_text: Optional[str] = Field(None)
    controls: List[Dict[str, Any]] = Field(default_factory=list)
    tables: List[Dict[str, Any]] = Field(default_factory=list)
    active_window: Optional[str] = Field(None)
    screenshot_path: Optional[str] = Field(None)
    raw_status: str = Field(default="ok")
    loading: bool = Field(default=False)
    error: Optional[str] = Field(None)

    def __init__(self, **kwargs: Any):
        if "timestamp" not in kwargs:
            kwargs["timestamp"] = time.time()
        if "controls" not in kwargs:
            kwargs["controls"] = []
        if "tables" not in kwargs:
            kwargs["tables"] = []
        if "raw_status" not in kwargs:
            kwargs["raw_status"] = "ok"
        if "loading" not in kwargs:
            kwargs["loading"] = False
        super().__init__(**kwargs)


class ExecutionResult(_PydanticBaseModel):
    action_name: str
    status: str = Field(default="success")
    output: Any = None
    duration_ms: float = 0.0
    error_message: Optional[str] = None
    error_category: Optional[str] = None
    verified: bool = False
    verification_evidence: Optional[str] = None

    def __init__(self, **kwargs: Any):
        if "status" not in kwargs:
            kwargs["status"] = "success"
        if "duration_ms" not in kwargs:
            kwargs["duration_ms"] = 0.0
        if "verified" not in kwargs:
            kwargs["verified"] = False
        super().__init__(**kwargs)
