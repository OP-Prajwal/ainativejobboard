import { complete } from '@/lib/gemini';

// Types for grading
interface GradeInput {
    taskDescription: string;
    starterCode: string;
    taskInvariants: string[] | null;
    difficultyLevel: number;
    estimatedTimeHours: number;
    timeTakenSeconds: number;
    initialPrompt: string;
    aiDraft: string;
    finalSubmission: string;
    refinementExplanation: string;
    unchangedExplanation: string;
}

interface DiffSummary {
    percentRewritten: number;
    newLogicAdded: string[];
    bugsFixes: string[];
    edgeCasesHandled: string[];
    boilerplateRemoved: string[];
    structuralImprovements: string[];
}

interface GradeOutput {
    score: number;
    confidence: number;
    uncertaintyReasons: string[];
    diffSummary: DiffSummary;
    aiFeedback: string;
    strongestPositiveEvidence: string;
    strongestNegativeEvidence: string;
    whatWouldChangeTheScore: string;
}

type GradeResult = { success: true; data: GradeOutput } | { success: false; error: string };

/**
 * Grade a submission using AI with four orthogonal signals.
 * Each signal is capped at 30% weight.
 */
export async function gradeSubmission(input: GradeInput): Promise<GradeResult> {
    try {
        const prompt = buildGradingPrompt(input);

        const response = await complete(prompt, {
            system: GRADING_SYSTEM_PROMPT,
            temperature: 0.1,
            json: true
        });

        // Parse and validate JSON response
        let parsed: any;
        try {
            // Clean up response - remove markdown code blocks if present
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.slice(7);
            }
            if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.slice(3);
            }
            if (cleanResponse.endsWith('```')) {
                cleanResponse = cleanResponse.slice(0, -3);
            }
            parsed = JSON.parse(cleanResponse.trim());
        } catch {
            console.error('[gradeSubmission] Failed to parse AI response:', response);
            return { success: false, error: 'Failed to parse grading response' };
        }

        // Validate required fields
        if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
            return { success: false, error: 'Invalid score in grading response' };
        }
        if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
            return { success: false, error: 'Invalid confidence in grading response' };
        }

        // Construct validated output
        const output: GradeOutput = {
            score: Math.round(parsed.score),
            confidence: Number(parsed.confidence.toFixed(2)),
            uncertaintyReasons: Array.isArray(parsed.uncertaintyReasons) ? parsed.uncertaintyReasons : [],
            diffSummary: {
                percentRewritten: parsed.diffSummary?.percentRewritten || 0,
                newLogicAdded: parsed.diffSummary?.newLogicAdded || [],
                bugsFixes: parsed.diffSummary?.bugsFixes || [],
                edgeCasesHandled: parsed.diffSummary?.edgeCasesHandled || [],
                boilerplateRemoved: parsed.diffSummary?.boilerplateRemoved || [],
                structuralImprovements: parsed.diffSummary?.structuralImprovements || []
            },
            aiFeedback: parsed.aiFeedback || '',
            strongestPositiveEvidence: parsed.strongestPositiveEvidence || '',
            strongestNegativeEvidence: parsed.strongestNegativeEvidence || '',
            whatWouldChangeTheScore: parsed.whatWouldChangeTheScore || ''
        };

        return { success: true, data: output };

    } catch (error) {
        console.error('[gradeSubmission] Error:', error);
        return { success: false, error: 'Grading failed' };
    }
}

