export type OlympiadSubject =
  | 'math' | 'physics' | 'chemistry' | 'biology'
  | 'english' | 'informatics' | 'science' | 'uzbek' | 'astronomy';

export type OlympiadFormat = 'online' | 'in-person';
export type OlympiadLevel = 'national' | 'regional' | 'international';

export interface Olympiad {
  id: string;
  name: string;           // short name, e.g. "IMO"
  fullName: string;       // full official name
  subject: OlympiadSubject;
  icon: string;
  format: OlympiadFormat;
  level: OlympiadLevel;
  gradeMin: number;       // e.g. 7
  gradeMax: number;       // e.g. 11
  ageMin: number;
  ageMax: number;
  registrationDeadline: string | null; // "Mart 2027" or null
  examDate: string | null;             // "Iyul 2027"
  description: string;
  prizes: string;
  organizer: string;
  country: string;
  website: string;
  preparationTips: string[];
  upcoming: boolean;      // false = already passed this cycle
}

export const OLYMPIADS: Olympiad[] = [
  // ── International ─────────────────────────────────────────────────────────
  {
    id: 'imo',
    name: 'IMO',
    fullName: 'Xalqaro Matematika Olimpiadasi',
    subject: 'math',
    icon: '📐',
    format: 'in-person',
    level: 'international',
    gradeMin: 9, gradeMax: 11,
    ageMin: 14, ageMax: 19,
    registrationDeadline: 'Mart 2027',
    examDate: 'Iyul 2027',
    description:
      'Dunyo bo\'ylab 100+ mamlakatdan o\'rta maktab o\'quvchilari ishtirok etadigan eng nufuzli matematika olimpiadasi. Har yili boshqa mamlakatda o\'tkaziladi. 2 kun davomida 6 ta murakkab masala yechiladi.',
    prizes: 'Oltin, kumush, bronza medallar va faxriy diplomlar. G\'oliblar eng yaxshi universitetlarga imtiyozli qabul oladi.',
    organizer: 'IMO Foundation',
    country: 'Xalqaro',
    website: 'https://www.imo-official.org',
    preparationTips: [
      'Algebra, geometriya, kombinatorika va son nazariyasini chuqur o\'rgan',
      'Art of Problem Solving (AoPS) saytidagi masalalarni yech',
      'Oldingi yillar IMO masalalarini ko\'rib chiq (1959-yildan beri mavjud)',
      'Mahalliy matematika olimpiadalarida muntazam qatnash',
    ],
    upcoming: true,
  },
  {
    id: 'ipho',
    name: 'IPhO',
    fullName: 'Xalqaro Fizika Olimpiadasi',
    subject: 'physics',
    icon: '⚛️',
    format: 'in-person',
    level: 'international',
    gradeMin: 9, gradeMax: 11,
    ageMin: 14, ageMax: 19,
    registrationDeadline: 'Aprel 2027',
    examDate: 'Iyul 2027',
    description:
      'Fizika fanidan dunyoning eng nufuzli xalqaro musobaqasi. Nazariy va eksperimental qismlardan iborat. Har yili 80+ mamlakatdan 5 nafardan kamroq o\'quvchi ishtirok etadi.',
    prizes: 'Oltin, kumush, bronza medallar. G\'oliblar MIT, Cambridge kabi universitetlarda o\'qish imkoniyatiga ega bo\'ladi.',
    organizer: 'IPhO Steering Committee',
    country: 'Xalqaro',
    website: 'https://www.ipho-new.org',
    preparationTips: [
      'Klassik mexanika, elektrodinamika, termodinamika va kvant fizikasini o\'rgan',
      'Eksperimental fizika ko\'nikmalari: o\'lchash, grafik chizish, xato tahlili',
      'Irodov va Savchenko masalalar to\'plamlarini yech',
      'Har kuni hisob-kitob masalalarini yechishni odat qil',
    ],
    upcoming: true,
  },
  {
    id: 'icho',
    name: 'IChO',
    fullName: 'Xalqaro Kimyo Olimpiadasi',
    subject: 'chemistry',
    icon: '🧪',
    format: 'in-person',
    level: 'international',
    gradeMin: 9, gradeMax: 11,
    ageMin: 14, ageMax: 20,
    registrationDeadline: 'Mart 2027',
    examDate: 'Iyul 2027',
    description:
      'Kimyo fanidan xalqaro musobaqa. Nazariy va laboratoriya qismlari bor. 80+ mamlakatdan to\'rttadan o\'quvchi ishtirok etadi. Organik, anorganik va fizik kimyo bo\'yicha masalalar.',
    prizes: 'Oltin, kumush, bronza medallar va sertifikatlar.',
    organizer: 'IChO Executive Committee',
    country: 'Xalqaro',
    website: 'https://www.icho-official.org',
    preparationTips: [
      'Organik kimyo reaksiya mexanizmlarini o\'rgan',
      'Analitik kimyo: titrlash, spektroskopiya asoslarini bil',
      'Oldingi yillar IChO masalalarini ishlang',
      'Laboratoriya amaliyotiga ko\'p vaqt ajrating',
    ],
    upcoming: true,
  },
  {
    id: 'ibo',
    name: 'IBO',
    fullName: 'Xalqaro Biologiya Olimpiadasi',
    subject: 'biology',
    icon: '🧬',
    format: 'in-person',
    level: 'international',
    gradeMin: 9, gradeMax: 11,
    ageMin: 14, ageMax: 21,
    registrationDeadline: 'Fevral 2027',
    examDate: 'Iyul 2027',
    description:
      'Biologiya fanidan eng yuqori darajadagi xalqaro musobaqa. Nazariy bilim va laboratoriya ko\'nikmalarini sinaydi. Hujayra biologiyasi, genetika, ekologiya va fiziologiya qamrab olinadi.',
    prizes: 'Oltin, kumush, bronza medallar. Tibbiyot va biologiya universitetlariga kirish imkoniyati.',
    organizer: 'IBO Foundation',
    country: 'Xalqaro',
    website: 'https://www.ibo-info.org',
    preparationTips: [
      'Hujayra biologiyasi va molekulyar genetikani chuqur o\'rgan',
      'Mikroskopiya va preparatlar tayyorlashni mashq qiling',
      'Campbell Biology kitobini to\'liq o\'qing',
      'Ekologiya va evolyutsiya nazariyasiga alohida e\'tibor bering',
    ],
    upcoming: true,
  },
  {
    id: 'ioi',
    name: 'IOI',
    fullName: 'Xalqaro Informatika Olimpiadasi',
    subject: 'informatics',
    icon: '💻',
    format: 'in-person',
    level: 'international',
    gradeMin: 8, gradeMax: 11,
    ageMin: 13, ageMax: 20,
    registrationDeadline: 'Aprel 2027',
    examDate: 'Avgust 2027',
    description:
      'Algoritmlar va dasturlash bo\'yicha xalqaro musobaqa. C++, Java yoki Python ishlatiladi. 2 kun davomida 3 tadan 6 ta algoritmik masala yechiladi. Competitive programming olami.',
    prizes: 'Oltin, kumush, bronza medallar. Google, Facebook kabi kompaniyalar g\'oliblarni to\'g\'ridan-to\'g\'ri ishga oladi.',
    organizer: 'IOI Foundation',
    country: 'Xalqaro',
    website: 'https://ioinformatics.org',
    preparationTips: [
      'C++ ni professional darajada o\'rgan',
      'Codeforces va LeetCode da kunlik mashq qiling',
      'Graflar, dinamik dasturlash, greedy algoritmlarni ustala',
      'USACO training platformasidan foydalaning',
    ],
    upcoming: true,
  },
  {
    id: 'ijso',
    name: 'IJSO',
    fullName: 'Xalqaro Yosh Olimlar Olimpiadasi',
    subject: 'science',
    icon: '🔬',
    format: 'in-person',
    level: 'international',
    gradeMin: 7, gradeMax: 9,
    ageMin: 12, ageMax: 15,
    registrationDeadline: 'Sentabr 2026',
    examDate: 'Dekabr 2026',
    description:
      'Yosh o\'quvchilar uchun fizika, kimyo va biologiyani birlashtirgan xalqaro musobaqa. 3 kishilik jamoalar. 9-sinfdan kichik o\'quvchilar uchun mo\'ljallangan.',
    prizes: 'Oltin, kumush, bronza medallar va sertifikatlar.',
    organizer: 'IJSO Foundation',
    country: 'Xalqaro',
    website: 'https://www.ijso-official.org',
    preparationTips: [
      'Fizika, kimyo va biologiyadan asosiy tushunchalarni o\'rgan',
      'Ko\'p masalalarni vaqt chegarasida yechishni mashq qiling',
      'Jamoaviy ishlash ko\'nikmalarini rivojlantir',
    ],
    upcoming: true,
  },
  {
    id: 'iao',
    name: 'IAO',
    fullName: 'Xalqaro Astronomiya Olimpiadasi',
    subject: 'astronomy',
    icon: '🌌',
    format: 'in-person',
    level: 'international',
    gradeMin: 8, gradeMax: 11,
    ageMin: 13, ageMax: 18,
    registrationDeadline: 'Iyun 2027',
    examDate: 'Oktabr 2027',
    description:
      'Astronomiya va astrofizika bo\'yicha xalqaro musobaqa. Nazariy, kuzatuv va ma\'lumotlarni tahlil qilish qismlari mavjud. Osmon jismlarini aniqlash ham kiradi.',
    prizes: 'Oltin, kumush, bronza medallar.',
    organizer: 'IAO Organizing Committee',
    country: 'Xalqaro',
    website: 'https://www.issp.ac.ru/iao',
    preparationTips: [
      'Quyosh sistemasi va yulduzlar fizikasin o\'rgan',
      'Teleskop bilan ishlashni o\'rgan',
      'Matematika va fizika asoslarini mustahkamla',
    ],
    upcoming: true,
  },

  // ── National (O'zbekiston) ─────────────────────────────────────────────────
  {
    id: 'uzb-math',
    name: 'UzMO',
    fullName: 'O\'zbekiston Respublikasi Matematika Olimpiadasi',
    subject: 'math',
    icon: '📐',
    format: 'in-person',
    level: 'national',
    gradeMin: 5, gradeMax: 11,
    ageMin: 10, ageMax: 18,
    registrationDeadline: 'Oktabr 2026',
    examDate: 'Yanvar–Mart 2027',
    description:
      'O\'zbekistonda har yili o\'tkaziladigan matematika olimpiadasi. Tuman, viloyat va respublika bosqichlari mavjud. G\'oliblar xalqaro olimpiadalarga tavsiya etiladi.',
    prizes: 'I, II, III darajali diplomlar va sovg\'alar. Respublika g\'oliblari xalqaro olimpiadalarga yuboriladi.',
    organizer: 'O\'zbekiston Xalq ta\'limi vazirligi',
    country: 'O\'zbekiston',
    website: 'https://edu.uz',
    preparationTips: [
      'DTM dasturidagi barcha matematika mavzularini mukammal o\'rgan',
      'Olimpiada masalalar to\'plamlarini yech',
      'Geometriya va kombinatorikaga alohida e\'tibor ber',
    ],
    upcoming: true,
  },
  {
    id: 'uzb-physics',
    name: 'UzPhO',
    fullName: 'O\'zbekiston Respublikasi Fizika Olimpiadasi',
    subject: 'physics',
    icon: '⚛️',
    format: 'in-person',
    level: 'national',
    gradeMin: 7, gradeMax: 11,
    ageMin: 12, ageMax: 18,
    registrationDeadline: 'Noyabr 2026',
    examDate: 'Fevral–Mart 2027',
    description:
      'Respublika bo\'ylab o\'tkaziladigan fizika olimpiadasi. Tuman va viloyat bosqichlaridan o\'tgan eng iqtidorli o\'quvchilar respublika finali uchun musobaqalashadi.',
    prizes: 'I, II, III darajali diplomlar. G\'oliblar IPhO da O\'zbekistonni vakillik qiladi.',
    organizer: 'O\'zbekiston Xalq ta\'limi vazirligi',
    country: 'O\'zbekiston',
    website: 'https://edu.uz',
    preparationTips: [
      'Mexanika va elektrodinamika bo\'limlarini mukammal bil',
      'Irodov masalalaridan kunlik mashq qil',
      'Eksperimental fizika ko\'nikmalarini rivojlantir',
    ],
    upcoming: true,
  },
  {
    id: 'uzb-english',
    name: 'UzELO',
    fullName: 'O\'zbekiston Respublikasi Ingliz Tili Olimpiadasi',
    subject: 'english',
    icon: '🇬🇧',
    format: 'in-person',
    level: 'national',
    gradeMin: 5, gradeMax: 11,
    ageMin: 10, ageMax: 18,
    registrationDeadline: 'Oktabr 2026',
    examDate: 'Dekabr 2026–Yanvar 2027',
    description:
      'Ingliz tili bo\'yicha respublika olimpiadasi. Yozma, og\'zaki va tinglab tushunish qismlari mavjud. G\'oliblar xalqaro til olimpiadalarida ishtirok etadi.',
    prizes: 'I, II, III darajali diplomlar va sertifikatlar. IELTS/SAT tayyorgarligi uchun kurslarga bepul kirish.',
    organizer: 'O\'zbekiston Xalq ta\'limi vazirligi',
    country: 'O\'zbekiston',
    website: 'https://edu.uz',
    preparationTips: [
      'Kundalik ingliz tili o\'qish va yozish amaliyoti',
      'British Council va BBC Learning English materiallarini ishlat',
      'Speaking va listening uchun podkastlar tinglash',
    ],
    upcoming: true,
  },
];

