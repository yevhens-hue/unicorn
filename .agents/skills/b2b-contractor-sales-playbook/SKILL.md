---
name: b2b-contractor-sales-playbook
description: B2B Contractor Sales & AI Voice Booker Objection Handling Engine. Resolves common B2B objection types ("Is this free?", "What is PPA?", "How do slots work?") with structured AI counter-arguments, unit economics ROI math, and deposit CTAs.
---

# B2B Contractor Sales & AI Voice Booker Objection Handling Engine

When pitching B2B contractors, home service pros, or SMBs, automated voice bookers and AI sales agents encounter predictable objections regarding pricing, risk, and lead quality.

This skill provides a structured objection handling engine and ROI calculation model to convert skeptical B2B leads.

---

## Objection Matrix & Counter-Argument Strategy

```
  Contractor Objection Received (Voice Call / Web Chat / Telegram)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  ["IS_THIS_FREE?"]       ["WHAT_IS_PPA?"]       ["NO_MONTHLY_FEE?"]
        │                       │                       │
        ▼                       ▼                       ▼
  "No retainer. You       "Pay-Per-Appointment:   "Zero monthly fees.
   only pay $150 per       You only pay when a     You only purchase
   confirmed home          qualified lead is       appointment slots
   inspection slot."       booked in your ZIP."    with zero risk."
```

---

## Reference Implementation (`AgentController.js`)

```javascript
class B2bObjectionHandlerService {
  constructor() {
    this.OBJECTION_RESPONSES = {
      'IS_THIS_FREE': {
        objection: "Is this service free to try?",
        response: "Unicorn Pro has zero monthly retainers. You only pay $150 PPA per confirmed, exclusive home inspection appointment booked directly into your Google Calendar.",
        cta: "Deposit $300 to unlock your first 2 Dallas ZIP 75001 contractor slots.",
        roiMath: "Average roof job = $12,500 revenue. $150 PPA cost yields an 83.3x ROI."
      },
      'WHAT_IS_PPA': {
        objection: "How does Pay-Per-Appointment (PPA) work vs CPL?",
        response: "Traditional CPL forces you to pay $25-$50 per shared, unqualified lead. PPA guarantees an exclusive, verified appointment with a homeowner who requested a roof inspection.",
        cta: "Lock 5 exclusive slots for this week.",
        roiMath: "15 booked PPA appointments @ 40% close rate = 6 closed jobs ($75,000 revenue)."
      },
      'NO_SLOTS_AVAILABLE': {
        objection: "What if there are no slots in my ZIP code?",
        response: "We reserve slots dynamically based on contractor availability. If your ZIP is capped, you can join the priority waiting list.",
        cta: "Join ZIP 75001 Priority Slot Queue."
      }
    };
  }

  handleObjection(objectionKey) {
    const data = this.OBJECTION_RESPONSES[objectionKey] || this.OBJECTION_RESPONSES['IS_THIS_FREE'];
    return {
      timestamp: new Date().toISOString(),
      status: 'OBJECTION_RESOLVED',
      objection: data.objection,
      aiCounterArgument: data.response,
      roiMath: data.roiMath,
      callToAction: data.cta
    };
  }
}

module.exports = new B2bObjectionHandlerService();
```

---

## Use Cases
- AI Voice Booker agents (Retell AI, Bland AI, Vapi, Twilio Voice).
- B2B contractor onboarding & sales landing page chatbots.
- Contractor acquisition campaigns for home services marketplaces.
