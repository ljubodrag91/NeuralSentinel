
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
    "id": "thermal-data-ammo",
    "name": "Thermal Imaging Probe",
    "type": "data",
    "description": "Experimental hardware-level thermal mapping. [COMING SOON]",
    "compatibleLaunchers": ["core"],
    "cost": 2,
    "features": ["THERMAL_MAP"],
    "disabled": true,
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
  }
];
