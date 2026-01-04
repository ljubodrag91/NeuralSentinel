# Neural Sentinel - SOC Console v.3.2.0

Neural Sentinel is a high-fidelity Security Operations Center (SOC) interface designed for managing remote Kali Linux deployments on Raspberry Pi devices and local Windows hosts. It features an integrated AI Neural Engine for heuristic telemetry auditing.

---

## 🚀 Core Architecture: Tiered Slot System

The interface utilizes a modular **Slot System** for telemetry and security auditing. Configuration is divided into three functional tiers:

### 1. Slot Tiers & Ownership
*   **LOW SLOT (Teal - #00ffd5)**:
    *   **Function**: Contextual Neural Inferences and UI metadata labeling.
    *   **Management**: **GLOBALLY MANAGED**. Individual panels display status but do not allow local configuration. Changes are applied via the central header load segments.
    *   **Consumption**: Low Core Charges.
*   **MEDIUM / PROBE SLOT (Purple - #bd00ff)**:
    *   **Function**: Panel-specific Core Data Probes.
    *   **Management**: Configured per-panel. Allows specialized analysis of specific telemetry streams (e.g., Process trees, RF Signal logs).
    *   **Consumption**: Medium Core Charges.
*   **HIGH / SENSOR SLOT (Orange - #f97316)**:
    *   **Function**: Specialized Hardware Intercepts & Script Automation.
    *   **Management**: Exclusive to specific panels (primarily **Scanner**). 
    *   **Behavior**: High-tier modules have persistent **Reload Timers** (1-hour base cooldown).

---

## 🧠 Master Core Probe (Intelligence Hub)

The **MASTER_INTELLIGENCE** panel features a unique **Main Core Probe** behavior:
*   **Aggregated Data Collection**: When fired, the system crawls all active panels. If a panel has a Probe Slot equipped, its specific data contract payload is extracted.
*   **Unified Packet**: All collected payloads are combined into a single array-based aggregated packet.
*   **AI Processing**: The packet is processed by the AI core with a strict **4000 token limit**.
*   **Global Cooldown**: Due to high resource cost, this probe can only be triggered **once every 5 minutes**. A visual cooldown timer is displayed in the UI.

---

## 🛠 Scanner & Sensor Manifold

The **Scanner Tab** operates the EM Field Intercept manifold:
*   **Sensor Nodes**: Visual grid of anomaly points (Network, System, Process, Filesystem).
*   **Scripts**:
    *   **System Scripts**: Trigger a full sensor array scan sequence.
    *   **Buffer Scripts**: Provide enhancers/buffs without wiping existing radar scans.
    *   **Neural Integration Scripts**: Automated scans that transmit results to the AI engine at set intervals (1m, 5m, 10m).
*   **Boosters**: Consumables like the **Neural Link Bypasser** allow for temporary bypassing of all probe cooldowns (60-minute duration).

---

## 🔧 Operation Modes & Services

| State | Color | Meaning |
| :--- | :--- | :--- |
| **LOCAL ACTIVE** | **Blue / Cyan** | Windows Host (127.0.0.1) telemetry active. |
| **REMOTE ACTIVE** | **Green** | Remote SSH/HTTP link (Pi/Linux) active. |
| **NEURAL SYNC** | **Purple** | AI Reasoning / Aggregated Probe in progress. |

### Service Management
Operators can manually enable/disable the **Telemetry Uplink** or **Neural Link** via the Master Intelligence panel. This allows for stealth operations or resource conservation.

---

## 📖 User Instructions: MATRIX_CONFIG
To modify hardware configuration:
1.  Click the **Slot Port** icon (Probe or Sensor) in any panel header.
2.  Select a **Launcher Module** and apply **Consumables/Scripts**.
3.  **CRITICAL**: You must click the **APPLY** and **CONFIRM** buttons in the `MASTER_MATRIX_CONFIG` dialog to commit hardware changes. Closing without confirming reverts to the previous state.

*Build: Neural_Sentinel_v3.2.0_PRO*
*Clearance: LEVEL_04_SOC_OP*