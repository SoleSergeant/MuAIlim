import uuid
import json
from pathlib import Path
from fastapi import APIRouter, Query, HTTPException
from models.schemas import Subject, Difficulty
from services.claude_service import generate_questions
from services.supabase_service import db

router = APIRouter(prefix="/questions", tags=["questions"])

def _load_ingested() -> list[dict]:
    p = Path(__file__).parent.parent / "data" / "questions.json"
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []

DEMO_QUESTIONS = [
    # ── MATEMATIKA (30) ──────────────────────────────────────────────
    {"id": "q_math_001", "subject": "math", "topic": "Kvadrat tenglamalar", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "x² - 5x + 6 = 0 tenglamaning ildizlari yig'indisi nechaga teng?", "options": ["2", "3", "5", "−5"], "correct_index": 2},
    {"id": "q_math_002", "subject": "math", "topic": "Kvadrat tenglamalar", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "2x² − 8 = 0 tenglamaning musbat ildizi qanday?", "options": ["1", "2", "4", "8"], "correct_index": 1},
    {"id": "q_math_003", "subject": "math", "topic": "Logarifmlar", "difficulty": "hard", "source": "dtm_2023", "year": 2023,
     "text": "log₂(32) ning qiymati nechaga teng?", "options": ["3", "4", "5", "6"], "correct_index": 2},
    {"id": "q_math_004", "subject": "math", "topic": "Foizlar", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "400 sonining 25% i nechaga teng?", "options": ["25", "50", "100", "200"], "correct_index": 2},
    {"id": "q_math_005", "subject": "math", "topic": "Trigonometriya", "difficulty": "medium", "source": "ai_generated",
     "text": "sin 30° ning qiymati nechaga teng?", "options": ["0", "0.5", "√2/2", "1"], "correct_index": 1},
    {"id": "q_math_006", "subject": "math", "topic": "Arifmetik progressiya", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Arifmetik progressiyaning 1-hadi 3, farqi 4 bo'lsa, 5-had nechaga teng?", "options": ["15", "17", "19", "21"], "correct_index": 2},
    {"id": "q_math_007", "subject": "math", "topic": "Geometrik progressiya", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Geometrik progressiyaning 1-hadi 2, q=3 bo'lsa, 4-had nechaga teng?", "options": ["18", "27", "54", "162"], "correct_index": 2},
    {"id": "q_math_008", "subject": "math", "topic": "Trigonometriya", "difficulty": "hard", "source": "dtm_2023", "year": 2023,
     "text": "cos 60° ning qiymati qanday?", "options": ["0", "0.5", "√3/2", "1"], "correct_index": 1},
    {"id": "q_math_009", "subject": "math", "topic": "Funksiyalar", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "f(x) = 2x + 3 bo'lsa, f(4) qanday?", "options": ["8", "10", "11", "14"], "correct_index": 2},
    {"id": "q_math_010", "subject": "math", "topic": "Tengsizliklar", "difficulty": "medium", "source": "dtm_2021", "year": 2021,
     "text": "2x − 4 > 0 tengsizlikning yechimi qanday?", "options": ["x > 4", "x > 2", "x < 2", "x < 4"], "correct_index": 1},
    {"id": "q_math_011", "subject": "math", "topic": "Ko'pburchaklar", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "To'g'ri to'rtburchakning perimetri 24 sm, eni 4 sm. Uzunligi nechaga teng?", "options": ["6", "8", "10", "16"], "correct_index": 2},
    {"id": "q_math_012", "subject": "math", "topic": "Aylana", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Radiusi 7 bo'lgan aylananing yuzi nechaga teng? (π ≈ 22/7)", "options": ["44", "154", "308", "49"], "correct_index": 1},
    {"id": "q_math_013", "subject": "math", "topic": "Daraja va ildiz", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "√144 ning qiymati nechaga teng?", "options": ["11", "12", "13", "14"], "correct_index": 1},
    {"id": "q_math_014", "subject": "math", "topic": "Foizlar", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "200 sonining 15% i nechaga teng?", "options": ["20", "25", "30", "40"], "correct_index": 2},
    {"id": "q_math_015", "subject": "math", "topic": "Logarifmlar", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "log₁₀(1000) ning qiymati nechaga teng?", "options": ["2", "3", "4", "10"], "correct_index": 1},
    {"id": "q_math_016", "subject": "math", "topic": "Vektorlar", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "a = (3, 4) vektorning moduli nechaga teng?", "options": ["3", "4", "5", "7"], "correct_index": 2},
    {"id": "q_math_017", "subject": "math", "topic": "Kvadrat tenglamalar", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "x² − 3x − 10 = 0 tenglamaning katta ildizi qanday?", "options": ["2", "5", "−2", "−5"], "correct_index": 1},
    {"id": "q_math_018", "subject": "math", "topic": "Kombinatorika", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "4 elementdan nechta 2-elementli kombinatsiya hosil qilish mumkin?", "options": ["4", "6", "8", "12"], "correct_index": 1},
    {"id": "q_math_019", "subject": "math", "topic": "Funksiyalar", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "y = x² funksiyasi qaysi nuqtada minimumga ega?", "options": ["x=1", "x=−1", "x=0", "x=2"], "correct_index": 2},
    {"id": "q_math_020", "subject": "math", "topic": "Tengsizliklar", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "x² − 4 < 0 tengsizlikning yechimi qanday?", "options": ["x > 2", "x < −2", "−2 < x < 2", "x < −2 yoki x > 2"], "correct_index": 2},
    {"id": "q_math_021", "subject": "math", "topic": "Ko'paytma formulalari", "difficulty": "medium", "source": "dtm_2021", "year": 2021,
     "text": "(a+b)² = ?", "options": ["a²+b²", "a²+2ab+b²", "a²−2ab+b²", "2a+2b"], "correct_index": 1},
    {"id": "q_math_022", "subject": "math", "topic": "Uchburchak", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "To'g'ri burchakli uchburchakda katetlar 3 va 4 bo'lsa, gipotenüza nechaga teng?", "options": ["5", "6", "7", "12"], "correct_index": 0},
    {"id": "q_math_021b", "subject": "math", "topic": "Arifmetik progressiya", "difficulty": "easy", "source": "dtm_2022", "year": 2022,
     "text": "2, 5, 8, 11, ... progressiyaning keyingi hadi nechaga teng?", "options": ["13", "14", "15", "16"], "correct_index": 1},
    {"id": "q_math_023", "subject": "math", "topic": "Daraja va ildiz", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "2³ × 2⁴ ning qiymati nechaga teng?", "options": ["2⁶", "2⁷", "2¹²", "4⁷"], "correct_index": 1},
    {"id": "q_math_024", "subject": "math", "topic": "Foizlar", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Narx 500 dan 600 ga oshdi. Necha foizga oshdi?", "options": ["10%", "15%", "20%", "25%"], "correct_index": 2},
    {"id": "q_math_025", "subject": "math", "topic": "Trigonometriya", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "tg 45° ning qiymati nechaga teng?", "options": ["0", "0.5", "1", "√3"], "correct_index": 2},
    {"id": "q_math_026", "subject": "math", "topic": "Integral", "difficulty": "hard", "source": "dtm_2023", "year": 2023,
     "text": "∫ 2x dx ning qiymati (C — doimiy)?", "options": ["2", "x²+C", "x²", "2x²+C"], "correct_index": 1},
    {"id": "q_math_027", "subject": "math", "topic": "Matritsa", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "2×2 matritsa determinanti |2 1; 3 4| nechaga teng?", "options": ["5", "8", "11", "14"], "correct_index": 0},
    {"id": "q_math_028", "subject": "math", "topic": "Ko'pburchaklar", "difficulty": "medium", "source": "dtm_2021", "year": 2021,
     "text": "Muntazam olti burchakning ichki burchaklari yig'indisi nechaga teng?", "options": ["540°", "720°", "900°", "1080°"], "correct_index": 1},
    {"id": "q_math_029", "subject": "math", "topic": "Ehtimollik", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Zarni otganda toq son tushish ehtimolligi nechaga teng?", "options": ["1/6", "1/3", "1/2", "2/3"], "correct_index": 2},
    {"id": "q_math_030", "subject": "math", "topic": "Funksiyalar", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "f(x) = 3x − 1 bo'lsa, f(0) qanday?", "options": ["-3", "-1", "0", "1"], "correct_index": 1},

    # ── TARIX (30) ──────────────────────────────────────────────────
    {"id": "q_hist_001", "subject": "history", "topic": "Amir Temur davri", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "Amir Temur qaysi yili Samarqandni o'z poytaxtiga aylantirdi?", "options": ["1370", "1380", "1395", "1405"], "correct_index": 0},
    {"id": "q_hist_002", "subject": "history", "topic": "Amir Temur davri", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Temuriylar sulolasining asoschisi kim?", "options": ["Ulug'bek", "Shahruh", "Amir Temur", "Boburshoh"], "correct_index": 2},
    {"id": "q_hist_003", "subject": "history", "topic": "Mustaqillik davri", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "O'zbekiston mustaqillikka qaysi yili erishdi?", "options": ["1989", "1990", "1991", "1992"], "correct_index": 2},
    {"id": "q_hist_004", "subject": "history", "topic": "Qadimgi davr", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "Yunon-Baqtriya davlati qachon barpo etilgan?", "options": ["mil.av. 250-yil", "mil.av. 150-yil", "mil.av. 50-yil", "mil. 100-yil"], "correct_index": 0},
    {"id": "q_hist_005", "subject": "history", "topic": "Jadidchilik", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Jadidchilik harakatining asosiy maqsadi nima edi?", "options": ["Siyosiy mustaqillik", "Ta'limni isloh qilish", "Harbiy kuch", "Savdo rivojlantirish"], "correct_index": 1},
    {"id": "q_hist_006", "subject": "history", "topic": "Sovet davri", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "O'zbekiston SSR qaysi yili tashkil topdi?", "options": ["1917", "1920", "1924", "1936"], "correct_index": 2},
    {"id": "q_hist_007", "subject": "history", "topic": "Qadimgi davr", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Buyuk Ipak yo'lining asosiy markazlaridan biri qaysi shahar edi?", "options": ["Buxoro", "Toshkent", "Samarqand", "Andijon"], "correct_index": 2},
    {"id": "q_hist_008", "subject": "history", "topic": "Amir Temur davri", "difficulty": "hard", "source": "dtm_2023", "year": 2023,
     "text": "Amir Temur qaysi davlatni mag'lub etib, uning sultonini asir oldi?", "options": ["Misr", "Hindiston", "Usmonli Turkiya", "Xitoy"], "correct_index": 2},
    {"id": "q_hist_009", "subject": "history", "topic": "Mustaqillik davri", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "O'zbekistonning birinchi Prezidenti kim?", "options": ["Shavkat Mirziyoyev", "Islam Karimov", "Yusupov", "Rashidov"], "correct_index": 1},
    {"id": "q_hist_010", "subject": "history", "topic": "Rus mustamlakachiligi", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Toshkent Rossiya tomonidan qachon bosib olingan?", "options": ["1865", "1875", "1885", "1895"], "correct_index": 0},
    {"id": "q_hist_011", "subject": "history", "topic": "O'rta asrlar", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Somoniylar davlati poytaxti qayerda bo'lgan?", "options": ["Samarqand", "Buxoro", "Xiva", "Marv"], "correct_index": 1},
    {"id": "q_hist_012", "subject": "history", "topic": "O'rta asrlar", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "Qoraxoniylar davlati qachon tashkil topdi?", "options": ["840-yil", "940-yil", "1040-yil", "840-yil atrofida"], "correct_index": 3},
    {"id": "q_hist_013", "subject": "history", "topic": "Jadidchilik", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "Jadidlar harakatiga kim asos solgan?", "options": ["Abdurauf Fitrat", "Mahmudxo'ja Behbudiy", "Munavvar Qori", "Hamza"], "correct_index": 1},
    {"id": "q_hist_014", "subject": "history", "topic": "Mustaqillik davri", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "O'zbekiston Konstitutsiyasi qaysi yil qabul qilingan?", "options": ["1991", "1992", "1993", "1995"], "correct_index": 1},
    {"id": "q_hist_015", "subject": "history", "topic": "Qadimgi davr", "difficulty": "easy", "source": "dtm_2022", "year": 2022,
     "text": "Xorazm davlatining qadimgi poytaxti qayerda bo'lgan?", "options": ["Urganch", "Ko'hna Urganch", "Xiva", "Kat"], "correct_index": 3},
    {"id": "q_hist_016", "subject": "history", "topic": "Sovet davri", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Sharof Rashidov O'zbekistonga qancha yil rahbarlik qildi?", "options": ["15 yil", "20 yil", "25 yil", "30 yil"], "correct_index": 2},
    {"id": "q_hist_017", "subject": "history", "topic": "Buyuk Ipak yo'li", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "Buyuk Ipak yo'li qaysi mamlakatni Xitoy bilan bog'lagan?", "options": ["Faqat O'rta Osiyoni", "O'rta Sharqni", "Yevropani", "Barcha yo'nalishlarni"], "correct_index": 3},
    {"id": "q_hist_018", "subject": "history", "topic": "Amir Temur davri", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Bibi Xonim masjidi kim tomonidan qurilgan?", "options": ["Ulug'bek", "Amir Temur", "Shahruh", "Mirzo Babur"], "correct_index": 1},
    {"id": "q_hist_019", "subject": "history", "topic": "O'rta asrlar", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Al-Xorazmiy qaysi asrda yashagan?", "options": ["7-asr", "8-asr", "9-asr", "10-asr"], "correct_index": 2},
    {"id": "q_hist_020", "subject": "history", "topic": "Mustaqillik davri", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "O'zbekiston BMTga qaysi yili a'zo bo'ldi?", "options": ["1991", "1992", "1993", "1994"], "correct_index": 1},
    {"id": "q_hist_021", "subject": "history", "topic": "Sovet davri", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "\"Paxta ishi\" SSSR davrida qaysi yillarda bo'lgan?", "options": ["1970-yillar", "1980-yillar", "1960-yillar", "1975-yillar"], "correct_index": 1},
    {"id": "q_hist_022", "subject": "history", "topic": "Qadimgi davr", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Zardushtiylik dini qayerda vujudga kelgan?", "options": ["Hindiston", "Eron", "Mesopotamiya", "O'rta Osiyo"], "correct_index": 3},
    {"id": "q_hist_023", "subject": "history", "topic": "O'rta asrlar", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "Ibn Sino (Avitsenna) qaysi asarda tibbiyot bilimlarini jamladi?", "options": ["Kitob al-Qonun", "Al-Jabr", "Ziji Ko'ragoniy", "Almagest"], "correct_index": 0},
    {"id": "q_hist_024", "subject": "history", "topic": "Rus mustamlakachiligi", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "Andijonda ko'tarilis qaysi yili bo'lgan?", "options": ["1895", "1898", "1905", "1916"], "correct_index": 1},
    {"id": "q_hist_025", "subject": "history", "topic": "Mustaqillik davri", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "O'zbekistonning milliy valyutasi nima deb ataladi?", "options": ["So'm", "Rubl", "Dollar", "Tanga"], "correct_index": 0},
    {"id": "q_hist_026", "subject": "history", "topic": "Amir Temur davri", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "Ulug'bek kim bo'lgan?", "options": ["Amir Temur o'g'li", "Amir Temur nabirasi", "Boburning otasi", "Somoniy hukmdori"], "correct_index": 1},
    {"id": "q_hist_027", "subject": "history", "topic": "Sovet davri", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "2-Jahon urushi O'zbekistonga qanday ta'sir ko'rsatdi?", "options": ["Sanoat ko'chdi", "Aholisi kamaydi", "Mustaqillik e'lon qilindi", "Hududlar qo'shildi"], "correct_index": 0},
    {"id": "q_hist_028", "subject": "history", "topic": "Qadimgi davr", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Kushon podsholigi poytaxti qayerda bo'lgan?", "options": ["Termiz", "Taxila", "Baqtra", "Kapisa"], "correct_index": 2},
    {"id": "q_hist_029", "subject": "history", "topic": "O'rta asrlar", "difficulty": "easy", "source": "dtm_2022", "year": 2022,
     "text": "Alisher Navoiy qaysi podsho saroyida xizmat qilgan?", "options": ["Ulug'bek", "Husayn Boyqaro", "Shahruh", "Amir Temur"], "correct_index": 1},
    {"id": "q_hist_030", "subject": "history", "topic": "Mustaqillik davri", "difficulty": "medium", "source": "dtm_2021", "year": 2021,
     "text": "O'zbekiston Respublikasining davlat bayrog'i qachon tasdiqlangan?", "options": ["1991 yil 18-noyabr", "1992 yil 8-dekabr", "1991 yil 31-avgust", "1993 yil 1-yanvar"], "correct_index": 0},

    # ── ONA TILI (30) ───────────────────────────────────────────────
    {"id": "q_uzb_001", "subject": "uzbek", "topic": "Imlo qoidalari", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "Qaysi so'z to'g'ri yozilgan?", "options": ["kitob", "kitap", "kittob", "kitoob"], "correct_index": 0},
    {"id": "q_uzb_002", "subject": "uzbek", "topic": "Gap bo'laklari", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "'O'quvchi dars o'qiyapti' gapida ega qaysi so'z?", "options": ["dars", "o'qiyapti", "O'quvchi", "o'q"], "correct_index": 2},
    {"id": "q_uzb_003", "subject": "uzbek", "topic": "So'z turkumlari", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "'Chiroyli' so'zi qaysi so'z turkumiga kiradi?", "options": ["Ot", "Fe'l", "Sifat", "Ravish"], "correct_index": 2},
    {"id": "q_uzb_004", "subject": "uzbek", "topic": "Adabiyot", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "Alisher Navoiyning eng mashhur asari qaysi?", "options": ["Farhod va Shirin", "Xamsa", "Layli va Majnun", "Saddi Iskandariy"], "correct_index": 1},
    {"id": "q_uzb_005", "subject": "uzbek", "topic": "Punktuatsiya", "difficulty": "easy", "source": "ai_generated",
     "text": "Undalma gapda qanday ajratiladi?", "options": ["Nuqta bilan", "Vergul bilan", "Tire bilan", "Ikki nuqta bilan"], "correct_index": 1},
    {"id": "q_uzb_006", "subject": "uzbek", "topic": "So'z turkumlari", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "Qaysi so'z ot turkumiga kiradi?", "options": ["yurmoq", "tez", "uy", "lekin"], "correct_index": 2},
    {"id": "q_uzb_007", "subject": "uzbek", "topic": "Fe'l zamonlari", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "'Bordi' fe'li qaysi zamonga oid?", "options": ["Hozirgi zamon", "O'tgan zamon", "Kelasi zamon", "Buyruq mayili"], "correct_index": 1},
    {"id": "q_uzb_008", "subject": "uzbek", "topic": "Gap bo'laklari", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "'U kecha keldi' gapida kesim qaysi so'z?", "options": ["U", "kecha", "keldi", "kech"], "correct_index": 2},
    {"id": "q_uzb_009", "subject": "uzbek", "topic": "Imlo qoidalari", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Qo'shimcha qo'shilganda o' harfi o'zgarmaydigan so'z qaysi?", "options": ["ko'z", "so'z", "bo'z", "to'y"], "correct_index": 3},
    {"id": "q_uzb_010", "subject": "uzbek", "topic": "Adabiyot", "difficulty": "medium", "source": "dtm_2021", "year": 2021,
     "text": "Abdulla Qodiriy qaysi roman muallifi?", "options": ["Sarob", "O'tkan kunlar", "Shum bola", "Kecha va kunduz"], "correct_index": 1},
    {"id": "q_uzb_011", "subject": "uzbek", "topic": "So'z turkumlari", "difficulty": "hard", "source": "dtm_2023", "year": 2023,
     "text": "'Endi' so'zi qaysi so'z turkumiga kiradi?", "options": ["Ot", "Sifat", "Ravish", "Bog'lovchi"], "correct_index": 2},
    {"id": "q_uzb_012", "subject": "uzbek", "topic": "Punktuatsiya", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Qaysi gapda vergul to'g'ri ishlatilgan?", "options": ["Men, sen va u.", "Kitob, daftar, qalam bor.", "Men, boraman.", "U, keldi."], "correct_index": 1},
    {"id": "q_uzb_013", "subject": "uzbek", "topic": "Gap bo'laklari", "difficulty": "hard", "source": "dtm_2023", "year": 2023,
     "text": "Ikkinchi darajali gap bo'lagi bo'lmagan qaysi?", "options": ["To'ldiruvchi", "Aniqlovchi", "Ega", "Hol"], "correct_index": 2},
    {"id": "q_uzb_014", "subject": "uzbek", "topic": "Adabiyot", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "Hamza Hakimzoda Niyoziy qaysi asarni yozgan?", "options": ["Padarkush", "O'tkan kunlar", "Sarob", "Botir Qoraboy"], "correct_index": 0},
    {"id": "q_uzb_015", "subject": "uzbek", "topic": "Fe'l zamonlari", "difficulty": "easy", "source": "dtm_2022", "year": 2022,
     "text": "'Boraman' fe'li qaysi zamonga oid?", "options": ["O'tgan", "Hozirgi", "Kelasi", "Buyruq"], "correct_index": 2},
    {"id": "q_uzb_016", "subject": "uzbek", "topic": "Imlo qoidalari", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Qaysi so'zda talaffuz va yozilish bir xil?", "options": ["tarvuz", "baxt", "maktab", "davlat"], "correct_index": 1},
    {"id": "q_uzb_017", "subject": "uzbek", "topic": "So'z turkumlari", "difficulty": "medium", "source": "dtm_2022", "year": 2022,
     "text": "Olmosh nima?", "options": ["Narsa nomini bildiradi", "Ot, sifat, sonning o'rnida keladi", "Harakat bildiradi", "Belgi bildiradi"], "correct_index": 1},
    {"id": "q_uzb_018", "subject": "uzbek", "topic": "Adabiyot", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "Cho'lpon qaysi janrda asarlar yozgan?", "options": ["Faqat she'r", "Faqat roman", "She'r va roman", "Faqat drama"], "correct_index": 2},
    {"id": "q_uzb_019", "subject": "uzbek", "topic": "Gap turlari", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Qo'shma gap necha turga bo'linadi?", "options": ["2", "3", "4", "5"], "correct_index": 1},
    {"id": "q_uzb_020", "subject": "uzbek", "topic": "Punktuatsiya", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "To'g'ri nutqdan oldin qanday belgi qo'yiladi?", "options": ["Vergul", "Nuqta", "Ikki nuqta", "Tire"], "correct_index": 2},
    {"id": "q_uzb_021", "subject": "uzbek", "topic": "So'z turkumlari", "difficulty": "easy", "source": "dtm_2021", "year": 2021,
     "text": "Qaysi so'z fe'l turkumiga kiradi?", "options": ["baland", "tezlik", "yugurmoq", "yaxshi"], "correct_index": 2},
    {"id": "q_uzb_022", "subject": "uzbek", "topic": "Gap bo'laklari", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "'Katta uy' birikmасida 'katta' qaysi bo'lak?", "options": ["Ega", "Kesim", "Aniqlovchi", "To'ldiruvchi"], "correct_index": 2},
    {"id": "q_uzb_023", "subject": "uzbek", "topic": "Imlo qoidalari", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "Qo'shimcha qo'shganda undosh tovush ikkilanmaydigan so'z?", "options": ["qizil+lik", "uzun+lik", "yaxshi+lik", "baland+lik"], "correct_index": 3},
    {"id": "q_uzb_024", "subject": "uzbek", "topic": "Adabiyot", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "G'afur G'ulomning mashhur she'ri qaysi?", "options": ["Seni sevaman", "Men o'zbek", "Ona", "Vatan"], "correct_index": 1},
    {"id": "q_uzb_025", "subject": "uzbek", "topic": "Fe'l zamonlari", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "Shart mayili qanday yasaladi?", "options": ["-di qo'shimchasi", "-sa qo'shimchasi", "-ydi qo'shimchasi", "-moq qo'shimchasi"], "correct_index": 1},
    {"id": "q_uzb_026", "subject": "uzbek", "topic": "Gap turlari", "difficulty": "easy", "source": "dtm_2022", "year": 2022,
     "text": "Buyruq gapning oxiriga qanday belgi qo'yiladi?", "options": ["Nuqta", "Undov", "So'roq", "Nuqta yoki undov"], "correct_index": 3},
    {"id": "q_uzb_027", "subject": "uzbek", "topic": "So'z turkumlari", "difficulty": "medium", "source": "dtm_2023", "year": 2023,
     "text": "Bog'lovchi so'zning vazifasi nima?", "options": ["Narsa bildiradi", "Belgi bildiradi", "Gap bo'laklarini bog'laydi", "Harakat bildiradi"], "correct_index": 2},
    {"id": "q_uzb_028", "subject": "uzbek", "topic": "Adabiyot", "difficulty": "hard", "source": "dtm_2022", "year": 2022,
     "text": "Oybek qaysi romanini yozgan?", "options": ["O'tkan kunlar", "Qutlug' qon", "Sarob", "Kecha va kunduz"], "correct_index": 1},
    {"id": "q_uzb_029", "subject": "uzbek", "topic": "Gap bo'laklari", "difficulty": "hard", "source": "dtm_2021", "year": 2021,
     "text": "Ravish hol gapda nimani ifodalaydi?", "options": ["Narsani", "Harakat belgisini", "Belgini", "Shaxsni"], "correct_index": 1},
    {"id": "q_uzb_030", "subject": "uzbek", "topic": "Imlo qoidalari", "difficulty": "easy", "source": "dtm_2023", "year": 2023,
     "text": "Qaysi so'z bosh harf bilan yoziladi?", "options": ["toshkent", "kitob", "daftar", "qalam"], "correct_index": 0},
]

_question_store = {q["id"]: q for q in DEMO_QUESTIONS}


@router.get("/mock")
async def get_mock_questions(
    subjects: str = Query("math,history,uzbek"),
    count: int = Query(90, ge=10, le=90),
):
    subject_list = [s.strip() for s in subjects.split(",")]
    per_subject = count // len(subject_list)

    all_qs = DEMO_QUESTIONS + _load_ingested()
    result = []
    for subj in subject_list:
        subj_qs = [q for q in all_qs if q["subject"] == subj]
        result.extend(subj_qs[:per_subject])

    return {"questions": result, "total": len(result)}


@router.get("/personalized")
async def get_personalized_questions(
    topic: str = Query(...),
    subject: str = Query(...),
    count: int = Query(5, ge=3, le=15),
    difficulty: str = Query("medium"),
):
    # Also check ingested questions
    all_qs = DEMO_QUESTIONS + _load_ingested()
    existing = [
        q for q in all_qs
        if q["subject"] == subject and q["topic"].lower() == topic.lower()
    ]

    if len(existing) >= count:
        return {"questions": existing[:count], "source": "database", "total": count}

    # Generate the remaining questions via AI (Groq is fast enough)
    needed = count - len(existing)
    try:
        ai_qs = await generate_questions(Subject(subject), topic, needed, Difficulty(difficulty))
        for q in ai_qs:
            q["id"] = f"ai_{uuid.uuid4().hex[:8]}"
            q["subject"] = subject
            q["topic"] = topic
            q["source"] = "ai_generated"
            _question_store[q["id"]] = q
        combined = existing + ai_qs
        return {"questions": combined[:count], "source": "mixed", "total": len(combined[:count])}
    except Exception:
        # Only return questions that actually match the topic — never mix topics
        if existing:
            return {"questions": existing[:count], "source": "database", "total": len(existing[:count])}
        raise HTTPException(
            status_code=404,
            detail=f"Bu mavzu bo'yicha savollar topilmadi: {topic}"
        )


@router.get("/{question_id}")
async def get_question(question_id: str):
    q = _question_store.get(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q
