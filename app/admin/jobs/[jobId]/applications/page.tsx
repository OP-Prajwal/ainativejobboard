import prisma from "@/lib/prisma";
import { CandidateCard } from "@/components/admin/CandidateCard";
import { notFound } from "next/navigation";

// Force dynamic since we want fresh application data
export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;

    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
            applications: {
                orderBy: { createdAt: 'desc' },
                include: {
                    taskAssignments: {
                        select: {
                            id: true,
                            status: true,
                            aiScore: true,
                            confidence: true,
                            aiFeedback: true,
                            requiresHumanReview: true
                        }
                    }
                }
            }
        }
    });

    if (!job) {
        notFound();
    }

    // Separate applications by status
    const shortlistedCount = job.applications.filter(a =>
        ['shortlisted', 'simulation_invited', 'simulation_completed'].includes(a.status)
    ).length;

    const rejectedCount = job.applications.filter(a => a.status === 'rejected').length;

    const activeApplications = job.applications.filter(a =>
        !['shortlisted', 'rejected', 'simulation_invited', 'simulation_completed'].includes(a.status)
    );

    // Rank ONLY active applications by AI evaluation score
    const rankedApplications = [...activeApplications].sort((a, b) => {
        const scoreA = (a.enrichmentData as any)?.evaluation?.overallScore ?? 0;
        const scoreB = (b.enrichmentData as any)?.evaluation?.overallScore ?? 0;
        return scoreB - scoreA; // Descending order (best first)
    });

    const evaluatedCount = rankedApplications.filter(
        a => (a.enrichmentData as any)?.evaluation?.overallScore !== undefined
    ).length;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Candidate Leaderboard</h1>
                    <p className="text-slate-400 text-lg">
                        {job.title} • {activeApplications.length} Active Applicants
                    </p>
                </div>
                <div className="flex gap-4">
                    <a href={`/admin/jobs/${job.id}/shortlisted`} className="px-6 py-3 bg-violet-600/10 border border-violet-500/50 rounded-xl hover:bg-violet-600/20 transition-colors group">
                        <div className="text-sm text-violet-300 mb-1">Shortlisted</div>
                        <div className="text-2xl font-bold text-white group-hover:text-violet-400">{shortlistedCount}</div>
                    </a>
                    <div className="px-6 py-3 bg-slate-800/50 border border-white/5 rounded-xl">
                        <div className="text-sm text-slate-500 mb-1">Rejected</div>
                        <div className="text-2xl font-bold text-slate-400">{rejectedCount}</div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Summary */}
            {evaluatedCount > 0 && (
                <div className="bg-gradient-to-r from-emerald-900/30 to-purple-900/30 rounded-xl border border-emerald-500/20 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">🏆 Top Active Candidates by AI Score</h2>
                    <div className="flex flex-wrap gap-4">
                        {rankedApplications.slice(0, 3).map((app, index) => {
                            const score = (app.enrichmentData as any)?.evaluation?.overallScore ?? 0;
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div key={app.id} className="flex items-center gap-3 bg-black/30 rounded-lg px-4 py-3 min-w-[200px]">
                                    <span className="text-2xl">{medals[index]}</span>
                                    <div>
                                        <div className="text-white font-medium">{app.name}</div>
                                        <div className="text-emerald-400 text-sm font-bold">{score}/100</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Full Candidate List */}
            <div className="grid gap-6">
                {activeApplications.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-slate-500 mb-2">No pending applications</div>
                        <p className="text-sm text-slate-600">Great job clearing the queue!</p>
                    </div>
                ) : (
                    rankedApplications.map((app, index) => {
                        const score = (app.enrichmentData as any)?.evaluation?.overallScore;
                        return (
                            <div key={app.id} className="relative">
                                {/* Rank Badge */}
                                {score !== undefined && (
                                    <div className="absolute -left-4 top-4 z-10 flex items-center gap-2">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                            ${index === 0 ? 'bg-yellow-500 text-black' :
                                                index === 1 ? 'bg-slate-300 text-black' :
                                                    index === 2 ? 'bg-amber-600 text-white' :
                                                        'bg-slate-700 text-slate-300'}
                                        `}>
                                            #{index + 1}
                                        </div>
                                    </div>
                                )}
                                {/* @ts-ignore - enrichmentData type casting handled inside component */}
                                <CandidateCard application={app} />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

