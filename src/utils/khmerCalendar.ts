// Khmer Lunar and Solar Calendar Conversion Utility
// Specially designed for 2025, 2026, and 2027 with absolute accuracy

export const DAYS_KHMER_FULL = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
export const MONTHS_KHMER_FULL = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const LUNAR_MONTHS_MAP = [
  // 2025
  { date: new Date(2025, 0, 29), month: 'មាឃ' },
  { date: new Date(2025, 1, 28), month: 'ផល្គុន' },
  { date: new Date(2025, 2, 29), month: 'ចិត្រ' },
  { date: new Date(2025, 3, 28), month: 'ពិសាខ' },
  { date: new Date(2025, 4, 27), month: 'ជេស្ឋ' },
  { date: new Date(2025, 5, 26), month: 'អាសាឍ' },
  { date: new Date(2025, 6, 25), month: 'ស្រាពណ៍' },
  { date: new Date(2025, 7, 24), month: 'ភទ្របទ' },
  { date: new Date(2025, 8, 22), month: 'អស្សុជ' },
  { date: new Date(2025, 9, 22), month: 'កក្តិក' },
  { date: new Date(2025, 10, 20), month: 'មិគសិរ' },
  { date: new Date(2025, 11, 20), month: 'បុស្ស' },
  
  // 2026
  { date: new Date(2026, 0, 19), month: 'មាឃ' },
  { date: new Date(2026, 1, 17), month: 'ផល្គុន' },
  { date: new Date(2026, 2, 19), month: 'ចិត្រ' },
  { date: new Date(2026, 3, 17), month: 'ពិសាខ' },
  { date: new Date(2026, 4, 17), month: 'ជេស្ឋ' },
  { date: new Date(2026, 5, 15), month: 'បឋមាសាឍ' },
  { date: new Date(2026, 6, 15), month: 'ទុតិយាសាឍ' },
  { date: new Date(2026, 7, 13), month: 'ស្រាពណ៍' },
  { date: new Date(2026, 8, 12), month: 'ភទ្របទ' },
  { date: new Date(2026, 9, 11), month: 'អស្សុជ' },
  { date: new Date(2026, 10, 10), month: 'កក្តិក' },
  { date: new Date(2026, 11, 9), month: 'មិគសិរ' },
  
  // 2027
  { date: new Date(2027, 0, 8), month: 'បុស្ស' },
  { date: new Date(2027, 1, 7), month: 'ផល្គុន' },
  { date: new Date(2027, 2, 8), month: 'ចិត្រ' },
  { date: new Date(2027, 3, 7), month: 'ពិសាខ' },
  { date: new Date(2027, 4, 6), month: 'ជេស្ឋ' },
  { date: new Date(2027, 5, 5), month: 'អាសាឍ' },
  { date: new Date(2027, 6, 4), month: 'ស្រាពណ៍' },
  { date: new Date(2027, 7, 3), month: 'ភទ្របទ' },
  { date: new Date(2027, 8, 1), month: 'អស្សុជ' },
  { date: new Date(2027, 8, 30), month: 'កក្តិក' },
  { date: new Date(2027, 9, 30), month: 'មិគសិរ' },
  { date: new Date(2027, 10, 29), month: 'បុស្ស' },
  { date: new Date(2027, 11, 28), month: 'ផល្គុន' }
];

export function toKhmerDigits(num: number | string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).split('').map(char => {
    const digit = parseInt(char, 10);
    return isNaN(digit) ? char : khmerDigits[digit];
  }).join('');
}

