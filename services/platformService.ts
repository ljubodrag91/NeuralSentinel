
import { Platform, CoreStats } from '../types';

export const platformService = {
  detectLocalPlatform(): Platform {
    if (typeof navigator === 'undefined') {
      console.warn("[PLATFORM_DETECT] Navigator undefined. Defaulting to WINDOWS.");
      return Platform.WINDOWS;
    }
    
    const ua = navigator.userAgent.toLowerCase();
    
    // Strict detection order
    if (ua.includes('win')) return Platform.WINDOWS;
    if (ua.includes('linux') || ua.includes('x11') || ua.includes('android') || ua.includes('cros')) return Platform.LINUX;
    
    // Fallback behavior for macOS/Unknown -> Default to Windows HUD as per requirements
    console.warn(`[PLATFORM_DETECT] Ambiguous UA: "${navigator.userAgent}". Fallback to WINDOWS_HUD.`);
    return Platform.WINDOWS;
  },

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
  },

  // Simulates direct system data acquisition (Local syscalls or Remote SSH)
  // distinct from the aggregated 5050 Telemetry Service.
  generateSystemStats(platform: Platform): CoreStats {
    const isWin = platform === Platform.WINDOWS;
    const now = Date.now();
    
    // Slight randomization to simulate live sampling
    const randomLoad = () => Math.random() * 100;
    const randomTemp = () => 35 + Math.random() * 45;
    
    const interfaces: any = isWin ? {
        'Ethernet0': { 
          ipv4: ['192.168.1.104'], 
          ipv6: ['fe80::1c2a:44f3:829:5512'], 
          mac: ['AA:BB:CC:DD:EE:FF'], 
          isUp: true, 
          speed: 1000,
          rxKB: Math.random() * 450,
          txKB: Math.random() * 120,
          totalSentMB: 1452.4,
          totalRecvMB: 8442.1,
          lastActivity: new Date().toLocaleTimeString()
        },
        'Wi-Fi': { 
          ipv4: ['192.168.1.105'], 
          ipv6: [], 
          mac: ['AA:BB:CC:DD:EE:FE'], 
          isUp: false, 
          speed: 866,
          rxKB: 0,
          txKB: 0,
          totalSentMB: 212.5,
          totalRecvMB: 541.2,
          lastActivity: '12:45:01'
        },
        'vEthernet (Default Switch)': { 
          ipv4: ['172.22.144.1'], 
          ipv6: [], 
          mac: ['00:15:5D:82:11:01'], 
          isUp: true, 
          speed: 10000,
          rxKB: Math.random() * 5,
          txKB: Math.random() * 2,
          totalSentMB: 42.1,
          totalRecvMB: 12.5,
          lastActivity: new Date().toLocaleTimeString()
        },
        'Loopback Pseudo-Interface 1': { 
          ipv4: ['127.0.0.1'], 
          ipv6: ['::1'], 
          mac: [], 
          isUp: true, 
          speed: 0,
          rxKB: Math.random() * 1,
          txKB: Math.random() * 1,
          totalSentMB: 1.2,
          totalRecvMB: 1.2,
          lastActivity: new Date().toLocaleTimeString()
        }
      } : {
        'eth0': { 
          ipv4: ['192.168.1.104'], 
          ipv6: [], 
          mac: ['AA:BB:CC:DD:EE:FF'], 
          isUp: true, 
          speed: 1000,
          rxKB: Math.random() * 100,
          txKB: Math.random() * 50,
          totalSentMB: 500,
          totalRecvMB: 200,
          lastActivity: new Date().toLocaleTimeString()
        },
        'wlan0': {
          ipv4: [],
          ipv6: [],
          mac: ['AA:BB:CC:DD:EE:AA'],
          isUp: false,
          speed: 300,
          rxKB: 0,
          txKB: 0,
          totalSentMB: 10,
          totalRecvMB: 5,
          lastActivity: 'Never'
        },
        'lo': { 
          ipv4: ['127.0.0.1'], 
          ipv6: ['::1'], 
          mac: [], 
          isUp: true, 
          speed: 0,
          rxKB: 1,
          txKB: 1,
          totalSentMB: 1,
          totalRecvMB: 1,
          lastActivity: new Date().toLocaleTimeString()
        }
      };

    return {
      timestamp: now,
      datetime: new Date(now).toISOString(),
      platform: platform,
      source: 'LOCAL', 
      cpu: {
        cpuCores: 4,
        cpuCoresPhysical: 4,
        cpuFreqCurrent: 2400,
        cpuFreqMax: 2400,
        cpuLoad1: 0.5 + Math.random(),
        cpuLoad5: 0.4 + Math.random(),
        cpuLoad15: 0.3 + Math.random(),
        temperature: randomTemp(),
        usage: 10 + Math.random() * 30
      },
      memory: {
        ramTotal: 8192,
        ramUsed: 3000 + Math.random() * 500,
        ramFree: 4000,
        ramAvailable: 4500,
        usage: 40 + Math.random() * 5,
        swapTotal: 2048,
        swapUsed: 100,
        swapPercent: 5
      },
      disk: {
        rootUsage: 45,
        rootFreeGB: 120,
        rootTotalGB: 256,
        rootUsedGB: 136,
        readRateKB: Math.random() * 500,
        writeRateKB: Math.random() * 200,
        readTotalMB: 1024,
        writeTotalMB: 512,
        partitions: [
          { device: isWin ? 'C:' : '/dev/sda1', mountpoint: isWin ? 'C:\\' : '/', fstype: isWin ? 'NTFS' : 'ext4', total: 256, used: 136, free: 120, percent: 45 }
        ]
      },
      network: {
        inRateKB: Math.random() * 100,
        outRateKB: Math.random() * 50,
        inTotalMB: 500,
        outTotalMB: 200,
        connections: 12,
        packetsSent: 15000,
        packetsRecv: 20000,
        errorsIn: 0,
        errorsOut: 0,
        droppedIn: 0,
        droppedOut: 0,
        interfaces: interfaces
      },
      processes: {
        totalProcesses: 145,
        topByCpu: [
          { pid: 101, name: isWin ? 'System' : 'systemd', cpu_percent: 5.2, memory_percent: 0.5, username: isWin ? 'SYSTEM' : 'root' },
          { pid: 1240, name: isWin ? 'chrome.exe' : 'chromium', cpu_percent: 4.1, memory_percent: 12.0, username: 'user' },
          { pid: 332, name: 'node', cpu_percent: 2.0, memory_percent: 3.5, username: 'user' },
          { pid: 88, name: isWin ? 'svchost.exe' : 'kworker', cpu_percent: 1.5, memory_percent: 0.2, username: isWin ? 'SYSTEM' : 'root' }
        ],
        topByMemory: [
          { pid: 1240, name: isWin ? 'chrome.exe' : 'chromium', cpu_percent: 4.1, memory_percent: 12.0, username: 'user' },
          { pid: 332, name: 'node', cpu_percent: 2.0, memory_percent: 3.5, username: 'user' }
        ]
      },
      sensors: {
        cpu_thermal_temp1: randomTemp()
      },
      system: {
        hostname: isWin ? 'DESKTOP-SENTINEL' : 'kali-pi-node',
        osName: isWin ? 'Microsoft Windows 11 Pro' : 'Kali GNU/Linux Rolling',
        osVersion: '2024.1',
        machine: 'x86_64',
        bootTime: now - 3600000,
        uptime: 3600
      },
      rates: { sampleInterval: 1 }
    };
  }
};
