import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini Client
// Requires GEMINI_API_KEY in .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AICompletionOptions {
    system?: string;
    temperature?: number;
    max_tokens?: number;
    json?: boolean; // Hint for JSON mode if supported
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

/**
 * Robust wrapper for Gemini API (Pro/Flash) with exponential backoff retry logic.
 * Uses 'gemini-1.5-flash' by default for speed and free tier.
 */
export async function complete(prompt: string, options: AICompletionOptions = {}) {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            // Configure model
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                ...(options.system ? { systemInstruction: options.system } : {}),
                generationConfig: {
                    temperature: options.temperature ?? 0.1,
                    maxOutputTokens: options.max_tokens,
                    responseMimeType: options.json ? "application/json" : "text/plain",
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error: any) {
            attempt++;
            console.error(`Gemini API Error (Attempt ${attempt}/${MAX_RETRIES}):`, error.message);

            if (attempt >= MAX_RETRIES) {
                throw new Error(`Gemini API Failed after ${MAX_RETRIES} attempts: ${error.message}`);
            }

            // Exponential Backoff
            const delay = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new Error("Gemini API Unreachable");
}
