import { GameState, Plot } from '../game/types';
import { FLOWER_MAP, FLOWERS } from '../data/flowers';
import { getStateLabel, advancePlot, plantFlower, witherPlot, getAvailableActions, refillWater, unlockPlot } from '../game/state';
import { playClickSound, playWaterSound, playBloomSound, playUnlockSound, playErrorSound } from '../audio/sound';
import { showToast } from './toast';

// Long-lived viewport listeners (water source) are registered once in
// renderGarden but need to act on the LATEST state, not the snapshot they
// were registered with. Without this ref, a click on the water source could
// commit a stale state and reset the garden.
//
// The garden is a singleton in this app, so a module-level ref is safe.
let gardenState: GameState | null = null;
function getGardenState(): GameState {
  if (!gardenState) throw new Error('garden state accessed before init');
  return gardenState;
}

export function renderGarden(state: GameState, onChange: (s: GameState) => void): HTMLElement {
  gardenState = state;

  const viewport = document.createElement('div');
  viewport.className = 'garden-viewport';
  viewport.classList.toggle('tool-water', state.activeTool === 'water');

  const scene = document.createElement('div');
  scene.className = 'garden-scene';
  updateSceneTransform(scene);

  const grid = document.createElement('div');
  grid.className = 'plot-grid';
  renderPlots(grid, state, onChange, viewport);

  scene.appendChild(grid);

  viewport.appendChild(scene);

  // Water source lives on the viewport (not the scene) so it never
  // participates in garden clicks.
  const waterSource = document.createElement('div');
  waterSource.className = 'water-source';
  waterSource.innerHTML = '<span class="water-drop">💧</span><span class="water-ripple"></span><span class="water-ripple delay"></span>';
  waterSource.title = '水源：点击补满水滴（无限续杯）';
  waterSource.addEventListener('mousedown', (e) => e.stopPropagation());
  waterSource.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  waterSource.addEventListener('click', (e) => {
    e.stopPropagation();
    const cur = getGardenState();
    const next = refillWater(cur);
    playWaterSound();
    if (next === cur) {
      showToast(`水滴已满 ${cur.water}/${cur.maxWater}`);
    } else {
      onChange(next);
      showToast(`水滴已补满 ${next.water}/${next.maxWater}`);
    }
  });
  viewport.appendChild(waterSource);

  return viewport;
}

function updateSceneTransform(scene: HTMLElement) {
  scene.style.transform = 'translate(-50%, -50%)';
}

function renderPlots(
  grid: HTMLElement,
  state: GameState,
  onChange: (s: GameState) => void,
  viewport: HTMLElement
) {
  // Index existing elements so we only touch plots that changed. The DOM
  // order is preserved by appending each element (new or reused) into a
  // fragment and then into the grid.
  const existingById = new Map<string, HTMLElement>();
  grid.querySelectorAll('.plot').forEach(node => {
    const el = node as HTMLElement;
    const id = el.dataset.id;
    if (id) existingById.set(id, el);
  });

  const fragment = document.createDocumentFragment();

  state.plots.forEach(plot => {
    let el = existingById.get(plot.id);
    const needsRebuild = !el ||
      el.dataset.state !== plot.state ||
      el.dataset.flowerId !== (plot.flowerId || '') ||
      el.dataset.locked !== String(plot.locked);

    if (!needsRebuild) {
      fragment.appendChild(el!);
      return;
    }

    const wasBlooming = el?.dataset.state === 'blooming';
    const isBlooming = plot.state === 'blooming';
    const justBloomed = isBlooming && !wasBlooming;

    if (el) el.remove();

    el = document.createElement('div');
    el.className = `plot ${plot.state}`;
    if (plot.locked) el.classList.add('locked');
    el.dataset.id = plot.id;
    el.dataset.state = plot.state;
    el.dataset.flowerId = plot.flowerId || '';
    el.dataset.locked = String(plot.locked);

    if (plot.locked) {
      el.textContent = '🔒';
      const label = document.createElement('span');
      label.className = 'plot-label';
      label.textContent = '锁定';
      el.appendChild(label);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        handleLockedPlotClick(plot.id, onChange, el!, viewport);
      });
    } else {
      const flower = plot.flowerId ? FLOWER_MAP.get(plot.flowerId) : null;
      renderPlotContent(el, plot, flower);

      const label = document.createElement('span');
      label.className = 'plot-label';
      label.textContent = flower ? flower.name : getStateLabel(plot.state);
      el.appendChild(label);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        handlePlotClick(plot.id, onChange, el!, viewport);
      });

      // Only the plot that transitions into blooming should play the big
      // entrance pop. Re-rendering an already-blooming plot does NOT replay it.
      if (justBloomed) {
        const bloom = el.querySelector('.flora-bloom') as HTMLElement | null;
        if (bloom) {
          bloom.classList.add('just-bloomed');
          bloom.addEventListener('animationend', () => {
            bloom.classList.remove('just-bloomed');
          }, { once: true });
        }
      }
    }

    fragment.appendChild(el);
  });

  // Clean up any plot elements that no longer exist in state (defensive).
  existingById.forEach((el, id) => {
    if (!state.plots.find(p => p.id === id)) el.remove();
  });

  grid.appendChild(fragment);
}

