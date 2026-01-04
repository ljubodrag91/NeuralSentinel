
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
  // 1. Remove thinking tags or other XML-like tags often returned by models
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/g, "");
  cleaned = cleaned.replace(/<|.*?|>/g, "");
  
  // 2. Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s?|```/g, "").trim();
  
  // 3. Find the first '{' and last '}' to extract the JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    // If it's not JSON, we throw so the caller can decide what to do
    throw new Error("No valid JSON object found in response.");
  }
  
  const jsonString = cleaned.substring(start, end + 1);
  
  try {
    // Attempt standard parse first
    return JSON.parse(jsonString);
  } catch (e) {
    // If standard parse fails, try to handle trailing commas (common AI mistake)
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
    tokenLimit: number = 2000 // Launcher attribute (Characters)
  ): Promise<TransportResponse> {
    
    // STRICT INPUT ENFORCEMENT:
    // Truncate the input string to the launcher's character limit.
    let effectivePrompt = prompt;
    if (effectivePrompt.length > tokenLimit) {
        effectivePrompt = effectivePrompt.substring(0, tokenLimit) + "... [PROMPT_TRUNCATED_BY_LAUNCHER_LIMIT]";
    }

    // OUTPUT SIZING:
    // Reserve tokens for thinking if enabled. Max output must be > thinking budget.
    const thinkingBudget = isDataProbe && tokenLimit >= 3000 ? 1024 : 0;
    const responseCapacity = Math.max(512, Math.min(2048, Math.floor(tokenLimit / 2)));
    const totalOutputTokens = responseCapacity + thinkingBudget;

    let requestBody: any = {};

    try {
      if (config.provider === 'GEMINI') {
        // Complex Text Tasks (probes) use Pro; Lightweight inferences use Flash.
        const modelName = isDataProbe ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        
        requestBody = {
          model: modelName,
          contents: [{ parts: [{ text: effectivePrompt }] }],
          config: { 
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: thinkingBudget },
            maxOutputTokens: totalOutputTokens,
            temperature: 0.1,
          }
        };

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent(requestBody);
        
        const textResponse = response.text;
        if (!textResponse) {
          throw new Error("EMPTY_RESPONSE: The neural core failed to generate a text fragment.");
        }

        try {
          return { 
            success: true, 
            data: cleanAndParseJson(textResponse), 
            rawText: textResponse,
            requestBody 
          };
        } catch (parseErr: any) {
          return {
            success: false,
            data: null,
            rawText: textResponse,
            requestBody,
            error: parseErr.message
          };
        }
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
          max_tokens: responseCapacity // Local models rarely support thinking budget configs yet
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          referrerPolicy: "no-referrer",
          mode: 'cors'
        });
        
        const data = await response.json();
        if (data.error) {
            return {
                success: false,
                data: null,
                requestBody,
                error: data.error.message || "Unknown Local AI Error",
                errorCode: data.error.code
            };
        }
        
        const text = data.choices[0].message.content;
        
        try {
          return { 
            success: true, 
            data: cleanAndParseJson(text), 
            rawText: text,
            requestBody 
          };
        } catch (parseErr: any) {
          return {
            success: false,
            data: null,
            rawText: text,
            requestBody,
            error: parseErr.message
          };
        }
      }
    } catch (e: any) {
      console.error("AI Transport Error:", e);
      let errorMsg = e.message || "Neural Transport Failure";
      let errorCode = "TRANSPORT_ERR";

      // Attempt to parse structured API error from message
      if (errorMsg.includes("ApiError:")) {
          try {
              const jsonStr = errorMsg.substring(errorMsg.indexOf('{'));
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                  errorMsg = parsed.error.message;
                  errorCode = parsed.error.code;
              }
          } catch (pe) {
              // Fallback to raw message
          }
      }

      return { 
        success: false, 
        data: null, 
        requestBody, 
        error: errorMsg,
        errorCode
      };
    }
  }
};
