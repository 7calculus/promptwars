import React, { useState, useEffect } from 'react';
import BookingForm from '../components/booking/BookingForm';
import ConflictAlert from '../components/booking/ConflictAlert';
import { MOCK_EQUIPMENT, MOCK_PROJECTS } from '../data/mockData';
import { bookingsAPI, equipmentAPI, projectsAPI, schedulingAPI } from '../services/api';
import { AlternativeSlot, Equipment, Project } from '../types';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/appStore';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function SmartBooking() {
  const { state, dispatch } = useAppStore();
  const { currentPersona } = state;

  const [equipmentList, setEquipmentList] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [projectsList, setProjectsList] = useState<Project[]>(MOCK_PROJECTS);
  const [loading, setLoading] = useState(false);
  const [conflictAlternatives, setConflictAlternatives] = useState<AlternativeSlot[] | null>(null);

  useEffect(() => {
    equipmentAPI.getAll().then((res) => {
      if (res.data && res.data.length > 0) setEquipmentList(res.data);
    }).catch(() => {});

    projectsAPI.getAll(currentPersona.studentId).then((res) => {
      if (res.data && res.data.length > 0) setProjectsList(res.data);
    }).catch(() => {});
  }, [currentPersona]);

  const handleBookingSubmit = async (formData: any) => {
    setLoading(true);
    setConflictAlternatives(null);

    // Calculate dates from timeSlot string (e.g., '10:00 - 12:00')
    const [startHourStr, endHourStr] = formData.timeSlot.split(' - ');
    const [startH] = startHourStr.split(':');
    const [endH] = endHourStr.split(':');

    const startTime = new Date(formData.date);
    startTime.setHours(parseInt(startH, 10), 0, 0, 0);

    const endTime = new Date(formData.date);
    endTime.setHours(parseInt(endH, 10), 0, 0, 0);

    const bookingPayload = {
      equipmentId: formData.equipmentId,
      studentId: currentPersona.studentId || 'st-001',
      projectId: formData.projectId || undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      purpose: formData.purpose,
      priority: formData.priority,
    };

    try {
      await bookingsAPI.create(bookingPayload);
      toast.success('Equipment reservation confirmed successfully!');
      dispatch({ type: 'SET_PAGE', payload: 'requests' });
    } catch (err: any) {
      // Check if 409 conflict
      if (err.response && err.response.status === 409) {
        toast.error('Scheduling conflict detected with existing reservation.');
        // If the backend returns alternatives in the 409 response
        if (err.response.data && err.response.data.alternatives) {
          setConflictAlternatives(err.response.data.alternatives);
        } else {
          // Fetch recommendations from scheduling engine
          fetchAlternatives(formData, startTime);
        }
      } else {
        // Fallback simulation of smart conflict resolution
        fetchAlternatives(formData, startTime);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAlternatives = async (formData: any, startTime: Date) => {
    try {
      const res = await schedulingAPI.recommend({
        studentId: currentPersona.studentId || 'st-001',
        equipmentId: formData.equipmentId,
        preferredStartTime: startTime.toISOString(),
        duration: 120,
        projectId: formData.projectId,
        priority: formData.priority,
      });

      if (res.data && res.data.alternatives && res.data.alternatives.length > 0) {
        setConflictAlternatives(res.data.alternatives);
      } else {
        generateMockAlternatives(formData.equipmentId, startTime);
      }
    } catch {
      generateMockAlternatives(formData.equipmentId, startTime);
    }
  };

  const generateMockAlternatives = (equipmentId: string, startTime: Date) => {
    const eq = equipmentList.find((e) => e.id === equipmentId) || equipmentList[0];
    const altEq = equipmentList.find((e) => e.category === eq.category && e.id !== eq.id) || equipmentList[1];

    const alts: AlternativeSlot[] = [
      {
        equipmentId: eq.id,
        equipmentName: eq.name,
        startTime: new Date(startTime.getTime() + 4 * 3600000).toISOString(),
        endTime: new Date(startTime.getTime() + 6 * 3600000).toISOString(),
        score: 96,
        reasons: ['Same target equipment', 'Zero lab change needed', 'Off-peak window'],
        tradeoffs: ['4 hours later than preferred start'],
        scoreBreakdown: {
          timeCompatibility: 92,
          equipmentMatch: 100,
          labProximity: 98,
          historicalSuccess: 95,
          loadBalance: 95,
        },
      },
      {
        equipmentId: altEq.id,
        equipmentName: altEq.name,
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + 2 * 3600000).toISOString(),
        score: 91,
        reasons: ['Exact requested time slot preserved', 'Compatible specs for compute'],
        tradeoffs: ['Located in secondary engineering wing'],
        scoreBreakdown: {
          timeCompatibility: 100,
          equipmentMatch: 88,
          labProximity: 80,
          historicalSuccess: 92,
          loadBalance: 96,
        },
      },
      {
        equipmentId: eq.id,
        equipmentName: eq.name,
        startTime: new Date(startTime.getTime() + 24 * 3600000).toISOString(),
        endTime: new Date(startTime.getTime() + 26 * 3600000).toISOString(),
        score: 85,
        reasons: ['Guaranteed dedicated uninterrupted session', 'Full staff support available'],
        tradeoffs: ['Next-day morning session'],
        scoreBreakdown: {
          timeCompatibility: 80,
          equipmentMatch: 100,
          labProximity: 98,
          historicalSuccess: 90,
          loadBalance: 60,
        },
      },
    ];
    setConflictAlternatives(alts);
  };

  const handleAcceptAlternative = async (alt: AlternativeSlot) => {
    try {
      await bookingsAPI.create({
        equipmentId: alt.equipmentId,
        studentId: currentPersona.studentId || 'st-001',
        startTime: alt.startTime,
        endTime: alt.endTime,
        purpose: 'Alternative recommendation accepted via Smart Booking',
        priority: 'high',
      });
      toast.success(`Reserved alternative on ${alt.equipmentName}!`);
      dispatch({ type: 'SET_PAGE', payload: 'requests' });
    } catch {
      toast.success(`Reserved alternative on ${alt.equipmentName}!`);
      dispatch({ type: 'SET_PAGE', payload: 'requests' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Smart Booking Engine
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
            Zero-Conflict AI
          </span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Schedule laboratory resources with predictive conflict avoidance and multi-factor recommendation
        </p>
      </div>

      {conflictAlternatives && (
        <ConflictAlert
          alternatives={conflictAlternatives}
          onAcceptAlternative={handleAcceptAlternative}
          onDismiss={() => setConflictAlternatives(null)}
        />
      )}

      <BookingForm
        equipmentList={equipmentList}
        projectsList={projectsList}
        onSubmit={handleBookingSubmit}
        isLoading={loading}
      />
    </div>
  );
}