// Render the visual content of a non-locked plot. Growing/blooming plots
// build a tall stacked stem + bloom that escapes the plot box upward.
function renderPlotContent(el: HTMLElement, plot: Plot, flower: ReturnType<typeof FLOWER_MAP.get> | null) {
  const stage = plot.state;
  const bloom = flower?.stageEmojis.blooming || flower?.emoji || '🌸';

  if (stage === 'sprout') {
    const stack = document.createElement('div');
    stack.className = 'flora-stack sprout-stack';
    stack.innerHTML = '<span class="flora-leaf">🌱</span>';
    el.appendChild(stack);
    return;
  }

  if (stage === 'growing') {
    const stack = document.createElement('div');
    stack.className = 'flora-stack growing-stack';
    stack.innerHTML = `
      <span class="flora-bud">🌿</span>
      <span class="flora-stem">🌿</span>
      <span class="flora-stem">🌱</span>
    `;
    el.appendChild(stack);
    return;
  }

  if (stage === 'blooming') {
    const stack = document.createElement('div');
    stack.className = 'flora-stack blooming-stack';
    stack.innerHTML = `
      <span class="flora-bloom">${bloom}</span>
      <span class="flora-stem tall">🌿</span>
      <span class="flora-stem">🌿</span>
    `;
    const aura = document.createElement('span');
    aura.className = 'bloom-aura';
    el.appendChild(aura);
    el.appendChild(stack);
    for (let i = 0; i < 6; i++) {
      const sp = document.createElement('span');
      sp.className = `bloom-sparkle s${i}`;
      sp.textContent = i % 2 === 0 ? '✨' : '·';
      el.appendChild(sp);
    }
    return;
  }

  if (stage === 'withered') {
    el.textContent = '🥀';
    return;
  }

  // wild / tilled / seed: just the stage emoji (or empty)
  el.textContent = flower?.stageEmojis[stage] || '';
}

function handleLockedPlotClick(
  plotId: string,
  onChange: (s: GameState) => void,
  el: HTMLElement,
  viewport: HTMLElement
) {
  const state = getGardenState();
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot || !plot.locked) return;

  const existingMenu = viewport.querySelector('.plot-menu');
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement('div');
  menu.className = 'plot-menu';
  const rect = el.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  menu.style.left = `${rect.left - viewportRect.left + rect.width / 2 - 60}px`;
  menu.style.top = `${rect.top - viewportRect.top - 10}px`;

  const cost = Math.max(plot.x, plot.y) * 10;
  addBtn(menu, '🔓', `解锁 (${cost}💰)`, () => {
    const next = unlockPlot(state, plot.id);
    if (next === state) {
      playErrorSound();
      showToast('金币不足');
    } else {
      playUnlockSound();
      onChange(next);
      showToast('地块已解锁');
    }
    menu.remove();
  });

  viewport.appendChild(menu);
  clampMenuToViewport(menu, viewport);
  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      viewport.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => viewport.addEventListener('click', closeHandler), 0);
}

