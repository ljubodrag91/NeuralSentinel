
export enum OperationalMode {
  OFFLINE = 'OFFLINE',
  SIMULATED = 'SIMULATED',
  REAL = 'REAL'
}

export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  SYSTEM = 'SYSTEM',
  NEURAL = 'NEURAL',
  ALERT = 'ALERT'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: OperationalMode;
  details?: string;
  metadata?: any; // Stores probe results or context for interactivity
}

export interface SessionInfo {
  id: string;
  startTime: string;
  mode: OperationalMode;
  targetIp: string | null;
  status: 'IDLE' | 'ACTIVE' | 'TERMINATED';
}

export interface PiStats {
  cpu?: {
    usage: number;
    temp: number;
    load: number[];
  };
  memory?: {
    total: number;
    used: number;
    usage: number;
  };
  network?: {
    interfaces: Record<string, {
      up: boolean;
      ip: string;
      rx: number;
      tx: number;
    }>;
  };
  neural?: {
    latency: number;
    contextUsage: number;
    tokensPerSec: number;
    linkStability: number;
  };
}

export enum AIProvider {
  GEMINI = 'GEMINI',
  LOCAL = 'LOCAL'
}

export interface AIConfig {
  provider: AIProvider;
  endpoint: string;
  model: string;
  fallbackToLocal: boolean;
}

export interface SmartTooltipData {
  description: string;
  recommendation: string;
  status: "REAL" | "SIMULATED" | "OFFLINE";
  elementType: string;
  elementId: string;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '6h';

export interface ToolParameter {
  name: string;
  flag: string;
  description: string;
  type: 'text' | 'number' | 'toggle';
  value: string | number | boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: string;
  baseCommand: string;
  description: string;
  parameters: ToolParameter[];
}
