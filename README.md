# Neural Sentinel - Kali SOC Console v.2.9.9

Neural Sentinel is a high-fidelity Security Operations Center (SOC) interface designed for managing remote Kali Linux deployments on Raspberry Pi devices. It bridges the gap between raw command-line tools and tactical intelligence through an integrated AI Neural Engine.

## 📊 System Telemetry Explanation

The `SYSTEM_STATS` tab provides real-time visibility into the physical health and performance of the remote node. In a penetration testing context, these metrics are critical for mission success:

### 1. CPU Matrix (Compute & Thermals)
- **Utilization Flow**: Measures processor saturation. High CPU usage is expected during active brute-forcing (Hashcat) or complex scanning (Nmap aggressive modes).
- **Thermal Envelope**: Raspberry Pi devices are prone to thermal throttling. Monitoring temperature ensures the device doesn't down-clock or shut down during a critical exploitation phase.
- **Load Average**: Displayed as 1, 5, and 15-minute intervals. This helps identify if the system is experiencing a temporary spike or sustained bottleneck.

### 2. Memory Pool (Volatile Storage)
- **RAM Allocation**: Tracks memory consumption. Tools like Metasploit or heavy web scanners (Burp Suite) can quickly consume the limited 4GB/8GB RAM on a Pi, leading to "Out of Memory" (OOM) kills.
- **Saturation Ratio**: A percentage-based view of memory pressure. Sustained saturation above 85% indicates a high risk of session instability.

### 3. IO Adapter (Network Throughput)
- **RX (Ingress)**: Volume of data entering the node. High RX is typical during packet captures or broad-spectrum network discovery.
- **TX (Egress)**: Volume of data leaving the node. Crucial for monitoring data exfiltration or reverse-shell stability.
- **Adapter Matrix**: Status indicators for `wlan0` (Wireless), `eth0` (Ethernet), and `lo` (Loopback). GREEN status indicates a stable link.

---

## 🧠 Neural Intelligence Engine

The "Neural" aspect of the console uses advanced LLMs (Gemini or Local) to act as a virtual security analyst.

- **Neural Probe**: Located on every major card. Analyzes current telemetry and generates a JSON-structured tactical report. It identifies anomalies (e.g., "Unexpected CPU spike during idle") and suggests mitigations.
- **Smart Tooltips (Brain Probe)**: Hover-activated AI analysis. It explains complex metrics or flags in plain language and provides professional recommendations based on the specific context of the data.
- **Neural Stream v.10**: A unified logging system that prepends the latest activity to the top. It supports "Stream Probing," where the AI analyzes the recent log history or user-selected text for immediate insight.

## ⚙️ Configuration & AI Link

The console supports two primary AI backends:

1.  **Google Gemini (Cloud)**: High-speed, high-reasoning model. Requires a valid API key.
2.  **Local Node (Offline)**: Connects to local servers like **LM Studio** or **Ollama**. 
    - **Endpoint**: Usually `http://localhost:1234/v1`.
    - **Test Availability**: Use this button in Global Settings to verify the link. The `NEURAL_CORE` indicator in the header will glow **PURPLE** when a stable AI link is established.

## 🛠 Operational Workflow

1.  **Link Handshake**: Establish an SSH tunnel via the Dashboard.
2.  **Telemetry Sync**: Ensure the remote Pi is running the sentinel heartbeat service on port **5050**.
3.  **Tactical Execution**: Use the **Toolkit** to build and arm payloads. 
4.  **Audit Archive**: All actions are recorded in the **History** tab for post-engagement reporting.

---
*Build: Neural_Sentinel_v2.9.9_STABLE*
*Security Clearance: LEVEL_04_SOC_OP*