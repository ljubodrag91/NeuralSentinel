
import { Launcher, ProbeAmmunition, PanelSlotConfig } from '../types';

const STORAGE_KEY = 'neural_sentinel_launchers';

// Centralized list of panels that support historical data features
export const PANELS_SUPPORTING_HISTORY = [
  'GLOBAL_SYSTEM_PROBE',
  'HANDSHAKE_CORE',
  'ADAPTER_HUB',
  'NODE_DIAGNOSTICS',
  'PROCESS_PROBE',
  'RSSI_REPORT',
  'SESSION_ARCHIVE'
];

// Unified default configuration for all panels
export const DEFAULT_PANEL_CONFIG: Record<string, PanelSlotConfig> = {
  'GLOBAL_SYSTEM_PROBE': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'HANDSHAKE_CORE': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'ADAPTER_HUB': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'CONSOLE_DATA_PROBE': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'NODE_DIAGNOSTICS': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'PROCESS_PROBE': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'RSSI_REPORT': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'SESSION_ARCHIVE': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
  'LOG_AUDIT': { dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } },
};

export const FALLBACK_PANEL_CONFIG: PanelSlotConfig = { 
  dataSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, 
  neuralSlot: { launcherId: 'std-neural', ammoId: 'std-neural-ammo' } 
};

const DEFAULT_LAUNCHERS: Record<string, Launcher> = {
  'std-core': {
    id: 'std-core',
    type: 'core',
    name: 'Standard Core Launcher',
    description: 'NPN-STNL default issue. Balanced throughput for general probing.',
    maxCharges: 5,
    rechargeRate: 60,
    compatibleProbes: ['GLOBAL_SYSTEM_PROBE', 'ADAPTER_HUB', 'HANDSHAKE_CORE', 'CONSOLE_DATA_PROBE', 'NODE_DIAGNOSTICS', 'PROCESS_PROBE', 'RSSI_REPORT', 'SESSION_ARCHIVE', 'LOG_AUDIT'],
    color: '#bd00ff',
    tokens: 4000 // 4000 characters limit
  },
  'ext-core': {
    id: 'ext-core',
    type: 'core',
    name: 'Extended Core Launcher',
    description: 'High-capacity capacitor array. Designed for sustained data-intensive probes.',
    maxCharges: 10,
    rechargeRate: 45,
    compatibleProbes: ['GLOBAL_SYSTEM_PROBE', 'HANDSHAKE_CORE', 'NODE_DIAGNOSTICS', 'SESSION_ARCHIVE', 'RSSI_REPORT'],
    color: '#00f2ff',
    tokens: 8000 // Extended limit
  },
  'std-neural': {
    id: 'std-neural',
    type: 'neural',
    name: 'Standard Neural Link',
    description: 'Default synaptic link for contextual tooltips.',
    maxCharges: 5,
    rechargeRate: 30,
    compatibleProbes: ['*'],
    color: '#00ffd5',
    tokens: 400 // 400 tokens limit
  },
  'ext-neural': {
    id: 'ext-neural',
    type: 'neural',
    name: 'Extended Synaptic Array',
    description: 'Upgraded neural manifold for rapid inference bursts.',
    maxCharges: 12,
    rechargeRate: 20,
    compatibleProbes: ['*'],
    color: '#ffaa00',
    tokens: 800 // Extended limit
  }
};

export const PROBE_AMMUNITION: Record<string, ProbeAmmunition> = {
  'std-data-ammo': {
    id: 'std-data-ammo',
    name: 'Standard Data Payload',
    type: 'data',
    description: 'Default payload packet. Sends current panel snapshot. UNLIMITED.',
    compatibleLaunchers: ['core'],
    cost: 1,
    features: ['LIVE_DATA'],
    unlimited: true
  },
  'historical-data-ammo': {
    id: 'historical-data-ammo',
    name: 'Historical Probe (Extended)',
    type: 'data',
    description: 'Includes up to 24h of local CSV history for trend analysis. Stack limited.',
    compatibleLaunchers: ['core'],
    cost: 1,
    features: ['LIVE_DATA', 'HISTORY_CSV'],
    maxStack: 100
  },
  'thermal-data-ammo': {
    id: 'thermal-data-ammo',
    name: 'Thermal Imaging Probe',
    type: 'data',
    description: 'Experimental hardware-level thermal mapping. [COMING SOON]',
    compatibleLaunchers: ['core'],
    cost: 2,
    features: ['THERMAL_MAP'],
    disabled: true,
    maxStack: 100
  },
  'std-neural-ammo': {
    id: 'std-neural-ammo',
    name: 'Standard Neural Inference',
    type: 'neural',
    description: 'Lightweight context vector for UI tooltips and quick insights. UNLIMITED.',
    compatibleLaunchers: ['neural'],
    cost: 1,
    features: ['INFERENCE'],
    unlimited: true
  }
};

