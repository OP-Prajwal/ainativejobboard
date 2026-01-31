'use server';

import prisma from '@/lib/prisma';

// Character limits for text inputs
const CHAR_LIMITS = {
    initialPrompt: 10000,
    aiDraft: 50000,
    finalSubmission: 50000,
    refinementExplanation: 5000,
    unchangedExplanation: 3000
};

// Status enum
type AssessmentStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

// Response types
type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Schedule tasks for an application.
 * Supports Manual specification or AI selection.
 */
export async function scheduleAssessment(
    applicationId: string,
    options: {
        scheduledAt: Date;
        mode: 'AI' | 'MANUAL';
        manualTasks?: string[]; // Array of task descriptions if MANUAL
    }
): Promise<ActionResult<{ assignmentIds: string[] }>> {
    try {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: { include: { jobTasks: true } } }
        });

        if (!application) return { success: false, error: 'Application not found' };

        let tasksToAssign: { id: string, estimatedTimeHours?: number | null }[] = [];

        if (options.mode === 'MANUAL') {
            if (!options.manualTasks || options.manualTasks.length === 0) {
                return { success: false, error: 'Manual mode requires at least one task description' };
            }

            // Create new JobTasks for each manual entry
            for (const desc of options.manualTasks) {
                const newTask = await prisma.jobTask.create({
                    data: {
                        jobId: application.jobId,
                        taskType: 'MANUAL',
                        description: desc,
                        difficultyLevel: 1,
                        estimatedTimeHours: 1.0 // Default
                    }
                });
                tasksToAssign.push(newTask);
            }
        } else {
            // AI / Existing Tasks Mode
            if (application.job.jobTasks.length === 0) {
                return { success: false, error: 'No AI tasks generated for this job yet.' };
            }
            // Assign all existing generated tasks, or logic to select specific ones
            // For now, assigning ALL existing tasks for the job (or filter by 'GENERATED')
            tasksToAssign = application.job.jobTasks;
        }

        const assignmentIds: string[] = [];

        // Create Assignments
        for (const task of tasksToAssign) {
            // Check if already assigned
            const existing = await prisma.taskAssignment.findFirst({
                where: { applicationId, taskId: task.id }
            });

            if (existing) {
                // Update schedule if exists
                await prisma.taskAssignment.update({
                    where: { id: existing.id },
                    data: { scheduledAt: options.scheduledAt }
                });
                assignmentIds.push(existing.id);
            } else {
                const created = await prisma.taskAssignment.create({
                    data: {
                        applicationId,
                        taskId: task.id,
                        status: 'PENDING',
                        scheduledAt: options.scheduledAt,
                        timeLimitMinutes: (task.estimatedTimeHours || 1) * 60
                    }
                });
                assignmentIds.push(created.id);
            }
        }

        return { success: true, data: { assignmentIds } };

    } catch (error) {
        console.error('[scheduleAssessment] Error:', error);
        return { success: false, error: 'Failed to schedule assessment' };
    }
}

// Deprecated or Aliased for backward compatibility if needed, but we should switch to scheduleAssessment
export async function assignTasks(applicationId: string) {
    return scheduleAssessment(applicationId, {
        scheduledAt: new Date(),
        mode: 'AI'
    });
}

/**
 * Start an assessment.
 * IDEMPOTENT: If already started, returns existing startedAt.
 * Sets status to IN_PROGRESS and records start time.
 */
export async function startAssessment(assignmentId: string): Promise<ActionResult<{ startedAt: Date; timeLimitMinutes: number }>> {
    try {
        const assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId }
        });

        if (!assignment) {
            return { success: false, error: 'Assignment not found' };
        }

        // Idempotent: return existing startedAt if already started
        if (assignment.startedAt) {
            return {
                success: true,
                data: {
                    startedAt: assignment.startedAt,
                    timeLimitMinutes: assignment.timeLimitMinutes
                }
            };
        }

        // Cannot start if not in PENDING status
        if (assignment.status !== 'PENDING') {
            return { success: false, error: `Cannot start assessment in ${assignment.status} status` };
        }

        // Start the assessment - use server time
        const startedAt = new Date();

        await prisma.taskAssignment.update({
            where: { id: assignmentId },
            data: {
                status: 'IN_PROGRESS',
                startedAt
            }
        });

        return {
            success: true,
            data: {
                startedAt,
                timeLimitMinutes: assignment.timeLimitMinutes
            }
        };

    } catch (error) {
        console.error('[startAssessment] Error:', error);
        return { success: false, error: 'Failed to start assessment' };
    }
}

/**
 * Global Schedule for Job.
 * Updates Job metadata and schedules tasks for ALL shortlisted candidates.
 */
