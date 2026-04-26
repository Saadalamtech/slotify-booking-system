/* ============================================
   SLOTIFY — Core Application Logic
   ============================================ */

// ─── State ───────────────────────────────────
let slots = [];
let bookings = [];
let activeFilter = 'all';
let pendingSlotId = null;

// ─── Init ─────────────────────────────────────
function init() {
  loadFromStorage();
  if (slots.length === 0) seedDemoSlots();
  renderAll();
  setTodayAsDefault();
  setupEventListeners();
}

function loadFromStorage() {
  try {
    slots = JSON.parse(localStorage.getItem('slotify_slots') || '[]');
    bookings = JSON.parse(localStorage.getItem('slotify_bookings') || '[]');
  } catch (e) {
    slots = [];
    bookings = [];
  }
}

function saveToStorage() {
  localStorage.setItem('slotify_slots', JSON.stringify(slots));
  localStorage.setItem('slotify_bookings', JSON.stringify(bookings));
}

function seedDemoSlots() {
  const today = new Date();
  const dates = [0, 1, 2].map(d => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + d);
    return dt.toISOString().slice(0, 10);
  });
  const times = [
    ['09:00','09:30'], ['09:30','10:00'], ['10:00','10:30'],
    ['10:30','11:00'], ['11:00','11:30'], ['14:00','14:30'],
    ['14:30','15:00'], ['15:00','15:30']
  ];
  dates.forEach(date => {
    times.forEach(([start, end]) => {
      slots.push({ id: uid(), date, startTime: start, endTime: end, isBooked: false, bookedBy: null });
    });
  });
  saveToStorage();
}

function setTodayAsDefault() {
  const today = new Date().toISOString().slice(0, 10);
  const adminDate = document.getElementById('adminDate');
  if (adminDate) adminDate.min = today;
}

function setupEventListeners() {
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ─── Routing ──────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.section === id);
  });

  document.getElementById('navLinks').classList.remove('open');
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Render All ───────────────────────────────
function renderAll() {
  renderSlots();
  renderBookings();
  renderAdminPanel();
  updateHeroStats();
}

// ─── Hero Stats ───────────────────────────────
function updateHeroStats() {
  const total = slots.length;
  const booked = slots.filter(s => s.isBooked).length;
  const available = total - booked;
  animateCount('totalSlotsCount', total);
  animateCount('availableSlotsCount', available);
  animateCount('bookedSlotsCount', booked);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const steps = 20;
  const step = (target - start) / steps;
  let cur = start;
  let i = 0;
  const int = setInterval(() => {
    cur += step;
    el.textContent = Math.round(cur);
    if (++i >= steps) { el.textContent = target; clearInterval(int); }
  }, 16);
}

