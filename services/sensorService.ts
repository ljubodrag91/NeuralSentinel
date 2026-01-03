
import { SensorArrayConfig, SensorNodeConfig } from '../types';
import { arraysData } from '../data/sensor_arrays';
import { nodesData } from '../data/sensor_nodes';

const STORAGE_KEY = 'neural_sentinel_sensor_modules';

class SensorService {
  private nodes: Record<string, SensorNodeConfig> = {};
  private arrays: Record<string, SensorArrayConfig> = {};
  
  // Standard modules are always "owned"
  private ownedArrays: Set<string> = new Set(['STD_SYS_SCANNER']);
  private ownedNodes: Set<string> = new Set(['BASIC_NODE']);

  constructor() {
    // Load TS definitions
    nodesData.forEach(n => this.nodes[n.id] = n);
    
    // Arrays need hydration from raw data
    (arraysData as any[]).forEach(a => {
        // Hydrate the array nodes based on referencing IDs if present
        const hydratedNodes = a.nodeIds ? a.nodeIds.map((nid: string) => this.nodes[nid]).filter(Boolean) : [];
        
        this.arrays[a.id] = {
            ...a,
            nodes: hydratedNodes
        };
    });
    
    this.loadRuntime();
  }

  private loadRuntime() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // We might allow user-created arrays here in future, for now just custom ownership
      if (parsed.ownedArrays) {
          parsed.ownedArrays.forEach((id: string) => this.ownedArrays.add(id));
      }
    }
  }

  getAvailableArrays(): SensorArrayConfig[] {
    // Return standard array + any others
    // For now we just return all defined arrays as "Available" implies selectable
    // In a real game loop we'd check ownedArrays
    return Object.values(this.arrays);
  }

  getArray(id: string): SensorArrayConfig | undefined {
    return this.arrays[id];
  }

  // Ensures the Basic Node is always present as fallback
  getBasicNode(): SensorNodeConfig {
    return this.nodes['BASIC_NODE'];
  }
}

export const sensorService = new SensorService();
