let currentUser = null;
let currentProfile = null;
let editingId = null;
let currentFilter = 'semua';

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;
  currentUser = session.user;
  currentProfile = await getUserProfile(currentUser.id);
  loadAgenda();
});

function filterAgenda(filter) {
  currentFilter = filter;
  document.querySelectorAll('#agendaTabs .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  loadAgenda();
}

async function loadAgenda() {
  let query = db.from('agenda').select('*').order('tanggal', { ascending: true });

  if (currentFilter === 'upcoming') {
    query = query.eq('status', 'upcoming');
  } else if (currentFilter === 'selesai') {
    query = query.eq('status', 'selesai');
  }

  const { data } = await query;
  const container = document.getElementById('agendaList');

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-alt"></i><h3>Belum ada agenda</h3></div>`;
    return;
  }

  const canDelete = currentProfile && currentProfile.role === 'sekretaris';
  const jenisColors = { rapat: 'blue', acara: 'gold', kerja: 'green', lainnya: 'purple' };

  container.innerHTML = data.map((item, i) => `
    <div class="item-card" style="animation-delay:${i * 0.05}s">
      <div class="item-card-header">
        <div>
          <div class="item-card-title">${item.judul}</div>
          <div class="item-card-meta">
            <span><i class="fas fa-calendar"></i>${formatDate(item.tanggal)}</span>
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
  `).join('');
}

function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Tambah Agenda';
  document.getElementById('fJudul').value = '';
  document.getElementById('fTanggal').value = new Date().toISOString().split('T')[0];
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
  loadAgenda();
}

async function deleteAgenda(id) {
  if (!confirm('Hapus agenda ini?')) return;
  const { error } = await db.from('agenda').delete().eq('id', id);
  if (error) { showToast('Gagal menghapus', 'error'); return; }
  showToast('Agenda dihapus', 'success');
  loadAgenda();
}