// ─── Slots Section ────────────────────────────
function renderSlots() {
  const grid = document.getElementById('slotsGrid');
  const empty = document.getElementById('slotsEmpty');
  if (!grid) return;

  const search = (document.getElementById('slotSearch')?.value || '').toLowerCase();
  const dateFilter = document.getElementById('slotDateFilter')?.value || '';

  let filtered = [...slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  if (search) filtered = filtered.filter(s => s.date.includes(search) || formatDate(s.date).toLowerCase().includes(search));
  if (dateFilter) filtered = filtered.filter(s => s.date === dateFilter);
  if (activeFilter === 'available') filtered = filtered.filter(s => !s.isBooked);
  if (activeFilter === 'booked') filtered = filtered.filter(s => s.isBooked);

  if (filtered.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';
  grid.innerHTML = filtered.map(slotCardHTML).join('');
}

function slotCardHTML(slot) {
  const status = slot.isBooked ? 'booked' : 'available';
  const btnDisabled = slot.isBooked ? 'disabled' : '';
  return `
    <div class="slot-card ${slot.isBooked ? 'booked' : ''}" id="slot-card-${slot.id}">
      <div class="slot-date">${formatDate(slot.date)}</div>
      <div class="slot-time">${slot.startTime} — ${slot.endTime}</div>
      <div class="slot-footer">
        <span class="slot-badge ${status}">${slot.isBooked ? 'Booked' : 'Available'}</span>
        <button class="slot-book-btn" onclick="openBookingModal('${slot.id}')" ${btnDisabled}>
          ${slot.isBooked ? 'Unavailable' : 'Book Now'}
        </button>
      </div>
      ${slot.isBooked && slot.bookedBy ? `<div class="slot-booked-by">Booked by ${escHtml(slot.bookedBy)}</div>` : ''}
    </div>`;
}

function setFilter(f, btn) {
  activeFilter = f;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderSlots();
}

function clearFilters() {
  document.getElementById('slotSearch').value = '';
  document.getElementById('slotDateFilter').value = '';
  activeFilter = 'all';
  document.querySelectorAll('.filter-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  renderSlots();
}

// ─── Booking Modal ────────────────────────────
function openBookingModal(slotId) {
  const slot = slots.find(s => s.id === slotId);
  if (!slot || slot.isBooked) { showToast('This slot is no longer available.', 'error'); return; }

  pendingSlotId = slotId;
  document.getElementById('modalSlotInfo').innerHTML = `
    <div class="modal-slot-date">${formatDate(slot.date)}</div>
    <div class="modal-slot-time">${slot.startTime} – ${slot.endTime}</div>`;
  document.getElementById('bookingName').value = '';
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('bookingName').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  pendingSlotId = null;
}

function confirmBooking() {
  if (!pendingSlotId) return;
  const name = document.getElementById('bookingName').value.trim();
  if (!name) { showToast('Please enter your name.', 'warning'); document.getElementById('bookingName').focus(); return; }

  const slot = slots.find(s => s.id === pendingSlotId);
  if (!slot) { showToast('Slot not found.', 'error'); closeModal(); return; }
  if (slot.isBooked) { showToast('This slot was just booked. Please choose another.', 'error'); closeModal(); renderSlots(); return; }

  slot.isBooked = true;
  slot.bookedBy = name;

  const booking = {
    id: uid(),
    slotId: slot.id,
    name,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    bookedAt: new Date().toISOString()
  };
  bookings.push(booking);
  saveToStorage();
  closeModal();
  renderAll();
  showToast(`Booking confirmed for ${name}!`, 'success');
}

// ─── My Bookings ──────────────────────────────
function renderBookings() {
  const list = document.getElementById('bookingsList');
  const empty = document.getElementById('bookingsEmpty');
  if (!list) return;

  const sorted = [...bookings].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  if (sorted.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = sorted.map(b => `
    <div class="booking-item" id="booking-item-${b.id}">
      <div class="booking-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="booking-info">
        <div class="booking-name">${escHtml(b.name)}</div>
        <div class="booking-date">${formatDate(b.date)}</div>
      </div>
      <div class="booking-time">${b.startTime} – ${b.endTime}</div>
      <button class="booking-cancel-btn" onclick="cancelBooking('${b.id}')">Cancel</button>
    </div>`).join('');
}

function cancelBooking(bookingId) {
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return;

  const slot = slots.find(s => s.id === booking.slotId);
  if (slot) { slot.isBooked = false; slot.bookedBy = null; }

  bookings = bookings.filter(b => b.id !== bookingId);
  saveToStorage();

  const el = document.getElementById(`booking-item-${bookingId}`);
  if (el) { el.style.animation = 'fadeIn .2s ease reverse'; setTimeout(() => renderAll(), 180); }
  else renderAll();

  showToast('Booking cancelled. Slot is now available.', 'info');
}

// ─── Admin Panel ──────────────────────────────
function renderAdminPanel() {
  const total = slots.length;
  const booked = slots.filter(s => s.isBooked).length;
  const avail = total - booked;

  const el = id => document.getElementById(id);
  if (el('adminTotal')) el('adminTotal').textContent = total;
  if (el('adminAvailable')) el('adminAvailable').textContent = avail;
  if (el('adminBooked')) el('adminBooked').textContent = booked;

  const list = document.getElementById('adminSlotsList');
  if (!list) return;

  const sorted = [...slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  if (sorted.length === 0) {
    list.innerHTML = '<p style="font-size:.82rem;color:var(--text-4);text-align:center;padding:20px 0">No slots created yet. Use the form to generate slots.</p>';
    return;
  }

  list.innerHTML = sorted.map(s => `
    <div class="admin-slot-row">
      <div class="admin-slot-row-info">
        <span>${formatDateShort(s.date)}</span>
      </div>
      <div class="admin-slot-row-time">${s.startTime} – ${s.endTime}</div>
      <span class="admin-slot-status ${s.isBooked ? 'booked' : 'available'}">${s.isBooked ? 'Booked' : 'Free'}</span>
      <button class="admin-slot-del" onclick="deleteSlot('${s.id}')" title="Delete slot">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>`).join('');
}

function deleteSlot(slotId) {
  const slot = slots.find(s => s.id === slotId);
  if (slot?.isBooked) {
    bookings = bookings.filter(b => b.slotId !== slotId);
  }
  slots = slots.filter(s => s.id !== slotId);
  saveToStorage();
  renderAll();
  showToast('Slot removed.', 'info');
}

function clearAllSlots() {
  if (!confirm('This will delete ALL slots and bookings. Are you sure?')) return;
  slots = [];
  bookings = [];
  saveToStorage();
  renderAll();
  showToast('All slots cleared.', 'warning');
}

function previewSlots() {
  const generated = buildSlots(true);
  const box = document.getElementById('slotPreview');
  if (!box) return;

  if (!generated || generated.length === 0) {
    box.innerHTML = '<p class="preview-hint">No slots to preview. Check your time range.</p>';
    return;
  }

  box.innerHTML = `<div class="preview-slots">${generated.map(s =>
    `<span class="preview-pill">${s.startTime}–${s.endTime}</span>`
  ).join('')}</div>`;
}

function generateSlots() {
  const generated = buildSlots(false);
  if (!generated || generated.length === 0) {
    showToast('Could not generate slots. Check your time range and duration.', 'error');
    return;
  }

  const existing = new Set(slots.map(s => `${s.date}|${s.startTime}`));
  const newSlots = generated.filter(s => !existing.has(`${s.date}|${s.startTime}`));

  if (newSlots.length === 0) {
    showToast('All generated slots already exist for this date.', 'warning');
    return;
  }

  slots.push(...newSlots);
  saveToStorage();
  renderAll();
  document.getElementById('slotPreview').innerHTML = '<p class="preview-hint">Set time range and click Generate to preview slots.</p>';
  showToast(`${newSlots.length} slot${newSlots.length > 1 ? 's' : ''} created successfully!`, 'success');
}

function buildSlots(previewOnly) {
  const date = document.getElementById('adminDate')?.value;
  const startRaw = document.getElementById('adminStart')?.value;
  const endRaw = document.getElementById('adminEnd')?.value;
  const duration = parseInt(document.getElementById('adminDuration')?.value || '30');

  if (!date && !previewOnly) { showToast('Please select a date.', 'warning'); return null; }

  const startMins = timeToMins(startRaw || '09:00');
  const endMins = timeToMins(endRaw || '17:00');

  if (startMins >= endMins) {
    if (!previewOnly) showToast('Start time must be before end time.', 'warning');
    return null;
  }

  const result = [];
  let cur = startMins;
  while (cur + duration <= endMins) {
    result.push({
      id: uid(),
      date: date || new Date().toISOString().slice(0, 10),
      startTime: minsToTime(cur),
      endTime: minsToTime(cur + duration),
      isBooked: false,
      bookedBy: null
    });
    cur += duration;
  }
  return result;
}

// ─── Theme ────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('slotify_theme', isDark ? 'light' : 'dark');
}

function loadTheme() {
  const saved = localStorage.getItem('slotify_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', 'dark');
}

// ─── Toast ────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-dot"></span><span>${escHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ─── Utilities ────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function timeToMins(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + m;
}

function minsToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function id(x) { return document.getElementById(x); }

// ─── Boot ─────────────────────────────────────
loadTheme();
document.addEventListener('DOMContentLoaded', init);
