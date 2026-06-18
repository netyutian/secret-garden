# 花园地块一键操作实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让花园的荒地、浇水、凋谢、铲除四个操作点击地块直接生效，并优化悬停提示；播种改为点击耕地后弹出花种选择器。

**Architecture:** 在 `src/game/state.ts` 中新增两个纯函数：根据地块状态返回默认操作标识和提示文案；`src/ui/garden-view.ts` 的点击处理器改为按状态直接执行，不再依赖 `activeTool`，也不再为四操作弹菜单；`src/ui/toolbar.ts` 简化为只保留花种选择相关入口（本计划选择完全移除工具栏，让花种选择器由耕地点击触发）。

**Tech Stack:** TypeScript, Vite, Vitest + jsdom

## Global Constraints

- 保持现有状态流转逻辑：复用 `advancePlot`、`plantFlower`、`witherPlot`。
- 浇水时水滴不足保持现有错误提示与音效。
- 锁定地块解锁交互不变。
- 图鉴、背景音乐、水源等其它 UI 不变。
- 测试就近放置：`src/game/state.test.ts` 用于状态逻辑测试，`src/ui/garden-view.test.ts` 用于 UI 行为测试。

---

## File Structure

| 文件 | 职责 |
|-----|------|
| `src/game/state.ts` | 新增 `getDefaultAction`、`getActionLabel`；保留现有状态流转函数。 |
| `src/game/state.test.ts` | 新增：测试默认操作与提示文案。 |
| `src/ui/garden-view.ts` | 修改 `handlePlotClick`、`renderPlots`、菜单/选择器逻辑；移除 `activeTool` 分支。 |
| `src/ui/garden-view.test.ts` | 新增/修改：测试点击地块直接触发操作。 |
| `src/ui/toolbar.ts` | 移除锄头、水壶、铲子、手按钮，保留或简化种子选择逻辑（本计划选择整体移除）。 |
| `src/main.ts` | 若工具栏被移除，取消 `renderToolbar`/`updateToolbar` 的挂载与更新。 |
| `src/style.css` | 可选：清理 `.tool-water` 光标样式；本计划保持现状。 |

---

### Task 1: 新增地块默认操作与提示文案

**Files:**
- Modify: `src/game/state.ts`
- Test: `src/game/state.test.ts`

**Interfaces:**
- Consumes: `Plot` interface from `src/game/types.ts`
- Produces: `getDefaultAction(plot: Plot): 'hoe' | 'water' | 'wither' | 'shovel' | 'seed' | null` 和 `getActionLabel(plot: Plot): string`

- [ ] **Step 1: 编写失败测试**

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getDefaultAction, getActionLabel } from './state';
import { Plot } from './types';

function plot(state: Plot['state'], overrides: Partial<Plot> = {}): Plot {
  return { id: '0-0', x: 0, y: 0, state, flowerId: null, plantedAt: null, locked: false, ...overrides };
}

describe('getDefaultAction', () => {
  it('returns hoe for wild plots', () => {
    expect(getDefaultAction(plot('wild'))).toBe('hoe');
  });

  it('returns seed for tilled plots', () => {
    expect(getDefaultAction(plot('tilled'))).toBe('seed');
  });

  it('returns water for seed, sprout, growing plots', () => {
    expect(getDefaultAction(plot('seed'))).toBe('water');
    expect(getDefaultAction(plot('sprout'))).toBe('water');
    expect(getDefaultAction(plot('growing'))).toBe('water');
  });

  it('returns wither for blooming plots', () => {
    expect(getDefaultAction(plot('blooming'))).toBe('wither');
  });

  it('returns shovel for withered plots', () => {
    expect(getDefaultAction(plot('withered'))).toBe('shovel');
  });

  it('returns null for locked plots', () => {
    expect(getDefaultAction(plot('wild', { locked: true }))).toBeNull();
  });
});

