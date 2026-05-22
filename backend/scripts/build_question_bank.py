"""
Pre-built question bank for Ona tili and Tarix
Run: venv\\Scripts\\python scripts\\build_question_bank.py
"""
import json, uuid
from pathlib import Path
from collections import Counter

OUTPUT = Path(__file__).parent.parent / "data" / "questions.json"

def qid(): return f"pre_{uuid.uuid4().hex[:10]}"

QUESTIONS = [

# ══════════════════════════════════════════════════════════════
# ONA TILI — Gap bo'laklari
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"easy","source":"pre_built",
 "text":"'O'quvchi kitob o'qiyapti' gapida ega qaysi so'z?",
 "options":["kitob","o'qiyapti","O'quvchi","o'q"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"easy","source":"pre_built",
 "text":"Kesim gapning qaysi bo'lagi hisoblanadi?",
 "options":["Ikkinchi darajali","Bosh bo'lak","Yordamchi bo'lak","Undalma"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"easy","source":"pre_built",
 "text":"'Katta uy' birikmasida 'katta' so'zi qaysi bo'lak?",
 "options":["Ega","Aniqlovchi","Kesim","Hol"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"medium","source":"pre_built",
 "text":"'Tez yurdi' gapida 'tez' qaysi bo'lak?",
 "options":["Aniqlovchi","To'ldiruvchi","Hol","Ega"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"medium","source":"pre_built",
 "text":"To'ldiruvchi qaysi savolga javob beradi?",
 "options":["Qanday?","Kimni? Nimani?","Qayerda?","Qachon?"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"medium","source":"pre_built",
 "text":"Undalma gapning qaysi bo'lagi hisoblanadi?",
 "options":["Bosh bo'lak","Ikkinchi darajali bo'lak","Bo'lak emas","Kesim"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"hard","source":"pre_built",
 "text":"'Kitobni o'qidim' gapida 'kitobni' qaysi bo'lak?",
 "options":["Ega","Kesim","To'ldiruvchi","Hol"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"Gap bo'laklari","difficulty":"hard","source":"pre_built",
 "text":"Ikkinchi darajali gap bo'laklari nechtadan iborat?",
 "options":["2 ta","3 ta","4 ta","5 ta"],"correct_index":2},

# ══════════════════════════════════════════════════════════════
# ONA TILI — So'z turkumlari
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"easy","source":"pre_built",
 "text":"'Chiroyli' so'zi qaysi so'z turkumiga kiradi?",
 "options":["Ot","Fe'l","Sifat","Ravish"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"easy","source":"pre_built",
 "text":"'O'qimoq' so'zi qaysi so'z turkumi?",
 "options":["Ot","Sifat","Fe'l","Olmosh"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"easy","source":"pre_built",
 "text":"'Besh' so'zi qaysi so'z turkumiga kiradi?",
 "options":["Ot","Son","Sifat","Ravish"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"easy","source":"pre_built",
 "text":"Sifat qaysi savolga javob beradi?",
 "options":["Kim?","Nima?","Qanday?","Qayerda?"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"medium","source":"pre_built",
 "text":"'Men' so'zi qaysi olmosh turi?",
 "options":["Ko'rsatish olmoshi","So'roq olmoshi","Shaxs-son olmoshi","Bo'lishsizlik olmoshi"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"medium","source":"pre_built",
 "text":"Ravish qaysi so'z turkumining belgisini bildiradi?",
 "options":["Ot","Sifat","Fe'l","Son"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"medium","source":"pre_built",
 "text":"'Tez' so'zi gapda qaysi turkum vazifasini bajarishi mumkin?",
 "options":["Faqat sifat","Faqat ravish","Sifat ham, ravish ham","Faqat ot"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"hard","source":"pre_built",
 "text":"Modal so'zlar qaysi so'z turkumiga kiradi?",
 "options":["Mustaqil so'zlar","Yordamchi so'zlar","Modal so'zlar alohida turkum","Fe'l"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"So'z turkumlari","difficulty":"hard","source":"pre_built",
 "text":"'Ko'p', 'oz', 'bir necha' qaysi son turi?",
 "options":["Sanoq son","Tartib son","Jamlovchi son","Taxminiy son"],"correct_index":3},

# ══════════════════════════════════════════════════════════════
# ONA TILI — Imlo qoidalari
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"uzbek","topic":"Imlo qoidalari","difficulty":"easy","source":"pre_built",
 "text":"Qaysi so'z to'g'ri yozilgan?",
 "options":["kitob","kitap","kittob","kitoob"],"correct_index":0},
{"id":qid(),"subject":"uzbek","topic":"Imlo qoidalari","difficulty":"easy","source":"pre_built",
 "text":"Bosh harf bilan yoziladigan so'z qaysi?",
 "options":["maktab","toshkent","Toshkent","kitob"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"Imlo qoidalari","difficulty":"medium","source":"pre_built",
 "text":"'O'zbek' so'zida nechta o'ziga xos harf bor?",
 "options":["1 ta","2 ta","3 ta","4 ta"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Imlo qoidalari","difficulty":"medium","source":"pre_built",
 "text":"Qo'shma so'zlar qanday yoziladi?",
 "options":["Har doim qo'shib","Har doim ajratib","Har doim defis bilan","Vaziyatga qarab"],"correct_index":3},
{"id":qid(),"subject":"uzbek","topic":"Imlo qoidalari","difficulty":"medium","source":"pre_built",
 "text":"'Sog'liq' so'zidagi tutuq belgisi qanday vazifani bajaradi?",
 "options":["Estetik","Talaffuzni ko'rsatish","Harfni ajratish","Qoidaga ko'ra emas"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Imlo qoidalari","difficulty":"hard","source":"pre_built",
 "text":"Qaysi holatda so'z defis bilan yoziladi?",
 "options":["Barcha qo'shma so'zlarda","Takroriy so'zlarda","Faqat otlarda","Hech qachon"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Imlo qoidalari","difficulty":"hard","source":"pre_built",
 "text":"'Ota-ona' so'zi qaysi usulda yoziladi?",
 "options":["Qo'shib","Ajratib","Defis bilan","Ikki xil yoziladi"],"correct_index":2},

# ══════════════════════════════════════════════════════════════
# ONA TILI — Morfologiya
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"uzbek","topic":"Morfologiya","difficulty":"easy","source":"pre_built",
 "text":"So'z negizi va qo'shimchadan iborat bo'lgan qism nima deyiladi?",
 "options":["O'zak","Asos","Qo'shimcha","Morfema"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Morfologiya","difficulty":"easy","source":"pre_built",
 "text":"'O'quvchi' so'zida nechta morfema bor?",
 "options":["1 ta","2 ta","3 ta","4 ta"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"Morfologiya","difficulty":"medium","source":"pre_built",
 "text":"So'z yasovchi qo'shimchalar qaysi vazifani bajaradi?",
 "options":["Yangi so'z yasaydi","Gap bo'laklarini bog'laydi","So'z ma'nosini o'zgartiradi","Kelishik bildiradi"],"correct_index":0},
{"id":qid(),"subject":"uzbek","topic":"Morfologiya","difficulty":"medium","source":"pre_built",
 "text":"'-lik' qo'shimchasi qaysi so'z turkumini yasaydi?",
 "options":["Fe'l","Ravish","Ot","Sifat"],"correct_index":2},
{"id":qid(),"subject":"uzbek","topic":"Morfologiya","difficulty":"hard","source":"pre_built",
 "text":"'Ishlamoqchi' so'zi qaysi fe'l shakli?",
 "options":["O'tgan zamon","Hozirgi zamon","Kelasi zamon","Maqsad mayli"],"correct_index":3},
{"id":qid(),"subject":"uzbek","topic":"Morfologiya","difficulty":"hard","source":"pre_built",
 "text":"Kelishik qo'shimchalari nechtadan iborat?",
 "options":["4 ta","5 ta","6 ta","7 ta"],"correct_index":2},

# ══════════════════════════════════════════════════════════════
# ONA TILI — Sintaksis
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"uzbek","topic":"Sintaksis","difficulty":"easy","source":"pre_built",
 "text":"Sodda gap nima?",
 "options":["Bir kesimli gap","Ikki va undan ortiq kesimli gap","Ko'p bo'lakli gap","Yoyiq gap"],"correct_index":0},
{"id":qid(),"subject":"uzbek","topic":"Sintaksis","difficulty":"easy","source":"pre_built",
 "text":"Qo'shma gap qanday hosil bo'ladi?",
 "options":["Bir ega bilan","Ikki va undan ko'p sodda gapdan","Faqat bog'lovchisiz","Bir kesim bilan"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Sintaksis","difficulty":"medium","source":"pre_built",
 "text":"Ergashgan qo'shma gapda qaysi bo'lak bosh gap?",
 "options":["Ergash gap","Bosh gap","Ikkalasi ham","Hech biri emas"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Sintaksis","difficulty":"medium","source":"pre_built",
 "text":"'Ali keldi, Vali ketdi' — bu qanday gap?",
 "options":["Sodda gap","Bog'langan qo'shma gap","Ergashgan qo'shma gap","Shart mayli gap"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Sintaksis","difficulty":"hard","source":"pre_built",
 "text":"Payt ergash gapi qaysi savolga javob beradi?",
 "options":["Qayerda?","Qachon?","Qanday?","Nima uchun?"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Sintaksis","difficulty":"hard","source":"pre_built",
 "text":"'U shunday o'qidiki, hamma hayron qoldi' — ergash gap turi?",
 "options":["Payt","Sabab","Natija","Shart"],"correct_index":2},

# ══════════════════════════════════════════════════════════════
# ONA TILI — Adabiyot
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"uzbek","topic":"Adabiyot","difficulty":"easy","source":"pre_built",
 "text":"Alisher Navoiy qaysi asrda yashagan?",
 "options":["XIV asr","XV asr","XVI asr","XVII asr"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Adabiyot","difficulty":"easy","source":"pre_built",
 "text":"'Xamsa'ni kim yozgan?",
 "options":["Bobur","Navoiy","Fuzuliy","Lutfiy"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Adabiyot","difficulty":"easy","source":"pre_built",
 "text":"Abdulla Qodiriy qaysi asarning muallifi?",
 "options":["Sarob","O'tgan kunlar","Shum bola","Kecha va kunduz"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Adabiyot","difficulty":"medium","source":"pre_built",
 "text":"'Farhod va Shirin' dostoni kimga bag'ishlangan?",
 "options":["Husayn Boyqaroga","Mohim begimga","Gavharshodbegimga","Zebunnisoga"],"correct_index":0},
{"id":qid(),"subject":"uzbek","topic":"Adabiyot","difficulty":"medium","source":"pre_built",
 "text":"G'azal she'r turining asosiy xususiyati?",
 "options":["Har bandi 4 misra","Radif va maqta","Qofiyalanmagan misralar","Faqat lirik mazmunga ega"],"correct_index":1},
{"id":qid(),"subject":"uzbek","topic":"Adabiyot","difficulty":"hard","source":"pre_built",
 "text":"'Lison ut-tayr' asarining boshqa nomi?",
 "options":["Xamsa","Mantiq ut-tayr","Farhod va Shirin","Mahbub ul-qulub"],"correct_index":1},

# ══════════════════════════════════════════════════════════════
# TARIX — Mustaqillik davri
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"history","topic":"Mustaqillik davri","difficulty":"easy","source":"pre_built",
 "text":"O'zbekiston mustaqilligini qaysi yili e'lon qildi?",
 "options":["1990","1991","1992","1993"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Mustaqillik davri","difficulty":"easy","source":"pre_built",
 "text":"O'zbekistonning birinchi Prezidenti kim?",
 "options":["Shavkat Mirziyoyev","Islom Karimov","Nursulton Nazarboyev","Askar Akayev"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Mustaqillik davri","difficulty":"easy","source":"pre_built",
 "text":"O'zbekiston Konstitutsiyasi qaysi yili qabul qilingan?",
 "options":["1991","1992","1993","1995"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Mustaqillik davri","difficulty":"medium","source":"pre_built",
 "text":"O'zbekiston qaysi tashkilotga 1992-yilda qabul qilindi?",
 "options":["NATO","BMT","SHOS","MDH"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Mustaqillik davri","difficulty":"medium","source":"pre_built",
 "text":"O'zbekistonning milliy valyutasi — so'm qaysi yili muomalaga kiritildi?",
 "options":["1991","1993","1994","1995"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Mustaqillik davri","difficulty":"hard","source":"pre_built",
 "text":"O'zbekiston Respublikasi Oliy Majlisi necha palatadan iborat?",
 "options":["1","2","3","4"],"correct_index":1},

# ══════════════════════════════════════════════════════════════
# TARIX — Amir Temur davri
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"history","topic":"Amir Temur davri","difficulty":"easy","source":"pre_built",
 "text":"Amir Temur qaysi yili Samarqandni poytaxt qildi?",
 "options":["1360","1370","1380","1395"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Amir Temur davri","difficulty":"easy","source":"pre_built",
 "text":"Bibixonim masjidi qaysi shahrida joylashgan?",
 "options":["Buxoro","Toshkent","Samarqand","Qo'qon"],"correct_index":2},
{"id":qid(),"subject":"history","topic":"Amir Temur davri","difficulty":"easy","source":"pre_built",
 "text":"Temuriylar sulolasining asoschisi kim?",
 "options":["Ulug'bek","Shahruh","Amir Temur","Boburshoh"],"correct_index":2},
{"id":qid(),"subject":"history","topic":"Amir Temur davri","difficulty":"medium","source":"pre_built",
 "text":"Amir Temur qachon vafot etdi?",
 "options":["1400","1405","1410","1415"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Amir Temur davri","difficulty":"medium","source":"pre_built",
 "text":"Ulug'bek rasadxonasi qaysi shaharda qurilgan?",
 "options":["Buxoro","Hirot","Samarqand","Toshkent"],"correct_index":2},
{"id":qid(),"subject":"history","topic":"Amir Temur davri","difficulty":"hard","source":"pre_built",
 "text":"Temur tuzuklari asarini kim yozgan?",
 "options":["Ulug'bek","Shahruh","Amir Temur","Abdurazzoq Samarqandiy"],"correct_index":2},
{"id":qid(),"subject":"history","topic":"Amir Temur davri","difficulty":"hard","source":"pre_built",
 "text":"Anqara jangi qaysi yili bo'lib o'tdi?",
 "options":["1395","1402","1404","1405"],"correct_index":1},

# ══════════════════════════════════════════════════════════════
# TARIX — Sovet davri
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"history","topic":"Sovet davri","difficulty":"easy","source":"pre_built",
 "text":"O'zbekiston SSR qaysi yili tashkil topdi?",
 "options":["1920","1924","1930","1936"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Sovet davri","difficulty":"easy","source":"pre_built",
 "text":"Sovet davrida O'zbekistonda asosiy qishloq xo'jaligi mahsuloti?",
 "options":["Bug'doy","Paxta","Sholi","Kartoshka"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Sovet davri","difficulty":"medium","source":"pre_built",
 "text":"'Jadidlar' harakati nima maqsadda paydo bo'ldi?",
 "options":["Mustaqillik uchun","Ta'lim islohotlari uchun","Diniy harakatlar uchun","Iqtisodiy islohotlar uchun"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Sovet davri","difficulty":"medium","source":"pre_built",
 "text":"Basmachi harakati qaysi davr bilan bog'liq?",
 "options":["1900-1910","1918-1930","1941-1945","1960-1970"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Sovet davri","difficulty":"hard","source":"pre_built",
 "text":"O'zbekistonda quvg'inlar ('repressiya') eng kuchli bo'lgan yillar?",
 "options":["1920-1925","1937-1938","1945-1950","1953-1960"],"correct_index":1},

# ══════════════════════════════════════════════════════════════
# TARIX — Qadimgi O'zbek davlatlari
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"history","topic":"Qadimgi O'zbek davlatlari","difficulty":"easy","source":"pre_built",
 "text":"Qadimgi Xorazm davlati qaysi hududda joylashgan?",
 "options":["Farg'ona vodiysi","Amudaryo deltasi","Zarafshon vodiysi","Qashqadaryo"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Qadimgi O'zbek davlatlari","difficulty":"easy","source":"pre_built",
 "text":"Yunon manbalarida O'rta Osiyo qanday nomlangan?",
 "options":["Turon","Baqtriya","Transoksiana","Sogdiana"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Qadimgi O'zbek davlatlari","difficulty":"medium","source":"pre_built",
 "text":"Kushon podsholigi qaysi yillarda mavjud bo'lgan?",
 "options":["V-III asrlar mil.avv.","I-IV asrlar mil.","VII-IX asrlar","X-XII asrlar"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Qadimgi O'zbek davlatlari","difficulty":"medium","source":"pre_built",
 "text":"Samoniylar davlatining poytaxti qayerda edi?",
 "options":["Samarqand","Buxoro","Urganch","Termiz"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Qadimgi O'zbek davlatlari","difficulty":"hard","source":"pre_built",
 "text":"Qoraxoniylar sulolasi qaysi xalq tomonidan tashkil etilgan?",
 "options":["Arablar","Forslar","Turk qabilalari","Mo'g'ullar"],"correct_index":2},
{"id":qid(),"subject":"history","topic":"Qadimgi O'zbek davlatlari","difficulty":"hard","source":"pre_built",
 "text":"Al-Xorazmiy qaysi sohadagi olim?",
 "options":["Tibbiyot","Matematika va astronomiya","Falsafa","Tarix"],"correct_index":1},

# ══════════════════════════════════════════════════════════════
# TARIX — Ikkinchi Jahon urushi
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"history","topic":"Ikkinchi Jahon urushi","difficulty":"easy","source":"pre_built",
 "text":"Ikkinchi Jahon urushi qaysi yili boshlandi?",
 "options":["1937","1939","1941","1942"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Ikkinchi Jahon urushi","difficulty":"easy","source":"pre_built",
 "text":"O'zbekistondan urushga necha million kishi safarbar qilindi?",
 "options":["500 ming","1 million","1,5 million","2 million"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Ikkinchi Jahon urushi","difficulty":"medium","source":"pre_built",
 "text":"Urush yillarida O'zbekistonga ko'chirilgan zavodlar nima ishlab chiqargan?",
 "options":["Oziq-ovqat","Harbiy texnika va qurol-yarog'","Paxta","Dorivor o'simliklar"],"correct_index":1},
{"id":qid(),"subject":"history","topic":"Ikkinchi Jahon urushi","difficulty":"medium","source":"pre_built",
 "text":"O'zbek generali Sobir Rahimov qaysi jangda halok bo'ldi?",
 "options":["Stalingrad","Kursk","Shaulyay","Berlin"],"correct_index":2},
{"id":qid(),"subject":"history","topic":"Ikkinchi Jahon urushi","difficulty":"hard","source":"pre_built",
 "text":"Urush davrida Toshkentda joylashtirilgan yirik sanoat korxonasi?",
 "options":["Chirchiq elektrkimyo zavodi","Toshkent aviatsiya zavodi","O'zbekiston metall zavodi","Angren ko'mir koni"],"correct_index":1},

# ══════════════════════════════════════════════════════════════
# MATEMATIKA — Kvadrat tenglamalar  (answers: C,B,D,D,C,C,B,D,C,D)
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"x²-5x+6=0 tenglamaning yechimlarini toping.",
 "options":["x=1, x=6","x=-2, x=-3","x=2, x=3","x=1, x=-6"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"x²-4=0 tenglamaning yechimi qaysi?",
 "options":["x=4","x=±2","x=2","x=-4"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"2x²+3x-2=0 tenglamaning yechimlarini toping.",
 "options":["x=-2, x=1/2","x=2, x=-1/2","x=1, x=-2","x=1/2, x=-2"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"x²+2x+1=0 tenglamaning yechimi?",
 "options":["x=1","x=-2","x=2","x=-1"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"Kvadrat tenglamaning diskriminanti D<0 bo'lsa necha ta haqiqiy yechimi bor?",
 "options":["1 ta","2 ta","0 ta","Cheksiz"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"x²-9=0 tenglamaning yechimlarining yig'indisi?",
 "options":["9","-9","0","3"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"x²-7x+12=0 tenglamadagi katta yechim qaysi?",
 "options":["3","4","6","7"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"ax²+bx+c=0 tenglamaning diskriminanti qanday hisoblanadi?",
 "options":["b²+4ac","b²-2ac","2b²-4ac","b²-4ac"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"x²-6x+5=0 tenglamaning kichik yechimi?",
 "options":["5","3","1","6"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Kvadrat tenglamalar","difficulty":"hard","source":"pre_built",
 "text":"x²+4x+4=0 tenglamaning yechimi?",
 "options":["x=2","x=4","x=1","x=-2"],"correct_index":3},

# ══════════════════════════════════════════════════════════════
# MATEMATIKA — Chiziqli tenglamalar sistemasi  (answers: D,C,C,C,A,B,D,C,B,D)
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"easy","source":"pre_built",
 "text":"{x+y=5, x-y=1} sistemaning yechimi?",
 "options":["x=1, y=4","x=2, y=3","x=4, y=1","x=3, y=2"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"easy","source":"pre_built",
 "text":"{2x+y=7, x+y=4} sistemaning x qiymati?",
 "options":["1","2","3","4"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"easy","source":"pre_built",
 "text":"{x+2y=8, x-y=2} sistemaning y qiymati?",
 "options":["1","3","2","4"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"easy","source":"pre_built",
 "text":"Ikki noma'lumli chiziqli tenglamalar sistemasi necha xil usulda yechiladi?",
 "options":["1","2","3","4"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"medium","source":"pre_built",
 "text":"{3x+2y=12, x+y=5} sistemaning y qiymati?",
 "options":["3","4","2","5"],"correct_index":0},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"medium","source":"pre_built",
 "text":"{x+y=10, 2x-y=5} sistemaning x qiymati?",
 "options":["4","5","6","7"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"medium","source":"pre_built",
 "text":"{2x+3y=16, x+y=6} sistemaning yechimi?",
 "options":["x=1, y=5","x=3, y=3","x=4, y=2","x=2, y=4"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"medium","source":"pre_built",
 "text":"{x+y=7, 2x+2y=14} sistema qanday sistemaga misol?",
 "options":["Yechimi yo'q sistema","Yagona yechimli sistema","Cheksiz yechimli sistema","Qarama-qarshi sistema"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"hard","source":"pre_built",
 "text":"{4x-y=9, x+y=6} sistemaning y qiymati?",
 "options":["2","3","5","4"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Chiziqli tenglamalar sistemasi","difficulty":"hard","source":"pre_built",
 "text":"{3x+y=11, x-y=1} sistemaning yechimi?",
 "options":["x=1, y=8","x=2, y=5","x=4, y=-1","x=3, y=2"],"correct_index":3},

# ══════════════════════════════════════════════════════════════
# MATEMATIKA — Chiziqli tengsizliklar  (answers: C,B,D,D,C,A,C,B,A,C)
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"easy","source":"pre_built",
 "text":"2x-4>0 tengsizlikni yeching.",
 "options":["x<2","x≤2","x>2","x≥2"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"easy","source":"pre_built",
 "text":"x+3<7 tengsizlikning yechimi?",
 "options":["x>4","x<4","x>-4","x<-4"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"easy","source":"pre_built",
 "text":"-3x≤9 tengsizlikni yeching.",
 "options":["x≤3","x≤-3","x>-3","x≥-3"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"easy","source":"pre_built",
 "text":"5x-10≥0 tengsizlikning yechimi?",
 "options":["x<2","x≤2","x>2","x≥2"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"medium","source":"pre_built",
 "text":"|x|<3 tengsizlikning yechimi?",
 "options":["x<3","x>-3","-3<x<3","x<-3 yoki x>3"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"medium","source":"pre_built",
 "text":"3x+6>0 tengsizlikning yechimi?",
 "options":["x>-2","x<-2","x>2","x<2"],"correct_index":0},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"medium","source":"pre_built",
 "text":"2x-1≤5 tengsizlikning yechimi?",
 "options":["x≥3","x>3","x≤3","x<3"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"medium","source":"pre_built",
 "text":"Manfiy songa ko'paytirganda tengsizlik belgisi nima bo'ladi?",
 "options":["O'zgarmaydi","Teskari o'zgaradi","Sifir bo'ladi","Ikkiga bo'linadi"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"hard","source":"pre_built",
 "text":"4x<12 tengsizlikning yechimi?",
 "options":["x<3","x>3","x≤3","x≥3"],"correct_index":0},
{"id":qid(),"subject":"math","topic":"Chiziqli tengsizliklar","difficulty":"hard","source":"pre_built",
 "text":"x/2+1>3 tengsizlikning yechimi?",
 "options":["x>2","x<4","x>4","x>8"],"correct_index":2},

# ══════════════════════════════════════════════════════════════
# MATEMATIKA — Modulli tenglamalar  (answers: A,B,C,C,A,A,C,D,B,C)
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"|x|=5 tenglamaning yechimi?",
 "options":["x=5 yoki x=-5","x=5","x=-5","Yechim yo'q"],"correct_index":0},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"|2x-4|=0 tenglamaning yechimi?",
 "options":["x=0","x=2","x=4","x=-2"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"|x+3|=7 tenglamaning yechimlarining yig'indisi?",
 "options":["14","6","-6","0"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"|x|=-3 tenglamaning yechimi?",
 "options":["x=3","x=-3","Yechim yo'q","x=±3"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"easy","source":"pre_built",
 "text":"|3x|=12 tenglamaning yechimi?",
 "options":["x=±4","x=4","x=-4","x=±12"],"correct_index":0},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"|x-1|=4 tenglamaning katta yechimi?",
 "options":["5","-3","3","4"],"correct_index":0},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"medium","source":"pre_built",
 "text":"|2x+6|=0 tenglamaning yechimi?",
 "options":["x=6","x=0","x=-3","x=3"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"hard","source":"pre_built",
 "text":"|x|>0 shartini qaysi x qiymatlari qanoatlantiradi?",
 "options":["x=0","x>0","x<0","x≠0 bo'lgan barcha x"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"hard","source":"pre_built",
 "text":"|x+2|=|x-2| tenglamaning yechimi?",
 "options":["x=2","x=0","x=-2","Yechim yo'q"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Modulli tenglamalar","difficulty":"hard","source":"pre_built",
 "text":"|5x|=20 tenglamaning yechimi?",
 "options":["x=4","x=5","x=±4","x=±5"],"correct_index":2},

# ══════════════════════════════════════════════════════════════
# MATEMATIKA — Qisqa ko'paytirish formulalari  (answers: D,C,D,C,D,B,C,C,D,B)
# ══════════════════════════════════════════════════════════════
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"easy","source":"pre_built",
 "text":"(a+b)² formulasini kengaytiring.",
 "options":["a²+b²","a²-b²","a²+ab+b²","a²+2ab+b²"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"easy","source":"pre_built",
 "text":"a²-b² = ?",
 "options":["(a-b)²","(a+b)²","(a+b)(a-b)","(a-b)(a-b)"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"easy","source":"pre_built",
 "text":"(a-b)² = ?",
 "options":["a²+2ab+b²","a²+b²","a²-b²","a²-2ab+b²"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"medium","source":"pre_built",
 "text":"(2x+3)² = ?",
 "options":["4x²+9","4x²+6x+9","4x²+12x+9","2x²+12x+9"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"medium","source":"pre_built",
 "text":"a³+b³ = ?",
 "options":["(a+b)³","(a+b)²(a-b)","(a+b)(a²+ab+b²)","(a+b)(a²-ab+b²)"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"easy","source":"pre_built",
 "text":"(x-y)(x+y) = ?",
 "options":["x²+y²","x²-y²","x²-2xy+y²","x²+2xy+y²"],"correct_index":1},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"medium","source":"pre_built",
 "text":"(a+b)³ = ?",
 "options":["a³+b³","a³+3a²b+b³","a³+3a²b+3ab²+b³","a³-3a²b+3ab²-b³"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"medium","source":"pre_built",
 "text":"(x+1)²-x² ifodani soddalashtiring.",
 "options":["1","2x","2x+1","x²+1"],"correct_index":2},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"hard","source":"pre_built",
 "text":"a³-b³ = ?",
 "options":["(a-b)³","(a-b)(a²+b²)","(a-b)(a²+ab-b²)","(a-b)(a²+ab+b²)"],"correct_index":3},
{"id":qid(),"subject":"math","topic":"Qisqa ko'paytirish formulalari","difficulty":"hard","source":"pre_built",
 "text":"(3x-2)² = ?",
 "options":["9x²-4","9x²-12x+4","9x²+12x+4","9x²-6x+4"],"correct_index":1},
]

def main():
    existing = []
    if OUTPUT.exists():
        try:
            existing = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except Exception:
            existing = []

    existing_texts = {q["text"][:60] for q in existing}
    new_qs = [q for q in QUESTIONS if q["text"][:60] not in existing_texts]

    all_qs = existing + new_qs
    OUTPUT.write_text(json.dumps(all_qs, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n=== Question Bank Stats ===")
    print(f"New added: {len(new_qs)}")
    print(f"Total: {len(all_qs)}\n")

    by_subject = {}
    by_topic = {}
    for q in all_qs:
        s = q["subject"]
        t = q["topic"]
        by_subject[s] = by_subject.get(s, 0) + 1
        key = f"{s}:{t}"
        by_topic[key] = by_topic.get(key, 0) + 1

    subject_names = {"history": "Tarix", "uzbek": "Ona tili", "math": "Matematika"}
    for subj, count in sorted(by_subject.items(), key=lambda x: -x[1]):
        print(f"  {subject_names.get(subj, subj)}: {count} ta savol")

    print("\n  Mavzu bo'yicha:")
    for key, count in sorted(by_topic.items(), key=lambda x: -x[1]):
        subj, topic = key.split(":", 1)
        print(f"    [{subject_names.get(subj,subj)}] {topic}: {count} ta")

if __name__ == "__main__":
    main()
