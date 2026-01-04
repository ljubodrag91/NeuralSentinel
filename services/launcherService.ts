
import { Launcher, Consumable, PanelSlotConfig, SlotConfig } from '../types';
import { launchersData } from '../data/launchers';
import { consumablesData } from '../data/consumables';

const STORAGE_KEY = 'neural_sentinel_launchers';

export const PANELS_SUPPORTING_HISTORY = [
  'GLOBAL_SYSTEM_PROBE',
  'HANDSHAKE_CORE',
  'ADAPTER_HUB',
  'NODE_DIAGNOSTICS',
  'PROCESS_PROBE',
  'RSSI_REPORT',
  'SESSION_ARCHIVE'
];

export const DEFAULT_GLOBAL_LOW_SLOT: SlotConfig = { 
  launcherId: 'std-neural', 
  ammoId: 'std-neural-ammo' 
};

export const DEFAULT_GLOBAL_PROBE_SLOT: SlotConfig = { 
  launcherId: 'std-core', 
  ammoId: 'std-data-ammo' 
};

export const DEFAULT_GLOBAL_SENSOR_SLOT: SlotConfig = { 
  launcherId: 'mod-std-sensor', 
  ammoId: 'script-timer' 
};

export const DEFAULT_PANEL_CONFIG: Record<string, PanelSlotConfig> = {
  'GLOBAL_SYSTEM_PROBE': { 
    probeSlot: { launcherId: 'hist-core', ammoId: 'historical-data-ammo' } 
  },
  'HANDSHAKE_CORE': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'ADAPTER_HUB': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'CONSOLE_DATA_PROBE': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'NODE_DIAGNOSTICS': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'PROCESS_PROBE': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'RSSI_REPORT': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'SESSION_ARCHIVE': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'LOG_AUDIT': { probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } },
  'SENSOR_PANEL': { 
    probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' }, 
    sensorSlot: { launcherId: 'mod-std-sensor', ammoId: 'script-timer' } 
  },
};

export const FALLBACK_PANEL_CONFIG: PanelSlotConfig = { 
  probeSlot: { launcherId: 'std-core', ammoId: 'std-data-ammo' } 
};

const LOADED_LAUNCHERS: Record<string, Launcher> = {};
launchersData.forEach(l => LOADED_LAUNCHERS[l.id] = l);

const LOADED_CONSUMABLES: Record<string, Consumable> = {};
consumablesData.forEach(c => LOADED_CONSUMABLES[c.id] = c);

export const PROBE_CONSUMABLES = LOADED_CONSUMABLES;

class LauncherSystem {
  private launchers: Record<string, Launcher> = LOADED_LAUNCHERS;
  private consumables: Record<string, Consumable> = LOADED_CONSUMABLES;
  private ownedLaunchers: Set<string> = new Set(['std-core', 'hist-core', 'std-neural', 'ext-neural', 'mod-std-sensor', 'mod-full-sensor']);
  private ownedConsumables: Record<string, number> = {
    'std-data-ammo': 999,
    'historical-data-ammo': 100,
    'std-neural-ammo': 999,
    'neural-link-bypasser': 2,
    'module-core-logic': 999,
    'script-timer': 5
  };
  private boosterEndTime: number = 0;
  private installedBoosterId: string | null = null;

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.ownedLaunchers) this.ownedLaunchers = new Set(parsed.ownedLaunchers);
      if (parsed.ownedAmmo) this.ownedConsumables = parsed.ownedAmmo;
      if (parsed.boosterEndTime) this.boosterEndTime = parsed.boosterEndTime;
      if (parsed.installedBoosterId) this.installedBoosterId = parsed.installedBoosterId;
      
      // Merge custom manifest items from storage
      if (parsed.customLaunchers) {
          Object.values(parsed.customLaunchers).forEach((l: any) => {
              this.launchers[l.id] = l;
              if (!this.ownedLaunchers.has(l.id)) this.ownedLaunchers.add(l.id);
          });
      }
      if (parsed.customConsumables) {
          Object.values(parsed.customConsumables).forEach((c: any) => this.consumables[c.id] = c);
      }
    }
  }

  private save() {
    const customLaunchers = Object.values(this.launchers).filter(l => !launchersData.find(ld => ld.id === l.id));
    const customConsumables = Object.values(this.consumables).filter(c => !consumablesData.find(cd => cd.id === c.id));

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ownedLaunchers: Array.from(this.ownedLaunchers),
      ownedAmmo: this.ownedConsumables,
      boosterEndTime: this.boosterEndTime,
      installedBoosterId: this.installedBoosterId,
      customLaunchers: Object.fromEntries(customLaunchers.map(l => [l.id, l])),
      customConsumables: Object.fromEntries(customConsumables.map(c => [c.id, c]))
    }));
  }

  getAll() { return Object.values(this.launchers); }
  getAllConsumables() { return Object.values(this.consumables); }
  getById(id: string) { return this.launchers[id]; }
  getConsumableById(id: string) { return this.consumables[id]; }
  isOwned(id: string) { return this.ownedLaunchers.has(id); }

  getCompatible(type: 'core' | 'neural' | 'sensor-module') {
    return Object.values(this.launchers).filter(l => l.type === type && this.ownedLaunchers.has(l.id));
  }
  
  getCompatibleAmmo(launcherType: 'core' | 'neural' | 'main' | 'sensor-module') {
    return Object.values(this.consumables).filter(a => a.compatibleLaunchers.includes(launcherType));
  }

  /**
   * Validates whether a panel accepts a launcher based on Tiered hierarchy.
   */
  isLauncherAllowed(panelId: string, launcherId: string): boolean {
    const launcher = this.getById(launcherId);
    if (!launcher) return false;
    
    // Tier 1 (Standard) is always allowed.
    if (!launcher.tier || launcher.tier === 1) return true;
    
    // Tier 2 (Extended) and Tier 3 (Historical) require specific panel compliance.
    return PANELS_SUPPORTING_HISTORY.includes(panelId);
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
    if (!this.ownedLaunchers.has(launcher.id)) this.ownedLaunchers.add(launcher.id);
    this.save();
  }

  upsertConsumable(consumable: Consumable) {
    this.consumables[consumable.id] = consumable;
    this.save();
  }

  delete(id: string) {
    delete this.launchers[id];
    this.ownedLaunchers.delete(id);
    this.save();
  }

  deleteConsumable(id: string) {
    delete this.consumables[id];
    this.save();
  }

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

  isBoosterActive(): boolean {
    return Date.now() < this.boosterEndTime;
  }

  getBoosterRemaining(): number {
    return Math.max(0, this.boosterEndTime - Date.now());
  }

  activateBooster(): boolean {
    if (!this.installedBoosterId) return false;
    if (this.isBoosterActive()) return false;
    if (!this.hasAmmo(this.installedBoosterId)) return false;

    this.deductAmmo(this.installedBoosterId);
    this.boosterEndTime = Date.now() + (60 * 60 * 1000); // 60 minutes
    this.save();
    return true;
  }

  installBooster(id: string) {
    this.installedBoosterId = id;
    this.save();
  }

  getInstalledBoosterId() {
    return this.installedBoosterId;
  }
}

export const launcherSystem = new LauncherSystem();
export const PROBE_AMMUNITION = PROBE_CONSUMABLES;
