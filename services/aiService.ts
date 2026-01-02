
import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, AIConfig, OperationalMode, SmartTooltipData } from "../types";
import { APP_CONFIG } from "./config";

/**
 * Neural Probe: Deep analysis of a full panel's data.
 * Now returns JSON for structured UI display.
 */
export async function performNeuralProbe(
  config: AIConfig,
  panelName: string,
  metrics: any,
  context: { sessionId: string; mode: OperationalMode }
) {
  const systemInstruction = `You are the Neural Intelligence Core for the PiSentinel SOC Console.
Analyze the provided metrics and return a high-fidelity JSON diagnostic report.
Be tactically relevant and concise.

Return exactly this JSON structure:
{
  "description": "Deep technical analysis of the panel metrics.",
  "recommendation": "Primary tactical action for the operator.",
  "status": "REAL" | "SIMULATED" | "OFFLINE",
  "elementType": "Component category",
  "elementId": "ID",
  "anomalies": ["List of detected data deviations"],
  "threatLevel": "LOW" | "ELEVATED" | "CRITICAL"
}`;

  const userPrompt = `
[NEURAL_PROBE_INITIATED]
PANEL: ${panelName}
SESSION: ${context.sessionId}
MODE: ${context.mode}
METRICS_DATA: ${JSON.stringify(metrics)}
[/NEURAL_PROBE_INITIATED]
`;

  if (config.provider === AIProvider.GEMINI) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: config.model || APP_CONFIG.DEFAULT_MODEL,
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
      console.error("Probe Error:", e);
      return { 
        description: "Neural link severed. Analysis failed.", 
        recommendation: "Re-establish AI core link.", 
        status: context.mode, 
        elementType: panelName, 
        elementId: "NODE_ERR", 
        anomalies: ["LINK_TIMEOUT"], 
        threatLevel: "CRITICAL" 
      };
    }
  }
  
  return { 
    description: "Manual assessment required. Local AI engine pending.", 
    recommendation: "Check local node status.", 
    status: context.mode, 
    elementType: panelName, 
    elementId: "LOCAL_NODE", 
    anomalies: ["AI_OFFLINE"], 
    threatLevel: "LOW" 
  };
}

/**
 * Smart Tooltip: Quick JSON assessment of specific elements
 */
export async function fetchSmartTooltip(
  config: AIConfig,
  elementData: any,
  context: { sessionId: string; mode: OperationalMode }
): Promise<SmartTooltipData> {
  const systemInstruction = `You are the Brain Tooltip Engine for a SOC console. Respond ONLY in JSON.
Analyze technical metrics to provide a context-aware insight. 
Schema:
{
  "description": "Technical essence of this component in Kali context.",
  "recommendation": "Tactical advice.",
  "status": "REAL" | "SIMULATED" | "OFFLINE",
  "elementType": "Category",
  "elementId": "ID"
}`;

  const userPrompt = `ELEMENT: ${JSON.stringify(elementData)}\nMODE: ${context.mode}`;

  if (config.provider === AIProvider.GEMINI) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: config.model || APP_CONFIG.DEFAULT_MODEL,
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
              elementId: { type: Type.STRING }
            },
            required: ["description", "recommendation", "status", "elementType", "elementId"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return fallbackTooltip(elementData, context.mode);
    }
  }
  return fallbackTooltip(elementData, context.mode);
}

function fallbackTooltip(data: any, mode: string): SmartTooltipData {
  return {
    description: "Neural link offline. Manual assessment required.",
    recommendation: "Check AI link in Global Config.",
    status: mode as any,
    elementType: data.elementType || "System",
    elementId: data.elementId || "CORE"
  };
}
