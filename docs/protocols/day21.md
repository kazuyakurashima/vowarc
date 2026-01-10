# Day 21 Protocol: The Commitment Ceremony

Day 21 is not a paywall.
It is a ceremony.

VowArc treats the end of the 21-day initiation as a **judgment moment**:
a structured review of evidence, alignment, and fit—followed by a voluntary renewal of contract.

This document defines the **UX requirements**, **AI generation requirements**, and **decision protocol** for Day 21.

---

## 1) Purpose

### 1.1 What Day 21 must accomplish

By the end of Day 21, the user should feel:

1. **Seen**: “My effort and struggle have been witnessed with continuity.”
2. **Grounded**: “My vow is clearer than it was on Day 0.”
3. **Honest**: “I know what is working, what is not, and why.”
4. **Free but serious**: “Continuing is my choice—but it’s a real contract.”
5. **Safe**: “If we end, I will not be shamed. If we continue, I will be held to my vow.”

### 1.2 What Day 21 must avoid

- A typical “upgrade now” funnel
- Fear-based manipulation
- Love-bombing / dependency cues
- Surveillance vibe (“we watched you”)
- Shame / humiliation framing

---

## 2) Relationship Evolution Model (Visualization Requirement)

Day 21 must visually and narratively show the evolution of the user–AI relationship.

### 2.1 Phases (canonical)

- **Phase 0 (Day 0): Initiation / Psychological Contract**
- **Phase 1 (Days 1–21): Safe Base + Rhythm + Evidence**
- **Phase 2 (Weeks 4–8): Peer Partnership + Discipline**
- **Phase 3 (Weeks 9–12): Results Sprint + High-Rigor Mirror**
- **End: Integrity Close (completion or termination with dignity)**

### 2.2 The “Judgment Moment”

Day 21 is the hinge:

- If the user renews, the tone shifts from **compassion-first** to **compassion + rigor**.
- If the user declines, the app closes with **honor**, not persuasion.

**UX requirement:** a simple timeline/arc visualization that places Day 21 as the pivot.

---

## 3) Ceremony UX: Screen Structure (MVP)

Day 21 is implemented as a guided, scrollable ceremony with 6 sections:

1. **Opening** (tone setting)
2. **Evidence** (what became true)
3. **Resonance** (vow crystallization)
4. **Trajectory** (probability + conditions)
5. **Tough Love Preview** (consent to rigor)
6. **Decision** (renew / pause / end)

Each section must support:

- **Voice-first narration** (optional but recommended)
- **Calm reading mode** (text-only, minimal UI)

---

## 4) Required AI-Generated Content (Must-Haves)

Day 21 must include the following AI-generated items (with references to memory nodes or logs).

### 4.1 Evidence Pack (Evidences)

- “Artifacts you created” (links, images, notes, submitted outputs)
- “Consistency markers” (check-ins completed, streaks, routines)
- “Process metrics” (small wins: If-Then activations, temptation wins, recovery count)

**Copy requirement:** evidence must be described as **proof**, not praise.

### 4.2 “Recovery Count”

A mandatory sentence like:

- “You were close to giving up, and you returned **4 times**.”

Definition:

- A “return” occurs when the user resumes the ritual after a break or after a logged obstacle.

### 4.3 Vow Crystallization (3 lines)

A mandatory block:

- “Your vow used to be vague. Now it crystallizes into these three lines:”
  1. Meaning Statement (North Star)
  2. Vow (promise)
  3. Contribution Bridge (optional but recommended)

### 4.4 The AI’s view of potential (Non-flattering, concrete)

A paragraph that states:

- observed strengths
- observed anti-patterns
- observed leverage points

**Constraint:** must be grounded in evidence; no vague compliments.

### 4.5 Trajectory & Probability (with disclaimers)

A line like:

- “Given your last 21 days of behavior, your probability of hitting [target metric] in the next 9 weeks is **~85%**, **if** the following conditions hold…”

