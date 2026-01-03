
import { Launcher } from '../types';

export const launchersData: Launcher[] = [
  {
    "id": "std-core",
    "name": "Standard Core Launcher",
    "type": "core",
    "description": "NPN-STNL default issue. Balanced throughput for general probing.",
    "maxCharges": 5,
    "rechargeRate": 60,
    "color": "#bd00ff",
    "tokens": 4000,
    "compatibleProbes": ["GLOBAL_SYSTEM_PROBE", "ADAPTER_HUB", "HANDSHAKE_CORE", "CONSOLE_DATA_PROBE", "NODE_DIAGNOSTICS", "PROCESS_PROBE", "RSSI_REPORT", "SESSION_ARCHIVE", "LOG_AUDIT"]
  },
  {
    "id": "ext-core",
    "name": "Extended Core Launcher",
    "type": "core",
    "description": "High-capacity capacitor array. Designed for sustained data-intensive probes.",
    "maxCharges": 10,
    "rechargeRate": 45,
    "color": "#00f2ff",
    "tokens": 8000,
    "compatibleProbes": ["GLOBAL_SYSTEM_PROBE", "HANDSHAKE_CORE", "NODE_DIAGNOSTICS", "SESSION_ARCHIVE", "RSSI_REPORT"]
  },
  {
    "id": "std-neural",
    "name": "Standard Neural Link",
    "type": "neural",
    "description": "Default synaptic link for contextual tooltips.",
    "maxCharges": 5,
    "rechargeRate": 30,
    "color": "#00ffd5",
    "tokens": 400,
    "compatibleProbes": ["*"]
  },
  {
    "id": "ext-neural",
    "name": "Extended Synaptic Array",
    "type": "neural",
    "description": "Upgraded neural manifold for rapid inference bursts.",
    "maxCharges": 12,
    "rechargeRate": 20,
    "color": "#ffaa00",
    "tokens": 800,
    "compatibleProbes": ["*"]
  }
];
