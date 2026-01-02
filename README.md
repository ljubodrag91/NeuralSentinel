# Neural W Monitor - Kali Linux Interface

Neural W Monitor is a professional-grade multi-window web interface designed as a remote control panel for Kali Linux deployments on Raspberry Pi devices. It provides a localized, cyberpunk-styled SOC (Security Operations Center) experience with real-time telemetry, advanced toolkits, and an integrated AI Neural Engine for automated diagnostic probes.

## Core Features

- **Neural Probe System**: Deep analysis of panel metrics using Gemini AI or Local LLMs. It generates structured JSON diagnostic reports identifying anomalies, threat levels, and tactical recommendations.
- **PiNode Management**: Persistent handshake protocol for establishing telemetry tunnels to remote nodes (REAL mode) or using synthetic data (SIMULATED mode).
- **Spectrum Analysis**: High-fidelity visual telemetry for RF signal integrity (RSSI) and spectral density, featuring global timeframe management.
- **Attack Toolkit**: A comprehensive, tree-structured explorer for penetration testing workflows including Reconnaissance, Wireless attacks, Web Enumeration, and Exploitation.
- **Smart Tooltips**: Context-aware AI insights for every dashboard component, providing technical descriptions and advice.
- **Cyberpunk UI**: High-fidelity aesthetic with CRT overlays, scanlines, chromatic aberration, and shimmer effects designed for professional security environments.

## Architecture

- **Frontend**: React 19, Tailwind CSS for layout, and Recharts for telemetry visualization.
- **AI Integration**: Powered by `@google/genai` for Gemini Flash/Pro models, supporting both cloud-based and local LLM endpoints.
- **Telemetry**: Real-time polling of system statistics (CPU, Temperature, RAM, Network) via a dedicated 5050 port heartbeat on the remote node.
- **Visuals**: Specialized CSS-driven effects including "Neural Core" logic icons, CRT flickers, and localized scanlines.

## Usage Instructions

1. **AI Initialization**: Open the `Global Settings` (gear icon) and ensure your Gemini API key is configured. You can toggle between Gemini and Local providers.
2. **Mode Selection**: Switch between `SIMULATED` (for training/demonstration) and `REAL` (for active operations) via the toggle in the header.
3. **Establish Handshake**: In the `Dashboard` tab, input the IP address of your Raspberry Pi Kali node and click `INITIALIZE` to link the telemetry streams.
4. **Diagnostic Probes**: Every monitoring panel features a `PROBE` button. Clicking this triggers the AI Neural Engine to analyze current data and return a tactical report.
5. **Execute Modules**: Navigate to the `Toolkit` tab, select a pentesting module, configure flags, and click `EXECUTE_MODULE_PAYLOAD` to send commands to the linked node.

---
*Build: Neural_Sentinel_v2.9.8_STABLE*