export async function scheduleJobEvent(
    jobId: string,
    options: {
        scheduledAt: Date;
        mode: 'AI' | 'MANUAL';
        manualTasks?: string[];
    }
): Promise<ActionResult<{ count: number }>> {
    try {
        // 1. Update Job Settings
        await prisma.job.update({
            where: { id: jobId },
            data: {
                assessmentScheduledAt: options.scheduledAt,
                assessmentConfig: {
                    mode: options.mode,
                    manualTasks: options.manualTasks
                }
            }
        });

        // 2. Find eligible candidates (Shortlisted or Invited)
        const candidates = await prisma.application.findMany({
            where: {
                jobId,
                status: {
                    in: ['shortlisted', 'simulation_invited']
                }
            }
        });

        if (candidates.length === 0) {
            return { success: true, data: { count: 0 } }; // Saved settings, but no one to invite
        }

        // 3. Batch Schedule
        let successCount = 0;
        for (const candidate of candidates) {
            // Reuse existing logic
            const result = await scheduleAssessment(candidate.id, {
                scheduledAt: options.scheduledAt,
                mode: options.mode,
                manualTasks: options.manualTasks
            });
            if (result.success) successCount++;
        }

        return { success: true, data: { count: successCount } };

    } catch (error) {
        console.error('[scheduleJobEvent] Error:', error);
        return { success: false, error: 'Failed to schedule job event' };
    }
}

/**
 * Submit an assessment with transparency data.
 * Computes time taken from server times.
 */
export async function submitAssessment(
    assignmentId: string,
    data: {
        initialPrompt: string;
        aiDraft: string;
        finalSubmission: string;
        refinementExplanation: string;
        unchangedExplanation: string;
    }
): Promise<ActionResult<{ submittedAt: Date; timeTakenSeconds: number }>> {
    try {
        const assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId }
        });

        if (!assignment) {
            return { success: false, error: 'Assignment not found' };
        }

        // Cannot submit if already submitted
        if (assignment.status === 'SUBMITTED' || assignment.status === 'GRADED') {
            return { success: false, error: 'Assessment already submitted' };
        }

        // Must be in progress to submit
        if (assignment.status !== 'IN_PROGRESS') {
            return { success: false, error: 'Assessment has not been started' };
        }

        if (!assignment.startedAt) {
            return { success: false, error: 'Start time not recorded' };
        }

        // Validate character limits
        if (data.initialPrompt.length > CHAR_LIMITS.initialPrompt) {
            return { success: false, error: `Initial prompt exceeds ${CHAR_LIMITS.initialPrompt} character limit` };
        }
        if (data.aiDraft.length > CHAR_LIMITS.aiDraft) {
            return { success: false, error: `AI draft exceeds ${CHAR_LIMITS.aiDraft} character limit` };
        }
        if (data.finalSubmission.length > CHAR_LIMITS.finalSubmission) {
            return { success: false, error: `Final submission exceeds ${CHAR_LIMITS.finalSubmission} character limit` };
        }
        if (data.refinementExplanation.length > CHAR_LIMITS.refinementExplanation) {
            return { success: false, error: `Refinement explanation exceeds ${CHAR_LIMITS.refinementExplanation} character limit` };
        }
        if (data.unchangedExplanation.length > CHAR_LIMITS.unchangedExplanation) {
            return { success: false, error: `Unchanged explanation exceeds ${CHAR_LIMITS.unchangedExplanation} character limit` };
        }

        // Calculate time taken using server time
        const submittedAt = new Date();
        const timeTakenSeconds = Math.round((submittedAt.getTime() - assignment.startedAt.getTime()) / 1000);

        await prisma.taskAssignment.update({
            where: { id: assignmentId },
            data: {
                status: 'SUBMITTED',
                submittedAt,
                timeTakenSeconds,
                initialPrompt: data.initialPrompt,
                aiDraft: data.aiDraft,
                finalSubmission: data.finalSubmission,
                refinementExplanation: data.refinementExplanation,
                unchangedExplanation: data.unchangedExplanation
            }
        });

        return {
            success: true,
            data: { submittedAt, timeTakenSeconds }
        };

    } catch (error) {
        console.error('[submitAssessment] Error:', error);
        return { success: false, error: 'Failed to submit assessment' };
    }
}

/**
 * Grade an assessment using AI.
 * Can be called multiple times (re-grading increments evaluationVersion).
 */
