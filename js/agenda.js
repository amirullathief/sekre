let currentUser = null;
let currentProfile = null;
let editingId = null;
let currentMonth = 6; // default to June (6)
let selectedDateStr = null;

// All fetched data
let allAgendas = [];
let allKegiatan = [];

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;
  currentUser = session.user;
  currentProfile = await getUserProfile(currentUser.id);
  
  await refreshData();
});

async function refreshData() {
  const { data: agendaData } = await db.from('agenda').select('*');
  const { data: kegiatanData } = await db.from('kegiatan').select('*');
  
  allAgendas = agendaData || [];
  allKegiatan = kegiatanData || [];
  
  renderCalendar();
  if (selectedDateStr) {
    showDayDetails(selectedDateStr);
  }
}

function switchMonth(month) {
  currentMonth = month;
  document.querySelectorAll('#monthTabs .tab').forEach((t, i) => {
    t.classList.toggle('active', (month === 6 && i === 0) || (month === 7 && i === 1));
  });
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('calendarCells');
  container.innerHTML = '';
  
  const year = 2026;
  const monthIdx = currentMonth - 1; // 0-based
  
  // First day of the month
  const firstDay = new Date(year, monthIdx, 1);
  // Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  let startDayOfWeek = firstDay.getDay();
  // Adjust to Monday-first (0 = Monday, ..., 6 = Sunday)
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  // Total days in month
  const totalDays = new Date(year, currentMonth, 0).getDate();
  
  // Pad previous month days
  for (let i = 0; i < startDayOfWeek; i++) {
    const padCell = document.createElement('div');
    padCell.className = 'calendar-cell disabled';
    padCell.innerHTML = `<span class="calendar-cell-num"></span>`;
    container.appendChild(padCell);
  }
  
  // Render month days
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, monthIdx, day);
    const dateStr = getLocalDateString(cellDate);
    
    // Check KKN date bounds: June 1 (2026-06-01) to July 15 (2026-07-15)
    const isOutOfKKN = (currentMonth === 6 && day < 1) || (currentMonth === 7 && day > 15);
    
    const cell = document.createElement('div');
    cell.className = 'calendar-cell' + (isOutOfKKN ? ' disabled' : '');
    if (dateStr === selectedDateStr) {
      cell.classList.add('active');
    }
    
    // Find matching items for this date
    const dayAgendas = allAgendas.filter(a => a.tanggal === dateStr);
    const dayKegiatan = allKegiatan.filter(k => k.tanggal === dateStr);
    const totalItems = dayAgendas.length + dayKegiatan.length;
    
    // HTML content for cells
    let eventsHtml = '';
    let dotsHtml = '';
    
    // Text badges (Desktop view)
    dayAgendas.slice(0, 2).forEach(a => {
      const typeClass = a.jenis === 'rapat' ? 'blue' : a.jenis === 'acara' ? 'gold' : 'green';
      eventsHtml += `<span class="calendar-event-badge badge-${typeClass}">${a.judul}</span>`;
    });
    dayKegiatan.slice(0, 1).forEach(k => {
      eventsHtml += `<span class="calendar-event-badge badge-gold" style="border: 1px solid var(--accent);">${k.judul}</span>`;
    });
    if (totalItems > 3) {
      eventsHtml += `<span class="calendar-event-badge" style="opacity:0.6; text-align:center;">+${totalItems - 3} lainnya</span>`;
    }
    
    // Dots (Mobile view)
    dayAgendas.forEach(a => {
      dotsHtml += `<div class="calendar-event-dot ${a.jenis}"></div>`;
    });
    dayKegiatan.forEach(() => {
      dotsHtml += `<div class="calendar-event-dot kegiatan"></div>`;
    });
    
    cell.innerHTML = `
      <span class="calendar-cell-num">${day}</span>
      <div class="calendar-cell-events">${eventsHtml}</div>
      <div class="calendar-event-dots-container">${dotsHtml}</div>
    `;
    
    if (!isOutOfKKN) {
      cell.onclick = () => {
        document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
        selectedDateStr = dateStr;
        showDayDetails(dateStr);
      };
    }
    
    container.appendChild(cell);
  }
}

