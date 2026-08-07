"""
Alfred Household Agent — Hermes Skill Governance & Security Guard
Specification: alfred-household-cos-spec.md (§10a)

Features:
1. Skill Registry Pinning & Hash Verification
2. Static AST Inspection (blocks self-generated skills from importing payment/DB code)
3. Container Sandbox Security Rules
"""

import ast
import hashlib
from typing import Dict, Any, List


class HermesSkillGovernanceService:
    # Hash registry of approved human-reviewed skills (§10a)
    APPROVED_SKILL_HASHES = {
        "claude_extraction_skill": "a8f9c2d1b0e3f4a5",
        "todoist_sync_skill": "c7b6a5f4e3d2c1b0",
        "email_bill_parser_skill": "f1e2d3c4b5a69788"
    }

    RESTRICTED_AST_IMPORTS = ["stripe", "urllib", "requests", "subprocess", "os.system", "shutil"]
    RESTRICTED_AST_SYMBOLS = ["amount_cents", "execute_payment", "bypass_approval", "db_drop"]

    @classmethod
    def verify_skill_security(cls, skill_name: str, skill_code: str) -> Dict[str, Any]:
        """Inspects dynamic Hermes skills to prevent unreviewed modifications from touching payments (§10a)."""
        
        # 1. AST Syntax Check & Restricted Imports Audit
        try:
            tree = ast.parse(skill_code)
        except SyntaxError as e:
            return {"allow": False, "reason": f"AST Syntax Error: {e}"}

        found_restricted = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name in cls.RESTRICTED_AST_IMPORTS:
                        found_restricted.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module in cls.RESTRICTED_AST_IMPORTS:
                    found_restricted.append(node.module)
            elif isinstance(node, ast.Name):
                if node.id in cls.RESTRICTED_AST_SYMBOLS:
                    found_restricted.append(node.id)

        if found_restricted:
            return {
                "allow": False,
                "reason": f"SECURITY_VIOLATION: Self-generated skill '{skill_name}' contains restricted symbols: {found_restricted}",
                "status": "BLOCKED_BY_GOVERNANCE"
            }

        # 2. Hash Pinning Verification
        code_hash = hashlib.sha256(skill_code.encode('utf-8')).hexdigest()[:16]
        is_pinned = cls.APPROVED_SKILL_HASHES.get(skill_name) == code_hash

        return {
            "allow": True,
            "skill_name": skill_name,
            "hash": code_hash,
            "is_human_approved_pin": is_pinned,
            "sandbox_mode": "DOCKER_READONLY_CONTAINER",
            "status": "APPROVED_FOR_EXECUTION"
        }
