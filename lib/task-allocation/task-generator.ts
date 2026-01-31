import { Phase, ProjectState, PriorPhaseArtifacts, JobOutcomeBundle } from './types';

export function generateTaskPrompt(
    state: ProjectState,
    artifacts: PriorPhaseArtifacts,
    job: JobOutcomeBundle
): string {
    const phaseTheme = getPhaseTheme(state.phase);
    const priorDecision = state.decisionLog.length > 0
        ? state.decisionLog[state.decisionLog.length - 1]
        : "initial system design";

    const prompt = `
# ASSESSMENT PHASE ${state.phase}: ${phaseTheme}

## CONTEXT
The project has evolved. Based on your previous decision to implement "${priorDecision}", we are moving into the next stage.
CURRENT TECHNICAL DEBT: ${state.technicalDebt}

## BUSINESS STATUS
Goals: ${job.businessGoals.join(', ')}

## ACTIVE CONSTRAINTS
${state.activeConstraints.map(c => `- ${c}`).join('\n')}

## YOUR TASK
${getPhaseTask(state.phase)}

### ABSOLUTE RULES:
1. NO GREENFIELD RESETS. You must adapt the current system shape described as: ${state.systemShape}.
2. Every change must explicitly handle the new constraint: "${state.activeConstraints[state.activeConstraints.length - 1]}".
3. Reference your prior decision on "${priorDecision}" in the implementation.

Go.
`;

    return prompt.trim();
}

function getPhaseTheme(phase: Phase): string {
    switch (phase) {
        case Phase.IDEAL: return "The Ideal Solution";
        case Phase.SCARCITY: return "Resource Scarcity";
        case Phase.LOAD: return "Extreme Load";
        case Phase.FRICTION: return "Legacy Friction";
        case Phase.CRISIS: return "Core Component Failure";
        case Phase.PIVOT: return "Business Pivot";
        case Phase.AUDIT: return "Architecture Audit";
        default: return "Unknown";
    }
}

function getPhaseTask(phase: Phase): string {
    switch (phase) {
        case Phase.IDEAL:
            return "Design and implement the baseline architecture for the business goals. Assume unlimited resources and modern tooling.";
        case Phase.SCARCITY:
            return "A sudden 70% budget cut has hit the department. Optimize your current solution to run on minimal infrastructure without losing core functionality.";
        case Phase.LOAD:
            return "Traffic has spiked 100x due to a viral event. Adapt your solution to handle this load while respecting existing scarcity constraints.";
        case Phase.FRICTION:
            return "We are forced to integrate with a legacy system that only speaks XML/SOAP. Integrate this without breaking your previous scalability work.";
        case Phase.CRISIS:
            return "A critical component has failed. You must provide a fallback mechanism that maintains system integrity under degraded conditions.";
        case Phase.PIVOT:
            return "The business focus has shifted. What was a background process must now be real-time. Pivot the implementation accordingly.";
        case Phase.AUDIT:
            return "Defend the entire evolution of your system. Explain how the decisions from Phase 1 survived (or why they didn't) through the constraints of Phase 6.";
        default:
            return "Continue development based on current constraints.";
    }
}
