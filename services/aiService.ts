
import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, AIConfig, OperationalMode, SmartTooltipData } from "../types";
import { APP_CONFIG } from "./config";

/**
 * Robust JSON extraction from LLM outputs that might contain markdown or thoughts.
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
 * Truncates text to prevent context window overflow.
 */
function truncateInput(text: string, maxInputTokens: number = 3000): string {
  const charLimit = maxInputTokens * 3.5;
  if (text.length <= charLimit) return text;
  return "..." + text.slice(-Math.floor(charLimit));
}

const getAiClient = (config: AIConfig) => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export async function performNeuralProbe(
  config: AIConfig,
  panelName: string,
  metrics: any,
  context: { sessionId: string; mode: OperationalMode }
) {
  const systemInstruction = `You are the Neural Intelligence Core for the PiSentinel Kali SOC.
Analyze metrics and return a high-fidelity JSON diagnostic report.
Be tactically relevant. Respond with ONLY valid JSON.

Schema:
{
  "description": "Deep technical analysis.",
  "recommendation": "Primary tactical action.",
  "status": "REAL" | "SIMULATED" | "OFFLINE",
  "elementType": "Component category",
  "elementId": "ID",
  "anomalies": ["Detection 1", "Detection 2"],
  "threatLevel": "LOW" | "ELEVATED" | "CRITICAL"
}`;

  const userPrompt = truncateInput(`[PROBE] PANEL: ${panelName} | MODE: ${context.mode} | DATA: ${JSON.stringify(metrics)} [/PROBE]`);

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
      console.error("Gemini Probe Error:", e);
      return fallbackProbe(panelName, context.mode);
    }
  } else if (config.provider === AIProvider.LOCAL) {
    try {
      const endpoint = `${config.endpoint.replace(/\/$/, "")}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) throw new Error(`LOCAL_NODE_HTTP_${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      return extractJsonLoose(content);
    } catch (e: any) {
      console.error("Local Neural link failed:", e.message);
      return fallbackProbe(panelName, context.mode);
    }
  }
  return fallbackProbe(panelName, context.mode);
}

export async function fetchSmartTooltip(
  config: AIConfig,
  elementData: any,
  context: { sessionId: string; mode: OperationalMode }
): Promise<SmartTooltipData> {
  const systemInstruction = `Analyze component metrics for a SOC console. Return ONLY JSON.
Schema: { "description": "String", "recommendation": "String", "status": "REAL"|"SIMULATED", "elementType": "String", "elementId": "String" }`;

  const userPrompt = truncateInput(`ID: ${elementData.elementId} | MODE: ${context.mode} | DATA: ${JSON.stringify(elementData)}`);

  if (config.provider === AIProvider.GEMINI) {
    const ai = getAiClient(config);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: systemInstruction + "\n\n" + userPrompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return fallbackTooltip(elementData, context.mode);
    }
  } else {
    // Local tooltip fallback
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      const data = await response.json();
      return extractJsonLoose(data.choices[0].message.content);
    } catch (e) {
      return fallbackTooltip(elementData, context.mode);
    }
  }
}

function fallbackProbe(panel: string, mode: string) {
  return { 
    description: "Neural link restricted. Ensure target endpoint is reachable and API key is valid.", 
    recommendation: "Switch to LOCAL_NODE or validate Gemini credentials.", 
    status: mode as any, 
    elementType: panel, 
    elementId: "LINK_FAIL", 
    anomalies: ["CONNECTION_REFUSED"], 
    threatLevel: "ELEVATED" 
  };
}

function fallbackTooltip(data: any, mode: string): SmartTooltipData {
  return {
    description: "Manual assessment required. AI telemetry link is currently buffering.",
    recommendation: "Check connection status in Neural Core.",
    status: mode as any,
    elementType: data.elementType || "System",
    elementId: data.elementId || "CORE"
  };
}
