import { GameState } from '../game/types';

export function renderToolbar(_state: GameState, _onChange: (s: GameState) => void): HTMLElement {
  const el = document.createElement('div');
  el.style.display = 'none';
  return el;
}

export function updateToolbar(bar: HTMLElement, _state: GameState, _onChange: (s: GameState) => void): HTMLElement {
  return bar;
}
