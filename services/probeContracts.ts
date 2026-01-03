import { OperationalMode, PiStats } from '../types';

export interface ProbeContract {
  id: string;
  description: string;
  expectedResponse: string;
  isDataProbe: boolean;
  buildPayload: (data: any, history?: string) => any;
}

export const PROBE_CONTRACTS: Record<string, ProbeContract> = {
  GLOBAL_SYSTEM_AUDIT: {
    id: 'GLOBAL_SYSTEM_AUDIT',
    description: 'System-wide SOC audit analyzing CPU, RAM, Network, and active telemetry focus areas.',
    expectedResponse: 'A holistic security assessment with threat level and systemic anomalies.',
    isDataProbe: true,
    buildPayload: (data: { stats: PiStats | null, mode: OperationalMode, activeFocus: string[] }, history?: string) => ({
      probe_id: 'global-audit-' + Date.now(),
      context: 'SOC_CONSOLIDATED_METRICS',
      operational_mode: data.mode,
      telemetry: {
        cpu: data.stats?.cpu,
        memory: data.stats?.memory,
        network_io: {
          in: data.stats?.network?.inRate,
          out: data.stats?.network?.outRate
        },
        active_focus_layers: data.activeFocus
      },
      historical_audit_log: history || "NO_HISTORICAL_DATA"
    })
  },
  ADAPTER_HUB: {
    id: 'ADAPTER_HUB',
    description: 'Network interface matrix analysis focusing on IP allocation and adapter states.',
    expectedResponse: 'Audit of network interface integrity and potential routing anomalies.',
    isDataProbe: false,
    buildPayload: (data: { stats: PiStats | null }) => ({
      probe_id: 'adapter-hub-' + Date.now(),
      context: 'NETWORK_INTERFACE_MATRIX',
      interfaces: data.stats?.network?.interfaces
    })
  },
  HANDSHAKE_CORE: {
    id: 'HANDSHAKE_CORE',
    description: 'SSH handshake parameter audit for remote link establishment.',
    expectedResponse: 'Verification of authentication parameters and connection path risks.',
    isDataProbe: true,
    buildPayload: (data: { ipInput: string, user: string, port: number }, history?: string) => ({
      probe_id: 'handshake-audit-' + Date.now(),
      context: 'BRIDGE_ESTABLISHMENT_PROTOCOL',
      target: data.ipInput,
      identity: data.user,
      port_vector: data.port,
      connection_history: history || "NO_HISTORICAL_DATA"
    })
  },
  TERMINAL_COMMAND_AUDIT: {
    id: 'TERMINAL_COMMAND_AUDIT',
    description: 'Security audit of the last executed or staged interactive bash command.',
    expectedResponse: 'Risk assessment of the command payload and impact analysis.',
    isDataProbe: false,
    buildPayload: (data: { lastCommand: string }) => ({
      probe_id: 'cmd-audit-' + Date.now(),
      context: 'INTERACTIVE_SHELL_PAYLOAD',
      command_raw: data.lastCommand,
      timestamp: new Date().toISOString()
    })
  },
  NODE_DIAGNOSTICS: {
    id: 'NODE_DIAGNOSTICS',
    description: 'Deep-dive environmental audit of OS kernel and hardware sensors.',
    expectedResponse: 'Hardware health report and kernel-level security observations.',
    isDataProbe: true,
    buildPayload: (data: PiStats | null, history?: string) => ({
      probe_id: 'node-diag-' + Date.now(),
      context: 'ENVIRONMENT_DIAGNOSTICS',
      system: data?.system,
      cpu_cores: data?.cpu?.cores,
      thermal_state: data?.cpu?.temp,
      thermal_history: history || "NO_HISTORICAL_DATA"
    })
  },
  PROCESS_AUDIT: {
    id: 'PROCESS_AUDIT',
    description: 'Analysis of active system processes and resource consumption patterns.',
    expectedResponse: 'Identification of suspicious processes or resource-exhaustion vectors.',
    isDataProbe: false,
    buildPayload: (data: any) => ({
      probe_id: 'process-audit-' + Date.now(),
      context: 'PROCESS_TREE_SNAPSHOT',
      top_cpu_consumers: data?.topByCpu,
      process_count: data?.total
    })
  },
  RSSI_REPORT: {
    id: 'RSSI_REPORT',
    description: 'Time-series analysis of RF signal flow and spectral stability.',
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
    description: 'Holistic session audit for long-term tactical persistence.',
    expectedResponse: 'Analysis of session flow and detection of operational patterns.',
    isDataProbe: true,
    buildPayload: (data: { csv: string }) => ({
      probe_id: 'session-archive-' + Date.now(),
      context: 'TACTICAL_PERSISTENCE_SNAPSHOT',
      archive_payload: data.csv
    })
  }
};