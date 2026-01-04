
import { GoogleGenAI } from "@google/genai";
import { NeuralNetworkProvider as AIProvider, NeuralNetworkConfig as AIConfig, OperationalMode, SmartTooltipData, Platform, DetailedProbeType } from "../types";
import { PROBE_CONTRACTS } from "./probeContracts";
import { aiTransport } from "./aiTransport";

function truncateInputStrict(text: string, maxChars: number = 10000): string {
  if (text.length <= maxChars) return text;
  return "[TRUNCATED_START]..." + text.slice(-maxChars);
}

function extractJsonLoose(text: string): any {
  const cleaned = text
    .replace(/```json|```/g, "")
    .replace(/<thought>[\s\S]*?<\/thought>/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON_NOT_FOUND_IN_OUTPUT");
  return JSON.parse(match[0]);
}

async function secureLocalFetch(url: string, options: RequestInit): Promise<Response> {
  const normalizedUrl = url.replace('localhost', '127.0.0.1');
  return fetch(normalizedUrl, {
    ...options,
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

export async function fetchLocalModels(endpoint: string): Promise<string[]> {
  try {
    let baseUrl = endpoint.replace('localhost', '127.0.0.1');
    baseUrl = baseUrl.replace(/\/chat\/completions$/, '').replace(/\/v1$/, '').replace(/\/$/, '');
    const url = `${baseUrl}/v1/models`; 
    const response = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) return [];
    return data.data
      .filter((m: any) => {
        const id = m.id.toLowerCase();
        return !id.includes('embedding') && !id.includes('audio') && !id.includes('tts');
      })
      .map((m: any) => m.id);
  } catch (e) {
    console.warn("Failed to fetch local models:", e);
    return [];
  }
}

/**
 * Token Optimization Engine
 * Discards oldest ticks for Historical probes if limit exceeded.
 */
function optimizePayloadForTokens(payload: any, charLimit: number): any {
  let json = JSON.stringify(payload);
  if (json.length <= charLimit) return payload;

  const res = { ...payload };

  // If Historical, prune oldest ticks (start of data array)
  if (res.metadata.probe_type === 'Historical' && Array.isArray(res.payload)) {
    while (JSON.stringify(res).length > charLimit && res.payload.length > 1) {
      res.payload.shift(); // Discard oldest tick
    }
  }

  // Final recursive string pruning for anything else
  const maxStringLength = Math.floor(charLimit / 4);
  const process = (item: any): any => {
    if (Array.isArray(item)) return item.map(process);
    if (typeof item === 'string' && item.length > maxStringLength) return item.substring(0, maxStringLength) + '...[PRUNED]';
    if (item && typeof item === 'object') {
      const o: any = {};
      for (const k in item) o[k] = process(item[k]);
      return o;
    }
    return item;
  };

  return process(res);
}

export async function performNeuralProbe(
  config: AIConfig,
  panelName: string,
  metrics: any, // array or array-of-arrays
  context: { 
    sessionId: string; 
    mode: OperationalMode; 
    serviceStatus: 'ACTIVE' | 'OFFLINE'; 
    tokenLimit: number;
    probeTypeUsed: DetailedProbeType;
    depth?: number;
  }
) {
  const contract = PROBE_CONTRACTS[panelName];
  const platform = metrics?.platform || Platform.LINUX;
  
  // Assemble Full JSON Carrier Envelope
  const fullEnvelope = { 
    metadata: {
      probe_id: `probe-${Date.now()}`,
      timestamp: new Date().toISOString(),
      panelID: panelName,
      probe_type: context.probeTypeUsed,
      operational_mode: context.mode,
      platform: platform,
      service_uplink: context.serviceStatus,
      depth: context.depth
    },
    settings: {
      token_limit: context.tokenLimit
    },
    payload: metrics
  };

  const optimizedEnvelope = optimizePayloadForTokens(fullEnvelope, context.tokenLimit);

  let systemInstruction = `You are the ${contract?.id || 'Neural'} Diagnostic Core for PiSentinel.
Probe Vector: ${fullEnvelope.metadata.probe_type}. Environment: ${platform}.

MISSION:
${contract?.description || 'Analyze tactical data for anomalies.'}

OUTPUT SCHEMA (JSON ONLY):
{
  "description": "Probe summary.",
  "recommendation": "Next steps.",
  "status": "${context.mode}",
  "elementType": "${panelName}",
  "elementId": "${fullEnvelope.metadata.probe_id}",
  "anomalies": ["list"],
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}`;

  const userPrompt = JSON.stringify(optimizedEnvelope);

  try {
    const result = await aiTransport.fetch(config, systemInstruction, userPrompt, true, context.tokenLimit);
    
    const auditTrail = {
      fullPayload: fullEnvelope,
      optimizedPayload: optimizedEnvelope,
      probeTypeUsed: fullEnvelope.metadata.probe_type,
      depth: fullEnvelope.metadata.depth
    };

    if (!result.success) {
      return {
        description: `Neural Link Fault: ${result.error}`,
        recommendation: "Inspect uplink stability.",
        status: context.mode,
        elementType: panelName,
        elementId: "TRANSPORT_ERROR",
        anomalies: ["UPLINK_FAILURE"],
        threatLevel: "UNKNOWN",
        _sentPayload: auditTrail
      };
    }
    
    return { ...result.data, _sentPayload: auditTrail };
  } catch (e: any) {
    return {
      description: `Internal Logic Error: ${e.message}`,
      recommendation: "Check manifold.",
      status: context.mode,
      elementType: panelName,
      elementId: "ERROR",
      anomalies: ["LOGIC_FAULT"],
      threatLevel: "UNKNOWN",
      _sentPayload: { fullPayload: fullEnvelope, optimizedPayload: optimizedEnvelope, probeTypeUsed: fullEnvelope.metadata.probe_type }
    };
  }
}

export async function fetchSmartTooltip(
  config: AIConfig,
  elementData: any,
  context: { sessionId: string; mode: OperationalMode; tokenLimit: number }
): Promise<SmartTooltipData> {
  const systemInstruction = `Tooltip generation engine. Respond with JSON ONLY.`;
  const userPrompt = JSON.stringify(elementData);

  try {
    const result = await aiTransport.fetch(config, systemInstruction, userPrompt, false, context.tokenLimit);
    return result.success ? result.data : fallbackTooltip(elementData, context.mode);
  } catch { return fallbackTooltip(elementData, context.mode); }
}

function fallbackTooltip(data: any, mode: string): SmartTooltipData { 
    return { description: "Standby.", recommendation: "Verify AI core.", status: mode as any, elementType: data.elementType || "Core", elementId: data.elementId || "SYS" }; 
}
