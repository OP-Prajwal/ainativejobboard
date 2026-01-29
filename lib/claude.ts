import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic Client
// Requires ANTHROPIC_API_KEY in .env
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeCompletionOptions {
    system?: string;
    temperature?: number;
    max_tokens?: number;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

/**
 * Robust wrapper for Anthropic's Messages API with exponential backoff retry logic.
 */
export async function complete(prompt: string, options: ClaudeCompletionOptions = {}) {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: options.max_tokens || 4096,
                temperature: options.temperature || 0,
                system: options.system,
                messages: [
                    { role: "user", content: prompt },
                ],
            });

            // Safely access the text content (handling potential block types)
            const content = msg.content[0];
            if (content.type === 'text') {
                return content.text;
            }
            return "";

        } catch (error: any) {
            attempt++;
            console.error(`Claude API Error (Attempt ${attempt}/${MAX_RETRIES}):`, error.message);

            if (attempt >= MAX_RETRIES) {
                throw new Error(`Claude API Failed after ${MAX_RETRIES} attempts: ${error.message}`);
            }

            // Exponential Backoff
            const delay = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new Error("Claude API Unreachable");
}
