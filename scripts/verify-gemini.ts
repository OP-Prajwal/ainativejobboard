import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Successfully imported GoogleGenerativeAI");
try {
    const genAI = new GoogleGenerativeAI("test-key");
    console.log("Successfully instantiated client");
} catch (e) {
    console.error(e);
}
