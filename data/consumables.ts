
import { Consumable } from '../types';

export const consumablesData: Consumable[] = [
  {
    "id": "std-data-ammo",
    "name": "Standard Data Payload",
    "type": "data",
    "description": "Default payload packet. Sends current panel snapshot. UNLIMITED.",
    "compatibleLaunchers": ["core"],
    "cost": 1,
    "features": ["LIVE_DATA"],
    "unlimited": true
  },
  {
    "id": "historical-data-ammo",
    "name": "Historical Probe (Extended)",
    "type": "data",
    "description": "Includes up to 24h of local CSV history for trend analysis. Stack limited.",
    "compatibleLaunchers": ["core"],
    "cost": 1,
    "features": ["LIVE_DATA", "HISTORY_CSV"],
    "maxStack": 100
  },
  {
    "id": "std-neural-ammo",
    "name": "Standard Neural Inference",
    "type": "neural",
    "description": "Lightweight context vector for UI tooltips and quick insights. UNLIMITED.",
    "compatibleLaunchers": ["neural"],
    "cost": 1,
    "features": ["INFERENCE"],
    "unlimited": true
  },
  {
    "id": "sensor-script-ammo",
    "name": "Sensor Script Packet",
    "type": "module-core",
    "description": "Automated scanning sequence. Triggers full sensor array execution in Scanner Panel.",
    "compatibleLaunchers": ["sensor-module"],
    "cost": 1,
    "features": ["AUTO_SCAN", "NODE_SEQUENCING"],
    "unlimited": true
  },
  {
    "id": "script-timer",
    "name": "Script Reload Timer",
    "type": "booster",
    "description": "Tactical high-slot module. Controls and optimizes reload cooldowns for all high-tier modules.",
    "compatibleLaunchers": ["sensor-module"],
    "cost": 1,
    "features": ["COOLDOWN_REDUCTION", "AUTO_RELOAD"],
    "maxStack": 10
  },
  {
    "id": "neural-link-bypasser",
    "name": "Neural Link Bypasser",
    "type": "booster",
    "description": "Tactical cerebral override. Bypasses all probe cooldowns for 60 minutes.",
    "compatibleLaunchers": ["main"],
    "cost": 0,
    "features": ["COOLDOWN_BYPASS", "INSTANT_RELOAD"],
    "maxStack": 5
  }
];
