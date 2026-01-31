'use client';

import { useState, useEffect } from "react";
import { format, differenceInSeconds } from "date-fns";
import { Loader2, Play, Lock, CalendarClock } from "lucide-react";
import { startAssessment } from "@/app/actions/assessment";
import { useRouter } from "next/navigation";

type WaitRoomProps = {
    assignment: {
        id: string;
        scheduledAt: Date | null;
        timeLimitMinutes: number;
    };
    candidateName: string;
};

export function WaitRoom({ assignment, candidateName }: WaitRoomProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [canStart, setCanStart] = useState(false);

    useEffect(() => {
        if (!assignment.scheduledAt) {
            setCanStart(true);
            return;
        }

        const checkTime = () => {
            const now = new Date();
            const scheduled = new Date(assignment.scheduledAt!);
            const diff = differenceInSeconds(scheduled, now);

            if (diff <= 0) {
                setCanStart(true);
                setTimeLeft(0);
            } else {
                setCanStart(false);
                setTimeLeft(diff);
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [assignment.scheduledAt]);

    const handleStart = async () => {
        setIsLoading(true);
        try {
            const result = await startAssessment(assignment.id);
            if (result.success) {
                router.refresh(); // Refresh to switch to Workspace view
            } else {
                alert(result.error);
                setIsLoading(false);
            }
        } catch (e) {
            alert("Failed to start assessment");
            setIsLoading(false);
        }
    };

    const formatCountdown = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <Lock size={32} />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Welcome, {candidateName}</h1>
                <p className="text-slate-400 mb-8">
                    You have been invited to a technical simulation.
                </p>

                {assignment.scheduledAt && !canStart ? (
                    <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 mb-8">
                        <div className="text-sm text-slate-500 mb-2 uppercase tracking-wide font-semibold">Starts In</div>
                        <div className="text-4xl font-mono text-violet-400 font-bold">
                            {timeLeft !== null ? formatCountdown(timeLeft) : '--:--:--'}
                        </div>
                        <div className="text-sm text-slate-500 mt-2 flex items-center justify-center gap-1">
                            <CalendarClock size={14} />
                            {format(new Date(assignment.scheduledAt), "MMM d, h:mm a")}
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-950/30 rounded-xl p-6 border border-emerald-500/20 mb-8">
                        <div className="text-emerald-400 font-medium mb-1">Ready to Begin</div>
                        <div className="text-sm text-emerald-500/80">
                            Duration: ~{assignment.timeLimitMinutes} minutes
                        </div>
                    </div>
                )}

                <button
                    onClick={handleStart}
                    disabled={!canStart || isLoading}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${canStart
                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                    {isLoading ? "Initializing Environment..." : (canStart ? "Start Simulation" : "Locked")}
                </button>
            </div>
        </div>
    );
}
