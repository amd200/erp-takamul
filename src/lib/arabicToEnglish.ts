/**
 * Best-effort Arabic → English for Saudi city / district names.
 * Known cities use a dictionary; everything else is transliterated with a
 * simple rule set (Arabic script has no short vowels, so results are approximate).
 */

const CITIES: Record<string, string> = {
  "الرياض": "Riyadh",
  "جدة": "Jeddah",
  "مكة": "Makkah",
  "مكة المكرمة": "Makkah",
  "المدينة": "Al Madinah",
  "المدينة المنورة": "Al Madinah Al Munawwarah",
  "الدمام": "Dammam",
  "الخبر": "Khobar",
  "الظهران": "Dhahran",
  "الأحساء": "Al Ahsa",
  "الاحساء": "Al Ahsa",
  "الهفوف": "Hofuf",
  "القطيف": "Qatif",
  "الجبيل": "Jubail",
  "الخفجي": "Khafji",
  "حفر الباطن": "Hafar Al Batin",
  "الطائف": "Taif",
  "تبوك": "Tabuk",
  "بريدة": "Buraydah",
  "عنيزة": "Unaizah",
  "حائل": "Hail",
  "أبها": "Abha",
  "ابها": "Abha",
  "خميس مشيط": "Khamis Mushait",
  "جازان": "Jazan",
  "جيزان": "Jazan",
  "نجران": "Najran",
  "الباحة": "Al Baha",
  "سكاكا": "Sakaka",
  "عرعر": "Arar",
  "ينبع": "Yanbu",
  "الخرج": "Al Kharj",
  "المجمعة": "Al Majmaah",
  "الزلفي": "Az Zulfi",
  "شقراء": "Shaqra",
  "الدوادمي": "Ad Dawadmi",
  "وادي الدواسر": "Wadi Ad Dawasir",
  "القصيم": "Qassim",
  "بيشة": "Bisha",
  "الرس": "Ar Rass",
  "الدلم": "Ad Dilam",
  "رابغ": "Rabigh",
  "العلا": "Al Ula",
  "القريات": "Qurayyat",
  "رأس تنورة": "Ras Tanura",
  "بقيق": "Abqaiq",
  "النعيرية": "An Nuayriyah",
};

const DISTRICTS: Record<string, string> = {
  "الصناعية": "As Sinaiyah",
  "الصناعية الاولى": "First Industrial",
  "الدلة": "Ad Dallah",
  "الدلة الصناعية": "Ad Dallah Industrial",
  "الشاطئ الشرقي": "Ash Shati Ash Sharqi",
  "الشاطئ الغربي": "Ash Shati Al Gharbi",
  "الشاطئ": "Ash Shati",
  "العزيزية": "Al Aziziyah",
  "النخيل": "An Nakhil",
  "الملز": "Al Malaz",
  "العليا": "Al Olaya",
  "السليمانية": "As Sulaimaniyah",
  "الروضة": "Ar Rawdah",
  "الفيصلية": "Al Faisaliyah",
  "المروج": "Al Muruj",
  "الربوة": "Ar Rabwah",
  "النزهة": "An Nuzhah",
  "الحمراء": "Al Hamra",
  "الياسمين": "Al Yasmin",
  "الملقا": "Al Malqa",
  "الشفا": "Ash Shifa",
  "الدار البيضاء": "Ad Dar Al Baida",
  "المنورة": "Al Munawwarah",
};

const key = (v: string) => v.replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[إأآ]/g, "ا");
const lookup = (dict: Record<string, string>, v: string): string | undefined => {
  const k = key(v);
  for (const name in dict) if (key(name) === k) return dict[name];
  return undefined;
};

const SUN = "تثدذرزسشصضطظلن";

const CONS: Record<string, string> = {
  ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z",
  س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "'", غ: "gh", ف: "f", ق: "q",
  ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "ah", ء: "'", ؤ: "'", ئ: "'",
};
const LONG: Record<string, string> = { ا: "a", أ: "a", إ: "i", آ: "a", ى: "a", و: "u", ي: "i" };

const norm = (s: string) =>
  s.replace(/[ً-ٟـ]/g, "").replace(/[إأآ]/g, "ا").replace(/\s+/g, " ").trim();

const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);

