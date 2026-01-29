import prisma from "@/lib/prisma";
import { complete } from "@/lib/gemini";

export class JobDecompositionService {

    /**
     * Main Orchestrator: Triggers the full decomposition pipeline for a job.
     */
    static async decompose(jobId: string) {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) throw new Error("Job not found");

        console.log(`[Decomposition] Starting for Job ${jobId}`);

        // Step 1: Extract Outcomes
        const outcomes = await this.step1_ExtractOutcomes(job);

        // Step 2: Generate Tasks for each Outcome
        await this.step2_GenerateTasks(job.id, outcomes);

        // Step 3: Global Signals
        await this.step3_CalculateSignalProfile(job.id);

        return { status: "completed", jobId };
    }

    /**
     * Step 1: Extract 3-5 Core Business Outcomes
     */
    private static async step1_ExtractOutcomes(job: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.log(`[Decomposition] Step 1: Extracting Outcomes...`);

        const requirements = job.rawRequirements || {};
        const explicitSkills = Array.isArray(requirements.skills) ? requirements.skills.join(", ") : "";

        // Construct Prompt
        const prompt = `Analyze this job and extract 3-5 core business outcomes.
    
    Job Title: ${job.title}
    Description: ${job.description}
    Requirements: ${JSON.stringify(requirements)}
    ${explicitSkills ? `Explicit Skills Required: ${explicitSkills}` : ""}

    Instructions:
    1. If Explicit Skills are provided, YOU MUST ensure the outcomes directly assess these technical or soft skills.
    2. If no skills are provided, infer them from the description.
    3. Outcomes should be actionable business goals, not just "knows React".

    Return a JSON object with this structure:
    {
      "outcomes": [
        {
          "description": "Primary objective of the outcome",
          "success_metrics": ["metric1", "metric2"],
          "failure_conditions": ["condition1"],
          "priority_level": 1 (1=High, 5=Low)
        }
      ]
    }
    
    ONLY RETURN JSON. NO MARKDOWN.`;

        const response = await complete(prompt, {
            system: "You are an expert HR strategist specializing in outcome-based hiring.",
            temperature: 0,
            json: true
        });

        const parsed = JSON.parse(response); // Basic parsing, ideally validation via Zod
        const createdOutcomes = [];

        // Save to DB
        for (const out of parsed.outcomes) {
            const outcome = await prisma.jobOutcome.create({
                data: {
                    jobId: job.id,
                    description: out.description,
                    successMetrics: out.success_metrics,
                    failureConditions: out.failure_conditions,
                    priorityLevel: out.priority_level || 1
                }
            });
            createdOutcomes.push(outcome);
        }

        return createdOutcomes;
    }

    /**
     * Step 2: Generate 5 Progressive Tasks per Outcome
     */
    private static async step2_GenerateTasks(jobId: string, outcomes: any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.log(`[Decomposition] Step 2: Generating Tasks...`);

        // Re-fetch job to get skills context again if needed, or pass it down. 
        // For simplicity, we trust the outcomes are already skill-aligned from Step 1.

        for (const outcome of outcomes) {
            const prompt = `For the following outcome, generate 5 progressive tasks.
      
      Outcome: ${outcome.description}
      
      Tasks must:
      1. Start broad, increase constraints.
      2. Inject scope boundaries.
      3. Force decision-making under ambiguity.
      4. If the outcome implies specific technical skills, the tasks should require demonstrating them.
      
      Return JSON:
      {
        "tasks": [
          {
            "description": "Task description",
            "task_type": "DIAGNOSTIC" | "PROBING" | "PRODUCTION_LIKE",
            "expected_artifacts": ["artifact1"],
            "evaluation_criteria": ["criteria1"],
            "difficulty_level": 1-5,
            "estimated_time_hours": 0.5
          }
        ]
      }
      
      ONLY RETURN JSON.`;

            const response = await complete(prompt, { temperature: 0.2, json: true });
            const parsed = JSON.parse(response);

            for (const t of parsed.tasks) {
                await prisma.jobTask.create({
                    data: {
                        jobId: jobId,
                        outcomeId: outcome.id,
                        description: t.description,
                        taskType: t.task_type || "DIAGNOSTIC",
                        expectedArtifacts: t.expected_artifacts,
                        evaluationCriteria: t.evaluation_criteria,
                        difficultyLevel: t.difficulty_level || 1,
                        estimatedTime: t.estimated_time_hours
                    }
                });
            }
        }
    }

    /**
     * Step 3: Calculate Global Signal Profile
     */
    private static async step3_CalculateSignalProfile(jobId: string) {
        console.log(`[Decomposition] Step 3: Calculating Signal Profile...`);

        // Fetch all context
        const tasks = await prisma.jobTask.findMany({ where: { jobId } });
        const outcomes = await prisma.jobOutcome.findMany({ where: { jobId } });

        const prompt = `Based on these outcomes and tasks, calculate signal importance weights (0-1) summing to 1.0.
    
    Outcomes: ${JSON.stringify(outcomes.map(o => o.description))}
    Tasks Sample: ${JSON.stringify(tasks.slice(0, 5).map(t => t.description))}

    Signals: 
    1. Scope Control
    2. Ambiguity Handling
    3. Decision Quality
    4. Stability
    5. Learning Rate
    
    Return JSON:
    {
      "scope_control": 0.2,
      "ambiguity_handling": 0.2,
      "decision_quality": 0.2,
      "stability": 0.2,
      "learning_rate": 0.2
    }
    
    ONLY RETURN JSON.`;

        const response = await complete(prompt, { temperature: 0, json: true });
        const parsed = JSON.parse(response);

        await prisma.signalProfile.create({
            data: {
                jobId: jobId,
                scopeControlWeight: parsed.scope_control || 0.2,
                ambiguityHandlingWeight: parsed.ambiguity_handling || 0.2,
                decisionQualityWeight: parsed.decision_quality || 0.2,
                stabilityWeight: parsed.stability || 0.2,
                learningRateWeight: parsed.learning_rate || 0.2
            }
        });
    }
}
