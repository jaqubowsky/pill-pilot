-- ============================================================
-- PillPilot Seed Script for user: jakub.nalewajk04@gmail.com
-- Covers: stock, price, cycling, dependency, isCritical,
--         multiple time blocks, all dosage units, shared
--         supplements, low/zero stock, daily logs
-- ============================================================
-- Usage:
--   docker exec -i $(docker ps --filter "publish=5433" -q) \
--     psql -U pillpilot -d pill_pilot < scripts/seed.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Resolve user & time block IDs
-- ============================================================
DO $$
DECLARE
  v_user_id text;
  v_tb_fasting text;
  v_tb_breakfast text;
  v_tb_lunch text;
  v_tb_dinner text;
  v_tb_bedtime text;
BEGIN

SELECT id INTO STRICT v_user_id FROM users WHERE email = 'jakub.nalewajk04@gmail.com';

SELECT id INTO STRICT v_tb_fasting  FROM time_blocks WHERE user_id = v_user_id AND sort_order = 0 AND active = true;
SELECT id INTO STRICT v_tb_breakfast FROM time_blocks WHERE user_id = v_user_id AND sort_order = 1 AND active = true;
SELECT id INTO STRICT v_tb_lunch    FROM time_blocks WHERE user_id = v_user_id AND sort_order = 2 AND active = true;
SELECT id INTO STRICT v_tb_dinner   FROM time_blocks WHERE user_id = v_user_id AND sort_order = 3 AND active = true;
SELECT id INTO STRICT v_tb_bedtime  FROM time_blocks WHERE user_id = v_user_id AND sort_order = 4 AND active = true;

-- ============================================================
-- 1. Clean up previous seed data (idempotent)
-- ============================================================
DELETE FROM protocols WHERE id = 'seed_proto_edge_case01' AND user_id = v_user_id;
DELETE FROM supplements WHERE id LIKE 'seed_supp_%' AND user_id = v_user_id;

-- ============================================================
-- 2. Create supplements covering all categories & units
-- ============================================================

-- amino_acid, scoop, stock tracked, with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_kreatyna_01', v_user_id, 'Kreatyna monohydrat', 'Olimp', 'amino_acid', 'scoop', 50, 100, 45.00, true)
ON CONFLICT (id) DO NOTHING;

-- vitamin, drops, stock tracked, with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_k2mk7_0001', v_user_id, 'Witamina K2 MK-7', 'Apollo''s Hegemony', 'vitamin', 'drops', 900, 900, 59.00, true)
ON CONFLICT (id) DO NOTHING;

-- herb, capsule, stock tracked, with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_ashwa_0001', v_user_id, 'Ashwagandha KSM-66', 'NOW Foods', 'herb', 'capsule', 60, 90, 79.00, true)
ON CONFLICT (id) DO NOTHING;

-- amino_acid, capsule, stock NULL (tracking off), with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_teani_0001', v_user_id, 'L-Teanina', 'Aliness', 'amino_acid', 'capsule', NULL, 90, 35.00, true)
ON CONFLICT (id) DO NOTHING;

-- probiotic, sachet, stock tracked, with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_probi_0001', v_user_id, 'Probiotyk wieloszczepowy', 'Vivomixx', 'probiotic', 'sachet', 15, 30, 120.00, true)
ON CONFLICT (id) DO NOTHING;

-- other, scoop, stock tracked, with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_kolag_0001', v_user_id, 'Kolagen morski', 'Testosterone.pl', 'other', 'scoop', 25, 30, 89.00, true)
ON CONFLICT (id) DO NOTHING;

-- supplement, spray, stock tracked, with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_melat_0001', v_user_id, 'Melatonina 1mg', 'Aliness', 'supplement', 'spray', 180, 180, 29.00, true)
ON CONFLICT (id) DO NOTHING;

-- medication, tablet, stock tracked (low!), with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_ibupr_0001', v_user_id, 'Ibuprofen 400mg', 'Nurofen', 'medication', 'tablet', 12, 24, 18.00, true)
ON CONFLICT (id) DO NOTHING;

