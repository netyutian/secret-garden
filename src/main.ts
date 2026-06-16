import { createGameState, refillWater } from './game/state';
import { GameState } from './game/types';
import { renderGarden, updateGarden } from './ui/garden-view';
import { renderEncyclopedia, updateEncyclopedia } from './ui/encyclopedia';
import { renderToolbar, updateToolbar } from './ui/toolbar';
import { renderStatusBar, updateStatusBar } from './ui/status-bar';
import { startBGM, stopBGM, isPlayingBGM } from './audio/sound';

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app element');

let state = createGameState();

const gardenView = renderGarden(state, handleChange);
let encyclopedia = renderEncyclopedia(state);
let toolbar = renderToolbar(state, handleChange);
let statusBar = renderStatusBar(state);

// BGM toggle button
const bgmBtn = document.createElement('button');
bgmBtn.className = 'bgm-btn';
bgmBtn.textContent = '🔇';
bgmBtn.title = '背景音乐';
function updateBgmButton() {
  bgmBtn.textContent = isPlayingBGM() ? '🔊' : '🔇';
  bgmBtn.classList.toggle('playing', isPlayingBGM());
}
bgmBtn.addEventListener('click', () => {
  if (isPlayingBGM()) {
    stopBGM();
  } else {
    startBGM();
  }
  updateBgmButton();
});

app.appendChild(statusBar);
app.appendChild(gardenView);
app.appendChild(encyclopedia);
app.appendChild(toolbar);
app.appendChild(bgmBtn);

function handleChange(next: GameState) {
  state = next;
  updateGarden(gardenView, state, handleChange);
  encyclopedia = updateEncyclopedia(encyclopedia, state);
  toolbar = updateToolbar(toolbar, state, handleChange);
  statusBar = updateStatusBar(statusBar, state);
}

// Auto-refill water every 30 seconds
setInterval(() => {
  const next = refillWater(state);
  if (next !== state) {
    handleChange(next);
  }
}, 5000);
