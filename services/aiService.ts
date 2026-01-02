import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, AIConfig, OperationalMode, SmartTooltipData } from "../types";
import { APP_CONFIG } from "./config";

/**
 * Robust instantiation of the GoogleGenAI client.
 * Always uses process.env.API_KEY as the exclusive source for authentication.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function performNeuralProbe(
  config: AIConfig,
  panelName: string,
  metrics: any,
  context: { sessionId: string; mode: OperationalMode }
) {
  const systemInstruction = `You are the Neural Intelligence Core for the PiSentinel Kali SOC.
Analyze metrics and return a high-fidelity JSON diagnostic report.
Be tactically relevant.

Return exactly this JSON structure:
{
  "description": "Deep technical analysis.",
  "recommendation": "Primary tactical action.",
  "status": "REAL" | "SIMULATED" | "OFFLINE",
  "elementType": "Component category",
  "elementId": "ID",
  "anomalies": ["Detection 1", "Detection 2"],
  "threatLevel": "LOW" | "ELEVATED" | "CRITICAL"
}`;

  const userPrompt = `[PROBE] PANEL: ${panelName} | MODE: ${context.mode} | DATA: ${JSON.stringify(metrics)} [/PROBE]`;

  if (config.provider === AIProvider.GEMINI) {
    const ai = getAiClient();
    try {
      // Use gemini-3-pro-preview for complex diagnostic reasoning tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userPrompt,
        config: {
          systemInstruction,
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
      console.error("Neural Probe Error:", e);
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

  const userPrompt = `ID: ${elementData.elementId} | MODE: ${context.mode} | DATA: ${JSON.stringify(elementData)}`;

  if (config.provider === AIProvider.GEMINI) {
    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
        model: config.model || APP_CONFIG.DEFAULT_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return fallbackTooltip(elementData, context.mode);
    }
  }
  return fallbackTooltip(elementData, context.mode);
}

function fallbackProbe(panel: string, mode: string) {
  return { 
    description: "Neural link restricted. Check API_KEY availability in local environment.", 
    recommendation: "Ensure .env mappings are correct.", 
    status: mode as any, 
    elementType: panel, 
    elementId: "LINK_FAIL", 
    anomalies: ["CORE_INITIALIZATION_ERROR"], 
    threatLevel: "ELEVATED" 
  };
}

function fallbackTooltip(data: any, mode: string): SmartTooltipData {
  return {
    description: "Manual assessment required. Local link offline.",
    recommendation: "Validate environment variables.",
    status: mode as any,
    elementType: data.elementType || "System",
    elementId: data.elementId || "CORE"
  };
}