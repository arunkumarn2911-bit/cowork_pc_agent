"""
Command Line Interface (CLI) for running autonomous computer-use workflows directly from Windows CMD or bash.
"""

from __future__ import annotations
import argparse
import asyncio
import sys
import time
from app.agent.workflow_engine import WorkflowEngine, WorkflowLimits
from app.agent.task_store import TaskStore, WorkflowStatus
from app.agent.planner import Planner
from app.agent.executor import Executor


async def main_async() -> int:
    parser = argparse.ArgumentParser(description="Cowork-Style Autonomous PC Agent CLI")
    parser.add_argument("goal", nargs="?", help="Natural language goal to execute")
    parser.add_argument("--model", default="auto", choices=["auto", "gemini", "ollama", "heuristic"], help="Planner model provider")
    parser.add_argument("--max-stages", type=int, default=20, help="Maximum workflow stages")
    parser.add_argument("--max-actions", type=int, default=100, help="Maximum total actions")
    parser.add_argument("--headless", action="store_true", default=True, help="Run browser headless")

    args = parser.parse_args()

    goal = args.goal
    if not goal:
        print("\n=== Cowork PC Agent: Autonomous Computer-Use ===")
        goal = input("Enter your goal: ").strip()

    if not goal:
        print("Error: No goal provided. Exiting.")
        return 1

    print(f"\n[INIT] Goal accepted: '{goal}'")
    print(f"[INIT] Model: {args.model} | Headless: {args.headless} | Max Stages: {args.max_stages}")

    store = TaskStore("workflows.db")
    limits = WorkflowLimits(max_stages=args.max_stages, max_total_actions=args.max_actions)
    planner = Planner(provider=args.model)
    engine = WorkflowEngine(task_store=store, planner=planner, limits=limits)

    record = engine.create_workflow(goal)
    print(f"[WORKFLOW] Assigned ID: {record.workflow_id}")

    # Central Autonomous Execution Loop
    while True:
        record = await engine.step_workflow(record.workflow_id)

        print(f"\n--- Stage {record.current_stage}: Status = {record.status.value} ---")
        if record.last_plan:
            print(f"Objective: {record.last_plan.get('stage_objective')}")
            for step in record.last_plan.get("steps", []):
                print(f"  > Action: {step.get('name')} | {step.get('description')}")

        if record.last_execution_result:
            print("Execution Results:")
            for res in record.last_execution_result:
                status_icon = "✓" if res.get("status") == "success" else "✗"
                print(f"  [{status_icon}] {res.get('action_name')}: {res.get('verification_evidence') or res.get('error_message') or 'OK'}")

        # Handle Human Approval
        if record.status == WorkflowStatus.AWAITING_APPROVAL:
            app_state = record.approval_state or {}
            print("\n" + "=" * 60)
            print("HUMAN APPROVAL REQUIRED:")
            print(f"Action: {app_state.get('action_name')}")
            print(f"Arguments: {app_state.get('arguments')}")
            print(f"Risk: {app_state.get('risk')}")
            print(f"Description: {app_state.get('description')}")
            print("=" * 60)

            choice = input("Approve this consequential action? (y/N): ").strip().lower()
            if choice == "y":
                record = engine.approve_action(record.workflow_id)
                print("[APPROVED] Resuming workflow...")
                continue
            else:
                record = engine.reject_action(record.workflow_id)
                print("[REJECTED] Workflow terminated.")
                break

        # Handle Clarification
        elif record.status == WorkflowStatus.AWAITING_CLARIFICATION:
            q = record.clarification.get("question") if record.clarification else "Clarification needed"
            print(f"\n[QUESTION FROM AGENT] {q}")
            ans = input("Your answer: ").strip()
            record = engine.provide_clarification(record.workflow_id, ans)
            print("[RESUMING] Workflow proceeding with new information...")
            continue

        elif record.status in (WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED):
            break

    print("\n" + "=" * 60)
    print(f"FINAL WORKFLOW RESULT: {record.status.value}")
    if record.final_report:
        print(f"Summary: {record.final_report.get('summary')}")
        print(f"Total Stages: {record.final_report.get('total_stages')}")
        print(f"Total Actions: {record.final_report.get('total_actions')}")
        print(f"Artifacts Created ({len(record.artifacts)}):")
        for art in record.artifacts:
            print(f"  - {art.get('filename')} ({art.get('size_bytes', 0)} bytes)")
    elif record.error_summary:
        print(f"Error: {record.error_summary}")
    print("=" * 60)

    return 0 if record.status == WorkflowStatus.COMPLETED else 1


def main() -> None:
    sys.exit(asyncio.run(main_async()))


if __name__ == "__main__":
    main()
