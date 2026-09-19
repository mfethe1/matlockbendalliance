# Matlock Bend Alliance Scrollcraft Requirements

## Purpose

This document is the implementation contract for the next Matlock Bend Alliance web experience. It translates the supplied screen recording, its transcript, the current repository, and Nate Herk's Scrollcraft guidance into requirements an implementation agent can execute and verify.

The intended result is a readable, evidence-led civic story. The page may be cinematic, but motion must clarify the public record rather than hide it.

## Source of truth

- Screen recording: `/Users/michaelfethe/Desktop/Screen Recording 2026-09-18 at 9.05.31 PM.mov`
- Transcript: [screen-recording-transcript.md](../notes/screen-recording-transcript.md)
- Design brief: [BRIEF.md](../scrollcraft/builds/matlock-bend-alliance/BRIEF.md)
- Visual reference: [recording-contact-sheet.jpg](assets/recording-contact-sheet.jpg)
- Current page: [index.html](../index.html)
- Scrollcraft skill: `.agents/skills/scroll-craft/plugins/nateherk-design/skills/scroll-craft/SKILL.md`

The transcript is machine-generated and not fact-checked. Do not turn uncertain transcript wording into new factual claims. Use the repository's verified document links and labels for public-facing evidence.

## Product outcome

By the end of the page, a visitor should be able to:

1. See the landfill, nearby subdivisions, Tennessee National Drive, and the Tennessee River without guessing.
2. Understand why the July inspection record matters.
3. Open the underlying public records.
4. Choose one concrete next action: attend a meeting, file a public-records request, or submit written public comment.

## Experience grammar

Use a **chaptered editorial** structure, not a continuous dark video flight.

The page should feel like a readable investigation with distinct chapter changes, a folio-style position marker, and enough dwell for each claim. The implementation may use Scrollcraft devices, but it must not repeat the same visual treatment in every chapter.

### Required chapter sequence

| Chapter | Visitor learns | Visual behavior | Required feeling |
| --- | --- | --- | --- |
| 1. Title plate | What place and issue this is | Calm paper/title surface; no unreadable media behind the headline | Curiosity |
| 2. Map orientation | What is next to the landfill | Map reveals explicit bounds, route, river, and legend | Unease then clarity |
| 3. Inspection evidence | What the July inspection documented | Centered, high-contrast evidence plate with a long reading dwell | Weight |
| 4. Record and accountability | How the record connects to decision-makers | Centered document spread with real source links | Resolve |
| 5. Take action | What the visitor can do next | Compact action ledger with working controls | Agency |

## Visual requirements

### Global visual language

- Keep the investigative tone: charcoal, warm paper, muted sage, safety orange, river blue, and action red.
- Reduce full-page black overlays. The map and evidence imagery must retain enough detail to inspect.
- Use large editorial type for chapter statements, but keep body copy and source labels comfortable to read.
- Use monospaced labels only for metadata, folios, map legends, and document identifiers.
- Do not use invented statistics, fake testimonials, fabricated map geometry, or implied government endorsement.
- Do not let animation be the only way to access meaning. Reduced-motion and static states must retain the full story.

### Opening map layer contract

The map is the signature visual. It must be composed as separate meaningful layers:

| Layer | Visual cue | Acceptance condition |
| --- | --- | --- |
| Far map plate | Aerial/terrain context | Full geographic context remains visible on desktop and mobile |
| Landfill boundary | Orange or warm outline/bounding box | Clearly labeled and visible without hover |
| Subdivision mesh | Orange mesh or parcel overlay | Visibly distinct from the landfill boundary |
| Tennessee National Drive | Blue route line | Labeled in the legend and not confused with the river |
| Tennessee River | Blue band or line along the west side | Labeled in the legend and visually distinct from the road |
| Annotation labels | Leader lines, boxes, or pins | Labels identify the feature they point to; color is not the only cue |
| Chapter copy | Cream or dark ink on a stable plate | Headline meets readable contrast in every sampled state |

### Evidence imagery

- Center the strongest inspection/document composition where that improves reading.
- Give the July inspection chapter enough scroll room to read the claim and source label.
- Use real repository PDFs or document crops when available; label them as records, not as decorative texture.
- Keep document captions, dates, and source links attached to the image they describe.
- Avoid transitions that flash past before the visitor can identify what changed.

### Action surface

The action chapter must provide three visible, working paths:

