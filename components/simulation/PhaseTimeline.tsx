'use client';

import { CheckCircle, Lock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming lib/utils exists for clsx/tw-merge, otherwise I'll inline a helper or use generic clsm

export function PhaseTimeline({ currentPhase }: { currentPhase: number }) {
    const phases = [
        { id: 1, name: 'Ideal State', desc: 'Design the core' },
        { id: 2, name: 'Budget Cut', desc: 'Reduce costs' },
        { id: 3, name: 'Scale Up', desc: 'Handle 100x' },
        { id: 4, name: 'Legacy', desc: 'Integrate old tech' },
        { id: 5, name: 'Compliance', desc: 'Audit & Secure' },
        { id: 6, name: 'Pivot', desc: 'Change direction' },
        { id: 7, name: 'End Game', desc: 'Final Audit' },
    ];

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 h-full">
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Project Timeline</h2>
            <div className="flex flex-col gap-4 relative">
                {/* Connector Line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-800 -z-10" />

                {phases.map((p) => {
                    const isCompleted = p.id < currentPhase;
                    const isCurrent = p.id === currentPhase;
                    const isLocked = p.id > currentPhase;

                    return (
                        <div key={p.id} className={cn("flex items-start gap-4 transition-all duration-300", isLocked ? "opacity-40" : "opacity-100")}>
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 bg-slate-950",
                                isCompleted ? "border-emerald-500 text-emerald-500" :
                                    isCurrent ? "border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" :
                                        "border-slate-700 text-slate-700"
                            )}>
                                {isCompleted && <CheckCircle className="w-3 h-3" />}
                                {isCurrent && <PlayCircle className="w-3 h-3" />}
                                {isLocked && <Lock className="w-3 h-3" />}
                            </div>
                            <div className="pt-0.5">
                                <h3 className={cn("text-sm font-medium leading-none mb-1", isCurrent ? "text-blue-200" : "text-slate-300")}>
                                    Phase {p.id}: {p.name}
                                </h3>
                                <p className="text-xs text-slate-500">{p.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
