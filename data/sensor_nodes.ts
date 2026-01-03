
import { SensorNodeConfig } from '../types';

export const nodesData: SensorNodeConfig[] = [
  { "id": "BASIC_NODE", "name": "Basic_Ping_Node", "type": "SYSTEM", "enabled": true, "x": 50, "y": 50, "description": "Minimal availability check. Always active.", "anomalyCriteria": "Latency > 500ms", "noDataDefinition": "No Echo", "sensitivity": 10, "timeout": 500 },
  { "id": "NET_IFACE", "name": "Net_Interfaces", "type": "NETWORK", "enabled": true, "x": 50, "y": 15, "description": "Enumerates active network adapters.", "anomalyCriteria": "> 3 Active Adapters", "noDataDefinition": "0 Interfaces Detected", "sensitivity": 50, "timeout": 2000 },
  { "id": "DEV_TOPOLOGY", "name": "Dev_Topology", "type": "NETWORK", "enabled": true, "x": 80, "y": 30, "description": "Maps connected peer devices.", "anomalyCriteria": "> 50 Active Connections", "noDataDefinition": "No active connections", "sensitivity": 75, "timeout": 3000 },
  { "id": "SVC_DAEMON", "name": "Svc_Daemons", "type": "SYSTEM", "enabled": true, "x": 85, "y": 60, "description": "Audits running background services.", "anomalyCriteria": "Root/System services running", "noDataDefinition": "Process list unavailable", "sensitivity": 80, "timeout": 2000 },
  { "id": "OPEN_PORTS", "name": "Port_Audit", "type": "SECURITY", "enabled": true, "x": 65, "y": 85, "description": "Checks for listening ports.", "anomalyCriteria": "High Ingress Traffic", "noDataDefinition": "Traffic statistics void", "sensitivity": 60, "timeout": 4000 },
  { "id": "CPU_HEURISTICS", "name": "CPU_Heuristics", "type": "SYSTEM", "enabled": true, "x": 35, "y": 85, "description": "Analyzes CPU load spikes.", "anomalyCriteria": "Usage > 90%", "noDataDefinition": "Load = 0", "sensitivity": 40, "timeout": 1000 },
  { "id": "MEM_INTEGRITY", "name": "Mem_Integrity", "type": "SYSTEM", "enabled": true, "x": 15, "y": 60, "description": "Checks for memory leaks/swap usage.", "anomalyCriteria": "Swap Usage > 50%", "noDataDefinition": "Memory counters void", "sensitivity": 50, "timeout": 1000 },
  { "id": "DISK_IO", "name": "Disk_Anomalies", "type": "FILESYSTEM", "enabled": true, "x": 20, "y": 30, "description": "Monitors disk throughput.", "anomalyCriteria": "Root Usage > 90%", "noDataDefinition": "No disk I/O stats", "sensitivity": 70, "timeout": 2000 },
  { "id": "SYS_LOGS", "name": "Sys_Log_Parse", "type": "SYSTEM", "enabled": true, "x": 35, "y": 45, "description": "Parses system event logs.", "anomalyCriteria": "Error keywords found", "noDataDefinition": "Log stream empty", "sensitivity": 50, "timeout": 3000 },
  { "id": "PROC_ANOMALY", "name": "Proc_Anomaly", "type": "PROCESS", "enabled": true, "x": 65, "y": 45, "description": "Detects hidden/zombie processes.", "anomalyCriteria": "> 300 active tasks", "noDataDefinition": "Process table empty", "sensitivity": 60, "timeout": 2000 },
  { "id": "THERMAL_EVT", "name": "Thermal_Events", "type": "SYSTEM", "enabled": true, "x": 50, "y": 70, "description": "Monitors hardware temperature.", "anomalyCriteria": "Temp > 80°C", "noDataDefinition": "Sensor read failure", "sensitivity": 90, "timeout": 1000 }
];
