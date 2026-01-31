'use client';

import { Activity, AlertTriangle, TrendingDown } from 'lucide-react';
import { ProjectState } from '@/lib/task-allocation/types';

export function DashboardStats({ state }: { state: ProjectState }) {
    // Derived metrics for UI (logic can be made more complex later)
    const riskLevel = state.technicalDebt > 50 ? 'High' : state.technicalDebt > 20 ? 'Medium' : 'Low';
    const stabilityScore = Math.max(0, 100 - state.technicalDebt);

    return (
        <div className="flex items-center gap-8 bg-slate-900/50 px-6 py-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                    <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-slate-400 text-xs font-medium uppercase">Tech Debt</div>
                    <div className="text-2xl font-bold text-slate-100">{state.technicalDebt}%</div>
                </div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-slate-400 text-xs font-medium uppercase">Stability</div>
                    <div className="text-2xl font-bold text-slate-100">{stabilityScore}%</div>
                </div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-slate-400 text-xs font-medium uppercase">Risk Level</div>
                    <div className="text-2xl font-bold text-slate-100">{riskLevel}</div>
                </div>
            </div>

            <div className="ml-auto flex flex-col items-end">
                <span className="text-xs text-slate-500">System Shape:</span>
                <span className="text-sm font-mono text-blue-300">{state.systemShape}</span>
            </div>
        </div>
    );
}
