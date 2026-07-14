export interface Teacher {
  teacherCode: string; // Unique, e.g. M1
  lastName: string;    // គោត្តនាម
  firstName: string;   // នាម
  subjectCode: string; // កូដមុខវិជ្ជា
  subjectName: string; // មុខវិជ្ជាបង្រៀន
}

export interface ClassEntity {
  classId: string; // Unique, e.g. "7A"
  grade: string;   // "7", "8", "9", etc.
  group: string;   // "A", "B", "C", etc.
}

export interface ScheduleEntity {
  scheduleId: string; // "classId-day-slot", e.g. "7A-Monday-7-8"
  classId: string;
  dayOfWeek: string;  // "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"
  timeSlot: string;   // "7-8", "8-9", "9-10", "10-11", "2-3", "3-4", "4-5"
  teacherId: string;  // Teacher code
}

export interface AttendanceRecord {
  timeSlot: string;
  teacherId: string;
  status: 'A' | 'P' | 'Present'; // A: absent without permission (អត់ច្បាប់), P: absent with permission (មានច្បាប់), Present: Present (មានវត្តមាន)
}

export interface AttendanceEntity {
  attendanceId: string; // "classId-date", e.g. "7A-2026-07-14"
  classId: string;
  date: string;         // YYYY-MM-DD
  records: AttendanceRecord[];
  totalA: number;
  totalP: number;
  totalAbsences: number; // totalA + totalP
  updatedAt: string;
}

export interface NotificationEntity {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  createdAt: string;
}
