
import prisma from '../prisma';
import { generatePhaseTask, LLMTaskInput } from './llm-task-generator';
import { Phase, ProjectState } from './types';
import { TaskGenerationOutput } from './schema';

export class TaskAllocationService {

    /**
     * Generates the next sequential task for a candidate's application.
     * Persists the task to the database and updates the application's project state.
     */
    async generateNextTask(applicationId: string) {
        // 1. Fetch Application and Job Data
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: true,
                taskAssignments: {
                    include: { task: true }
                }
            }
        });

        if (!application) throw new Error("Application not found");
        if (!application.job) throw new Error("Job not found for application");

        // 2. Resolve Project State
        // We store the simulation state in enrichmentData.projectState
        const enrichmentData = (application.enrichmentData as any) || {};
        let projectState: ProjectState = enrichmentData.projectState;

        if (!projectState) {
            // Initialize new state
            projectState = {
                phase: Phase.IDEAL,
                technicalDebt: 0,
                activeConstraints: [],
                decisionLog: [],
                systemShape: "Undefined"
            };
        }

        // 3. Prepare Input for LLM
        // user requested to use 'raw_requirements' instead of generic description
        // We'll stringify it if it's JSON, or fall back to description if missing.
        let jobContext = "";
        if (application.job.rawRequirements) {
            jobContext = JSON.stringify(application.job.rawRequirements, null, 2);
        } else {
            jobContext = application.job.description;
        }

        const candidateContext = {
            role: "Candidate", // logic to extract specific role if needed
            seniority: "mid" as "junior" | "mid" | "senior", // default or infer from resume data if available
            priorExperience: "Unknown" // could be extracted from resume parsing
        };

        const input: LLMTaskInput = {
            jobDescription: jobContext,
            candidateContext,
            projectState
        };

        // 4. Generate Task via LLM (Deterministic Engine)
        let generated: TaskGenerationOutput;
        try {
            const resultJson = await generatePhaseTask(input);
            generated = JSON.parse(resultJson);
        } catch (error) {
            console.error("LLM Generation Failed:", error);
            throw new Error("Failed to generate task from LLM");
        }

        // 5. Persist Results

        // A. Create a new JobTask for this phase
        // We intentionally create a NEW task record because the content is dynamic per-candidate state
        const newTask = await prisma.jobTask.create({
            data: {
                jobId: application.jobId,
                taskType: `simulation_phase_${generated.phase}`,
                description: generated.taskPrompt,
                difficultyLevel: generated.phase, // simplistic mapping
                taskInvariants: {
                    constraints: generated.activeConstraints,
                    rules: generated.rules
                },
                expectedArtifacts: {
                    type: generated.expectedArtifactType
                }
            }
        });

        // B. Update Application State
        const updatedState = generated.updatedProjectState;

        // Ensure phase advances for the *next* round if the LLM didn't already increment it (it usually generates for *current* phase)
        // Actually, the engine generates the Task for Phase N. The *Output* contains 'updatedProjectState'. 
        // We usually want to advance the phase AFTER the user completes it. 
        // BUT, the prompt logic says: "Generate Phase N Only". The output 'updatedProjectState' might be suggesting the state *during* or *after*?
        // Let's assume the LLM output 'updatedProjectState' is the state to be saved for the *next* retrieval.

        await prisma.application.update({
            where: { id: applicationId },
            data: {
                enrichmentData: {
                    ...enrichmentData,
                    projectState: updatedState
                }
            }
        });

        // C. Assign Task to Candidate
        const assignment = await prisma.taskAssignment.create({
            data: {
                applicationId: applicationId,
                taskId: newTask.id,
                status: 'PENDING',
                initialPrompt: generated.taskPrompt // Storing valid prompt context
            }
        });

        console.log(`[TaskAllocation] Generated Phase ${generated.phase} task for App ${applicationId}`);

        return {
            task: newTask,
            assignment,
            projectState: updatedState
        };
    }

    async getLastActiveTask(applicationId: string) {
        return await prisma.taskAssignment.findFirst({
            where: { applicationId },
            orderBy: { createdAt: 'desc' },
            include: { task: true }
        });
    }

    async submitTask(assignmentId: string, submissionContent: string) {
        // 1. Mark current assignment as submitted
        const assignment = await prisma.taskAssignment.update({
            where: { id: assignmentId },
            data: {
                status: 'SUBMITTED',
                finalSubmission: submissionContent,
                submittedAt: new Date()
            },
            include: { application: true }
        });

        // 2. Advance the Phase
        const enrichmentData = (assignment.application.enrichmentData as any) || {};
        const currentState = enrichmentData.projectState as ProjectState;

        if (!currentState) {
            // Should not happen if task existed, but safety check
            throw new Error("Project state missing during submission");
        }

        // Increment Phase (unless we are at 7)
        if (currentState.phase >= 7) {
            // End of simulation logic could go here
            return { status: 'COMPLETED', nextTask: null };
        }

        const nextPhase = (currentState.phase + 1) as Phase;

        // Update state to prepare for next generation
        // Note: activeConstraints might technically change *during* the generation of the next task if the LLM decides to add them *then*. 
        // But our current flow is: Generate(Phase N) -> Output includes constraints for Phase N.
        // So for Phase N+1, we start with Phase N's constraints.

        const nextState = {
            ...currentState,
            phase: nextPhase
            // technicalDebt: ... could update based on some analysis of submission
        };

        await prisma.application.update({
            where: { id: assignment.applicationId },
            data: {
                enrichmentData: {
                    ...enrichmentData,
                    projectState: nextState
                }
            }
        });

        // 3. Generate Next Task
        return await this.generateNextTask(assignment.applicationId);
    }
}
