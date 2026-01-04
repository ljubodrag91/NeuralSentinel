
import { GoogleGenAI } from "@google/genai";
// Fixed missing exported members by aliasing existing types from types.ts
import { NeuralNetworkProvider as AIProvider, NeuralNetworkConfig as AIConfig, OperationalMode, SmartTooltipData, Platform } from "../types";
import { PROBE_CONTRACTS } from "./probeContracts";
import { aiTransport } from "./aiTransport";

function truncateInputStrict(text: string, maxChars: number = 10000): string {
  if (text.length <= maxChars) return text;
  return "[TRUNCATED_START]..." + text.slice(-maxChars);
}

function extractJsonLoose(text: string): any {
  const cleaned = text
    .replace(/```json|```/g, "")
    .replace(/<|.*?|>/g, "")
    .replace(/<thought>[\s\S]*?<\/thought>/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON_NOT_FOUND_IN_OUTPUT");
  return JSON.parse(match[0]);
}

// Ensure initialization uses process.env.API_KEY directly and cast to string
const getAiClient = (config: AIConfig) => {
  const key = process.env.API_KEY;
  if (!key) throw new Error("API_KEY_MISSING: Neural Link credentials not found in environment.");
  return new GoogleGenAI({ apiKey: key as string });
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

export async function fetchLocalModels(endpoint: string): Promise<string[]> {
  try {
    // Construct models endpoint from the base configuration endpoint
    // Removes /v1 or /chat/completions suffix if present to find the root, then appends /v1/models
    let baseUrl = endpoint.replace('localhost', '127.0.0.1');
    baseUrl = baseUrl.replace(/\/chat\/completions$/, '').replace(/\/v1$/, '').replace(/\/$/, '');
    
    const url = `${baseUrl}/v1/models`; 

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data
      .filter((m: any) => {
        const id = m.id.toLowerCase();
        // Filter out embedding models or known non-chat models
        return !id.includes('embedding') && !id.includes('audio') && !id.includes('tts');
      })
      .map((m: any) => m.id);
  } catch (e) {
    console.warn("Failed to fetch local models:", e);
    return [];
  }
}

/**
 * Shared Data Preparation Pipeline
 * Transmorphs raw payload based on launcher token attributes (Character Limit).
 */
function transmorphPayload(payload: any, charLimit: number): any {
  let maxArrayItems = 50;
  let maxStringLength = 5000;

  if (charLimit <= 1000) {
    maxArrayItems = 3;
    maxStringLength = 200;
  } else if (charLimit <= 5000) {
    maxArrayItems = 10;
    maxStringLength = 1000;
  } else {
    maxArrayItems = 100;
    maxStringLength = 8000; // Allow more history
  }

  const process = (item: any): any => {
    if (Array.isArray(item)) {
      return item.slice(0, maxArrayItems).map(process);
    } else if (typeof item === 'string') {
      // Special handling for CSV history blobs which can be massive
      if (item.includes('TIMESTAMP,') || item.length > maxStringLength) {
         // If string is too long, take the END (most recent history)
         if (item.length > maxStringLength) {
             const truncated = "...[TRUNCATED_HISTORY]\n" + item.slice(-(maxStringLength - 50));
             return truncated;
         }
      }
      if (item.length > maxStringLength) {
        return item.substring(0, maxStringLength) + '...[TRUNC]';
      }
      return item;
    } else if (item && typeof item === 'object') {
      const res: any = {};
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          res[key] = process(item[key]);
        }
      }
      return res;
    }
    return item;
  };

  return process(payload);
}