// ── Filter helpers ───────────────────────────────────────────────────────────

export const OLYMPIAD_SUBJECT_LABELS: Record<OlympiadSubject, string> = {
  math: 'Matematika',
  physics: 'Fizika',
  chemistry: 'Kimyo',
  biology: 'Biologiya',
  english: 'Ingliz tili',
  informatics: 'Informatika',
  science: 'Tabiiy fanlar',
  uzbek: 'O\'zbek tili',
  astronomy: 'Astronomiya',
};

export const OLYMPIAD_SUBJECT_ICONS: Record<OlympiadSubject, string> = {
  math: '📐', physics: '⚛️', chemistry: '🧪', biology: '🧬',
  english: '🇬🇧', informatics: '💻', science: '🔬', uzbek: '✍️', astronomy: '🌌',
};

export const FORMAT_LABELS: Record<OlympiadFormat, string> = {
  online: 'Online',
  'in-person': 'Offline',
};

export const LEVEL_LABELS: Record<OlympiadLevel, string> = {
  national: 'Milliy',
  regional: 'Mintaqaviy',
  international: 'Xalqaro',
};

export interface OlympiadFilters {
  subject: OlympiadSubject | 'all';
  format: OlympiadFormat | 'all';
  level: OlympiadLevel | 'all';
  gradeGroup: 'all' | 'junior' | 'senior'; // junior = 5-8, senior = 9-11
  upcomingOnly: boolean;
}

export const DEFAULT_FILTERS: OlympiadFilters = {
  subject: 'all',
  format: 'all',
  level: 'all',
  gradeGroup: 'all',
  upcomingOnly: true,
};

export function filterOlympiads(list: Olympiad[], f: OlympiadFilters): Olympiad[] {
  return list.filter((o) => {
    if (f.subject !== 'all' && o.subject !== f.subject) return false;
    if (f.format !== 'all' && o.format !== f.format) return false;
    if (f.level !== 'all' && o.level !== f.level) return false;
    if (f.gradeGroup === 'junior' && o.gradeMax > 8) return false;
    if (f.gradeGroup === 'senior' && o.gradeMin < 9) return false;
    if (f.upcomingOnly && !o.upcoming) return false;
    return true;
  });
}
