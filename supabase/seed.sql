-- ============================================================
-- MuAIlim — Seed data (demo questions)
-- Run AFTER schema.sql
-- ============================================================

insert into public.questions (id, subject, topic, difficulty, text, options, correct_index, source, year) values
-- ── Matematika ──────────────────────────────────────────────
('q_math_001','math','Kvadrat tenglamalar','medium',
 'x² - 5x + 6 = 0 tenglamaning ildizlari yig''indisi nechaga teng?',
 '["2","3","5","−5"]', 2, 'dtm_2023', 2023),

('q_math_002','math','Kvadrat tenglamalar','medium',
 '2x² − 8 = 0 tenglamaning musbat ildizi qanday?',
 '["1","2","4","8"]', 1, 'dtm_2022', 2022),

('q_math_003','math','Kvadrat tenglamalar','hard',
 'x² + bx + c = 0 tenglamada ildizlar ko''paytmasi qaysi formula bilan topiladi?',
 '["b/a","−b/a","c/a","−c/a"]', 2, 'dtm_2021', 2021),

('q_math_004','math','Logarifmlar','hard',
 'log₂(32) ning qiymati nechaga teng?',
 '["3","4","5","6"]', 2, 'dtm_2023', 2023),

('q_math_005','math','Logarifmlar','medium',
 'log₁₀(100) qanday?',
 '["1","2","10","100"]', 1, 'dtm_2022', 2022),

('q_math_006','math','Foizlar','easy',
 '400 sonining 25% i nechaga teng?',
 '["25","50","100","200"]', 2, 'dtm_2021', 2021),

('q_math_007','math','Foizlar','medium',
 'Narx 20% oshdi. Yangi narx 120 so''m bo''lsa, eski narx necha so''m edi?',
 '["80","96","100","110"]', 2, 'ai_generated', null),

('q_math_008','math','Trigonometriya','medium',
 'sin 30° ning qiymati nechaga teng?',
 '["0","0.5","√2/2","1"]', 1, 'dtm_2022', 2022),

('q_math_009','math','Trigonometriya','medium',
 'cos 60° ning qiymati nechaga teng?',
 '["0","0.5","√3/2","1"]', 1, 'ai_generated', null),

('q_math_010','math','Arifmetik progressiya','medium',
 'Arifmetik progressiyaning 1-hadi 3, d=4. 5-had qanday?',
 '["15","17","19","21"]', 2, 'dtm_2023', 2023),

-- ── Tarix ───────────────────────────────────────────────────
('q_hist_001','history','Amir Temur davri','easy',
 'Amir Temur qaysi yili Samarqandni poytaxtga aylantirdi?',
 '["1370","1380","1395","1405"]', 0, 'dtm_2023', 2023),

('q_hist_002','history','Amir Temur davri','medium',
 'Temuriylar sulolasining asoschisi kim?',
 '["Ulug''bek","Shahruh","Amir Temur","Boburshoh"]', 2, 'dtm_2022', 2022),

('q_hist_003','history','Amir Temur davri','hard',
 'Amir Temur nechi yoshida vafot etdi?',
 '["60","65","69","72"]', 2, 'dtm_2021', 2021),

('q_hist_004','history','Mustaqillik davri','easy',
 'O''zbekiston mustaqillikka qaysi yili erishdi?',
 '["1989","1990","1991","1992"]', 2, 'dtm_2023', 2023),

('q_hist_005','history','Mustaqillik davri','medium',
 'O''zbekiston Respublikasining birinchi Prezidenti kim bo''lgan?',
 '["Sh. Mirziyoyev","I. Karimov","R. Inomov","A. Mutalov"]', 1, 'dtm_2022', 2022),

('q_hist_006','history','Qadimgi davr','hard',
 'Yunon-Baqtriya davlati qachon barpo etilgan?',
 '["mil.av. 250","mil.av. 150","mil.av. 50","mil. 100"]', 0, 'dtm_2021', 2021),

('q_hist_007','history','Jadidchilik','medium',
 'Jadidchilik harakatining asosiy maqsadi nima edi?',
 '["Siyosiy mustaqillik","Ta''limni isloh qilish","Harbiy kuch","Savdo rivojlantirish"]', 1, 'dtm_2022', 2022),

('q_hist_008','history','Jadidchilik','hard',
 'Birinchi jadid maktabi qaysi yili ochildi?',
 '["1884","1893","1898","1905"]', 1, 'ai_generated', null),

('q_hist_009','history','Sovet davri','medium',
 'O''zbekiston SSR qaysi yili tashkil etilgan?',
 '["1920","1924","1930","1936"]', 1, 'dtm_2022', 2022),

('q_hist_010','history','Ipak yo''li','easy',
 'Buyuk Ipak yo''li qaysi davlatlarni bog''lagan?',
 '["Xitoy va Yevropa","Hindiston va Afrika","Arabiston va Turkiya","Rossiya va Xitoy"]', 0, 'dtm_2023', 2023),

-- ── Ona tili ────────────────────────────────────────────────
('q_uzb_001','uzbek','Imlo qoidalari','easy',
 'Qaysi so''z to''g''ri yozilgan?',
 '["kitob","kitap","kittob","kitoob"]', 0, 'dtm_2023', 2023),

('q_uzb_002','uzbek','Gap bo''laklari','medium',
 '"O''quvchi dars o''qiyapti" gapida ega qaysi so''z?',
 '["dars","o''qiyapti","O''quvchi","o''q"]', 2, 'dtm_2023', 2023),

('q_uzb_003','uzbek','Gap bo''laklari','medium',
 'Kesim gap bo''lagi nima vazifasini bajaradi?',
 '["Kim?","Nima qildi?","Qanday?","Qayerda?"]', 1, 'dtm_2022', 2022),

('q_uzb_004','uzbek','So''z turkumlari','medium',
 '"Chiroyli" so''zi qaysi so''z turkumiga kiradi?',
 '["Ot","Fe''l","Sifat","Ravish"]', 2, 'dtm_2022', 2022),

('q_uzb_005','uzbek','So''z turkumlari','easy',
 '"Yugurmoq" so''zi qaysi so''z turkumi?',
 '["Ot","Fe''l","Sifat","Olmosh"]', 1, 'dtm_2021', 2021),

('q_uzb_006','uzbek','Adabiyot','hard',
 'Alisher Navoiyning asosiy asari qaysi?',
 '["Farhod va Shirin","Xamsa","Layli va Majnun","Saddi Iskandariy"]', 1, 'dtm_2021', 2021),

('q_uzb_007','uzbek','Adabiyot','medium',
 'Abdulla Qodiriy qaysi asarni yozgan?',
 '["Sarob","O''tkan kunlar","Shum bola","Ikki eshik orasi"]', 1, 'dtm_2022', 2022),

('q_uzb_008','uzbek','Punktuatsiya','easy',
 'Undalma gapda qanday ajratiladi?',
 '["Nuqta bilan","Vergul bilan","Tire bilan","Ikki nuqta bilan"]', 1, 'ai_generated', null),

('q_uzb_009','uzbek','Morfologiya','medium',
 '"Kitoblar" so''zidagi "-lar" qo''shimchasi qaysi?',
 '["Kelishik","Ko''plik","Egalik","Fe''l"]', 1, 'dtm_2022', 2022),

('q_uzb_010','uzbek','Sintaksis','hard',
 'Qo''shma gap necha turga bo''linadi?',
 '["2","3","4","5"]', 1, 'dtm_2021', 2021)

on conflict (id) do nothing;
