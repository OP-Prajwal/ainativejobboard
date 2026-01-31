import { PhaseSignalType, EvidenceRecord } from './types';
import { PriorPhaseArtifacts, ProjectState } from '../task-allocation/types';
import { calculateStability, normalize } from './normalizers';

export function extractPhaseSignals(
    previous: PriorPhaseArtifacts,
    current: PriorPhaseArtifacts,
    state: ProjectState
): EvidenceRecord[] {
    const timestamp = Date.now();
    const records: EvidenceRecord[] = [];

    // 1. Decision Carryover
    // Check if decisions from previous phase are mentioned in current docs or code
    const previousDecisions = previous.decisions || [];
    let carryoverScore = 1.0;
    if (previousDecisions.length > 0) {
        const keptDecisions = previousDecisions.filter(d =>
            current.code?.toLowerCase().includes(d.toLowerCase()) ||
            current.architectureNotes?.toLowerCase().includes(d.toLowerCase())
        );
        carryoverScore = normalize(keptDecisions.length, 0, previousDecisions.length);
    }
    records.push({
        value: carryoverScore,
        timestamp,
        metadata: {
            phase: current.phase,
            signalType: PhaseSignalType.DECISION_CARRYOVER,
            description: `Candidate maintained ${Math.round(carryoverScore * 100)}% of previous architectural decisions.`
        }
    });

    // 2. Constraint Respect
    // Check if the most recent constraint is addressed (simulated heuristic)
    const latestConstraint = state.activeConstraints[state.activeConstraints.length - 1];
    let respectScore = 0.5; // Default neutral
    if (latestConstraint) {
        // Very basic simulation: if current artifacts mention keywords from constraint
        const keywords = latestConstraint.toLowerCase().split(' ').filter(w => w.length > 4);
        const matches = keywords.filter(k =>
            current.code?.toLowerCase().includes(k) ||
            current.docs?.toLowerCase().includes(k)
        );
        respectScore = normalize(matches.length, 0, keywords.length);
    }
    records.push({
        value: respectScore,
        timestamp,
        metadata: {
            phase: current.phase,
            signalType: PhaseSignalType.CONSTRAINT_RESPECT,
            description: `Observable handling of phase-specific constraints: ${latestConstraint}`
        }
    });

    // 3. Solution Stability
    const stabilityScore = calculateStability(previous.code || '', current.code || '');
    records.push({
        value: stabilityScore,
        timestamp,
        metadata: {
            phase: current.phase,
            signalType: PhaseSignalType.SOLUTION_STABILITY,
            description: `Codebase stability assessment: ${Math.round(stabilityScore * 100)}% structural continuity.`
        }
    });

    // 4. Scope Discipline (Heuristic: Artifact size relative to debt)
    const artifactSize = (current.code?.length || 0) + (current.docs?.length || 0);
    const scopeScore = normalize(artifactSize, 0, 5000); // 5000 chars as a "norm"
    records.push({
        value: 1.0 - (state.technicalDebt / 100), // Higher debt = Lower discipline
        timestamp,
        metadata: {
            phase: current.phase,
            signalType: PhaseSignalType.SCOPE_DISCIPLINE,
            description: `Management of scope and technical debt during phase transition.`
        }
    });

    return records;
}