// Added exports for InventoryDialog
export const CORE_LAUNCHERS = {
  'std-core': DEFAULT_LAUNCHERS['std-core'],
  'ext-core': DEFAULT_LAUNCHERS['ext-core']
};

export const NEURAL_LAUNCHERS = {
  'std-neural': DEFAULT_LAUNCHERS['std-neural'],
  'ext-neural': DEFAULT_LAUNCHERS['ext-neural']
};

class LauncherSystem {
  private launchers: Record<string, Launcher> = {};
  private ownedLaunchers: Set<string> = new Set(['std-core', 'std-neural', 'ext-neural']);
  // Initial inventory with some default quantities
  private ownedAmmo: Record<string, number> = {
    'std-data-ammo': 999, // Placeholder for unlimited UI, logic handles true unlimited
    'historical-data-ammo': 100, // Max stack default issue
    'std-neural-ammo': 999
  };

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.launchers = parsed.launchers || { ...DEFAULT_LAUNCHERS };
      // Restore owned sets if available, else default
      if (parsed.ownedLaunchers) this.ownedLaunchers = new Set(parsed.ownedLaunchers);
      if (parsed.ownedAmmo) this.ownedAmmo = parsed.ownedAmmo;
    } else {
      this.launchers = { ...DEFAULT_LAUNCHERS };
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      launchers: this.launchers,
      ownedLaunchers: Array.from(this.ownedLaunchers),
      ownedAmmo: this.ownedAmmo
    }));
  }

  getAll() { return Object.values(this.launchers); }
  getById(id: string) { return this.launchers[id]; }
  isOwned(id: string) { return this.ownedLaunchers.has(id); }

  upsert(launcher: Launcher) {
    this.launchers[launcher.id] = launcher;
    this.ownedLaunchers.add(launcher.id); // Admin adds are automatically owned
    this.save();
  }

  delete(id: string) {
    delete this.launchers[id];
    this.save();
  }

  getCompatible(type: 'core' | 'neural') {
    return Object.values(this.launchers).filter(l => l.type === type && this.ownedLaunchers.has(l.id));
  }
  
  getCompatibleAmmo(launcherType: 'core' | 'neural') {
    return Object.values(PROBE_AMMUNITION).filter(a => a.compatibleLaunchers.includes(launcherType));
  }

  getStoreItems() {
    return Object.values(this.launchers).filter(l => !this.ownedLaunchers.has(l.id));
  }

  unlock(id: string) {
    this.ownedLaunchers.add(id);
    this.save();
  }

  // Inventory Management
  getOwnedLaunchersList() {
    return Array.from(this.ownedLaunchers).map(id => this.launchers[id]).filter(Boolean);
  }

  getOwnedAmmoList() {
    return Object.entries(this.ownedAmmo).map(([id, count]) => {
      const def = PROBE_AMMUNITION[id];
      if (!def) return null;
      return { ...def, count };
    }).filter((item): item is ProbeAmmunition & { count: number } => item !== null && (item.unlimited || item.count > 0));
  }

  adjustAmmo(id: string, amount: number) {
    const def = PROBE_AMMUNITION[id];
    if (def && def.unlimited) return;

    if (!this.ownedAmmo[id]) this.ownedAmmo[id] = 0;
    this.ownedAmmo[id] += amount;
    
    // Clamp
    if (this.ownedAmmo[id] < 0) this.ownedAmmo[id] = 0;
    if (def && def.maxStack && this.ownedAmmo[id] > def.maxStack) this.ownedAmmo[id] = def.maxStack;
    
    this.save();
  }

  hasAmmo(id: string): boolean {
    const def = PROBE_AMMUNITION[id];
    if (!def) return false;
    if (def.unlimited) return true;
    return (this.ownedAmmo[id] || 0) > 0;
  }

  deductAmmo(id: string): boolean {
    const def = PROBE_AMMUNITION[id];
    if (!def) return false;
    if (def.unlimited) return true;
    
    if ((this.ownedAmmo[id] || 0) > 0) {
      this.ownedAmmo[id]--;
      this.save();
      return true;
    }
    return false;
  }
}

export const launcherSystem = new LauncherSystem();
