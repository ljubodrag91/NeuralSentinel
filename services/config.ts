
export const APP_CONFIG = {
  VERSION: "2.9.9_STABLE",
  DEFAULT_MODEL: "gemini-3-flash-preview",
  SIMULATION: {
    DISCOVERY_LATENCY: 1800,
    NEURAL_LATENCY: 1200,
    SCAN_RESULTS_COUNT: 4
  },
  PLACEHOLDERS: {
    // Note: process.env.API_KEY is handled by the environment
    TARGET_IP: "192.168.1.104",
    SSH_PORT: 22,
    DEFAULT_USER: "kali"
  }
};

export const LOCAL_MODELS = [
  "GPT-OSS 20B",
  "LLaMA-Open 7B",
  "Mistral-7B",
  "Phi-2",
  "Alpaca/Vicuna"
];