export async function gradeAssessment(assignmentId: string): Promise<ActionResult<{
    score: number;
    confidence: number;
    feedback: string;
}>> {
    try {
        const assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                task: true
            }
        });

        if (!assignment) {
            return { success: false, error: 'Assignment not found' };
        }

        // Must be submitted to grade
        if (assignment.status !== 'SUBMITTED' && assignment.status !== 'GRADED') {
            return { success: false, error: 'Assessment must be submitted before grading' };
        }

        // Import grader dynamically to avoid circular deps
        const { gradeSubmission } = await import('@/lib/assessment/assessment-grader');

        const gradeResult = await gradeSubmission({
            taskDescription: assignment.task.description,
            starterCode: assignment.task.starterCode || '',
            taskInvariants: assignment.task.taskInvariants as string[] | null,
            difficultyLevel: assignment.task.difficultyLevel,
            estimatedTimeHours: assignment.task.estimatedTimeHours || 1,
            timeTakenSeconds: assignment.timeTakenSeconds || 0,
            initialPrompt: assignment.initialPrompt || '',
            aiDraft: assignment.aiDraft || '',
            finalSubmission: assignment.finalSubmission || '',
            refinementExplanation: assignment.refinementExplanation || '',
            unchangedExplanation: assignment.unchangedExplanation || ''
        });

        if (!gradeResult.success) {
            return { success: false, error: gradeResult.error };
        }

        const grade = gradeResult.data;

        // Determine if human review is needed (low confidence)
        const requiresHumanReview = grade.confidence < 0.6;

        // Update assignment with grades
        await prisma.taskAssignment.update({
            where: { id: assignmentId },
            data: {
                status: 'GRADED',
                aiScore: grade.score,
                confidence: grade.confidence,
                uncertaintyReasons: grade.uncertaintyReasons,
                diffSummary: grade.diffSummary,
                aiFeedback: grade.aiFeedback,
                strongestPositive: grade.strongestPositiveEvidence,
                strongestNegative: grade.strongestNegativeEvidence,
                whatWouldChangeScore: grade.whatWouldChangeTheScore,
                requiresHumanReview,
                evaluationVersion: { increment: 1 }
            }
        });

        return {
            success: true,
            data: {
                score: grade.score,
                confidence: grade.confidence,
                feedback: grade.aiFeedback
            }
        };

    } catch (error) {
        console.error('[gradeAssessment] Error:', error);
        return { success: false, error: 'Failed to grade assessment' };
    }
}

/**
 * Get assessment data with Black Box Start security.
 * Task details are ONLY returned if status is IN_PROGRESS or later.
 */
export async function getAssessmentData(applicationId: string): Promise<ActionResult<{
    assignment: {
        id: string;
        status: AssessmentStatus;
        timeLimitMinutes: number;
        startedAt: Date | null;
        submittedAt: Date | null;
        timeTakenSeconds: number | null;
    };
    task: {
        id: string;
        title: string;
        // These fields are ONLY included if status is IN_PROGRESS or later
        description?: string;
        starterCode?: string;
        taskInvariants?: string[];
    } | null;
    evaluation?: {
        aiScore: number | null;
        confidence: number | null;
        aiFeedback: string | null;
    };
}>> {
    try {
        // First, get the application with task assignments
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                taskAssignments: {
                    include: {
                        task: true
                    }
                }
            }
        });

        if (!application) {
            return { success: false, error: 'Application not found' };
        }

        if (application.taskAssignments.length === 0) {
            return { success: false, error: 'No assessment assigned' };
        }

        // For MVP: use first assignment
        const assignment = application.taskAssignments[0];
        const status = assignment.status as AssessmentStatus;

        // BLACK BOX START: Only reveal task details if assessment has started
        const canRevealTask = status === 'IN_PROGRESS' || status === 'SUBMITTED' || status === 'GRADED';

        const taskData = canRevealTask ? {
            id: assignment.task.id,
            title: assignment.task.taskType,
            description: assignment.task.description,
            starterCode: assignment.task.starterCode || undefined,
            taskInvariants: (assignment.task.taskInvariants as string[]) || undefined
        } : {
            id: assignment.task.id,
            title: assignment.task.taskType
            // NO description, starterCode, or invariants until started
        };

        const result = {
            assignment: {
                id: assignment.id,
                status,
                timeLimitMinutes: assignment.timeLimitMinutes,
                startedAt: assignment.startedAt,
                submittedAt: assignment.submittedAt,
                timeTakenSeconds: assignment.timeTakenSeconds
            },
            task: taskData,
            evaluation: undefined as {
                aiScore: number | null;
                confidence: number | null;
                aiFeedback: string | null;
            } | undefined
        };

        // Include evaluation data if graded
        if (status === 'GRADED') {
            result.evaluation = {
                aiScore: assignment.aiScore,
                confidence: assignment.confidence,
                aiFeedback: assignment.aiFeedback
            };
        }

        return { success: true, data: result };

    } catch (error) {
        console.error('[getAssessmentData] Error:', error);
        return { success: false, error: 'Failed to get assessment data' };
    }
}
