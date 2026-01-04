
import { launcherSystem } from './launcherService';
import { ScriptState, AppSettings } from '../types';

const COOLDOWN_STORAGE_KEY = 'neural_sentinel_runtime_cooldowns';
const BROKEN_SCRIPTS_KEY = 'neural_sentinel_broken_scripts';
const CHARGES_STORAGE_KEY = 'neural_sentinel_runtime_charges';
const FAULT_STORAGE_KEY = 'neural_sentinel_launcher_faults';
const HALTED_SCRIPTS_KEY = 'neural_sentinel_halted_scripts';

const FAULT_AUTO_CLEAR_MS = 10000; // 10 seconds

interface CooldownData {
  readyAt: number;
  duration: number;
}

interface FaultData {
  error: string;
  timestamp: number;
}

class ServerAuthoritativeService {
  private charges: Record<string, number> = {};
  private cooldowns: Record<string, CooldownData> = {}; 
  private brokenScripts: Set<string> = new Set(); 
  private haltedScripts: Set<string> = new Set(); 
  private faults: Record<string, FaultData> = {}; 

  constructor() {
    const allLaunchers = launcherSystem.getAll();
    if (Array.isArray(allLaunchers)) {
      allLaunchers.forEach(l => {
        if (l && l.id) this.charges[l.id] = l.maxCharges;
      });
    }
    this.loadCharges();
    this.loadCooldowns();
    this.loadBrokenScripts();
    this.loadHaltedScripts();
    this.loadFaults();
  }

  private loadCharges() {
    const saved = localStorage.getItem(CHARGES_STORAGE_KEY);
    if (saved) {
      try {
        const loadedCharges = JSON.parse(saved);
        if (loadedCharges && typeof loadedCharges === 'object') {
          Object.assign(this.charges, loadedCharges);
        }
      } catch (e) {}
    }
  }

  private saveCharges() {
    localStorage.setItem(CHARGES_STORAGE_KEY, JSON.stringify(this.charges));
  }

  private loadCooldowns() {
    const saved = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (saved) {
      try { this.cooldowns = JSON.parse(saved); } catch (e) { this.cooldowns = {}; }
    }
  }

