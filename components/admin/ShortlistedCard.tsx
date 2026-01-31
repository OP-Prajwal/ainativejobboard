'use client';

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, CheckCircle2, Clock, Copy, BrainCircuit, AlertTriangle } from "lucide-react";
import { gradeAssessment } from "@/app/actions/assessment";

type TaskAssignment = {
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
    aiScore?: number | null;
    confidence?: number | null;
    aiFeedback?: string | null;
    requiresHumanReview?: boolean;
};

type Application = {
    id: string;
    name: string;
    email: string;
    status: string;
    taskAssignments?: TaskAssignment[];
};

export function ShortlistedCard({ application }: { application: Application }) {
    const [grading, setGrading] = useState(false);
    const [assessmentData, setAssessmentData] = useState<TaskAssignment | null>(
        application.taskAssignments?.[0] || null
    );
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGradeAssessment = async () => {
        if (!assessmentData) return;
        setGrading(true);
        setError(null);
        try {
            const result = await gradeAssessment(assessmentData.id);
            if (result.success) {
                setAssessmentData(prev => prev ? {
                    ...prev,
                    status: 'GRADED',
                    aiScore: result.data.score,
                    confidence: result.data.confidence,
                    aiFeedback: result.data.feedback
                } : null);
            } else {
                setError(result.error);
            }
        } catch (e) {
            setError("Failed to grade assessment");
        } finally {
            setGrading(false);
        }
    };

    const copyAssessmentLink = () => {
        const link = `${window.location.origin}/simulation/${application.id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{application.name}</h3>
                    <div className="text-sm text-slate-400">{application.email}</div>

                    {error && (
                        <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle size={12} /> {error}
                        </div>
                    )}
                </div>

                {/* Status Badges */}
                {assessmentData && (
                    <Badge variant="outline" className="gap-2 self-start">
                        {assessmentData.status === 'PENDING' && <Clock size={12} className="text-yellow-500" />}
                        {assessmentData.status === 'IN_PROGRESS' && <ClipboardList size={12} className="text-blue-500" />}
                        {assessmentData.status === 'SUBMITTED' && <CheckCircle2 size={12} className="text-purple-500" />}
                        {assessmentData.status === 'GRADED' && <CheckCircle2 size={12} className="text-green-500" />}
                        {assessmentData.status}
                    </Badge>
                )}
            </div>

            {/* Assessment Actions Area */}
            <div className="mt-4 border-t border-white/5 pt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                    {!assessmentData ? (
                        <div className="text-sm text-slate-500 italic flex items-center gap-2">
                            <Clock size={14} />
                            Waiting for Global Assessment Schedule...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {assessmentData.status === 'SUBMITTED' && (
                                <button
                                    onClick={handleGradeAssessment}
                                    disabled={grading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600/20 transition-colors"
                                >
                                    {grading ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                                    Grade
                                </button>
                            )}

                            {assessmentData.aiScore !== null && (
                                <div className={`px-4 py-2 rounded-lg border font-bold text-lg ${getScoreColor(assessmentData.aiScore ?? 0)}`}>
                                    {assessmentData.aiScore}/100
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={copyAssessmentLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors shrink-0"
                >
                    <Copy size={14} />
                    {copied ? 'Copied' : 'Copy Link'}
                </button>
            </div>
        </div>
    );
}
