import { NextRequest, NextResponse } from "next/server";
import { JobDecompositionService } from "@/services/JobDecompositionService";
import prisma from "@/lib/prisma";

// Trigger Decomposition
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> } // Await params in Next.js 15+ convention for dynamic routes
) {
    try {
        const { jobId } = await params;

        // Start decomposition (Async or Await? Prompt implies blocking or fast enough, 
        // but better to await for simplicity in V1)
        const result = await JobDecompositionService.decompose(jobId);

        return NextResponse.json(result);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Decomposition Failed:", error);
        return NextResponse.json(
            { error: error.message || "Decomposition failed" },
            { status: 500 }
        );
    }
}
