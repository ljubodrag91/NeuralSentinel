
import { launcherSystem } from './launcherService';

class ServerAuthoritativeService {
  private charges: Record<string, number> = {};
  private cooldowns: Record<string, number> = {}; // timestamp when ready

  constructor() {
    // Initialize charges for all launchers
    launcherSystem.getAll().forEach(l => {
      this.charges[l.id] = l.maxCharges;
    });
  }

  validateProbe(launcherId: string, cost: number = 1): boolean {
    // Check cooldown
    if (this.getCooldown(launcherId) > 0) return false;

    const current = this.charges[launcherId] || 0;
    if (current >= cost) {
      this.charges[launcherId] -= cost;
      return true;
    }
    return false;
  }

  triggerCooldown(launcherId: string, durationMs: number) {
    this.cooldowns[launcherId] = Date.now() + durationMs;
  }

  getCooldown(launcherId: string): number {
    return Math.max(0, (this.cooldowns[launcherId] || 0) - Date.now());
  }

  getCharges(launcherId: string): number {
    return this.charges[launcherId] || 0;
  }

  recharge(launcherId: string, amount: number = 1) {
    const launcher = launcherSystem.getById(launcherId);
    if (!launcher) return;
    this.charges[launcherId] = Math.min(launcher.maxCharges, (this.charges[launcherId] || 0) + amount);
  }

  // Ensure new items added in admin are initialized
  initializeLauncher(launcherId: string, maxCharges: number) {
    if (this.charges[launcherId] === undefined) {
      this.charges[launcherId] = maxCharges;
    }
  }
}

export const serverService = new ServerAuthoritativeService();