-- mineral, g, stock tracked, with price — fractional dosage
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_electr_001', v_user_id, 'Elektrolity', 'Testosterone.pl', 'mineral', 'g', 300, 500, 55.00, true)
ON CONFLICT (id) DO NOTHING;

-- supplement, ml, stock tracked, no price (edge: price missing)
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_mctoil_001', v_user_id, 'Olej MCT C8', NULL, 'supplement', 'ml', 450, 500, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- supplement, portion, stock tracked, with price
INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active)
VALUES ('seed_supp_colost_001', v_user_id, 'Colostrum', 'Genactiv', 'supplement', 'portion', 28, 60, 149.00, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Update existing user supplements with stock/price
-- ============================================================

-- NAC
UPDATE supplements SET current_stock = 45, package_size = 90, package_price = 65.00
WHERE user_id = v_user_id AND name = 'NAC' AND active = true;

-- Magnez chelatowany
UPDATE supplements SET current_stock = 120, package_size = 180, package_price = 55.00
WHERE user_id = v_user_id AND name = 'Magnez chelatowany' AND active = true;

-- Witamina C 1000
UPDATE supplements SET current_stock = 30, package_size = 60, package_price = 42.00
WHERE user_id = v_user_id AND name = 'Witamina C 1000' AND active = true;

-- Witamina D3 4000 IU
UPDATE supplements SET current_stock = 200, package_size = 365, package_price = 50.00
WHERE user_id = v_user_id AND name = 'Witamina D3 4000 IU' AND active = true;

-- Berberyna
UPDATE supplements SET current_stock = 85, package_size = 120, package_price = 75.00
WHERE user_id = v_user_id AND name = 'Berberyna' AND active = true;

-- Metronidazol (stock = 0 edge case)
UPDATE supplements SET current_stock = 0, package_size = 30, package_price = 35.00
WHERE user_id = v_user_id AND name = 'Metronidazol 500mg' AND active = true;

-- Pepzin (low stock edge case)
UPDATE supplements SET current_stock = 5, package_size = 60, package_price = 89.00
WHERE user_id = v_user_id AND name = 'Pepzin (karnozynian cynku)' AND active = true;

-- ============================================================
-- 4. Create test protocol
-- ============================================================
INSERT INTO protocols (id, user_id, name, parsed_data, status, start_date)
VALUES (
  'seed_proto_edge_case01',
  v_user_id,
  'Protokół Testowy — Wszystkie Edge Case''y',
  '{}',
  'active',
  CURRENT_DATE
);

-- ============================================================
-- 5. Protocol supplements with all edge cases
-- ============================================================

-- (A) Critical medication, 3 time blocks, tracked stock
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_ibuprofen_01', 'seed_proto_edge_case01', 'seed_supp_ibupr_0001',
  'Co 8h, max 3 tabletki/dzień. NIE na pusty żołądek', true, 0, true);

-- (B) Cycling 5/2 (Ashwagandha)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, cycle_days_on, cycle_days_off, sort_order, active)
VALUES ('seed_ps_ashwagand_01', 'seed_proto_edge_case01', 'seed_supp_ashwa_0001',
  'Cyklicznie 5/2. Nie łączyć z kofeiną', false, 5, 2, 1, true);

-- (C) Cycling 30/30 (Kreatyna)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, cycle_days_on, cycle_days_off, sort_order, active)
VALUES ('seed_ps_kreatyna_01', 'seed_proto_edge_case01', 'seed_supp_kreatyna_01',
  'Cykl 30/30. Po treningu z węglowodanami', false, 30, 30, 2, true);

-- (D) Dependency: L-Teanina → starts 7 days after Ashwagandha
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, prerequisite_id, delay_days, sort_order, active)
VALUES ('seed_ps_lteanina_01', 'seed_proto_edge_case01', 'seed_supp_teani_0001',
  'Rozpocząć 7 dni po Ashwagandhie. Stock tracking OFF', false, 'seed_ps_ashwagand_01', 7, 3, true);

