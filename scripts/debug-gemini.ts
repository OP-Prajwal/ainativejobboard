
import dotenv from 'dotenv';
dotenv.config();

async function debugGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('❌ GEMINI_API_KEY is NOT set');
        return;
    }
    console.log(`✅ GEMINI_API_KEY is set (starts with ${apiKey.substring(0, 5)}...)`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const resp = await fetch(url);
        const data = await resp.json() as any;
        if (data.models) {
            console.log('✅ Successfully listed models:');
            data.models.forEach((m: any) => console.log(` - ${m.name}`));
        } else {
            console.log('❌ Failed to list models:', JSON.stringify(data));
        }
    } catch (e: any) {
        console.log('❌ Error listing models:', e.message);
    }
}

debugGemini();
