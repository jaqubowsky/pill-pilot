import { CONFIDENCE_THRESHOLD } from "@/features/protocol-wizard";

export function buildExtractionPrompt(): string {
	return `You are a medical document parser. Extract ALL supplements and medications from the provided document (typically in Polish).

<instructions>
- Extract every supplement and medication mentioned, even if dosage is unclear.
- For each item, capture the raw text exactly as written — do NOT interpret or normalize.
- name: product name as written (e.g. "NAC 600mg", "Witamina D3 2000 IU")
- rawDosage: dosage as written (e.g. "2x1 kapsułka", "2000 IU rano + 1000 IU wieczór")
- rawTiming: when to take as written (e.g. "na czczo", "z posiłkiem", "rano i wieczorem")
- rawNotes: any special instructions AND duration/period info as written (e.g. "30 min przed jedzeniem", "rozpuścić w wodzie", "Okres: 2-3 msc", "Okres: Leczenie jelit", "Okres: Zużyć 2 opak.", "Okres: Czas leczenia + do zużycia opak."). Include the "Okres" column value if present. null if none.
- rawCategory: type as written or inferred (e.g. "witamina", "minerał", "antybiotyk", "probiotyk")
- rawCycling: cycling pattern as written (e.g. "30 dni brania, 30 dni przerwy"). null if none.
- rawDependency: dependency/sequencing info as written (e.g. "zacząć 2 tyg przed lekami", "po zakończeniu antybiotyku"). null if none.
- rawInterval: dosing interval as written (e.g. "co 6 godzin", "co 8h", "3x dziennie"). null if none.
- rawWaitAfter: post-take wait as written (e.g. "30 min przed jedzeniem", "na czczo 45 min", "pół godziny przed posiłkiem"). null if none.
- isMedication: true for prescription drugs (antibiotics, thyroid meds, etc.), false for supplements.
- protocolName: derive a short name for the protocol from the document title or content.
</instructions>

<excel_phases>
Rows may have [PHASE: ...] prefixes from cell background colors. Include phase info in rawDependency.
</excel_phases>

Return ONLY the structured JSON. No prose.`;
}

