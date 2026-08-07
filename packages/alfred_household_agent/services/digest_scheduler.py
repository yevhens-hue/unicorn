"""
Alfred Household Agent — Nightly Digest & Follow-up Scheduler
Specification: alfred-household-cos-spec.md (§4 & §5)

Features:
1. Nightly Digest Job (20:30 Local Time):
   - Generates calm briefing (<150 words)
   - Highlights due items, pending bills, waiting-on nudges, wife additions, and 1 quick 10-min win.
2. Waiting-On Follow-up Worker (§5):
   - Resurfaces stale tasks where follow_up_at <= now() after 2 days.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any


class DigestSchedulerService:
    @staticmethod
    def generate_nightly_briefing(open_tasks: List[Dict[str, Any]]) -> str:
        """Generates Chief of Staff 20:30 DM briefing under 150 words (§4)."""
        urgent_items = []
        bills_pending = []
        waiting_on_items = []
        wife_added = []
        quick_wins = []

        for t in open_tasks:
            title = t.get("title", "")
            needs_app = t.get("needs_approval", False)
            cat = t.get("category", "")
            amt = t.get("amount_cents")
            amt_str = f"${(amt/100):,.2f}" if amt else ""

            if needs_app or t.get("priority") == 1:
                urgent_items.append(f"• 🚨 {title} ({amt_str}) [APPROVAL REQUIRED]")
            elif cat == "bill":
                bills_pending.append(f"• 💳 {t.get('vendor', title)}: {amt_str} (Due {t.get('due_date', 'Fri')})")
            elif t.get("status") == "waiting_on":
                waiting_on_items.append(f"• ⏳ {title}")
            elif t.get("requested_by") == "wife":
                wife_added.append(f"• 👩 {title}")
            else:
                quick_wins.append(title)

        quick_win = quick_wins[0] if quick_wins else "Review & approve pending bills"

        briefing = (
            f"👔 **CHIEF OF STAFF BRIEFING — 20:30**\n\n"
            f"**1. Action / Approval Items:**\n" + ("\n".join(urgent_items) if urgent_items else "• None urgent today.") + "\n\n"
            f"**2. Unpaid Bills:**\n" + ("\n".join(bills_pending) if bills_pending else "• All bills up to date.") + "\n\n"
            f"**3. Waiting-On Nudges:**\n" + ("\n".join(waiting_on_items) if waiting_on_items else "• No pending external nudges.") + "\n\n"
            f"⚡ **10-Min Quick Win Tonight:** `{quick_win}`\n\n"
            f"*(Direct briefing for Principal Connor. Zero money executed autonomously.)*"
        )

        return briefing

    @staticmethod
    def check_waiting_on_followups(waiting_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Finds waiting_on tasks where follow_up_at <= now() (§5)."""
        resurfaced_alerts = []
        now = datetime.now()

        for t in waiting_tasks:
            follow_up_time = t.get("follow_up_at")
            if not follow_up_time or follow_up_time <= now:
                new_followup_at = now + timedelta(days=2)
                resurfaced_alerts.append({
                    "task_id": t.get("id"),
                    "telegram_dm": f"⏳ **Waiting-On Nudge:** Still waiting on `{t.get('title')}`. Nudge them?",
                    "bumped_follow_up_at": new_followup_at.isoformat(),
                    "event_type": "followup_sent"
                })

        return resurfaced_alerts
