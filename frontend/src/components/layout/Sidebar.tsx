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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#070708]/95 backdrop-blur-xl text-neutral-400 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-orange-500/25 shadow-[8px_0_40px_-12px_rgba(255,106,0,0.35)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Area */}
          <div className="p-5 flex items-center justify-between border-b border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-black shadow-[0_0_22px_rgba(255,106,0,0.7)] animate-glow-pulse">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-white text-lg flex items-center gap-1.5">
                  LabLink <span className="text-[10px] bg-orange-500/15 text-orange-300 border border-orange-400/40 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono font-semibold">GenAI</span>
                </h1>
                <p className="text-[10px] text-orange-300/70 font-mono uppercase tracking-[0.18em]">Campus Resource Grid</p>
              </div>
            </div>

            <button
              onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
              className="p-1 rounded-lg text-neutral-400 hover:text-white md:hidden"
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
                      ? 'bg-gradient-to-r from-orange-500/25 to-transparent text-white border border-orange-500/50 shadow-[0_0_22px_-4px_rgba(255,106,0,0.55)] font-semibold'
                      : 'text-neutral-400 border border-transparent hover:text-white hover:bg-orange-500/10 hover:border-orange-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(255,106,0,0.9)]' : 'text-neutral-500 group-hover:text-orange-400 transition-colors'}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-500 text-black shadow-[0_0_12px_rgba(255,106,0,0.8)] animate-bounce">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} className="text-orange-400" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: User & Campus Status */}
        <div className="p-4 border-t border-orange-500/20 bg-black/40">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-[0.15em]">
              Campus Grid: 99.8% Online
            </span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-orange-500/5 border border-orange-500/15 hover:border-orange-500/40 transition-colors">
            <Avatar initials={currentPersona.avatar} size="md" />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentPersona.name}</p>
              <p className="text-[10px] text-neutral-500 truncate capitalize">{currentPersona.role} • {currentPersona.department}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