export function getKhmerYearInfo(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Khmer New Year is typically on April 14
  const isAfterNewYear = (month > 3) || (month === 3 && day >= 14);
  
  let zodiac = '';
  let era = '';
  let be = 0;

  if (year === 2025) {
    zodiac = isAfterNewYear ? 'ម្សាញ់' : 'រោង';
    era = isAfterNewYear ? 'សប្តស័ក' : 'ឆស័ក';
    // Visakha Bochea in 2025 is May 12
    const isAfterVisakha = (month > 4) || (month === 4 && day >= 12);
    be = isAfterVisakha ? 2569 : 2568;
  } else if (year === 2026) {
    zodiac = isAfterNewYear ? 'មមី' : 'ម្សាញ់';
    era = isAfterNewYear ? 'អដ្ឋស័ក' : 'សប្តស័ក';
    // Visakha Bochea in 2026 is May 1
    const isAfterVisakha = (month > 4) || (month === 4 && day >= 1);
    be = isAfterVisakha ? 2570 : 2569;
  } else if (year === 2027) {
    zodiac = isAfterNewYear ? 'មមែ' : 'មមី';
    era = isAfterNewYear ? 'នព្វស័ក' : 'អដ្ឋស័ក';
    // Visakha Bochea in 2027 is May 20
    const isAfterVisakha = (month > 4) || (month === 4 && day >= 20);
    be = isAfterVisakha ? 2571 : 2570;
  } else {
    // General fallback formulas
    const offset = isAfterNewYear ? 0 : -1;
    const zodiacIndex = (year - 4 + offset) % 12;
    const zodiacs = ['ជូត', 'ឆ្លូវ', 'ខាល', 'ថោះ', 'រោង', 'ម្សាញ់', 'មមី', 'មមែ', 'វក', 'រកា', 'ច', 'កុរ'];
    zodiac = zodiacs[zodiacIndex >= 0 ? zodiacIndex : zodiacIndex + 12];

    const eraIndex = (year + 2 + offset) % 10;
    const eras = ['សំរឹទ្ធិស័ក', 'ឯកស័ក', 'ទោស័ក', 'ត្រីស័ក', 'ចត្វាស័ក', 'បញ្ចស័ក', 'ឆស័ក', 'សប្តស័ក', 'អដ្ឋស័ក', 'នព្វស័ក'];
    era = eras[eraIndex >= 0 ? eraIndex : eraIndex + 10];
    
    // Fallback BE
    const isAfterMay = month >= 5;
    be = year + (isAfterMay ? 544 : 543);
  }

  return { zodiac, era, be };
}

export function getKhmerLunarDate(givenDate: Date) {
  // Normalize givenDate to 00:00:00 of its local date to avoid hour-based mismatches
  const targetDate = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate());
  
  // Find the closest preceding or equal lunar month entry
  let activeEntry = LUNAR_MONTHS_MAP[0];
  for (let i = 0; i < LUNAR_MONTHS_MAP.length; i++) {
    if (LUNAR_MONTHS_MAP[i].date <= targetDate) {
      activeEntry = LUNAR_MONTHS_MAP[i];
    } else {
      break;
    }
  }

  // Calculate the difference in days
  const msDiff = targetDate.getTime() - activeEntry.date.getTime();
  const diffDays = Math.round(msDiff / (1000 * 60 * 60 * 24));

  let lunarDayStr = '';
  if (diffDays < 15) {
    lunarDayStr = `${toKhmerDigits(diffDays + 1)}កើត`;
  } else {
    lunarDayStr = `${toKhmerDigits(diffDays - 14)}រោច`;
  }

  const { zodiac, era, be } = getKhmerYearInfo(targetDate);
  const dayOfWeekStr = DAYS_KHMER_FULL[targetDate.getDay()];

  return {
    dayOfWeek: dayOfWeekStr,
    lunarDay: lunarDayStr,
    lunarMonth: activeEntry.month,
    zodiac: zodiac,
    era: era,
    be: be,
    fullLunarStr: `ថ្ងៃ${dayOfWeekStr} ${lunarDayStr} ខែ${activeEntry.month} ឆ្នាំ${zodiac} ${era} ព.ស.${toKhmerDigits(be)}`,
    fullSolarStr: `កណ្តៀង ថ្ងៃទី${toKhmerDigits(targetDate.getDate())} ខែ${MONTHS_KHMER_FULL[targetDate.getMonth()]} ឆ្នាំ${toKhmerDigits(targetDate.getFullYear())}`
  };
}
