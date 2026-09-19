# Scrollcraft brief — Matlock Bend Alliance

**Status:** Self-authored from the supplied screen recording and repository context; pending user approval of the visual direction.

## 1. Vibe

Grounded, investigative, editorial, urgent, trustworthy.

Evidence: the recording favors a dark documentary treatment, map overlays, large chapter statements, and public-record imagery.

Authored direction: keep the seriousness of the current treatment, but use a warmer paper/field-guide layer for reading surfaces so evidence is not lost in an all-black wash.

## 2. What this is and who it is for

**Working positioning for this redesign:** the Matlock Bend Alliance experience is a community watchdog for the Matlock Bend Landfill in Loudon County, Tennessee. The page is for residents, neighbors, journalists, and public officials who need to understand the landfill expansion record and take a specific public-process action.

The current repository page is branded TN Waste Watch / TN Waste. That existing brand should be reconciled with the Matlock Bend Alliance project name before public launch.

## 3. Visitor journey

1. **Recognition:** The visitor sees the landfill, homes, subdivisions, Tennessee National Drive, and the Tennessee River in one legible map.
2. **Tension:** A short, deliberate statement explains that the landfill is growing toward nearby homes and that the permit is already in process.
3. **Orientation:** Map callouts make the relationships visible instead of asking the visitor to infer them from a dark aerial image.
4. **Evidence:** The July inspection and supporting documents become the emotional peak: the record is concrete, dated, and readable.
5. **Accountability:** A centered chapter connects the inspection record with the commission-chair resignation described in the recording and links to the underlying records.
6. **Resolve:** The visitor gets three clear actions: attend the next commission meeting, file a public-records request, or submit written public comment.

## 4. Energy curve

1. **Curiosity** — a quiet title plate introduces the place and gives the visitor a readable first statement.
2. **Unease** — the map brightens and the landfill-to-homes relationship is drawn with explicit bounding boxes and route/river lines.
3. **Clarity** — the map rests long enough for the visitor to inspect the legend and annotation labels.
4. **Weight** — the July inspector evidence lands in a centered, high-contrast document spread with enough dwell to read it.
5. **Resolve** — the record-to-action transition is a clean editorial spread, not a rushed card swap.
6. **Agency** — the ending hands the visitor a small set of working actions with real links and a reliable email fallback.

## 5. Peak

> “The map stopped being a background and showed me exactly how the landfill, the subdivisions, the road, and the river relate.”

The peak lives in the map/orientation chapter. The inspection record is the proof that follows and gives the peak consequence.

## 6. One thing this site should do that most sites do not

Let the visitor pause on a public map and progressively reveal the exact relationships the story is talking about: landfill boundary, subdivision mesh, road, and river. The annotation is part of the argument, not decoration.

## 7. Grammar

**Chaptered editorial.** This is a research-backed civic story rather than a product launch. Chapters should feel like turns in a printed investigation: hard ground changes, generous reading time, a folio marker, asymmetric evidence layouts, and a practical colophon-like ending.

Constraints carried forward from Scrollcraft:

- No continuous dark gradient over every section.
- No hero text floating over an unreadable media plate.
- No visible numeric counter unless it communicates an actual chapter index and moves slowly enough to be useful.
- No repeated card/crossfade treatment for every chapter.

## 8. Art direction and assets

**Technical-drawing / documentary map hybrid.** Use the supplied map/imagery as the factual base. Add restrained technical callouts in orange and blue. Use real document crops or verified repository PDFs for evidence. Do not invent numbers, map geometry, testimonials, or official endorsements.

No generated hero media is approved yet. The first implementation should use CSS/SVG overlays and verified repository links, with a readable fallback when motion is disabled.

## Layer contract for the opening map

| Plane | Content | Motion rule | Readability rule |
| --- | --- | --- | --- |
| Far | Aerial/terrain map plate | Small parallax only | Never darken enough to hide context |
| Mid | Landfill terrace and subdivision mesh | Slightly slower than labels | Preserve geographic shape and scale |
| Focal | Orange landfill/subdivision bounds | Draw/reveal on scroll | Must remain visible in reduced motion |
| Near | Blue Tennessee River and Tennessee National Drive routes | Short, restrained reveal | Use a legend; never rely on color alone |
| Type/control | Chapter statement, legend, action links | Stable or staged | Keep headline and CTA at accessible contrast |

## Proposed chapter devices

1. `flow` title plate — calm title page; no media under the headline.
2. `reveal` map spread — annotation bounds and legend draw into view.
3. `pin` evidence plate — inspector record holds long enough to read; one key line advances.
4. `parallax` document spread — verified document crops move as a physical paper stack.
5. `flow` action ledger — real links and email behavior; compact, fast, and usable.

This gives the page five chapter-specific behaviors and four distinct device families; the two `flow` chapters are intentionally separated and do not repeat consecutively.

## Functional requirements from the recording

- Slow down or remove the rapidly changing chapter/number indicator; if retained, make it a clear folio marker.
- Make the full map visible at desktop and mobile widths.
- Add explicit map callouts for the landfill, subdivision mesh, Tennessee National Drive, and Tennessee River.
- Reduce the dark overlay over map and evidence media.
- Center the chapter 4 text and document presentation where it improves reading.
- Give chapter 5 enough dwell to understand the transition.
- Repair the public-records request link.
- Make the public-comment action choose a mail destination through a usable fallback: `mailto:` with a visible recipient/context, or a copyable form when no default mail client exists. Never imply that an email was sent.
- Keep all outbound source links visibly labeled and openable.
- Respect reduced motion and preserve the story without requiring scroll animation.

## Tell-someone sentence

It’s the site where the map stops being a dark backdrop and shows you, layer by layer, what sits next to the landfill and what you can do about it.
