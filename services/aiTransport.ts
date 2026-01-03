
import { GoogleGenAI } from "@google/genai";
import { NeuralNetworkConfig as AIConfig } from "../types";

export interface TransportResponse {
  success: boolean;
  data: any;
  requestBody: any; 
  error?: string;
}

export const aiTransport = {
  async fetch(
    config: AIConfig, 
    systemInstruction: string, 
    prompt: string, 
    isDataProbe: boolean,
    tokenLimit: number = 2000 // Launcher attribute (Characters)
  ): Promise<TransportResponse> {
    
    // STRICT INPUT ENFORCEMENT:
    // Truncate the input string to the launcher's character limit.
    // This prevents "token limit exceeded" errors on local models and context overflow on cloud.
    let effectivePrompt = prompt;
    if (effectivePrompt.length > tokenLimit) {
        effectivePrompt = effectivePrompt.substring(0, tokenLimit) + "... [PROMPT_TRUNCATED_BY_LAUNCHER_LIMIT]";
    }

    // OUTPUT SIZING:
    // Derive output token limit from the launcher's input character limit.
    // Heuristic: 1 token ~= 4 chars. We allow output to be ~25% of input capacity, 
    // clamped between 256 (min for JSON) and 2048 (max for detailed report).
    const derivedOutputTokens = Math.max(256, Math.min(2048, Math.floor(tokenLimit / 4)));

    let requestBody: any = {};

    try {
      if (config.provider === 'GEMINI') {
        const modelName = 'gemini-3-flash-preview';
        
        requestBody = {
          model: modelName,
          contents: [{ parts: [{ text: effectivePrompt }] }],
          config: { 
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            // Thinking budget only for complex probes if capacity allows
            thinkingConfig: { thinkingBudget: isDataProbe && tokenLimit > 2000 ? 1024 : 0 },
            maxOutputTokens: derivedOutputTokens,
            temperature: 0.1,
          }
        };

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent(requestBody);
        
        if (!response.text) {
          throw new Error("EMPTY_RESPONSE: The neural core failed to generate a text fragment.");
        }

        return { 
          success: true, 
          data: JSON.parse(response.text), 
          requestBody 
        };
      } else {
        const normalizedUrl = config.endpoint.replace('localhost', '127.0.0.1').replace(/\/$/, "");
        const endpoint = normalizedUrl.includes('/chat/completions') ? normalizedUrl : `${normalizedUrl}/chat/completions`;
        
        requestBody = {
          model: config.model,
          messages: [
            { role: 'system', content: systemInstruction }, 
            { role: 'user', content: effectivePrompt }
          ],
          temperature: 0.1,
          max_tokens: derivedOutputTokens
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          referrerPolicy: "no-referrer",
          mode: 'cors'
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || "Unknown Local AI Error");
        
        const text = data.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("JSON_PARSE_FAILED: Output did not contain valid JSON.");

        return { 
          success: true, 
          data: JSON.parse(jsonMatch[0]), 
          requestBody 
        };
      }
    } catch (e: any) {
      console.error("AI Transport Error:", e);
      return { 
        success: false, 
        data: null, 
        requestBody, 
        error: e.message || "Neural Transport Failure" 
      };
    }
  }
};
