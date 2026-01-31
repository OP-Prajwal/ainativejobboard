export enum Phase {
    IDEAL = 1,
    SCARCITY = 2,
    LOAD = 3,
    FRICTION = 4,
    CRISIS = 5,
    PIVOT = 6,
    AUDIT = 7
}

export interface ProjectState {
    phase: Phase;
    technicalDebt: number;
    activeConstraints: string[];
    decisionLog: string[];
    systemShape: string;
}

export interface JobOutcomeBundle {
    businessGoals: string[];
    successCriteria: string[];
    failureConditions: string[];
}

export interface CandidateCapabilityProfile {
    belief: Record<string, number>;
    uncertainty: Record<string, number>;
    trend: Record<string, 'improving' | 'declining' | 'stable'>;
}

export interface PriorPhaseArtifacts {
    phase: Phase;
    code?: string;
    docs?: string;
    architectureNotes?: string;
    decisions?: string[];
}

export interface TaskAllocationOutput {
    updatedState: ProjectState;
    taskPrompt: string;
}