export async function performNeuralProbe(
  config: AIConfig,
  panelName: string,
  metrics: any,
  context: { sessionId: string; mode: OperationalMode; serviceStatus: 'ONLINE' | 'OFFLINE'; tokenLimit: number }
) {
  const contract = PROBE_CONTRACTS[panelName];
  
  // Platform and Source awareness injected from App.tsx
  const platform = metrics?.platform || Platform.LINUX;
  const source = metrics?.source || "UNKNOWN";
  
  const rawPayload = contract ? contract.buildPayload(metrics) : { telemetry: metrics };
  const isEmpty = metrics?.status === 'empty' || rawPayload?.status === 'empty';

  // Transmorph payload based on Launcher Token Limit
  const payload = transmorphPayload(rawPayload, context.tokenLimit);

  // Capture the Exact Payload Structure for Audit Logging
  const _sentPayload = { 
    panel: panelName, 
    operational_mode: context.mode,
    platform: platform,
    source_origin: source,
    service_uplink: context.serviceStatus,
    payload: payload,
    meta: {
        token_limit: context.tokenLimit,
        probe_type: contract?.isDataProbe ? 'DATA_PROBE' : 'NEURAL_LOGIC',
        timestamp: new Date().toISOString()
    }
  };

  // Construct System Instruction using Unified Probe Contract
  let systemInstruction = `You are the ${contract?.id || 'Neural'} Diagnostic Core for the PiSentinel SOC monitor.
Target Platform: ${platform} (${source} Source).

PROBE MISSION:
${contract?.description || 'Analyze the provided data for security anomalies.'}

EXPECTED OUTPUT:
${contract?.expectedResponse || 'Provide a security assessment in JSON format.'}
`;

  if (platform === Platform.WINDOWS) {
    systemInstruction += `\nContext: Local Windows Host Telemetry. Focus on OS-level anomalies, local network services, and process integrity.`;
  } else {
    systemInstruction += `\nContext: Remote Linux/Pi SSH Telemetry. Focus on kernel logs, SSH intrusion attempts, and daemon stability.`;
  }

  if (context.serviceStatus === 'OFFLINE') {
    systemInstruction += `\nWARNING: SERVICE UPLINK IS OFFLINE. The provided telemetry dataset may be stale, incomplete, or empty. Advise the operator to check the physical connection or the Sentinel daemon on the target node.`;
  }

  if (isEmpty) {
    systemInstruction += `\nCRITICAL: The probe dataset is EMPTY. Indicate this clearly in the description and recommend checking connectivity or launcher configuration.`;
  }

  systemInstruction += `\n\nSTRICT RULES:
- Respond ONLY with a valid JSON object.
- No markdown formatting or code blocks.
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

  const userPrompt = truncateInputStrict(JSON.stringify(_sentPayload));

  try {
    const result = await aiTransport.fetch(config, systemInstruction, userPrompt, true, context.tokenLimit);
    if (!result.success) {
      // Check for structured error from transport
      if (result.error) {
          return {
              description: `Neural Link Failure [Code ${result.errorCode || '400'}]: ${result.error}`,
              recommendation: "Review launcher parameters. If using thinking mode, ensure token capacity is sufficient (>3000 chars).",
              status: context.mode,
              elementType: panelName,
              elementId: "TRANSPORT_ERROR",
              anomalies: ["VALIDATION_FAILURE"],
              threatLevel: "UNKNOWN",
              _sentPayload
          };
      }
      
      // If transport says failure but we have rawText, it's a parse error. Try fallback parse.
      if (result.rawText) {
          try {
              const looseJson = extractJsonLoose(result.rawText);
              return { ...looseJson, _sentPayload };
          } catch {
              // Failed loose extraction too
          }
      }
      throw new Error(result.error || "UNKNOWN_TRANSPORT_ERROR");
    }
    
    return { ...result.data, _sentPayload };
  } catch (e: any) {
    console.error("Neural Probe Error:", e);
    return {
      description: `Neural Link Failure: ${e.message}`,
      recommendation: "Check AI Configuration and Connectivity. The model might be outputting invalid JSON format or experiencing an API bottleneck.",
      status: context.mode,
      elementType: panelName,
      elementId: "ERROR",
      anomalies: ["AI_UNREACHABLE", "INVALID_JSON_STREAM"],
      threatLevel: "UNKNOWN",
      _sentPayload
    };
  }
}

export async function fetchSmartTooltip(
  config: AIConfig,
  elementData: any,
  context: { sessionId: string; mode: OperationalMode; tokenLimit: number }
): Promise<SmartTooltipData> {
  const platform = elementData.metrics?.platform || "UNKNOWN";
  
  // Transmorph metric data for tooltip as well
  const safeMetrics = transmorphPayload(elementData.metrics, context.tokenLimit);

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
    metrics: safeMetrics,
    context: "Dashboard - Real-time Probe Overview"
  }));

  try {
    const result = await aiTransport.fetch(config, systemInstruction, userPrompt, false, context.tokenLimit);
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (e) { 
    console.error("Neural Tooltip Error:", e);
    return fallbackTooltip(elementData, context.mode); 
  }
}

function fallbackProbe(panel: string, mode: string) { return { description: "Link Void.", recommendation: "Manual Probe required.", status: mode as any, elementType: panel, elementId: "VOID", anomalies: ["AI_OFFLINE"], threatLevel: "ELEVATED" }; }
function fallbackTooltip(data: any, mode: string): SmartTooltipData { return { description: "Telemetry probe buffering.", recommendation: "Check AI link.", status: mode as any, elementType: data.elementType || "Core", elementId: data.elementId || "SYS" }; }
