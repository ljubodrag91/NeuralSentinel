import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OperationalMode, SessionInfo, LogEntry, LogLevel, LogType, PiStats, AIProvider, AIConfig, AppSettings, SmartTooltipData, Timeframe } from './types';
import Dashboard from './components/Dashboard';
import PiStatsView from './components/PiStatsView';
import TelemetryGraphs from './components/TelemetryGraphs';
import Toolkit from './components/Toolkit';
import History from './components/History';
import NeuralCore from './components/NeuralCore';
import Modal from './components/common/Modal';
import Tooltip from './components/common/Tooltip';
import BrainIcon from './components/common/BrainIcon';
import { fetchSmartTooltip, performNeuralProbe, testAiAvailability } from './services/aiService';
import { APP_CONFIG } from './services/config';

const ASCII_FROG = `
⠀⠀⢀⣠⠤⠶⠖⠒⠒⠶⠦⠤⣄⠀⠀⠀⣀⡤⠤⠤⠤⠤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⣦⠞⠁⠀⠀⠀⠀⠀⠀⠉⠳⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⡾⠁⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣘⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⡴⠚⠉⠁⠀⠀⠀⠀⠈⠉⠙⠲⣄⣤⠤⠶⠒⠒⠲⠦⢤⣜⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⡄⠀⠀⠀⠀⠀⠀⠀⠉⠳⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⠹⣆⠀⠀⠀⠀⠀⠀⣀⣀⣀⣹⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⠞⣉⣡⠤⠴⠿⠗⠳⠶⣬⣙⠓⢦⡈⠙⢿⡀⠀⠀⢀⣼⣿⣿⣿⣿⣿⡿⣷⣤⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣾⣡⠞⣁⣀⣀⣀⣠⣤⣤⣤⣄⣭⣷⣦⣽⣦⡀⢻⡄⠰⢟⣥⣾⣿⣏⣉⡙⠓⢦⣻⠃⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠉⠉⠙⠻⢤⣄⣼⣿⣽⣿⠟⠻⣿⠄⠀⠀⢻⡝⢿⡇⣠⣿⣿⣻⣿⠿⣿⡉⠓⠮⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢦⡈⠛⠿⣾⣿⣶⣾⡿⠀⠀⠀⢀⣳⣘⢻⣇⣿⣿⣽⣿⣶⾃⣀⡴⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠙⠲⠤⢄⣈⣉⣙⣓⣒⣒⣚⣉⣥⠟⠀⢯⣉⡉⠉⠉⠛⢉⣉⣡⡾⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣠⣤⡤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡿⠋⠀⠀⠀⠀⠈⠻⣍⠉⠀⠺⠿⠋⠙⣦⠀⠀⠀⠀⠀⠀⠀
⠀⣀⣥⣤⠴⠆⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⠖⠋⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⠀⠀⠀⠀⠀⢸⣧⠀⠀⠀⠀⠀⠀
⠸⢫⡟⠙⣛⠲⠤⣄⣀⣀⠀⠈⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠏⣨⠇⠀⠀⠀⠀⠀
⠀⠀⠻⢦⣈⠓⠶⠤⣄⣉⠉⠉⠛⠒⠲⠦⠤⠤⣤⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣠⠴⢋⡴⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠉⠓⠦⣄⡀⠈⠙⠓⠒⠶⠶⠶⠶⠤⣤⣀⣀⣀⣀⣀⣉⣉⣉⣉⣉⣀⣠⠴⠋⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠓⠦⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠙⠛⠒⠒⠒⠒⠒⠤⠤⠤⠒⠒⠒⠒⠒⠒⚉⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠴⚛⠛ⳤ⣤⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠚⠁⠀⠀⠀⠀⠘⠲⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠋⠙⢷⡋⢙⡇⢀⡴⢒⡿⢶⣄⡴⠀⠙⠳⣄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢦⡀⠈⠛⢻⠛⢉⡴⣋⡴⠟⠁⠀⠀⠀⠀⠈⢧⡀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡄⠀⠘⣶⢋⡞⠁⠀⠀⢀⡴⠂⠀⠀⠀⠀⠹⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠈⠻⢦⡀⠀⣰5⠀⠀⢀⡴⠂⢀⡄⠙⣆⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⢷⡄⠀⠀⠀⠀⠉⠙⠯⠀⠀⡴⠋⠀⢠⠟⠀⠀⢹⡄
`;

