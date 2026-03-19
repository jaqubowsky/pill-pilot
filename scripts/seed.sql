-- ============================================================
-- PillPilot Seed Script
-- Covers: stock, price, cycling, startDayOffset, isCritical,
--         multiple time blocks (9), all dosage units, shared
--         supplements, low/zero stock, daily logs
-- ============================================================
-- Usage:
--   SEED_EMAIL='user@example.com' envsubst < scripts/seed.sql | \
--     docker exec -i $(docker ps --filter "publish=5433" -q) \
--     psql -U pillpilot -d pill_pilot
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_user_id text;
  v_tb_fasting text;
  v_tb_breakfast text;
  v_tb_snack text;
  v_tb_pre_lunch text;
  v_tb_lunch text;
  v_tb_pre_dinner text;
  v_tb_dinner text;
  v_tb_post_dinner text;
  v_tb_bedtime text;
BEGIN

SELECT id INTO STRICT v_user_id FROM users WHERE email = '${SEED_EMAIL}';

SELECT id INTO STRICT v_tb_fasting     FROM time_blocks WHERE user_id = v_user_id AND name = 'Na czczo'         AND active = true;
SELECT id INTO STRICT v_tb_breakfast   FROM time_blocks WHERE user_id = v_user_id AND name = 'Śniadanie'        AND active = true;
SELECT id INTO STRICT v_tb_snack       FROM time_blocks WHERE user_id = v_user_id AND name = 'Drugie śniadanie' AND active = true;
SELECT id INTO STRICT v_tb_pre_lunch   FROM time_blocks WHERE user_id = v_user_id AND name = 'Przed obiadem'    AND active = true;
SELECT id INTO STRICT v_tb_lunch       FROM time_blocks WHERE user_id = v_user_id AND name = 'Obiad'            AND active = true;
SELECT id INTO STRICT v_tb_pre_dinner  FROM time_blocks WHERE user_id = v_user_id AND name = 'Przed kolacją'    AND active = true;
SELECT id INTO STRICT v_tb_dinner      FROM time_blocks WHERE user_id = v_user_id AND name = 'Kolacja'          AND active = true;
SELECT id INTO STRICT v_tb_post_dinner FROM time_blocks WHERE user_id = v_user_id AND name = 'Po kolacji'       AND active = true;
SELECT id INTO STRICT v_tb_bedtime     FROM time_blocks WHERE user_id = v_user_id AND name = 'Przed snem'       AND active = true;

-- ============================================================
-- 1. Clean up previous seed data (idempotent)
-- ============================================================
DELETE FROM supplement_schedules WHERE id LIKE 'seed_ss_%';
DELETE FROM protocols WHERE id LIKE 'seed_proto_%' AND user_id = v_user_id;
DELETE FROM supplements WHERE id LIKE 'seed_supp_%' AND user_id = v_user_id;

-- ============================================================
-- 2. Create supplements covering all categories & units
-- ============================================================

