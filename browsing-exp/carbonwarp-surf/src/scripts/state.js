import { CONFIG, GROUPS, BUILTIN_TARGETS } from './config.js';
import { store, toast } from './helpers.js';

export const state = Object.assign(
  { custom: [], defaultId: 'google', background: 'default', backgroundImage: '' },
  store.get(CONFIG.storageKey, {})
);
state.custom = (Array.isArray(state.custom) ? state.custom : [])
  .filter(t => t && t.id && t.name && typeof t.url === 'string' && GROUPS.some(g => g.id === t.group));

export const allTargets = () => [...BUILTIN_TARGETS, ...state.custom];
export const targetById = id => allTargets().find(t => t.id === id) || BUILTIN_TARGETS[0];
export const groupById  = id => GROUPS.find(g => g.id === id) || GROUPS[0];
if (!allTargets().some(t => t.id === state.defaultId)) state.defaultId = 'google';

// currently selected search target
export const ui = { activeId: state.defaultId };

export function save() {
  if (!store.set(CONFIG.storageKey, state)) toast('Could not save settings. The image may be too large.');
}