const GRADING_SYSTEM_PROMPT = `You are an AI assessment grader for a software engineering hiring platform.

Your job is to evaluate a candidate's submission based on FOUR ORTHOGONAL SIGNALS. No single signal may exceed 30% of the final score weight.

## CRITICAL RULES:
1. You are NOT judging whether the candidate used AI. AI usage is ALLOWED and EXPECTED.
2. You ARE judging HOW they used AI - their engineering judgment, refinement ability, and transparency.
3. A good score means: the candidate demonstrated engineering value beyond copy-paste.
4. A low score means: the candidate showed no judgment, no refinement, or inconsistent explanations.

## THE FOUR SIGNALS (MAX 30% EACH):

### 1. DIFF QUALITY (up to 30%)
Compare the AI draft to the final submission:
- What percentage was rewritten?
- Was new logic added beyond formatting?
- Were bugs fixed?
- Were edge cases handled?
- Was LLM boilerplate removed?
- Were structural improvements made?

Scoring guide:
- 0-10%: Copy-paste with no meaningful changes
- 10-20%: Minor formatting/style changes only
- 20-30%: Substantial rewrites, logic improvements, or architectural changes

### 2. VELOCITY ANALYSIS (up to 30%)
Consider: time_taken / (difficulty × estimated_hours)
- Was the submission suspiciously fast given its quality?
- Was it appropriately paced for the complexity of changes?

Scoring guide:
- Fast + Bad quality = LOW (suggests copy-paste without review)
- Slow + Excellent quality = MEDIUM (suggests careful work)
- Fast + Excellent quality = HIGH (suggests strong engineering skills with AI)

### 3. PROMPT ANALYSIS (up to 30%)
Evaluate the initial prompt:
- Were constraints specified?
- Was context complete?
- Does the prompt explain the "why" not just "what"?
- Cross-validate: Does the AI draft realistically match this prompt?

Scoring guide:
- Vague prompt producing complex output = suspicion (high uncertainty)
- Detailed prompt with matching output = positive signal
- Prompt shows iterative thinking = bonus

### 4. TRANSPARENCY & JUDGMENT (up to 25%)
Check consistency between:
- Prompt ↔ AI draft (does draft match what prompt would produce?)
- AI draft ↔ Final (are the changes explained?)
- Final ↔ Explanation (does explanation match visible changes?)
- Unchanged explanation (did they justify what they kept?)

Scoring guide:
- Inconsistencies = increase uncertainty, not automatic failure
- Clear explanations = trust signal
- Explanation mentions trade-offs = engineering maturity

## INVARIANT CHECKING:
If task invariants are provided, check if the candidate:
1. Explicitly addressed each invariant
2. Explained trade-offs if an invariant was not fully met

Missing invariants without explanation = uncertainty reason.

## OUTPUT FORMAT:
You MUST respond with valid JSON only. No markdown, no explanations outside the JSON.`;

function buildGradingPrompt(input: GradeInput): string {
    const invariantsText = input.taskInvariants?.length
        ? `\n\nTASK INVARIANTS (must be addressed):\n${input.taskInvariants.map((inv, i) => `${i + 1}. ${inv}`).join('\n')}`
        : '';

    const timeRatio = input.timeTakenSeconds / (input.estimatedTimeHours * 3600);
    const velocityContext = `
Time taken: ${Math.round(input.timeTakenSeconds / 60)} minutes
Estimated time: ${input.estimatedTimeHours} hours
Time ratio: ${timeRatio.toFixed(2)} (< 0.5 = fast, 0.5-1.5 = normal, > 1.5 = slow)
Difficulty level: ${input.difficultyLevel}/5`;

    return `Grade this assessment submission.

## TASK DESCRIPTION:
${input.taskDescription}
${invariantsText}

## STARTER CODE (if any):
${input.starterCode || '(none provided)'}

## VELOCITY CONTEXT:
${velocityContext}

## CANDIDATE'S INITIAL PROMPT TO AI:
${input.initialPrompt || '(not provided)'}

## AI DRAFT RECEIVED:
${input.aiDraft || '(not provided)'}

## FINAL SUBMISSION:
${input.finalSubmission}

## CANDIDATE'S EXPLANATION OF REFINEMENTS:
${input.refinementExplanation || '(not provided)'}

## CANDIDATE'S EXPLANATION OF WHAT THEY DID NOT CHANGE AND WHY:
${input.unchangedExplanation || '(not provided)'}

---

Respond with a JSON object containing:
{
  "score": <0-100>,
  "confidence": <0.0-1.0>,
  "uncertaintyReasons": ["reason1", "reason2", ...],
  "diffSummary": {
    "percentRewritten": <0-100>,
    "newLogicAdded": ["description1", ...],
    "bugsFixes": ["description1", ...],
    "edgeCasesHandled": ["description1", ...],
    "boilerplateRemoved": ["description1", ...],
    "structuralImprovements": ["description1", ...]
  },
  "aiFeedback": "Human-readable feedback for the candidate",
  "strongestPositiveEvidence": "The single strongest positive signal observed",
  "strongestNegativeEvidence": "The single strongest concern or negative signal",
  "whatWouldChangeTheScore": "What evidence would change this grade significantly"
}`;
}
