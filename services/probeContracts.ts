
import { OperationalMode, CoreStats, Platform } from '../types';

export interface ProbeContract {
  id: string;
  description: string;
  expectedResponse: string;
  isDataProbe: boolean;
  buildPayload: (data: any, history?: string) => any;
  buildNeuroPayload?: (data: any) => any;
}

const checkEmpty = (stats: CoreStats | null) => {
  if (!stats) return { status: "empty", reason: "No data collected from panel" };
  return null;
};

export const PROBE_CONTRACTS: Record<string, ProbeContract> = {
  GLOBAL_SYSTEM_PROBE: {
    id: 'GLOBAL_SYSTEM_PROBE',
    description: 'Comprehensive system security probe collecting CPU, memory, disk, and network metrics. Merges real-time dashboard state with historical telemetry trends.',
    expectedResponse: 'Provide a structured JSON security assessment highlighting anomalies, threat levels, and unusual resource patterns. Keys: threat_level, anomalies, recommendations.',
    isDataProbe: true,
    buildPayload: (data: { stats: CoreStats | null, mode: OperationalMode, activeFocus: string[], platform: Platform, historical?: any }) => {
      return {
        probe_id: 'global-historical-probe-' + Date.now(),
        context: 'SOC_CONSOLIDATED_HISTORICAL_METRICS',
        operational_mode: data.mode,
        platform: data.platform,
        telemetry_snapshot: {
          cpu: data.stats?.cpu,
          memory: data.stats?.memory,
          disk: data.stats?.disk,
          network_io: data.stats?.network,
          active_focus_layers: data.activeFocus
        },
        historical_aggregation: data.historical
      };
    },
    buildNeuroPayload: (data: any) => ({
      labels: ["Dashboard", "Master Intelligence", "System Load", "Heuristic Buffer"],
      metadata: "Global tactical overview of all system-connected nodes and neural carrier status."
    })
  },
  ADAPTER_HUB: {
    id: 'ADAPTER_HUB',
    description: 'Network adapter matrix probe analyzing all active network interfaces, IP allocation, and routing states.',
    expectedResponse: 'Generate a structured analysis of all network interfaces and their states. Keys: interface_status, connection_integrity, potential_issues.',
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
    },
    buildNeuroPayload: (data: any) => ({
      labels: ["Adapters", "Matrix", "IP allocation", "Interface state"],
      metadata: "Detailed mapping of hardware network interfaces and virtual bridge connectors."
    })
  },
  HANDSHAKE_CORE: {
    id: 'HANDSHAKE_CORE',
    description: 'Remote handshake probe for SSH or WinRM links.',
    expectedResponse: 'Return a structured verification of authentication parameters and security risk assessment. Keys: authentication_valid, connection_risk, notes.',
    isDataProbe: true,
    buildPayload: (data: { ipInput: string, user: string, port: number, platform: Platform, history?: string }) => ({
      probe_id: 'handshake-probe-' + Date.now(),
      context: 'BRIDGE_ESTABLISHMENT_PROTOCOL',
      platform: data.platform,
      target: data.ipInput,
      identity: data.user,
      port_vector: data.port,
      connection_attempts_log: data.history
    }),
    buildNeuroPayload: (data: any) => ({
      labels: ["Node handshake", "Authentication vector", "Path validation"],
      metadata: "Heuristic evaluation of remote node authorization and path encryption integrity."
    })
  },
  CONSOLE_DATA_PROBE: {
    id: 'CONSOLE_DATA_PROBE',
    description: 'Interactive shell command probe capturing last executed commands.',
    expectedResponse: 'Provide an analysis of the command payload including risk score and impact assessment. Keys: command, risk_level, impact_summary.',
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
    description: 'Deep system diagnostics probe collecting OS kernel, hardware sensors, and disk partitions.',
    expectedResponse: 'Return a structured hardware and OS health report. Keys: cpu_status, disk_status, thermal_alerts, recommendations.',
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
    },
    buildNeuroPayload: (data: any) => ({
      labels: ["Kernal Audit", "Hardware Sensors", "Volume Integrity"],
      metadata: "Low-level system integrity audit focused on kernel stability and physical sensor health."
    })
  },
  PROCESS_PROBE: {
    id: 'PROCESS_PROBE',
    description: 'System process probe analyzing active processes and resource consumption patterns.',
    expectedResponse: 'Provide a structured summary of top resource-consuming processes. Keys: top_cpu_consumers, top_memory_consumers, process_count, alerts.',
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
    },
    buildNeuroPayload: (data: any) => ({
      labels: ["Task Tree", "Resource Allocation", "Process PID Matrix"],
      metadata: "In-memory process auditing designed to identify rogue tasks and resource-stealing daemons."
    })
  },
  RSSI_REPORT: {
    id: 'RSSI_REPORT',
    description: 'Wireless telemetry probe monitoring RF signal strength and spectral stability.',
    expectedResponse: 'Return a JSON summary of RF signal trends and anomalies. Keys: recent_samples, trend_analysis, interference_alerts.',
    isDataProbe: true,
    buildPayload: (data: { rssiData: any[], history?: string }) => ({
      probe_id: 'rf-telemetry-' + Date.now(),
      context: 'WIRELESS_SPECTRAL_DENSITY',
      samples: data.rssiData.slice(-10),
      full_history_log: data.history
    }),
    buildNeuroPayload: (data: any) => ({
      labels: ["RF Signal", "Spectrum Stability", "Noise Floor"],
      metadata: "Radio Frequency spectral analysis evaluating wireless signal-to-noise ratios and link quality."
    })
  },
  SESSION_ARCHIVE: {
    id: 'SESSION_ARCHIVE',
    description: 'Holistic session archive probe capturing long-term session activity.',
    expectedResponse: 'Provide structured analysis of session flows and operational trends. Keys: session_id, activity_summary, pattern_alerts.',
    isDataProbe: true,
    buildPayload: (data: { csv: string, history?: string }) => ({
      probe_id: 'session-archive-' + Date.now(),
      context: 'TACTICAL_PERSISTENCE_SNAPSHOT',
      archive_payload: data.csv,
      extended_history: data.history
    }),
    buildNeuroPayload: (data: any) => ({
      labels: ["Action Log", "Operational Flow", "Encrypted Archive"],
      metadata: "Persistence-based review of all user-initiated tactical actions and system-triggered events."
    })
  },
  LOG_AUDIT: {
    id: 'LOG_AUDIT',
    description: 'Comprehensive log audit probe analyzing current log streams for anomalies.',
    expectedResponse: 'Return a JSON analysis of log entries highlighting anomalies. Keys: log_summary, anomaly_count, recommendations.',
    isDataProbe: true,
    buildPayload: (data: { logs: any[], history?: string }) => ({
      probe_id: 'log-audit-' + Date.now(),
      context: 'LOG_STREAM_ANALYSIS',
      logs: data.logs.map(l => ({ msg: l.message, level: l.level, time: l.timestamp })),
      log_history: data.history
    }),
    buildNeuroPayload: (data: any) => ({
      labels: ["Event Streams", "Neural Audit", "Anomaly Detection"],
      metadata: "Syntactic analysis of system log streams searching for suspicious string patterns and error spikes."
    })
  },
  SENSOR_PANEL: {
    id: 'SENSOR_PANEL',
    description: 'High-slot sensor panel probe auditing the hardware intercept manifold and active sensor node grid.',
    expectedResponse: 'Return a structured assessment of sensor node results and grid-level anomalies. Keys: grid_status, anomaly_clusters, node_reliability.',
    isDataProbe: true,
    buildPayload: (data: { results: any, platform: Platform }) => ({
      probe_id: 'sensor-grid-probe-' + Date.now(),
      context: 'HARDWARE_INTERCEPT_MANIFOLD',
      platform: data.platform,
      active_node_results: data.results
    }),
    buildNeuroPayload: (data: any) => ({
      labels: ["EM Intercept", "Sensor Grid", "Manifold State"],
      metadata: "Heuristic scan of the EM field intercept layer and active hardware sensor grid nodes."
    })
  }
};
