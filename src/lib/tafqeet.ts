/**
 * Tafqeet: Multi-language Number to Words Converter
 * Supports: Arabic (ar), English (en), Bengali (bn)
 * Optimized for Saudi Riyal (SR) and Halala context.
 */

// --- Arabic Constants ---
const arOnes = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const arTens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const arHundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
const arThousands = ["", "ألف", "ألفان", "آلاف", "ألف"];
const arMillions = ["", "مليون", "مليونان", "ملايين", "مليون"];
const arBillions = ["", "مليار", "ملياران", "مليارات", "مليار"];

function convertArGroup(n: number): string {
    let res = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) res += arHundreds[h];
    if (t > 0 || o > 0) {
        if (res !== "") res += " و";
        if (t < 2) res += arOnes[t * 10 + o];
        else {
            res += arOnes[o];
            if (o > 0 && t > 0) res += " و";
            res += arTens[t];
        }
    }
    return res;
}

// --- English Constants ---
const enOnes = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const enTens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertEnGroup(n: number): string {
    let res = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) res += enOnes[h] + " Hundred";
    if (t > 0 || o > 0) {
        if (res !== "") res += " and ";
        if (t < 2) res += enOnes[t * 10 + o];
        else {
            res += enTens[t];
            if (o > 0) res += "-" + enOnes[o];
        }
    }
    return res;
}

// Bangla numbers in Latin letters; numbers below one hundred have individual names.
const bnNumbers = [
    "shunno", "ek", "dui", "tin", "char", "panch", "chhoy", "sat", "aath", "noy",
    "dosh", "egaro", "baro", "tero", "chouddo", "ponero", "sholo", "shotero", "atharo", "unish",
    "bish", "ekush", "baish", "teish", "chobbish", "ponchish", "chhabbish", "satash", "atash", "unotrish",
    "trish", "ekotrish", "botrish", "tetrish", "choutrish", "poytrish", "chhotrish", "saintrish", "attrish", "unochollish",
    "chollish", "ekchollish", "biyallish", "tetallish", "chuyallish", "poytallish", "chhechollish", "satchollish", "atchollish", "unoponchash",
    "ponchash", "ekanno", "bahanno", "tippanno", "chuyanno", "ponchanno", "chhappanno", "satanno", "atanno", "unoshat",
    "shat", "ekoshotti", "bashotti", "teshotti", "choushotti", "poyshotti", "chheshotti", "satshotti", "atshotti", "unoshottor",
    "shottor", "ekattor", "bahattor", "tiyattor", "chuyattor", "ponchattor", "chhiyattor", "satattor", "atattor", "unoashi",
    "ashi", "ekashi", "birashi", "tirashi", "churashi", "ponchashi", "chhiyashi", "satashi", "atashi", "unonobboi",
    "nobboi", "ekanobboi", "biranobboi", "tiranobboi", "churanobboi", "ponchanobboi", "chhiyanobboi", "satanobboi", "atanobboi", "niranobboi",
];

function convertBnNumber(n: number): string {
    if (n < 100) return bnNumbers[n];
    for (const [value, unit] of [[10000000, "koti"], [100000, "lakh"], [1000, "hajar"], [100, "shoto"]] as const) {
        if (n >= value) {
            const remainder = n % value;
            return `${convertBnNumber(Math.floor(n / value))} ${unit}${remainder ? ` ${convertBnNumber(remainder)}` : ""}`;
        }
    }
    return "";
}

// --- Main Functions ---

function tafqeetAr(n: number): string {
    if (n === 0) return "صفر";
    const parts = n.toFixed(2).split(".");
    const integerPart = parseInt(parts[0]);
    const fractionPart = parseInt(parts[1]);

    let res = "";
    const b = Math.floor(integerPart / 1000000000);
    const m = Math.floor((integerPart % 1000000000) / 1000000);
    const k = Math.floor((integerPart % 1000000) / 1000);
    const h = integerPart % 1000;

    if (b > 0) res += (b === 1 ? "مليار" : b === 2 ? "ملياران" : convertArGroup(b) + " " + (b >= 3 && b <= 10 ? arBillions[3] : arBillions[4]));
    if (m > 0) {
        if (res !== "") res += " و";
        res += (m === 1 ? "مليون" : m === 2 ? "مليونان" : convertArGroup(m) + " " + (m >= 3 && m <= 10 ? arMillions[3] : arMillions[4]));
    }
    if (k > 0) {
        if (res !== "") res += " و";
        res += (k === 1 ? "ألف" : k === 2 ? "ألفان" : convertArGroup(k) + " " + (k >= 3 && k <= 10 ? arThousands[3] : arThousands[4]));
    }
    if (h > 0) {
        if (res !== "") res += " و";
        res += convertArGroup(h);
    }

    if (integerPart > 0) res += " ريالاً";
    if (fractionPart > 0) {
        if (res !== "") res += " و";
        res += convertArGroup(fractionPart) + (fractionPart >= 3 && fractionPart <= 10 ? " هللات" : " هللة");
    }
    return res.trim() + " فقط لا غير";
}

function tafqeetEn(n: number): string {
    if (n === 0) return "Zero";
    const parts = n.toFixed(2).split(".");
    const integerPart = parseInt(parts[0]);
    const fractionPart = parseInt(parts[1]);

    let res = "";
    const b = Math.floor(integerPart / 1000000000);
    const m = Math.floor((integerPart % 1000000000) / 1000000);
    const k = Math.floor((integerPart % 1000000) / 1000);
    const h = integerPart % 1000;

    if (b > 0) res += convertEnGroup(b) + " Billion ";
    if (m > 0) res += convertEnGroup(m) + " Million ";
    if (k > 0) res += convertEnGroup(k) + " Thousand ";
    if (h > 0) res += convertEnGroup(h);

    if (integerPart > 0) res += " Riyals";
    if (fractionPart > 0) {
        if (res !== "") res += " and ";
        res += convertEnGroup(fractionPart) + " Halalas";
    }
    return res.trim() + " Only";
}

function tafqeetBn(n: number): string {
    if (n < 0) return `rinattok ${tafqeetBn(-n)}`;
    if (n === 0) return bnNumbers[0];
    const [integer, fraction] = n.toFixed(2).split(".").map(Number);
    const parts: string[] = [];
    if (integer > 0) parts.push(`${convertBnNumber(integer)} riyal`);
    if (fraction > 0) parts.push(`${convertBnNumber(fraction)} halala`);
    return `${parts.join(" ebong ")} matro`;
}

export function tafqeet(num: number | string, lang: "ar" | "en" | "bn" = "ar"): string {
    const n = Number(num);
    if (!Number.isFinite(n)) return "";
    
    switch (lang) {
        case "en": return tafqeetEn(n);
        case "bn": return tafqeetBn(n);
        default: return tafqeetAr(n);
    }
}
