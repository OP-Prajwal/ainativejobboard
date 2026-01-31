export enum PhaseSignalType {
    DECISION_CARRYOVER = 'decision-carryover',
    CONSTRAINT_RESPECT = 'constraint-respect',
    SCOPE_DISCIPLINE = 'scope-discipline',
    IRREVERSIBILITY_DENSITY = 'irreversibility-density',
    SOLUTION_STABILITY = 'solution-stability'
}

export interface EvidenceRecord {
    value: number; // 0.0 - 1.0 (normalized)
    timestamp: number;
    metadata: {
        phase: number;
        signalType: PhaseSignalType;
        description: string;
    };
}
