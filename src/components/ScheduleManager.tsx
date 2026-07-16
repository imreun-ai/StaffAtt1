import React, { useState, useRef } from 'react';
import { setDoc, doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ScheduleEntity, Teacher, ClassEntity } from '../types';
import { downloadScheduleTemplate, parseScheduleExcel, DAYS_KHMER, TIME_SLOTS } from '../utils/excelTemplates';
import { Download, Upload, Calendar, AlertCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ScheduleManagerProps {
  schedules: ScheduleEntity[];
  teachers: Teacher[];
  classes: ClassEntity[];
  onRefresh: () => Promise<void>;
  onTriggerNotification: (title: string, message: string, type: 'info' | 'warning' | 'danger') => void;
}

export default function ScheduleManager({ schedules, teachers, classes, onRefresh, onTriggerNotification }: ScheduleManagerProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map teacher codes or subject codes to names for easy display
  const teacherMap = teachers.reduce((acc, t) => {
    const fullName = `${t.lastName} ${t.firstName}`.trim();
    if (t.subjectCode) {
      acc[t.subjectCode.toUpperCase()] = fullName;
    }
    acc[t.teacherCode] = fullName;
    return acc;
  }, {} as Record<string, string>);

  // Map teacher codes or subject codes to subject codes for easy display
  const subjectCodeMap = teachers.reduce((acc, t) => {
    if (t.subjectCode) {
      acc[t.subjectCode.toUpperCase()] = t.subjectCode;
    }
    acc[t.teacherCode] = t.subjectCode || '';
    return acc;
  }, {} as Record<string, string>);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');

    try {
      const parsedSchedules = await parseScheduleExcel(file);
      if (parsedSchedules.length === 0) {
        setError('គ្មានទិន្នន័យកាលវិភាគត្រឹមត្រូវត្រូវបានរកឃើញក្នុងឯកសារ Excel ទេ!');
        setImporting(false);
        return;
      }

      // Upload parsed schedules to Firestore.
      // We can use a batch to optimize writes.
      const batch = writeBatch(db);
      let count = 0;
      
      for (const s of parsedSchedules) {
        const scheduleRef = doc(db, 'schedules', s.scheduleId);
        batch.set(scheduleRef, s);
        count++;
      }
      
      await batch.commit();

      onTriggerNotification(
        'នាំចូលកាលវិភាគជោគជ័យ',
        `បាននាំចូលរន្ធម៉ោងសិក្សាសរុប ${count} រន្ធម៉ោងបង្រៀន ពីកាលវិភាគ Excel ដោយជោគជ័យ។`,
        'info'
      );
      await onRefresh();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setError('មានបញ្ហាក្នុងការនាំចូលកាលវិភាគ! សូមប្រាកដថាអ្នកបានប្រើឯកសារគំរូត្រឹមត្រូវ។');
    } finally {
      setImporting(false);
    }
  };

  // Clear all schedules in system
  const handleClearSchedules = async () => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបចោលកាលវិភាគទាំងអស់នៅក្នុងប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ថយក្រោយបានឡើយ។')) return;
    
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'schedules'));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      onTriggerNotification(
        'លុបកាលវិភាគទាំងអស់',
        'បានលុបកាលវិភាគទាំងអស់ចេញពីប្រព័ន្ធដោយជោគជ័យ។',
        'warning'
      );
      await onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'schedules');
    } finally {
      setLoading(false);
    }
  };

  // Build schedule matrix for selected class
  const getScheduleForCell = (clsId: string, day: string, slot: string) => {
    return schedules.find(s => s.classId === clsId && s.dayOfWeek === day && s.timeSlot === slot);
  };

  const parseClassId = (classId: string) => {
    const match = classId.match(/^(\d+)(.*)$/);
    if (match) {
      return {
        grade: parseInt(match[1], 10),
        group: match[2]
      };
    }
    return { grade: 0, group: classId };
  };

  const activeClasses = Array.from(new Set(schedules.map(s => s.classId))).sort((a, b) => {
    const classA = parseClassId(a);
    const classB = parseClassId(b);
    if (classA.grade !== classB.grade) {
      return classA.grade - classB.grade;
    }
    return classA.group.localeCompare(classB.group);
  });
  const classesToRender = selectedClass
    ? [selectedClass]
    : (activeClasses.length > 0 ? activeClasses : classes.map(c => c.classId));

  return (
    <div className="space-y-6 pb-20 md:pb-0" id="schedule_manager_container">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-moul text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">■</span> កាលវិភាគរួមប្រចាំសប្តាហ៍
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-1">
            ទាញយកឯកសារគំរូ បំពេញកាលវិភាគរួម ហើយនាំចូលមកក្នុងប្រព័ន្ធវិញ
          </p>
        </div>
        
        {/* Actions buttons */}
        <div className="flex flex-wrap gap-2">
          {schedules.length > 0 && (
            <button
              onClick={handleClearSchedules}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
              id="clear_schedules_btn"
            >
              <Trash2 className="h-4 w-4" />
              លុបកាលវិភាគទាំងអស់
            </button>
          )}
          <button
            onClick={downloadScheduleTemplate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
            id="download_schedule_template_btn"
          >
            <Download className="h-4 w-4" />
            ទាញយកគំរូ Excel
          </button>
          <label
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm transition-colors"
            id="upload_schedule_excel_label"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'កំពុងនាំចូល...' : 'នាំចូលកាលវិភាគ'}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelUpload}
              accept=".xlsx, .xls"
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 pb-4">
          <h3 className="text-md font-moul text-slate-700 flex items-center gap-1.5">
            <Calendar className="h-5 w-5 text-blue-600" />
            បង្ហាញកាលវិភាគសិក្សាតាមថ្នាក់
          </h3>

          {/* Filter dropdown */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap">ជ្រើសរើសថ្នាក់៖</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-40 px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              id="select_class_schedule_filter"
            >
              <option value="">-- បង្ហាញទាំងអស់ --</option>
              {(activeClasses.length > 0 ? activeClasses : classes.map(c => c.classId)).map(clsId => (
                <option key={clsId} value={clsId}>ថ្នាក់ {clsId}</option>
              ))}
            </select>
          </div>
        </div>

        {classesToRender.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center">
            <FileSpreadsheet className="h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 font-sans">
              មិនមានទិន្នន័យកាលវិភាគសម្រាប់បង្ហាញឡើយ។ សូមនាំចូលកាលវិភាគជាមុនសិន។
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-900 text-white font-moul">
                {/* Day Header Row */}
                <tr>
                  <th rowSpan={2} className="px-4 py-4 text-center border-r border-slate-800 text-xs tracking-normal font-normal bg-slate-950 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.15)]">
                    ថ្នាក់
                  </th>
                  {DAYS_KHMER.map(day => (
                    <th
                      key={day}
                      colSpan={TIME_SLOTS.length}
                      className="px-2 py-2 text-center text-xs tracking-normal border-r border-slate-800 font-normal"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
                {/* Time Slots Row */}
                <tr className="bg-slate-800 text-white font-sans text-xs">
                  {DAYS_KHMER.map(day => (
                    TIME_SLOTS.map((slot, slotIdx) => (
                      <th
                        key={`${day}-${slot}`}
                        className={`px-1 py-2 text-center font-bold ${
                          slotIdx === TIME_SLOTS.length - 1 ? 'border-r border-slate-700' : 'border-r border-slate-800/55'
                        }`}
                      >
                        {slot}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {classesToRender.map(clsId => (
                  <tr key={clsId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-center font-bold text-slate-800 border-r border-slate-200 font-sans bg-slate-50/90 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      ថ្នាក់ {clsId}
                    </td>
                    {DAYS_KHMER.map(day => (
                      TIME_SLOTS.map((slot, slotIdx) => {
                        const sched = getScheduleForCell(clsId, day, slot);
                        const tName = sched ? (teacherMap[sched.teacherId.toUpperCase()] || sched.teacherId) : null;
                        const subjCode = sched ? (subjectCodeMap[sched.teacherId.toUpperCase()] || '') : '';
                        return (
                          <td
                            key={`${clsId}-${day}-${slot}`}
                            className={`px-1 py-3 text-center text-xs min-w-[75px] ${
                              slotIdx === TIME_SLOTS.length - 1 ? 'border-r border-slate-200' : 'border-r border-slate-100'
                            } ${sched ? 'bg-blue-50/40' : ''}`}
                          >
                            {sched ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-blue-800 block text-[11px] leading-tight font-sans">
                                  {tName}
                                </span>
                                {subjCode && (
                                  <span className="font-bold text-[10px] text-slate-400 font-mono block">
                                    {subjCode}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        );
                      })
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
