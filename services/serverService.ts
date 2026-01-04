
import { launcherSystem } from './launcherService';
import { ScriptState, AppSettings } from '../types';

const COOLDOWN_STORAGE_KEY = 'neural_sentinel_runtime_cooldowns';
const BROKEN_SCRIPTS_KEY = 'neural_sentinel_broken_scripts';
const CHARGES_STORAGE_KEY = 'neural_sentinel_runtime_charges';
const FAULT_STORAGE_KEY = 'neural_sentinel_launcher_faults';
const HALTED_SCRIPTS_KEY = 'neural_sentinel_halted_scripts';

interface CooldownData {
  readyAt: number;
  duration: number;
}

class ServerAuthoritativeService {
  private charges: Record<string, number> = {};
  private cooldowns: Record<string, CooldownData> = {}; 
  private brokenScripts: Set<string> = new Set(); 
  private haltedScripts: Set<string> = new Set(); 
  private faults: Record<string, string> = {}; 

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

  private loadCooldowns() {
    const saved = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          Object.keys(parsed).forEach(key => {
            if (typeof parsed[key] === 'number') {
              parsed[key] = { readyAt: parsed[key], duration: 3600000 };
            }
          });
          this.cooldowns = parsed;
        } else {
          this.cooldowns = {};
        }
      } catch (e) {
        this.cooldowns = {};
      }
    }
  }

  private saveCooldowns() {
    if (this.cooldowns) {
      localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(this.cooldowns));
    }
  }

  private loadBrokenScripts() {
    const saved = localStorage.getItem(BROKEN_SCRIPTS_KEY);
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids)) {
          this.brokenScripts = new Set(ids);
        } else {
          this.brokenScripts = new Set();
        }
      } catch (e) {
        this.brokenScripts = new Set();
      }
    }
  }

  private saveBrokenScripts() {
    if (this.brokenScripts) {
      localStorage.setItem(BROKEN_SCRIPTS_KEY, JSON.stringify(Array.from(this.brokenScripts)));
    }
  }

  private loadHaltedScripts() {
    const saved = localStorage.getItem(HALTED_SCRIPTS_KEY);
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids)) {
          this.haltedScripts = new Set(ids);
        } else {
          this.haltedScripts = new Set();
        }
      } catch (e) {
        this.haltedScripts = new Set();
      }
    }
  }

  private saveHaltedScripts() {
    if (this.haltedScripts) {
      localStorage.setItem(HALTED_SCRIPTS_KEY, JSON.stringify(Array.from(this.haltedScripts)));
    }
  }

  private loadCharges() {
    const saved = localStorage.getItem(CHARGES_STORAGE_KEY);
    if (saved) {
      try {
        const loadedCharges = JSON.parse(saved);
        if (loadedCharges && typeof loadedCharges === 'object' && !Array.isArray(loadedCharges)) {
          Object.assign(this.charges, loadedCharges);
        }
      } catch (e) {
        console.warn("Failed to load launcher charges.");
      }
    }
  }

  private saveCharges() {
    if (this.charges) {
      localStorage.setItem(CHARGES_STORAGE_KEY, JSON.stringify(this.charges));
    }
  }

  private loadFaults() {
    const saved = localStorage.getItem(FAULT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          this.faults = parsed;
        } else {
          this.faults = {};
        }
      } catch (e) {
        this.faults = {};
      }
    }
  }

  private saveFaults() {
    if (this.faults) {
      localStorage.setItem(FAULT_STORAGE_KEY, JSON.stringify(this.faults));
    }
  }

  getEffectiveMaxCharges(launcherId: string, ammoId?: string): number {
    if (!launcherId) return 0;
    const launcher = launcherSystem.getById(launcherId);
    if (!launcher) return 0;
    
    let base = launcher.maxCharges || 0;

    if (ammoId === 'script-cap-double') {
      return base * 2;
    } else if (ammoId === 'script-cap-plus2') {
      return base + 2;
    }
    
    return base;
  }

  validateProbe(launcherId: string, cost: number = 1, ammoId?: string): boolean {
    if (!launcherId) return false;
    const launcher = launcherSystem.getById(launcherId);
    if (!launcher) return false;
    
    if (launcherSystem.isBoosterActive()) return true;
    if (this.getCooldown(launcherId) > 0) return false;
    if (this.brokenScripts.has(launcherId)) return false;

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
    const launcher = launcherSystem.getById(launcherId);
    if (!launcher) return;
    const max = this.getEffectiveMaxCharges(launcherId);
    this.charges[launcherId] = Math.min(max, (this.charges[launcherId] || 0) + amount);
    this.saveCharges();
  }

  setFault(launcherId: string, error: string) {
    if (!launcherId) return;
    this.faults[launcherId] = error;
    this.saveFaults();
  }

  getFault(launcherId: string): string | null {
    if (!launcherId || !this.faults) return null;
    return this.faults[launcherId] || null;
  }

  clearFault(launcherId: string) {
    if (launcherId && this.faults && this.faults[launcherId]) {
      delete this.faults[launcherId];
      this.saveFaults();
    }
  }

  toggleHalt(launcherId: string) {
    if (!launcherId) return;
    if (this.haltedScripts.has(launcherId)) {
      this.haltedScripts.delete(launcherId);
    } else {
      this.haltedScripts.add(launcherId);
    }
    this.saveHaltedScripts();
  }

  isHalted(launcherId: string): boolean {
    if (!launcherId) return false;
    return this.haltedScripts.has(launcherId);
  }

  triggerCooldown(launcherId: string, durationMs: number) {
    if (!launcherId) return;
    this.clearFault(launcherId);
    
    if (launcherSystem.isBoosterActive()) return;

    const launcher = launcherSystem.getById(launcherId);
    let finalDuration = durationMs;

    if (launcher?.type === 'sensor-module' || launcher?.type === 'buffer-module') {
        const SENSOR_SLOT_BASE_COOLDOWN = 3600000;
        finalDuration = SENSOR_SLOT_BASE_COOLDOWN;

        if (launcherSystem.hasAmmo('script-timer')) {
            finalDuration = 60000; 
            launcherSystem.deductAmmo('script-timer');
        }
    }

    this.cooldowns[launcherId] = {
      readyAt: Date.now() + finalDuration,
      duration: finalDuration
    };
    this.saveCooldowns();
  }

  getCooldown(launcherId: string): number {
    if (!launcherId) return 0;
    if (launcherSystem.isBoosterActive()) return 0;
    const cd = this.cooldowns[launcherId];
    if (!cd) return 0;
    return Math.max(0, cd.readyAt - Date.now());
  }

  getCooldownProgress(launcherId: string): number {
    if (!launcherId) return 1;
    const cd = this.cooldowns[launcherId];
    if (!cd) return 1;
    const remaining = Math.max(0, cd.readyAt - Date.now());
    if (remaining === 0) return 1;
    return 1 - (remaining / cd.duration);
  }

  getScriptState(panelId: string, settings: AppSettings, slotType: 'sensor' | 'buffer' = 'sensor'): { state: ScriptState, reason?: string } {
    if (!settings || !settings.panelSlots) return { state: ScriptState.DISABLED, reason: 'System link uninitialized.' };
    
    const panelConfig = settings.panelSlots[panelId];
    if (!panelConfig) return { state: ScriptState.DISABLED, reason: 'Panel configuration missing.' };

    const slotConfig = slotType === 'sensor' ? panelConfig.sensorSlot : panelConfig.bufferSlot;
    const perms = settings.slotPermissions?.[panelId];
    const isPermitted = slotType === 'sensor' ? perms?.sensor : perms?.buffer;

    if (!slotConfig?.launcherId) {
      return { state: ScriptState.DISABLED, reason: `${slotType === 'sensor' ? 'Sensor' : 'Buffer'} Slot Empty: Module required.` };
    }

    if (!isPermitted) {
      return { state: ScriptState.DISABLED, reason: `${slotType === 'sensor' ? 'Sensor' : 'Buffer'} Port Blocked: Administratively restricted.` };
    }

    if (this.brokenScripts.has(slotConfig.launcherId)) {
      return { state: ScriptState.BROKEN, reason: 'Module Failure: Script payload mismatch or hardware error.' };
    }

    if (this.isHalted(slotConfig.launcherId)) {
      return { state: ScriptState.HALTED, reason: 'Module Halted: Script execution suspended by operator.' };
    }

    const cd = this.getCooldown(slotConfig.launcherId);
    if (cd > 0) {
      return { state: ScriptState.REFRESHING, reason: `Module Reloading: ${slotType === 'sensor' ? 'Sensor' : 'Buffer'} array persistent refresh active.` };
    }

    return { state: ScriptState.LOADED };
  }

  halveTierCooldowns() {
    if (!this.cooldowns) return;
    Object.keys(this.cooldowns).forEach(id => {
      const remaining = this.getCooldown(id);
      if (remaining > 0) {
        const cd = this.cooldowns[id];
        const newRemaining = remaining / 2;
        this.cooldowns[id] = {
          readyAt: Date.now() + newRemaining,
          duration: cd ? cd.duration : 60000 
        };
      }
    });
    this.saveCooldowns();
  }

  getCharges(launcherId: string, ammoId?: string): number {
    if (!launcherId) return 0;
    const max = this.getEffectiveMaxCharges(launcherId, ammoId);
    if (launcherSystem.isBoosterActive()) {
        return max;
    }
    const current = this.charges[launcherId] || 0;
    return Math.min(current, max);
  }

  recharge(launcherId: string, amount: number = 1, ammoId?: string) {
    if (!launcherId) return;
    const max = this.getEffectiveMaxCharges(launcherId, ammoId);
    this.charges[launcherId] = Math.min(max, (this.charges[launcherId] || 0) + amount);
    this.saveCharges();
  }

  initializeLauncher(launcherId: string, maxCharges: number) {
    if (launcherId && this.charges[launcherId] === undefined) {
      this.charges[launcherId] = maxCharges;
      this.saveCharges();
    }
  }

  getTierStats(launcherType: 'core' | 'neural' | 'sensor-module' | 'buffer-module', activeLaunchers: Array<{id: string, ammoId: string}>) {
    if (!Array.isArray(activeLaunchers) || activeLaunchers.length === 0) return { charges: 0, maxCharges: 5, cooldown: 0 };

    let minCharges = Infinity;
    let maxCooldown = 0;
    let maxCap = 0;

    activeLaunchers.forEach(link => {
      if (!link || !link.id) return;
      const c = this.getCharges(link.id, link.ammoId);
      const cd = this.getCooldown(link.id);
      const cap = this.getEffectiveMaxCharges(link.id, link.ammoId);
      
      if (c < minCharges) minCharges = c;
      if (cd > maxCooldown) maxCooldown = cd;
      maxCap = Math.max(maxCap, cap);
    });

    return {
      charges: minCharges === Infinity ? 0 : minCharges,
      maxCharges: maxCap,
      cooldown: maxCooldown
    };
  }
}

export const serverService = new ServerAuthoritativeService();
