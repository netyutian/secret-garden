import { GameState } from '../game/types';

export function renderStatusBar(state: GameState): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'status-bar';

  const waterItem = document.createElement('div');
  waterItem.className = `status-item ${state.water <= 1 ? 'water-low' : ''}`;
  waterItem.innerHTML = `<span class="icon">💧</span><span>${state.water}/${state.maxWater}</span>`;
  bar.appendChild(waterItem);

  const coinItem = document.createElement('div');
  coinItem.className = 'status-item';
  coinItem.innerHTML = `<span class="icon">💰</span><span>${state.coins}</span>`;
  bar.appendChild(coinItem);

  return bar;
}

export function updateStatusBar(bar: HTMLElement, state: GameState): HTMLElement {
  const newBar = renderStatusBar(state);
  bar.replaceWith(newBar);
  return newBar;
}
