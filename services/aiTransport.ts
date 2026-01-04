
import { GoogleGenAI } from "@google/genai";
import { NeuralNetworkConfig as AIConfig } from "../types";

export interface TransportResponse {
  success: boolean;
  data: any;
  requestBody: any; 
  rawText?: string;
  error?: string;
  errorCode?: number | string;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function cleanAndParseJson(text: string): any {
  if (!text) throw new Error("EMPTY_RESPONSE_BODY");
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/g, "");
  cleaned = cleaned.replace(/```json\s?|```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error("No valid JSON object found.");
  const jsonString = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    const fixed = jsonString.replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(fixed);
  }
}

export const aiTransport = {
  async fetch(
    config: AIConfig, 
    systemInstruction: string, 
    prompt: string, 
    isDataProbe: boolean,
    tokenLimit: number = 2000,
    attempt: number = 0
  ): Promise<TransportResponse> {
    
    let effectivePrompt = (typeof prompt === 'string') ? prompt : JSON.stringify(prompt);
    if (effectivePrompt.length > tokenLimit) {
        effectivePrompt = effectivePrompt.substring(0, tokenLimit) + "... [AUTO_PRUNED]";
    }

    const thinkingBudget = isDataProbe && tokenLimit >= 3000 ? 1024 : 0;
    const responseCapacity = Math.max(512, Math.min(2048, Math.floor(tokenLimit / 2)));
    const totalOutputTokens = responseCapacity + thinkingBudget;

    const mandatoryFormatInstruction = `
    ABSOLUTE RULE: Respond with a single valid JSON object. No prose.
    SCHEMA: { "responseType": "PROBE_RESPONSE", "status": "SUCCESS", "analysis": { "summary": "...", "confidence": 0.0 }, "recommendations": [] }`;

    const combinedSystemInstruction = `${systemInstruction}\n\n${mandatoryFormatInstruction}`;

    try {
      if (config.provider === 'GEMINI') {
        const modelName = isDataProbe ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: effectivePrompt }] }],
          config: { 
            systemInstruction: combinedSystemInstruction,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: thinkingBudget },
            maxOutputTokens: totalOutputTokens,
            temperature: 0.1,
          }
        });
        
        const parsed = cleanAndParseJson(response.text || "");
        return { success: true, data: parsed, requestBody: {} };
      } else {
        // Local AI Fetch Logic with similar retry capability
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: config.model, messages: [{role:'system', content: combinedSystemInstruction}, {role:'user', content: effectivePrompt}] }),
        });
        const data = await response.json();
        const parsed = cleanAndParseJson(data.choices[0].message.content);
        return { success: true, data: parsed, requestBody: {} };
      }
    } catch (e: any) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        return this.fetch(config, systemInstruction, prompt, isDataProbe, tokenLimit, attempt + 1);
      }
      return { success: false, data: null, requestBody: {}, error: e.message, errorCode: "TERMINAL_TRANSPORT_FAULT" };
    }
  }
};
