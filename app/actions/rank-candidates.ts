'use server';

import prisma from '@/lib/prisma';

export type RankedCandidate = {
    id: string;
    name: string;
    email: string;
    githubId: string | null;
    overallScore: number;
    status: string;
    evaluatedAt: string | null;
    commitsAnalyzed: number;
    topSkills: string[];
};

/**
 * Get all candidates for a job, ranked by their overall AI evaluation score.
 * Returns candidates in descending order (best fit at top).
 */
export async function getRankedCandidatesAction(jobId: string): Promise<{
    success: boolean;
    candidates?: RankedCandidate[];
    error?: string;
}> {
    try {
        // Fetch all applications for this job
        const applications = await prisma.application.findMany({
            where: { jobId },
            orderBy: { createdAt: 'desc' }
        });

        // Transform and rank
        const rankedCandidates: RankedCandidate[] = applications.map(app => {
            const enrichment = app.enrichmentData as any;
            const evaluation = enrichment?.evaluation;

            // Extract top skills from report (skills with highest scores)
            const topSkills: string[] = [];
            if (evaluation?.report) {
                const sorted = [...evaluation.report]
                    .filter((r: any) => r.signal.includes('skill') || r.signal.includes('language'))
                    .sort((a: any, b: any) => b.score - a.score)
                    .slice(0, 3);
                topSkills.push(...sorted.map((r: any) => r.signal.replace('skill-usage:-', '').replace('language:-', '')));
            }

            return {
                id: app.id,
                name: app.name,
                email: app.email,
                githubId: app.githubId,
                overallScore: evaluation?.overallScore ?? 0,
                status: app.status,
                evaluatedAt: evaluation?.evaluatedAt ?? null,
                commitsAnalyzed: evaluation?.commitsAnalyzed ?? 0,
                topSkills
            };
        });

        // Sort by overall score (descending - best fit first)
        rankedCandidates.sort((a, b) => b.overallScore - a.overallScore);

        console.log(`[RankAction] Ranked ${rankedCandidates.length} candidates for job ${jobId}`);

        return {
            success: true,
            candidates: rankedCandidates
        };

    } catch (error) {
        console.error("Ranking Failed:", error);
        return { success: false, error: "Failed to rank candidates." };
    }
}
