
import { GoogleGenAI } from "@google/genai";

export async function analyzeLogs(logs: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Neural Interface for a Kali Linux Pi Sentinel monitor. Analyze the following command logs and provide a concise security assessment or next-step suggestion. Keep it professional and brief. Logs:\n${logs}`,
    });
    return response.text;
  } catch (error) {
    console.error("Neural Interface Error:", error);
    return "ANALYSIS_FAILURE: Unable to establish neural link.";
  }
}

export async function explainCommand(command: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain this Kali Linux command and its risks for a security professional: ${command}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating explanation.";
  }
}