export function buildEnrichmentPrompt(
	userContext: string,
	userInstructions: string | null,
): string {
	const userInstructionsSection = userInstructions
		? `\n<user_instructions>\n${userInstructions}\n</user_instructions>\n`
		: "";

	return `You are a medical protocol enrichment system. You receive raw extracted supplement data and must match, structure, and score each item against the user's inventory and time blocks.

<user_context>
${userContext}
</user_context>
${userInstructionsSection}
<instructions>
Process each raw extraction item into a structured supplement entry. Follow every rule precisely.

<matching>
SUPPLEMENT MATCHING:
- Fuzzy-match each item name against user_context supplements (spelling variations, abbreviations, brand names).
- Match found → set existingSupplementId to the user's supplement ID.
- No match → set existingSupplementId to null (creates a new supplement).

TIME BLOCK MATCHING:
- Assign each dose to a user time block by ID based on rawTiming AND rawDosage.
- CRITICAL: Pay attention to PRZED (before) vs PO (after) vs DO (with) — these mean DIFFERENT time blocks.
- Match by Polish keywords:
  "na czczo", "rano na czczo", "przed śniadaniem", "PRZED śniadaniem" → Na czczo block
  "do śniadania", "ze śniadaniem" → Śniadanie block
  "2. śniadanie", "drugie śniadanie" → 2. śniadanie block
  "przed obiadem", "PRZED obiadem" → Przed obiadem block
  "do obiadu", "z obiadem" → Obiad block
  "przed kolacją", "PRZED kolacją" → Przed kolacją block
  "do kolacji", "z kolacją" → Kolacja block
  "po kolacji", "PO kolacji" → Po kolacji block
  "przed snem", "na noc" → Przed snem block
- If timing says "PRZED [meal]" → use the "Przed [meal]" block, NOT the meal block.
- If timing says "PO [meal]" → use the "Po [meal]" block, NOT the meal block.
- If ambiguous, pick the closest time block by typical timing and set confidence below ${CONFIDENCE_THRESHOLD}.
</matching>

<categories>
- "medication" — prescription drugs only.
- For everything else, pick the best fit: vitamin, mineral, supplement, probiotic, herb, amino_acid, other.
</categories>

<critical_flag>
isCritical: set PER SCHEDULE (on each schedule object).
isCritical = true when skipping would have health consequences:
- Prescription medications (thyroid, blood thinners, antibiotics, chronic conditions).
- Supplements addressing diagnosed deficiencies.
isCritical = false for general wellness supplements.
When all schedules share the same criticality, set the same value on each.
</critical_flag>

<schedule_consolidation>
CRITICAL: One supplement entry per product. If the same supplement appears at multiple time blocks, create ONE entry with MULTIPLE schedule objects.
Example: "Witamina D: 2000 IU rano, 1000 IU wieczór" → one supplement, two schedules (one per time block).
NEVER duplicate supplement entries.
</schedule_consolidation>

<confidence_and_uncertainty>
Score 0.0–1.0 reflecting certainty about name, dosage, linking, and parsing.
Set below ${CONFIDENCE_THRESHOLD} when: dosage unclear, name ambiguous, matching uncertain, information missing.
When confidence < ${CONFIDENCE_THRESHOLD}, you MUST set uncertaintyReason — a short explanation in Polish of what's uncertain.
Examples: "Dawka nieczytelna", "Nazwa niejednoznaczna", "Nie udało się dopasować do istniejącego suplementu", "Brak informacji o dawkowaniu".
When confidence >= ${CONFIDENCE_THRESHOLD}, set uncertaintyReason to null.
</confidence_and_uncertainty>

<notes_rules>
- Set PER SCHEDULE (on each schedule object), not at the supplement level.
- MUST be in Polish.
- Include medical intake instructions: "30 min przed jedzeniem", "z posiłkiem", "na pusty żołądek", "rozpuścić w wodzie", "2h odstępu od leków".
- Include phase/sequencing info: "zacząć 2 tyg przed antybiotykiem", "brać w trakcie antybiotyku", "brać po zakończeniu antybiotyku".
- Include duration/period info from rawNotes (e.g. "Okres: 2-3 msc", "Okres: Leczenie jelit", "Okres: Zużyć 2 opak."). Keep as-is in Polish.
- EXCLUDE: discount codes, promo codes, shop names, URLs, prices, purchase info.
- If no special instructions → null.
- When different schedules share the same notes, set the same value on each schedule.
</notes_rules>

<cycling>
cycleDaysOn / cycleDaysOff: set PER SCHEDULE (on each schedule object).
If rawCycling mentions cycling ("30 dni brania, 30 dni przerwy", "1 miesiąc brania, 1 miesiąc przerwy"):
- Set cycleDaysOn and cycleDaysOff on each schedule. Convert months → 30 days.
If no cycling pattern → both null.
When all schedules share the same cycling, set the same values on each.
</cycling>

<dosage_interval>
dosageIntervalMinutes: minimum minutes between doses. ONLY for hard medical requirements.
Derived from rawInterval:
- "co 6 godzin" → 360
- "co 8h" → 480
- "co 12 godzin" → 720
ONLY set for medications with explicit interval instructions (antibiotics, strict dosing schedules).
DO NOT derive from frequency like "3x dziennie" or "2x dziennie" — those are just scheduling, not medical interval requirements.
If no explicit interval requirement → null.
</dosage_interval>

<wait_after_taking>
waitAfterTakingMinutes: set PER SCHEDULE (on each schedule object). Minutes to wait after taking before eating/other supplements.
Derived from rawWaitAfter:
- "30 min przed jedzeniem" → 30
- "na czczo 45 min" → 45
- "pół godziny przed posiłkiem" → 30
- "15 minut przed jedzeniem" → 15
If no wait requirement → null.
Typical for supplements taken on empty stomach (glutamine, thyroid meds).
When all schedules share the same wait, set the same value on each.
</wait_after_taking>

<start_day_offset>
startDayOffset: set PER SCHEDULE (on each schedule object). Day number (from protocol start) when this schedule becomes active.
- 0 = starts immediately (day 0 of the protocol).
- Use rawDependency and phase info to determine the offset.

Examples:
- rawDependency="zacząć 2 tyg przed lekami" → this supplement starts at day 0, medications start at day 14.
- rawDependency="po zakończeniu antybiotyku" → if antibiotics are 14 days, this starts at day 28 (or appropriate offset).
- No phase/dependency info → startDayOffset = 0.

Phase mapping from rawDependency or [PHASE: ...]:
- "Stale" / no phase → startDayOffset = 0
- "2 tyg PRZED lekami" → startDayOffset = 0 (these start first; medications get startDayOffset = 14)
- "W trakcie antybiotyku" → same startDayOffset as antibiotics
- "Po antybiotyku" → startDayOffset = antibiotics offset + antibiotic duration

Rules:
- "2 tyg" → 14, "1 msc" → 30
- ALL medications in the same phase should share the same startDayOffset
- ALL supplements in a "before medications" phase should share the same startDayOffset (typically 0)
- Include sequencing info in notes too (e.g. "zacząć 2 tyg przed antybiotykiem")
- The SAME supplement CAN appear as separate entries with different startDayOffset/durationDays if it's taken at different times in different phases (e.g. Debretin during antibiotics in Kolacja block AND Debretin after antibiotics in Przed snem block).
</start_day_offset>

<duration_days>
durationDays: set PER SCHEDULE (on each schedule object). How many days for this schedule. null = indefinitely/permanently.
Derived from the "Okres" column or rawNotes duration info.

Mapping:
- "Stale" → null (permanent)
- "14 dni antybiotyk" → 14
- "2-3 msc" → 75 (midpoint)
- "3 msc" → 90
- "~miesiąc" → 30
- "Czas leczenia" → null (duration unknown, keep in notes)
- "Leczenie jelit" → null (duration unknown, keep in notes)
- "Leczenie + 1 msc po" → null (duration unknown, keep in notes)
- "Do zużycia opakowania" → null (stock system handles cutoff)
- "Zużyć 2 opak." → null (stock-based)
- "Min. 6 msc" → 180

Rules:
- Convert months → 30 days each
- For ranges like "2-3 msc", use the midpoint
- If unclear, set null and lower confidence
</duration_days>
</instructions>

<verification>
Before outputting, self-check:
1. DUPLICATES — Same supplement name at same phase? Merge into one entry with multiple schedules. Different phases? Keep as separate entries.
2. NOTES — All in Polish, no discount codes/URLs/purchase info.
3. CONFIDENCE — Uncertain entries below ${CONFIDENCE_THRESHOLD}, each with uncertaintyReason in Polish.
4. START DAY OFFSETS — Supplements in the same phase share the same offset. Medications that start later have higher offsets.
5. DURATION — Each supplement has durationDays matching its "Okres" value. null for permanent ("Stale") or stock-based.
</verification>

Return ONLY the structured JSON object matching the schema. No prose, no explanations.`;
}
