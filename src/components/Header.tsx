import { Bell, Award, Users, BookOpen, Calendar, CheckSquare, BarChart2 } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificationCount: number;
  onOpenNotifications: () => void;
}

export default function Header({ activeTab, setActiveTab, notificationCount, onOpenNotifications }: HeaderProps) {
  const navItems = [
    { id: 'attendance', label: 'កត់វត្តមាន', icon: CheckSquare },
    { id: 'teachers', label: 'គ្រូបង្រៀន', icon: Users },
    { id: 'classes', label: 'ថ្នាក់រៀន', icon: BookOpen },
    { id: 'schedule', label: 'កាលវិភាគរួម', icon: Calendar },
    { id: 'reports', label: 'របាយការណ៍', icon: BarChart2 }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-500/20">
              <Award className="h-6 w-6" id="app_logo_icon" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-moul tracking-normal text-white leading-tight">
                ប្រព័ន្ធគ្រប់គ្រងវត្តមានគ្រូបង្រៀន
              </h1>
              <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest hidden sm:block">
                Teacher Attendance Pro
              </p>
            </div>
          </div>

          {/* Quick Actions (Notifications) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="notification_bell_btn"
            >
              <Bell className="h-6 w-6" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                id={`nav_btn_${item.id}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation (Bottom bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-xl px-2 py-1.5 flex justify-around items-center z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all ${
                isActive ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'
              }`}
              id={`nav_btn_mobile_${item.id}`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
              <span className="text-[10px] font-medium leading-none truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
