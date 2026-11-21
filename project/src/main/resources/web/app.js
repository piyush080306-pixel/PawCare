/* PawCare browser client — talks to the JSON API served by WebServer.scala. */

const state = {
  page: 'dashboard',
  animals: [],
  staff: [],
  adoptions: [],
  health: [],
  animalQuery: '',
  animalCategory: 'ALL',
  animalStatus: 'ALL',
  staffRole: 'ALL',
  adoptionStatus: 'ALL',
};

const content = document.getElementById('content');
const titleEl = document.getElementById('page-title');
const subEl = document.getElementById('page-sub');
const modal = document.getElementById('modal');
const modalCard = document.getElementById('modal-card');
const toastEl = document.getElementById('toast');

const PAGES = {
  dashboard: ['Shelter Dashboard', 'Live figures computed from stored shelter records'],
  animals: ['Animal Management', 'Register, search, edit and remove shelter animals'],
  staff: ['Staff Management', 'Managers, veterinarians and caretakers'],
  adoptions: ['Adoption Management', 'Applications, approvals and adoption history'],
  health: ['Animal Health', 'Medical records, vaccinations and assigned veterinarians'],
};

/* ---------- helpers ---------- */

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

let toastTimer = null;
function toast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.toggle('error', isError);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

function pill(text, kind) {
  return `<span class="pill ${esc(kind)}">${esc(text)}</span>`;
}

function categoryPill(category) {
  return pill(category, String(category).toLowerCase());
}

function statusPill(status) {
  return pill(status, String(status).toLowerCase());
}

function bars(items, amber = false) {
  if (!items || !items.length) return '<div class="empty">No data yet.</div>';
  const max = Math.max(...items.map(i => i.count), 1);
  return `<div class="bars">${items.map(i => `
    <div class="bar-row">
      <span class="name">${esc(i.label)}</span>
      <div class="bar-track"><div class="bar-fill ${amber ? 'amber' : ''}" style="width:${Math.round((i.count / max) * 100)}%"></div></div>
      <span class="count">${i.count}</span>
    </div>`).join('')}</div>`;
}

function emptyRow(cols, message) {
  return `<tr><td colspan="${cols}"><div class="empty">${esc(message)}</div></td></tr>`;
}

/* ---------- modal ---------- */

function closeModal() {
  modal.classList.add('hidden');
  modalCard.innerHTML = '';
}

function openModal(title, innerHtml, onSubmit) {
  modal.classList.remove('hidden');
  modalCard.innerHTML = `
    <div class="modal-head">
      <h3>${esc(title)}</h3>
      <button class="icon-btn" type="button" data-close aria-label="Close">✕</button>
    </div>
    <form id="modal-form">
      ${innerHtml}
      <div class="modal-actions">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">Save</button>
      </div>
    </form>`;

  modalCard.querySelector('#modal-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    // Fields in inactive category/role panels must not override the visible ones.
    form.querySelectorAll('[data-group], [data-role-group]').forEach(group => {
      if (group.style.display === 'none') {
        group.querySelectorAll('input, select, textarea').forEach(el => { el.disabled = true; });
      }
    });
    const payload = {};
    new FormData(form).forEach((value, key) => {
      payload[key] = typeof value === 'string' ? value.trim() : value;
    });
    form.querySelectorAll('input[type="checkbox"][name]').forEach(cb => {
      if (!cb.disabled) payload[cb.name] = cb.checked;
    });
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await onSubmit(payload);
      closeModal();
    } catch (err) {
      toast(err.message, true);
      submit.disabled = false;
    }
  });
}

function bindCategoryGroups(root) {
  const select = root.querySelector('#animal-category');
  if (!select) return;
  const apply = () => {
    const value = select.value;
    root.querySelectorAll('[data-group]').forEach(group => {
      group.style.display = group.dataset.group === value ? '' : 'none';
    });
  };
  select.addEventListener('change', apply);
  apply();
}

