"""
Alfred Household Agent — Bill Vision & Attachment Parser Service
Specification: alfred-household-cos-spec.md (§3b)

Parses PDF and Image bills forwarded to household@ command center:
- Uses Claude Vision to read PDF/photo utility bills
- Extracts Vendor, Amount, Due Date, and Payment Links
- Uploads original file to DO Spaces & attaches source_document_url
- Automatically sets needs_approval=True per §7 thresholds
"""

import json
from typing import Dict, Any, Optional


class BillVisionParserService:
    @staticmethod
    def parse_bill_attachment(file_name: str, file_bytes_size: int, sender_email: str) -> Dict[str, Any]:
        """Simulates Claude 3.5 Sonnet / Vision OCR analysis on bill PDF/photo (§3b)."""
        
        # Security Allow-List Check (§3b)
        allowed_senders = ["connor@household.com", "wife@household.com", "connor@fundops.com"]
        if sender_email.lower() not in allowed_senders:
            return {
                "success": False,
                "reason": f"SECURITY_BLOCK: Sender {sender_email} not in household envelope allow-list.",
                "task": None
            }

        # Mock DigitalOcean Spaces Storage
        source_doc_url = f"https://alfred-household.sfo3.digitaloceanspaces.com/bills/2026_08_{file_name}"

        # Simulated Claude Vision Extraction
        extracted_data = {
            "is_bill": True,
            "vendor": "Austin Energy",
            "amount_cents": 31200,  # $312.00
            "due_date": "2026-08-15",
            "payment_link": "https://austinenergy.com/pay/inv_9921",
            "source_document_url": source_doc_url,
            "needs_approval": True,  # $300+ bill threshold
            "confidence": 0.99
        }

        # Telegram Ack Message
        telegram_ack = (
            f"📨 **Captured Bill from Email ({sender_email}):**\n"
            f"• **Vendor:** `{extracted_data['vendor']}`\n"
            f"• **Amount:** `${(extracted_data['amount_cents']/100):,.2f}` | **Due:** `{extracted_data['due_date']}`\n"
            f"• 📎 [View Original Document]({source_doc_url})\n"
            f"• 🚨 `needs_approval=True` (Requires Connor One-Tap Sign-off)"
        )

        return {
            "success": True,
            "task": extracted_data,
            "telegram_ack": telegram_ack
        }
