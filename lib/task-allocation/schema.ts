
import { z } from 'zod';
import { Phase } from './types';

export const TaskGenerationSchema = z.object({
    phase: z.nativeEnum(Phase).or(z.number()),
    phaseName: z.string(),
    activeConstraints: z.array(z.string()),
    taskPrompt: z.string(),
    rules: z.array(z.string()),
    expectedArtifactType: z.string(),
    updatedProjectState: z.object({
        phase: z.nativeEnum(Phase).or(z.number()),
        technicalDebt: z.number(),
        activeConstraints: z.array(z.string()),
        decisionLog: z.array(z.string()),
        systemShape: z.string(),
    }),
});

export type TaskGenerationOutput = z.infer<typeof TaskGenerationSchema>;
