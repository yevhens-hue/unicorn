# 🎩 Alfred — Household Chief of Staff Agent Framework
> **Self-hosted Personal Operations AI Agent on Hermes Agent & Claude API**
> Built per the official `alfred-household-cos-spec.md` specification.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Hermes Agent](https://img.shields.io/badge/framework-Hermes%20Agent-purple.svg)](https://github.com/nousresearch/hermes-agent)
[![Model](https://img.shields.io/badge/model-Claude%203.5%20Sonnet-orange.svg)](https://anthropic.com)
[![Datastore](https://img.shields.io/badge/datastore-PostgreSQL-blue.svg)](https://www.postgresql.org/)

---

## 🏛 Architecture Overview

```
Telegram "Household" Group (Connor + Wife + Alfred Bot)
        │  text + voice messages
        ▼
[ Intake Handler ]  ➔  raw_messages (Postgres audit log)
        │
        ▼
[ Claude Extraction ]  ➔  Structured Pydantic Task JSON
        │
        ▼
tasks (Postgres)  ──► Telegram Confirmation Card (Buttons: Looks Right / Edit / Not a Task)
        │
        ├──► [ Echo-Loop Proof Todoist Sync ] ➔ Shared "Household" project
        ├──► [ Nightly Digest Job (20:30) ]   ➔ Claude 150-word briefing DM
        ├──► [ Waiting-On Resurfacing Job ]   ➔ 2-day follow-up nudge
        └──► [ Done Handler ]                 ➔ Loop-close status line to group
```

---

## 🌟 Key Specification Features Implemented

1. **Structured Intake & Pydantic Extraction (`services/claude_extractor.py`)**:
   * Parses freeform Telegram/SMS text into validated task schemas.
   * Enforces **$500+ spend & sensitive category approval gates** (`needs_approval=true`).

2. **3-Layer Echo-Loop Prevention (`services/todoist_sync.py`)**:
   * **Layer 1:** Database mapping table lookup by `todoist_task_id`.
   * **Layer 2:** 30-second TTL recent push suppression cache.
   * **Layer 3:** Webhook `X-Todoist-Hmac-SHA256` signature verification.

3. **Email PDF & Image Bill Vision Parser (`services/bill_vision_parser.py`)**:
   * Parses PDF/photo utility bills forwarded to `household@<domain>`.
   * Stores original documents in DigitalOcean Spaces (`source_document_url`).

4. **Nightly 20:30 Digest Briefing (`services/digest_scheduler.py`)**:
   * Produces calm, ranked briefings under 150 words.
   * Identifies 1 quick 10-minute win for the principal.

5. **Hermes Security & Skill Governance (`hermes/skill_governance.py`)**:
   * **AST Code Inspection:** Blocks unreviewed self-generated skills containing `stripe`, `subprocess`, or `amount_cents`.
   * **Skill Registry Pinning:** Requires human hash signatures for any money-touching skills.

---

## 🚦 Quickstart Demo Execution

Run the master specification test suite:

```bash
python3 packages/alfred_household_agent/main.py
```
