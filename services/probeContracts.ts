
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
    description: 'Comprehensive system security probe collecting CPU, memory, disk, and network metrics. Detects anomalies, resource stress, and suspicious activity trends across all active telemetry layers.',
    expectedResponse: 'Provide a structured JSON security assessment highlighting anomalies, threat levels, and unusual resource patterns. Include CPU, memory, disk, network insights, and correlations between metrics. Keys: threat_level, anomalies, recommendations.',
    isDataProbe: true,
    buildPayload: (data: { stats: CoreStats | null, mode: OperationalMode, activeFocus: string[], platform: Platform, history?: string }) => {
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
        // Injected history if available
        historical_log_data: data.history ? data.history : undefined
      };
    }
  },
  ADAPTER_HUB: {
    id: 'ADAPTER_HUB',
    description: 'Network adapter matrix probe analyzing all active network interfaces, IP allocation, and routing states. Detects configuration inconsistencies or potential network anomalies.',
    expectedResponse: 'Generate a structured analysis of all network interfaces and their states, highlighting misconfigurations or suspicious routing patterns. Format as JSON with keys: interface_status, connection_integrity, potential_issues.',
    isDataProbe: false,
    buildPayload: (data: { stats: CoreStats | null, platform: Platform, history?: string }) => {
      const empty = checkEmpty(data.stats);
      if (empty) return { ...empty, platform: data.platform };

      return {
        probe_id: 'adapter-hub-' + Date.now(),
        context: 'NETWORK_INTERFACE_MATRIX',
        platform: data.platform,
        interfaces: data.stats?.network?.interfaces,
        connections: data.stats?.network?.connections,
        historical_metrics: data.history
      };
    }
  },
  HANDSHAKE_CORE: {
    id: 'HANDSHAKE_CORE',
    description: 'Remote handshake probe for SSH or WinRM links. Evaluates authentication credentials, connection paths, and potential security risks during bridge establishment.',
    expectedResponse: 'Return a structured verification of authentication parameters, connection reachability, and security risk assessment. Include JSON keys: authentication_valid, connection_risk, notes.',
    isDataProbe: true,
    buildPayload: (data: { ipInput: string, user: string, port: number, platform: Platform, history?: string }) => ({
      probe_id: 'handshake-probe-' + Date.now(),
      context: 'BRIDGE_ESTABLISHMENT_PROTOCOL',
      platform: data.platform,
      target: data.ipInput,
      identity: data.user,
      port_vector: data.port,
      connection_attempts_log: data.history
    })
  },
  CONSOLE_DATA_PROBE: {
    id: 'CONSOLE_DATA_PROBE',
    description: 'Interactive shell command probe capturing last executed commands. Assesses potential security impact and unusual payload behavior.',
    expectedResponse: 'Provide an analysis of the command payload including risk score, impact assessment, and potential security concerns. Format as JSON with keys: command, risk_level, impact_summary.',
    isDataProbe: false,
    buildPayload: (data: { lastCommand: string, platform: Platform, history?: string }) => ({
      probe_id: 'cmd-probe-' + Date.now(),
      context: 'INTERACTIVE_SHELL_PAYLOAD',
      platform: data.platform,
      command_raw: data.lastCommand,
      timestamp: new Date().toISOString(),
      command_history: data.history
    })
  },
  NODE_DIAGNOSTICS: {
    id: 'NODE_DIAGNOSTICS',
    description: 'Deep system diagnostics probe collecting OS kernel, hardware sensors, CPU cores, and disk partitions. Monitors thermal and performance metrics for anomalies.',
    expectedResponse: 'Return a structured hardware and OS health report highlighting CPU, disk, thermal, and sensor anomalies. Format as JSON: cpu_status, disk_status, thermal_alerts, recommendations.',
    isDataProbe: true,
    buildPayload: (data: { stats: CoreStats | null, platform: Platform, history?: string }) => {
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
        thermal_history_csv: data.history
      };
    }
  },
  PROCESS_PROBE: {
    id: 'PROCESS_PROBE',
    description: 'System process probe analyzing active processes, CPU/memory usage patterns, and potential suspicious or resource-intensive processes.',
    expectedResponse: 'Provide a structured summary of top resource-consuming processes and any suspicious behaviors. Include JSON keys: top_cpu_consumers, top_memory_consumers, process_count, alerts.',
    isDataProbe: false,
    buildPayload: (data: { processes: any, platform: Platform, history?: string }) => {
      if (!data.processes) return { status: "empty", reason: "No process data", platform: data.platform };
      return {
        probe_id: 'process-probe-' + Date.now(),
        context: 'PROCESS_TREE_SNAPSHOT',
        platform: data.platform,
        top_cpu_consumers: data.processes?.topByCpu,
        top_mem_consumers: data.processes?.topByMemory,
        process_count: data.processes?.totalProcesses,
        historical_load: data.history
      };
    }
  },
  RSSI_REPORT: {
    id: 'RSSI_REPORT',
    description: 'Wireless telemetry probe monitoring RF signal strength and spectral stability over time. Detects interference and link quality degradation.',
    expectedResponse: 'Return a JSON summary of RF signal trends and anomalies, including interference patterns and link stability. Keys: recent_samples, trend_analysis, interference_alerts.',
    isDataProbe: true,
    buildPayload: (data: { rssiData: any[], history?: string }) => ({
      probe_id: 'rf-telemetry-' + Date.now(),
      context: 'WIRELESS_SPECTRAL_DENSITY',
      samples: data.rssiData.slice(-10),
      full_history_log: data.history
    })
  },
  SESSION_ARCHIVE: {
    id: 'SESSION_ARCHIVE',
    description: 'Holistic session archive probe capturing long-term session activity and tactical persistence indicators.',
    expectedResponse: 'Provide structured analysis of session flows, persistence patterns, and operational trends. Format JSON: session_id, activity_summary, pattern_alerts.',
    isDataProbe: true,
    buildPayload: (data: { csv: string, history?: string }) => ({
      probe_id: 'session-archive-' + Date.now(),
      context: 'TACTICAL_PERSISTENCE_SNAPSHOT',
      archive_payload: data.csv,
      extended_history: data.history
    })
  },
  LOG_AUDIT: {
    id: 'LOG_AUDIT',
    description: 'Comprehensive log audit probe analyzing current log streams for anomalies and potential security events.',
    expectedResponse: 'Return a JSON analysis of log entries highlighting anomalies, unusual patterns, and event risk levels. Keys: log_summary, anomaly_count, recommendations.',
    isDataProbe: true,
    buildPayload: (data: { logs: any[], history?: string }) => ({
      probe_id: 'log-audit-' + Date.now(),
      context: 'LOG_STREAM_ANALYSIS',
      logs: data.logs.map(l => ({ msg: l.message, level: l.level, time: l.timestamp })),
      log_history: data.history
    })
  }
};
