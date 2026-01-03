
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
    isDataProbe: boolean
  ): Promise<TransportResponse> {
    const maxTokens = isDataProbe ? 2000 : 800;
    let requestBody: any = {};

    try {
      if (config.provider === 'GEMINI') {
        const modelName = 'gemini-3-flash-preview';
        
        // Ensure prompt is cleanly combined with system instruction if not using native systemInstruction parameter
        // But the SDK supports a config.systemInstruction.
        requestBody = {
          model: modelName,
          contents: [{ parts: [{ text: prompt }] }],
          config: { 
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            // We set a moderate thinking budget for data probes to ensure they return a result
            thinkingConfig: { thinkingBudget: isDataProbe ? 1024 : 0 },
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
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: maxTokens
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          referrerPolicy: "no-referrer",
          mode: 'cors'
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        const text = data.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return { 
          success: true, 
          data: JSON.parse(jsonMatch ? jsonMatch[0] : "{}"), 
          requestBody 
        };
      }
    } catch (e: any) {
      console.error("AI Transport Error:", e);
      return { success: false, data: null, requestBody, error: e.message };
    }
  }
};
