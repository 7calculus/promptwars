import React, { useState, useEffect } from 'react';
import BookingForm from '../components/booking/BookingForm';
import ConflictAlert from '../components/booking/ConflictAlert';
import { MOCK_EQUIPMENT, MOCK_PROJECTS } from '../data/mockData';
import { bookingsAPI, equipmentAPI, projectsAPI, normalizeAlternative, isNetworkError } from '../services/api';
import { AlternativeSlot, Booking, Equipment, LabRequest, Project } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAppStore } from '../store/appStore';

export default function SmartBooking() {
  const { state, dispatch } = useAppStore();
  const { currentPersona } = state;

  const [equipmentList, setEquipmentList] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [projectsList, setProjectsList] = useState<Project[]>(MOCK_PROJECTS);
  const [loading, setLoading] = useState(false);
  const [conflictAlternatives, setConflictAlternatives] = useState<AlternativeSlot[] | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | undefined>();

  useEffect(() => {
    equipmentAPI.getAll().then((res) => {
      if (res.data && res.data.length > 0) setEquipmentList(res.data);
    }).catch(() => {});

    projectsAPI.getAll(currentPersona.studentId).then((res) => {
      if (res.data && res.data.length > 0) setProjectsList(res.data);
    }).catch(() => {});
  }, [currentPersona]);

  const errorMessage = (err: any, fallback: string) =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (err?.code === 'ERR_NETWORK' ? 'Cannot reach the LabLink server. Is the backend running?' : fallback);

  const pushNotification = (title: string, message: string) =>
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: `local-${Date.now()}`,
        userId: currentPersona.studentId || 'st-001',
        userType: 'student',
        title,
        message,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });

  const createBooking = async (payload: Record<string, unknown>, equipmentName: string) => {
    const res = await bookingsAPI.create(payload);
    const needsApproval = Boolean(res.data?.requires_approval);
    toast.success(
      needsApproval
        ? `Request for ${equipmentName} sent for faculty approval`
        : `${equipmentName} reserved — you're all set!`
    );
    pushNotification(
      needsApproval ? 'Booking submitted — pending approval' : 'Booking confirmed',
      `${equipmentName} has been added to My Requests.`
    );
    dispatch({ type: 'SET_PAGE', payload: 'requests' });
  };

  /** Backend unreachable: keep the whole flow working locally so the demo still makes sense. */
  const createDemoBooking = (formData: any, startTime: Date, endTime: Date, equipmentName: string) => {
    const equipment = equipmentList.find((e) => e.id === formData.equipmentId);
    const studentId = currentPersona.studentId || 'st-001';
    const overlaps = state.demoBookings.some(
      (b) =>
        b.equipmentId === formData.equipmentId &&
        (b.status === 'pending' || b.status === 'approved') &&
        new Date(b.startTime) < endTime &&
        new Date(b.endTime) > startTime
    );
    if (overlaps) {
      toast.error(`${equipmentName} is already booked for that time. Pick another slot.`);
      return;
    }
    const needsApproval = Boolean(equipment?.requiresApproval);
    const now = new Date().toISOString();
    const bookingId = `bk-demo-${Date.now()}`;
    const project = projectsList.find((p) => p.id === formData.projectId);
    const booking: Booking = {
      id: bookingId,
      equipmentId: formData.equipmentId,
      equipmentName,
      studentId,
      studentName: currentPersona.name,
      projectId: formData.projectId || undefined,
      projectTitle: project?.title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: needsApproval ? 'pending' : 'approved',
      purpose: formData.purpose,
      priority: formData.priority,
      createdAt: now,
      updatedAt: now,
    };
    const request: LabRequest | undefined = needsApproval
      ? {
          id: `req-demo-${Date.now()}`,
          bookingId,
          booking,
          status: 'pending',
          studentName: currentPersona.name,
          studentDepartment: currentPersona.department,
          priority: formData.priority,
          startTime: booking.startTime,
          endTime: booking.endTime,
          createdAt: now,
          updatedAt: now,
        }
      : undefined;
    dispatch({ type: 'ADD_DEMO_BOOKING', payload: { booking, request } });
    toast.success(
      needsApproval
        ? `Request for ${equipmentName} sent for faculty approval (demo mode)`
        : `${equipmentName} reserved (demo mode)`
    );
    dispatch({ type: 'SET_PAGE', payload: 'requests' });
  };

  const handleBookingSubmit = async (formData: any) => {
    setLoading(true);
    setConflictAlternatives(null);
    setConflictMessage(undefined);

    // timeSlot looks like '10:00 - 12:00'
    const [startHourStr, endHourStr] = formData.timeSlot.split(' - ');
    const startTime = new Date(formData.date);
    startTime.setHours(parseInt(startHourStr, 10), 0, 0, 0);
    const endTime = new Date(formData.date);
    endTime.setHours(parseInt(endHourStr, 10), 0, 0, 0);

    const studentId = currentPersona.studentId || 'st-001';
    const equipmentName =
      equipmentList.find((e) => e.id === formData.equipmentId)?.name || 'Equipment';

    try {
      await createBooking(
        {
          equipmentId: formData.equipmentId,
          studentId,
          projectId: formData.projectId || undefined,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          purpose: formData.purpose,
          priority: formData.priority,
        },
        equipmentName
      );
    } catch (err: any) {
      if (err.response?.status === 409) {
        const alts = (err.response.data?.alternatives ?? []).map(normalizeAlternative);
        toast.error('Scheduling conflict detected with an existing reservation.');
        setConflictMessage(
          `${equipmentName} is already booked between ${format(startTime, 'EEE, MMM d · h:mm a')} and ${format(endTime, 'h:mm a')}.`
        );
        if (alts.length > 0) {
          setConflictAlternatives(alts);
        } else {
          toast.error(errorMessage(err, 'No alternative slots available.'));
        }
      } else if (isNetworkError(err)) {
        toast('Server unreachable — saving in demo mode', { icon: '⚠️' });
        createDemoBooking(formData, startTime, endTime, equipmentName);
      } else {
        // Validation / server problem: show the real reason, never fake a success.
        toast.error(errorMessage(err, 'Could not create the reservation.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAlternative = async (alt: AlternativeSlot) => {
    try {
      await createBooking(
        {
          equipmentId: alt.equipmentId,
          studentId: currentPersona.studentId || 'st-001',
          startTime: alt.startTime,
          endTime: alt.endTime,
          purpose: 'Alternative recommendation accepted via Smart Booking',
          priority: 'normal',
        },
        alt.equipmentName
      );
    } catch (err: any) {
      toast.error(errorMessage(err, 'That alternative is no longer available.'));
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
          message={conflictMessage}
          alternatives={conflictAlternatives}
          onAcceptAlternative={handleAcceptAlternative}
          onDismiss={() => setConflictAlternatives(null)}
        />
      )}

      <BookingForm
        equipmentList={equipmentList}
        projectsList={projectsList}
        initialEquipmentId={state.selectedEquipmentId ?? undefined}
        onSubmit={handleBookingSubmit}
        isLoading={loading}
      />
    </div>
  );
}