function showDayDetails(dateStr) {
  const panel = document.getElementById('dayDetailsPanel');
  const dateLabel = document.getElementById('detailsDateLabel');
  const countLabel = document.getElementById('detailsCountLabel');
  const listContainer = document.getElementById('dayDetailsList');
  
  panel.style.display = 'block';
  dateLabel.textContent = `Jadwal pada ${formatDateFull(dateStr)}`;
  
  const dayAgendas = allAgendas.filter(a => a.tanggal === dateStr);
  const dayKegiatan = allKegiatan.filter(k => k.tanggal === dateStr);
  const total = dayAgendas.length + dayKegiatan.length;
  
  countLabel.textContent = `${total} Acara / Kegiatan`;
  
  if (total === 0) {
    listContainer.innerHTML = `<div class="empty-state" style="padding: 20px;"><i class="fas fa-calendar-times"></i><h3>Tidak ada agenda atau kegiatan</h3><p>Klik "Tambah Agenda" di atas atau masuk ke menu Kegiatan untuk membuat catatan baru.</p></div>`;
    return;
  }
  
  const canDelete = currentProfile && currentProfile.role === 'sekretaris';
  const jenisColors = { rapat: 'blue', acara: 'gold', kerja: 'green', lainnya: 'purple' };
  
  let html = '';
  
  // Render Agendas
  dayAgendas.forEach(item => {
    html += `
      <div class="item-card" style="border-left: 4px solid var(--info);">
        <div class="item-card-header">
          <div>
            <div class="item-card-title"><span class="badge badge-blue" style="margin-right: 6px;">AGENDA</span> ${item.judul}</div>
            <div class="item-card-meta">
              ${item.waktu ? `<span><i class="fas fa-clock"></i>${item.waktu}</span>` : ''}
              ${item.lokasi ? `<span><i class="fas fa-map-marker-alt"></i>${item.lokasi}</span>` : ''}
              <span><i class="fas fa-user"></i>${item.author_name}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge-${jenisColors[item.jenis] || 'gold'}">${item.jenis}</span>
            <span class="badge badge-${item.status === 'selesai' ? 'green' : 'blue'}">${item.status}</span>
            ${(canDelete || item.author_id === currentUser.id) ? `
              <div class="item-actions">
                <button class="btn-edit" onclick="editAgenda('${item.id}')"><i class="fas fa-pen"></i></button>
                <button class="btn-delete" onclick="deleteAgenda('${item.id}')"><i class="fas fa-trash"></i></button>
              </div>
            ` : ''}
          </div>
        </div>
        ${item.deskripsi ? `<div class="item-card-desc">${item.deskripsi}</div>` : ''}
      </div>
    `;
  });
  
  // Render Kegiatan
  dayKegiatan.forEach(item => {
    html += `
      <div class="item-card" style="border-left: 4px solid var(--accent);">
        <div class="item-card-header">
          <div>
            <div class="item-card-title"><span class="badge badge-gold" style="margin-right: 6px;">KEGIATAN</span> ${item.judul}</div>
            <div class="item-card-meta">
              ${item.lokasi ? `<span><i class="fas fa-map-marker-alt"></i>${item.lokasi}</span>` : ''}
              <span><i class="fas fa-user"></i>${item.author_name}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge-gold">${item.kategori || 'umum'}</span>
            ${(canDelete || item.author_id === currentUser.id) ? `
              <div class="item-actions">
                <button class="btn-delete" onclick="deleteKegiatan('${item.id}')"><i class="fas fa-trash"></i></button>
              </div>
            ` : ''}
          </div>
        </div>
        ${item.deskripsi ? `<div class="item-card-desc">${item.deskripsi}</div>` : ''}
      </div>
    `;
  });
  
  listContainer.innerHTML = html;
}

function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Tambah Agenda';
  document.getElementById('fJudul').value = '';
  document.getElementById('fTanggal').value = selectedDateStr || getLocalDateString();
  document.getElementById('fWaktu').value = '';
  document.getElementById('fJenis').value = 'rapat';
  document.getElementById('fStatus').value = 'upcoming';
  document.getElementById('fLokasi').value = '';
  document.getElementById('fDeskripsi').value = '';
  document.getElementById('modal').classList.add('active');
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }

async function editAgenda(id) {
  const { data } = await db.from('agenda').select('*').eq('id', id).single();
  if (!data) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Agenda';
  document.getElementById('fJudul').value = data.judul;
  document.getElementById('fTanggal').value = data.tanggal;
  document.getElementById('fWaktu').value = data.waktu || '';
  document.getElementById('fJenis').value = data.jenis || 'rapat';
  document.getElementById('fStatus').value = data.status || 'upcoming';
  document.getElementById('fLokasi').value = data.lokasi || '';
  document.getElementById('fDeskripsi').value = data.deskripsi || '';
  document.getElementById('modal').classList.add('active');
}

async function saveAgenda(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;

  const payload = {
    judul: document.getElementById('fJudul').value,
    tanggal: document.getElementById('fTanggal').value,
    waktu: document.getElementById('fWaktu').value,
    jenis: document.getElementById('fJenis').value,
    status: document.getElementById('fStatus').value,
    lokasi: document.getElementById('fLokasi').value,
    deskripsi: document.getElementById('fDeskripsi').value,
    author_id: currentUser.id,
    author_name: currentProfile ? currentProfile.nama : currentUser.email
  };

  let error;
  if (editingId) {
    ({ error } = await db.from('agenda').update(payload).eq('id', editingId));
  } else {
    ({ error } = await db.from('agenda').insert(payload));
  }

  btn.disabled = false;
  if (error) { showToast('Gagal menyimpan: ' + error.message, 'error'); return; }
  showToast(editingId ? 'Agenda diperbarui!' : 'Agenda ditambahkan!', 'success');
  closeModal();
  await refreshData();
}

async function deleteAgenda(id) {
  if (!confirm('Hapus agenda ini?')) return;
  const { error } = await db.from('agenda').delete().eq('id', id);
  if (error) { showToast('Gagal menghapus', 'error'); return; }
  showToast('Agenda dihapus', 'success');
  await refreshData();
}

async function deleteKegiatan(id) {
  if (!confirm('Hapus kegiatan ini?')) return;
  const { error } = await db.from('kegiatan').delete().eq('id', id);
  if (error) { showToast('Gagal menghapus', 'error'); return; }
  showToast('Kegiatan dihapus', 'success');
  await refreshData();
}
