import { GameState, Plot } from '../game/types';
import { FLOWER_MAP, FLOWERS } from '../data/flowers';
import { getStateLabel, advancePlot, plantFlower, witherPlot, getAvailableActions } from '../game/state';
import { showToast } from './toast';

export function renderGarden(state: GameState, onChange: (s: GameState) => void): HTMLElement {
  const viewport = document.createElement('div');
  viewport.className = 'garden-viewport';

  const scene = document.createElement('div');
  scene.className = 'garden-scene';
  updateSceneTransform(scene, state);

  const grid = document.createElement('div');
  grid.className = 'plot-grid';
  renderPlots(grid, state, onChange, viewport);

  scene.appendChild(grid);
  viewport.appendChild(scene);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'zoom-controls';
  const zoomIn = document.createElement('button');
  zoomIn.className = 'zoom-btn';
  zoomIn.textContent = '+';
  zoomIn.title = '放大';
  zoomIn.addEventListener('click', (e) => {
    e.stopPropagation();
    onChange({ ...state, zoom: Math.max(0.5, Math.min(2, state.zoom + 0.2)) });
  });
  const zoomOut = document.createElement('button');
  zoomOut.className = 'zoom-btn';
  zoomOut.textContent = '-';
  zoomOut.title = '缩小';
  zoomOut.addEventListener('click', (e) => {
    e.stopPropagation();
    onChange({ ...state, zoom: Math.max(0.5, Math.min(2, state.zoom - 0.2)) });
  });
  zoomControls.appendChild(zoomIn);
  zoomControls.appendChild(zoomOut);
  viewport.appendChild(zoomControls);

  setupDrag(viewport, scene, state, onChange);
  setupZoom(viewport, state, onChange);

  return viewport;
}

function updateSceneTransform(scene: HTMLElement, state: GameState) {
  scene.style.transform = `translate(${state.sceneOffset.x}px, ${state.sceneOffset.y}px) scale(${state.zoom})`;
}

function renderPlots(
  grid: HTMLElement,
  state: GameState,
  onChange: (s: GameState) => void,
  viewport: HTMLElement
) {
  grid.innerHTML = '';

  state.plots.forEach(plot => {
    const el = document.createElement('div');
    el.className = `plot ${plot.state}`;
    el.dataset.id = plot.id;

    const flower = plot.flowerId ? FLOWER_MAP.get(plot.flowerId) : null;
    const emoji = flower?.stageEmojis[plot.state] || '';
    el.textContent = emoji;

    const label = document.createElement('span');
    label.className = 'plot-label';
    label.textContent = flower ? flower.name : getStateLabel(plot.state);
    el.appendChild(label);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      handlePlotClick(plot, state, onChange, el, viewport);
    });

    grid.appendChild(el);
  });
}

function handlePlotClick(
  plot: Plot,
  state: GameState,
  onChange: (s: GameState) => void,
  el: HTMLElement,
  viewport: HTMLElement
) {
  const existingMenu = viewport.querySelector('.plot-menu');
  if (existingMenu) existingMenu.remove();

  if (state.activeTool === 'hoe' && plot.state === 'wild') {
    onChange(advancePlot(state, plot.id, 'hoe'));
    showToast('已开荒');
    return;
  }
  if (state.activeTool === 'water' && ['seed', 'sprout', 'growing'].includes(plot.state)) {
    onChange(advancePlot(state, plot.id, 'water'));
    showToast('浇水成功');
    return;
  }
  if (state.activeTool === 'shovel' && ['blooming', 'withered'].includes(plot.state)) {
    onChange(advancePlot(state, plot.id, 'shovel'));
    showToast('已铲除');
    return;
  }
  if (state.activeTool === 'seed' && plot.state === 'tilled' && state.selectedFlowerId) {
    onChange(plantFlower(state, plot.id, state.selectedFlowerId));
    showToast('播种完成');
    return;
  }

  showMenu(plot, state, onChange, el, viewport);
}

