---
name: Key project decisions
description: PillPilot MVP scope decisions - what's in, what's deferred to WEEK 1
type: project
---

Decyzje z 2026-03-13:
- Auth: tylko Google OAuth (bez magic link, bez GitHub)
- DB: PostgreSQL self-hosted na Hetzner VPS (Docker) zamiast Turso
- TimeBlock: per-user w bazie, tylko `startTime` (bez `endTime` — blok trwa do startTime następnego)
- TimeBlock: konfigurowalne (dodawanie/edycja/usuwanie/reorder) w Settings
- AI parsing: dostaje pełny kontekst usera (supplements + timeBlocks z ID-kami), zwraca ID-ki
- Kategorie suplementów: medication, supplement, vitamin, mineral, probiotic, herb, amino_acid, other
- Schedule ma `timing` (widoczne na dashboardzie, np. "45 min przed snem") + `notes` (widoczne tylko w edycji)
- Offline queue: WEEK 1
- Bulk delete: WEEK 1
- Stock setup w onboardingu: WEEK 1
- "Dodaj ręcznie" protokół: WEEK 1
- shopUrl: usunięty kompletnie
- packagePrice: zostaje (V2 podsumowanie kosztów)
- Skoryguj stock: MVP

**Why:** Minimalizacja scope MVP do jednego dnia pracy.
**How to apply:** Przy implementacji trzymać się tego scope'u. Nie dodawać WEEK 1 features do MVP.
