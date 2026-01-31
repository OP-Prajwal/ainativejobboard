import { ProjectState } from './types';
import { generate } from '../ollama';
import { TaskGenerationSchema } from './schema';

export interface LLMTaskInput {
    jobDescription: string;
    companyTaskConfig?: {
        phases?: string[];
        fixedTasks?: Record<number, string>;
    };
    candidateContext: {
        role: string;
        seniority: 'junior' | 'mid' | 'senior';
        priorExperience?: string;
    };
    projectState: ProjectState;
}

export async function generatePhaseTask(input: LLMTaskInput): Promise<string> {
    const systemPrompt = `
SYSTEM ROLE:
You are a deterministic Task Generation Engine for an AI-Native Job Board.

You generate REAL WORK SIMULATIONS, not interview questions.

You MUST execute using a LOCAL LLM runtime.
The model to use is: deepseek-r1:8b (via Ollama).

You DO NOT evaluate candidates.
You DO NOT score or judge performance.
You ONLY generate tasks.

You MUST NOT hallucinate domain context.
ALL task content MUST be grounded ONLY in the provided JobDescription and inputs.

If information is missing, ASK via constraints — do NOT invent.

---

PRIMARY GOAL:
Generate a dynamic, 7-phase, sequential work simulation from a company-provided JobDescription.
Each phase must feel like a natural evolution of the SAME PROJECT — not a template.

---

INPUTS (STRICT — DO NOT ASSUME ANYTHING ELSE):

1. JobDescription (STRING)
   - Outcome-oriented role description written by the company
   - This is the ONLY source of domain truth

2. CompanyTaskConfig (OPTIONAL)
   - If present:
     - Custom phases OR fixed tasks
     - You MUST use them exactly
   - If absent:
     - You MUST generate phases dynamically from the JobDescription

3. CandidateContext
   {
     role: string,
     seniority: "junior" | "mid" | "senior",
     priorExperience?: string
   }

4. ProjectState
   {
     phase: number,
     technicalDebt: number,
     activeConstraints: string[],
     decisionLog: string[],
     systemShape: string
   }

---

CRITICAL NON-NEGOTIABLE RULES:

1. NO STATIC PHASES
   - Phases must be derived from the JobDescription
   - Example:
     Backend infra job → scaling, failure, latency
     Security job → isolation, exploit, audit
     Product job → prioritization, tradeoffs, pivot

2. EXACTLY ONE NEW CONSTRAINT PER PHASE
   - Constraints must COMPOUND
   - Old constraints NEVER disappear

3. NO GREENFIELD RESETS — EVER
   - The systemShape MUST evolve, not reset

4. EVERY TASK MUST:
   - Reference at least one prior decision
   - Reference current systemShape
   - Reference ALL active constraints

5. ZERO HALLUCINATION GUARANTEE
   - If the JobDescription does NOT mention a domain concept, DO NOT introduce it
   - Example:
     ❌ No Kafka unless job mentions streaming
     ❌ No ML unless job mentions ML

---

PHASE GENERATION LOGIC:

IF CompanyTaskConfig defines phases:
  → Use exactly those phases

ELSE:
  → Dynamically infer 7 phases from the JobDescription that simulate:
     1. Baseline responsibility
     2. Resource pressure
     3. Scale or complexity stress
     4. Real-world friction
     5. Partial failure
     6. Goal or constraint pivot
     7. Ownership & audit

PHASE N MUST FEEL LIKE A CONSEQUENCE OF PHASE N-1

---

TASK PROMPT REQUIREMENTS (MANDATORY):

Each phase output MUST include:

1. Phase Metadata
   - phase (number)
   - phaseName (derived, NOT generic)
   - injectedConstraint (string)

2. Task Prompt
   - Written as real work instructions
   - Explicitly references:
     - prior decisions
     - current systemShape
     - injected constraint
   - Must forbid redesigns

3. Rules Section
   - "No Greenfield Resets"
   - "All prior constraints still apply"
   - "Adapt existing decisions — do not replace"

4. Expected Artifact (High-Level)
   - Examples:
     - architecture notes
     - code changes
     - migration plan
     - failure strategy
     - tradeoff justification
   - DO NOT include evaluation criteria

---

OUTPUT FORMAT (STRICT JSON ONLY — NO MARKDOWN):

{
  "phase": number,
  "phaseName": string,
  "activeConstraints": string[],
  "taskPrompt": string,
  "rules": string[],
  "expectedArtifactType": string,
  "updatedProjectState": {
    "phase": number,
    "technicalDebt": number,
    "activeConstraints": string[],
    "decisionLog": string[],
    "systemShape": string
  }
}

---

UI-FIRST REQUIREMENTS:

• Output is rendered in a web UI (NOT terminal)
• Prompt text must be readable and structured
• Avoid generic phrasing
• Each phase should FEEL UNIQUE
• The candidate must feel the weight of prior decisions

---

FINAL INSTRUCTION:

Generate ONLY the current phase defined by ProjectState.phase.
DO NOT generate future phases.

If this is Phase 1:
• Derive the systemShape strictly from JobDescription
• Do NOT assume tools, stacks, or architectures unless stated

Proceed now.
`;

    const userPrompt = `
INPUTS:

JobDescription:
${input.jobDescription}

CompanyTaskConfig:
${input.companyTaskConfig ? JSON.stringify(input.companyTaskConfig) : "null"}

CandidateContext:
${JSON.stringify(input.candidateContext)}

ProjectState:
${JSON.stringify(input.projectState)}

--------------------------------

PHASE TO GENERATE:
${input.projectState.phase}

PHASE THEME:
${getPhaseTheme(input.projectState.phase)}

--------------------------------

INSTRUCTIONS:
Generate the task for THIS phase only.
Carry forward all prior constraints.
Reference prior decisions if any exist.
Do NOT invent domain details.
`;

    const rawResponse = await generate(userPrompt, {
        system: systemPrompt,
        json: true,
        temperature: 0.1
    });

    // Clean potential markdown fencing from local LLM
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const parsed = JSON.parse(cleanJson);
        // Validate against strict schema
        const validated = TaskGenerationSchema.parse(parsed);
        return JSON.stringify(validated);
    } catch (error) {
        throw new Error(`LLM Output Validation Failed: ${error}`);
    }
}

function getPhaseTheme(phase: number): string {
    const themes = [
        "Phase 1 — Ideal: Design the core solution with no constraints",
        "Phase 2 — Budget: Introduce a 70% cost/resource reduction",
        "Phase 3 — Scale: Introduce 100x traffic or usage growth",
        "Phase 4 — Legacy: Force integration with a poorly-designed legacy system",
        "Phase 5 — Failure: Introduce failure of a critical dependency",
        "Phase 6 — Pivot: Change the business goal or priority",
        "Phase 7 — Audit: Require defense of all prior decisions"
    ];
    return themes[phase - 1] || "Continue the evolution.";
}
