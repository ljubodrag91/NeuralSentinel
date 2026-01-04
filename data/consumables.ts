
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
    "name": "Standard Historical Probe (Extended)",
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
    "id": "script-cap-double",
    "name": "Augmented Capacity Multiplier",
    "type": "booster",
    "description": "Neural buffer script. Doubles the current capacity of the targeted low or mid slot.",
    "compatibleLaunchers": ["core", "neural", "buffer-module"],
    "cost": 0,
    "features": ["CAPACITY_MODIFIER", "X2_MULT"],
    "unlimited": true
  },
  {
    "id": "script-cap-plus2",
    "name": "Augmented Capacity Expansion",
    "type": "booster",
    "description": "Modular expansion script. Increases current capacity of the targeted slot by 2.",
    "compatibleLaunchers": ["core", "neural", "buffer-module"],
    "cost": 0,
    "features": ["CAPACITY_MODIFIER", "PLUS_2_ADD"],
    "unlimited": true
  },
  {
    "id": "sensor-script-ammo",
    "name": "Standard Sensor Packet",
    "type": "module-core",
    "description": "Automated scanning sequence. Triggers full sensor array execution in Scanner Panel.",
    "compatibleLaunchers": ["sensor-module"],
    "cost": 1,
    "features": ["AUTO_SCAN", "NODE_SEQUENCING"],
    "unlimited": true
  },
  {
    "id": "sensor-script-neural-1m",
    "name": "Automatic Neural Sync (1m)",
    "type": "module-core",
    "description": "Automated scanning sequence with Neural Integration. Scans and transmits results every 1 minute.",
    "compatibleLaunchers": ["sensor-module"],
    "cost": 1,
    "features": ["AUTO_SCAN", "NEURAL_INTEGRATION", "AUTO_TRANSMIT"],
    "unlimited": true,
    "autoInterval": 60000,
    "isNeuralIntegration": true
  },
  {
    "id": "sensor-script-neural-5m",
    "name": "Automatic Neural Sync (5m)",
    "type": "module-core",
    "description": "Automated scanning sequence with Neural Integration. Scans and transmits results every 5 minutes.",
    "compatibleLaunchers": ["sensor-module"],
    "cost": 1,
    "features": ["AUTO_SCAN", "NEURAL_INTEGRATION", "AUTO_TRANSMIT"],
    "unlimited": true,
    "autoInterval": 300000,
    "isNeuralIntegration": true
  },
  {
    "id": "sensor-script-neural-10m",
    "name": "Automatic Neural Sync (10m)",
    "type": "module-core",
    "description": "Automated scanning sequence with Neural Integration. Scans and transmits results every 10 minutes.",
    "compatibleLaunchers": ["sensor-module"],
    "cost": 1,
    "features": ["AUTO_SCAN", "NEURAL_INTEGRATION", "AUTO_TRANSMIT"],
    "unlimited": true,
    "autoInterval": 600000,
    "isNeuralIntegration": true
  },
  {
    "id": "script-timer",
    "name": "Augmented Reload Optimization",
    "type": "booster",
    "description": "Tactical high-slot module. Controls and optimizes reload cooldowns for all high-tier modules.",
    "compatibleLaunchers": ["sensor-module", "buffer-module"],
    "cost": 1,
    "features": ["COOLDOWN_REDUCTION", "AUTO_RELOAD"],
    "maxStack": 10
  },
  {
    "id": "neural-link-bypasser",
    "name": "Augmented Cerebral Override",
    "type": "booster",
    "description": "Tactical cerebral override. Bypasses all probe cooldowns for 60 minutes.",
    "compatibleLaunchers": ["main", "buffer-module"],
    "cost": 0,
    "features": ["COOLDOWN_BYPASS", "INSTANT_RELOAD"],
    "maxStack": 5
  }
];
