import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get Decomposition Results
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        const outcomes = await prisma.jobOutcome.findMany({
            where: { jobId },
            include: { tasks: true }
        });

        const signals = await prisma.signalProfile.findUnique({
            where: { jobId }
        });

        return NextResponse.json({
            outcomes,
            signal_profile: signals
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to fetch decomposition" },
            { status: 500 }
        );
    }
}
