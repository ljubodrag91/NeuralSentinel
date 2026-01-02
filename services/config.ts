
export const APP_CONFIG = {
  VERSION: "2.9.8_STABLE",
  DEFAULT_MODEL: "gemini-3-flash-preview",
  SIMULATION: {
    DISCOVERY_LATENCY: 2000,
    NEURAL_LATENCY: 1500,
    SCAN_RESULTS_COUNT: 5
  },
  PLACEHOLDERS: {
    API_KEY: "process.env.API_KEY", // Placeholder reference
    TARGET_IP: "192.168.1.104",
    SSH_PORT: 22
  }
};
