'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function shortlistCandidate(applicationId: string, jobId: string) {
    try {
        await prisma.application.update({
            where: { id: applicationId },
            data: { status: 'shortlisted' }
        });

        // Revalidate the applications list
        revalidatePath(`/admin/jobs/${jobId}/applications`);
        return { success: true };
    } catch (error) {
        console.error("Failed to shortlist:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function rejectCandidate(applicationId: string, jobId: string) {
    try {
        await prisma.application.update({
            where: { id: applicationId },
            data: { status: 'rejected' }
        });

        revalidatePath(`/admin/jobs/${jobId}/applications`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reject:", error);
        return { success: false, error: "Failed to update status" };
    }
}
