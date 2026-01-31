import { SimulationLayout } from "@/components/simulation/SimulationLayout";
import { PhaseTimeline } from "@/components/simulation/PhaseTimeline";
import { DashboardStats } from "@/components/simulation/DashboardStats";
import { PhaseWorkspace } from "@/components/simulation/PhaseWorkspace";
import { WaitRoom } from "@/components/simulation/WaitRoom";
import { TaskAllocationService } from "@/lib/task-allocation/service";
import { ProjectState } from "@/lib/task-allocation/types";
import { notFound } from "next/navigation";

// Initialize Service
const service = new TaskAllocationService();

export default async function SimulationPage({ params }: { params: Promise<{ applicationId: string }> }) {
    const { applicationId } = await params;

    if (!applicationId) return notFound();

    // 1. Fetch current active task or generate if new session
    const fetchedAssignment = await service.getLastActiveTask(applicationId);

    let taskAssignment;
    let activeTask;

    if (!fetchedAssignment) {
        // ... (existing auto-generate logic if needed, but normally admin assigns now)
        try {
            // For safety, we keep auto-generate if someone hits URL without invite? 
            // Or maybe we strictly block? 
            // If Admin didn't schedule, we probably shouldn't auto-start.
            // But for current flow, let's allow fallback but it will be PENDING?
            // Actually, generateNextTask creates PENDING by default in my previous view? 
            // No, `service.generateNextTask` creates PENDING.
            const result = await service.generateNextTask(applicationId);
            taskAssignment = result.assignment;
            activeTask = result.task;
        } catch (error) {
            console.error("Failed to init simulation:", error);
            return (
                <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
                    <div>Error initializing simulation. Please contact support.</div>
                </div>
            );
        }
    } else {
        taskAssignment = fetchedAssignment;
        activeTask = fetchedAssignment.task;
    }

    // Resolve Application for Name/ProjectState
    const prisma = (await import("@/lib/prisma")).default;
    const application = await prisma.application.findUnique({
        where: { id: applicationId }
    });

    if (!application) return notFound();

    // Check Status for Wait Room
    if (taskAssignment.status === 'PENDING') {
        return (
            <WaitRoom
                assignment={{
                    id: taskAssignment.id,
                    scheduledAt: taskAssignment.scheduledAt,
                    timeLimitMinutes: taskAssignment.timeLimitMinutes
                }}
                candidateName={application.name}
            />
        );
    }

    const enrichmentData = (application.enrichmentData as any) || {};
    const projectState = enrichmentData.projectState as ProjectState;

    if (!projectState) {
        return <div>State inconsistency error.</div>;
    }

    if (projectState.phase > 7) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-200">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Simulation Complete</h1>
                    <p className="text-slate-400">Thank you for your submissions. The team will review your architectural decisions.</p>
                </div>
            </div>
        );
    }

    return (
        <SimulationLayout
            timeline={<PhaseTimeline currentPhase={projectState.phase} />}
            stats={<DashboardStats state={projectState} />}
            workspace={
                <PhaseWorkspace
                    task={activeTask}
                    assignmentId={taskAssignment.id}
                    applicationId={application.id} // Pass explicit App ID for actions
                    projectState={projectState}
                />
            }
        />
    );
}