1. **Attend the next commission meeting** — links to the current schedule or clearly states that the date must be verified.
2. **File a public-records request** — opens the generator or a reliable copyable request flow; no dead link.
3. **Submit written public comment** — provides a visible recipient/context and either opens the user's default mail client through `mailto:` or offers a copyable form when no mail client is available. Never claim that an email was sent unless a real integration confirms delivery.

## Interaction requirements

- Scroll position must advance a meaningful visual state in each animated chapter.
- Use at least four distinct Scrollcraft device families/behaviors across the page; do not repeat the same treatment in adjacent chapters.
- Do not use a fast-changing numeric counter as decoration. If a folio is retained, it must identify the current chapter clearly and change at a readable pace.
- Keep navigation and action links keyboard reachable.
- Preserve the full document/source link destinations in the UI.
- Ensure internal anchor navigation accounts for any sticky header offset.
- Any control that copies text must visibly confirm what was copied without falsely submitting anything.

## Responsive requirements

### Desktop

- Map context, annotations, legend, and chapter copy can be seen together without the map being swallowed by a scrim.
- Evidence documents remain centered and readable at common laptop widths.
- Chapter transitions have enough dwell to understand the change.

### Mobile

- Recompose the map rather than shrinking the desktop composition.
- Keep the landfill, subdivision cue, road, river, and labels reachable without horizontal overflow.
- Keep tap targets comfortably operable.
- Ensure the chapter title and action labels do not wrap into unreadable stacks.
- Do not assume a phone can decode or scrub video the same way as desktop. A poster/static state must carry the content.

### Reduced motion

- Do not fetch or depend on scroll-scrub video for comprehension.
- Keep all map overlays, labels, evidence text, source links, and action controls visible/reachable.
- Replace staged reveals with stable, readable composition.
- Confirm the action surface still works with animation disabled.

## Content and evidence rules

- Preserve uncertainty from the source material. Do not upgrade “appears,” “may,” or “under review” into certainty without a verified source.
- Every public-record claim needs a visible source label and a working destination.
- Keep dates, permit numbers, agencies, and named parties consistent with the current repository and the linked source document.
- Clearly distinguish the community watchdog from Loudon County government, Republic Services, and TDEC.
- Do not publish the machine transcript as public-facing copy without a fact-check pass.

## Acceptance checklist

### P0 Must pass

- [ ] First viewport has a complete readable headline and clear next action.
- [ ] Full map context is visible; the dark treatment does not obscure it.
- [ ] Landfill, subdivision mesh, Tennessee National Drive, and Tennessee River are explicitly called out.
- [ ] July inspection evidence is centered, readable, and given adequate dwell.
- [ ] Chapter 5 transition is slow enough to understand.
- [ ] Public-records request path works.
- [ ] Public-comment path works or offers an honest copyable fallback.
- [ ] All source/document links resolve to the intended records.
- [ ] Reduced-motion mode preserves the complete story and all actions.
- [ ] Mobile layout has no horizontal overflow and retains the map labels and actions.

### P1 Should pass

- [ ] Chapter position marker is slow, clear, and meaningful.
- [ ] Map annotations use both labels and visual forms, not color alone.
- [ ] Evidence captions remain attached to their corresponding document image.
- [ ] Keyboard focus order follows the visual reading order.
- [ ] Copy-to-clipboard actions confirm completion without a misleading success state.

## Verification evidence required from the implementation agent

The agent must provide:

1. Desktop screenshots of the opening, map midpoint, evidence chapter, action chapter, and final state.
2. Mobile screenshots at approximately 390 × 844 and a compact 360 × 640 viewport.
3. Reduced-motion screenshots showing that the content remains complete without animation.
4. A link/control test result for every action and source link.
5. A console/request check showing no failed local assets or broken imports.
6. A short note identifying any unresolved external integration, such as email delivery or live meeting data.

## Visual review cues

Use [recording-contact-sheet.jpg](assets/recording-contact-sheet.jpg) while reviewing the build:

- **Top row:** title/map mood; check whether the map remains visible instead of disappearing into black.
- **Middle row:** map callout and inspector evidence; check explicit geography and centered reading surfaces.
- **Bottom row:** action chapter; check transition pacing, readable action labels, and working public-records/comment flows.

The target experience is not a darker version of the recording. It is the same seriousness with clearer geography, stronger evidence hierarchy, and more reliable civic actions.
