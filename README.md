
# Neural Sentinel - Kali SOC Console v.3.1.0

Neural Sentinel is a high-fidelity Security Operations Center (SOC) interface designed for managing remote Kali Linux deployments on Raspberry Pi devices and local Windows hosts. It bridges the gap between raw command-line tools and tactical intelligence through an integrated AI Neural Engine.

---

## 🚀 Core Architecture

### 1. Data Source Modes
The system operates in two distinct modes, toggled via the header "SOURCE" switch:

*   **LOCAL SOURCE (Default)**:
    *   **Target**: Localhost (127.0.0.1)
    *   **Platform**: Windows NT (Auto-detected)
    *   **Behavior**: Handshake panel is **LOCKED**. Telemetry is pulled directly from the local server daemon.
    *   **Visual Indicator**: **Blue/Cyan** System Status.

*   **REMOTE SOURCE**:
    *   **Target**: User-Configurable IP (e.g., 192.168.1.x)
    *   **Platform**: Kali Linux (Auto-switched)
    *   **Behavior**: Handshake panel is **UNLOCKED**. Requires valid credentials to establish SSH/HTTP link.
    *   **Visual Indicator**: **Green** System Status.

### 2. Multi-Window Command Center
*   **Dashboard**: Central hub for Link Status, Handshake (Remote only), and Network Matrix. Includes interactive Terminal Overlay.
*   **Telemetry**: Real-time RF signal analysis and spectral density visualization.
*   **Core Stats**: Deep-dive system monitoring (CPU, RAM, Disk, Thermal) with Process Probing.
*   **Toolkit**: Tiered arsenal of penetration testing modules (Nmap, Deauth, etc.).
*   **History**: Encrypted persistence log of all tactical session actions.

### 3. Neural Intelligence Engine
*   **Core Probes**: System-wide probes that analyze complex telemetry to find security anomalies.
*   **Neural Tooltips**: On-demand smart inference on specific metrics via right-click or hover.
*   **Payload Audit**: "Audit Dots" next to probes allow inspection of the raw JSON packet transmitted to the AI.
*   **Launchers**: Modular configuration for AI requests. Each launcher (`std-core`, `ext-neural`) has specific Charge capacities and Token limits to optimize throughput.

---

## 💾 Data Persistence

*   **Format**: Session data is persisted locally in CSV format via the `HistoryStorage` engine.
*   **Scope**: Critical actions (Neural Probes, Handshakes, Command Executions) are automatically archived.
*   **Retention**: Data is retained for a maximum of 24 hours on a sliding window basis.
*   **Storage**: Browser `localStorage` is used as the backing store for the CSV blobs.

---

## 🛠 Operational Status Indicators

| State | Color | Meaning |
| :--- | :--- | :--- |
| **LOCAL ACTIVE** | **Blue / Cyan** | Localhost telemetry stream active. Stable. |
| **REMOTE ACTIVE** | **Green** | Remote SSH/HTTP link established. Secure. |
| **DISCONNECTED** | **Red** | Link lost, heartbeat failed, or service offline. |
| **NEURAL SYNC** | **Purple** | AI Inference in progress. |

---

## 📖 User Guide

### Startup Behavior
1.  **Boot**: App initializes in **LOCAL** mode.
2.  **Telemetry**: Immediately attempts to poll `http://127.0.0.1:5050/stats`.
3.  **AI Check**: Verifies API Key presence for Neural Uplink.

### Switching to Remote Target
1.  Click the **SOURCE** toggle in the top header.
2.  Status indicator turns **Green** (if connected) or **Red** (if pending).
3.  Navigate to **Dashboard** -> **HANDSHAKE_NODE**.
4.  Enter Target IP, User, and Port. Click **INITIALIZE_HANDSHAKE**.

### Troubleshooting
*   **"LOCKED_LOCAL_HOST_ACTIVE"**: You are in Local Mode. Toggle the Source switch in the header to enable the Handshake panel.
*   **Red "DISCONNECTED" Core**: The backend service (port 5050) is unreachable. Check if the python server is running.
*   **Graphs Flatline**: Ensure `process.env.API_KEY` is set for AI features, or check network connectivity for Telemetry.

---
*Build: Neural_Sentinel_v3.1.0_OPTIMIZED*
*Developer: Neural W Monitor Team*
*Clearance: LEVEL_04_SOC_OP*
