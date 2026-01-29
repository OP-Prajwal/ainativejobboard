'use server';

import prisma from '@/lib/prisma';
import { ingestGitHubHistory, EnrichmentGitHub } from '@/lib/evaluation/intake';
import { interpretSummaries } from '@/lib/evaluation/interpretation';
import { KnowledgeGraph } from '@/lib/evaluation/knowledge-graph';
import { BeliefEngine } from '@/lib/evaluation/belief-engine';

export async function evaluateCandidateAction(applicationId: string) {
    try {
        console.log(`[EvalAction] Starting evaluation for ${applicationId}`);

        // 1. Fetch Application AND Job for Context
        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: true }
        });

        if (!app) throw new Error("Application not found");

        // 2. Extract REAL enrichment data (no hardcoding!)
        const enrichmentData = app.enrichmentData as any;
        const githubData = enrichmentData?.github;
        const githubUsername = githubData?.username;

        if (!githubUsername) {
            return {
                success: false,
                error: "No GitHub username found for this candidate."
            };
        }

        // ALWAYS FETCH FRESH DATA from GitHub API (ignore stored enrichment which may be outdated/limited)
        console.log(`[EvalAction] Fetching FRESH data from GitHub for ${githubUsername}...`);

        const { fetchGithubProfile } = await import('@/lib/enrichment');
        const freshGithubData = await fetchGithubProfile(githubUsername);

        if (freshGithubData.error || !freshGithubData.stats) {
            console.error(`[EvalAction] GitHub API Error: ${freshGithubData.error}`);
            // Fallback to stored data if fresh fetch fails
            console.log(`[EvalAction] Falling back to stored enrichment data`);
        }

        // Use FRESH data if available, otherwise fallback to stored
        const stats = freshGithubData.stats || githubData?.stats || {};
        const topLanguages: string[] = stats.topLanguages || [];
        const recentCommits: number = stats.recentCommits || 0;
        const recentActivity = stats.recentActivity || [];

        console.log(`[EvalAction] GitHub: ${githubUsername}`);
        console.log(`[EvalAction] FRESH Languages: ${topLanguages.join(', ') || 'None'}`);
        console.log(`[EvalAction] FRESH Total Commits: ${recentCommits}`);
        console.log(`[EvalAction] FRESH Activity Items: ${recentActivity.length}`);

        // Extract Job Skills for matching
        const rawReqs = app.job.rawRequirements as any;
        const requiredSkills = rawReqs?.skills || [];

        // 3. Run Phase 1: Intake (using FRESH enrichment data)
        const enrichment: EnrichmentGitHub = {
            username: githubUsername,
            stats: {
                recentCommits: recentCommits,
                topLanguages: topLanguages,
                recentActivity: recentActivity
            }
        };

        // Use ALL available commits (up to 100 - GitHub API maximum per request)
        const commits = await ingestGitHubHistory(githubUsername, 100, enrichment);
        console.log(`[EvalAction] Ingested ${commits.length} commits from FRESH data`);

        // 4. Run Phase 2: Interpretation (using REAL topLanguages)
        const observations = await interpretSummaries(commits, {
            skills: requiredSkills,
            topLanguages: topLanguages,
            recentCommits: recentCommits
        });
        console.log(`[EvalAction] Generated ${observations.length} observations`);

        // 4. Run Phase 3: Knowledge Graph
        const kg = new KnowledgeGraph();
        const candidateId = `candidate:${githubUsername}`;
        kg.addNode(candidateId, 'candidate', { username: githubUsername });

        // Link commits to candidate
        commits.forEach(c => {
            const commitId = `commit:${c.sha}`;
            kg.addNode(commitId, 'artifact', { date: c.date });
            kg.addEdge(candidateId, commitId, 'created', 1.0);
        });

        // Link ALL observations as signals to candidate
        observations.forEach(o => {
            const signalId = `signal:${o.signal.replace(/\s+/g, '-').toLowerCase()}`;
            kg.addNode(signalId, 'signal', { name: o.signal });
            kg.addEdge(candidateId, signalId, 'suggests', o.confidence);
        });

        // 5. Run Phase 4: Belief Engine
        const engine = new BeliefEngine();
        engine.initializeFromGraph(kg, candidateId);

        const report = engine.getReport().map(r => ({
            signal: r.Signal,
            score: parseFloat(r['Capability Score']),
            uncertainty: parseFloat(r.Uncertainty),
            evidence: parseFloat(r['Evidence Count'])
        }));

        // 6. Calculate OVERALL SCORE
        // Weighted average: prioritize job-relevant skills (Language/Skill matches)
        let totalWeight = 0;
        let weightedSum = 0;

        for (const item of report) {
            // Higher weight for direct skill/language matches
            const isSkillMatch = item.signal.toLowerCase().includes('skill') ||
                item.signal.toLowerCase().includes('language');
            const weight = isSkillMatch ? 2.0 : 1.0;

            // Factor in uncertainty: lower uncertainty = higher confidence in score
            const confidenceMultiplier = 1 - (item.uncertainty * 0.3);

            weightedSum += item.score * weight * confidenceMultiplier;
            totalWeight += weight;
        }

        const overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

        console.log(`[EvalAction] Overall Score: ${overallScore}/100`);
        console.log(`[EvalAction] Report Items: ${report.length}`);

        // 7. Store evaluation results in database
        await prisma.application.update({
            where: { id: applicationId },
            data: {
                status: 'evaluated',
                enrichmentData: {
                    ...(app.enrichmentData as object || {}),
                    evaluation: {
                        overallScore,
                        report,
                        evaluatedAt: new Date().toISOString(),
                        commitsAnalyzed: commits.length
                    }
                }
            }
        });

        return {
            success: true,
            overallScore,
            report
        };

    } catch (error) {
        console.error("Evaluation Failed:", error);
        return { success: false, error: "Evaluation failed. Check server logs." };
    }
}