Requirements:

- show 2–4 conditions (e.g., minimum weekly commitment, sleep boundaries, If-Then adherence)
- include disclaimer: estimates are probabilistic and adjustable

### 4.6 Tough Love Preview + Consent

A required prompt:

- “If your [escape pattern] returns, your outcome will be at risk. In the paid period, may I point this out rigorously?”

Must provide choices:

- “Yes, be rigorous.”
- “Yes, but gently.”
- “No, I prefer soft redirection only.” _(allowed but may reduce fit score)_

---

## 5) Witness Function: Contradiction & Continuity Prompt Requirements

To maximize “witness” value without becoming surveillance, Day 21—and daily coaching—must include:

### 5.1 Gentle contradiction spotting (must)

The AI must sometimes reference past statements to surface misalignment:

Example pattern:

- “Three nights ago you said: ‘I’m tired, but tomorrow morning I will do it.’  
  Today you said: ‘I don’t have time.’  
  How do you want to reconcile today’s words with the vow you made then?”

Constraints:

- tone: calm, non-accusatory
- aim: restore agency, not “catch” the user
- always followed by: “What is the smallest honest commitment now?”

### 5.2 “Continuity” UI cue (should)

Whenever the AI references a past statement, the UI should show:

- a small “witness” tag
- a tappable source snippet (from memory node / summary) for transparency

---

## 6) Fit Decision Protocol (MVP)

Day 21 must compute and display a **Fit Result**. Not as a gate to exclude, but as an honest assessment.

### 6.1 Fit Signals (inputs)

- Ritual adherence (check-in frequency)
- Evidence density (artifacts, submissions)
- Recovery behavior (returns after breaks)
- Alignment clarity (vow crystallization completeness)
- Consent to rigor (tough love preference)

### 6.2 Fit Output (3 outcomes)

1. **Proceed (Recommended)**
2. **Proceed with Renegotiation** (adjust goal, redefine minimum commitment)
3. **Do not proceed** (pause/end recommended)

**UX requirement:** show “why” in 3 bullet points; never label the user as inadequate.

---

## 7) Decision Options & Outcomes (UX + Policy)

### 7.1 User chooses “Renew Contract”

- Confirm plan: goal, minimum weekly commitment, obstacle + If-Then set
- Require **digital re-signature**
- Show the “Tone Shift” message:
  - “From tomorrow, I will protect your vow with more rigor—while keeping compassion.”

### 7.2 User chooses “Pause / Not now”

- Offer a “Pause Protocol”:
  - export vow + evidence summary
  - set a return date reminder (optional)
  - provide a minimal self-checklist

### 7.3 System recommends termination (Integrity Close)

If fit is low or contract violations are likely:

- The message must be **high-integrity**, not rejecting.
- Offer **termination with refund** if applicable.
- Provide an “Exit Summary” (what was learned, what worked, what to try next).

**Writing requirement (Integrity Close):**
The key line should be similar in spirit to:

> “Because I believe in your potential, continuing a lukewarm relationship would be an insult to your vow.
> I would rather end with honesty than keep you comfortable and unchanged.”

Constraints:

- Never blame.
- Never shame.
- Never imply the user is unworthy.

---

## 8) UI & Tone Requirements (Design-compatible)

Even though this is a protocol doc, Day 21 has strict visual tone requirements:

- Calm, premium, minimal
- High whitespace
- No discount banners, no countdown pressure
- Ritual typography (clear hierarchy, short lines)
- Motion: slow, intentional (no gamified fireworks)

---

## 9) Acceptance Criteria (Definition of Done)

Day 21 implementation is “done” when:

- All required AI-generated blocks exist (Section 4)
- Tough Love consent is captured and stored as a coaching preference
- Evidence Pack is transparent and sourced (tappable references)
- Fit Result shows “why” and offers appropriate next steps
- Integrity Close text meets requirements (Section 7.3)
- The entire experience can be completed via voice or calm reading mode