INSERT INTO supplements (id, user_id, name, brand_name, category, stock_unit, current_stock, package_size, package_price, active) VALUES
  ('seed_supp_kreatyna_01', v_user_id, 'Kreatyna monohydrat',      'Olimp',              'amino_acid',  'scoop',   50,   100, 45.00,  true),
  ('seed_supp_k2mk7_0001',  v_user_id, 'Witamina K2 MK-7',         'Apollo''s Hegemony', 'vitamin',     'drops',   900,  900, 59.00,  true),
  ('seed_supp_ashwa_0001',   v_user_id, 'Ashwagandha KSM-66',       'NOW Foods',          'herb',        'capsule', 60,   90,  79.00,  true),
  ('seed_supp_teani_0001',   v_user_id, 'L-Teanina',                'Aliness',            'amino_acid',  'capsule', NULL, 90,  35.00,  true),
  ('seed_supp_probi_0001',   v_user_id, 'Probiotyk wieloszczepowy', 'Vivomixx',           'probiotic',   'sachet',  15,   30,  120.00, true),
  ('seed_supp_kolag_0001',   v_user_id, 'Kolagen morski',           'Testosterone.pl',    'other',       'scoop',   25,   30,  89.00,  true),
  ('seed_supp_melat_0001',   v_user_id, 'Melatonina 1mg',           'Aliness',            'supplement',  'spray',   180,  180, 29.00,  true),
  ('seed_supp_ibupr_0001',   v_user_id, 'Ibuprofen 400mg',          'Nurofen',            'medication',  'tablet',  12,   24,  18.00,  true),
  ('seed_supp_electr_001',   v_user_id, 'Elektrolity',              'Testosterone.pl',    'mineral',     'g',       300,  500, 55.00,  true),
  ('seed_supp_mctoil_001',   v_user_id, 'Olej MCT C8',              NULL,                 'supplement',  'ml',      450,  500, NULL,   true),
  ('seed_supp_colost_001',   v_user_id, 'Colostrum',                'Genactiv',           'supplement',  'portion', 28,   60,  149.00, true),
  ('seed_supp_emanera_01',   v_user_id, 'Emanera (esomeprazol)',    NULL,                 'medication',  'capsule', 28,   28,  32.00,  true),
  ('seed_supp_sbould_001',   v_user_id, 'S. Boulardii',             NULL,                 'probiotic',   'capsule', 30,   30,  45.00,  true),
  ('seed_supp_nac_00001',    v_user_id, 'NAC',                      'Aliness',            'amino_acid',  'capsule', 45,   90,  65.00,  true),
  ('seed_supp_magnez_001',   v_user_id, 'Magnez chelatowany',       'Aliness',            'mineral',     'capsule', 120,  180, 55.00,  true),
  ('seed_supp_witc_00001',   v_user_id, 'Witamina C 1000',          'NOW Foods',          'vitamin',     'capsule', 30,   60,  42.00,  true),
  ('seed_supp_d3_000001',    v_user_id, 'Witamina D3 4000 IU',      'Aliness',            'vitamin',     'capsule', 200,  365, 50.00,  true),
  ('seed_supp_berbe_0001',   v_user_id, 'Berberyna',                'Aliness',            'herb',        'capsule', 85,   120, 75.00,  true),
  ('seed_supp_metro_0001',   v_user_id, 'Metronidazol 500mg',       NULL,                 'medication',  'tablet',  0,    30,  35.00,  true),
  ('seed_supp_pepzin_001',   v_user_id, 'Pepzin (karnozynian cynku)', 'Doctor''s Best',   'supplement',  'capsule', 5,    60,  89.00,  true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Create protocols
-- ============================================================

INSERT INTO protocols (id, user_id, name, status, start_date) VALUES
  ('seed_proto_gut_heal_01', v_user_id, 'Protokół leczenia jelit',      'active', CURRENT_DATE - INTERVAL '14 days'),
  ('seed_proto_daily_sup01', v_user_id, 'Codzienna suplementacja',      'active', CURRENT_DATE - INTERVAL '30 days'),
  ('seed_proto_archived_01', v_user_id, 'Antybiotykoterapia (zakończ.)', 'archived', CURRENT_DATE - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Supplement schedules — Protokół leczenia jelit
--    (medications, probiotics, gut-healing supps)
-- ============================================================

-- Emanera: 1x before dinner — critical medication
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, is_critical, wait_after_taking_minutes, sort_order, active) VALUES
  ('seed_ss_ema_predin_01', 'seed_proto_gut_heal_01', 'seed_supp_emanera_01', v_tb_pre_dinner, 1, 'capsule', '30 min PRZED kolacją', true, 30, 0, true);

-- S. Boulardii: 1x after dinner
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_sbo_postdin_1', 'seed_proto_gut_heal_01', 'seed_supp_sbould_001', v_tb_post_dinner, 1, 'capsule', 'PO kolacji, min 2h po antybiotyku', 1, true);

-- Probiotyk: 1x fasting — sachet
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_pro_fast_001', 'seed_proto_gut_heal_01', 'seed_supp_probi_0001', v_tb_fasting, 1, 'sachet', 'Na pusty żołądek, min 30 min przed jedzeniem', 2, true);

-- Colostrum: 1x fasting — portion
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_col_fast_001', 'seed_proto_gut_heal_01', 'seed_supp_colost_001', v_tb_fasting, 1, 'portion', 'Na czczo, 30 min przed posiłkiem', 3, true);

-- Pepzin: 2x (fasting + before dinner) — low stock!
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_pep_fast_001', 'seed_proto_gut_heal_01', 'seed_supp_pepzin_001', v_tb_fasting,    2, 'capsule', '30 min przed jedzeniem', 4, true),
  ('seed_ss_pep_predin_1', 'seed_proto_gut_heal_01', 'seed_supp_pepzin_001', v_tb_pre_dinner, 2, 'capsule', '30 min przed kolacją',   5, true);

-- Berberyna: 3x with meals — cycling 60/14
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, cycle_days_on, cycle_days_off, sort_order, active) VALUES
  ('seed_ss_ber_bfast_01', 'seed_proto_gut_heal_01', 'seed_supp_berbe_0001', v_tb_breakfast, 1, 'capsule', 'Z posiłkiem, cykl 60/14', 60, 14, 6, true),
  ('seed_ss_ber_lunch_01', 'seed_proto_gut_heal_01', 'seed_supp_berbe_0001', v_tb_lunch,     1, 'capsule', 'Z posiłkiem, cykl 60/14', 60, 14, 7, true),
  ('seed_ss_ber_dinner_1', 'seed_proto_gut_heal_01', 'seed_supp_berbe_0001', v_tb_dinner,    1, 'capsule', 'Z posiłkiem, cykl 60/14', 60, 14, 8, true);

