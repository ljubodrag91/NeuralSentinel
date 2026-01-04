
// Import React to resolve 'Cannot find namespace React' error
import React from 'react';

export enum OperationalMode {
  OFFLINE = 'OFFLINE',
  SIMULATED = 'SIMULATED',
  REAL = 'REAL'
}

export enum Platform {
  LINUX = 'LINUX',
  WINDOWS = 'WINDOWS'
}

export type DataSourceMode = 'LOCAL' | 'REMOTE';

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
export type ProbeStatus = 'COMPLETED' | 'ERROR' | 'NO_DATA' | 'PARTIAL' | 'PENDING';
export type SlotType = 'LOW' | 'PROBE' | 'MAIN' | 'SENSOR' | 'BUFFER';
export type DetailedProbeType = 'NEURO_DATA' | 'CORE_DATA' | 'HISTORICAL_CORE' | 'SENSOR_TRIGGER';

export enum ScriptState {
  LOADED = 'LOADED',
  DISABLED = 'DISABLED',
  REFRESHING = 'REFRESHING',
  BROKEN = 'BROKEN'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: OperationalMode;
  details?: string;
  metadata?: {
    type?: string;
    panelId?: string;
    slotType?: SlotType;
    probeType?: DetailedProbeType;
    probeStatus?: ProbeStatus;
    tokenLimit?: number;
    requestPayload?: any;
    responsePayload?: any;
    hasHistoricalData?: boolean;
    launcherId?: string;
    contract?: {
        description: string;
        expectation: string;
    };
  };
}

export interface SessionInfo {
  id: string;
  startTime: string;
  mode: OperationalMode;
  targetIp: string | null;
  status: 'IDLE' | 'ACTIVE' | 'TERMINATED';
  authHash?: string; // Ephemeral session token for persistence
}

export interface CoreStats {
  cpu: {
    cpuCores: number;
    cpuCoresPhysical: number;
    cpuFreqCurrent: number;
    cpuFreqMax: number;
    cpuLoad1: number;
    cpuLoad5: number;
    cpuLoad15: number;
    temperature: number;
    usage: number;
  };
  memory: {
    ramTotal: number;
    ramUsed: number;
    ramFree: number;
    ramAvailable: number;
    usage: number;
    swapTotal: number;
    swapUsed: number;
    swapPercent: number;
  };
  disk: {
    rootUsage: number;
    rootFreeGB: number;
    rootTotalGB: number;
    rootUsedGB: number;
    readRateKB: number;
    writeRateKB: number;
    readTotalMB: number;
    writeTotalMB: number;
    partitions: Array<{
      device: string;
      mountpoint: string;
      fstype: string;
      total: number;
      used: number;
      free: number;
      percent: number;
    }>;
  };
  network: {
    inRateKB: number;
    outRateKB: number;
    inTotalMB: number;
    outTotalMB: number;
    connections: number;
    packetsSent: number;
    packetsRecv: number;
    errorsIn: number;
    errorsOut: number;
    droppedIn: number;
    droppedOut: number;
    interfaces: Record<string, {
      ipv4: string[];
      ipv6: string[];
      mac: string[];
      isUp: boolean;
      speed: number;
      rxKB?: number;
      txKB?: number;
      totalSentMB?: number;
      totalRecvMB?: number;
      lastActivity?: string;
    }>;
  };
  processes: {
    topByCpu: Array<{ pid: number; name: string; cpu_percent: number; memory_percent: number; username: string }>;
    topByMemory: Array<{ pid: number; name: string; cpu_percent: number; memory_percent: number; username: string }>;
    totalProcesses: number;
  };
  sensors: {
    cpu_thermal_temp1: number;
    [key: string]: number;
  };
  system: {
    hostname: string;
    osName: string;
    osVersion: string;
    machine: string;
    bootTime: number;
    uptime: number;
  };
  rates: {
    sampleInterval: number;
  };
  // Injected by frontend backend-logic
  platform?: Platform;
  source?: DataSourceMode;
  
  timestamp: number;
  datetime: string;
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

export interface SlotConfig {
  launcherId: string;
  ammoId: string; // Internal ID refers to Consumable
}

export interface PanelSlotConfig {
  probeSlot?: SlotConfig; 
  sensorSlot?: SlotConfig;   
  bufferSlot?: SlotConfig;   
}

export interface SlotPermissions {
  low: boolean;
  probe: boolean;
  sensor: boolean;
  buffer: boolean;
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
  panelSlots: Record<string, PanelSlotConfig>;
  globalLowSlot: SlotConfig; 
  globalProbeSlot: SlotConfig; 
  globalSensorSlot: SlotConfig; 
  globalBufferSlot: SlotConfig; 
  slotPermissions: Record<string, SlotPermissions>;
  telemetryEnabled: boolean;
  neuralUplinkEnabled: boolean;
  platform: Platform;
  dataSourceMode: DataSourceMode;
  boosterEndTime?: number;
  installedBoosterId?: string;
  telemetryUrl: string;
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
  type: 'core' | 'neural' | 'sensor-module' | 'buffer-module';
  tier?: 1 | 2 | 3; 
  description: string;
  maxCharges: number;
  rechargeRate: number; // seconds
  compatibleProbes: string[]; 
  color: string;
  tokens: number;
  baseCooldown?: number; // ms
  isExtended?: boolean; 
}

export interface Consumable {
  id: string;
  name: string;
  type: 'data' | 'neural' | 'booster' | 'module-core';
  description: string;
  compatibleLaunchers: ('core' | 'neural' | 'main' | 'sensor-module' | 'buffer-module')[];
  cost: number;
  features: string[];
  disabled?: boolean;
  unlimited?: boolean;
  maxStack?: number;
  autoInterval?: number; // ms
  isNeuralIntegration?: boolean;
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

export type SensorScanType = 'NETWORK' | 'SYSTEM' | 'PROCESS' | 'FILESYSTEM' | 'SECURITY';

export interface SensorNodeConfig {
  id: string;
  name: string;
  type: SensorScanType;
  enabled: boolean;
  description: string;
  anomalyCriteria: string;
  noDataDefinition: string;
  sensitivity: number; // 1-100
  timeout: number; // ms
  x: number;
  y: number;
}

export interface GlobalArraySettings {
  maxExecutionTime: number; // ms
  executionMode: 'SEQUENTIAL' | 'PARALLEL';
  visualDensity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SensorArrayConfig {
  id: string;
  name: string;
  description: string;
  compatibility?: "WINDOWS" | "LINUX" | "BOTH";
  nodeIds?: string[]; 
  nodes: SensorNodeConfig[]; 
  settings: GlobalArraySettings;
  created: number;
  modified: number;
}

export interface ToolParameter {
  name: string;
  flag: string;
  description: string;
  type: 'text' | 'toggle' | 'number' | 'select';
  value: string | number | boolean;
  options?: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: string;
  baseCommand: string;
  description: string;
  parameters: ToolParameter[];
}
