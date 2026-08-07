"""
Alfred Household Agent — Todoist Sync Engine
Specification: alfred-household-cos-spec.md (§6a)

Features:
1. Outbound Sync (Alfred → Todoist Household Project)
2. Inbound Webhook Handler (Todoist → Alfred)
3. 3-Layer Echo-Loop Prevention:
   - Primary: Mapping table lookup by `todoist_task_id`
   - Secondary: 30-second TTL recent push suppression cache
   - HMAC SHA-256 Signature Verification (`X-Todoist-Hmac-SHA256`)
"""

import hmac
import hashlib
import base64
import time
from typing import Dict, Any, Optional, Set


class TodoistSyncService:
    def __init__(self, webhook_secret: str = "test_todoist_secret_key_123"):
        self.webhook_secret = webhook_secret
        self.recent_push_suppression_set: Dict[str, float] = {} # todoist_id -> timestamp
        self.database_mapping_table: Dict[str, str] = {} # todoist_id -> alfred_task_id

    def verify_webhook_signature(self, raw_body_bytes: bytes, signature_header: str) -> bool:
        """Verifies X-Todoist-Hmac-SHA256 signature to prevent spoofing (§6a)."""
        if not signature_header:
            return False
        expected = base64.b64encode(
            hmac.new(self.webhook_secret.encode('utf-8'), raw_body_bytes, hashlib.sha256).digest()
        ).decode('utf-8')
        return hmac.compare_digest(expected, signature_header)

    def outbound_push_task(self, alfred_task_id: str, title: str, category: str, priority: int) -> Dict[str, Any]:
        """Pushes task from Alfred to Todoist Household Project and caches ID in suppression set."""
        mock_todoist_id = f"todoist_{int(time.time() * 1000)}"
        
        # 1. Store in mapping table
        self.database_mapping_table[mock_todoist_id] = alfred_task_id

        # 2. Add to recent push suppression set (30s TTL)
        self.recent_push_suppression_set[mock_todoist_id] = time.time()

        # Map Alfred state to Todoist sections (§6a)
        section_map = {
            "bill": "Bills",
            "repair": "This Week",
            "appointment": "This Week",
            "errand": "This Week",
            "other": "Inbox"
        }
        section = section_map.get(category, "This Week")

        return {
            "todoist_task_id": mock_todoist_id,
            "project_name": "Household",
            "section": section,
            "title": title,
            "priority": priority,
            "status": "PUSHED_OUTBOUND"
        }

    def process_inbound_webhook(self, event_type: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handles inbound Todoist webhooks with echo-loop defenses."""
        todoist_id = str(item_data.get("id", ""))
        now = time.time()

        # Defense 1: Check Mapping Table
        if event_type == "item:added" and todoist_id in self.database_mapping_table:
            return {
                "action": "IGNORED_ECHO_MAPPED",
                "reason": f"Todoist ID {todoist_id} already exists in database mapping table.",
                "status": "NO_OP"
            }

        # Defense 2: Check Recent Push Suppression Cache (30s window)
        push_time = self.recent_push_suppression_set.get(todoist_id)
        if push_time and (now - push_time) < 30.0:
            return {
                "action": "IGNORED_ECHO_RECENT_PUSH",
                "reason": f"Todoist ID {todoist_id} was pushed by Alfred {(now - push_time):.1f}s ago.",
                "status": "NO_OP"
            }

        # Process valid inbound event
        if event_type == "item:completed":
            alfred_task_id = self.database_mapping_table.get(todoist_id, "unknown_task")
            return {
                "action": "CLOSE_LOOP",
                "alfred_task_id": alfred_task_id,
                "status": "done",
                "broadcast_telegram_group": f"✅ Task completed via Todoist: '{item_data.get('content')}'"
            }

        if event_type == "item:added":
            return {
                "action": "EXTRACT_AND_ENRICH",
                "title": item_data.get("content"),
                "status": "created_from_todoist",
                "notify_connor_telegram": f"Wife added in Todoist: {item_data.get('content')}"
            }

        return {"action": "UNKNOWN_EVENT", "status": "IGNORED"}
