
export type Observation = {
    type: 'structural' | 'pattern' | 'behavioral';
    signal: string;
    confidence: number;
    evidence: string; // Quote or File Ref
};

export type InterpretationContext = {
    skills?: string[];           // Required skills from job
    topLanguages?: string[];     // Real languages from GitHub repos
    recentCommits?: number;      // Activity level
};

// "LLM-Light" - interpreted by Gemini 1.5 Flash in production.
// Here we simulate the extraction of signals from the summary.
export async function interpretSummaries(
    summaries: any[],
    jobContext?: InterpretationContext
): Promise<Observation[]> {
    const observations: Observation[] = [];

    // 0. REAL DATA: Use topLanguages from GitHub (100% real, no inference)
    if (jobContext?.topLanguages && jobContext.topLanguages.length > 0) {
        console.log(`[Interpret] Real languages from GitHub: ${jobContext.topLanguages.join(', ')}`);

        for (const lang of jobContext.topLanguages) {
            // Check if this language is relevant to job requirements
            const isRelevant = !jobContext.skills ||
                jobContext.skills.some(skill =>
                    lang.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(lang.toLowerCase())
                );

            // Confidence based on whether it matches job requirements
            const confidence = isRelevant ? 0.85 : 0.5;

            observations.push({
                type: 'behavioral',
                signal: `Language: ${lang}`,
                confidence: confidence,
                evidence: `GitHub profile shows activity in ${lang} repositories`
            });
        }
    }

    // Prompt Context (Simulation):
    // "Analyze these commit summaries. Extract observable patterns only. Do not judge skill."

    for (const summary of summaries) {
        const msg = summary.message.toLowerCase();

        // 1. Skill Matching (from Job Requirements)
        // Check Commit Messages
        if (jobContext?.skills) {
            jobContext.skills.forEach(skill => {
                const s = skill.toLowerCase();
                if (msg.includes(s)) {
                    observations.push({
                        type: 'behavioral',
                        signal: `Skill Match: ${skill}`,
                        confidence: 0.85,
                        evidence: `Commit mentions ${skill}: "${summary.message}"`
                    });
                }
            });
        }

        // 1b. Skill Inference from File Extensions (Robustness for generic messages)
        // If we have access to changed files, we can infer skills even if the commit message is "update code"
        if (summary.significantFiles && summary.significantFiles.length > 0) {
            const extMap: Record<string, string> = {
                'ts': 'TypeScript', 'tsx': 'React/TypeScript',
                'js': 'JavaScript', 'jsx': 'React/JavaScript',
                'py': 'Python', 'rs': 'Rust', 'go': 'Go',
                'java': 'Java', 'cpp': 'C++', 'c': 'C',
                'html': 'HTML', 'css': 'CSS', 'scss': 'Sass',
                'sql': 'SQL', 'prisma': 'Prisma'
            };

            summary.significantFiles.forEach((file: string) => {
                const ext = file.split('.').pop()?.toLowerCase();
                if (ext && extMap[ext]) {
                    const detectedSkill = extMap[ext];

                    // Only add if relevant to job (or if we want to show generic skills)
                    // For now, let's just emit it as a signal, the Belief Engine can filter if needed.
                    // But to avoid noise, check if it overlaps with job reqs if provided.
                    const isRelevant = !jobContext?.skills || jobContext.skills.some(s => detectedSkill.toLowerCase().includes(s.toLowerCase()));

                    if (isRelevant) {
                        observations.push({
                            type: 'structural',
                            signal: `Skill Usage: ${detectedSkill}`,
                            confidence: 0.6, // Lower confidence than explicit mention
                            evidence: `Modified ${detectedSkill} file: ${file}`
                        });
                    }
                }
            });
        }

        // 2. Semantic Task Matching (Advanced Heuristics)

        // Task: API Optimization / Performance
        if (
            (msg.includes('optimiz') && (msg.includes('api') || msg.includes('query') || msg.includes('db'))) ||
            msg.includes('performance') ||
            msg.includes('latency') ||
            (msg.includes('cache') && msg.includes('redis'))
        ) {
            observations.push({
                type: 'behavioral',
                signal: 'API Optimization',
                confidence: 0.9,
                evidence: `Optimization task detected: "${summary.message}"`
            });
        }

        // Task: System Architecture / Refactoring
        if (msg.includes('refactor') || msg.includes('cleanup') || msg.includes('architect') || msg.includes('structure')) {
            observations.push({
                type: 'behavioral',
                signal: 'Refactoring Tendency',
                confidence: 0.8,
                evidence: `Refactoring detected: "${summary.message}"`
            });
        }

        // Task: Bug Fixing
        if (msg.includes('fix') || msg.includes('bug') || msg.includes('resolve') || msg.includes('hotfix')) {
            observations.push({
                type: 'behavioral',
                signal: 'Bug Fixing',
                confidence: 0.7,
                evidence: `Bug fix detected: "${summary.message}"`
            });
        }

        // Task: Testing
        if ((msg.includes('add') || msg.includes('update')) && (msg.includes('test') || msg.includes('spec') || msg.includes('e2e'))) {
            observations.push({
                type: 'structural',
                signal: 'Testing Discipline',
                confidence: 0.9,
                evidence: `Testing detected: "${summary.message}"`
            });
        }

        // Structural depth analysis
        if (summary.stats && summary.stats.logicScore > 5) {
            observations.push({
                type: 'structural',
                signal: 'High Logic Density',
                confidence: 0.6,
                evidence: `File Change Density: ${summary.stats.logicScore}`
            });
        }
    }

    return observations;
}
