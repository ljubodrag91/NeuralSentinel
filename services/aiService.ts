
import { GoogleGenAI } from "@google/genai";
import { NeuralNetworkProvider as AIProvider, NeuralNetworkConfig as AIConfig, OperationalMode, SmartTooltipData, Platform, DetailedProbeType } from "../types";
import { PROBE_CONTRACTS } from "./probeContracts";
import { aiTransport } from "./aiTransport";

function optimizePayloadForTokens(payload: any, charLimit: number): any {
  let json = JSON.stringify(payload);
  if (json.length <= charLimit) return payload;

  const res = { ...payload };
  // If Historical or Aggregated, prioritize pruning data arrays
  if (Array.isArray(res.payload)) {
    while (JSON.stringify(res).length > charLimit && res.payload.length > 1) {
      res.payload.shift(); 
    }
  }

  // Final recursive string truncation if still too large
  const maxStr = Math.floor(charLimit / 10);
  const process = (item: any): any => {
    if (Array.isArray(item)) return item.map(process);
    if (typeof item === 'string' && item.length > maxStr) return item.substring(0, maxStr) + "...[REDACTED]";
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
  metrics: any,
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
  
  const fullEnvelope = { 
    metadata: {
      probe_id: `probe-${Date.now()}`,
      timestamp: new Date().toISOString(),
      panelID: panelName,
      probe_type: context.probeTypeUsed,
      platform: platform
    },
    payload: metrics
  };

  // Pre-emptive pruning to prevent terminal faults
  const optimizedEnvelope = optimizePayloadForTokens(fullEnvelope, context.tokenLimit);

  let systemInstruction = `You are the ${contract?.id || 'Neural'} Diagnostic Core. Environment: ${platform}. 
  MISSION: ${contract?.description || 'Analyze tactical data.'}`;

  const userPrompt = JSON.stringify(optimizedEnvelope);

  try {
    const result = await aiTransport.fetch(config, systemInstruction, userPrompt, true, context.tokenLimit);
    if (!result.success) {
      return {
        description: `Neural Link Calibrating: ${result.error}`,
        recommendation: "Standby for automatic hardware recalibration.",
        status: context.mode,
        elementType: panelName,
        elementId: "RECOVERABLE_FAULT",
        anomalies: ["UPLINK_SYNC_TIMEOUT"],
        threatLevel: "UNKNOWN",
        _sentPayload: { fullPayload: fullEnvelope }
      };
    }
    return { ...result.data, _sentPayload: { fullPayload: fullEnvelope } };
  } catch (e: any) {
    return {
      description: `Internal Core Error: ${e.message}`,
      recommendation: "Recalibrating manifolds.",
      status: context.mode,
      elementType: panelName,
      elementId: "ERROR",
      anomalies: ["LOGIC_FAULT"],
      threatLevel: "UNKNOWN"
    };
  }
}

export async function testAiAvailability(config: AIConfig): Promise<boolean> {
  if (config.provider === AIProvider.GEMINI) return !!process.env.API_KEY;
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }),
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch { return false; }
}

export async function fetchLocalModels(endpoint: string): Promise<string[]> {
  try {
    const baseUrl = endpoint.replace('localhost', '127.0.0.1').replace(/\/v1$/, '').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/v1/models`, { method: 'GET', mode: 'cors' });
    const data = await response.json();
    return data.data.map((m: any) => m.id);
  } catch (e) { return []; }
}
