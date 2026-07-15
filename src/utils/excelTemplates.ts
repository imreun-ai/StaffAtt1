import * as XLSX from 'xlsx';
import { Teacher, ClassEntity, ScheduleEntity } from '../types';

// Days and time slots constant
export const DAYS_KHMER = ['ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
export const DAYS_ENGLISH = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const TIME_SLOTS = ['7-8', '8-9', '9-10', '10-11', '2-3', '3-4', '4-5'];

/**
 * Downloads a sample Excel file for Teachers import.
 */
export function downloadTeacherTemplate() {
  const headers = [
    ['ឈ្មោះគ្រូបង្រៀន (Teacher Name)', 'កូដមុខវិជ្ជា (Subject Code)', 'មុខវិជ្ជាបង្រៀន (Subject Taught)']
  ];
  
  const sampleData = [
    ['សុខ គន្ធា', 'MATH7', 'គណិតវិទ្យា'],
    ['ចាន់ តារា', 'PHYS8', 'រូបវិទ្យា'],
    ['លី ម៉ារី', 'CHEM9', 'គីមីវិទ្យា'],
    ['កែវ សុផល', 'KHM7', 'អក្សរសាស្ត្រខ្មែរ'],
    ['សេង ណារ៉ុង', 'ENG10', 'ភាសាអង់គ្លេស']
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
  
  // Apply column widths
  ws['!cols'] = [
    { wch: 30 }, // Teacher Name
    { wch: 25 }, // Subject Code
    { wch: 35 }  // Subject Taught
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'គំរូបញ្ជីឈ្មោះគ្រូ');
  XLSX.writeFile(wb, 'Teacher_Template.xlsx');
}

/**
 * Downloads a sample Excel file for the Master Weekly Schedule (កាលវិភាគរួម).
 * Designed to look exactly like the user's attached image!
 */
export function downloadScheduleTemplate() {
  const wb = XLSX.utils.book_new();

  // Row 1: Header Day labels
  // Column 0 is Class (ថ្នាក់).
  // Then each day has 7 slot columns.
  const row1 = ['ថ្នាក់'];
  DAYS_KHMER.forEach(day => {
    row1.push(day);
    // Add 6 empty placeholders to allow cell merging for the day header
    for (let i = 1; i < TIME_SLOTS.length; i++) {
      row1.push('');
    }
  });

  // Row 2: Subheaders for hours
  const row2 = ['Class'];
  DAYS_KHMER.forEach(() => {
    TIME_SLOTS.forEach(slot => {
      row2.push(slot);
    });
  });

  // Sample schedule rows
  const sampleData = [
    ['7A', 'MATH7', 'MATH7', 'KHM7', '', 'ENG10', '', '', 'PHYS8', 'PHYS8', '', '', '', '', '', '', 'CHEM9', 'CHEM9', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['8B', '', '', 'PHYS8', 'PHYS8', '', '', '', 'MATH7', 'MATH7', '', '', '', '', '', '', 'ENG10', 'ENG10', '', '', '', '', 'CHEM9', 'CHEM9', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...sampleData]);

  // Define merges
  // Merge "ថ្នាក់/Class" (A1 and A2) -> Col 0, Row 0 to Row 1
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }
  ];

  // Merge each day across 7 columns in Row 0
  DAYS_KHMER.forEach((_, dayIdx) => {
    const startCol = 1 + dayIdx * TIME_SLOTS.length;
    const endCol = startCol + TIME_SLOTS.length - 1;
    merges.push({
      s: { r: 0, c: startCol },
      e: { r: 0, c: endCol }
    });
  });

  ws['!merges'] = merges;

  // Column widths
  const cols = [{ wch: 10 }]; // Class column
  for (let i = 1; i <= DAYS_KHMER.length * TIME_SLOTS.length; i++) {
    cols.push({ wch: 8 });
  }
  ws['!cols'] = cols;

  XLSX.utils.book_append_sheet(wb, ws, 'កាលវិភាគរួម');
  XLSX.writeFile(wb, 'Schedule_Template.xlsx');
}

/**
 * Parses a uploaded Excel file for Teachers.
 */
export function parseTeachersExcel(file: File): Promise<Teacher[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to array of arrays
        const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        if (rows.length <= 1) {
          resolve([]);
          return;
        }

        const teachers: Teacher[] = [];
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const fullName = String(row[0] || '').trim();
          const subjectCode = String(row[1] || '').trim();
          const subjectName = String(row[2] || '').trim();

          if (fullName && subjectCode) {
            teachers.push({
              teacherCode: subjectCode.toUpperCase(),
              lastName: fullName,
              firstName: '',
              subjectCode: subjectCode.toUpperCase(),
              subjectName
            });
          }
        }
        resolve(teachers);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Parses a uploaded Excel file for the Master Schedule.
 * Decodes the layout with Day headings and Subheaders.
 */
export function parseScheduleExcel(file: File): Promise<ScheduleEntity[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        if (rows.length <= 2) {
          resolve([]);
          return;
        }

        // Row 0 is Khmer Day headers
        const dayHeaders = rows[0];
        // Row 1 is time slot subheaders
        const timeSlotHeaders = rows[1];

        // Let's resolve column mapping
        // We know that columns start at 1. Each day has TIME_SLOTS.length columns.
        const schedules: ScheduleEntity[] = [];

        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const classId = String(row[0] || '').trim().toUpperCase();
          if (!classId) continue;

          // Process each day & slot
          DAYS_KHMER.forEach((day, dayIdx) => {
            const startCol = 1 + dayIdx * TIME_SLOTS.length;
            TIME_SLOTS.forEach((slot, slotIdx) => {
              const colIdx = startCol + slotIdx;
              const teacherCode = String(row[colIdx] || '').trim();
              
              if (teacherCode) {
                schedules.push({
                  scheduleId: `${classId}-${day}-${slot}`,
                  classId,
                  dayOfWeek: day,
                  timeSlot: slot,
                  teacherId: teacherCode
                });
              }
            });
          });
        }
        
        resolve(schedules);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
