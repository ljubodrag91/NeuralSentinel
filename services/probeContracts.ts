
import { OperationalMode, CoreStats, Platform } from '../types';

export interface ProbeContract {
  id: string;
  description: string;
  expectedResponse: string;
  isDataProbe: boolean;
  buildPayload: (data: any, history?: string) => any;
}

const checkEmpty = (stats: CoreStats | null) => {
  if (!stats) return { status: "empty", reason: "No data collected from panel" };
  return null;
};

export const PROBE_CONTRACTS: Record<string, ProbeContract> = {
  GLOBAL_SYSTEM_PROBE: {
    id: 'GLOBAL_SYSTEM_PROBE',
    description: 'System-wide SOC probe analyzing CPU, RAM, Network, and active telemetry focus areas.',
    expectedResponse: 'A holistic security assessment with threat level and systemic anomalies.',
    isDataProbe: true,
    buildPayload: (data: { stats: CoreStats | null, mode: OperationalMode, activeFocus: string[], platform: Platform }, history?: string) => {
      const empty = checkEmpty(data.stats);
      if (empty) return { ...empty, platform: data.platform };

      return {
        probe_id: 'global-probe-' + Date.now(),
        context: 'SOC_CONSOLIDATED_METRICS',
        operational_mode: data.mode,
        platform: data.platform,
        telemetry: {
          cpu: data.stats?.cpu,
          memory: data.stats?.memory,
          disk: data.stats?.disk,
          network_io: data.stats?.network,
          active_focus_layers: data.activeFocus
        },
        historical_probe_log: history || "NO_HISTORICAL_DATA"
      };
    }
  },
  ADAPTER_HUB: {
    id: 'ADAPTER_HUB',
    description: 'Network interface matrix probe focusing on IP allocation and adapter states.',
    expectedResponse: 'Probe of network interface integrity and potential routing anomalies.',
    isDataProbe: false,
    buildPayload: (data: { stats: CoreStats | null, platform: Platform }) => {
      const empty = checkEmpty(data.stats);
      if (empty) return { ...empty, platform: data.platform };

      return {
        probe_id: 'adapter-hub-' + Date.now(),
        context: 'NETWORK_INTERFACE_MATRIX',
        platform: data.platform,
        interfaces: data.stats?.network?.interfaces,
        connections: data.stats?.network?.connections
      };
    }
  },
  HANDSHAKE_CORE: {
    id: 'HANDSHAKE_CORE',
    description: 'SSH/WinRM handshake parameter probe for remote link establishment.',
    expectedResponse: 'Verification of authentication parameters and connection path risks.',
    isDataProbe: true,
    buildPayload: (data: { ipInput: string, user: string, port: number, platform: Platform }, history?: string) => ({
      probe_id: 'handshake-probe-' + Date.now(),
      context: 'BRIDGE_ESTABLISHMENT_PROTOCOL',
      platform: data.platform,
      target: data.ipInput,
      identity: data.user,
      port_vector: data.port,
      connection_history: history || "NO_HISTORICAL_DATA"
    })
  },
  CONSOLE_DATA_PROBE: {
    id: 'CONSOLE_DATA_PROBE',
    description: 'Security probe of the last executed or staged interactive command.',
    expectedResponse: 'Risk assessment of the command payload and impact analysis.',
    isDataProbe: false,
    buildPayload: (data: { lastCommand: string, platform: Platform }) => ({
      probe_id: 'cmd-probe-' + Date.now(),
      context: 'INTERACTIVE_SHELL_PAYLOAD',
      platform: data.platform,
      command_raw: data.lastCommand,
      timestamp: new Date().toISOString()
    })
  },
  NODE_DIAGNOSTICS: {
    id: 'NODE_DIAGNOSTICS',
    description: 'Deep-dive environmental probe of OS kernel, disk partitions, and hardware sensors.',
    expectedResponse: 'Hardware health report and kernel-level security observations.',
    isDataProbe: true,
    buildPayload: (data: { stats: CoreStats | null, platform: Platform }, history?: string) => {
      const empty = checkEmpty(data.stats);
      if (empty) return { ...empty, platform: data.platform };

      return {
        probe_id: 'node-diag-' + Date.now(),
        context: 'ENVIRONMENT_DIAGNOSTICS',
        platform: data.platform,
        system: data.stats?.system,
        cpu_cores: data.stats?.cpu?.cpuCores,
        disk_partitions: data.stats?.disk?.partitions,
        thermal_state: data.stats?.sensors?.cpu_thermal_temp1,
        thermal_history: history || "NO_HISTORICAL_DATA"
      };
    }
  },
  PROCESS_PROBE: {
    id: 'PROCESS_PROBE',
    description: 'Probe of active system processes and resource consumption patterns.',
    expectedResponse: 'Identification of suspicious processes or resource-exhaustion vectors.',
    isDataProbe: false,
    buildPayload: (data: { processes: any, platform: Platform }) => {
      if (!data.processes) return { status: "empty", reason: "No process data", platform: data.platform };
      return {
        probe_id: 'process-probe-' + Date.now(),
        context: 'PROCESS_TREE_SNAPSHOT',
        platform: data.platform,
        top_cpu_consumers: data.processes?.topByCpu,
        top_mem_consumers: data.processes?.topByMemory,
        process_count: data.processes?.totalProcesses
      };
    }
  },
  RSSI_REPORT: {
    id: 'RSSI_REPORT',
    description: 'Time-series probe of RF signal flow and spectral stability.',
    expectedResponse: 'Assessment of wireless link quality and interference patterns.',
    isDataProbe: true,
    buildPayload: (data: { rssiData: any[] }, history?: string) => ({
      probe_id: 'rf-telemetry-' + Date.now(),
      context: 'WIRELESS_SPECTRAL_DENSITY',
      samples: data.rssiData.slice(-10),
      historical_trend: history || "NO_HISTORICAL_DATA"
    })
  },
  SESSION_ARCHIVE: {
    id: 'SESSION_ARCHIVE',
    description: 'Holistic session probe for long-term tactical persistence.',
    expectedResponse: 'Analysis of session flow and detection of operational patterns.',
    isDataProbe: true,
    buildPayload: (data: { csv: string }) => ({
      probe_id: 'session-archive-' + Date.now(),
      context: 'TACTICAL_PERSISTENCE_SNAPSHOT',
      archive_payload: data.csv
    })
  },
  // Retained LOG_AUDIT as per exception requirements
  LOG_AUDIT: {
    id: 'LOG_AUDIT',
    description: 'Deep audit of the current log stream.',
    expectedResponse: 'Analysis of log patterns for security events.',
    isDataProbe: true,
    buildPayload: (data: { logs: any[] }) => ({
      probe_id: 'log-audit-' + Date.now(),
      context: 'LOG_STREAM_ANALYSIS',
      logs: data.logs.map(l => ({ msg: l.message, level: l.level, time: l.timestamp }))
    })
  }
};
