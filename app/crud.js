// Generic CRUD framework: schema-driven tables with Add / Edit / Delete.
// Usage in a view:  html += crudBlock('vendors', {...cfg, rows})
// then wireCrud() (called globally by app.js after each render).

window._crudCfg = {};
window._crudRows = {};

function fieldInput(f, val) {
  const v = val ?? '';
  if (f.type === 'select') {
    return `<select name="${f.name}" ${f.required ? 'required' : ''}>
      <option value="">—</option>
      ${(f.options || []).map((o) =>
        `<option value="${o.value}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
    </select>`;
  }
  if (f.type === 'checkbox') {
    return `<input type="checkbox" name="${f.name}" ${v === true || v === 'true' ? 'checked' : ''}>`;
  }
  if (f.type === 'multicheck') {   // pick one or more from a fixed list (stored comma-joined)
    return `<span style="display:flex;flex-wrap:wrap;gap:6px 16px;padding:6px 0">
      ${(f.options || []).map((o) => `<label style="display:inline-flex;gap:5px;align-items:center;font-weight:400">
        <input type="checkbox" name="${f.name}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</span>`;
  }
  const t = f.type === 'number' ? 'number' : f.type === 'date' ? 'date'
    : f.type === 'password' ? 'password' : 'text';
  const dateVal = f.type === 'date' && v ? String(v).slice(0, 10) : v;
  return `<input type="${t}" name="${f.name}" value="${esc(dateVal)}"
    ${f.type === 'number' ? 'step="any"' : ''} ${f.required ? 'required' : ''}>`;
}

function crudBlock(key, cfg) {
  window._crudCfg[key] = cfg;
  window._crudRows[key] = cfg.rows;
  const cols = [...cfg.columns, {
    key: '_actions', label: '', render: (r) =>
      `<span class="actions">
        <button type="button" class="mini" data-crud-edit="${key}" data-id="${r.id}">Edit</button>
        <button type="button" class="mini danger" data-crud-del="${key}" data-id="${r.id}">Delete</button>
      </span>`,
  }];
  return `
  <section class="crudblock" data-crud="${key}">
    <div class="crudhead">
      <h3>${esc(cfg.title)}</h3>
      <button type="button" class="mini add" data-crud-new="${key}">Add</button>
    </div>
    <form class="form crudform hidden" data-crud-form="${key}">
      <input type="hidden" name="id">
      <div class="grid3">
        ${cfg.fields.map((f) => `<label>${esc(f.label)} ${fieldInput(f)}</label>`).join('')}
      </div>
      <button type="submit" class="primary">Save</button>
      <button type="button" class="ghost" data-crud-cancel="${key}">Cancel</button>
    </form>
    ${table(cfg.rows, cols)}
  </section>`;
}

function wireCrud() {
  document.querySelectorAll('[data-crud-new]').forEach((b) => b.onclick = () => {
    const form = document.querySelector(`[data-crud-form="${b.dataset.crudNew}"]`);
    form.reset(); form.querySelector('[name=id]').value = '';
    form.dataset.version = '';
    form.classList.remove('hidden'); form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.querySelectorAll('[data-crud-cancel]').forEach((b) => b.onclick = () =>
    document.querySelector(`[data-crud-form="${b.dataset.crudCancel}"]`).classList.add('hidden'));

  document.querySelectorAll('[data-crud-edit]').forEach((b) => b.onclick = () => {
    const key = b.dataset.crudEdit;
    const row = window._crudRows[key].find((r) => String(r.id) === b.dataset.id);
    const form = document.querySelector(`[data-crud-form="${key}"]`);
    form.reset(); form.querySelector('[name=id]').value = row.id;
    form.dataset.version = row.version ?? '';   // optimistic-lock token
    for (const f of window._crudCfg[key].fields) {
      if (f.type === 'multicheck') {
        const have = String(row[f.name] ?? '').split(',').map((s) => s.trim().toLowerCase());
        form.querySelectorAll(`[name="${f.name}"]`).forEach((cb) =>
          cb.checked = have.includes(cb.value.trim().toLowerCase()));
        continue;
      }
      const el = form.querySelector(`[name="${f.name}"]`);
      if (!el) continue;
      if (f.type === 'checkbox') el.checked = row[f.name] === true;
      else if (f.type === 'date') el.value = row[f.name] ? String(row[f.name]).slice(0, 10) : '';
      else el.value = row[f.name] ?? '';
    }
    form.classList.remove('hidden'); form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.querySelectorAll('[data-crud-del]').forEach((b) => b.onclick = async () => {
    const key = b.dataset.crudDel;
    if (!confirm('Delete this record?')) return;
    try {
      await api.del(`${window._crudCfg[key].endpoint}/${b.dataset.id}`);
      show(window._view);
    } catch (e) { alert('Error: ' + e.message); }
  });

  document.querySelectorAll('[data-crud-form]').forEach((form) => form.onsubmit = async (e) => {
    e.preventDefault();
    const key = form.dataset.crudForm;
    const cfg = window._crudCfg[key];
    const id = form.querySelector('[name=id]').value;
    const body = {};
    for (const f of cfg.fields) {
      if (f.type === 'multicheck') {
        body[f.name] = [...form.querySelectorAll(`[name="${f.name}"]:checked`)]
          .map((cb) => cb.value).join(', ') || null;
        continue;
      }
      const el = form.querySelector(`[name="${f.name}"]`);
      if (!el) continue;
      if (f.type === 'checkbox') body[f.name] = el.checked;
      else if (el.value === '') body[f.name] = null;
      else if (f.type === 'number') body[f.name] = Number(el.value);
      else body[f.name] = el.value;
    }
    if (id && form.dataset.version) body.version = Number(form.dataset.version);
    try {
      if (id) await api.put(`${cfg.endpoint}/${id}`, body);
      else await api.post(cfg.endpoint, body);
      show(window._view);
    } catch (err) { alert('Error: ' + err.message); }
  });
}

// Shared option-list helpers
async function opts(endpoint, labelKey = 'name') {
  const rows = await api.get(endpoint);
  return rows.map((r) => ({ value: r.id, label: r[labelKey] }));
}
const lookupMap = (list) => Object.fromEntries(list.map((o) => [o.value, o.label]));
