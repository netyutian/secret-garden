import { GameState, Plot, PlotState, Tool } from './types';
import { FLOWER_MAP } from '../data/flowers';

const COLS = 6;
const ROWS = 6;

function createPlots(): Plot[] {
  const plots: Plot[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const isLocked = x > 1 || y > 1;
      plots.push({
        id: `${x}-${y}`,
        x,
        y,
        state: 'wild',
        flowerId: null,
        plantedAt: null,
        locked: isLocked,
      });
    }
  }
  return plots;
}

export function createGameState(): GameState {
  return {
    plots: createPlots(),
    discoveredFlowers: new Set(),
    selectedFlowerId: null,
    activeTool: null,
    water: 20,
    maxWater: 20,
    coins: 0,
    lastWaterRefill: Date.now(),
    encyclopediaOpen: false,
  };
}

export function getPlotAt(state: GameState, x: number, y: number): Plot | undefined {
  return state.plots.find(p => p.x === x && p.y === y);
}

export function consumeWater(state: GameState, amount: number): GameState {
  if (state.water < amount) return state;
  return { ...state, water: state.water - amount };
}

export function refillWater(state: GameState): GameState {
  if (state.water >= state.maxWater) return state;
  return { ...state, water: state.maxWater, lastWaterRefill: Date.now() };
}

export function addCoins(state: GameState, amount: number): GameState {
  return { ...state, coins: state.coins + amount };
}

export function unlockPlot(state: GameState, plotId: string): GameState {
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot || !plot.locked) return state;
  const cost = plotUnlockCost(plot.x, plot.y);
  if (state.coins < cost) return state;
  const newPlots = state.plots.map(p => {
    if (p.id !== plotId) return p;
    return { ...p, locked: false };
  });
  return { ...state, plots: newPlots, coins: state.coins - cost };
}

function plotUnlockCost(x: number, y: number): number {
  const distance = Math.max(x, y);
  return distance * 10;
}

export function advancePlot(state: GameState, plotId: string, tool: string | null): GameState {
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot || plot.locked) return state;

  const nextState = computeNextState(plot.state, plot.flowerId, tool);
  if (nextState === plot.state) return state;

  let newState = { ...state };

  if (tool === 'water' && ['seed', 'sprout', 'growing'].includes(plot.state)) {
    if (newState.water < 1) return state;
    newState = { ...newState, water: newState.water - 1 };
  }

  if (tool === 'hoe' && plot.state === 'wild') {
    newState = { ...newState, coins: newState.coins + 2 };
  }

  const newPlots = newState.plots.map(p => {
    if (p.id !== plotId) return p;
    return {
      ...p,
      state: nextState,
      plantedAt: nextState === 'seed' ? Date.now() : p.plantedAt,
    };
  });

  return { ...newState, plots: newPlots };
}

function computeNextState(
  current: PlotState,
  flowerId: string | null,
  tool: string | null
): PlotState {
  switch (current) {
    case 'wild':
      return tool === 'hoe' ? 'tilled' : 'wild';
    case 'tilled':
      return tool === 'seed' && flowerId ? 'seed' : 'tilled';
    case 'seed':
      return tool === 'water' ? 'sprout' : 'seed';
    case 'sprout':
      return tool === 'water' ? 'growing' : 'sprout';
    case 'growing':
      return tool === 'water' ? 'blooming' : 'growing';
    case 'blooming':
      return tool === 'shovel' ? 'wild' : 'blooming';
    case 'withered':
      return tool === 'shovel' ? 'wild' : 'withered';
    default:
      return current;
  }
}

export function plantFlower(state: GameState, plotId: string, flowerId: string): GameState {
  const newPlots = state.plots.map(p => {
    if (p.id !== plotId) return p;
    if (p.state !== 'tilled') return p;
    return { ...p, state: 'seed' as PlotState, flowerId, plantedAt: Date.now() };
  });

  return { ...state, plots: newPlots, selectedFlowerId: null, activeTool: null };
}

export function witherPlot(state: GameState, plotId: string): GameState {
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot || plot.state !== 'blooming') return state;

  const flower = plot.flowerId ? FLOWER_MAP.get(plot.flowerId) : null;
  const reward = flower?.bloomReward || 5;

  const newPlots = state.plots.map(p => {
    if (p.id !== plotId) return p;
    if (p.flowerId) {
      state.discoveredFlowers.add(p.flowerId);
    }
    return { ...p, state: 'withered' as PlotState };
  });

  return { ...state, plots: newPlots, coins: state.coins + reward };
}

export function setEncyclopediaOpen(state: GameState, open: boolean): GameState {
  return { ...state, encyclopediaOpen: open };
}

export function setTool(state: GameState, tool: string | null): GameState {
  return { ...state, activeTool: tool as Tool | null };
}

export function selectFlower(state: GameState, flowerId: string | null): GameState {
  return { ...state, selectedFlowerId: flowerId, activeTool: flowerId ? 'seed' : null };
}

export function getAvailableActions(plot: Plot, activeTool: string | null): string[] {
  const actions: string[] = [];
  switch (plot.state) {
    case 'wild':
      actions.push('开荒');
      break;
    case 'tilled':
      actions.push('播种');
      break;
    case 'seed':
    case 'sprout':
    case 'growing':
      actions.push('浇水');
      break;
    case 'blooming':
      actions.push('凋谢');
      actions.push('铲除');
      break;
    case 'withered':
      actions.push('铲除');
      break;
  }
  return actions;
}

export function getStateLabel(state: PlotState): string {
  const labels: Record<PlotState, string> = {
    wild: '荒地',
    tilled: '耕地',
    seed: '种子',
    sprout: '发芽',
    growing: '成长',
    blooming: '盛开',
    withered: '凋谢',
  };
  return labels[state];
}