function handlePlotClick(
  plotId: string,
  onChange: (s: GameState) => void,
  el: HTMLElement,
  viewport: HTMLElement
) {
  const state = getGardenState();
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot) return;

  const existingMenu = viewport.querySelector('.plot-menu');
  if (existingMenu) existingMenu.remove();

  if (state.activeTool === 'hoe' && plot.state === 'wild') {
    playClickSound();
    onChange(advancePlot(state, plot.id, 'hoe'));
    showToast('已开荒');
    return;
  }
  if (state.activeTool === 'water' && ['seed', 'sprout', 'growing'].includes(plot.state)) {
    const next = advancePlot(state, plot.id, 'water');
    if (next === state) {
      playErrorSound();
      showToast('水滴不足');
    } else {
      playWaterSound();
      onChange(next);
      showToast('浇水成功');
    }
    return;
  }
  if (state.activeTool === 'shovel' && ['blooming', 'withered'].includes(plot.state)) {
    playClickSound();
    onChange(advancePlot(state, plot.id, 'shovel'));
    showToast('已铲除');
    return;
  }
  if (state.activeTool === 'seed' && plot.state === 'tilled' && state.selectedFlowerId) {
    playClickSound();
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
      playClickSound();
      onChange(advancePlot(state, plot.id, 'hoe'));
      showToast('已开荒');
      menu.remove();
    });
  }

  if (plot.state === 'tilled') {
    addBtn(menu, '🌱', '播种', () => {
      playClickSound();
      showSeedSelector(plot, state, onChange, menu);
    });
  }

  if (['seed', 'sprout', 'growing'].includes(plot.state)) {
    addBtn(menu, '💧', '浇水', () => {
      const next = advancePlot(state, plot.id, 'water');
      if (next === state) {
        playErrorSound();
        showToast('水滴不足');
      } else {
        playWaterSound();
        onChange(next);
        showToast('浇水成功');
      }
      menu.remove();
    });
  }

  if (plot.state === 'blooming') {
    addBtn(menu, '🍂', '凋谢', () => {
      playBloomSound();
      onChange(witherPlot(state, plot.id));
      showToast('花已凋谢');
      menu.remove();
    });
    addBtn(menu, '⛏️', '铲除', () => {
      playClickSound();
      onChange(advancePlot(state, plot.id, 'shovel'));
      showToast('已铲除');
      menu.remove();
    });
  }

  if (plot.state === 'withered') {
    addBtn(menu, '⛏️', '铲除', () => {
      playClickSound();
      onChange(advancePlot(state, plot.id, 'shovel'));
      showToast('已铲除');
      menu.remove();
    });
  }

  viewport.appendChild(menu);
  clampMenuToViewport(menu, viewport);

  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      viewport.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => viewport.addEventListener('click', closeHandler), 0);
}

// Keep popup menus inside the viewport — without this, plots near the
// right or bottom edge open menus that get clipped.
function clampMenuToViewport(menu: HTMLElement, viewport: HTMLElement) {
  const mr = menu.getBoundingClientRect();
  const vr = viewport.getBoundingClientRect();
  const margin = 8;
  let left = mr.left - vr.left;
  let top = mr.top - vr.top;
  left = Math.max(margin, Math.min(left, vr.width - mr.width - margin));
  top = Math.max(margin, Math.min(top, vr.height - mr.height - margin));
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
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
      playClickSound();
      onChange(plantFlower(state, plot.id, flower.id));
      showToast(`已播种 ${flower.name}`);
      menu.remove();
    });
    menu.appendChild(row);
  });
  // The seed list is taller than the original action menu — re-clamp so
  // it stays inside the viewport after we've swapped contents.
  const viewport = menu.parentElement;
  if (viewport) clampMenuToViewport(menu, viewport as HTMLElement);
}


export function updateGarden(viewport: HTMLElement, state: GameState, onChange: (s: GameState) => void) {
  gardenState = state;
  viewport.classList.toggle('tool-water', state.activeTool === 'water');

  const scene = viewport.querySelector('.garden-scene') as HTMLElement;
  if (scene) updateSceneTransform(scene);

  const grid = viewport.querySelector('.plot-grid') as HTMLElement;
  if (grid) renderPlots(grid, state, onChange, viewport);
}
