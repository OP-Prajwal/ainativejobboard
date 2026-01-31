'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CalendarClock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { scheduleJobEvent } from "@/app/actions/assessment";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

type GlobalScheduleFormProps = {
    jobId: string;
    currentSchedule: string | null | Date;
    config: any; // { mode, manualTasks }
};

export function GlobalScheduleForm({ jobId, currentSchedule, config }: GlobalScheduleFormProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(!currentSchedule);
    const [scheduleDate, setScheduleDate] = useState<string>(
        currentSchedule ? new Date(currentSchedule).toISOString().slice(0, 16) : ''
    );
    const [mode, setMode] = useState<'AI' | 'MANUAL'>((config?.mode as 'AI' | 'MANUAL') || 'AI');
    const [manualTasks, setManualTasks] = useState<string[]>(
        (config?.manualTasks as string[]) || ['']
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSave = async () => {
        if (!scheduleDate) {
            setError("Please select a date and time");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const date = new Date(scheduleDate);
            const result = await scheduleJobEvent(jobId, {
                scheduledAt: date,
                mode,
                manualTasks: mode === 'MANUAL' ? manualTasks.filter(t => t.trim().length > 0) : undefined
            });

            if (result.success) {
                setSuccess(`Event Scheduled! Invites sent to ${result.data.count} candidates.`);
                setIsEditing(false);
                router.refresh();
            } else {
                setError(result.error);
            }
        } catch (e) {
            setError("Failed to schedule event");
        } finally {
            setSaving(false);
        }
    };

    const addManualTask = () => setManualTasks([...manualTasks, '']);
    const updateManualTask = (idx: number, val: string) => {
        const newTasks = [...manualTasks];
        newTasks[idx] = val;
        setManualTasks(newTasks);
    };

    if (!isEditing && currentSchedule) {
        return (
            <div className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-xl p-6 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">
                        <CalendarClock size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Assessment Scheduled</h2>
                        <div className="text-violet-300">
                            {format(new Date(currentSchedule), "EEEE, MMMM do, yyyy 'at' h:mm a")}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            Mode: <span className="text-slate-300 font-medium">{config?.mode || 'AI'}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    {success && (
                        <div className="mb-2 text-sm text-emerald-400 font-medium flex items-center gap-1 justify-end">
                            <CheckCircle2 size={14} /> {success}
                        </div>
                    )}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        Reschedule / Edit
                    </button>
                    <button
                        onClick={handleSave} // Re-trigger invites
                        disabled={saving}
                        className="ml-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-lg text-sm font-medium transition-colors"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : 'Re-Send Invites'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CalendarClock className="text-violet-500" />
                Schedule Global Assessment Event
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm text-slate-400 mb-2">Event Date & Time</label>
                    <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">All shortlisted candidates will be invited to this slot.</p>
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">Assignment Mode</label>
                    <div className="flex gap-4 mb-4">
                        <label className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer hover:border-violet-500/50 transition-colors">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'AI'}
                                onChange={() => setMode('AI')}
                                className="accent-violet-500"
                            />
                            <div>
                                <div className="text-white font-medium">AI Generated</div>
                                <div className="text-xs text-slate-500">Based on requirements</div>
                            </div>
                        </label>
                        <label className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer hover:border-violet-500/50 transition-colors">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'MANUAL'}
                                onChange={() => setMode('MANUAL')}
                                className="accent-violet-500"
                            />
                            <div>
                                <div className="text-white font-medium">Manual Tasks</div>
                                <div className="text-xs text-slate-500">Specify tasks yourself</div>
                            </div>
                        </label>
                    </div>

                    {mode === 'MANUAL' && (
                        <div className="space-y-3">
                            {manualTasks.map((task, idx) => (
                                <textarea
                                    key={idx}
                                    value={task}
                                    onChange={(e) => updateManualTask(idx, e.target.value)}
                                    placeholder={`Task ${idx + 1}`}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 min-h-[80px]"
                                />
                            ))}
                            <button onClick={addManualTask} className="text-xs text-violet-400 hover:text-violet-300 font-medium">
                                + Add Another Task
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
                {currentSchedule && (
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/20 min-w-[140px] flex justify-center items-center"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : (currentSchedule ? 'Update & Resend' : 'Schedule Event')}
                </button>
            </div>
        </div>
    );
}
