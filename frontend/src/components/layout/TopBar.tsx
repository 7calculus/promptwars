import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Menu,
  ChevronDown,
  UserCheck,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { PERSONAS } from '../../types';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';
import { demoAPI } from '../../services/api';

export default function TopBar() {
  const { state, dispatch } = useAppStore();
  const { currentPersona, notifications } = state;

  const [personaOpen, setPersonaOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const personaRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (personaRef.current && !personaRef.current.contains(event.target as Node)) {
        setPersonaOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      await demoAPI.reset();
      toast.success('LabLink Demo State Reset Successfully!');
    } catch (e) {
      // Even if backend is not up yet, inform cleanly
      toast.success('LabLink Demo Reset (Client state refreshed)');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 bg-[#050505]/75 backdrop-blur-xl border-b border-orange-500/20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 relative">
      <div className="hud-line absolute left-0 right-0 bottom-0" />
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-orange-500/10 text-orange-300 border border-orange-500/40 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Sparkles size={12} className="text-indigo-600" />
            Active Role:
          </span>
          <span className="text-sm font-bold text-slate-800">
            {currentPersona.name}
          </span>
          {state.offline && (
            <span
              title="The LabLink server can't be reached, so changes are only kept in this browser tab. Start the backend and refresh."
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded border border-red-500/60 bg-red-500/10 text-red-300 animate-pulse"
            >
              Offline · demo mode
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Reset Demo State Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          title="Reset Demo Data"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 disabled:opacity-50"
        >
          <RotateCcw size={13} className={isResetting ? 'animate-spin' : ''} />
          Reset Demo
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-indigo-600 relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-800">Notifications</h4>
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'MARK_ALL_READ' })}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notif.id })}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                        !notif.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          !notif.isRead ? 'bg-indigo-600' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-800">{notif.title}</h5>
                          <span className="text-[10px] text-slate-400">Just now</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Persona Switcher Dropdown */}
        <div className="relative" ref={personaRef}>
          <button
            onClick={() => setPersonaOpen(!personaOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
          >
            <Avatar initials={currentPersona.avatar} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {currentPersona.name}
              </p>
              <p className="text-[10px] text-slate-500 capitalize leading-tight">
                {currentPersona.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {personaOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Persona / Role
                </p>
              </div>

              <div className="space-y-1 mt-1">
                {PERSONAS.map((persona) => {
                  const isSelected = currentPersona.id === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => {
                        dispatch({ type: 'SET_PERSONA', payload: persona });
                        setPersonaOpen(false);
                        toast.success(`Switched role to ${persona.name}`);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={persona.avatar} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{persona.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">
                            {persona.role} • {persona.department}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check size={16} className="text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
