
import { Launcher, Consumable, PanelSlotConfig } from '../types';
import { launchersData } from '../data/launchers';
import { consumablesData } from '../data/consumables';

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

// Load Initial Data from TS
const LOADED_LAUNCHERS: Record<string, Launcher> = {};
launchersData.forEach(l => LOADED_LAUNCHERS[l.id] = l);

const LOADED_CONSUMABLES: Record<string, Consumable> = {};
consumablesData.forEach(c => LOADED_CONSUMABLES[c.id] = c);

export const PROBE_CONSUMABLES = LOADED_CONSUMABLES;

class LauncherSystem {
  private launchers: Record<string, Launcher> = LOADED_LAUNCHERS;
  private consumables: Record<string, Consumable> = LOADED_CONSUMABLES;
  private ownedLaunchers: Set<string> = new Set(['std-core', 'std-neural', 'ext-neural']);
  private ownedConsumables: Record<string, number> = {
    'std-data-ammo': 999,
    'historical-data-ammo': 100,
    'std-neural-ammo': 999
  };

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // We do not overwrite definitions from JSON, only ownership and counts
      if (parsed.ownedLaunchers) this.ownedLaunchers = new Set(parsed.ownedLaunchers);
      if (parsed.ownedAmmo) this.ownedConsumables = parsed.ownedAmmo;
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ownedLaunchers: Array.from(this.ownedLaunchers),
      ownedAmmo: this.ownedConsumables
    }));
  }

  getAll() { return Object.values(this.launchers); }
  getById(id: string) { return this.launchers[id]; }
  isOwned(id: string) { return this.ownedLaunchers.has(id); }

  getCompatible(type: 'core' | 'neural') {
    return Object.values(this.launchers).filter(l => l.type === type && this.ownedLaunchers.has(l.id));
  }
  
  getCompatibleAmmo(launcherType: 'core' | 'neural') {
    return Object.values(this.consumables).filter(a => a.compatibleLaunchers.includes(launcherType));
  }

  getStoreItems() {
    return Object.values(this.launchers).filter(l => !this.ownedLaunchers.has(l.id));
  }

  unlock(id: string) {
    this.ownedLaunchers.add(id);
    this.save();
  }

  upsert(launcher: Launcher) {
    this.launchers[launcher.id] = launcher;
    this.ownedLaunchers.add(launcher.id);
    this.save();
  }

  delete(id: string) {
    delete this.launchers[id];
    this.ownedLaunchers.delete(id);
    this.save();
  }

  // Inventory Management
  getOwnedLaunchersList() {
    return Array.from(this.ownedLaunchers).map(id => this.launchers[id]).filter(Boolean);
  }

  getOwnedConsumablesList() {
    return Object.entries(this.ownedConsumables).map(([id, count]) => {
      const def = this.consumables[id];
      if (!def) return null;
      return { ...def, count };
    }).filter((item): item is Consumable & { count: number } => item !== null && (item.unlimited || item.count > 0));
  }

  adjustAmmo(id: string, amount: number) {
    const def = this.consumables[id];
    if (def && def.unlimited) return;

    if (!this.ownedConsumables[id]) this.ownedConsumables[id] = 0;
    this.ownedConsumables[id] += amount;
    
    // Clamp
    if (this.ownedConsumables[id] < 0) this.ownedConsumables[id] = 0;
    if (def && def.maxStack && this.ownedConsumables[id] > def.maxStack) this.ownedConsumables[id] = def.maxStack;
    
    this.save();
  }

  hasAmmo(id: string): boolean {
    const def = this.consumables[id];
    if (!def) return false;
    if (def.unlimited) return true;
    return (this.ownedConsumables[id] || 0) > 0;
  }

  deductAmmo(id: string): boolean {
    const def = this.consumables[id];
    if (!def) return false;
    if (def.unlimited) return true;
    
    if ((this.ownedConsumables[id] || 0) > 0) {
      this.ownedConsumables[id]--;
      this.save();
      return true;
    }
    return false;
  }
}

export const launcherSystem = new LauncherSystem();
export const PROBE_AMMUNITION = PROBE_CONSUMABLES; 
