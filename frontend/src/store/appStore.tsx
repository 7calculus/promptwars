import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Persona, Notification, Booking, LabRequest, PERSONAS } from '../types';
import { MOCK_NOTIFICATIONS, MOCK_BOOKINGS, MOCK_REQUESTS } from '../data/mockData';
import { onConnectivityChange } from '../services/api';

interface AppState {
  currentPersona: Persona;
  notifications: Notification[];
  activePage: string;
  sidebarOpen: boolean;
  /** Backend unreachable → app runs in local demo mode */
  offline: boolean;
  /** Equipment chosen in Explorer / Assistant, pre-selected in Smart Booking */
  selectedEquipmentId: string | null;
  /** Local copies used only while the backend is unreachable */
  demoBookings: Booking[];
  demoRequests: LabRequest[];
}

type AppAction =
  | { type: 'SET_PERSONA'; payload: Persona }
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'SELECT_EQUIPMENT'; payload: string | null }
  | { type: 'ADD_DEMO_BOOKING'; payload: { booking: Booking; request?: LabRequest } }
  | { type: 'CANCEL_DEMO_BOOKING'; payload: string }
  | { type: 'DECIDE_DEMO_REQUEST'; payload: { id: string; status: 'approved' | 'rejected'; notes?: string; facultyName?: string } };

const initialState: AppState = {
  currentPersona: PERSONAS[0],
  notifications: MOCK_NOTIFICATIONS,
  activePage: 'dashboard',
  sidebarOpen: true,
  offline: false,
  selectedEquipmentId: null,
  demoBookings: MOCK_BOOKINGS,
  demoRequests: MOCK_REQUESTS,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PERSONA':
      return { ...state, currentPersona: action.payload };
    case 'SET_PAGE':
      return { ...state, activePage: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'SET_OFFLINE':
      return state.offline === action.payload ? state : { ...state, offline: action.payload };
    case 'SELECT_EQUIPMENT':
      return { ...state, selectedEquipmentId: action.payload };
    case 'ADD_DEMO_BOOKING':
      return {
        ...state,
        demoBookings: [action.payload.booking, ...state.demoBookings],
        demoRequests: action.payload.request
          ? [action.payload.request, ...state.demoRequests]
          : state.demoRequests,
      };
    case 'CANCEL_DEMO_BOOKING':
      return {
        ...state,
        demoBookings: state.demoBookings.map((b) =>
          b.id === action.payload ? { ...b, status: 'cancelled' } : b
        ),
      };
    case 'DECIDE_DEMO_REQUEST': {
      const { id, status, notes, facultyName } = action.payload;
      const now = new Date().toISOString();
      const target = state.demoRequests.find((r) => r.id === id);
      return {
        ...state,
        demoRequests: state.demoRequests.map((r) =>
          r.id === id ? { ...r, status, notes: notes ?? r.notes, facultyName, updatedAt: now } : r
        ),
        demoBookings: state.demoBookings.map((b) =>
          target && b.id === target.bookingId ? { ...b, status, updatedAt: now } : b
        ),
      };
    }
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  useEffect(
    () => onConnectivityChange((offline) => dispatch({ type: 'SET_OFFLINE', payload: offline })),
    []
  );
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