describe('getActionLabel', () => {
  it('returns Chinese action labels', () => {
    expect(getActionLabel(plot('wild'))).toBe('开荒');
    expect(getActionLabel(plot('tilled'))).toBe('播种');
    expect(getActionLabel(plot('seed'))).toBe('浇水');
    expect(getActionLabel(plot('blooming'))).toBe('凋谢');
    expect(getActionLabel(plot('withered'))).toBe('铲除');
  });

  it('returns 解锁 for locked plots', () => {
    expect(getActionLabel(plot('wild', { locked: true }))).toBe('解锁');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/game/state.test.ts`

Expected: FAIL with "getDefaultAction is not defined" / "getActionLabel is not defined"

- [ ] **Step 3: 实现最小功能**

在 `src/game/state.ts` 末尾添加：

```typescript
export function getDefaultAction(plot: Plot): 'hoe' | 'water' | 'wither' | 'shovel' | 'seed' | null {
  if (plot.locked) return null;
  switch (plot.state) {
    case 'wild':
      return 'hoe';
    case 'tilled':
      return 'seed';
    case 'seed':
    case 'sprout':
    case 'growing':
      return 'water';
    case 'blooming':
      return 'wither';
    case 'withered':
      return 'shovel';
    default:
      return null;
  }
}

export function getActionLabel(plot: Plot): string {
  if (plot.locked) return '解锁';
  switch (plot.state) {
    case 'wild':
      return '开荒';
    case 'tilled':
      return '播种';
    case 'seed':
    case 'sprout':
    case 'growing':
      return '浇水';
    case 'blooming':
      return '凋谢';
    case 'withered':
      return '铲除';
    default:
      return getStateLabel(plot.state);
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/game/state.test.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/game/state.ts src/game/state.test.ts
git commit -m "feat: add default plot action and tooltip label helpers

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: 花园视图改为状态驱动的一键操作

**Files:**
- Modify: `src/ui/garden-view.ts`
- Test: `src/ui/garden-view.test.ts`

**Interfaces:**
- Consumes: `getDefaultAction`、`getActionLabel` from `src/game/state.ts`
- Produces: 点击地块直接执行对应操作；地块 `title` 属性显示操作名；`showMenu` 仅用于耕地弹出花种选择器。

- [ ] **Step 1: 修改导入并准备重构**

在 `src/ui/garden-view.ts` 顶部，将导入改为：

```typescript
import { GameState, Plot } from '../game/types';
import { FLOWER_MAP, FLOWERS } from '../data/flowers';
import { getStateLabel, advancePlot, plantFlower, witherPlot, getDefaultAction, getActionLabel, refillWater, unlockPlot } from '../game/state';
import { playClickSound, playWaterSound, playBloomSound, playUnlockSound, playErrorSound } from '../audio/sound';
import { showToast } from './toast';
```

- [ ] **Step 2: 为地块设置 title 提示**

在 `renderPlots` 中，创建地块元素后、追加到 fragment 前，设置 `title`：

```typescript
el.title = getActionLabel(plot);
```

放在 `el.dataset.locked = String(plot.locked);` 之后即可。

- [ ] **Step 3: 重写 handlePlotClick**

将 `handlePlotClick` 替换为：

```typescript
function handlePlotClick(
  plotId: string,
  onChange: (s: GameState) => void,
  el: HTMLElement,
  viewport: HTMLElement
) {
  const state = getGardenState();
  const plot = state.plots.find(p => p.id === plotId);
  if (!plot) return;

  // Close any open menu/seed selector.
  const existingMenu = viewport.querySelector('.plot-menu');
  if (existingMenu) existingMenu.remove();

  const action = getDefaultAction(plot);

  switch (action) {
    case 'hoe': {
      playClickSound();
      onChange(advancePlot(state, plot.id, 'hoe'));
      showToast('已开荒');
      return;
    }
    case 'water': {
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
    case 'wither': {
      playBloomSound();
      onChange(witherPlot(state, plot.id));
      showToast('花已凋谢');
      return;
    }
    case 'shovel': {
      playClickSound();
      onChange(advancePlot(state, plot.id, 'shovel'));
      showToast('已铲除');
      return;
    }
    case 'seed': {
      const menu = createPlotMenu(el, viewport);
      showSeedSelector(plot, state, onChange, menu);
      return;
    }
  }
}
```

- [ ] **Step 4: 提取 createPlotMenu 辅助函数**

将 `showMenu` 中的菜单创建与定位逻辑提取成 `createPlotMenu`，放在 `addBtn` 附近：

```typescript
function createPlotMenu(el: HTMLElement, viewport: HTMLElement): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'plot-menu';

  const rect = el.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  menu.style.left = `${rect.left - viewportRect.left + rect.width / 2 - 60}px`;
  menu.style.top = `${rect.top - viewportRect.top - 10}px`;

  viewport.appendChild(menu);
  clampMenuToViewport(menu, viewport);

  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      viewport.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => viewport.addEventListener('click', closeHandler), 0);

  return menu;
}
```

- [ ] **Step 5: 删除旧的 showMenu 与 activeTool 分支**

删除整个 `showMenu` 函数（包含 80 行左右的菜单按钮创建）。确认 `handlePlotClick` 中已无 `state.activeTool` 判断。

- [ ] **Step 6: 移除 tool-water 光标类切换**

在 `renderGarden` 和 `updateGarden` 中，删除以下行：

```typescript
viewport.classList.toggle('tool-water', state.activeTool === 'water');
```

共两处，分别在 `renderGarden` 开头与 `updateGarden` 开头。

- [ ] **Step 7: 更新 garden-view 测试**

在 `src/ui/garden-view.test.ts` 中新增一个 describe：

```typescript
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
```

- [ ] **Step 8: 运行测试确认通过**

Run: `npx vitest run src/ui/garden-view.test.ts`

Expected: PASS

- [ ] **Step 9: 提交**

```bash
git add src/ui/garden-view.ts src/ui/garden-view.test.ts
git commit -m "feat: one-click plot actions and hover tooltips

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 简化工具栏

**Files:**
- Modify: `src/ui/toolbar.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `GameState` from `src/game/types.ts`, `selectFlower` from `src/game/state.ts`, `FLOWERS` from `src/data/flowers.ts`
- Produces: 工具栏不再包含工具按钮；点击耕地时弹出的花种选择器由 `garden-view.ts` 负责，本任务可选择完全移除工具栏。

- [ ] **Step 1: 完全移除工具栏组件**

本计划选择完全移除底部工具栏。编辑 `src/ui/toolbar.ts`，保留文件但导出一个空容器或删除其内容并导出 `null` 占位：

```typescript
import { GameState } from '../game/types';

export function renderToolbar(_state: GameState, _onChange: (s: GameState) => void): HTMLElement {
  const el = document.createElement('div');
  el.style.display = 'none';
  return el;
}

export function updateToolbar(bar: HTMLElement, _state: GameState, _onChange: (s: GameState) => void): HTMLElement {
  return bar;
}
```

- [ ] **Step 2: 在 main.ts 中取消挂载工具栏**

编辑 `src/main.ts`：

```typescript
import { createGameState, setEncyclopediaOpen } from './game/state';
import { GameState } from './game/types';
import { renderGarden, updateGarden } from './ui/garden-view';
import { renderEncyclopedia, updateEncyclopedia } from './ui/encyclopedia';
import { renderStatusBar, updateStatusBar } from './ui/status-bar';
import { startBGM, stopBGM, isPlayingBGM } from './audio/sound';
```

并删除相关变量与挂载代码：

```typescript
let toolbar = renderToolbar(state, handleChange);
```

```typescript
app.appendChild(toolbar);
```

```typescript
toolbar = updateToolbar(toolbar, state, handleChange);
```

- [ ] **Step 3: 运行测试确认无回归**

Run: `npx vitest run`

Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add src/ui/toolbar.ts src/main.ts
git commit -m "refactor: remove legacy tool buttons from toolbar

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 清理未使用的 activeTool 状态（可选但推荐）

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/state.ts`
- Modify: `src/main.ts`（如已移除工具栏则无需再改）

**Interfaces:**
- Consumes: 现有 `GameState` 和 `Tool` 类型
- Produces: 移除 `activeTool` 字段与 `setTool` 函数，因为地块操作不再依赖工具选择。

- [ ] **Step 1: 从 GameState 中移除 activeTool**

在 `src/game/types.ts` 中：

```typescript
export interface GameState {
  plots: Plot[];
  discoveredFlowers: Set<string>;
  selectedFlowerId: string | null;
  water: number;
  maxWater: number;
  coins: number;
  lastWaterRefill: number;
  encyclopediaOpen: boolean;
}
```

- [ ] **Step 2: 从 createGameState 与 setTool 中移除 activeTool**

在 `src/game/state.ts` 中：

```typescript
export function createGameState(): GameState {
  return {
    plots: createPlots(),
    discoveredFlowers: new Set(),
    selectedFlowerId: null,
    water: 20,
    maxWater: 20,
    coins: 0,
    lastWaterRefill: Date.now(),
    encyclopediaOpen: false,
  };
}
```

删除 `setTool` 函数及其导出：

```typescript
// 删除以下函数
export function setTool(state: GameState, tool: string | null): GameState {
  return { ...state, activeTool: tool as Tool | null };
}
```

- [ ] **Step 3: 更新 selectFlower 不再设置 activeTool**

在 `src/game/state.ts` 中：

```typescript
export function selectFlower(state: GameState, flowerId: string | null): GameState {
  return { ...state, selectedFlowerId: flowerId };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run`

Expected: 全部通过（TypeScript 编译也可能暴露引用处，一并修复）

- [ ] **Step 5: 提交**

```bash
git add src/game/types.ts src/game/state.ts
git commit -m "refactor: remove unused activeTool state

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 全量验证与构建

**Files:** 项目整体

- [ ] **Step 1: 运行完整测试套件**

Run: `npm test`

Expected: 全部通过

- [ ] **Step 2: 运行 TypeScript 编译检查**

Run: `npx tsc --noEmit`

Expected: 无错误

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: 构建成功，输出到 `dist/`

- [ ] **Step 4: 手动验证（可选，若环境支持）**

Run: `npm run dev` 并在浏览器中：

1. 悬停荒地，提示应为"开荒"；点击后变为耕地。
2. 悬停耕地，提示应为"播种"；点击后弹出花种选择器，选花后播种。
3. 悬停种子/发芽/成长，提示应为"浇水"；点击后进阶。
4. 悬停盛开，提示应为"凋谢"；点击后凋谢。
5. 悬停凋谢，提示应为"铲除"；点击后变为荒地。
6. 水滴为 0 时点击可浇水地块，提示"水滴不足"。

- [ ] **Step 5: 提交最终验证结果**

若一切正常：

```bash
git add -A
git commit -m "feat: one-click plot operations complete

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- 荒地/浇水/凋谢/铲除一键执行 → Task 2 `handlePlotClick` 重写。
- 耕地点击弹出花种选择器 → Task 2 `case 'seed'` 分支。
- hover 提示 → Task 2 `el.title = getActionLabel(plot)` 与 Task 1 `getActionLabel`。
- 移除工具栏多余按钮 → Task 3。
- 浇水水滴不足保持提示 → Task 2 `case 'water'` 分支复用现有逻辑。
- 锁定地块不变 → 未改动 `handleLockedPlotClick`。

**2. Placeholder scan:**
- 无 "TBD"/"TODO"。
- 每个步骤包含具体代码、命令与预期输出。
- 没有模糊描述。

**3. Type consistency:**
- `getDefaultAction` 与 `getActionLabel` 签名一致，均接收 `Plot`。
- `createGameState` 移除 `activeTool` 后字段与 `GameState` 接口一致。
- 工具栏返回类型保持 `HTMLElement`。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-18-one-click-plot-operations.md`. Two execution options:

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