-- Metronidazol: 2x (breakfast + dinner) — zero stock, critical, cycling 14/14, delayed start
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, is_critical, cycle_days_on, cycle_days_off, start_day_offset, sort_order, active) VALUES
  ('seed_ss_met_bfast_01', 'seed_proto_gut_heal_01', 'seed_supp_metro_0001', v_tb_breakfast, 1, 'tablet', 'Lek na receptę. Cykl 14/14', true, 14, 14, 14, 9,  true),
  ('seed_ss_met_dinner_1', 'seed_proto_gut_heal_01', 'seed_supp_metro_0001', v_tb_dinner,    1, 'tablet', 'Lek na receptę. Cykl 14/14', true, 14, 14, 14, 10, true);

-- NAC: 2x (breakfast + dinner) — delayed start day 14
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, start_day_offset, sort_order, active) VALUES
  ('seed_ss_nac_bfast_01', 'seed_proto_gut_heal_01', 'seed_supp_nac_00001', v_tb_breakfast, 2, 'capsule', 'Rozpocząć od dnia 14 (po antybiotykach)', 14, 11, true),
  ('seed_ss_nac_dinner_1', 'seed_proto_gut_heal_01', 'seed_supp_nac_00001', v_tb_dinner,    2, 'capsule', 'Rozpocząć od dnia 14 (po antybiotykach)', 14, 12, true);

-- ============================================================
-- 5. Supplement schedules — Codzienna suplementacja
--    (vitamins, minerals, adaptogens, performance)
-- ============================================================

-- Kolagen: 1x fasting — scoop
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_kol_fast_001', 'seed_proto_daily_sup01', 'seed_supp_kolag_0001', v_tb_fasting, 1, 'scoop', 'Rano na czczo, w ciepłej wodzie', 0, true);

-- MCT Oil: 1x fasting — ml
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_mct_fast_001', 'seed_proto_daily_sup01', 'seed_supp_mctoil_001', v_tb_fasting, 15, 'ml', 'Do kawy rano', 1, true);

-- Elektrolity: 2x (fasting + lunch) — g
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_ele_fast_001', 'seed_proto_daily_sup01', 'seed_supp_electr_001', v_tb_fasting, 5, 'g', '5g w wodzie', 2, true),
  ('seed_ss_ele_lunch_01', 'seed_proto_daily_sup01', 'seed_supp_electr_001', v_tb_lunch,   5, 'g', '5g w wodzie', 3, true);

-- D3: 1x breakfast — shared across protocols
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_d3_bfast_001', 'seed_proto_daily_sup01', 'seed_supp_d3_000001', v_tb_breakfast, 1, 'capsule', 'Z tłustym posiłkiem', 4, true);

-- K2 MK-7: 2x (breakfast + dinner) — drops, synergy with D3
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_k2_bfast_001', 'seed_proto_daily_sup01', 'seed_supp_k2mk7_0001', v_tb_breakfast, 5, 'drops', 'Z tłustym posiłkiem. Synergicznie z D3', 5, true),
  ('seed_ss_k2_dinner_01', 'seed_proto_daily_sup01', 'seed_supp_k2mk7_0001', v_tb_dinner,    5, 'drops', 'Z tłustym posiłkiem',                    6, true);

-- Witamina C: 2x (breakfast + dinner) — capsule
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_witc_bfst_01', 'seed_proto_daily_sup01', 'seed_supp_witc_00001', v_tb_breakfast, 1, 'capsule', NULL, 7, true),
  ('seed_ss_witc_din_001', 'seed_proto_daily_sup01', 'seed_supp_witc_00001', v_tb_dinner,    1, 'capsule', NULL, 8, true);

-- Magnez: 2x (lunch + bedtime) — capsule
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_mag_lunch_01', 'seed_proto_daily_sup01', 'seed_supp_magnez_001', v_tb_lunch,   2, 'capsule', NULL,                     9,  true),
  ('seed_ss_mag_bed_0001', 'seed_proto_daily_sup01', 'seed_supp_magnez_001', v_tb_bedtime, 2, 'capsule', 'Przed snem na relaks', 10, true);

