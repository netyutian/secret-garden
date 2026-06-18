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
  locked: boolean;
}

export interface FlowerDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  stageEmojis: Record<PlotState, string>;
  description: string;
  unlockCost: number;
  bloomReward: number;
}

export interface GameState {
  plots: Plot[];
  discoveredFlowers: Set<string>;
  selectedFlowerId: string | null;
  water: number;
  maxWater: number;
  coins: number;
  lastWaterRefill: number;
  encyclopediaOpen: boolean;
}
