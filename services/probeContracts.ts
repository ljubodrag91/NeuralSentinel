
import { OperationalMode, CoreStats, Platform } from '../types';

export interface ProbeContract {
  id: string;
  description: string;
  expectedResponse: string;
  isDataProbe: boolean;
  buildPayload: (data: any) => any[]; // Always returns array of {label: value}
  buildNeuroPayload?: (data: any) => any;
}

export const PROBE_CONTRACTS: Record<string, ProbeContract> = {
  GLOBAL_SYSTEM_PROBE: {
    id: 'GLOBAL_SYSTEM_PROBE',
    description: 'Comprehensive system security probe collecting CPU, memory, disk, and network metrics.',
    expectedResponse: 'Provide a structured JSON security assessment.',
    isDataProbe: true,
    buildPayload: (data: { stats?: CoreStats | null }) => [
      { "CPU Usage": data?.stats?.cpu?.usage ?? 0 },
      { "CPU Temp": data?.stats?.cpu?.temperature ?? 0 },
      { "RAM Usage": data?.stats?.memory?.usage ?? 0 },
      { "Disk Usage": data?.stats?.disk?.rootUsage ?? 0 },
      { "Net In Rate": data?.stats?.network?.inRateKB ?? 0 },
      { "Net Out Rate": data?.stats?.network?.outRateKB ?? 0 }
    ],
    buildNeuroPayload: (data: any) => ({
      labels: ["Dashboard", "Master Intelligence", "System Load", "Heuristic Buffer"],
      metadata: "Global tactical overview of all system-connected nodes and neural carrier status."
    })
  },
  ADAPTER_HUB: {
    id: 'ADAPTER_HUB',
    description: 'Network adapter matrix probe.',
    expectedResponse: 'Generate a structured analysis of all network interfaces.',
    isDataProbe: false,
    buildPayload: (data: { stats?: CoreStats | null }) => {
      const ifaces = Object.keys(data?.stats?.network?.interfaces || {}).length;
      return [
        { "Active Adapters": ifaces },
        { "Net Connections": data?.stats?.network?.connections ?? 0 },
        { "Error Inbound": data?.stats?.network?.errorsIn ?? 0 }
      ];
    }
  },
  HANDSHAKE_CORE: {
    id: 'HANDSHAKE_CORE',
    description: 'Remote handshake probe.',
    expectedResponse: 'Return a structured verification of authentication parameters.',
    isDataProbe: true,
    buildPayload: (data: { user?: string, port?: number }) => [
      { "Identity": data?.user ?? "UNKNOWN" },
      { "Port Vector": data?.port ?? 0 }
    ]
  },
  CONSOLE_DATA_PROBE: {
    id: 'CONSOLE_DATA_PROBE',
    description: 'Interactive shell command probe.',
    expectedResponse: 'Provide an analysis of the command payload.',
    isDataProbe: false,
    buildPayload: (data: { lastCommand?: string }) => {
      const cmd = data?.lastCommand || "";
      return [
        { "Command Raw": cmd || "NONE" },
        { "Length": cmd.length }
      ];
    }
  },
  NODE_DIAGNOSTICS: {
    id: 'NODE_DIAGNOSTICS',
    description: 'Deep system diagnostics probe.',
    expectedResponse: 'Return a structured hardware and OS health report.',
    isDataProbe: true,
    buildPayload: (data: { stats?: CoreStats | null }) => [
      { "Uptime": data?.stats?.system?.uptime ?? 0 },
      { "CPU Cores": data?.stats?.cpu?.cpuCores ?? 0 },
      { "Swap Usage": data?.stats?.memory?.swapPercent ?? 0 }
    ]
  },
  PROCESS_PROBE: {
    id: 'PROCESS_PROBE',
    description: 'System process probe.',
    expectedResponse: 'Provide a structured summary of top resource-consuming processes.',
    isDataProbe: false,
    buildPayload: (data: { processes?: any }) => [
      { "Process Count": data?.processes?.totalProcesses ?? 0 },
      { "Top CPU Name": data?.processes?.topByCpu?.[0]?.name ?? 'None' },
      { "Top MEM Name": data?.processes?.topByMemory?.[0]?.name ?? 'None' }
    ]
  },
  RSSI_REPORT: {
    id: 'RSSI_REPORT',
    description: 'Wireless telemetry probe.',
    expectedResponse: 'Return a JSON summary of RF signal trends.',
    isDataProbe: true,
    buildPayload: (data: { rssiData?: any[] }) => [
      { "Signal Level": (data?.rssiData && data.rssiData.length > 0) ? data.rssiData[data.rssiData.length - 1]?.val : -99 }
    ]
  },
  SESSION_ARCHIVE: {
    id: 'SESSION_ARCHIVE',
    description: 'Holistic session archive probe.',
    expectedResponse: 'Provide structured analysis of session flows.',
    isDataProbe: true,
    buildPayload: (data: { logCount?: number }) => [
      { "Archive Volume": data?.logCount ?? 0 }
    ]
  },
  LOG_AUDIT: {
    id: 'LOG_AUDIT',
    description: 'Comprehensive log audit probe.',
    expectedResponse: 'Return a JSON analysis of log entries.',
    isDataProbe: true,
    buildPayload: (data: { logs?: any[] }) => {
      const logs = data?.logs || [];
      return [
        { "Total Entries": logs.length },
        { "Error Ratio": logs.length > 0 ? logs.filter(l => l.level === 'ERROR').length / logs.length : 0 }
      ];
    }
  },
  SENSOR_PANEL: {
    id: 'SENSOR_PANEL',
    description: 'High-slot sensor panel probe.',
    expectedResponse: 'Return a structured assessment of sensor node results.',
    isDataProbe: true,
    buildPayload: (data: { results?: any }) => {
      const results = data?.results || {};
      return [
        { "Active Nodes": Object.keys(results).length },
        { "Alert Level": Object.values(results).filter((r: any) => r?.status === 'POSITIVE').length }
      ];
    }
  }
};
