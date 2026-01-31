
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // The SDK doesn't have a direct listModels, we have to use the REST API or just guess
    // Actually, let's just try to generate something with a few different names
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('hi');
            console.log(`✅ Model ${modelName} works!`);
            return modelName;
        } catch (e: any) {
            console.log(`❌ Model ${modelName} failed: ${e.message}`);
        }
    }
}

listModels();
