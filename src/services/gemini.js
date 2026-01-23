import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
} else {
    console.error("VITE_GEMINI_API_KEY is not set in .env");
}

export const generateResponse = async (prompt) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                maxOutputTokens: 8192,
            }
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`Failed to generate content. API Error: ${error.message}`);
    }
};