function showMenu(
  plot: Plot,
  state: GameState,
  onChange: (s: GameState) => void,
  el: HTMLElement,
  viewport: HTMLElement
) {
  const menu = document.createElement('div');
  menu.className = 'plot-menu';

  const rect = el.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  menu.style.left = `${rect.left - viewportRect.left + rect.width / 2 - 60}px`;
  menu.style.top = `${rect.top - viewportRect.top - 10}px`;

  const actions = getAvailableActions(plot, state.activeTool);

  if (plot.state === 'wild') {
    addBtn(menu, '⛏️', '开荒', () => {
      onChange(advancePlot(state, plot.id, 'hoe'));
      showToast('已开荒');
      menu.remove();
    });
  }

  if (plot.state === 'tilled') {
    addBtn(menu, '🌱', '播种', () => {
      showSeedSelector(plot, state, onChange, menu);
    });
  }

  if (['seed', 'sprout', 'growing'].includes(plot.state)) {
    addBtn(menu, '💧', '浇水', () => {
      onChange(advancePlot(state, plot.id, 'water'));
      showToast('浇水成功');
      menu.remove();
    });
  }

  if (plot.state === 'blooming') {
    addBtn(menu, '🍂', '凋谢', () => {
      onChange(witherPlot(state, plot.id));
      showToast('花已凋谢');
      menu.remove();
    });
    addBtn(menu, '⛏️', '铲除', () => {
      onChange(advancePlot(state, plot.id, 'shovel'));
      showToast('已铲除');
      menu.remove();
    });
  }

  if (plot.state === 'withered') {
    addBtn(menu, '⛏️', '铲除', () => {
      onChange(advancePlot(state, plot.id, 'shovel'));
      showToast('已铲除');
      menu.remove();
    });
  }

  viewport.appendChild(menu);

  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      viewport.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => viewport.addEventListener('click', closeHandler), 0);
}

function addBtn(menu: HTMLElement, icon: string, text: string, onClick: () => void) {
  const btn = document.createElement('button');
  btn.className = 'menu-btn';
  btn.innerHTML = `<span class="icon">${icon}</span><span>${text}</span>`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  menu.appendChild(btn);
}

function showSeedSelector(
  plot: Plot,
  state: GameState,
  onChange: (s: GameState) => void,
  menu: HTMLElement
) {
  menu.innerHTML = '';
  FLOWERS.forEach((flower: any) => {
    const row = document.createElement('div');
    row.className = 'seed-option';
    row.innerHTML = `<span class="emoji">${flower.emoji}</span><span class="name">${flower.name}</span>`;
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      onChange(plantFlower(state, plot.id, flower.id));
      showToast(`已播种 ${flower.name}`);
      menu.remove();
    });
    menu.appendChild(row);
  });
}

function setupDrag(
  viewport: HTMLElement,
  scene: HTMLElement,
  state: GameState,
  onChange: (s: GameState) => void
) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let offsetX = state.sceneOffset.x;
  let offsetY = state.sceneOffset.y;

  viewport.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('.plot')) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    offsetX = state.sceneOffset.x;
    offsetY = state.sceneOffset.y;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    scene.style.transform = `translate(${offsetX + dx}px, ${offsetY + dy}px) scale(${state.zoom})`;
  });

  window.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    viewport.style.cursor = 'grab';
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    onChange({
      ...state,
      sceneOffset: { x: offsetX + dx, y: offsetY + dy },
    });
  });
}

function setupZoom(
  viewport: HTMLElement,
  state: GameState,
  onChange: (s: GameState) => void
) {
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, state.zoom + delta));
    onChange({ ...state, zoom: newZoom });
  }, { passive: false });
}

export function updateGarden(viewport: HTMLElement, state: GameState, onChange: (s: GameState) => void) {
  const scene = viewport.querySelector('.garden-scene') as HTMLElement;
  if (scene) updateSceneTransform(scene, state);

  const grid = viewport.querySelector('.plot-grid') as HTMLElement;
  if (grid) renderPlots(grid, state, onChange, viewport);
}
