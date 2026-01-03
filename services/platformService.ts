
import { Platform } from '../types';

export const platformService = {
  getPrompt(platform: Platform, user: string = 'admin'): string {
    if (platform === Platform.WINDOWS) {
      return `PS C:\\Users\\${user}>`;
    }
    return `${user}@kali:~#`;
  },

  getAdapterCommand(platform: Platform, interfaceName: string): string {
    if (platform === Platform.WINDOWS) {
      return `Get-NetAdapter -Name "${interfaceName}" | Format-List`;
    }
    return `ip a show ${interfaceName}`;
  },

  // Helper to normalize telemetry keys if backend differs, or format display strings
  formatPath(platform: Platform, path: string): string {
    if (platform === Platform.WINDOWS) {
      return path.replace(/\//g, '\\');
    }
    return path;
  },

  getSystemInfoCommand(platform: Platform): string {
    if (platform === Platform.WINDOWS) {
      return 'systeminfo';
    }
    return 'uname -a && lsb_release -a';
  }
};
