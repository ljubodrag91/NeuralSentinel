
import { ToolDefinition } from './types';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'nmap-guided',
    name: 'Guided Recon Wizard',
    category: 'Reconnaissance',
    baseCommand: 'nmap',
    description: 'Guided step-by-step target assessment and port auditing.',
    parameters: [] // Guided tools use custom UI flows
  },
  {
    id: 'nmap-scan',
    name: 'Standard nmap (Raw)',
    category: 'Reconnaissance',
    baseCommand: 'nmap',
    description: 'Raw flag builder for service discovery and OS detection.',
    parameters: [
      { name: 'Target IP', flag: '', description: 'Target IP or subnet', type: 'text', value: '192.168.1.1' },
      { name: 'Service Detection', flag: '-sV', description: 'Probe open ports to determine service/version info', type: 'toggle', value: true },
      { name: 'OS Detection', flag: '-O', description: 'Enable OS detection', type: 'toggle', value: true },
      { name: 'Timing', flag: '-T4', description: 'Set timing template (0-5)', type: 'number', value: 4 }
    ]
  },
  {
    id: 'guided-deauth',
    name: 'Guided Deauthentication',
    category: 'Wireless Attacks',
    baseCommand: 'aireplay-ng',
    description: 'Tactical workflow for client disconnection and monitoring.',
    parameters: []
  },
  {
    id: 'deauth-regular',
    name: 'Standard Deauth (Raw)',
    category: 'Wireless Attacks',
    baseCommand: 'aireplay-ng',
    description: 'Manual flag builder for 802.11 management frame injection.',
    parameters: [
      { name: 'Target BSSID', flag: '-a', description: 'MAC address of the AP', type: 'text', value: 'AA:BB:CC:DD:EE:FF' },
      { name: 'Client MAC', flag: '-c', description: 'Target client MAC (optional)', type: 'text', value: '' },
      { name: 'Count', flag: '--deauth', description: 'Number of packets (0 for infinite)', type: 'number', value: 10 },
      { name: 'Interface', flag: '', description: 'Interface (positional)', type: 'text', value: 'wlan1mon' }
    ]
  },
  {
    id: 'wifite',
    name: 'Wifite Automatic',
    category: 'Wireless',
    baseCommand: 'wifite',
    description: 'Automated wireless attack tool for bulk auditing.',
    parameters: [
      { name: 'Interface', flag: '-i', description: 'Wireless interface to use', type: 'text', value: 'wlan0mon' },
      { name: 'Kill Process', flag: '--kill', description: 'Kill conflicting processes', type: 'toggle', value: true },
      { name: 'Duration', flag: '--pillage', description: 'Continue attacking until finished', type: 'toggle', value: false }
    ]
  },
  {
    id: 'gobuster-dir',
    name: 'Gobuster Directory',
    category: 'Web Enumeration',
    baseCommand: 'gobuster dir',
    description: 'Discover directories and files on websites.',
    parameters: [
      { name: 'URL', flag: '-u', description: 'Target URL', type: 'text', value: 'http://example.com' },
      { name: 'Wordlist', flag: '-w', description: 'Path to wordlist', type: 'text', value: '/usr/share/wordlists/dirb/common.txt' },
      { name: 'Threads', flag: '-t', description: 'Number of concurrent threads', type: 'number', value: 10 }
    ]
  }
];

export const MOCK_DEVICES: any[] = [
  { id: '1', name: 'PI-STATION-01', ip: '192.168.1.104', status: 'online', cpu: 12, ram: 45, temp: 42 },
  { id: '2', name: 'PI-SENTINEL-02', ip: '192.168.1.105', status: 'online', cpu: 4, ram: 30, temp: 38 },
  { id: '3', name: 'PI-MOBILE-03', ip: '192.168.1.201', status: 'offline', cpu: 0, ram: 0, temp: 0 }
];