const App: React.FC = () => {
  const loadSettings = (): AppSettings => {
    const saved = localStorage.getItem('neural_sentinel_settings');
    if (saved) return JSON.parse(saved);
    return {
      showAsciiBg: true,
      globalDistortion: true,
      panelDistortion: true,
      pollInterval: 3000,
      timeframe: '1m',
      frogInterval: 10000,
      frogColor: '#22c55e',
      frogIntensity: 0.1,
      coreRechargeRate: 60,
      neuralRechargeRate: 30,
      maxCoreCharges: 5,
      maxNeuralCharges: 5
    };
  };

  const [mode, setMode] = useState<OperationalMode>(OperationalMode.SIMULATED);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telemetry' | 'toolkit' | 'pi_stats' | 'history'>('dashboard');
  const [activeLogTab, setActiveLogTab] = useState<LogType>('neural');
  const [unreadLogs, setUnreadLogs] = useState<Record<LogType, boolean>>({ neural: false, console: false, kernel: false, system: false });
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [isFrogVisible, setIsFrogVisible] = useState(false);
  const [latestCoreProbeResult, setLatestCoreProbeResult] = useState<any>(null);
  const [neuralNodeActive, setNeuralNodeActive] = useState(true);
  const [piLinkActive, setPiLinkActive] = useState(true);
  const [aiLinkStable, setAiLinkStable] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'error' | 'info'} | null>(null);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [activeTelemetry, setActiveTelemetry] = useState<Set<string>>(new Set(['cpu', 'ram', 'net', 'disk']));
  
  const [coreCharges, setCoreCharges] = useState(settings.maxCoreCharges);
  const [neuralCharges, setNeuralCharges] = useState(settings.maxNeuralCharges);
  const [coreReloadProgress, setCoreReloadProgress] = useState(0);
  const [neuralReloadProgress, setNeuralReloadProgress] = useState(0);

  const [session, setSession] = useState<SessionInfo>({
    id: Math.random().toString(36).substring(7).toUpperCase(),
    startTime: new Date().toISOString(),
    mode: OperationalMode.SIMULATED,
    targetIp: null,
    status: 'IDLE'
  });

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: AIProvider.GEMINI,
    endpoint: 'http://localhost:1234/v1',
    model: APP_CONFIG.DEFAULT_MODEL,
    fallbackToLocal: false
  });

  const [piStats, setPiStats] = useState<PiStats | null>(null);
  const [neuralLogs, setNeuralLogs] = useState<LogEntry[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [kernelLogs, setKernelLogs] = useState<LogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [tooltipData, setTooltipData] = useState<SmartTooltipData | null>(null);
  const [neuralProbeResult, setNeuralProbeResult] = useState<{title: string, data: any} | null>(null);
  const [processingId, setProcessingId] = useState<string | undefined>(undefined);

  const addLog = useCallback((msg: string, level: LogLevel = LogLevel.INFO, type: LogType = 'neural', metadata?: any) => {
    const entry = {
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: msg,
      source: mode,
      metadata
    };
    if (type === 'neural') setNeuralLogs(prev => [entry, ...prev].slice(0, 100));
    else if (type === 'console') setConsoleLogs(prev => [entry, ...prev].slice(0, 100));
    else if (type === 'kernel') setKernelLogs(prev => [entry, ...prev].slice(0, 100));
    else if (type === 'system') setSystemLogs(prev => [entry, ...prev].slice(0, 100));
    if (activeLogTab !== type) setUnreadLogs(prev => ({ ...prev, [type]: true }));
  }, [mode, activeLogTab]);

  // Periodic Kernel/System Log Generation (Simulated)
  useEffect(() => {
    if (mode === OperationalMode.SIMULATED) {
      const kernelInterval = setInterval(() => {
        const events = [
          "[   10.2341] cfg80211: Loading compiled-in X.509 certs",
          "[   11.5512] usb 1-1.2: new high-speed USB device number 3 using dwc_otg",
          "[   12.8900] brcmfmac: brcmf_c_preinit_dcmds: Firmware: BCM4345/6 wl0: Oct 22 2019",
          "[   15.1123] IPv6: ADDRCONF(NETDEV_UP): wlan0: link is not ready",
          "[   18.4521] random: 7 urandom warning(s) missed due to ratelimiting",
          "[   22.9981] EXT4-fs (mmcblk0p2): mounted filesystem with ordered data mode"
        ];
        addLog(events[Math.floor(Math.random() * events.length)], LogLevel.SYSTEM, 'kernel');
      }, 8000);

      const systemInterval = setInterval(() => {
        const events = [
          "sshd[1241]: Accepted password for kali from 192.168.1.104 port 22 ssh2",
          "systemd[1]: Starting Network Manager Script Dispatcher Service...",
          "NetworkManager[552]: <info> [162123451] device (wlan0): state change: disconnected -> prepare",
          "dhcpcd[612]: wlan0: carrier acquired",
          "avahi-daemon[512]: Registering new address record for 192.168.1.104 on wlan0.IPv4.",
          "systemd[1]: Finished Flush Journal to Persistent Storage."
        ];
        addLog(events[Math.floor(Math.random() * events.length)], LogLevel.INFO, 'system');
      }, 12000);

      return () => {
        clearInterval(kernelInterval);
        clearInterval(systemInterval);
      };
    }
  }, [mode, addLog]);

  // Sync charges if max decreases
  useEffect(() => {
    if (coreCharges > settings.maxCoreCharges) setCoreCharges(settings.maxCoreCharges);
    if (neuralCharges > settings.maxNeuralCharges) setNeuralCharges(settings.maxNeuralCharges);
  }, [settings.maxCoreCharges, settings.maxNeuralCharges, coreCharges, neuralCharges]);

  useEffect(() => {
    const tick = 500;
    const reloadInterval = setInterval(() => {
      setCoreReloadProgress(prev => {
        if (coreCharges >= settings.maxCoreCharges) return 0;
        if (prev >= 100) {
          setCoreCharges(prevC => Math.min(settings.maxCoreCharges, prevC + 1));
          return 0;
        }
        return prev + (100 / (settings.coreRechargeRate * (1000 / tick)));
      });
      setNeuralReloadProgress(prev => {
        if (neuralCharges >= settings.maxNeuralCharges) return 0;
        if (prev >= 100) {
          setNeuralCharges(prevN => Math.min(settings.maxNeuralCharges, prevN + 1));
          return 0;
        }
        return prev + (100 / (settings.neuralRechargeRate * (1000 / tick)));
      });
    }, tick);
    return () => clearInterval(reloadInterval);
  }, [settings.coreRechargeRate, settings.neuralRechargeRate, settings.maxCoreCharges, settings.maxNeuralCharges, coreCharges, neuralCharges]);

  useEffect(() => {
    localStorage.setItem('neural_sentinel_settings', JSON.stringify(settings));
  }, [settings]);

  const checkAi = useCallback(async () => {
    if (!neuralNodeActive) {
      setAiLinkStable(false);
      return;
    }
    try {
      const stable = await testAiAvailability(aiConfig);
      setAiLinkStable(stable);
    } catch (e) {
      setAiLinkStable(false);
      if (aiConfig.provider === AIProvider.LOCAL) {
        setNotification({ msg: "LOCAL_AI_SYNC_FAILED: Check endpoint connectivity.", type: 'error' });
      }
    }
  }, [neuralNodeActive, aiConfig]);

  useEffect(() => {
    checkAi();
    const t = setInterval(checkAi, 15000);
    return () => clearInterval(t);
  }, [checkAi]);

  useEffect(() => {
    if (!settings.showAsciiBg) {
      setIsFrogVisible(false);
      return;
    }
    const timer = setInterval(() => {
      setIsFrogVisible(true);
      setTimeout(() => setIsFrogVisible(false), 5000);
    }, settings.frogInterval);
    return () => clearInterval(timer);
  }, [settings.showAsciiBg, settings.frogInterval]);

  const runCommand = useCallback((cmd: string) => {
    addLog(`$ ${cmd}`, LogLevel.COMMAND, 'console');
    setTimeout(() => {
      addLog(`[OK] Task transmitted to node buffer.`, LogLevel.SUCCESS, 'console');
    }, 400);
  }, [addLog]);

  const handleLogAction = (log: LogEntry) => {
    if (log.metadata && log.metadata.type === 'PROBE_RESULT') {
      setNeuralProbeResult({ title: log.metadata.title, data: log.metadata.data });
    } else {
      handleBrainRequest(log.id, 'Log_Entry', { message: log.message, timestamp: log.timestamp });
    }
  };

  const fetchStats = useCallback(async (ip: string) => {
    if (!piLinkActive) return;
    try {
      const res = await fetch(`http://${ip}:5050/stats`);
      if (res.ok) {
        const data = await res.json();
        setPiStats(data);
      }
    } catch (e) {}
  }, [piLinkActive]);

  useEffect(() => {
    const intervalTime = settings.pollInterval;
    const timer = setInterval(() => {
      if (mode === OperationalMode.SIMULATED) {
        if (!piLinkActive) {
          setPiStats(null);
          return;
        }
        setPiStats({
          cpu: { usage: 5 + Math.random() * 20, temp: 38 + Math.random() * 10, load: [0.5, 0.4, 0.3] },
          system: { hostname: 'SIM-SENTINEL', uptime: 3600, osName: 'Kali Linux' },
          memory: { usage: 20 + Math.random() * 10, used: 1.2, total: 8, available: 6.8 },
          disk: { rootUsage: 15, readRate: 1.2, writeRate: 0.8 },
          network: { inRate: 10, outRate: 5, interfaces: { wlan0: { up: true, ip: '192.168.1.104', rx: 0, tx: 0 } } },
          processes: { topByCpu: [{ pid: 1234, name: 'nmap', cpu_percent: 12.5 }, { pid: 5678, name: 'msfconsole', cpu_percent: 8.2 }], total: 102, topByMemory: [] }
        });
      } else if (session.targetIp) {
        fetchStats(session.targetIp);
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, [mode, session.targetIp, settings.pollInterval, fetchStats, piLinkActive]);

  const handleHandshake = (ip: string, user: string, pass: string, port: number) => {
    if (processingId) return; 
    setProcessingId('HANDSHAKE_CORE');
    setTimeout(() => {
      setSession(s => ({ ...s, targetIp: ip, status: 'ACTIVE' }));
      setProcessingId(undefined);
      addLog(`BRIDGE: Established link with ${ip}`, LogLevel.SUCCESS);
    }, 1000);
  };

  const handleNeuralProbe = async (panelName: string, metrics: any) => {
    if (processingId) return;
    if (coreCharges <= 0) {
      setNotification({ msg: "Module has run out of charges", type: 'error' });
      return;
    }
    if (!neuralNodeActive || !aiLinkStable) {
      addLog("PROBE_FAIL: Neural Node inactive or void link.", LogLevel.ERROR);
      setNotification({ msg: "PROBE_VOID: Establish stable neural link first.", type: 'info' });
      return;
    }
    
    setCoreCharges(prev => prev - 1);
    setProcessingId(panelName);
    setIsAnalyzing(true);
    try {
      const payload = { ...metrics };
      if (panelName === 'GLOBAL_SYSTEM_AUDIT') {
        payload.activeFocus = Array.from(activeTelemetry);
      }
      const result = await performNeuralProbe(aiConfig, panelName, payload, { sessionId: session.id, mode });
      if (panelName === 'GLOBAL_SYSTEM_AUDIT') setLatestCoreProbeResult(result);
      else setNeuralProbeResult({ title: panelName, data: result });
      addLog(`Probe completed: ${panelName}`, LogLevel.SUCCESS, 'neural', { type: 'PROBE_RESULT', title: panelName, data: result });
    } catch (e) {
      addLog(`Neural probe failure.`, LogLevel.ERROR);
    } finally {
      setIsAnalyzing(false);
      setProcessingId(undefined);
    }
  };

  const handleBrainRequest = async (id: string, type: string, metrics: any) => {
    if (processingId) return;
    if (neuralCharges <= 0) {
      setNotification({ msg: "Module has run out of charges", type: 'error' });
      return;
    }
    if (!neuralNodeActive || !aiLinkStable) return;
    
    setNeuralCharges(prev => prev - 1);
    setProcessingId(id);
    try {
      const data = await fetchSmartTooltip(aiConfig, { elementId: id, elementType: type, metrics }, { sessionId: session.id, mode });
      setTooltipData(data);
    } catch (e) {} finally {
      setProcessingId(undefined);
    }
  };

  const handleSetActiveLogTab = useCallback((tab: LogType) => {
    setActiveLogTab(tab);
    setUnreadLogs(prev => ({ ...prev, [tab]: false }));
  }, []);

  const handleLogProbe = () => {
    if (processingId) return;
    const selected = window.getSelection()?.toString();
    const logs = activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogs : systemLogs;
    if (selected && selected.trim().length > 0) {
      handleNeuralProbe(`HIGHLIGHTED_${activeLogTab.toUpperCase()}_LOGS`, { selection: selected });
    } else {
      const logDump = logs.slice(0, 20).map(l => `[${l.timestamp}] ${l.message}`).join('\n');
      handleNeuralProbe(`${activeLogTab.toUpperCase()}_LOGS`, { recentLogs: logDump });
    }
  };

  const handleLogBrainRequest = () => {
    if (processingId) return;
    const logs = activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogs : systemLogs;
    const recentLogsSnippet = logs.slice(0, 10).map(l => `[${l.timestamp}] ${l.message}`).join('\n');
    handleBrainRequest(`LOG_CHANNEL_${activeLogTab.toUpperCase()}`, 'Tactical Log Stream', { 
        channel: activeLogTab,
        description: `This is a smart breakdown of the ${activeLogTab} log channel activity.`,
        recentLogsSnippet 
    });
  };

  const handleTestLocal = async () => {
    setIsTestingLocal(true);
    const stable = await testAiAvailability(aiConfig);
    setAiLinkStable(stable);
    setIsTestingLocal(false);
    if (!stable) setNotification({ msg: "TEST_FAILED: Local node unresponsive.", type: 'error' });
    else setNotification({ msg: "TEST_SUCCESS: Local link established.", type: 'info' });
  };

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const currentAccent = mode === OperationalMode.REAL ? '#22c55e' : '#00f2ff';

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${mode === OperationalMode.REAL ? 'mode-real' : 'mode-sim'} ${settings.globalDistortion ? 'crt-flicker-slow' : ''}`}>
      <header className="h-24 border-b border-[#1a1e24] bg-[#050608] px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-10">
          <NeuralCore state={mode === OperationalMode.REAL ? (session.targetIp ? 'connected' : 'disconnected') : 'simulated'} />
          <div className="border-l border-zinc-900 pl-8 h-12 flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-[0.6em] text-white uppercase chromatic-aberration">Neural Sentinel</h1>
            <div className="flex gap-6 mt-1 items-center">
              <span className={`text-[10px] font-black uppercase tracking-widest`} style={{ color: currentAccent }}>{mode} PROTOCOL</span>
              <div className="flex gap-4 ml-4">
                <Tooltip name="NEURAL_NODE" source={aiLinkStable ? (aiConfig.provider === AIProvider.GEMINI ? 'GEMINI' : 'LOCAL') : 'OFFLINE'} desc="Neural intelligence processing status. Click to manually override.">
                  <div onClick={() => setNeuralNodeActive(!neuralNodeActive)} className={`w-4 h-4 rounded-full border border-black cursor-pointer transition-all ${neuralNodeActive ? (aiLinkStable ? 'bg-purple-500 glow-purple' : 'bg-purple-950 animate-pulse') : 'bg-zinc-900 manual-disabled'}`}></div>
                </Tooltip>
                <Tooltip name="PI_LINK" source={piStats ? 'CONNECTED' : 'OFFLINE'} desc="Remote Raspberry Pi service status. Click to manually override.">
                  <div onClick={() => setPiLinkActive(!piLinkActive)} className={`w-4 h-4 rounded-full border border-black cursor-pointer transition-all ${piLinkActive ? (piStats ? 'bg-teal-500 glow-teal' : 'bg-teal-950 animate-pulse') : 'bg-zinc-900 manual-disabled'}`}></div>
                </Tooltip>
              </div>
              {piStats && <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-l border-zinc-900 pl-4">KALI@{piStats?.system?.hostname || 'PENDING'}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12 flex-1 justify-center px-10">
          {/* Core Probe Launcher (Purple) */}
          <div className="flex flex-col items-center gap-1 bg-black/30 p-2 border border-zinc-900/50 rounded-sm">
            <div className="flex gap-1.5">
              {[...Array(settings.maxCoreCharges)].map((_, i) => (
                <div key={i} className={`w-2 h-7 border transition-all duration-500 ${i < coreCharges ? 'bg-purple-500 border-purple-400 glow-purple' : 'bg-zinc-900 border-zinc-800'}`} style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}></div>
              ))}
            </div>
            <div className="w-full h-[1px] bg-zinc-900 relative overflow-hidden">
              <div className="absolute h-full bg-purple-500 transition-all duration-500" style={{ width: `${coreReloadProgress}%` }}></div>
            </div>
            <span className="text-[10px] font-black uppercase text-purple-600 tracking-[0.1em]">Core Probe Launcher: {coreCharges}/{settings.maxCoreCharges}</span>
          </div>

          {/* Neural Probe Launcher (Teal) */}
          <div className="flex flex-col items-center gap-1 bg-black/30 p-2 border border-zinc-900/50 rounded-sm">
            <div className="flex gap-1.5">
              {[...Array(settings.maxNeuralCharges)].map((_, i) => (
                <div key={i} className={`w-2 h-7 border transition-all duration-500 ${i < neuralCharges ? 'bg-teal-500 border-teal-400 glow-teal' : 'bg-zinc-900 border-zinc-800'}`} style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}></div>
              ))}
            </div>
            <div className="w-full h-[1px] bg-zinc-900 relative overflow-hidden">
              <div className="absolute h-full bg-teal-500 transition-all duration-500" style={{ width: `${neuralReloadProgress}%` }}></div>
            </div>
            <span className="text-[10px] font-black uppercase text-teal-600 tracking-[0.1em]">Neural Probe Launcher: {neuralCharges}/{settings.maxNeuralCharges}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <Tooltip name="CONFIG_OVERRIDE" source="SYSTEM" desc="Access global neural parameters and engine configurations.">
             <button onClick={() => setShowConfig(true)} className={`p-2 transition-all hover:scale-110 ${showConfig ? 'text-purple-500 glow-purple' : 'text-zinc-600 hover:text-white'}`}>
               <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
             </button>
           </Tooltip>
           <Tooltip name="PROTOCOL_SWAP" source="SYSTEM" desc="Switch operational mode between simulated environment and live target bridge.">
             <div onClick={() => setMode(m => m === OperationalMode.REAL ? OperationalMode.SIMULATED : OperationalMode.REAL)} className={`w-16 h-8 border border-zinc-900 bg-black cursor-pointer p-1 flex items-center shadow-inner`}><div className={`w-6 h-6 transition-all ${mode === OperationalMode.REAL ? 'translate-x-8' : ''}`} style={{ backgroundColor: currentAccent }}></div></div>
           </Tooltip>
        </div>
      </header>

      {notification && (
        <div className={`fixed top-28 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 border flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 ${notification.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_20px_rgba(255,62,62,0.4)]' : 'bg-blue-950/90 border-blue-500 text-blue-200'}`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} animate-pulse`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest">{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-4 text-white opacity-40 hover:opacity-100 uppercase text-[8px] font-bold">[DISMISS]</button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[70%] flex flex-col border-r border-[#1a1e24] bg-[#020406]">
          <nav className="h-14 border-b border-[#1a1e24] flex items-center justify-center px-10 bg-[#0a0c0f]">
            <div className="flex h-full gap-12">
              {['dashboard', 'telemetry', 'pi_stats', 'toolkit', 'history'].map(tab => (
                <Tooltip key={tab} name={tab.toUpperCase()} source="SYSTEM" desc={`Tactical access to ${tab} modules.`}>
                  <button onClick={() => setActiveTab(tab as any)} className={`text-[13px] font-black uppercase tracking-[0.2em] relative h-full flex items-center transition-all ${activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'}`}>
                    {tab.replace('_', ' ')}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>}
                  </button>
                </Tooltip>
              ))}
            </div>
          </nav>
          <div className="flex-1 overflow-y-auto p-10 relative scroll-smooth no-scroll">
            {activeTab === 'dashboard' && <Dashboard stats={piStats} mode={mode} session={session} onHandshake={handleHandshake} onDisconnect={() => setSession(s => ({...s, targetIp: null, status: 'IDLE'}))} onLog={addLog} onBrainClick={handleBrainRequest} onProbeClick={handleNeuralProbe} onAdapterCommand={runCommand} onRefresh={() => fetchStats(session.targetIp!)} processingId={processingId} latestCoreProbeResult={latestCoreProbeResult} activeTelemetry={activeTelemetry} />}
            {activeTab === 'pi_stats' && <PiStatsView stats={piStats} mode={mode} timeframe={settings.timeframe} onProbeClick={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} activeTelemetry={activeTelemetry} setActiveTelemetry={setActiveTelemetry} />}
            {activeTab === 'telemetry' && <TelemetryGraphs isSimulated={mode === OperationalMode.SIMULATED} isConnected={!!session.targetIp} timeframe={settings.timeframe} onProbe={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
            {activeTab === 'toolkit' && <Toolkit mode={mode} onRunCommand={runCommand} onBreakdown={handleNeuralProbe} />}
            {activeTab === 'history' && <History data={[]} onProbe={handleNeuralProbe} onBrainClick={handleBrainRequest} processingId={processingId} />}
          </div>
        </div>

        <div className="w-[30%] flex flex-col bg-[#020406] border-l border-[#1a1e24] relative overflow-hidden">
          <div className="h-14 border-b border-zinc-900 px-4 flex items-center justify-between bg-[#0a0c0f] shrink-0">
             <div className="flex h-full overflow-x-auto no-scroll">
               {(['neural', 'console', 'kernel', 'system'] as LogType[]).map(lt => (
                 <Tooltip key={lt} name={`LOG_STREAM_${lt.toUpperCase()}`} source="REAL" desc={`Switch to ${lt} telemetry stream. Identifies tactical events in this specific context.`}>
                   <button onClick={() => handleSetActiveLogTab(lt)} className={`px-4 text-[10px] font-black uppercase tracking-widest relative h-full whitespace-nowrap transition-all ${activeLogTab === lt ? 'text-white bg-teal-500/5' : 'text-zinc-700'} ${unreadLogs[lt] ? 'tab-flash' : ''}`}>
                     {lt}
                     {activeLogTab === lt && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-500"></div>}
                   </button>
                 </Tooltip>
               ))}
             </div>
             <div className="flex items-center gap-3 ml-2">
               <Tooltip name="LOG_PROBE" source="AI" variant="purple" desc="Batch analysis of recent log entries. Consumes 1 CORE CHARGE (Purple).">
                 <button onClick={handleLogProbe} disabled={!!processingId} className={`text-[10px] font-black text-purple-400 hover:text-white transition-colors uppercase ${processingId ? 'opacity-30 cursor-not-allowed' : ''}`}>
                   {processingId === activeLogTab.toUpperCase() + '_LOGS' ? 'WAIT...' : 'PROBE'}
                 </button>
               </Tooltip>
               <Tooltip name="LOG_BRAIN" source="AI" variant="teal" desc="Describe the currently active log channel. Consumes 1 NEURAL CHARGE (Teal).">
                <BrainIcon onClick={handleLogBrainRequest} isProcessing={processingId === `LOG_CHANNEL_${activeLogTab.toUpperCase()}`} className="!p-1 !w-6 !h-6" color="#00ffd5" />
               </Tooltip>
             </div>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {isFrogVisible && activeLogTab === 'neural' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="whitespace-pre font-mono text-[7px] neural-bg-flash" style={{ color: settings.frogColor, opacity: settings.frogIntensity }}>{ASCII_FROG}</div>
              </div>
            )}
            <div className="absolute inset-0 overflow-y-auto p-6 space-y-4 bg-transparent no-scroll z-10 flex flex-col">
               {(activeLogTab === 'neural' ? neuralLogs : activeLogTab === 'console' ? consoleLogs : activeLogTab === 'kernel' ? kernelLogs : systemLogs).map(log => {
                 const isAiLog = log.metadata?.type === 'PROBE_RESULT';
                 return (
                  <Tooltip key={log.id} name={`LOG_ENTRY_${activeLogTab.toUpperCase()}`} source={mode} desc="Tactical telemetry snippet. CLICK to invoke NEURAL breakdown of this specific entry.">
                    <div onClick={() => handleLogAction(log)} className={`border-l-2 pl-4 py-2 backdrop-blur-[2px] cursor-help transition-all group ${isAiLog ? 'bg-purple-900/10 border-purple-500 hover:bg-purple-500/10' : 'bg-black/40 border-zinc-800 hover:bg-zinc-900/10'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] text-zinc-600 font-mono">{log.timestamp}</span>
                        {isAiLog && (
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] bg-purple-500 text-white px-1.5 py-0.5 font-black uppercase tracking-tighter rounded-sm">AI_DIAGNOSTIC</span>
                             <span className="text-[9px] text-purple-400 font-bold animate-pulse uppercase">[Click to Decode]</span>
                          </div>
                        )}
                      </div>
                      <p className={`font-mono text-[12px] ${isAiLog ? 'text-purple-300' : 'text-zinc-400'}`}>{log.message}</p>
                    </div>
                  </Tooltip>
                 );
               })}
            </div>
          </div>
        </div>
      </main>

      <footer className="h-10 bg-[#050608] border-t border-zinc-900 px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-6 text-[9px] font-black text-zinc-700 uppercase tracking-widest">
           <Tooltip name="SESSION_ID" source="SYSTEM" desc="Unique token representing current encrypted bridge state.">
             <span className="cursor-help">Session_ID: {session.id}</span>
           </Tooltip>
           <Tooltip name="OP_MODE" source={mode} desc="Selected environment protocol.">
             <span className="cursor-help">Mode: {mode}</span>
           </Tooltip>
           <Tooltip name="LINK_TARGET" source={session.targetIp ? 'REAL' : 'OFFLINE'} desc="Remote node address currently linked to the console.">
             <span className="cursor-help">Link: {session.targetIp || 'NONE'}</span>
           </Tooltip>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-black text-zinc-800 tracking-widest">
           <span className={aiLinkStable ? 'text-purple-500' : 'text-zinc-800'}>NEURAL_LINK_{aiLinkStable ? 'SYNC' : 'VOID'}</span>
           <span className="text-zinc-900">|</span>
           <span>STN_v2.9.9</span>
        </div>
      </footer>

      <Modal isOpen={showConfig} onClose={() => setShowConfig(false)} title="GLOBAL_SETTINGS" variant="purple">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4 border-b border-zinc-900 pb-6">
                <Tooltip name="ENGINE_CONFIG" source="SYSTEM" desc="Override the intelligence provider and endpoint definitions.">
                  <h4 className="text-[11px] font-black text-purple-500 uppercase tracking-widest mb-4 cursor-help">Neural_Intelligence_Link</h4>
                </Tooltip>
                <div className="grid grid-cols-1 gap-4">
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-zinc-700 uppercase">Engine_Provider</label>
                      <select value={aiConfig.provider} onChange={e => setAiConfig(prev => ({...prev, provider: e.target.value as AIProvider}))} className="bg-black border border-zinc-900 p-2 text-white font-mono text-[10px] outline-none">
                        <option value={AIProvider.GEMINI}>Google Gemini (Cloud)</option>
                        <option value={AIProvider.LOCAL}>Local Node (Ollama/LMStudio)</option>
                      </select>
                   </div>
                   {aiConfig.provider === AIProvider.LOCAL && (
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-zinc-700 uppercase">Local Endpoint</label>
                        <div className="flex gap-2">
                          <input value={aiConfig.endpoint} onChange={e => setAiConfig(prev => ({...prev, endpoint: e.target.value}))} className="flex-1 bg-black border border-zinc-900 p-2 text-white font-mono text-[10px] outline-none" placeholder="http://localhost:11434/v1" />
                          <button onClick={handleTestLocal} disabled={isTestingLocal} className="px-4 bg-purple-500/10 border border-purple-500/40 text-purple-400 text-[9px] font-black uppercase hover:bg-purple-500/20 transition-all disabled:opacity-30">
                            {isTestingLocal ? 'TESTING...' : 'TEST'}
                          </button>
                        </div>
                     </div>
                   )}
                </div>
              </div>

              <div className="space-y-4">
                <Tooltip name="PROBE_RECHARGE_TUNING" source="SYSTEM" desc="Adjust the replenishment cycle of tactical charges.">
                  <h4 className="text-[11px] font-black text-teal-500 uppercase tracking-widest mb-4 cursor-help">Launcher_Probe_Sync</h4>
                </Tooltip>
                <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-1">
                      <div className="flex justify-between items-center"><label className="text-[10px] font-black text-zinc-700 uppercase">Core Recharge (s)</label><span className="text-zinc-500 text-[10px]">{settings.coreRechargeRate}s</span></div>
                      <input type="range" min={10} max={300} step={10} value={settings.coreRechargeRate} onChange={e => setSettings(s => ({...s, coreRechargeRate: Number(e.target.value)}))} className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                   </div>
                   <div className="space-y-1">
                      <div className="flex justify-between items-center"><label className="text-[10px] font-black text-zinc-700 uppercase">Neural Recharge (s)</label><span className="text-zinc-500 text-[10px]">{settings.neuralRechargeRate}s</span></div>
                      <input type="range" min={5} max={120} step={5} value={settings.neuralRechargeRate} onChange={e => setSettings(s => ({...s, neuralRechargeRate: Number(e.target.value)}))} className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-zinc-700 uppercase">Max Core</label><span className="text-purple-400 text-[10px]">{settings.maxCoreCharges}</span></div>
                        <input type="range" min={2} max={10} step={1} value={settings.maxCoreCharges} onChange={e => setSettings(s => ({...s, maxCoreCharges: Number(e.target.value)}))} className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-zinc-700 uppercase">Max Neural</label><span className="text-teal-400 text-[10px]">{settings.maxNeuralCharges}</span></div>
                        <input type="range" min={2} max={10} step={1} value={settings.maxNeuralCharges} onChange={e => setSettings(s => ({...s, maxNeuralCharges: Number(e.target.value)}))} className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 border-b border-zinc-900 pb-6">
                <Tooltip name="VISUAL_GHOSTING" source="SYSTEM" desc="Control the intensity and frequency of the neural background ghosting.">
                  <h4 className="text-[11px] font-black text-purple-500 uppercase tracking-widest mb-4 cursor-help">Tactical_Ghosting_Config</h4>
                </Tooltip>
                <div className="flex justify-between items-center bg-black/40 p-3 border border-zinc-900">
                    <span className="text-[10px] font-black text-zinc-400 uppercase">Enable Neural Ghosting</span>
                    <button onClick={() => setSettings(s => ({...s, showAsciiBg: !s.showAsciiBg}))} className={`w-10 h-5 border p-0.5 flex items-center ${settings.showAsciiBg ? 'border-teal-500' : 'border-zinc-800'}`}><div className={`w-3.5 h-3.5 ${settings.showAsciiBg ? 'translate-x-5 bg-teal-500' : 'bg-zinc-800'} transition-all`}></div></button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                      <div className="flex justify-between items-center"><label className="text-[10px] font-black text-zinc-700 uppercase">Ghosting Interval</label><span className="text-zinc-500 text-[10px]">{settings.frogInterval}ms</span></div>
                      <input type="range" min={2000} max={60000} step={1000} value={settings.frogInterval} onChange={e => setSettings(s => ({...s, frogInterval: Number(e.target.value)}))} className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                  </div>
                  <div className="space-y-1">
                      <div className="flex justify-between items-center"><label className="text-[10px] font-black text-zinc-700 uppercase">Signal Intensity</label><span className="text-zinc-500 text-[10px]">{Math.round(settings.frogIntensity * 100)}%</span></div>
                      <input type="range" min={0.01} max={0.4} step={0.01} value={settings.frogIntensity} onChange={e => setSettings(s => ({...s, frogIntensity: Number(e.target.value)}))} className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-700 uppercase">Sync Freq (ms)</label>
                    <input type="number" step={500} value={settings.pollInterval} onChange={e => setSettings(s => ({...s, pollInterval: Number(e.target.value)}))} className="w-full bg-black border border-zinc-900 p-2 text-white font-mono text-[10px] outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-700 uppercase">Time Window</label>
                    <select value={settings.timeframe} onChange={e => setSettings(s => ({...s, timeframe: e.target.value as Timeframe}))} className="w-full bg-black border border-zinc-900 p-2 text-white font-mono text-[10px] outline-none">
                      {['1m', '5m', '15m', '30m', '1h', '6h', '12h', '24h'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
              </div>
            </div>
         </div>
      </Modal>

      <Modal isOpen={!!tooltipData} onClose={() => setTooltipData(null)} title={tooltipData?.elementId || 'NEURAL_BRAIN'} variant="teal">
         {tooltipData && <div className="space-y-4"><p className="text-zinc-300 italic">{tooltipData.description}</p><div className="p-4 bg-teal-900/10 border border-teal-500/20 text-zinc-100">{tooltipData.recommendation}</div></div>}
      </Modal>
      <Modal isOpen={!!neuralProbeResult} onClose={() => setNeuralProbeResult(null)} title={`ANALYSIS: ${neuralProbeResult?.title}`} variant="purple">
         {neuralProbeResult?.data && <div className="space-y-4"><p className="text-zinc-300 pl-4 border-l-2 border-purple-500">{neuralProbeResult.data.description}</p><div className="font-black text-purple-400 bg-purple-950/20 p-4 border border-purple-500/20">{neuralProbeResult.data.recommendation}</div></div>}
      </Modal>
    </div>
  );
};

export default App;