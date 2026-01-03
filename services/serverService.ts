
import { launcherSystem } from './launcherService';

class ServerAuthoritativeService {
  private charges: Record<string, number> = {};

  constructor() {
    // Initialize charges for all launchers
    launcherSystem.getAll().forEach(l => {
      this.charges[l.id] = l.maxCharges;
    });
  }

  validateProbe(launcherId: string, cost: number = 1): boolean {
    const current = this.charges[launcherId] || 0;
    if (current >= cost) {
      this.charges[launcherId] -= cost;
      return true;
    }
    return false;
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
