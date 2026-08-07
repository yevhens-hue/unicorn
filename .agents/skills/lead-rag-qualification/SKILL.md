---
name: lead-rag-qualification
description: RAG Lead Qualification & Contractor Tag Matching Pattern. Matches property specifications (roof material, sqft, storm history) against local municipal building codes (TEXAS_IRBC_2024_HAIL) and contractor certification tags (CLASS_4_IMPACT_CERTIFIED_ROOFER).
---

# RAG Lead Qualification & Contractor Matching Pattern

In high-value service marketplaces (roofing, solar, HVAC, legal, real estate), matching raw lead attributes with localized building codes and contractor certifications increases lead conversion and eliminates invalid claims.

This skill provides a RAG (Retrieval-Augmented Generation) pipeline for lead enrichment and contractor qualification.

---

## 4-Step RAG Pipeline

```
  Raw Lead Data (Address, Roof Material, Square Footage, Storm History)
                               │
       [1. Vector RAG Retrieval: Local Municipal Building Codes]
       (Fetch: TEXAS_IRBC_2024_HAIL Code & Underlayment Standards)
                               │
       [2. Risk & Impact Scoring Engine]
       (Compute RAG Quality Score: 95/100, Class 4 Impact Eligible)
                               │
       [3. Certified Contractor Tag Matching]
       (Filter Contractors with: CLASS_4_IMPACT_CERTIFIED_ROOFER)
                               │
       [4. PPA Slot Assignment & Lead Dispatch]
```

---

## Python Reference Implementation

```python
class LeadRagQualificationSubagent:
    def __init__(self):
        # Simulated RAG Knowledge Base of Local Municipal Codes
        self.RAG_CODE_DATABASE = {
            "75001": {
                "code_id": "TEXAS_IRBC_2024_HAIL",
                "min_roof_pitch": "4:12",
                "hail_resistance_standard": "UL 2218 Class 4 Impact",
                "required_contractor_tag": "CLASS_4_IMPACT_CERTIFIED_ROOFER",
                "permitted_underlayment": "Synthetic High-Temp Self-Adhered"
            }
        }

    def qualify_lead(self, lead_data: dict) -> dict:
        zip_code = lead_data.get('zip_code', '75001')
        roof_material = lead_data.get('roof_material', 'Architectural Shingles')
        sqft = lead_data.get('square_footage', 2400)
        storm_history = lead_data.get('storm_history_hail', True)

        building_code = self.RAG_CODE_DATABASE.get(zip_code, self.RAG_CODE_DATABASE["75001"])

        # Compute RAG Lead Quality Score
        rag_score = 70
        matched_tags = []

        if storm_history:
            rag_score += 15
        if sqft > 2000:
            rag_score += 10
        if "Shingles" in roof_material or "Tile" in roof_material:
            matched_tags.append(building_code["required_contractor_tag"])

        return {
            "lead_id": lead_data.get('lead_id'),
            "rag_score": min(rag_score, 100),
            "building_code": building_code["code_id"],
            "required_contractor_tags": matched_tags,
            "status": "QUALIFIED" if rag_score >= 80 else "NEEDS_REVIEW"
        }
```

---

## Use Cases
- Roofing, solar, and home service marketplaces.
- Legal & insurance claim lead qualification.
- B2B lead enrichment pipelines requiring regulatory code compliance.
