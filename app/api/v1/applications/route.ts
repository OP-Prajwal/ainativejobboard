import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { enrichCandidate } from '@/lib/enrichment';

export async function POST(req: Request) {
    try {
        const body = await req.json();
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

        // Fetch Enrichment Data (Background-able, but for now blocking to ensure we get it)
        // In production, this would go to a queue. Here we await it to save it in one go for simplicity.
        let enrichmentData = {};
        if (githubId || leetcodeId || codeforcesId) {
            try {
                enrichmentData = await enrichCandidate({ github: githubId, leetcode: leetcodeId, codeforces: codeforcesId });
            } catch (err) {
                console.error("Enrichment failed:", err);
            }
        }

        // Create Application
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
                status: 'pending',
                enrichmentData: enrichmentData // Save the stats
            }
        });

        return NextResponse.json(application, { status: 201 });

    } catch (error: any) {
        console.error("[Application API] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
