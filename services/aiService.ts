import { GoogleGenAI } from "@google/genai";
import { AIProvider, AIConfig, OperationalMode, SmartTooltipData } from "../types";

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

const getAiClient = (config: AIConfig) => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export async function testAiAvailability(config: AIConfig): Promise<boolean> {
  if (config.provider === AIProvider.GEMINI) return !!process.env.API_KEY;
  try {
    const endpoint = config.endpoint.includes('/chat/completions') ? config.endpoint : `${config.endpoint.replace(/\/$/, "")}/chat/completions`;
    const response = await fetch(endpoint, {
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
  context: { sessionId: string; mode: OperationalMode }
) {
  const isMainProbe = panelName === 'GLOBAL_SYSTEM_AUDIT';
  
  const systemInstruction = `You are the ${isMainProbe ? 'Main Neural Core' : 'Panel Diagnostic Core'} for the PiSentinel SOC monitor.
Analyze the provided telemetry and return a structured report for security professionals.
STRICT RULES:
- Respond ONLY with a valid JSON object.
- No markdown formatting.
- Include actionable security recommendations.

Schema:
{
  "description": "Short human-readable summary of element health.",
  "recommendation": "Technical advice or suggestion.",
  "status": "${context.mode}",
  "elementType": "${panelName}",
  "elementId": "probe-${Date.now()}",
  "anomalies": ["list", "of", "issues"],
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}`;

  const userPrompt = truncateInputStrict(JSON.stringify({ 
    panel: panelName, 
    operational_mode: context.mode,
    telemetry_payload: metrics 
  }));

  if (config.provider === AIProvider.GEMINI) {
    const ai = getAiClient(config);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: systemInstruction + "\n\n" + userPrompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch { return fallbackProbe(panelName, context.mode); }
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
          max_tokens: 512
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return extractJsonLoose(data.choices[0].message.content);
    } catch (e) { 
      console.error("Local Neural Probe Error:", e);
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
- Respond ONLY with a valid JSON object.
- No explanations or chat markers.

Schema:
{
  "description": "Short human-readable summary of the specific metric or component.",
  "recommendation": "Optional advice or warning based on the values.",
  "status": "${context.mode}",
  "elementType": "Type of component",
  "elementId": "ID of component"
}`;

  const userPrompt = truncateInputStrict(JSON.stringify({ 
    elementType: elementData.elementType, 
    elementId: elementData.elementId, 
    status: context.mode, 
    metrics: elementData.metrics,
    context: "Dashboard - Real-time Overview"
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
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return extractJsonLoose(data.choices[0].message.content);
    }
  } catch (e) { 
    console.error("Local Tooltip Error:", e);
    return fallbackTooltip(elementData, context.mode); 
  }
}

function fallbackProbe(panel: string, mode: string) { return { description: "Link Void.", recommendation: "Manual Assessment required.", status: mode as any, elementType: panel, elementId: "VOID", anomalies: ["AI_OFFLINE"], threatLevel: "ELEVATED" }; }
function fallbackTooltip(data: any, mode: string): SmartTooltipData { return { description: "Telemetry analysis buffering.", recommendation: "Check AI link.", status: mode as any, elementType: data.elementType || "Core", elementId: data.elementId || "SYS" }; }