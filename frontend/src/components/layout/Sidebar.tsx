import React from 'react';
import {
  LayoutDashboard,
  Microscope,
  Calendar,
  ClipboardList,
  FolderOpen,
  BarChart3,
  Bot,
  CheckSquare,
  Sparkles,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../common/Avatar';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  facultyOnly?: boolean;
}

export default function Sidebar() {
  const { state, dispatch } = useAppStore();
  const { activePage, currentPersona, sidebarOpen, notifications } = state;

  const pendingApprovalsCount = notifications.filter(
    (n) => !n.isRead && n.type === 'warning'
  ).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Equipment Explorer', icon: Microscope },
    { id: 'booking', label: 'Smart Booking', icon: Calendar },
    { id: 'requests', label: 'My Requests', icon: ClipboardList },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'analytics', label: 'Resource Analytics', icon: BarChart3 },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      facultyOnly: true,
    },
  ];

  const visibleNav = navItems.filter(
    (item) => !item.facultyOnly || currentPersona.role === 'faculty' || currentPersona.role === 'admin'
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-indigo-900/40 shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Area */}
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h1 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-1.5">
                  LabLink <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-400/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">AI 2.0</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Campus Resource Grid</p>
              </div>
            </div>

            <button
              onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    dispatch({ type: 'SET_PAGE', payload: item.id });
                    // Close on mobile
                    if (window.innerWidth < 768) {
                      dispatch({ type: 'SET_SIDEBAR', payload: false });
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500 text-slate-950 shadow-sm animate-bounce">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} className="text-white/60" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: User & Campus Status */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-emerald-400 tracking-wide">
              Campus Grid: 99.8% Online
            </span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <Avatar initials={currentPersona.avatar} size="md" />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentPersona.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{currentPersona.role} • {currentPersona.department}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