-- Ashwagandha: 2x (breakfast + dinner) — cycling 5/2
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, cycle_days_on, cycle_days_off, sort_order, active) VALUES
  ('seed_ss_ash_bfast_01', 'seed_proto_daily_sup01', 'seed_supp_ashwa_0001', v_tb_breakfast, 1, 'capsule', 'Cyklicznie 5/2. Nie łączyć z kofeiną', 5, 2, 11, true),
  ('seed_ss_ash_dinner_1', 'seed_proto_daily_sup01', 'seed_supp_ashwa_0001', v_tb_dinner,    1, 'capsule', 'Cyklicznie 5/2',                       5, 2, 12, true);

-- Kreatyna: 1x lunch — cycling 30/30, scoop
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, cycle_days_on, cycle_days_off, sort_order, active) VALUES
  ('seed_ss_kre_lunch_01', 'seed_proto_daily_sup01', 'seed_supp_kreatyna_01', v_tb_lunch, 1, 'scoop', 'Cykl 30/30. Po treningu z węglowodanami', 30, 30, 13, true);

-- L-Teanina: 1x bedtime — delayed start day 7
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, start_day_offset, sort_order, active) VALUES
  ('seed_ss_tea_bed_00001', 'seed_proto_daily_sup01', 'seed_supp_teani_0001', v_tb_bedtime, 2, 'capsule', 'Rozpocząć od dnia 7', 7, 14, true);

-- Melatonina: 1x bedtime — spray
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_mel_bed_00001', 'seed_proto_daily_sup01', 'seed_supp_melat_0001', v_tb_bedtime, 2, 'spray', '30 min przed snem, pod język', 15, true);

-- Ibuprofen: PRN in daily protocol (2. śniadanie) — single dose
INSERT INTO supplement_schedules (id, protocol_id, supplement_id, time_block_id, dosage_amount, dosage_unit, notes, sort_order, active) VALUES
  ('seed_ss_ibu_snack_01', 'seed_proto_daily_sup01', 'seed_supp_ibupr_0001', v_tb_snack, 1, 'tablet', 'Doraźnie przy bólu głowy', 16, true);

-- ============================================================
-- 6. Daily logs for today (partial progress — realistic state)
-- ============================================================
INSERT INTO daily_logs (id, schedule_id, date, taken_at) VALUES
  ('seed_dl_kol_fast_001', 'seed_ss_kol_fast_001', CURRENT_DATE, CURRENT_DATE + TIME '06:35'),
  ('seed_dl_mct_fast_001', 'seed_ss_mct_fast_001', CURRENT_DATE, CURRENT_DATE + TIME '06:35'),
  ('seed_dl_ele_fast_001', 'seed_ss_ele_fast_001', CURRENT_DATE, CURRENT_DATE + TIME '06:40'),
  ('seed_dl_pro_fast_001', 'seed_ss_pro_fast_001', CURRENT_DATE, CURRENT_DATE + TIME '06:45'),
  ('seed_dl_col_fast_001', 'seed_ss_col_fast_001', CURRENT_DATE, CURRENT_DATE + TIME '06:50'),
  ('seed_dl_pep_fast_001', 'seed_ss_pep_fast_001', CURRENT_DATE, CURRENT_DATE + TIME '06:55'),
  ('seed_dl_d3_bfast_001', 'seed_ss_d3_bfast_001', CURRENT_DATE, CURRENT_DATE + TIME '08:10'),
  ('seed_dl_k2_bfast_01',  'seed_ss_k2_bfast_001', CURRENT_DATE, CURRENT_DATE + TIME '08:10'),
  ('seed_dl_ash_bfst_01',  'seed_ss_ash_bfast_01', CURRENT_DATE, CURRENT_DATE + TIME '08:15'),
  ('seed_dl_witc_bfst_1',  'seed_ss_witc_bfst_01', CURRENT_DATE, CURRENT_DATE + TIME '08:15'),
  ('seed_dl_met_bfst_01',  'seed_ss_met_bfast_01', CURRENT_DATE, CURRENT_DATE + TIME '08:20'),
  ('seed_dl_nac_bfst_01',  'seed_ss_nac_bfast_01', CURRENT_DATE, CURRENT_DATE + TIME '08:25')
ON CONFLICT ON CONSTRAINT daily_logs_schedule_id_date_unique DO NOTHING;

END;
$$;

COMMIT;
