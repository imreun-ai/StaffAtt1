import { useState } from 'react';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ClassEntity } from '../types';
import { Plus, Trash2, BookOpen, Layers, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ClassesManagerProps {
  classes: ClassEntity[];
  onRefresh: () => Promise<void>;
  onTriggerNotification: (title: string, message: string, type: 'info' | 'warning' | 'danger') => void;
}

export default function ClassesManager({ classes, onRefresh, onTriggerNotification }: ClassesManagerProps) {
  const gradesList = ['7', '8', '9', '10', '11', '12'];
  const groupsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle grade selection
  const toggleGrade = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  // Toggle group selection
  const toggleGroup = (group: string) => {
    if (selectedGroups.includes(group)) {
      setSelectedGroups(selectedGroups.filter(g => g !== group));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  // Multi-select and add classes
  const handleAddClasses = async () => {
    if (selectedGrades.length === 0 || selectedGroups.length === 0) {
      setError('សូមជ្រើសរើសថ្នាក់ (7-12) និងក្រុមថ្នាក់ (A-J) យ៉ាងហោចណាស់មួយ!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let createdCount = 0;
      // Loop through all selected grades and groups
      for (const grade of selectedGrades) {
        for (const group of selectedGroups) {
          const classId = `${grade}${group}`;
          const newClass: ClassEntity = {
            classId,
            grade,
            group
          };
          // Save to Firestore
          await setDoc(doc(db, 'classes', classId), newClass);
          createdCount++;
        }
      }

      onTriggerNotification(
        'បង្កើតថ្នាក់រៀនជោគជ័យ',
        `បានបង្កើតថ្នាក់រៀនថ្មីសរុបចំនួន ${createdCount} ថ្នាក់។`,
        'info'
      );

      // Clear selections
      setSelectedGrades([]);
      setSelectedGroups([]);
      await onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'classes');
    } finally {
      setLoading(false);
    }
  };

  // Delete individual class
  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបថ្នាក់ ${classId} នេះមែនទេ?`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'classes', classId));
      onTriggerNotification(
        'លុបថ្នាក់រៀន',
        `ថ្នាក់រៀន ${classId} ត្រូវបានលុបចេញពីប្រព័ន្ធ។`,
        'warning'
      );
      await onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${classId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" id="classes_manager_container">
      {/* Introduction Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-moul text-slate-800 flex items-center gap-2">
          <span className="text-blue-600">■</span> គ្រប់គ្រងថ្នាក់រៀន
        </h2>
        <p className="text-sm text-slate-500 font-sans mt-1">
          បញ្ចូលថ្នាក់រៀនដោយជ្រើសរើស កម្រិតថ្នាក់ (៧ ដល់ ១២) និង ក្រុមថ្នាក់ (A, B, C...) អាចបញ្ចូលម្តងបានច្រើនថ្នាក់។
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-6">
          <h3 className="text-md font-moul text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-3">
            <Plus className="h-5 w-5 text-blue-600" />
            បង្កើតថ្នាក់រៀនច្រើនក្នុងពេលតែមួយ
          </h3>

          {/* Grade selection */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              ១. ជ្រើសរើសកម្រិតថ្នាក់ (Grade)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {gradesList.map(grade => {
                const isSelected = selectedGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    onClick={() => toggleGrade(grade)}
                    type="button"
                    className={`py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    id={`btn_select_grade_${grade}`}
                  >
                    ថ្នាក់ទី {grade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group selection */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              ២. ជ្រើសរើសក្រុមថ្នាក់ (Group / Letter)
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {groupsList.map(group => {
                const isSelected = selectedGroups.includes(group);
                return (
                  <button
                    key={group}
                    onClick={() => toggleGroup(group)}
                    type="button"
                    className={`py-2 px-1 rounded-xl text-sm font-semibold border transition-all text-center ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    id={`btn_select_group_${group}`}
                  >
                    {group}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleAddClasses}
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:bg-blue-400"
            id="add_classes_batch_btn"
          >
            {loading ? 'កំពុងបង្កើត...' : 'បង្កើតថ្នាក់រៀន'}
          </button>
        </div>

        {/* List of existing classes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
          <h3 className="text-md font-moul text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
            បញ្ជីថ្នាក់រៀនដែលមានស្រាប់ ({classes.length} ថ្នាក់)
          </h3>

          {classes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-sans">
              មិនទាន់មានថ្នាក់រៀននៅក្នុងប្រព័ន្ធនៅឡើយទេ។ សូមបង្កើតថ្នាក់រៀននៅផ្នែកខាងឆ្វេង។
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-2">
              {classes.map(cls => (
                <div
                  key={cls.classId}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-xl transition-all group"
                  id={`class_item_${cls.classId}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {cls.classId}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">ថ្នាក់ទី {cls.grade}</span>
                      <span className="text-[10px] text-slate-400 font-sans block">ក្រុម {cls.group}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(cls.classId)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors"
                    title={`លុបថ្នាក់ ${cls.classId}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