  private saveCooldowns() {
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(this.cooldowns));
  }

  private loadBrokenScripts() {
    const saved = localStorage.getItem(BROKEN_SCRIPTS_KEY);
    if (saved) {
      try { this.brokenScripts = new Set(JSON.parse(saved)); } catch (e) { this.brokenScripts = new Set(); }
    }
  }

  private saveBrokenScripts() {
    localStorage.setItem(BROKEN_SCRIPTS_KEY, JSON.stringify(Array.from(this.brokenScripts)));
  }

  private loadHaltedScripts() {
    const saved = localStorage.getItem(HALTED_SCRIPTS_KEY);
    if (saved) {
      try { this.haltedScripts = new Set(JSON.parse(saved)); } catch (e) { this.haltedScripts = new Set(); }
    }
  }

  private saveHaltedScripts() {
    localStorage.setItem(HALTED_SCRIPTS_KEY, JSON.stringify(Array.from(this.haltedScripts)));
  }

  private loadFaults() {
    const saved = localStorage.getItem(FAULT_STORAGE_KEY);
    if (saved) {
      try { this.faults = JSON.parse(saved); } catch (e) { this.faults = {}; }
    }
  }

  private saveFaults() {
    localStorage.setItem(FAULT_STORAGE_KEY, JSON.stringify(this.faults));
  }

  getEffectiveMaxCharges(launcherId: string, ammoId?: string): number {
    const launcher = launcherSystem.getById(launcherId);
    if (!launcher) return 0;
    let base = launcher.maxCharges || 0;
    if (ammoId === 'script-cap-double') return base * 2;
    if (ammoId === 'script-cap-plus2') return base + 2;
    return base;
  }

  validateProbe(launcherId: string, cost: number = 1, ammoId?: string): boolean {
    if (!launcherId) return false;
    // Auto-clear fault check on every validation attempt
    this.getFault(launcherId); 
    
    if (launcherSystem.isBoosterActive()) return true;
    if (this.getCooldown(launcherId) > 0) return false;
    if (this.faults[launcherId]) return false;

    const current = this.charges[launcherId] || 0;
    if (current >= cost) {
      this.charges[launcherId] -= cost;
      this.saveCharges();
      return true;
    }
    return false;
  }

  refundCharge(launcherId: string, amount: number = 1) {
    if (!launcherId) return;
    const max = this.getEffectiveMaxCharges(launcherId);
    this.charges[launcherId] = Math.min(max, (this.charges[launcherId] || 0) + amount);
    this.saveCharges();
  }

  setFault(launcherId: string, error: string) {
    if (!launcherId) return;
    this.faults[launcherId] = { error, timestamp: Date.now() };
    this.saveFaults();
  }

  getFault(launcherId: string): string | null {
    if (!launcherId || !this.faults[launcherId]) return null;
    const fault = this.faults[launcherId];
    if (Date.now() - fault.timestamp > FAULT_AUTO_CLEAR_MS) {
      this.clearFault(launcherId);
      return null;
    }
    return fault.error;
  }

  clearFault(launcherId: string) {
    if (launcherId && this.faults[launcherId]) {
      delete this.faults[launcherId];
      this.saveFaults();
    }
  }

  toggleHalt(launcherId: string) {
    if (!launcherId) return;
    if (this.haltedScripts.has(launcherId)) this.haltedScripts.delete(launcherId);
    else this.haltedScripts.add(launcherId);
    this.saveHaltedScripts();
  }

  isHalted(launcherId: string): boolean {
    return !!launcherId && this.haltedScripts.has(launcherId);
  }

  // Fixed: Added halveTierCooldowns method to handle buffer module effect which reduces all active cooldowns by 50%
  halveTierCooldowns() {
    const now = Date.now();
    Object.keys(this.cooldowns).forEach(id => {
      const cd = this.cooldowns[id];
      const remaining = cd.readyAt - now;
      if (remaining > 0) {
        this.cooldowns[id] = {
          ...cd,
          readyAt: now + Math.floor(remaining / 2)
        };
      }
    });
    this.saveCooldowns();
  }

  triggerCooldown(launcherId: string, durationMs: number) {
    if (!launcherId) return;
    this.clearFault(launcherId);
    if (launcherSystem.isBoosterActive()) return;
    this.cooldowns[launcherId] = { readyAt: Date.now() + durationMs, duration: durationMs };
    this.saveCooldowns();
  }

  getCooldown(launcherId: string): number {
    if (!launcherId || launcherSystem.isBoosterActive()) return 0;
    const cd = this.cooldowns[launcherId];
    if (!cd) return 0;
    return Math.max(0, cd.readyAt - Date.now());
  }

  getCooldownProgress(launcherId: string): number {
    if (!launcherId) return 1;
    const cd = this.cooldowns[launcherId];
    if (!cd) return 1;
    const remaining = Math.max(0, cd.readyAt - Date.now());
    return remaining === 0 ? 1 : 1 - (remaining / cd.duration);
  }

  getScriptState(panelId: string, settings: AppSettings, slotType: 'sensor' | 'buffer' = 'sensor'): { state: ScriptState, reason?: string } {
    if (!settings?.panelSlots) return { state: ScriptState.DISABLED, reason: 'System link uninitialized.' };
    const panelConfig = settings.panelSlots[panelId];
    if (!panelConfig) return { state: ScriptState.DISABLED };
    const slotConfig = slotType === 'sensor' ? panelConfig.sensorSlot : panelConfig.bufferSlot;
    const perms = settings.slotPermissions?.[panelId];
    const isPermitted = slotType === 'sensor' ? (perms?.sensor !== false) : (perms?.buffer !== false);

    if (!slotConfig?.launcherId) return { state: ScriptState.DISABLED, reason: 'Slot Empty.' };
    if (!isPermitted) return { state: ScriptState.DISABLED, reason: 'Restricted.' };
    if (this.getFault(slotConfig.launcherId)) return { state: ScriptState.BROKEN, reason: 'Auto-Calibrating...' };
    if (this.isHalted(slotConfig.launcherId)) return { state: ScriptState.HALTED, reason: 'Halted.' };
    const cd = this.getCooldown(slotConfig.launcherId);
    if (cd > 0) return { state: ScriptState.REFRESHING, reason: 'Reloading.' };

    return { state: ScriptState.LOADED };
  }

  getCharges(launcherId: string, ammoId?: string): number {
    if (!launcherId) return 0;
    const max = this.getEffectiveMaxCharges(launcherId, ammoId);
    if (launcherSystem.isBoosterActive()) return max;
    return Math.min(this.charges[launcherId] || 0, max);
  }

  initializeLauncher(launcherId: string, maxCharges: number) {
    if (launcherId && this.charges[launcherId] === undefined) {
      this.charges[launcherId] = maxCharges;
      this.saveCharges();
    }
  }

  getTierStats(launcherType: string, activeLaunchers: Array<{id: string, ammoId: string}>) {
    if (!activeLaunchers.length) return { charges: 0, maxCharges: 5, cooldown: 0, progress: 1 };
    let minCharges = Infinity;
    let maxCooldown = 0;
    let maxCap = 0;
    let tierProgress = 1;
    activeLaunchers.forEach(link => {
      if (!link?.id) return;
      const c = this.getCharges(link.id, link.ammoId);
      const cd = this.getCooldown(link.id);
      const cap = this.getEffectiveMaxCharges(link.id, link.ammoId);
      if (c < minCharges) minCharges = c;
      if (cd > maxCooldown) { maxCooldown = cd; tierProgress = this.getCooldownProgress(link.id); }
      maxCap = Math.max(maxCap, cap);
    });
    return { charges: minCharges === Infinity ? 0 : minCharges, maxCharges: maxCap, cooldown: maxCooldown, progress: tierProgress };
  }
}

export const serverService = new ServerAuthoritativeService();
