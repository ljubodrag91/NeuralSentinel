
import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, AIConfig, OperationalMode, SmartTooltipData } from "../types";
import { APP_CONFIG } from "./config";

/**
 * Robust JSON extraction from LLM outputs that might contain markdown, thought tags, or other wrappers.
 */
function extractJsonLoose(text: string): any {
  const cleaned = text
    .replace(/```json|```/g, "")
    .replace(/<\|.*?\|>/g, "")
    .replace(/<thought>[\s\S]*?<\/thought>/g, "")
    .trim();
  
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON_NOT_FOUND_IN_OUTPUT");
  return JSON.parse(match[0]);
}

/**
 * Truncates text to a safe character limit to avoid exceeding model context windows.
 */
function truncateInput(text: string, maxInputTokens: number = 3000): string {
  const charLimit = maxInputTokens * 3.5;
  if (text.length <= charLimit) return text;
  return "..." + text.slice(-Math.floor(charLimit));
}

const getAiClient = (config: AIConfig) => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

/**
 * Validates the availability of the configured AI provider.
 */
export async function testAiAvailability(config: AIConfig): Promise<boolean> {
  if (config.provider === AIProvider.GEMINI) {
    return !!process.env.API_KEY;
  }
  
  try {
    // Standardize endpoint - ensure it has the correct completions suffix if not provided
    const endpoint = config.endpoint.includes('/chat/completions') 
      ? config.endpoint 
      : `${config.endpoint.replace(/\/$/, "")}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(4000)
    });
    return response.ok;
  } catch (e) {
    console.debug("Local node probe failed:", e);
    return false;
  }
}

export async function performNeuralProbe(
  config: AIConfig,
  panelName: string,
  metrics: any,
  context: { sessionId: string; mode: OperationalMode }
) {
  const systemInstruction = `You are the Neural Intelligence Core for the PiSentinel Kali SOC.
Analyze the provided metrics and return a high-fidelity diagnostic report.
STRICT RULE: Respond with ONLY a valid JSON object.

Schema:
{
  "description": "Deep technical analysis of the telemetry.",
  "recommendation": "Primary tactical action suggested.",
  "status": "${context.mode}",
  "elementType": "${panelName}",
  "elementId": "PROBE_${context.sessionId}",
  "anomalies": ["Detection A", "Detection B"],
  "threatLevel": "LOW" | "ELEVATED" | "CRITICAL"
}`;

  const userPrompt = truncateInput(`[PROBE_REQUEST] PANEL: ${panelName} | TELEMETRY: ${JSON.stringify(metrics)} [/PROBE_REQUEST]`);

  if (config.provider === AIProvider.GEMINI) {
    const ai = getAiClient(config);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: systemInstruction + "\n\n" + userPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              status: { type: Type.STRING },
              elementType: { type: Type.STRING },
              elementId: { type: Type.STRING },
              anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
              threatLevel: { type: Type.STRING }
            },
            required: ["description", "recommendation", "status", "elementType", "elementId", "anomalies", "threatLevel"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return fallbackProbe(panelName, context.mode);
    }
  } else {
    try {
      const endpoint = config.endpoint.includes('/chat/completions') ? config.endpoint : `${config.endpoint.replace(/\/$/, "")}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 1024
        })
      });
      if (!response.ok) throw new Error("LOCAL_LINK_OFFLINE");
      const data = await response.json();
      return extractJsonLoose(data.choices[0].message.content);
    } catch (e) {
      return fallbackProbe(panelName, context.mode);
    }
  }
}

export async function fetchSmartTooltip(
  config: AIConfig,
  elementData: any,
  context: { sessionId: string; mode: OperationalMode }
): Promise<SmartTooltipData> {
  const systemInstruction = `You are a Raspberry Pi cyber dashboard smart tooltip engine.
STRICT RULES:
- Respond ONLY with a valid JSON object
- No markdown, no explanations, no chat tokens

Schema:
{
  "description": string,
  "recommendation": string,
  "status": "REAL" | "SIMULATED" | "OFFLINE",
  "elementType": string,
  "elementId": string
}`;

  const userPrompt = JSON.stringify({
    elementType: elementData.elementType,
    elementId: elementData.elementId,
    status: context.mode,
    metrics: elementData.metrics,
    context: "Dashboard - System Overview"
  });

  try {
    if (config.provider === AIProvider.GEMINI) {
      const ai = getAiClient(config);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: systemInstruction + "\n\n" + userPrompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } else {
      const endpoint = config.endpoint.includes('/chat/completions') ? config.endpoint : `${config.endpoint.replace(/\/$/, "")}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      });
      if (!response.ok) throw new Error("LOCAL_LINK_OFFLINE");
      const data = await response.json();
      return extractJsonLoose(data.choices[0].message.content);
    }
  } catch {
    return fallbackTooltip(elementData, context.mode);
  }
}

function fallbackProbe(panel: string, mode: string) {
  return { 
    description: "Manual assessment required. Local link offline.", 
    recommendation: "Ensure Local LLM server (LM Studio/Ollama) is responsive and configured correctly.", 
    status: mode as any, 
    elementType: panel, 
    elementId: "LINK_VOID", 
    anomalies: ["AI_NODE_DISCONNECTED"], 
    threatLevel: "ELEVATED" 
  };
}

function fallbackTooltip(data: any, mode: string): SmartTooltipData {
  return {
    description: "Manual assessment required. AI telemetry link is currently buffering.",
    recommendation: "Check connection status in Neural Core and Global Settings.",
    status: mode as any,
    elementType: data.elementType || "System",
    elementId: data.elementId || "CORE"
  };
}
