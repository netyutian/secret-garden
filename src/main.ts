import { createGameState } from './game/state';
import { GameState } from './game/types';
import { renderGarden, updateGarden } from './ui/garden-view';
import { renderEncyclopedia, updateEncyclopedia } from './ui/encyclopedia';
import { renderToolbar, updateToolbar } from './ui/toolbar';

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app element');

let state = createGameState();

const gardenView = renderGarden(state, handleChange);
let encyclopedia = renderEncyclopedia(state);
let toolbar = renderToolbar(state, handleChange);

app.appendChild(gardenView);
app.appendChild(encyclopedia);
app.appendChild(toolbar);

function handleChange(next: GameState) {
  state = next;
  updateGarden(gardenView, state, handleChange);
  encyclopedia = updateEncyclopedia(encyclopedia, state);
  toolbar = updateToolbar(toolbar, state, handleChange);
}
