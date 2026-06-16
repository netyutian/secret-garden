import { GameState, Plot, PlotState } from './types';

const COLS = 6;
const ROWS = 6;

function createPlots(): Plot[] {
  const plots: Plot[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      plots.push({
        id: `${x}-${y}`,
        x,
        y,
        state: 'wild',
        flowerId: null,
        plantedAt: null,
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
    sceneOffset: { x: 0, y: 0 },
    zoom: 1,
  };
}

export function getPlotAt(state: GameState, x: number, y: number): Plot | undefined {
  return state.plots.find(p => p.x === x && p.y === y);
}

export function advancePlot(state: GameState, plotId: string, tool: string | null): GameState {
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot) return state;

  const nextState = computeNextState(plot.state, plot.flowerId, tool);
  if (nextState === plot.state) return state;

  const newPlots = state.plots.map(p => {
    if (p.id !== plotId) return p;

    return {
      ...p,
      state: nextState,
      plantedAt: nextState === 'seed' ? Date.now() : p.plantedAt,
    };
  });

  return { ...state, plots: newPlots };
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
    return { ...p, state: 'seed', flowerId, plantedAt: Date.now() };
  });

  return { ...state, plots: newPlots, selectedFlowerId: null, activeTool: null };
}

export function witherPlot(state: GameState, plotId: string): GameState {
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot || plot.state !== 'blooming') return state;

  const newPlots = state.plots.map(p => {
    if (p.id !== plotId) return p;
    if (p.flowerId) {
      state.discoveredFlowers.add(p.flowerId);
    }
    return { ...p, state: 'withered' };
  });

  return { ...state, plots: newPlots };
}

export function setTool(state: GameState, tool: string | null): GameState {
  return { ...state, activeTool: tool };
}

export function selectFlower(state: GameState, flowerId: string | null): GameState {
  return { ...state, selectedFlowerId: flowerId, activeTool: flowerId ? 'seed' : null };
}

export function moveScene(state: GameState, dx: number, dy: number): GameState {
  return {
    ...state,
    sceneOffset: {
      x: state.sceneOffset.x + dx,
      y: state.sceneOffset.y + dy,
    },
  };
}

export function setZoom(state: GameState, zoom: number): GameState {
  const clamped = Math.max(0.5, Math.min(2, zoom));
  return { ...state, zoom: clamped };
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
