import { X, Bell, AlertTriangle, Info, CheckCircle2, Trash2 } from 'lucide-react';
import { NotificationEntity } from '../types';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useState } from 'react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationEntity[];
  onRefresh: () => Promise<void>;
}

export default function NotificationCenter({ isOpen, onClose, notifications, onRefresh }: NotificationCenterProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Clear all notifications in Firestore
  const handleClearAll = async () => {
    if (!window.confirm('តើអ្នកចង់លុបប្រវត្តិជូនដំណឹងទាំងអស់មែនទេ?')) return;
    
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'notifications'));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      await onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgClass = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 border-rose-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="notification_center_overlay">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-100">
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              <h3 className="text-md font-moul text-slate-800">ប្រព័ន្ធជូនដំណឹងសង្ខេប</h3>
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/50 transition-colors"
                  title="លុបទាំងអស់"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center">
                <Bell className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-sans">មិនទាន់មានការជូនដំណឹងនៅឡើយទេ</p>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  ការជូនដំណឹងនឹងលេចឡើងនៅពេលមានគ្រូអវត្តមាន។
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border text-slate-800 flex items-start space-x-3 transition-all ${getBgClass(
                    notif.type
                  )}`}
                  id={`notif_item_${notif.id}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block pt-1">
                      {new Date(notif.createdAt).toLocaleString('kh-KH')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
