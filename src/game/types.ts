export type PlotState =
  | 'wild'
  | 'tilled'
  | 'seed'
  | 'sprout'
  | 'growing'
  | 'blooming'
  | 'withered';

export interface Plot {
  id: string;
  x: number;
  y: number;
  state: PlotState;
  flowerId: string | null;
  plantedAt: number | null;
}

export interface FlowerDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  stageEmojis: Record<PlotState, string>;
  description: string;
}

export interface GameState {
  plots: Plot[];
  discoveredFlowers: Set<string>;
  selectedFlowerId: string | null;
  activeTool: Tool | null;
  sceneOffset: { x: number; y: number };
  zoom: number;
}

export type Tool = 'hoe' | 'water' | 'seed' | 'shovel' | 'hand';