-- (E) Scoop unit, low stock
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_kolagen_001', 'seed_proto_edge_case01', 'seed_supp_kolag_0001',
  'Rano na czczo, w ciepłej wodzie', false, 4, true);

-- (F) Drops unit, 2 blocks
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_k2mk7_00001', 'seed_proto_edge_case01', 'seed_supp_k2mk7_0001',
  'Z tłustym posiłkiem. Synergicznie z D3', false, 5, true);

-- (G) Sachet unit
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_probiotyk_1', 'seed_proto_edge_case01', 'seed_supp_probi_0001',
  'Na pusty żołądek, min 30 min przed jedzeniem', false, 6, true);

-- (H) Spray unit, single block
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_melatoni_01', 'seed_proto_edge_case01', 'seed_supp_melat_0001',
  '30 min przed snem, pod język', false, 7, true);

-- (I) Dependency chain: NAC depends on Ibuprofen + 3 days
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, prerequisite_id, delay_days, sort_order, active)
VALUES ('seed_ps_nac_edge_01', 'seed_proto_edge_case01', (SELECT id FROM supplements WHERE user_id = v_user_id AND name = 'NAC' AND active = true LIMIT 1),
  'Zależny od zakończenia Ibuprofenu + 3 dni', false, 'seed_ps_ibuprofen_01', 3, 8, true);

-- (J) Shared supplement with other protocol (D3)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_d3_shared_1', 'seed_proto_edge_case01', (SELECT id FROM supplements WHERE user_id = v_user_id AND name = 'Witamina D3 4000 IU' AND active = true LIMIT 1),
  'Współdzielony z Protokołem H.Pylori — wspólny stock', false, 9, true);

-- (K) Low stock supplement (Pepzin, stock=5)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_pepzin_lo_1', 'seed_proto_edge_case01', (SELECT id FROM supplements WHERE user_id = v_user_id AND name = 'Pepzin (karnozynian cynku)' AND active = true LIMIT 1),
  'Niski stock! Sprawdź alert. 30 min przed jedzeniem', false, 10, true);

-- (L) Zero stock + cycling + critical (Metronidazol)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, cycle_days_on, cycle_days_off, sort_order, active)
VALUES ('seed_ps_metro_zer_1', 'seed_proto_edge_case01', (SELECT id FROM supplements WHERE user_id = v_user_id AND name = 'Metronidazol 500mg' AND active = true LIMIT 1),
  'Stock = 0! Lek na receptę. Cykl 14/14', true, 14, 14, 11, true);

-- (M) Gram unit (Elektrolity)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_electr_001', 'seed_proto_edge_case01', 'seed_supp_electr_001',
  '5g w wodzie, 2x dziennie', false, 12, true);

-- (N) ML unit, no price (MCT Oil)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_mctoil_001', 'seed_proto_edge_case01', 'seed_supp_mctoil_001',
  'Do kawy rano. Brak ceny w systemie', false, 13, true);

-- (O) Portion unit (Colostrum)
INSERT INTO protocol_supplements (id, protocol_id, supplement_id, notes, is_critical, sort_order, active)
VALUES ('seed_ps_colost_001', 'seed_proto_edge_case01', 'seed_supp_colost_001',
  'Na czczo, 30 min przed posiłkiem', false, 14, true);

-- ============================================================
-- 6. Supplement schedules (all dosage units, multi-block)
-- ============================================================

-- Ibuprofen: 3x/day (Breakfast, Lunch, Dinner) — tablet
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_ibu_bfast_01', 'seed_ps_ibuprofen_01', v_tb_breakfast, 1, 'tablet'),
  ('seed_ss_ibu_lunch_01', 'seed_ps_ibuprofen_01', v_tb_lunch,     1, 'tablet'),
  ('seed_ss_ibu_dinner_1', 'seed_ps_ibuprofen_01', v_tb_dinner,    1, 'tablet');

-- Ashwagandha: 2x (Breakfast, Dinner) — capsule
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_ash_bfast_01', 'seed_ps_ashwagand_01', v_tb_breakfast, 1, 'capsule'),
  ('seed_ss_ash_dinner_1', 'seed_ps_ashwagand_01', v_tb_dinner,    1, 'capsule');

