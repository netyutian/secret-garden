// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { renderGarden, updateGarden } from './garden-view';
import { createGameState, advancePlot, plantFlower, witherPlot } from '../game/state';
import { GameState } from '../game/types';

// jsdom has no Web Audio. Stub AudioContext so the click handlers' sound
// helpers don't crash when invoked during dispatch.
class FakeOsc { type=''; frequency={ value:0, setValueAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){}, cancelScheduledValues(){} }; connect(){} disconnect(){} start(){} stop(){} }
class FakeGain { gain={ value:0, setValueAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){}, cancelScheduledValues(){} }; connect(){} disconnect(){} }
class FakeAudioCtx {
  currentTime = 0;
  destination = {} as any;
  sampleRate = 44100;
  createOscillator() { return new FakeOsc() as any; }
  createGain() { return new FakeGain() as any; }
  createBiquadFilter() { return { type:'', frequency:{value:0}, Q:{value:0}, connect(){}, disconnect(){} } as any; }
  createDelay() { return { delayTime:{value:0}, connect(){}, disconnect(){} } as any; }
  createBuffer(_c:number,len:number) { return { getChannelData: () => new Float32Array(len) } as any; }
  createBufferSource() { return { buffer:null, connect(){}, disconnect(){}, start(){}, stop(){} } as any; }
}
(globalThis as any).AudioContext = FakeAudioCtx;

// Drives the full UI loop the way main.ts does: render once, then push
// every state change back through updateGarden, mirroring the real app.
function mountGarden(initial: GameState) {
  let state = initial;
  const ref = { current: state };
  const onChange = (next: GameState) => {
    state = next;
    ref.current = next;
    updateGarden(viewport, state, onChange);
  };
  const viewport = renderGarden(state, onChange);
  document.body.appendChild(viewport);
  return { viewport, getState: () => ref.current };
}

function dispatch(el: Element, type: string, init: MouseEventInit = {}) {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
}

describe('garden-view — one-click plot actions', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('clicking wild plot tills it', () => {
    const state = createGameState();
    const { viewport, getState } = mountGarden(state);
    const plot = viewport.querySelector('[data-id="0-0"]') as HTMLElement;
    dispatch(plot, 'click');
    expect(getState().plots.find(p => p.id === '0-0')!.state).toBe('tilled');
  });

  it('clicking seeded plot advances with water', () => {
    let state = createGameState();
    state = advancePlot(state, '0-0', 'hoe');
    state = plantFlower(state, '0-0', 'daisy');
    const { viewport, getState } = mountGarden(state);
    const plot = viewport.querySelector('[data-id="0-0"]') as HTMLElement;
    dispatch(plot, 'click');
    expect(getState().plots.find(p => p.id === '0-0')!.state).toBe('sprout');
  });

  it('clicking blooming plot withers it', () => {
    let state = createGameState();
    state = advancePlot(state, '0-0', 'hoe');
    state = plantFlower(state, '0-0', 'daisy');
    state = advancePlot(state, '0-0', 'water');
    state = advancePlot(state, '0-0', 'water');
    state = advancePlot(state, '0-0', 'water');
    expect(state.plots.find(p => p.id === '0-0')!.state).toBe('blooming');

    const { viewport, getState } = mountGarden(state);
    const plot = viewport.querySelector('[data-id="0-0"]') as HTMLElement;
    dispatch(plot, 'click');
    expect(getState().plots.find(p => p.id === '0-0')!.state).toBe('withered');
  });

  it('clicking withered plot clears it', () => {
    let state = createGameState();
    state = advancePlot(state, '0-0', 'hoe');
    state = plantFlower(state, '0-0', 'daisy');
    state = advancePlot(state, '0-0', 'water');
    state = advancePlot(state, '0-0', 'water');
    state = advancePlot(state, '0-0', 'water');
    state = witherPlot(state, '0-0');

    const { viewport, getState } = mountGarden(state);
    const plot = viewport.querySelector('[data-id="0-0"]') as HTMLElement;
    dispatch(plot, 'click');
    expect(getState().plots.find(p => p.id === '0-0')!.state).toBe('wild');
  });

  it('sets title attribute to action label', () => {
    const state = createGameState();
    const { viewport } = mountGarden(state);
    const plot = viewport.querySelector('[data-id="0-0"]') as HTMLElement;
    expect(plot.title).toBe('开荒');
  });

  it('clicking tilled plot opens seed selector', () => {
    let state = createGameState();
    state = advancePlot(state, '0-0', 'hoe');
    const { viewport } = mountGarden(state);
    const plot = viewport.querySelector('[data-id="0-0"]') as HTMLElement;
    dispatch(plot, 'click');
    expect(viewport.querySelector('.plot-menu')).toBeTruthy();
    expect(viewport.querySelector('.seed-option')).toBeTruthy();
  });
});

describe('garden-view — stale-state regression', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  // The original bug: the water source listener closed over the initial
  // state from renderGarden(). After a plant/water cycle, clicking it would
  // roll back to the stale state and reset every plot.
  it('clicking an empty viewport area does not reset planted flowers', () => {
    let state = createGameState();
    // Open the 4 starter plots to the same flow the user did: hoe → seed → water×3.
    const ids = ['0-0', '1-0', '0-1', '1-1'];
    for (const id of ids) {
      state = advancePlot(state, id, 'hoe');
      state = plantFlower(state, id, 'daisy');
      state = advancePlot(state, id, 'water'); // seed → sprout
      state = advancePlot(state, id, 'water'); // sprout → growing
      state = advancePlot(state, id, 'water'); // growing → blooming
    }
    for (const id of ids) {
      expect(state.plots.find(p => p.id === id)!.state).toBe('blooming');
    }

    const { viewport, getState } = mountGarden(state);

    // Pure click on the empty viewport (mousedown + mouseup at the same
    // coords). Pre-fix this committed onChange with stale initial state.
    dispatch(viewport, 'mousedown', { clientX: 200, clientY: 200 });
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200, bubbles: true }));

    for (const id of ids) {
      expect(getState().plots.find(p => p.id === id)!.state).toBe('blooming');
    }
  });

  it('water source click after planting keeps every plot intact', () => {
    let state = createGameState();
    state = advancePlot(state, '0-0', 'hoe');
    state = plantFlower(state, '0-0', 'rose');
    state = advancePlot(state, '0-0', 'water');
    state = advancePlot(state, '0-0', 'water');
    state = advancePlot(state, '0-0', 'water');
    // Drain water so refill actually changes state.
    state = { ...state, water: 1 };

    const { viewport, getState } = mountGarden(state);
    const water = viewport.querySelector('.water-source') as HTMLElement;
    dispatch(water, 'click');

    expect(getState().plots.find(p => p.id === '0-0')!.state).toBe('blooming');
    expect(getState().plots.find(p => p.id === '0-0')!.flowerId).toBe('rose');
    expect(getState().water).toBe(getState().maxWater);
  });
});
