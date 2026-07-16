import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AttendanceEntity, AttendanceRecord, ClassEntity, ScheduleEntity, Teacher } from '../types';
import { Calendar, UserCheck, CheckCircle, AlertCircle, Save, Info } from 'lucide-react';
import { DAYS_KHMER, TIME_SLOTS } from '../utils/excelTemplates';

interface AttendanceMarkerProps {
  classes: ClassEntity[];
  teachers: Teacher[];
  schedules: ScheduleEntity[];
  onRefresh: () => Promise<void>;
  onTriggerNotification: (title: string, message: string, type: 'info' | 'warning' | 'danger') => void;
}

export default function AttendanceMarker({ classes, teachers, schedules, onRefresh, onTriggerNotification }: AttendanceMarkerProps) {
  // Today's date in local time YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedClassId, setSelectedClassId] = useState('');
  const [scheduledSlots, setScheduledSlots] = useState<ScheduleEntity[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'A' | 'P'>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Map teachers for quick lookup by subject code and teacher code
  const teacherMap = teachers.reduce((acc, t) => {
    if (t.subjectCode) {
      acc[t.subjectCode.toUpperCase()] = t;
    }
    acc[t.teacherCode] = t;
    return acc;
  }, {} as Record<string, Teacher>);

  // Determine Khmer day of the week from selected date
  const getKhmerDayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayIdx = dateObj.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    
    // JS getDay(): 0: Sunday, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const map = [
      'អាទិត្យ', // Sunday (Not typically in master schedule but handle gracefully)
      'ចន្ទ',
      'អង្គារ',
      'ពុធ',
      'ព្រហស្បតិ៍',
      'សុក្រ',
      'សៅរ៍'
    ];
    return map[dayIdx] || '';
  };

  const khmerDay = getKhmerDayOfWeek(selectedDate);

  // Fetch scheduled slots for the selected class and day of week
  useEffect(() => {
    if (!selectedClassId || !khmerDay) {
      setScheduledSlots([]);
      setAttendanceRecords({});
      return;
    }

    const cleanStr = (val: string) => (val || '').replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, '').trim().toUpperCase();

    // Filter schedules matching selectedClassId and dayOfWeek
    const slots = schedules.filter(
      s => cleanStr(s.classId) === cleanStr(selectedClassId) && cleanStr(s.dayOfWeek) === cleanStr(khmerDay)
    );

    // Sort slots according to standard TIME_SLOTS order
    slots.sort((a, b) => {
      return TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot);
    });

    setScheduledSlots(slots);
    
    // Reset attendance records default to "Present"
    const initialRecords: Record<string, 'Present' | 'A' | 'P'> = {};
    slots.forEach(slot => {
      initialRecords[slot.timeSlot] = 'Present';
    });
    setAttendanceRecords(initialRecords);
    
    setError('');
    setSuccessMsg('');

    // Fetch existing attendance from Firebase if already taken
    const loadExistingAttendance = async () => {
      setLoading(true);
      const docId = `${selectedClassId}-${selectedDate}`;
      try {
        const docRef = doc(db, 'attendances', docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as AttendanceEntity;
          const mergedRecords = { ...initialRecords };
          data.records.forEach(rec => {
            mergedRecords[rec.timeSlot] = rec.status;
          });
          setAttendanceRecords(mergedRecords);
          setSuccessMsg('ទិន្នន័យវត្តមានមុនត្រូវបានទាញយក និងបង្ហាញឡើងវិញ។');
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExistingAttendance();
  }, [selectedClassId, selectedDate, schedules, khmerDay]);

  // Handle radio change
  const handleStatusChange = (timeSlot: string, status: 'Present' | 'A' | 'P') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [timeSlot]: status
    }));
  };

  // Calculate totals
  const totalA = Object.values(attendanceRecords).filter(s => s === 'A').length;
  const totalP = Object.values(attendanceRecords).filter(s => s === 'P').length;
  const totalAbsences = totalA + totalP;

  // Save to Firebase
  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');

    const attendanceId = `${selectedClassId}-${selectedDate}`;
    
    // Map records list
    const recordsList: AttendanceRecord[] = scheduledSlots.map(slot => ({
      timeSlot: slot.timeSlot,
      teacherId: slot.teacherId,
      status: attendanceRecords[slot.timeSlot] || 'Present'
    }));

    const attendanceData: AttendanceEntity = {
      attendanceId,
      classId: selectedClassId,
      date: selectedDate,
      records: recordsList,
      totalA,
      totalP,
      totalAbsences,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'attendances', attendanceId), attendanceData);
      setSuccessMsg('វត្តមានត្រូវបានកត់ត្រា និងរក្សាទុកក្នុង Firebase ដោយជោគជ័យ!');
      
      // Post a notification if any absences occurred
      if (totalAbsences > 0) {
        let alertMessage = `ថ្នាក់ ${selectedClassId} មានអវត្តមាន៖ `;
        const detailParts: string[] = [];
        
        recordsList.forEach(rec => {
          if (rec.status !== 'Present') {
            const t = teacherMap[rec.teacherId.toUpperCase()] || teacherMap[rec.teacherId];
            const name = t ? `${t.lastName} ${t.firstName}`.trim() : rec.teacherId;
            const statusLabel = rec.status === 'A' ? 'អត់ច្បាប់ (A)' : 'មានច្បាប់ (P)';
            detailParts.push(`ម៉ោង ${rec.timeSlot}: ${name} (${statusLabel})`);
          }
        });
        
        alertMessage += detailParts.join(', ');
        
        onTriggerNotification(
          `របាយការណ៍អវត្តមាន ថ្នាក់ ${selectedClassId}`,
          alertMessage,
          'danger'
        );
      } else {
        onTriggerNotification(
          'វត្តមានប្រចាំថ្ងៃ',
          `បានចុះវត្តមានសម្រាប់ថ្នាក់ ${selectedClassId} កាលបរិច្ឆេទ ${selectedDate}៖ វត្តមានពេញលេញ (គ្មានអវត្តមាន)។`,
          'info'
        );
      }

      await onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `attendances/${attendanceId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" id="attendance_marker_container">
      {/* Selector banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Date selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            កាលបរិច្ឆេទ (Date)
          </label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              id="attendance_date_picker"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            ថ្ងៃសិក្សា៖ <span className="font-semibold text-blue-600">{khmerDay || 'គ្មាន'}</span>
          </span>
        </div>

        {/* Class Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            ជ្រើសរើសថ្នាក់ (Select Class)
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            id="attendance_class_selector"
          >
            <option value="">-- ជ្រើសរើសថ្នាក់ --</option>
            {classes.map(cls => (
              <option key={cls.classId} value={cls.classId}>
                ថ្នាក់ {cls.classId} (ថ្នាក់ទី {cls.grade})
              </option>
            ))}
          </select>
        </div>

        {/* Info or helper summary */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Info className="h-4 w-4 text-blue-600" />
            ព័ត៌មានចុះវត្តមាន
          </div>
          <p className="leading-relaxed">
            ប្រព័ន្ធនឹងទាញកាលវិភាគស្វ័យប្រវត្តិតាម <span className="font-semibold text-blue-700">ថ្ងៃសប្តាហ៍</span> នៃកាលបរិច្ឆេទដែលបានជ្រើសរើស។
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Attendance List */}
      {!selectedClassId ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <UserCheck className="h-12 w-12 text-slate-300 mb-2" />
          <h4 className="font-moul text-slate-600 text-sm">សូមជ្រើសរើសថ្នាក់រៀន</h4>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            ជ្រើសរើសថ្នាក់ ដើម្បីបង្ហាញបញ្ជីឈ្មោះគ្រូ និងម៉ោងបង្រៀនសម្រាប់ចុះវត្តមាន
          </p>
        </div>
      ) : khmerDay === 'អាទិត្យ' ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-2xl shadow-sm">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
          <h4 className="font-moul text-amber-700 text-sm">ថ្ងៃអាទិត្យជាថ្ងៃឈប់សម្រាក</h4>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            កាលវិភាគរួមមិនមានម៉ោងសិក្សាសម្រាប់ថ្ងៃអាទិត្យឡើយ។
          </p>
        </div>
      ) : scheduledSlots.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-2xl shadow-sm">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-moul text-slate-600 text-sm">មិនមានកាលវិភាគបង្រៀន</h4>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            ថ្នាក់ {selectedClassId} មិនមានម៉ោងសិក្សាក្នុងថ្ងៃ <span className="font-bold text-blue-600">{khmerDay}</span> នេះទេ។
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
            <h3 className="text-md font-moul text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
              បញ្ជីឈ្មោះគ្រូបង្រៀនប្រចាំថ្ងៃ {khmerDay} ({selectedDate})
            </h3>

            {loading ? (
              <div className="text-center py-12 text-slate-500">កំពុងទាញយកទិន្នន័យ...</div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {scheduledSlots.map((slot) => {
                  const t = teacherMap[slot.teacherId.toUpperCase()] || teacherMap[slot.teacherId];
                  const teacherName = t ? `${t.lastName} ${t.firstName}`.trim() : `មុខវិជ្ជា៖ ${slot.teacherId}`;
                  const currentStatus = attendanceRecords[slot.timeSlot] || 'Present';

                  return (
                    <div
                      key={slot.scheduleId}
                      className="p-4 border border-slate-200 rounded-2xl hover:border-blue-200 hover:bg-blue-50/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Class Details */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                            ម៉ោង {slot.timeSlot}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-1 font-sans">
                          {teacherName}
                        </h4>
                        {t && t.subjectName && (
                          <span className="text-xs text-slate-500 block mt-0.5">
                            មុខវិជ្ជា៖ {t.subjectName}
                          </span>
                        )}
                      </div>

                      {/* Attendance Selector Buttons */}
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {/* Present Option */}
                        <button
                          onClick={() => handleStatusChange(slot.timeSlot, 'Present')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            currentStatus === 'Present'
                              ? 'bg-blue-100 text-blue-800 border-blue-500 font-semibold'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          មានវត្តមាន
                        </button>

                        {/* P (Permission / មានច្បាប់) */}
                        <button
                          onClick={() => handleStatusChange(slot.timeSlot, 'P')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            currentStatus === 'P'
                              ? 'bg-amber-100 text-amber-800 border-amber-500 font-semibold'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          មានច្បាប់ (P)
                        </button>

                        {/* A (Absent / អត់ច្បាប់) */}
                        <button
                          onClick={() => handleStatusChange(slot.timeSlot, 'A')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            currentStatus === 'A'
                              ? 'bg-rose-100 text-rose-800 border-rose-500 font-semibold'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          អត់ច្បាប់ (A)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Totals & Submit panel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-5">
            <h3 className="text-md font-moul text-slate-700 border-b border-slate-200 pb-3">
              របាយការណ៍សង្ខេបថ្ងៃនេះ
            </h3>

            <div className="space-y-3 font-sans text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-500">ម៉ោងបង្រៀនសរុប៖</span>
                <span className="font-bold text-slate-800">{scheduledSlots.length} ម៉ោង</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 text-rose-600 font-semibold">
                <span>សរុបអត់ច្បាប់ (A)៖</span>
                <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">{totalA}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 text-amber-600 font-semibold">
                <span>សរុបមានច្បាប់ (P)៖</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">{totalP}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-slate-800 font-bold border-b border-slate-300 text-md">
                <span>សរុបរួមអវត្តមាន៖</span>
                <span className="text-rose-700 bg-rose-100 px-3 py-0.5 rounded-full">{totalAbsences}</span>
              </div>
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="w-full py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:bg-blue-400"
              id="save_attendance_btn"
            >
              <Save className="h-4 w-4" />
              {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមាន'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
