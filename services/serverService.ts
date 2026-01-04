
import { launcherSystem } from './launcherService';
import { ScriptState, AppSettings } from '../types';

const COOLDOWN_STORAGE_KEY = 'neural_sentinel_runtime_cooldowns';
const BROKEN_SCRIPTS_KEY = 'neural_sentinel_broken_scripts';
const CHARGES_STORAGE_KEY = 'neural_sentinel_runtime_charges';

interface CooldownData {
  readyAt: number;
  duration: number;
}

class ServerAuthoritativeService {
  private charges: Record<string, number> = {};
  private cooldowns: Record<string, CooldownData> = {}; // timestamp when ready + original duration
  private brokenScripts: Set<string> = new Set(); // launcher IDs that are broken

  constructor() {
    // Initialize charges for all launchers from manifest
    launcherSystem.getAll().forEach(l => {
      this.charges[l.id] = l.maxCharges;
    });
    this.loadCharges();
    this.loadCooldowns();
    this.loadBrokenScripts();
  }

  private loadCooldowns() {
    const saved = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(key => {
          if (typeof parsed[key] === 'number') {
            parsed[key] = { readyAt: parsed[key], duration: 3600000 };
          }
        });
        this.cooldowns = parsed;
      } catch (e) {
        this.cooldowns = {};
      }
    }
  }

  private saveCooldowns() {
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(this.cooldowns));
  }

  private loadBrokenScripts() {
    const saved = localStorage.getItem(BROKEN_SCRIPTS_KEY);
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        this.brokenScripts = new Set(ids);
      } catch (e) {
        this.brokenScripts = new Set();
      }
    }
  }

  private saveBrokenScripts() {
    localStorage.setItem(BROKEN_SCRIPTS_KEY, JSON.stringify(Array.from(this.brokenScripts)));
  }

  private loadCharges() {
    const saved = localStorage.getItem(CHARGES_STORAGE_KEY);
    if (saved) {
      try {
        const loadedCharges = JSON.parse(saved);
        Object.assign(this.charges, loadedCharges);
      } catch (e) {
        console.warn("Failed to load launcher charges.");
      }
    }
  }

  private saveCharges() {
    localStorage.setItem(CHARGES_STORAGE_KEY, JSON.stringify(this.charges));
  }

  /**
   * Calculates dynamic capacity based on the base launcher max charges and any equipped script modifiers.
   */
  getEffectiveMaxCharges(launcherId: string, ammoId?: string): number {
    const launcher = launcherSystem.getById(launcherId);
    if (!launcher) return 0;
    
    let base = launcher.maxCharges;

    if (ammoId === 'script-cap-double') {
      return base * 2;
    } else if (ammoId === 'script-cap-plus2') {
      return base + 2;
    }
    
    return base;
  }

  validateProbe(launcherId: string, cost: number = 1, ammoId?: string): boolean {
    const launcher = launcherSystem.getById(launcherId);
    if (!launcher) return false;
    
    // Bypass check if global booster is active
    if (launcherSystem.isBoosterActive()) return true;

    // Check cooldown
    if (this.getCooldown(launcherId) > 0) return false;

    // Check broken status
    if (this.brokenScripts.has(launcherId)) return false;

    const current = this.charges[launcherId] || 0;
    if (current >= cost) {
      this.charges[launcherId] -= cost;
      this.saveCharges();
      return true;
    }
    return false;
  }

  triggerCooldown(launcherId: string, durationMs: number) {
    if (launcherSystem.isBoosterActive()) return;

    const launcher = launcherSystem.getById(launcherId);
    let finalDuration = durationMs;

    // SENSOR SLOT SCRIPT LOGIC: 1-hour standard persistent cooldown.
    if (launcher?.type === 'sensor-module') {
        const SENSOR_SLOT_BASE_COOLDOWN = 3600000; // 1 hour
        finalDuration = SENSOR_SLOT_BASE_COOLDOWN;

        // Script Reload Timer optimization: reduces 1-hour cooldown by 59 minutes (Effective 1 min).
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
    if (launcherSystem.isBoosterActive()) return 0;
    const cd = this.cooldowns[launcherId];
    if (!cd) return 0;
    return Math.max(0, cd.readyAt - Date.now());
  }

  getCooldownProgress(launcherId: string): number {
    const cd = this.cooldowns[launcherId];
    if (!cd) return 1;
    const remaining = Math.max(0, cd.readyAt - Date.now());
    if (remaining === 0) return 1;
    return 1 - (remaining / cd.duration);
  }

  getScriptState(panelId: string, settings: AppSettings): { state: ScriptState, reason?: string } {
    const slotConfig = settings.panelSlots[panelId]?.sensorSlot;
    const isPermitted = settings.slotPermissions[panelId]?.sensor;

    if (!slotConfig?.launcherId) {
      return { state: ScriptState.DISABLED, reason: 'Sensor Slot Empty: Module required.' };
    }

    if (!isPermitted) {
      return { state: ScriptState.DISABLED, reason: 'Sensor Port Blocked: Administratively restricted.' };
    }

    if (this.brokenScripts.has(slotConfig.launcherId)) {
      return { state: ScriptState.BROKEN, reason: 'Module Failure: Script payload mismatch or hardware error.' };
    }

    const cd = this.getCooldown(slotConfig.launcherId);
    if (cd > 0) {
      return { state: ScriptState.REFRESHING, reason: 'Module Reloading: Sensor array persistent refresh active.' };
    }

    return { state: ScriptState.LOADED };
  }

  halveTierCooldowns() {
    launcherSystem.getAll().forEach(l => {
      if (l.type === 'core' || l.type === 'neural') {
        const remaining = this.getCooldown(l.id);
        if (remaining > 0) {
          const cd = this.cooldowns[l.id];
          const newRemaining = remaining / 2;
          this.cooldowns[l.id] = {
            readyAt: Date.now() + newRemaining,
            duration: cd ? cd.duration : 60000 
          };
        }
      }
    });
    this.saveCooldowns();
  }

  getCharges(launcherId: string, ammoId?: string): number {
    const max = this.getEffectiveMaxCharges(launcherId, ammoId);
    if (launcherSystem.isBoosterActive()) {
        return max;
    }
    const current = this.charges[launcherId] || 0;
    return Math.min(current, max);
  }

  recharge(launcherId: string, amount: number = 1, ammoId?: string) {
    const max = this.getEffectiveMaxCharges(launcherId, ammoId);
    this.charges[launcherId] = Math.min(max, (this.charges[launcherId] || 0) + amount);
    this.saveCharges();
  }

  initializeLauncher(launcherId: string, maxCharges: number) {
    if (this.charges[launcherId] === undefined) {
      this.charges[launcherId] = maxCharges;
      this.saveCharges();
    }
  }

  /**
   * Updated to accept launcher mappings (id -> ammoId) to calculate tiered stats with script modifiers.
   */
  getTierStats(launcherType: 'core' | 'neural' | 'sensor-module', activeLaunchers: Array<{id: string, ammoId: string}>) {
    if (activeLaunchers.length === 0) return { charges: 0, maxCharges: 5, cooldown: 0 };

    let minCharges = Infinity;
    let maxCooldown = 0;
    let maxCap = 0;

    activeLaunchers.forEach(link => {
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
