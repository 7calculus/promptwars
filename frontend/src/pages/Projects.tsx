import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, AlertCircle, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_EQUIPMENT } from '../data/mockData';
import { projectsAPI } from '../services/api';
import { Project, Equipment } from '../types';
import ProgressBar from '../components/common/ProgressBar';
import Modal from '../components/common/Modal';
import { format, differenceInDays } from 'date-fns';
import { useAppStore } from '../store/appStore';
import toast from 'react-hot-toast';

export default function Projects() {
  const { state, dispatch } = useAppStore();
  const { currentPersona } = state;

  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // New Project Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [deadlineDays, setDeadlineDays] = useState(14);

  useEffect(() => {
    projectsAPI.getAll(currentPersona.studentId).then((res) => {
      if (res.data && res.data.length > 0) setProjects(res.data);
    }).catch(() => {});
  }, [currentPersona]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      studentId: currentPersona.studentId || 'st-001',
      title,
      description,
      department,
      deadline: new Date(Date.now() + deadlineDays * 86400000).toISOString(),
      status: 'active',
      teamMembers: [currentPersona.name],
      progress: 10,
      requiredEquipment: ['eq-001'],
      createdAt: new Date().toISOString(),
    };

    try {
      await projectsAPI.create(newProj);
      setProjects([newProj, ...projects]);
      toast.success('Research project initialized!');
    } catch {
      setProjects([newProj, ...projects]);
      toast.success('Research project initialized!');
    } finally {
      setNewProjectOpen(false);
      setTitle('');
      setDescription('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Academic Research Projects
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track resource pipelines, required instrumentation, and milestone readiness
          </p>
        </div>

        <button
          onClick={() => setNewProjectOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-300 transition flex items-center justify-center gap-1.5 active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((project) => {
          const daysLeft = differenceInDays(new Date(project.deadline), new Date());
          const isUrgent = daysLeft < 7;
          const isWarning = daysLeft < 14;

          return (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {project.department}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isUrgent
                          ? 'bg-red-50 text-red-600'
                          : isWarning
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <Calendar size={11} />
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Due today'}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-800 group-hover:text-indigo-600 transition">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                {/* Team Members */}
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Users size={13} className="text-slate-400" />
                  <span className="truncate">
                    {project.teamMembers?.join(', ') || 'Alex Morgan'}
                  </span>
                </div>
              </div>

              {/* Progress & Readiness */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Resource Readiness</span>
                  <span className="font-bold text-slate-700">{project.progress}%</span>
                </div>
                <ProgressBar
                  value={project.progress}
                  color={project.progress > 50 ? 'bg-indigo-600' : 'bg-amber-500'}
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {project.requiredEquipment?.length || 2} Instruments Allocated
                  </span>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition flex items-center">
                    Manage <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      <Modal
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title}
        size="lg"
      >
        {selectedProject && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              {selectedProject.description}
            </p>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Target Deadline:</span>
                <span className="font-semibold text-slate-800">{format(new Date(selectedProject.deadline), 'PPP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Department:</span>
                <span className="font-semibold text-slate-800">{selectedProject.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Active Collaborators:</span>
                <span className="font-semibold text-slate-800">{selectedProject.teamMembers?.join(', ')}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Instrument Pipeline Status
              </h4>
              <div className="space-y-2">
                {selectedProject.requiredEquipment?.map((eqId, idx) => {
                  const eq = MOCK_EQUIPMENT.find((e) => e.id === eqId) || MOCK_EQUIPMENT[idx % MOCK_EQUIPMENT.length];
                  return (
                    <div key={eq.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        <div>
                          <p className="font-semibold text-slate-800">{eq.name}</p>
                          <p className="text-[11px] text-slate-400">{eq.lab}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Allocated
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProject(null);
                  dispatch({ type: 'SET_PAGE', payload: 'booking' });
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-300 transition"
              >
                Find & Add Equipment
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Project Modal */}
      <Modal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} title="New Research Project" size="md">
        <form onSubmit={handleCreateProject} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Project Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Autonomous Drone Swarm Mapping"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline research hypothesis, necessary lab resources, and milestones..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Materials Science">Materials Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Deadline (Days from now)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNewProjectOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
