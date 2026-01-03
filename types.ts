
// Import React to resolve 'Cannot find namespace React' error
import React from 'react';

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
  ALERT = 'ALERT',
  COMMAND = 'COMMAND'
}

export type LogType = 'neural' | 'console' | 'kernel' | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: OperationalMode;
  details?: string;
  metadata?: {
    type?: string;
    title?: string;
    data?: any;
    launcherId?: string;
    probeType?: 'NEURAL' | 'DATA';
  };
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
    freqCurrent?: number;
    freqMax?: number;
    cores?: number;
  };
  memory?: {
    total: number;
    used: number;
    usage: number;
    available?: number;
    swapUsage?: number;
  };
  disk?: {
    rootUsage: number;
    readRate: number;
    writeRate: number;
    partitions?: any[];
  };
  network?: {
    inRate: number;
    outRate: number;
    interfaces: Record<string, {
      up: boolean;
      ip: string;
      rx: number;
      tx: number;
      speed?: number;
      mac?: string[];
      ipv4?: string[];
    }>;
  };
  processes?: {
    topByCpu: any[];
    topByMemory: any[];
    total: number;
  };
  sensors?: {
    throttled?: string;
    throttledInfo?: string[];
    raw?: Record<string, number>;
  };
  system?: {
    hostname: string;
    uptime: number;
    osName: string;
  };
}

export enum NeuralNetworkProvider {
  GEMINI = 'GEMINI',
  LOCAL = 'LOCAL'
}

export interface NeuralNetworkConfig {
  provider: NeuralNetworkProvider;
  endpoint: string;
  model: string;
  fallbackToLocal: boolean;
}

export interface AppSettings {
  showAsciiBg: boolean;
  globalDistortion: boolean;
  panelDistortion: boolean;
  pollInterval: number;
  timeframe: Timeframe;
  frogInterval: number;
  frogColor: string;
  frogIntensity: number;
  coreRechargeRate: number; 
  neuralRechargeRate: number; 
  maxCoreCharges: number;
  maxNeuralCharges: number;
  // Per-probe launcher mappings
  probeLaunchers: Record<string, string>;
}

export interface SmartTooltipData {
  description: string;
  recommendation: string;
  status: "REAL" | "SIMULATED" | "OFFLINE";
  elementType: string;
  elementId: string;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';

export interface Launcher {
  id: string;
  name: string;
  type: 'core' | 'neural';
  description: string;
  maxCharges: number;
  rechargeRate: number; // seconds
  compatibleProbes: string[]; // probe types or ids
  color: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  component: React.ComponentType<any>;
}

export interface ProbeResult {
  description: string;
  recommendation: string;
  status: OperationalMode;
  elementType: string;
  elementId: string;
  anomalies: string[];
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface ToolParameter {
  name: string;
  flag: string;
  description: string;
  type: 'text' | 'toggle' | 'number';
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
