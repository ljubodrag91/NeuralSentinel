# Neural Sentinel - SOC Console v.3.1.0

Neural Sentinel is a high-fidelity Security Operations Center (SOC) interface designed for managing remote Kali Linux deployments on Raspberry Pi devices and local Windows hosts. It bridges the gap between raw command-line tools and tactical intelligence through an integrated AI Neural Engine.

---

## 🚀 Core Architecture & Tiered Slot System

The interface utilizes a modular **Slot System** for telemetry and security auditing. Each panel can be configured with specialized hardware modules and software scripts across three tiers:

### 1. Tiered Slots (Color Coded)
*   **LOW SLOT (Teal - #00ffd5)**:
    *   **Function**: Contextual Neural Inferences.
    *   **Probes**: Neural Data Probes (Inferences on labels, UI metadata, and lightweight insights).
    *   **Consumption**: Low Core Charges.
*   **MEDIUM SLOT (Purple - #bd00ff)**:
    *   **Function**: Core Data Auditing.
    *   **Probes**: Core Data Probes (Deep-dive telemetry analysis, heuristic resource auditing).
    *   **Consumption**: Medium Core Charges.
*   **HIGH SLOT (Orange - #f97316)**:
    *   **Function**: Specialized Hardware & Script Automation.
    *   **Modules**: Sensor Modules, High-tier Forensic Scripts.
    *   **Behavior**: Shared 1-charge limit across all panels. Supports **Script Reload Timers** (1-hour standard cooldown, persisted across sessions).

---

## 🧠 Intelligence Probes

The AI engine facilitates several distinct probe types, each with specific "Contracts" defining their logic:

*   **Core Data Probe**: Deep analysis of panel-specific telemetry (e.g., Process trees, RF Signal logs).
*   **Neural Data Probe**: Lightweight contextual inference for UI tooltips and metadata labels.
*   **Historical Probe**: Aggregated analysis using up to 24 hours of stored CSV data.
*   **Master Intelligence Probe**: A global probe that consolidates all active telemetry into a single security assessment. Supports dynamic token sizing (4k-8k tokens).

---

## 🛠 Scanner & Sensor Array

The **Scanner Tab** provides a dedicated interface for the EM Field Intercept manifold:
*   **Node Grid**: Interactive anomaly points mapping physical and virtual sensors.
*   **Scan Logs**: Real-time logging of sensor firing and anomaly detection.
*   **Extended Modules**: High-tier sensor modules trigger automated Neural Audits upon scan completion.
*   **Shortcut**: A quick-fire circle icon in the header allows for immediate data-type sensor firing and automatic tab switching.

---

## 💾 Data Persistence & Manifest Management

*   **Dynamic Manifest**: New launchers, consumables, or modules added via the **Admin Panel** are persisted to `localStorage` and reflected immediately on app restart.
*   **History Engine**: Critical tactical actions (Neural Probes, Handshakes, Command Executions) are archived in CSV format.
*   **Retention**: Data follows a 24-hour sliding window.
*   **Storage Tiers**:
    *   **JSON**: Hardware definitions and manifest metadata.
    *   **CSV**: Time-series telemetry and audit logs.

---

## 🔧 Operation Modes

| State | Color | Meaning |
| :--- | :--- | :--- |
| **LOCAL ACTIVE** | **Blue / Cyan** | Localhost (127.0.0.1) telemetry active. Windows HUD auto-detected. |
| **REMOTE ACTIVE** | **Green** | Remote SSH/HTTP link established. Linux HUD (Kali) active. |
| **DISCONNECTED** | **Red** | Link void or target unreachable. |
| **NEURAL SYNC** | **Purple** | AI Reasoning / Probe in progress. |

---

## 📖 User Instructions: MATRIX_CONFIG

To modify a panel's configuration:
1.  Click the **Module Slots** icon in any panel header.
2.  Select the desired **Tier** (Low/Med/High).
3.  Select a **Launcher Module** and apply **Ammunition/Scripts**.
4.  **CRITICAL**: You must click the **APPLY_AND_CONFIRM** button to commit changes. Closing the dialog without confirming will revert to the previous stable configuration.

*Build: Neural_Sentinel_v3.1.0_PRO*
*Developer: Neural W Monitor Team*
*Clearance: LEVEL_04_SOC_OP*