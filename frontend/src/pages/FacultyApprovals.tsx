import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Calendar, AlertCircle, Sparkles, User, MessageSquare } from 'lucide-react';
import { requestsAPI, isNetworkError } from '../services/api';
import { LabRequest } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/appStore';

export default function FacultyApprovals() {
  const { state, dispatch } = useAppStore();
  const { currentPersona } = state;

  // null = no server data (use local demo requests from the store)
  const [apiRequests, setApiRequests] = useState<LabRequest[] | null>(null);
  const requests: LabRequest[] = apiRequests ?? state.demoRequests;
  const [selectedReq, setSelectedReq] = useState<LabRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);

  const loadRequests = () =>
    requestsAPI.getAll()
      .then((res) => setApiRequests(res.data))
      .catch(() => setApiRequests(null));

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await requestsAPI.approve(id, 'Approved by faculty reviewer.');
      toast.success('Request approved — moved to decision history');
    } catch (err: any) {
      if (isNetworkError(err)) {
        dispatch({
          type: 'DECIDE_DEMO_REQUEST',
          payload: { id, status: 'approved', notes: 'Approved by faculty reviewer.', facultyName: currentPersona.name },
        });
        toast.success('Request approved (demo mode) — moved to decision history');
      } else {
        toast.error(err?.response?.data?.error || 'Could not approve this request');
      }
    }
    loadRequests();
  };

  const handleReject = async () => {
    if (!activeReqId) return;
    const id = activeReqId;
    const reason = rejectReason || 'Schedule conflict with lab course';
    try {
      await requestsAPI.reject(id, reason);
      toast.success('Request rejected — moved to decision history');
    } catch (err: any) {
      if (isNetworkError(err)) {
        dispatch({
          type: 'DECIDE_DEMO_REQUEST',
          payload: { id, status: 'rejected', notes: reason, facultyName: currentPersona.name },
        });
        toast.success('Request rejected (demo mode) — moved to decision history');
      } else {
        toast.error(err?.response?.data?.error || 'Could not reject this request');
      }
    } finally {
      setRejectModalOpen(false);
      setRejectReason('');
      setActiveReqId(null);
    }
    loadRequests();
  };

  const who = (r: LabRequest) => r.studentName || r.booking?.studentName || 'Student';
  const startOf = (r: LabRequest) => r.startTime || r.booking?.startTime;
  const endOf = (r: LabRequest) => r.endTime || r.booking?.endTime;
  const priorityOf = (r: LabRequest) => r.priority || r.booking?.priority || 'normal';

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const recentDecisions = requests
    .filter((r) => r.status !== 'pending')
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Faculty Authorization & Approvals
          <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
            {pendingRequests.length} Pending
          </span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Review student high-tier equipment reservation requests requiring faculty sign-off
        </p>
      </div>

      {/* Pending Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={16} className="text-amber-500" />
          Pending Authorization Queue
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-400 text-xs">
            No pending requests require your sign-off at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar initials={(who(req)).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-800">{who(req)}</h4>
                      <span className="text-[11px] text-slate-400">{req.studentDepartment || 'Campus'}</span>
                    </div>

                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                      Requested: {req.booking?.equipmentName || 'Lab equipment'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {startOf(req) && endOf(req)
                          ? `${format(new Date(startOf(req)!), 'EEE, MMM d')}, ${format(new Date(startOf(req)!), 'h:mm a')} – ${format(new Date(endOf(req)!), 'h:mm a')}`
                          : 'Time not specified'}
                      </span>
                      <span>•</span>
                      <span className="capitalize">Priority: {priorityOf(req)}</span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mt-2 max-w-xl">
                      "{req.booking?.purpose || 'No purpose provided'}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  <button
                    onClick={() => {
                      setActiveReqId(req.id);
                      setRejectModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <X size={14} /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-200"
                  >
                    <Check size={14} /> Approve Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Decisions */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Recent Decision History
        </h2>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Decision Notes</th>
                <th className="py-3 px-4 text-right">Decided</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDecisions.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800">{who(r)}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {r.booking?.equipmentName || 'Lab equipment'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {r.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {format(new Date(r.updatedAt || Date.now()), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Decline Reservation Request">
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Provide guidance to the student or reason for rejection:
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Requested slot conflicts with scheduled maintenance; please re-book for Friday."
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
