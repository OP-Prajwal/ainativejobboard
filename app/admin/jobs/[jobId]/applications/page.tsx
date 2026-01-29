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
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!job) {
        notFound();
    }

    // Rank applications by AI evaluation score
    const rankedApplications = [...job.applications].sort((a, b) => {
        const scoreA = (a.enrichmentData as any)?.evaluation?.overallScore ?? 0;
        const scoreB = (b.enrichmentData as any)?.evaluation?.overallScore ?? 0;
        return scoreB - scoreA; // Descending order (best first)
    });

    // Calculate stats
    const evaluatedCount = rankedApplications.filter(
        a => (a.enrichmentData as any)?.evaluation?.overallScore !== undefined
    ).length;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Candidate Leaderboard</h1>
                <p className="text-slate-400 text-lg">
                    {job.title} • {job.applications.length} Applicants • {evaluatedCount} Evaluated
                </p>
            </div>

            {/* Leaderboard Summary */}
            {evaluatedCount > 0 && (
                <div className="bg-gradient-to-r from-emerald-900/30 to-purple-900/30 rounded-xl border border-emerald-500/20 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">🏆 Top Candidates by AI Score</h2>
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
                {job.applications.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-white/5">
                        <div className="text-slate-500 mb-2">No applications yet</div>
                        <p className="text-sm text-slate-600">Share the job link to get started.</p>
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

