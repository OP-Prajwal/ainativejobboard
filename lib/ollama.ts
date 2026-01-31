export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}

export async function generate(prompt: string, options: {
    model?: string;
    temperature?: number;
    system?: string;
    json?: boolean;
} = {}): Promise<string> {
    const {
        model = 'deepseek-r1:8b',
        temperature = 0.1,
        system,
        json = false
    } = options;

    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            prompt,
            system,
            stream: false,
            options: {
                temperature,
            },
            format: json ? 'json' : undefined
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as OllamaResponse;
    return data.response;
}
