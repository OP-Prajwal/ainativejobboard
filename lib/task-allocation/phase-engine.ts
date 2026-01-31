import { Phase, ProjectState, PriorPhaseArtifacts } from './types';

export function advancePhase(
    currentState: ProjectState,
    priorArtifacts: PriorPhaseArtifacts
): ProjectState {
    const nextPhase = (currentState.phase + 1) as Phase;

    // Check if we've exceeded the maximum phase
    if (nextPhase > Phase.AUDIT) {
        return currentState;
    }

    const updatedState: ProjectState = {
        ...currentState,
        phase: nextPhase,
        decisionLog: [...currentState.decisionLog],
        activeConstraints: [...currentState.activeConstraints],
    };

    // Extract decisions from prior artifacts
    if (priorArtifacts.decisions && priorArtifacts.decisions.length > 0) {
        updatedState.decisionLog.push(...priorArtifacts.decisions);
    }

    // Logic for Technical Debt and Constraints based on Phase Transition
    switch (nextPhase) {
        case Phase.SCARCITY:
            updatedState.activeConstraints.push('70% budget cut: No new external dependencies allowed.');
            break;
        case Phase.LOAD:
            updatedState.activeConstraints.push('100x Traffic Spike: Must handle concurrent requests.');
            // Increase debt if Phase 2 was handled with heavy resource usage
            if (priorArtifacts.code?.includes('cache') === false) {
                updatedState.technicalDebt += 15;
            }
            break;
        case Phase.FRICTION:
            updatedState.activeConstraints.push('Legacy Integration: Must use Soap-V1 adapter for data.');
            updatedState.technicalDebt += 10;
            break;
        case Phase.CRISIS:
            updatedState.activeConstraints.push('Core Failure: Primary database is read-only.');
            // Difficulty scales with technical debt
            if (updatedState.technicalDebt > 20) {
                updatedState.activeConstraints.push('Cascading Failure: Background workers are stalling.');
            }
            break;
        case Phase.PIVOT:
            updatedState.activeConstraints.push('Business Pivot: Real-time latency < 50ms now required.');
            break;
        case Phase.AUDIT:
            updatedState.activeConstraints.push('Final Audit: Defend consistency from Phase 1 onwards.');
            break;
    }

    return updatedState;
}
