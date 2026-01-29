'use client';

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Github, Code, ExternalLink, Calendar, Star, GitCommit, BrainCircuit, Loader2, AlertTriangle } from "lucide-react";
import { evaluateCandidateAction } from "@/app/actions/evaluate-candidate";

// Types based on our schema
type EnrichmentData = {
    github?: {
        username: string;
        stats: {
            followers: number;
            publicRepos: number;
            totalStars: number;
            recentCommits: number;
            topLanguages: string[];
            recentActivity: Array<{ repo: string, message: string, date: string, stars: number }>;
        };
    };
    leetcode?: {
        username: string;
        stats: {
            solvedProblems: number;
            ranking: number;
        };
    };
    codeforces?: {
        username: string;
        stats: {
            rating: number;
            rank: string;
        };
    };
};

type Application = {
    id: string;
    name: string;
    email: string;
    resumeUrl: string;
    linkedInUrl?: string | null;
    githubId?: string | null;
    status: string;
    createdAt: Date;
    enrichmentData: any; // Typed above
};

type EvaluationReport = {
    signal: string;
    score: number;
    uncertainty: number;
    evidence: number;
}[];

export function CandidateCard({ application }: { application: Application }) {
    const data = application.enrichmentData as EnrichmentData;

    // Get stored evaluation data
    const storedEvaluation = (application.enrichmentData as any)?.evaluation;
    const [evaluating, setEvaluating] = useState(false);
    const [report, setReport] = useState<EvaluationReport | null>(storedEvaluation?.report || null);
    const [overallScore, setOverallScore] = useState<number | null>(storedEvaluation?.overallScore ?? null);
    const [error, setError] = useState<string | null>(null);

    const handleEvaluation = async () => {
        setEvaluating(true);
        setError(null);

        try {
            const result = await evaluateCandidateAction(application.id);
            if (result.success && result.report) {
                setReport(result.report);
                setOverallScore(result.overallScore ?? null);
            } else {
                setError(result.error || "Evaluation failed");
            }
        } catch (e) {
            setError("Failed to run evaluation");
        } finally {
            setEvaluating(false);
        }
    };

    // Score color based on value
    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-violet-500/50 transition-all group">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">{application.name}</h3>
                        <div className="flex gap-3 text-sm text-slate-400">
                            <a href={`mailto:${application.email}`} className="hover:text-violet-400">{application.email}</a>
                            <span>•</span>
                            <span suppressHydrationWarning className="capitalize">{formatDistanceToNow(new Date(application.createdAt))} ago</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 uppercase tracking-wider font-mono">
                                {application.status}
                            </span>
                        </div>
                    </div>
                    {/* Overall Score + Evaluation Status */}
                    <div className="flex items-center gap-3">
                        {overallScore !== null && (
                            <div className={`px-4 py-2 rounded-lg border font-bold text-lg ${getScoreColor(overallScore)}`}>
                                {overallScore}/100
                            </div>
                        )}
                        {report && (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 gap-1">
                                <BrainCircuit size={12} /> AI Evaluated
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Resume / Links */}
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Links</div>
                        <a href={application.resumeUrl} target="_blank" className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 text-blue-400 text-sm transition-colors">
                            <ExternalLink size={14} />
                            View Resume (PDF)
                        </a>
                        {application.linkedInUrl && (
                            <a href={application.linkedInUrl} target="_blank" className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 text-slate-300 text-sm transition-colors">
                                <ExternalLink size={14} />
                                LinkedIn Profile
                            </a>
                        )}

                        {/* Evaluation Trigger Button - Always visible for re-runs */}
                        <button
                            onClick={handleEvaluation}
                            disabled={evaluating}
                            className={`w-full flex items-center justify-center gap-2 p-3 mt-4 border rounded-lg text-sm transition-colors disabled:opacity-50 ${report
                                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300'
                                    : 'bg-violet-600/10 border-violet-500/20 hover:bg-violet-600/20 text-violet-400'
                                }`}
                        >
                            {evaluating ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                            {evaluating ? "Evaluating..." : report ? "Re-Run Analysis" : "Run AI Analysis"}
                        </button>
                        {error && <div className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {error}</div>}
                    </div>

                    {/* GitHub Stats */}
                    {data?.github?.stats && (
                        <div className="bg-slate-800/30 rounded-lg p-4 border border-white/5">
                            <div className="flex items-center gap-2 mb-3 text-white font-semibold">
                                <Github size={16} />
                                GitHub: {data.github.username}
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-xs text-slate-400">Stars</div>
                                    <div className="text-xl font-mono text-yellow-400 flex items-center gap-1">
                                        <Star size={14} fill="currentColor" />
                                        {data.github.stats.totalStars}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">Recent Commits</div>
                                    <div className="text-xl font-mono text-green-400 flex items-center gap-1">
                                        <GitCommit size={14} />
                                        {data.github.stats.recentCommits}
                                    </div>
                                </div>
                            </div>

                            {/* Languages */}
                            <div className="flex flex-wrap gap-2">
                                {data.github.stats.topLanguages?.map(lang => (
                                    <span key={lang} className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300">
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Coding Platforms or Evaluation Report */}
                    <div className="space-y-4">
                        {report ? (
                            <div className="bg-violet-950/20 rounded-lg p-4 border border-violet-500/20">
                                <h4 className="flex items-center gap-2 text-violet-400 font-bold text-sm mb-3">
                                    <BrainCircuit size={14} /> Belief Report
                                </h4>
                                <div className="space-y-2">
                                    {report.map(r => (
                                        <div key={r.signal} className="bg-slate-900/50 p-2 rounded text-xs border border-white/5 flex justify-between items-center">
                                            <span className="text-slate-300 capitalize">{r.signal}</span>
                                            <div className="text-right">
                                                <div className="font-mono text-white font-bold">{r.score.toFixed(2)}</div>
                                                <div className="text-slate-500 text-[10px]">Unc: {r.uncertainty.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {data?.codeforces?.stats && (
                                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/5 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs font-bold text-red-500">Codeforces</div>
                                            <div className="text-slate-300 text-sm">@{data.codeforces.username}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-bold font-mono ${data.codeforces.stats.rating >= 2400 ? 'text-red-500' : 'text-yellow-500'}`}>
                                                {data.codeforces.stats.rating}
                                            </div>
                                            <div className="text-xs text-slate-500">{data.codeforces.stats.rank}</div>
                                        </div>
                                    </div>
                                )}

                                {data?.leetcode?.stats && (
                                    <div className="bg-slate-800/30 rounded-lg p-4 border border-white/5 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs font-bold text-yellow-600">LeetCode</div>
                                            <div className="text-slate-300 text-sm">Solved</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold font-mono text-white">
                                                {data.leetcode.stats.solvedProblems}
                                            </div>
                                            {data.leetcode.stats.ranking > 0 && <div className="text-xs text-slate-500">Top {data.leetcode.stats.ranking.toLocaleString()}</div>}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                {data?.github?.stats?.recentActivity?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent High-Impact Activity</h4>
                        <div className="space-y-3">
                            {data.github.stats.recentActivity.map((activity, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                    <div suppressHydrationWarning className="w-24 text-slate-500 text-xs py-1 text-right shrink-0 font-mono">
                                        {formatDistanceToNow(new Date(activity.date))} ago
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-slate-300">
                                            <span className="text-violet-400 font-mono text-xs p-1 bg-violet-500/10 rounded mr-2">{activity.repo}</span>
                                            {activity.message}
                                        </div>
                                    </div>
                                    <div className="w-16 text-right text-yellow-500/50 text-xs flex items-center justify-end gap-1">
                                        ★ {activity.stars}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-950 p-4 flex justify-end gap-3 border-t border-slate-800">
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    Reject
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/20">
                    Shortlist Candidate
                </button>
            </div>
        </div>
    );
}
