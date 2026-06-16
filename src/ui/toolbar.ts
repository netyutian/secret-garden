import { GameState } from '../game/types';
import { setTool, selectFlower } from '../game/state';
import { FLOWERS } from '../data/flowers';

export function renderToolbar(state: GameState, onChange: (s: GameState) => void): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '16px';
  container.style.bottom = '16px';
  container.style.zIndex = '50';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-start';
  container.style.gap = '8px';

  const bar = document.createElement('div');
  bar.className = 'toolbar';
  bar.style.position = 'static';

  const tools: { id: string; icon: string; label: string }[] = [
    { id: 'hand', icon: '✋', label: '手' },
    { id: 'hoe', icon: '⛏️', label: '锄头' },
    { id: 'water', icon: '💧', label: '水壶' },
    { id: 'seed', icon: '🌱', label: '种子' },
    { id: 'shovel', icon: '🔪', label: '铲子' },
  ];

  tools.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn';
    if (state.activeTool === t.id) btn.classList.add('active');
    btn.textContent = t.icon;
    btn.title = t.label;
    btn.addEventListener('click', () => {
      if (t.id === 'seed') {
        if (state.activeTool === 'seed') {
          onChange(setTool(state, null));
        } else {
          onChange(selectFlower(state, state.selectedFlowerId || FLOWERS[0].id));
        }
      } else if (state.activeTool === t.id) {
        onChange(setTool(state, null));
      } else {
        onChange(setTool(state, t.id));
      }
    });
    bar.appendChild(btn);
  });

  container.appendChild(bar);

  if (state.activeTool === 'seed') {
    const selector = document.createElement('div');
    selector.className = 'seed-selector';
    selector.style.position = 'static';
    selector.style.animation = 'popIn 0.15s ease-out';
    FLOWERS.forEach(flower => {
      const row = document.createElement('div');
      row.className = 'seed-option';
      if (state.selectedFlowerId === flower.id) {
        row.style.background = 'rgba(232, 160, 75, 0.2)';
        row.style.borderRadius = '8px';
      }
      row.innerHTML = `<span class="emoji">${flower.emoji}</span><span class="name">${flower.name}</span>`;
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        onChange(selectFlower(state, flower.id));
      });
      selector.appendChild(row);
    });
    container.appendChild(selector);
  }

  return container;
}

export function updateToolbar(bar: HTMLElement, state: GameState, onChange: (s: GameState) => void): HTMLElement {
  const newBar = renderToolbar(state, onChange);
  bar.replaceWith(newBar);
  return newBar;
}
