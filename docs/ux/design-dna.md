# VowArc Design DNA (v0.1)

**Purpose:** Define the non-negotiable visual/UX principles that keep VowArc calm, premium, and coherent—while supporting witnesshood, voice-first ritual, and high-integrity monetization.

This is not a full design system.  
This is the **Design Constitution**.

---

## 1) Brand Tone in 3 Words

**Calm / Resolute / Integrity**

- **Calm:** reduces cognitive load, supports introspection, avoids stimulation fatigue.
- **Resolute:** conveys discipline and seriousness without aggression.
- **Integrity:** feels honest, transparent, and respectful—especially around money and endings.

---

## 2) Core Emotional Targets (Priority Order)

1. **Safety** (a calm base to fail and return)
2. **Focus** (a private room for reflection)
3. **Dignity** (no shame, no manipulation)
4. **Resolve** (quiet intensity, commitment)
5. **Clarity** (structure, evidence, next step)

---

## 3) Non-Negotiables (Hard Constraints)

### 3.1 No Franken-UI

- One primary visual language only.
- Borrowing is allowed only if it matches the same:  
  **density, saturation range, shape language, and tone**.

### 3.2 No avatar-driven attachment

- Default: **no character/face**.
- Humanization comes from: **voice, language consistency, continuity, and witness transparency**.

### 3.3 No salesy paywalls

- No countdown pressure, discount banners, or “fear of missing out”.
- Monetization must feel like a **contract renewal**, not an upgrade.

### 3.4 No gamified fireworks

- No confetti, no “level-up” dopamine loops.
- Progress is shown as **evidence**, not celebration.

---

## 4) Visual Identity Principles

### 4.1 Color Philosophy

**Low saturation, high control.**

- Use neutral foundations and restrained accents.
- Accents are for meaning, not decoration.

**Required color roles (by function, not by hex):**

- Background (primary)
- Surface (cards, panels)
- Text (primary/secondary)
- Accent (action, highlight)
- Success (evidence of progress)
- Warning (risk/contract breach cues)
- Danger (termination/refund, safety escalation)

**Guidelines**

- Avoid neon, heavy gradients, over-contrast.
- Dark Mode must feel _premium_, not “gamer”.
- Warning/Danger should be **rare** and deliberate.

### 4.2 Typography Philosophy

**Quiet authority.**

- Prefer type that feels modern, legible, and neutral.
- Hierarchy must be obvious with minimal styling.

**Rules**

- Short line lengths on key ritual screens (especially Day 21).
- Use weight and spacing more than color to express hierarchy.
- Avoid overly playful fonts; avoid “corporate sterile” extremes.

### 4.3 Spacing & Density

**Breathing room is part of the product.**

- Default density: **sparse to balanced**.
- Chat/log areas can be denser, but never noisy.

**Rules**

- White space is a feature; do not fill it “for efficiency”.
- Max 1 primary CTA per screen in ritual flows.

### 4.4 Shape Language & Materials

**Soft edges, firm structure.**

- Consistent radius scale.
- Minimal shadows; no heavy skeuomorphism.
- Surfaces should feel tactile but not glossy.

---

## 5) Motion & Haptics (Craft = Trust)

### 5.1 Motion Principles

**Slow is premium (when intentional).**

- Motion must explain state changes: recording → processing → ready.
- Avoid “bouncy” playful animations.

**Must-have motion moments**

- Voice recording start/stop (subtle expansion + haptic)
- “Thinking / summarizing” states (calm, readable)
- Day 21 section transitions (gentle, ceremonial)

### 5.2 Haptics

- Use haptics as punctuation, not noise.
- Required: record start/stop, contract signature confirm.
- Forbidden: repeated celebratory pings.

---

## 6) UX Archetypes (How VowArc should feel)

### 6.1 “Private Room” UX

- Minimal navigation chrome during voice sessions.
- Visuals are abstract: waveform, light, quiet gradients, typographic cards.
- The user should feel: “This is my space.”

### 6.2 “Witness Transparency” UX

- When the AI references memory:
  - Show a small **Witness tag**.
  - Provide a tappable source snippet (what it’s referencing).
- The user should feel: “I’m not being watched. I’m being understood.”

### 6.3 “Contract UX”

- Vow and commitment are treated like a contract:
  - clear language
  - explicit consent
  - visible terms (minimum commitment, tough-love preference)
- Signature is a ritual moment (no clutter, no marketing).

---

## 7) Key Screen Visual Standards (MVP)

### 7.1 Home

**Goal:** clarity + calm resolve.

- Show: North Star (Meaning Statement), today’s smallest commitment, evidence snippet.
- One primary action. Secondary actions behind a calm drawer.

### 7.2 Voice Session (Daily Ritual)

**Goal:** immersion + safety.

- Full-screen waveform / minimal text.
- Subtle captioning of key phrases (optional).
- One obvious control: record / stop.
- Silence is allowed; do not “fill space” with UI.

### 7.3 Day 21 Commitment Ceremony

**Goal:** dignity + evidence + choice.

- Scrollable ceremony with section breaks.
- Evidence cards feel archival, not promotional.
- Probability & conditions are shown with humility (disclaimer).
- Consent to rigor is explicit and calm.
- Decision area presents options without pressure.

---

## 8) Anti-Patterns (Do Not Ship)

- “Cute companion” UI that reduces seriousness
- Overly moralistic red warnings everywhere
- Dense, feature-stuffed home screen
- Paywalls that look like ads
- Memory that feels like surveillance (“we tracked you”)
- Shame-based copy or aggressive prompts

---

## 9) Accessibility & Global Readiness

- High readability in both EN/JA (avoid tight line heights).
- Support one-handed use and night use.
- Avoid culture-bound metaphors in UI labels; keep them in Manifesto, not in core UI text.

---

## 10) Definition of Done (Design QA Checklist)

A screen is “VowArc-quality” only if:

- it matches the calm/resolute/integrity tone
- it has a single clear purpose and primary action
- it avoids marketing visual patterns
- witness references are transparent
- motion is subtle and state-explanatory
- it remains coherent in Dark Mode
