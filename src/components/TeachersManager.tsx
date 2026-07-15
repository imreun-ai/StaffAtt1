import React, { useState, useRef } from 'react';
import { collection, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Teacher } from '../types';
import { downloadTeacherTemplate, parseTeachersExcel } from '../utils/excelTemplates';
import { Download, Upload, Plus, Trash2, Edit2, Check, X, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';

interface TeachersManagerProps {
  teachers: Teacher[];
  onRefresh: () => Promise<void>;
  onTriggerNotification: (title: string, message: string, type: 'info' | 'warning' | 'danger') => void;
}

export default function TeachersManager({ teachers, onRefresh, onTriggerNotification }: TeachersManagerProps) {
  const [teacherCode, setTeacherCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add or update teacher in Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !subjectCode.trim()) {
      setError('សូមបំពេញព័ត៌មានចាំបាច់៖ ឈ្មោះគ្រូបង្រៀន និងកូដមុខវិជ្ជា!');
      return;
    }

    setLoading(true);
    setError('');

    const finalTeacherCode = editingTeacher ? editingTeacher.teacherCode : subjectCode.trim().toUpperCase();

    const teacherData: Teacher = {
      teacherCode: finalTeacherCode,
      lastName: teacherName.trim(),
      firstName: '',
      subjectCode: subjectCode.trim().toUpperCase(),
      subjectName: subjectName.trim()
    };

    try {
      await setDoc(doc(db, 'teachers', teacherData.teacherCode), teacherData);
      onTriggerNotification(
        'កែសម្រួលព័ត៌មានគ្រូជោគជ័យ',
        `គ្រូបង្រៀន ${teacherData.lastName} ត្រូវបានរក្សាទុកក្នុងប្រព័ន្ធ។`,
        'info'
      );
      
      // Reset inputs
      setTeacherCode('');
      setTeacherName('');
      setSubjectCode('');
      setSubjectName('');
      setEditingTeacher(null);
      await onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teachers/${teacherData.teacherCode}`);
    } finally {
      setLoading(false);
    }
  };

  // Start editing teacher
  const startEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherCode(teacher.teacherCode);
    setTeacherName((teacher.lastName + ' ' + teacher.firstName).trim());
    setSubjectCode(teacher.subjectCode || '');
    setSubjectName(teacher.subjectName || '');
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingTeacher(null);
    setTeacherCode('');
    setTeacherName('');
    setSubjectCode('');
    setSubjectName('');
  };

  // Delete teacher
  const handleDelete = async (code: string) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបគ្រូដែលមានកូដ ${code} នេះមែនទេ?`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'teachers', code));
      onTriggerNotification(
        'លុបព័ត៌មានគ្រូ',
        `គ្រូបង្រៀនដែលមានកូដ ${code} ត្រូវបានលុបចេញពីប្រព័ន្ធ។`,
        'warning'
      );
      await onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teachers/${code}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel Import
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');

    try {
      const parsedTeachers = await parseTeachersExcel(file);
      if (parsedTeachers.length === 0) {
        setError('គ្មានទិន្នន័យត្រឹមត្រូវត្រូវបានរកឃើញក្នុងឯកសារ Excel ទេ!');
        setImporting(false);
        return;
      }

      // Upload parsed teachers to Firebase
      let importedCount = 0;
      for (const t of parsedTeachers) {
        await setDoc(doc(db, 'teachers', t.teacherCode), t);
        importedCount++;
      }

      onTriggerNotification(
        'នាំចូលគ្រូបង្រៀនជោគជ័យ',
        `នាំចូលគ្រូបង្រៀនសរុប ${importedCount} នាក់ពីឯកសារ Excel ដោយជោគជ័យ។`,
        'info'
      );
      await onRefresh();
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setError('មានបញ្ហាក្នុងការអានឯកសារ Excel! សូមពិនិត្យឯកសារគំរូឡើងវិញ។');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" id="teachers_manager_container">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-moul text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">■</span> គ្រប់គ្រងព័ត៌មានគ្រូបង្រៀន
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-1">
            បញ្ចូល កែសម្រួល ឬនាំចូលបញ្ជីឈ្មោះគ្រូបង្រៀនពីឯកសារ Excel
          </p>
        </div>
        
        {/* Buttons for Excel Sample */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadTeacherTemplate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
            id="download_teacher_template_btn"
          >
            <Download className="h-4 w-4" />
            ទាញយកគំរូ Excel
          </button>
          <label
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm transition-colors"
            id="upload_teacher_excel_label"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'កំពុងនាំចូល...' : 'នាំចូលពី Excel'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual Form Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-md font-moul text-slate-700 mb-4 flex items-center gap-1.5">
            <Plus className="h-5 w-5 text-blue-600" />
            {editingTeacher ? 'កែសម្រួលព័ត៌មានគ្រូ' : 'បញ្ចូលព័ត៌មានគ្រូថ្មី'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ឈ្មោះគ្រូបង្រៀន <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="ឧ. សុខ គន្ធា"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="input_teacher_name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                កូដមុខវិជ្ជា <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="ឧ. MATH7"
                disabled={!!editingTeacher}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                id="input_teacher_subject_code"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                មុខវិជ្ជាបង្រៀន
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="ឧ. គណិតវិទ្យា"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="input_teacher_subject_name"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingTeacher && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-2 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  បោះបង់
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:bg-blue-400"
                id="teacher_submit_btn"
              >
                {loading ? 'កំពុងរក្សាទុក...' : editingTeacher ? 'រក្សាទុក' : 'បញ្ចូលឈ្មោះ'}
              </button>
            </div>
          </form>
        </div>

        {/* Teachers Table / List Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-moul text-slate-700 flex items-center gap-1.5">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              បញ្ជីឈ្មោះគ្រូបង្រៀន ({teachers.length} នាក់)
            </h3>
          </div>

          <div className="overflow-x-auto flex-1 border border-slate-200 rounded-xl">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 font-sans">ល.រ</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 font-sans">គោត្តនាម - នាម</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 font-sans">កូដមុខវិជ្ជា</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 font-sans">មុខវិជ្ជាបង្រៀន</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-700 font-sans">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-sans">
                      មិនទាន់មានគ្រូបង្រៀននៅក្នុងបញ្ជីនៅឡើយទេ
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher, index) => (
                    <tr key={teacher.teacherCode} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 font-sans">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {(teacher.lastName + ' ' + teacher.firstName).trim()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 font-bold">
                        {teacher.subjectCode || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {teacher.subjectName || '-'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => startEdit(teacher)}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors inline-block"
                          title="កែសម្រួល"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.teacherCode)}
                          className="p-1 text-slate-500 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors inline-block"
                          title="លុប"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
