
import { Launcher } from '../types';

export const launchersData: Launcher[] = [
  {
    "id": "std-core",
    "name": "Standard Core Launcher",
    "type": "core",
    "tier": 1,
    "description": "Baseline tactical interface. Minimal resource impact.",
    "maxCharges": 5,
    "rechargeRate": 60,
    "color": "#bd00ff",
    "tokens": 400,
    "compatibleProbes": ["GLOBAL_SYSTEM_PROBE", "ADAPTER_HUB", "HANDSHAKE_CORE", "CONSOLE_DATA_PROBE", "NODE_DIAGNOSTICS", "PROCESS_PROBE", "RSSI_REPORT", "SESSION_ARCHIVE", "LOG_AUDIT"]
  },
  {
    "id": "ext-core",
    "name": "Extended Core Launcher",
    "type": "core",
    "tier": 2,
    "description": "High-capacity capacitor array. Optimized for deeper telemetry analysis.",
    "maxCharges": 10,
    "rechargeRate": 45,
    "color": "#00f2ff",
    "tokens": 3000,
    "compatibleProbes": ["GLOBAL_SYSTEM_PROBE", "HANDSHAKE_CORE", "NODE_DIAGNOSTICS", "SESSION_ARCHIVE", "RSSI_REPORT"]
  },
  {
    "id": "hist-core",
    "name": "Historical Core Launcher",
    "type": "core",
    "tier": 3,
    "description": "Premium forensics manifold. Includes full historical trend injection.",
    "maxCharges": 8,
    "rechargeRate": 90,
    "color": "#bd00ff",
    "tokens": 4000,
    "compatibleProbes": ["GLOBAL_SYSTEM_PROBE", "SESSION_ARCHIVE", "RSSI_REPORT"]
  },
  {
    "id": "std-neural",
    "name": "Standard Neural Link",
    "type": "neural",
    "tier": 1,
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
    "tier": 2,
    "description": "Upgraded neural manifold for rapid inference bursts.",
    "maxCharges": 12,
    "rechargeRate": 20,
    "color": "#ffaa00",
    "tokens": 800,
    "compatibleProbes": ["*"]
  },
  {
    "id": "mod-std-sensor",
    "name": "Standard Sensor Module",
    "type": "sensor-module",
    "description": "Baseline EM field intercept module. Enables standard system scanning.",
    "maxCharges": 1,
    "rechargeRate": 0,
    "color": "#14b8a6",
    "tokens": 4000,
    "compatibleProbes": ["STD_SYS_SCANNER"],
    "baseCooldown": 60000
  },
  {
    "id": "mod-full-sensor",
    "name": "Full Spectrum Module",
    "type": "sensor-module",
    "description": "Advanced heavy-duty sensor grid. Required for deep-dive forensic anomalies. triggers Neural Audit.",
    "maxCharges": 1,
    "rechargeRate": 0,
    "color": "#f97316",
    "tokens": 4000,
    "compatibleProbes": ["FULL_SPECTRUM_GRID"],
    "baseCooldown": 120000,
    "isExtended": true
  }
];
