import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { enrichCandidate } from '@/lib/enrichment';
import { BeliefEngine } from '@/lib/evaluation/belief-engine';
import { KnowledgeGraph } from '@/lib/evaluation/knowledge-graph';
import { ingestEnrichmentToGraph } from '@/lib/evaluation/ingestion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // ... (destructuring remains same) ...
        const {
            jobId,
            name,
            email,
            resumeUrl,
            linkedInUrl,
            portfolioUrl,
            githubId,
            leetcodeId,
            codeforcesId,
            coverLetter
        } = body;

        // Basic validation
        if (!jobId || !name || !email || !resumeUrl) {
            return NextResponse.json(
                { error: "Missing required fields: jobId, name, email, resumeUrl" },
                { status: 400 }
            );
        }

        // Verify Job exists and is active
        const job = await prisma.job.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        if (job.status !== 'active') {
            return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 });
        }

        // Fetch Enrichment Data
        let enrichmentData = {};
        if (githubId || leetcodeId || codeforcesId) {
            try {
                enrichmentData = await enrichCandidate({ github: githubId, leetcode: leetcodeId, codeforces: codeforcesId });
            } catch (err) {
                console.error("Enrichment failed:", err);
            }
        }

        // --- BELIEF ENGINE SCREENING ---
        const kg = new KnowledgeGraph();
        const tempCandidateId = "candidate:temp"; // API hasn't created DB record yet, use temp ID for graph
        kg.addNode(tempCandidateId, 'candidate');

        // Ingest Data into Graph
        ingestEnrichmentToGraph(kg, tempCandidateId, enrichmentData);

        // Run Belief Engine
        const engine = new BeliefEngine();
        engine.initializeFromGraph(kg, tempCandidateId);

        const report = engine.getReport();

        // Simple Shortlist Logic: Did we find ANY valid positive capabilities?
        // In real system: Match against Job Requirements (SignalProfile)
        const hasPositiveSignals = report.some(r => parseFloat(r['Capability Score']) > 0.1);

        const screeningResult = {
            shortlisted: hasPositiveSignals,
            score: hasPositiveSignals ? 80 : 40, // derived or simplified
            reason: hasPositiveSignals
                ? `Strong signals detected: ${report.map(r => r.Signal).slice(0, 3).join(', ')}`
                : "Insufficient technical signals found in public profile."
        };

        const status = screeningResult.shortlisted ? 'simulation_invited' : 'pending_review';

        // ... Create Application ...

        const application = await prisma.application.create({
            data: {
                jobId,
                name,
                email,
                resumeUrl,
                linkedinUrl: linkedInUrl,
                portfolioUrl,
                githubId,
                leetcodeId,
                codeforcesId,
                coverLetter,
                status: status,
                enrichmentData: {
                    ...enrichmentData,
                    beliefScore: screeningResult.score,
                    screeningReason: screeningResult.reason
                }
            }
        });

        // Initialize Simulation if invited
        let simulationUrl = null;
        if (status === 'simulation_invited') {
            simulationUrl = `/simulation/${application.id}`;
            // Optional: Auto-trigger Phase 1 generation here OR let the page load do it.
            // Page load does it safely via ensureActiveTask logic.
        }

        return NextResponse.json({
            ...application,
            simulationUrl
        }, { status: 201 });

    } catch (error: any) {
        console.error("[Application API] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
