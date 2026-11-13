import { CONFIG } from './config.js';
import { $, el, store } from './helpers.js';
import { CHECKBOX } from './ui.js';

const TODO_BTN = 'flex-none border-0 bg-transparent px-[3px] text-[13px] leading-[1.45] text-faint hover:text-blush focus-visible:opacity-100';

/* To-dos: unchecked first (sticky ones pinned on top), checked ones below in a "Done" group.
   Sticky = pinned to the top and kept when you press "Clear done". */
export function initTodos() {
  const list = $('todoList'), form = $('todoForm'), input = $('todoInput'), sticky = $('todoSticky');
  let todos = load();

  function load() {
    const raw = store.get(CONFIG.todosKey, []);
    return (Array.isArray(raw) ? raw : []).filter(t => t && t.id && typeof t.text === 'string');
  }
  function persist() { store.set(CONFIG.todosKey, todos); }
  const byAge = (a, b) => (a.t || 0) - (b.t || 0);
  const order = (a, b) => (Number(!!b.sticky) - Number(!!a.sticky)) || byAge(a, b);

  function row(t) {
    const cb = el('input', { className: `${CHECKBOX} checked:border-[#5fae6a] checked:bg-[#5fae6a] checked:after:text-[#14231a]`, type: 'checkbox', checked: !!t.done });
    cb.setAttribute('aria-label', `Mark "${t.text}" as ${t.done ? 'not done' : 'done'}`);
    cb.addEventListener('change', () => { t.done = cb.checked; persist(); render(); });

    const pin = el('button', { type: 'button', className: `${TODO_BTN} opacity-0 grayscale group-hover:opacity-55 aria-pressed:opacity-100 aria-pressed:grayscale-0 max-compact:opacity-60`, textContent: '📌', title: t.sticky ? 'Unpin' : 'Pin as sticky' });
    pin.setAttribute('aria-pressed', String(!!t.sticky));
    pin.addEventListener('click', () => { t.sticky = !t.sticky; persist(); render(); });

    const del = el('button', { type: 'button', className: `${TODO_BTN} opacity-0 group-hover:opacity-100 max-compact:opacity-60`, textContent: '×', title: 'Delete' });
    del.setAttribute('aria-label', 'Delete to-do');
    del.addEventListener('click', () => { todos = todos.filter(x => x.id !== t.id); persist(); render(); });

    const row = el('div', { className: 'group flex items-start gap-[9px] rounded-[9px] px-1.5 py-[7px] hover:bg-white/5' },
      cb,
      el('span', { className: 'min-w-0 flex-1 text-[13px] leading-[1.45] text-ink-soft [overflow-wrap:anywhere] group-data-[done]:text-done group-data-[done]:line-through group-data-[done]:decoration-done', textContent: t.text }),
      pin, del);
    row.toggleAttribute('data-done', !!t.done);
    return row;
  }

  function render() {
    list.replaceChildren();
    const open = todos.filter(t => !t.done).sort(order);
    const done = todos.filter(t => t.done).sort(order);
    if (!todos.length) { list.append(el('div', { className: 'm-auto p-3 text-center text-xs text-faintest', textContent: 'Nothing to do. Add something below.' })); }
    open.forEach(t => list.append(row(t)));
    if (done.length) {
      if (open.length) list.append(el('div', { className: 'px-1.5 pt-2.5 pb-1 text-[10px] font-bold tracking-[1.2px] text-faintest uppercase', textContent: `Done · ${done.length}` }));
      done.forEach(t => list.append(row(t)));
    }
    $('todoClear').hidden = !todos.some(t => t.done && !t.sticky);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), text, done: false, sticky: sticky.checked, t: Date.now() });
    persist();
    input.value = ''; sticky.checked = false;
    render();
    input.focus();
  });

  $('todoClear').addEventListener('click', () => {
    todos = todos.filter(t => !(t.done && !t.sticky));
    persist(); render();
  });

  window.addEventListener('storage', e => {            // keep other open tabs in sync
    if (e.key !== CONFIG.todosKey) return;
    todos = load(); render();
  });

  render();
  return { focus: () => input.focus() };
}