const translitWord = (raw: string): string => {
  let w = raw;
  let prefix = "";
  if (w.startsWith("ال") && w.length > 2) {
    const first = w.charAt(2);
    prefix = SUN.includes(first) ? "A" + CONS[first] : "Al";
    w = w.slice(2);
  }
  // tokenise into consonant / vowel units
  const units: { t: string; c: boolean }[] = [];
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    const isLast = i === w.length - 1;
    if (ch === "ئ") units.push({ t: isLast ? "i" : "'", c: !isLast });
    else if ((ch === "و" || ch === "ي") && i === 0) units.push({ t: ch === "و" ? "w" : "y", c: true });
    else if (CONS[ch]) units.push({ t: CONS[ch], c: ch !== "ة" });
    else if (LONG[ch]) units.push({ t: LONG[ch], c: false });
    else units.push({ t: ch, c: false });
  }
  let out = "";
  for (let i = 0; i < units.length; ) {
    if (!units[i].c) {
      out += units[i].t;
      i++;
      continue;
    }
    let j = i;
    while (j < units.length && units[j].c) j++;
    const run = units.slice(i, j).map((u) => u.t);
    if (i === 0 && run.length >= 2 && !prefix) {
      // word-initial cluster: C a C…
      out += run[0] + "a" + run.slice(1).join("");
    } else if (run.length === 2 && j < units.length) {
      out += run[0] + "a" + run[1];
    } else if (run.length >= 3) {
      out += run[0] + "a" + run.slice(1).join("");
    } else {
      out += run.join("");
    }
    i = j;
  }
  out = out.replace(/^'+/, "");
  return prefix ? `${prefix} ${cap(out)}` : cap(out);
};

const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

const cleanPrefix = (s: string) => s.replace(/^حي\s+/, "").replace(/^مدينة\s+/, "").trim();

export const cityToEnglish = (value?: string | null): string => {
  const v = String(value ?? "").trim();
  if (!v || v === "-") return "-";
  if (!hasArabic(v)) return v;
  const n = cleanPrefix(norm(v));
  return lookup(CITIES, n) ?? n.split(" ").map(translitWord).join(" ");
};

export const districtToEnglish = (value?: string | null): string => {
  const v = String(value ?? "").trim();
  if (!v || v === "-") return "-";
  if (!hasArabic(v)) return v;
  const n = cleanPrefix(norm(v));
  const name = lookup(DISTRICTS, n) ?? n.split(" ").map(translitWord).join(" ");
  return `${name} Dist.`;
};

const STREET_WORDS: Record<string, string> = {
  "شارع": "St.", "طريق": "Rd", "الشارع": "St.", "الطريق": "Rd", "طريق الملك": "King Rd",
  "الامير": "Prince", "الملك": "King", "الملكة": "Queen", "الشيخ": "Sheikh", "بن": "Bin", "ابن": "Ibn", "بنت": "Bint", "ابو": "Abu", "عبد": "Abd",
  "محمد": "Muhammad", "احمد": "Ahmad", "عبدالله": "Abdullah", "عبدالعزيز": "Abdulaziz",
  "عبدالرحمن": "Abdulrahman", "فهد": "Fahd", "سلمان": "Salman", "سعود": "Saud", "فيصل": "Faisal",
  "خالد": "Khalid", "نايف": "Naif", "سلطان": "Sultan", "علي": "Ali", "عمر": "Omar", "عثمان": "Othman",
  "الرئيسي": "Main", "العام": "General", "الدائري": "Ring", "السريع": "Express", "الشرقي": "Eastern",
  "الغربي": "Western", "الشمالي": "Northern", "الجنوبي": "Southern", "الصناعية": "Industrial", "الدلة": "Ad Dallah",
  "التحلية": "Tahlia", "العروبة": "Al Urubah", "الستين": "Sixtieth", "الثلاثين": "Thirtieth", "الاول": "First",
  "الثاني": "Second", "الثالث": "Third",
};

export const streetToEnglish = (value?: string | null): string => {
  const v = String(value ?? "").trim();
  if (!v || v === "-") return "-";
  if (!hasArabic(v)) return v;
  const digits = norm(v).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  return digits
    .split(" ")
    .map((w) => STREET_WORDS[w] ?? (/^\d+$/.test(w) ? w : translitWord(w)))
    .join(" ");
};
