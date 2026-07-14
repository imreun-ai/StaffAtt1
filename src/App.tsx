import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Teacher, ClassEntity, ScheduleEntity, AttendanceEntity, NotificationEntity } from './types';

// Components
import Header from './components/Header';
import TeachersManager from './components/TeachersManager';
import ClassesManager from './components/ClassesManager';
import ScheduleManager from './components/ScheduleManager';
import AttendanceMarker from './components/AttendanceMarker';
import ReportsManager from './components/ReportsManager';
import NotificationCenter from './components/NotificationCenter';

// Icons for toast/loading
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(true);

  // Firestore States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntity[]>([]);
  const [attendances, setAttendances] = useState<AttendanceEntity[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntity[]>([]);

  // UI States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; title: string; type: 'info' | 'warning' | 'danger' } | null>(null);

  // Real-time synchronization listeners for Firestore collections
  useEffect(() => {
    setLoading(true);

    // 1. Teachers Listener
    const unsubTeachers = onSnapshot(
      collection(db, 'teachers'),
      (snapshot) => {
        const list: Teacher[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Teacher);
        });
        setTeachers(list.sort((a, b) => a.teacherCode.localeCompare(b.teacherCode)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'teachers')
    );

    // 2. Classes Listener
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const list: ClassEntity[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ClassEntity);
        });
        // Sort by Grade then Group
        list.sort((a, b) => {
          const numA = parseInt(a.grade, 10) || 0;
          const numB = parseInt(b.grade, 10) || 0;
          if (numA !== numB) return numA - numB;
          return a.group.localeCompare(b.group);
        });
        setClasses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'classes')
    );

    // 3. Schedules Listener
    const unsubSchedules = onSnapshot(
      collection(db, 'schedules'),
      (snapshot) => {
        const list: ScheduleEntity[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ScheduleEntity);
        });
        setSchedules(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'schedules')
    );

    // 4. Attendances Listener
    const unsubAttendances = onSnapshot(
      collection(db, 'attendances'),
      (snapshot) => {
        const list: AttendanceEntity[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AttendanceEntity);
        });
        setAttendances(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'attendances')
    );

    // 5. Notifications Listener (Sorted by newest first)
    const qNotifs = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubNotifications = onSnapshot(
      qNotifs,
      (snapshot) => {
        const list: NotificationEntity[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as NotificationEntity);
        });
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        // Fallback if query indexing is pending
        console.warn("Notifications sorting index pending, loading unsorted.");
        const unsubFallback = onSnapshot(
          collection(db, 'notifications'),
          (snap) => {
            const list: NotificationEntity[] = [];
            snap.forEach((doc) => {
              list.push(doc.data() as NotificationEntity);
            });
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setNotifications(list);
            setLoading(false);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
        );
        return unsubFallback;
      }
    );

    return () => {
      unsubTeachers();
      unsubClasses();
      unsubSchedules();
      unsubAttendances();
      unsubNotifications();
    };
  }, []);

  // Write a notification to Firestore and display instant Toast
  const triggerNotification = async (title: string, message: string, type: 'info' | 'warning' | 'danger') => {
    const id = `notif-${Date.now()}`;
    const newNotif: NotificationEntity = {
      id,
      title,
      message,
      type,
      createdAt: new Date().toISOString()
    };

    // Show instant toast
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 5000);

    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (err) {
      console.error('Error logging notification to Firestore:', err);
    }
  };

  // Helper trigger to refresh collections (standard callback)
  const handleRefresh = async () => {
    // onSnapshot does this reactively, but export function to satisfy typings
    console.log("Firebase sync is active and real-time.");
  };

  // Render components according to chosen Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
        return (
          <AttendanceMarker
            classes={classes}
            teachers={teachers}
            schedules={schedules}
            onRefresh={handleRefresh}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'teachers':
        return (
          <TeachersManager
            teachers={teachers}
            onRefresh={handleRefresh}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'classes':
        return (
          <ClassesManager
            classes={classes}
            onRefresh={handleRefresh}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'schedule':
        return (
          <ScheduleManager
            schedules={schedules}
            teachers={teachers}
            classes={classes}
            onRefresh={handleRefresh}
            onTriggerNotification={triggerNotification}
          />
        );
      case 'reports':
        return (
          <ReportsManager
            teachers={teachers}
            attendances={attendances}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-950 pb-20 md:pb-0" id="main_app_wrapper">
      {/* Header and top navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notificationCount={notifications.length}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
            <p className="text-sm font-sans text-slate-500">កំពុងភ្ជាប់ទៅកាន់ Firebase...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* In-app Notification center drawer */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onRefresh={handleRefresh}
      />

      {/* Floating Push-style Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-start space-x-3"
            id="floating_toast_message"
          >
            <div className="flex-shrink-0">
              {toast.type === 'danger' && <AlertTriangle className="h-5 w-5 text-rose-500" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {toast.type === 'info' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-moul text-slate-800 leading-tight">{toast.title}</h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
