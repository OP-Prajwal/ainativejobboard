'use client';

import { useState, useTransition } from 'react';
import { submitSimulationTask } from '@/app/actions/simulation';
import { ProjectState } from '@/lib/task-allocation/types';
import { Loader2, Send } from 'lucide-react';

interface PhaseWorkspaceProps {
    task: any; // Using any for simplicity now, should matchprisma type
    assignmentId: string;
    applicationId: string;
    projectState: ProjectState;
}

export function PhaseWorkspace({ task, assignmentId, applicationId, projectState }: PhaseWorkspaceProps) {
    const [submission, setSubmission] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!submission.trim()) return;

        if (!confirm("Submitting this phase will irreversibly advance the simulation. Are you ready?")) {
            return;
        }

        startTransition(async () => {
            await submitSimulationTask(assignmentId, submission, applicationId);
            setSubmission(''); // Clear logic or handle reset
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Context Header */}
            <div className="bg-slate-900 px-8 py-6 border-b border-slate-800">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-wider border border-blue-500/20">
                                Phase {projectState.phase} Details
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase tracking-wider">
                                {task.difficultyLevel > 5 ? 'Hard' : 'Standard'}
                            </span>
                        </div>
                        <h1 className="text-xl font-semibold text-slate-100 mb-2">
                            Task: {task.description.split('.')[0]}...
                        </h1>
                    </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50 text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                    {task.description}
                </div>
            </div>

            {/* Split View: Constraints & Editor */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Constraints */}
                <div className="w-1/3 border-r border-slate-800 bg-slate-900/20 p-6 overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Active Constraints
                    </h3>
                    <ul className="space-y-3">
                        {projectState.activeConstraints.length === 0 ? (
                            <li className="text-sm text-slate-600 italic">No active constraints. Greenfield (for now).</li>
                        ) : (
                            projectState.activeConstraints.map((c, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-300 bg-slate-900/50 p-3 rounded border border-slate-800">
                                    <span className="text-amber-500 font-bold shrink-0">!</span>
                                    {c}
                                </li>
                            ))
                        )}
                    </ul>

                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-4">
                        Decision Log
                    </h3>
                    <ul className="space-y-2">
                        {projectState.decisionLog.map((decision, i) => (
                            <li key={i} className="text-xs text-slate-500 border-l-2 border-slate-700 pl-3 py-1">
                                {decision}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right: Editor */}
                <div className="flex-1 flex flex-col bg-slate-950 relative">
                    <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
                        <span className="text-xs text-slate-500 font-mono">solution.md</span>
                        <span className="text-xs text-slate-500">Markdown Supported</span>
                    </div>
                    <textarea
                        className="flex-1 w-full bg-slate-950 p-6 mt-10 text-slate-300 font-mono text-sm leading-6 focus:outline-none resize-none"
                        placeholder="// Write your solution, architectural decisions, and code snippets here..."
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        disabled={isPending}
                    />

                    {/* Action Bar */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end items-center gap-4">
                        <span className="text-xs text-slate-500">
                            {isPending ? 'Committing to repository...' : 'Ready to submit'}
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={!submission.trim() || isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Submit Phase Work
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
