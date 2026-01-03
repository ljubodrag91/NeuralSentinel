
import { Launcher } from '../types';

const STORAGE_KEY = 'neural_sentinel_launchers';

const DEFAULT_LAUNCHERS: Record<string, Launcher> = {
  'std-core': {
    id: 'std-core',
    type: 'core',
    name: 'Standard Core Launcher',
    description: 'NPN-STNL default issue. Balanced throughput for general auditing.',
    maxCharges: 5,
    rechargeRate: 60,
    compatibleProbes: ['GLOBAL_SYSTEM_AUDIT', 'ADAPTER_HUB', 'HANDSHAKE_CORE', 'TERMINAL_COMMAND_AUDIT', 'NODE_DIAGNOSTICS', 'PROCESS_AUDIT', 'RSSI_REPORT', 'SESSION_ARCHIVE'],
    color: '#bd00ff'
  },
  'ext-core': {
    id: 'ext-core',
    type: 'core',
    name: 'Extended Core Launcher',
    description: 'High-capacity capacitor array. Designed for sustained data-intensive probes.',
    maxCharges: 10,
    rechargeRate: 45,
    compatibleProbes: ['GLOBAL_SYSTEM_AUDIT', 'HANDSHAKE_CORE', 'NODE_DIAGNOSTICS', 'SESSION_ARCHIVE', 'RSSI_REPORT'],
    color: '#00f2ff'
  },
  'std-neural': {
    id: 'std-neural',
    type: 'neural',
    name: 'Standard Neural Link',
    description: 'Default synaptic link for contextual tooltips.',
    maxCharges: 5,
    rechargeRate: 30,
    compatibleProbes: ['*'],
    color: '#00ffd5'
  },
  'ext-neural': {
    id: 'ext-neural',
    type: 'neural',
    name: 'Extended Synaptic Array',
    description: 'Upgraded neural manifold for rapid inference bursts.',
    maxCharges: 12,
    rechargeRate: 20,
    compatibleProbes: ['*'],
    color: '#ffaa00'
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

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.launchers = JSON.parse(saved);
    } else {
      this.launchers = { ...DEFAULT_LAUNCHERS };
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.launchers));
  }

  getAll() { return Object.values(this.launchers); }
  getById(id: string) { return this.launchers[id]; }
  isOwned(id: string) { return this.ownedLaunchers.has(id); }

  // Added getActive method to fix InventoryDialog error
  getActive(type: 'core' | 'neural'): string | null {
    // In this app architecture, multiple launchers can be "active" for different panels.
    // This method returns a sensible default if needed, or null.
    return type === 'core' ? 'std-core' : 'std-neural';
  }

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

  getStoreItems() {
    return Object.values(this.launchers).filter(l => !this.ownedLaunchers.has(l.id));
  }

  unlock(id: string) {
    this.ownedLaunchers.add(id);
  }
}

export const launcherSystem = new LauncherSystem();