-- Kreatyna: 1x (Lunch) — scoop
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_kre_lunch_01', 'seed_ps_kreatyna_01', v_tb_lunch, 1, 'scoop');

-- L-Teanina: 1x (Bedtime) — capsule, 2 caps
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_tea_bed_00001', 'seed_ps_lteanina_01', v_tb_bedtime, 2, 'capsule');

-- Kolagen: 1x (Fasting) — scoop
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_kol_fast_001', 'seed_ps_kolagen_001', v_tb_fasting, 1, 'scoop');

-- K2 MK-7: 2x (Breakfast, Dinner) — drops
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_k2_bfast_001', 'seed_ps_k2mk7_00001', v_tb_breakfast, 5, 'drops'),
  ('seed_ss_k2_dinner_01', 'seed_ps_k2mk7_00001', v_tb_dinner,    5, 'drops');

-- Probiotyk: 1x (Fasting) — sachet
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_pro_fast_001', 'seed_ps_probiotyk_1', v_tb_fasting, 1, 'sachet');

-- Melatonina: 1x (Bedtime) — spray
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_mel_bed_00001', 'seed_ps_melatoni_01', v_tb_bedtime, 2, 'spray');

-- NAC: 2x (Breakfast, Dinner) — capsule
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_nac_bfast_01', 'seed_ps_nac_edge_01', v_tb_breakfast, 2, 'capsule'),
  ('seed_ss_nac_dinner_1', 'seed_ps_nac_edge_01', v_tb_dinner,    2, 'capsule');

-- D3 shared: 1x (Breakfast) — capsule
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_d3_bfast_001', 'seed_ps_d3_shared_1', v_tb_breakfast, 1, 'capsule');

-- Pepzin low stock: 1x (Fasting) — capsule
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_pep_fast_001', 'seed_ps_pepzin_lo_1', v_tb_fasting, 2, 'capsule');

-- Metronidazol zero stock: 2x (Breakfast, Dinner) — tablet
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_met_bfast_01', 'seed_ps_metro_zer_1', v_tb_breakfast, 1, 'tablet'),
  ('seed_ss_met_dinner_1', 'seed_ps_metro_zer_1', v_tb_dinner,    1, 'tablet');

-- Elektrolity: 2x (Fasting, Lunch) — g
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_ele_fast_001', 'seed_ps_electr_001', v_tb_fasting, 5, 'g'),
  ('seed_ss_ele_lunch_01', 'seed_ps_electr_001', v_tb_lunch,    5, 'g');

-- MCT Oil: 1x (Fasting) — ml
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_mct_fast_001', 'seed_ps_mctoil_001', v_tb_fasting, 15, 'ml');

-- Colostrum: 1x (Fasting) — portion
INSERT INTO supplement_schedules (id, protocol_supplement_id, time_block_id, dosage_amount, dosage_unit) VALUES
  ('seed_ss_col_fast_001', 'seed_ps_colost_001', v_tb_fasting, 1, 'portion');

-- ============================================================
-- 7. Daily logs for today (mix of checked/unchecked)
-- ============================================================
INSERT INTO daily_logs (id, schedule_id, date, taken_at) VALUES
  ('seed_dl_ibu_bfast_01', 'seed_ss_ibu_bfast_01', CURRENT_DATE, NOW()),
  ('seed_dl_ash_bfast_01', 'seed_ss_ash_bfast_01', CURRENT_DATE, NOW()),
  ('seed_dl_pro_fast_001', 'seed_ss_pro_fast_001', CURRENT_DATE, NOW()),
  ('seed_dl_k2_bfast_001', 'seed_ss_k2_bfast_001', CURRENT_DATE, NOW()),
  ('seed_dl_kol_fast_001', 'seed_ss_kol_fast_001', CURRENT_DATE, NOW()),
  ('seed_dl_ele_fast_001', 'seed_ss_ele_fast_001', CURRENT_DATE, NOW());

END;
$$;

COMMIT;
