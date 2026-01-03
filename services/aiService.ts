
import { GoogleGenAI } from "@google/genai";
// Fixed missing exported members by aliasing existing types from types.ts
import { NeuralNetworkProvider as AIProvider, NeuralNetworkConfig as AIConfig, OperationalMode, SmartTooltipData, Platform } from "../types";
import { PROBE_CONTRACTS } from "./probeContracts";

function truncateInputStrict(text: string, maxChars: number = 10000): string {
  if (text.length <= maxChars) return text;
  return "[TRUNCATED_START]..." + text.slice(-maxChars);
}

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

// Ensure initialization uses process.env.API_KEY directly and cast to string
const getAiClient = (config: AIConfig) => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

/**
 * Enhanced fetch for Local AI.
 * Handles normalization and provides security hints for local endpoints.
 */
async function secureLocalFetch(url: string, options: RequestInit): Promise<Response> {
  const normalizedUrl = url.replace('localhost', '127.0.0.1');
  return fetch(normalizedUrl, {
    ...options,
    // Ensure the browser handles PNA preflight correctly without manual header interference
    referrerPolicy: "no-referrer",
    mode: 'cors',
  });
}

export async function testAiAvailability(config: AIConfig): Promise<boolean> {
  if (config.provider === AIProvider.GEMINI) return !!process.env.API_KEY;
  try {
    const baseUrl = config.endpoint.replace(/\/$/, "");
    const endpoint = baseUrl.includes('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
    
    const response = await secureLocalFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: config.model, 
        messages: [{ role: 'user', content: 'ping' }], 
        max_tokens: 5,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(4000)
    });
    return response.ok;
  } catch { return false; }
}

export async function performNeuralProbe(
  config: AIConfig,
  panelName: string,
  metrics: any,
  context: { sessionId: string; mode: OperationalMode; serviceStatus: 'ONLINE' | 'OFFLINE' }
) {
  const isMainProbe = panelName === 'GLOBAL_SYSTEM_PROBE';
  const contract = PROBE_CONTRACTS[panelName];
  
  // Platform and Source awareness injected from App.tsx
  const platform = metrics?.platform || Platform.LINUX;
  const source = metrics?.source || "UNKNOWN";
  
  const isEmpty = metrics?.status === 'empty' || contract?.buildPayload(metrics)?.status === 'empty';

  let systemInstruction = `You are the ${isMainProbe ? 'Main Neural Core' : 'Panel Diagnostic Core'} for the PiSentinel SOC monitor.
Target Platform: ${platform} (${source} Source).
Analyze the provided probe data and return a structured report for security professionals.
`;

  if (platform === Platform.WINDOWS) {
    systemInstruction += `Context: Local Windows Host Telemetry. Focus on OS-level anomalies, local network services, and process integrity.\n`;
  } else {
    systemInstruction += `Context: Remote Linux/Pi SSH Telemetry. Focus on kernel logs, SSH intrusion attempts, and daemon stability.\n`;
  }

  if (context.serviceStatus === 'OFFLINE') {
    systemInstruction += `WARNING: SERVICE UPLINK IS OFFLINE. The provided telemetry dataset may be stale, incomplete, or empty. Advise the operator to check the physical connection or the Sentinel daemon on the target node.\n`;
  }

  if (isEmpty) {
    systemInstruction += `CRITICAL: The probe dataset is EMPTY. Indicate this clearly in the description and recommend checking connectivity or launcher configuration.\n`;
  }

  systemInstruction += `STRICT RULES:
- Respond ONLY with a valid JSON object.
- No markdown formatting.
- Include actionable security recommendations.

Schema:
{
  "description": "Short human-readable summary of probe findings.",
  "recommendation": "Technical advice or suggestion.",
  "status": "${context.mode}",
  "elementType": "${panelName}",
  "elementId": "probe-${Date.now()}",
  "anomalies": ["list", "of", "issues"],
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}`;

  const payload = contract ? contract.buildPayload(metrics) : { telemetry: metrics };
  const userPrompt = truncateInputStrict(JSON.stringify({ 
    panel: panelName, 
    operational_mode: context.mode,
    platform: platform,
    source_origin: source,
    service_uplink: context.serviceStatus,
    payload: payload
  }));

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
      const baseUrl = config.endpoint.replace(/\/$/, "");
      const endpoint = baseUrl.includes('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      
      const response = await secureLocalFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemInstruction }, 
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 512
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return extractJsonLoose(data.choices[0].message.content);
    }
  } catch (e: any) {
    console.error("Neural Probe Error:", e);
    // Return a structured error response that fits the schema so the UI doesn't crash
    return {
      description: `Neural Link Failure: ${e.message}`,
      recommendation: "Check AI Configuration and Connectivity.",
      status: context.mode,
      elementType: panelName,
      elementId: "ERROR",
      anomalies: ["AI_UNREACHABLE"],
      threatLevel: "UNKNOWN"
    };
  }
}

export async function fetchSmartTooltip(
  config: AIConfig,
  elementData: any,
  context: { sessionId: string; mode: OperationalMode }
): Promise<SmartTooltipData> {
  const platform = elementData.metrics?.platform || "UNKNOWN";
  
  const systemInstruction = `You are a ${platform} cyber dashboard smart tooltip engine.
STRICT RULES:
- Respond ONLY with a valid JSON object.
- No explanations or chat markers.

Schema:
{
  "description": "Short human-readable probe summary of the specific metric or component.",
  "recommendation": "Optional advice based on the values.",
  "status": "${context.mode}",
  "elementType": "Type of component",
  "elementId": "ID of component"
}`;

  const userPrompt = truncateInputStrict(JSON.stringify({ 
    elementType: elementData.elementType, 
    elementId: elementData.elementId, 
    status: context.mode, 
    platform: platform,
    metrics: elementData.metrics,
    context: "Dashboard - Real-time Probe Overview"
  }));

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
      const baseUrl = config.endpoint.replace(/\/$/, "");
      const endpoint = baseUrl.includes('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      
      const response = await secureLocalFetch(endpoint, {
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
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return extractJsonLoose(data.choices[0].message.content);
    }
  } catch (e) { 
    console.error("Local Tooltip Error:", e);
    return fallbackTooltip(elementData, context.mode); 
  }
}

function fallbackProbe(panel: string, mode: string) { return { description: "Link Void.", recommendation: "Manual Probe required.", status: mode as any, elementType: panel, elementId: "VOID", anomalies: ["AI_OFFLINE"], threatLevel: "ELEVATED" }; }
function fallbackTooltip(data: any, mode: string): SmartTooltipData { return { description: "Telemetry probe buffering.", recommendation: "Check AI link.", status: mode as any, elementType: data.elementType || "Core", elementId: data.elementId || "SYS" }; }