function bindRoleGroups(root) {
  const select = root.querySelector('#staff-role');
  if (!select) return;
  const apply = () => {
    root.querySelectorAll('[data-role-group]').forEach(group => {
      group.style.display = group.dataset.roleGroup === select.value ? '' : 'none';
    });
  };
  select.addEventListener('change', apply);
  apply();
}

/* ---------- animals ---------- */

function animalForm(a) {
  const editing = !!a;
  const category = a?.category || 'DOG';
  const dog = a && a.category === 'DOG' ? a : {};
  const cat = a && a.category === 'CAT' ? a : {};
  const bird = a && a.category === 'BIRD' ? a : {};
  return `
    <div class="form-row">
      <div class="field">
        <label>Name</label>
        <input name="name" required maxlength="60" value="${esc(a?.name ?? '')}" placeholder="e.g. Bruno">
      </div>
      <div class="field">
        <label>Age (years)</label>
        <input name="age" type="number" min="0" max="60" required value="${a?.age ?? 1}">
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label>Category</label>
        <select name="category" id="animal-category" ${editing ? 'disabled' : ''}>
          ${['DOG', 'CAT', 'BIRD'].map(c => `<option value="${c}" ${c === category ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        ${editing ? '<span class="hint">Category cannot be changed after registration.</span>' : ''}
      </div>
      <div class="field">
        <label>Gender</label>
        <select name="gender">
          ${['Male', 'Female', 'Unknown'].map(g => `<option ${a?.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field">
      <label>Health status</label>
      <input name="healthStatus" required value="${esc(a?.healthStatus ?? 'Healthy')}" placeholder="Healthy">
    </div>

    <div class="form-row" data-group="DOG">
      <div class="field">
        <label>Breed</label>
        <input name="breed" value="${esc(dog.breed ?? 'Mixed')}">
      </div>
      <div class="field">
        <label>Size</label>
        <select name="size">
          ${['Small', 'Medium', 'Large'].map(s => `<option ${dog.size === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="check"><input type="checkbox" name="isTrained" ${dog.isTrained ? 'checked' : ''}> Trained</label>
      </div>
    </div>

    <div class="form-row" data-group="CAT">
      <div class="field">
        <label>Breed</label>
        <input name="breed" value="${esc(cat.breed ?? 'Mixed')}">
      </div>
      <div class="field">
        <label>Fur colour</label>
        <input name="furColor" value="${esc(cat.furColor ?? 'Brown')}">
      </div>
      <div class="field">
        <label class="check"><input type="checkbox" name="isIndoorFriendly" ${cat.isIndoorFriendly ? 'checked' : ''}> Indoor friendly</label>
      </div>
    </div>

    <div class="form-row" data-group="BIRD">
      <div class="field">
        <label>Species</label>
        <input name="species" value="${esc(bird.species ?? 'Parrot')}">
      </div>
      <div class="field">
        <label>Wingspan (m)</label>
        <input name="wingspan" type="number" min="0" step="0.01" value="${bird.wingspan ?? 0.3}">
      </div>
      <div class="field">
        <label class="check"><input type="checkbox" name="canFly" ${!editing || bird.canFly ? 'checked' : ''}> Can fly</label>
      </div>
    </div>`;
}

function editAnimalModal(a) {
  openModal(`Edit ${a.name}`, animalForm(a), async (payload) => {
    await api(`/api/animals/${a.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: payload.name,
        age: payload.age,
        gender: payload.gender,
        healthStatus: payload.healthStatus,
      }),
    });
    toast(`${payload.name} updated.`);
    await loadAnimals();
    renderAnimals();
  });
}

function newAnimalModal() {
  openModal('Register a new animal', animalForm(null), async (payload) => {
    const created = await api('/api/animals', { method: 'POST', body: JSON.stringify(payload) });
    toast(`${created.name} registered as ${created.category}.`);
    await loadAnimals();
    renderAnimals();
  });
  bindCategoryGroups(modalCard);
}

/* ---------- staff ---------- */

