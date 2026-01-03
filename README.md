# Neural Sentinel - Kali SOC Console v.2.9.9

Neural Sentinel is a high-fidelity Security Operations Center (SOC) interface designed for managing remote Kali Linux deployments on Raspberry Pi devices. It bridges the gap between raw command-line tools and tactical intelligence through an integrated AI Neural Engine.

---

## 🚀 App Functionality

### 1. Multi-Window Command Center
The application is structured into five core tactical modules:
- **Dashboard**: Handshake bridge for SSH tunnel establishment and network interface matrix. Includes an interactive Bash Terminal overlay.
- **Telemetry**: Real-time RF and spectral density analysis using Recharts.
- **Pi Stats**: Deep-dive system monitoring (CPU, RAM, Disk, Temp) with process auditing.
- **Toolkit**: A tiered arsenal of penetration testing modules including Guided Wizards for Nmap and Wireless Deauthentication.
- **History**: An encrypted persistence log of all tactical session actions.

### 2. Neural Intelligence Engine
- **Core Probes**: System-wide audits that analyze complex telemetry to find security anomalies.
- **Neural Brain Tooltips**: On-demand smart inference on specific metrics or logs.
- **Payload Audit (Audit Dots)**: Next to every probe button is a small interactive dot. Clicking this opens a "Payload Audit" dialog, revealing the exact JSON packet being transmitted to the AI engine for transparency.
- **Unified Charge System**: Tactical AI actions are governed by Core and Neural chargers in the header, simulating hardware constraints.

### 3. Visual & Aesthetic Identity
- **CRT / HUD Aesthetics**: Scanlines, chromatic aberration, and holographic haze create a professional "Cyber-Tactical" environment.
- **Real-Time Link Monitoring**: The main "Sentinel Core" logo dynamically updates its state based on heartbeats from the remote node, turning red immediately if the connection is lost.

---

## 🛠 Developer Perspective

### Technical Architecture
- **Framework**: React 19.x with TypeScript for strict type safety.
- **AI Connectivity**: Supports both **Google Gemini** and **Local OpenAI-compatible** endpoints (Ollama/LM Studio).
- **Resilience**: Implements AbortControllers for fetch timeouts to ensure the connection status remains accurate.

---

## 📖 User Guide

### Initial Setup
1. **AI Bridge**: Open **Global Settings** (cog icon). Choose your engine.
2. **Handshake**: Navigate to the **Dashboard**. Enter target IP and auth details.

### Operational Procedures
- **System Audit**: Click the large **CORE PROBE** transistor in the Dashboard to run a systemic health check.
- **Payload Audit**: Click the small dot next to any PROBE button to inspect the raw data being sent to the AI.
- **Terminal Overlay**: Toggle **ENGAGE_TERMINAL** for direct bash interaction with the remote node.

---
*Build: Neural_Sentinel_v2.9.9_STABLE*
*Developer: Neural W Monitor Team*
*Security Clearance: LEVEL_04_SOC_OP*