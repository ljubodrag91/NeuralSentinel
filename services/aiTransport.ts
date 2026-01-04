
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

/**
 * Utility to extract and parse JSON from AI responses that might be wrapped in markdown 
 * or contain trailing commas/comments.
 */
function cleanAndParseJson(text: string): any {
  if (!text) throw new Error("EMPTY_RESPONSE_BODY");

  // 1. Remove thinking tags or other XML-like tags often returned by models
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/g, "");
  
  // 2. Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s?|```/g, "").trim();
  
  // 3. Find the first '{' and last '}' to extract the JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error("No valid JSON object found in response.");
  }
  
  const jsonString = cleaned.substring(start, end + 1);
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    try {
      const fixTrailingCommas = jsonString.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(fixTrailingCommas);
    } catch (innerError) {
      throw new Error(`JSON_PARSE_FAILED: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
}

export const aiTransport = {
  async fetch(
    config: AIConfig, 
    systemInstruction: string, 
    prompt: string, 
    isDataProbe: boolean,
    tokenLimit: number = 2000
  ): Promise<TransportResponse> {
    
    let effectivePrompt = (typeof prompt === 'string') ? prompt : JSON.stringify(prompt);
    if (effectivePrompt.length > tokenLimit) {
        effectivePrompt = effectivePrompt.substring(0, tokenLimit) + "... [PROMPT_TRUNCATED_BY_LAUNCHER_LIMIT]";
    }

    const thinkingBudget = isDataProbe && tokenLimit >= 3000 ? 1024 : 0;
    const responseCapacity = Math.max(512, Math.min(2048, Math.floor(tokenLimit / 2)));
    const totalOutputTokens = responseCapacity + thinkingBudget;

    // MANDATORY RESPONSE SCHEMA INSTRUCTION
    const mandatoryFormatInstruction = `
    ABSOLUTE RULE: Respond with a single valid JSON object following the Neural Sentinel Response Schema.
    No prose outside JSON. No markdown. No explanations.
    
    SCHEMA:
    {
      "responseType": "PROBE_RESPONSE",
      "auditType": "STANDARD | HISTORICAL | NEURAL | FULL_NEURAL_AUDIT",
      "status": "SUCCESS | PARTIAL | WARNING | ERROR",
      "probeUsed": {
        "probeType": "STANDARD_DATA | HISTORICAL_DATA | NEURAL_INFERENCE | MASTER_AGGREGATED",
        "probeId": "exact-id-if-present",
        "sourcePanel": "panel-name"
      },
      "analysis": {
        "summary": "conclusion string",
        "findings": [{"label": "...", "value": "...", "severity": "LOW|MEDIUM|HIGH"}],
        "anomalies": [{"id": "...", "type": "...", "description": "...", "confidence": 0.0}],
        "confidence": 0.0
      },
      "recommendations": [{"action": "...", "priority": "LOW|MEDIUM|HIGH"}],
      "rawEcho": { "receivedPayload": {} }
    }`;

    const combinedSystemInstruction = `${systemInstruction}\n\n${mandatoryFormatInstruction}`;

    let requestBody: any = {};

    try {
      if (config.provider === 'GEMINI') {
        const modelName = isDataProbe ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        
        requestBody = {
          model: modelName,
          contents: [{ parts: [{ text: effectivePrompt }] }],
          config: { 
            systemInstruction: combinedSystemInstruction,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: thinkingBudget },
            maxOutputTokens: totalOutputTokens,
            temperature: 0.1,
          }
        };

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent(requestBody);
        
        if (!response) throw new Error("NULL_AI_RESPONSE");
        
        const textResponse = response.text;
        if (!textResponse) throw new Error("EMPTY_AI_RESPONSE_TEXT");

        try {
          const parsed = cleanAndParseJson(textResponse);
          return { success: true, data: parsed, rawText: textResponse, requestBody };
        } catch (parseErr: any) {
          return { success: false, data: null, rawText: textResponse, requestBody, error: parseErr.message };
        }
      } else {
        const normalizedUrl = (config.endpoint || "").replace('localhost', '127.0.0.1').replace(/\/$/, "");
        const endpoint = normalizedUrl.includes('/chat/completions') ? normalizedUrl : `${normalizedUrl}/chat/completions`;
        
        requestBody = {
          model: config.model,
          messages: [
            { role: 'system', content: combinedSystemInstruction }, 
            { role: 'user', content: effectivePrompt }
          ],
          temperature: 0.1,
          max_tokens: responseCapacity
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          referrerPolicy: "no-referrer",
          mode: 'cors'
        });
        
        const data = await response.json();
        if (!data) throw new Error("EMPTY_LOCAL_AI_JSON");
        
        if (data.error) {
            return { success: false, data: null, requestBody, error: data.error.message || "Unknown Local AI Error", errorCode: data.error.code };
        }
        
        if (!Array.isArray(data.choices) || data.choices.length === 0) {
            throw new Error("LOCAL_AI_NO_CHOICES");
        }
        
        const text = data.choices[0]?.message?.content;
        if (!text) throw new Error("EMPTY_LOCAL_AI_CONTENT");

        try {
          const parsed = cleanAndParseJson(text);
          return { success: true, data: parsed, rawText: text, requestBody };
        } catch (parseErr: any) {
          return { success: false, data: null, rawText: text, requestBody, error: parseErr.message };
        }
      }
    } catch (e: any) {
      return { success: false, data: null, requestBody, error: e.message || "Neural Transport Failure", errorCode: "TRANSPORT_ERR" };
    }
  }
};
