'use server'

import { TaskAllocationService } from "@/lib/task-allocation/service";
import { revalidatePath } from "next/cache";

// Initialize Service
const service = new TaskAllocationService();

export async function getSimulationState(applicationId: string) {
    if (!applicationId) throw new Error("Application ID required");

    // Fetch last active task to show current state
    const currentTask = await service.getLastActiveTask(applicationId);

    // We could also fetch history here if needed, or rely on client to show current only.
    // For now, returning the critical current active state.

    return {
        currentTask
    };
}

export async function submitSimulationTask(assignmentId: string, content: string, applicationId: string) {
    if (!assignmentId || !content) throw new Error("Invalid submission");

    const result = await service.submitTask(assignmentId, content);

    // Revalidate the page so the new task appears immediately
    revalidatePath(`/simulation/${applicationId}`);

    return result;
}