function staffForm(s) {
  const role = s?.role || 'CARETAKER';
  const manager = s && s.role === 'MANAGER' ? s : {};
  const vet = s && s.role === 'VETERINARIAN' ? s : {};
  const care = s && s.role === 'CARETAKER' ? s : {};
  return `
    <div class="form-row">
      <div class="field">
        <label>Full name</label>
        <input name="name" required maxlength="60" value="${esc(s?.name ?? '')}" placeholder="e.g. Aman">
      </div>
      <div class="field">
        <label>Role</label>
        <select name="role" id="staff-role" ${s ? 'disabled' : ''}>
          ${['MANAGER', 'VETERINARIAN', 'CARETAKER'].map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        ${s ? '<span class="hint">Role cannot be changed.</span>' : ''}
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label>Contact number</label>
        <input name="contactNumber" required pattern="[0-9+\\-\\s]{6,15}" value="${esc(s?.contactNumber ?? '')}" placeholder="9876543210">
      </div>
      <div class="field">
        <label>Age</label>
        <input name="age" type="number" min="18" max="80" required value="${s?.age ?? 25}">
      </div>
    </div>
    <div class="field">
      <label>Monthly salary (₹)</label>
      <input name="salary" type="number" min="0" step="100" required value="${s?.salary ?? 25000}">
    </div>

    <div class="field" data-role-group="MANAGER">
      <label>Department</label>
      <input name="department" value="${esc(manager.department ?? 'Operations')}">
    </div>

    <div class="form-row" data-role-group="VETERINARIAN">
      <div class="field">
        <label>Specialization</label>
        <input name="specialization" value="${esc(vet.specialization ?? 'General')}">
      </div>
      <div class="field">
        <label>License number</label>
        <input name="licenseNumber" value="${esc(vet.licenseNumber ?? '')}" placeholder="VET-2026-001">
      </div>
    </div>

    <div class="form-row" data-role-group="CARETAKER">
      <div class="field">
        <label>Shift</label>
        <select name="shift">
          ${['Morning', 'Evening', 'Night'].map(x => `<option ${care.shift === x ? 'selected' : ''}>${x}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Assigned area</label>
        <input name="assignedArea" value="${esc(care.assignedArea ?? 'Kennel A')}">
      </div>
    </div>`;
}

function newStaffModal() {
  openModal('Add a staff member', staffForm(null), async (payload) => {
    const created = await api('/api/staff', { method: 'POST', body: JSON.stringify(payload) });
    toast(`${created.name} added as ${created.role}.`);
    await loadStaff();
    renderStaff();
  });
  bindRoleGroups(modalCard);
}

/* ---------- adoptions ---------- */

function newAdoptionModal() {
  const available = state.animals.filter(a => !a.isAdopted);
  if (!available.length) {
    toast('Every animal is already adopted — register one first.', true);
    return;
  }
  openModal('Submit an adoption application', `
    <div class="field">
      <label>Animal</label>
      <select name="animalId" required>
        ${available.map(a => `<option value="${a.id}">${esc(a.name)} · ${esc(a.category)} · ${a.age}y</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="field">
        <label>Adopter name</label>
        <input name="adopterName" required maxlength="60">
      </div>
      <div class="field">
        <label>Adopter age</label>
        <input name="adopterAge" type="number" min="18" max="110" required value="25">
        <span class="hint">Must be 18 or older.</span>
      </div>
    </div>
    <div class="field">
      <label>Contact number</label>
      <input name="adopterContact" required pattern="[0-9+\\-\\s]{6,15}" placeholder="9876543210">
    </div>`, async (payload) => {
    const created = await api('/api/adoptions', { method: 'POST', body: JSON.stringify(payload) });
    toast(`Application #${created.id} submitted for ${created.animalName}.`);
    await loadAdoptions();
    renderAdoptions();
  });
}

function vaccinationModal(record) {
  openModal(`Vaccination · ${record.animalName}`, `
    <div class="field">
      <label>Vaccination status</label>
      <select name="status">
        ${['VACCINATED', 'PARTIAL', 'UNVACCINATED'].map(v => `<option ${record.vaccinationStatus === v ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label>Next vaccination date</label>
      <input name="nextVaccinationDate" type="date" required value="${esc(record.nextVaccinationDate || today(180))}">
    </div>`, async (payload) => {
    await api(`/api/health/${record.id}/vaccination`, { method: 'POST', body: JSON.stringify(payload) });
    toast(`Record #${record.id} updated.`);
    await loadHealth();
    renderHealth();
  });
}

function newHealthModal() {
  if (!state.animals.length) {
    toast('Register an animal before adding medical records.', true);
    return;
  }
  const vets = state.staff.filter(s => s.role === 'VETERINARIAN');
  openModal('Add a medical record', `
    <div class="form-row">
      <div class="field">
        <label>Animal</label>
        <select name="animalId" required>
          ${state.animals.map(a => `<option value="${a.id}">${esc(a.name)} · ${esc(a.category)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Vaccination status</label>
        <select name="vaccinationStatus">
          ${['VACCINATED', 'PARTIAL', 'UNVACCINATED'].map(v => `<option ${v === 'UNVACCINATED' ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field">
      <label>Medical condition</label>
      <input name="medicalCondition" required placeholder="e.g. Routine checkup">
    </div>
    <div class="field">
      <label>Treatment details</label>
      <textarea name="treatmentDetails" required placeholder="e.g. Annual vaccination complete"></textarea>
    </div>
    <div class="form-row">
      <div class="field">
        <label>Last checkup</label>
        <input name="lastCheckupDate" type="date" required value="${today()}">
      </div>
      <div class="field">
        <label>Next vaccination</label>
        <input name="nextVaccinationDate" type="date" required value="${today(180)}">
      </div>
    </div>
    <div class="field">
      <label>Assigned veterinarian</label>
      <select name="assignedVetId">
        <option value="">Unassigned</option>
        ${vets.map(v => `<option value="${v.id}">${esc(v.name)} · ${esc(v.detail || '')}</option>`).join('')}
      </select>
    </div>`, async (payload) => {
    const created = await api('/api/health', { method: 'POST', body: JSON.stringify(payload) });
    toast(`Medical record #${created.id} added for ${created.animalName}.`);
    await loadHealth();
    renderHealth();
  });
}

/* ---------- pages ---------- */

async function loadAnimals() { state.animals = await api('/api/animals'); }
async function loadStaff() { state.staff = await api('/api/staff'); }
async function loadAdoptions() { state.adoptions = await api('/api/adoptions'); }
async function loadHealth() { state.health = await api('/api/health'); }

async function renderDashboard() {
  const d = await api('/api/dashboard');
  const s = d.stats;
  content.innerHTML = `
    <div class="grid stats">
      <div class="stat"><div class="label">Registered animals</div><div class="value">${s.totalAnimals}</div><div class="hint">${s.availableAnimals} available</div></div>
      <div class="stat green"><div class="label">Adopted</div><div class="value">${s.adoptedAnimals}</div><div class="hint">${s.totalAnimals - s.adoptedAnimals} still waiting</div></div>
      <div class="stat blue"><div class="label">Staff members</div><div class="value">${s.totalStaff}</div><div class="hint">Managers, vets &amp; caretakers</div></div>
      <div class="stat amber"><div class="label">Pending applications</div><div class="value">${s.pendingApplications}</div><div class="hint">${s.approvedApplications} approved · ${s.rejectedApplications} rejected</div></div>
      <div class="stat"><div class="label">Medical records</div><div class="value">${s.totalMedicalRecords}</div><div class="hint">Across all animals</div></div>
    </div>

    <div class="grid two">
      <div class="card">
        <h3>Adoption performance</h3>
        <div class="meter">
          <div class="meter-head"><span>Animals adopted</span><strong>${d.adoptionRate.toFixed(1)}%</strong></div>
          <div class="track"><div class="fill" style="width:${d.adoptionRate}%"></div></div>
        </div>
        <div class="meter" style="margin-bottom:0">
          <div class="meter-head"><span>Application success rate</span><strong>${d.successRate.toFixed(1)}%</strong></div>
          <div class="track"><div class="fill amber" style="width:${d.successRate}%"></div></div>
        </div>
      </div>

      <div class="card">
        <h3>Shelter mix</h3>
        ${bars(d.categories)}
      </div>
    </div>

    <div class="grid two" style="margin-top:14px">
      <div class="card">
        <h3>Upcoming vaccinations · next 30 days</h3>
        ${d.upcoming.length ? `<div class="mini-list">${d.upcoming.map(r => `
          <div class="mini-item">
            <div>
              <div>${esc(r.animalName)} · ${esc(r.condition)}</div>
              <div class="sub">Record #${r.id}${r.vetName ? ' · Dr. ' + esc(r.vetName) : ''}</div>
            </div>
            <div>${statusPill(r.vaccinationStatus)}<div class="sub" style="text-align:right">${esc(r.nextVaccinationDate)}</div></div>
          </div>`).join('')}</div>` : '<div class="empty">No vaccinations due in the next 30 days.</div>'}
      </div>

      <div class="card">
        <h3>Staff by role</h3>
        ${bars(d.roles, true)}
      </div>
    </div>`;
}

function animalTable() {
  const query = state.animalQuery.toLowerCase();
  const list = state.animals.filter(a => {
    if (state.animalCategory !== 'ALL' && a.category !== state.animalCategory) return false;
    if (state.animalStatus === 'AVAILABLE' && a.isAdopted) return false;
    if (state.animalStatus === 'ADOPTED' && !a.isAdopted) return false;
    if (query && !a.name.toLowerCase().includes(query)) return false;
    return true;
  });

  const rows = list.length ? list.map(a => `
    <tr>
      <td class="num">#${a.id}</td>
      <td><div class="primary-cell">${esc(a.name)}</div><div class="sub">${esc(a.detail || '')}</div></td>
      <td>${categoryPill(a.category)}</td>
      <td class="num">${a.age}y</td>
      <td>${esc(a.gender)}</td>
      <td>${esc(a.healthStatus)}</td>
      <td>${a.isAdopted ? statusPill('ADOPTED', 'adopted') : statusPill('AVAILABLE', 'available')}</td>
      <td class="actions">
        <button class="btn small ghost" data-action="edit-animal" data-id="${a.id}">Edit</button>
        <button class="btn small danger" data-action="delete-animal" data-id="${a.id}">Delete</button>
      </td>
    </tr>`).join('') : emptyRow(8, 'No animals match these filters.');

  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Animal</th><th>Category</th><th>Age</th><th>Gender</th><th>Health</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderAnimals() {
  content.innerHTML = `
    <div class="toolbar">
      <input type="search" id="animal-search" placeholder="Search by name…" value="${esc(state.animalQuery)}">
      <select id="animal-category-filter">
        ${[['ALL', 'All categories'], ['DOG', 'Dogs'], ['CAT', 'Cats'], ['BIRD', 'Birds']].map(([v, l]) => `<option value="${v}" ${state.animalCategory === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select id="animal-status-filter">
        ${[['ALL', 'Any status'], ['AVAILABLE', 'Available'], ['ADOPTED', 'Adopted']].map(([v, l]) => `<option value="${v}" ${state.animalStatus === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <div class="spacer"></div>
      <button class="btn primary" data-action="new-animal">+ Register animal</button>
    </div>
    <div id="animals-region">${animalTable()}</div>`;

  const search = document.getElementById('animal-search');
  search.addEventListener('input', () => {
    state.animalQuery = search.value;
    document.getElementById('animals-region').innerHTML = animalTable();
  });
  document.getElementById('animal-category-filter').addEventListener('change', (e) => {
    state.animalCategory = e.target.value;
    document.getElementById('animals-region').innerHTML = animalTable();
  });
  document.getElementById('animal-status-filter').addEventListener('change', (e) => {
    state.animalStatus = e.target.value;
    document.getElementById('animals-region').innerHTML = animalTable();
  });
}

function staffTable() {
  const list = state.staff.filter(s => state.staffRole === 'ALL' || s.role === state.staffRole);
  const rows = list.length ? list.map(s => `
    <tr>
      <td class="num">#${s.id}</td>
      <td><div class="primary-cell">${esc(s.name)}</div><div class="sub">${esc(s.detail || '')}</div></td>
      <td>${statusPill(s.role, 'neutral')}</td>
      <td>${esc(s.contactNumber)}</td>
      <td class="num">${s.age}</td>
      <td class="num">${money(s.salary)}</td>
      <td class="actions">
        <button class="btn small danger" data-action="delete-staff" data-id="${s.id}">Remove</button>
      </td>
    </tr>`).join('') : emptyRow(7, 'No staff match this filter.');

  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Contact</th><th>Age</th><th>Salary</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderStaff() {
  content.innerHTML = `
    <div class="toolbar">
      <select id="staff-role-filter">
        ${[['ALL', 'All roles'], ['MANAGER', 'Managers'], ['VETERINARIAN', 'Veterinarians'], ['CARETAKER', 'Caretakers']].map(([v, l]) => `<option value="${v}" ${state.staffRole === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <div class="spacer"></div>
      <button class="btn primary" data-action="new-staff">+ Add staff member</button>
    </div>
    <div id="staff-region">${staffTable()}</div>`;

  document.getElementById('staff-role-filter').addEventListener('change', (e) => {
    state.staffRole = e.target.value;
    document.getElementById('staff-region').innerHTML = staffTable();
  });
}

function adoptionTable() {
  const list = state.adoptions.filter(a => state.adoptionStatus === 'ALL' || a.status === state.adoptionStatus);
  const rows = list.length ? list.map(a => `
    <tr>
      <td class="num">#${a.id}</td>
      <td><div class="primary-cell">${esc(a.animalName)}</div><div class="sub">Animal #${a.animalId}</div></td>
      <td><div class="primary-cell">${esc(a.adopterName)}</div><div class="sub">Age ${a.adopterAge}</div></td>
      <td>${esc(a.adopterContact)}</td>
      <td>${esc(a.date)}</td>
      <td>${statusPill(a.status, a.status.toLowerCase())}</td>
      <td class="actions">
        ${a.status === 'PENDING' ? `
          <button class="btn small primary" data-action="approve-adoption" data-id="${a.id}">Approve</button>
          <button class="btn small danger" data-action="reject-adoption" data-id="${a.id}">Reject</button>` : '<span class="sub">—</span>'}
      </td>
    </tr>`).join('') : emptyRow(7, 'No adoption applications yet.');

  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Animal</th><th>Adopter</th><th>Contact</th><th>Date</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderAdoptions() {
  content.innerHTML = `
    <div class="toolbar">
      <select id="adoption-status-filter">
        ${[['ALL', 'All statuses'], ['PENDING', 'Pending'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected']].map(([v, l]) => `<option value="${v}" ${state.adoptionStatus === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <div class="spacer"></div>
      <button class="btn primary" data-action="new-adoption">+ New application</button>
    </div>
    <div id="adoptions-region">${adoptionTable()}</div>`;

  document.getElementById('adoption-status-filter').addEventListener('change', (e) => {
    state.adoptionStatus = e.target.value;
    document.getElementById('adoptions-region').innerHTML = adoptionTable();
  });
}

function healthTable() {
  const rows = state.health.length ? state.health.map(r => `
    <tr>
      <td class="num">#${r.id}</td>
      <td><div class="primary-cell">${esc(r.animalName)}</div><div class="sub">Animal #${r.animalId}</div></td>
      <td><div class="primary-cell">${esc(r.condition)}</div><div class="sub">${esc(r.treatment)}</div></td>
      <td>${statusPill(r.vaccinationStatus, r.vaccinationStatus.toLowerCase())}</td>
      <td>${esc(r.lastCheckupDate)}</td>
      <td>${esc(r.nextVaccinationDate)}</td>
      <td>${r.vetName ? esc(r.vetName) : '<span class="sub">Unassigned</span>'}</td>
      <td class="actions">
        <button class="btn small ghost" data-action="vaccination" data-id="${r.id}">Update</button>
      </td>
    </tr>`).join('') : emptyRow(8, 'No medical records yet.');

  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Animal</th><th>Condition &amp; treatment</th><th>Vaccination</th><th>Last checkup</th><th>Next vaccination</th><th>Vet</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderHealth() {
  content.innerHTML = `
    <div class="toolbar">
      <div class="spacer"></div>
      <button class="btn primary" data-action="new-health">+ Add medical record</button>
    </div>
    <div id="health-region">${healthTable()}</div>`;
}

/* ---------- actions ---------- */

async function removeAnimal(id) {
  const animal = state.animals.find(a => a.id === id);
  if (!animal) return;
  if (!confirm(`Delete ${animal.name}? Linked adoption/health records must be removed first.`)) return;
  try {
    await api(`/api/animals/${id}`, { method: 'DELETE' });
    toast(`${animal.name} deleted.`);
    await loadAnimals();
    renderAnimals();
  } catch (err) {
    toast(err.message, true);
  }
}

async function removeStaff(id) {
  const member = state.staff.find(s => s.id === id);
  if (!member) return;
  if (!confirm(`Remove ${member.name} from staff?`)) return;
  try {
    await api(`/api/staff/${id}`, { method: 'DELETE' });
    toast(`${member.name} removed.`);
    await loadStaff();
    renderStaff();
  } catch (err) {
    toast(err.message, true);
  }
}

async function decideAdoption(id, approve) {
  try {
    const record = await api(`/api/adoptions/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' });
    toast(`Application #${record.id} ${record.status.toLowerCase()}.`);
    await Promise.all([loadAdoptions(), loadAnimals()]);
    renderAdoptions();
  } catch (err) {
    toast(err.message, true);
  }
}

document.addEventListener('click', async (event) => {
  const navButton = event.target.closest('#nav button[data-page]');
  if (navButton) {
    setPage(navButton.dataset.page);
    return;
  }

  if (event.target.closest('[data-close]')) {
    closeModal();
    return;
  }

  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const id = Number(trigger.dataset.id);

  switch (trigger.dataset.action) {
    case 'new-animal': newAnimalModal(); break;
    case 'edit-animal': {
      const a = state.animals.find(x => x.id === id);
      if (a) editAnimalModal(a);
      break;
    }
    case 'delete-animal': removeAnimal(id); break;
    case 'new-staff': newStaffModal(); break;
    case 'delete-staff': removeStaff(id); break;
    case 'new-adoption': newAdoptionModal(); break;
    case 'approve-adoption': decideAdoption(id, true); break;
    case 'reject-adoption': decideAdoption(id, false); break;
    case 'new-health': newHealthModal(); break;
    case 'vaccination': {
      const r = state.health.find(x => x.id === id);
      if (r) vaccinationModal(r);
      break;
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

/* ---------- navigation ---------- */

async function setPage(page) {
  state.page = page;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  titleEl.textContent = PAGES[page][0];
  subEl.textContent = PAGES[page][1];
  content.innerHTML = '<div class="loading">Loading…</div>';
  try {
    switch (page) {
      case 'dashboard': await Promise.all([renderDashboard()]); break;
      case 'animals': await loadAnimals(); renderAnimals(); break;
      case 'staff': await loadStaff(); renderStaff(); break;
      case 'adoptions': await Promise.all([loadAdoptions(), loadAnimals()]); renderAdoptions(); break;
      case 'health': await Promise.all([loadHealth(), loadAnimals(), loadStaff()]); renderHealth(); break;
    }
    window.scrollTo({ top: 0 });
  } catch (err) {
    content.innerHTML = `<div class="card"><div class="empty">Could not load data: ${esc(err.message)}</div></div>`;
  }
}

document.getElementById('refresh-btn').addEventListener('click', () => setPage(state.page));

setPage('dashboard');
