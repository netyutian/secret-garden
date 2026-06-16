import { GameState } from '../game/types';
import { FLOWERS } from '../data/flowers';

export function renderEncyclopedia(state: GameState, onChange: (s: GameState) => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'encyclopedia-container';
  if (!state.encyclopediaOpen) container.classList.add('hidden');

  const panel = document.createElement('div');
  panel.className = 'encyclopedia';

  const header = document.createElement('div');
  header.className = 'encyclopedia-header';
  const count = state.discoveredFlowers.size;
  const total = FLOWERS.length;
  header.innerHTML = `<span>🌸 花之图鉴</span><span>${count}/${total}</span>`;
  panel.appendChild(header);

  const list = document.createElement('div');
  list.className = 'encyclopedia-list';

  FLOWERS.forEach(flower => {
    const isDiscovered = state.discoveredFlowers.has(flower.id);
    const card = document.createElement('div');
    card.className = `flower-card ${isDiscovered ? '' : 'locked'}`;

    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = isDiscovered ? flower.emoji : '🔒';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = isDiscovered ? flower.name : '???';

    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = isDiscovered ? '已收集' : '未解锁';

    card.appendChild(emoji);
    card.appendChild(name);
    card.appendChild(status);

    if (isDiscovered) {
      const desc = document.createElement('div');
      desc.style.fontSize = '12px';
      desc.style.color = '#666';
      desc.style.marginTop = '4px';
      desc.style.width = '100%';
      desc.textContent = flower.description;
      card.appendChild(desc);
      card.style.flexWrap = 'wrap';
    }

    list.appendChild(card);
  });

  panel.appendChild(list);
  container.appendChild(panel);
  return container;
}

export function updateEncyclopedia(container: HTMLElement, state: GameState, onChange: (s: GameState) => void): HTMLElement {
  const newContainer = renderEncyclopedia(state, onChange);
  container.replaceWith(newContainer);
  return newContainer;
}
