import { ProjectState, PriorPhaseArtifacts, JobOutcomeBundle, TaskAllocationOutput } from './types';
import { advancePhase } from './phase-engine';
import { generateTaskPrompt } from './task-generator';

export function allocateNextTask(
    currentState: ProjectState,
    priorArtifacts: PriorPhaseArtifacts,
    job: JobOutcomeBundle
): TaskAllocationOutput {
    // 1. Advance phase state
    const updatedState = advancePhase(currentState, priorArtifacts);

    // 2. Generate the prompt for the next phase
    const taskPrompt = generateTaskPrompt(updatedState, priorArtifacts, job);

    return {
        updatedState,
        taskPrompt
    };
}
