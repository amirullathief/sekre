// ============================================
// KEGIATAN HARIAN LOGIC
// ============================================
let currentUser = null;
let currentProfile = null;
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;
  currentUser = session.user;
  currentProfile = await getUserProfile(currentUser.id);
  loadKegiatan();
});

async function loadKegiatan() {
  const { data, error } = await db.from('kegiatan')
    .select('*')
    .order('tanggal', { ascending: false });

  const container = document.getElementById('kegiatanList');

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-check"></i><h3>Belum ada kegiatan</h3><p>Klik "Tambah" untuk menambah kegiatan baru</p></div>`;
    return;
  }

  const canDelete = currentProfile && currentProfile.role === 'sekretaris';

  container.innerHTML = data.map((item, i) => `
    <div class="item-card" style="animation-delay:${i * 0.05}s">
      <div class="item-card-header">
        <div>
          <div class="item-card-title">${item.judul}</div>
          <div class="item-card-meta">
            <span><i class="fas fa-calendar"></i>${formatDate(item.tanggal)}</span>
            ${item.lokasi ? `<span><i class="fas fa-map-marker-alt"></i>${item.lokasi}</span>` : ''}
            <span><i class="fas fa-user"></i>${item.author_name}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge badge-gold">${item.kategori || 'umum'}</span>
          ${(canDelete || item.author_id === currentUser.id) ? `
            <div class="item-actions">
              <button class="btn-edit" onclick="editKegiatan('${item.id}')"><i class="fas fa-pen"></i></button>
              <button class="btn-delete" onclick="deleteKegiatan('${item.id}')"><i class="fas fa-trash"></i></button>
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
  document.getElementById('modalTitle').textContent = 'Tambah Kegiatan';
  document.getElementById('fJudul').value = '';
  document.getElementById('fTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('fKategori').value = 'umum';
  document.getElementById('fLokasi').value = '';
  document.getElementById('fDeskripsi').value = '';
  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

async function editKegiatan(id) {
  const { data } = await db.from('kegiatan').select('*').eq('id', id).single();
  if (!data) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Kegiatan';
  document.getElementById('fJudul').value = data.judul;
  document.getElementById('fTanggal').value = data.tanggal;
  document.getElementById('fKategori').value = data.kategori || 'umum';
  document.getElementById('fLokasi').value = data.lokasi || '';
  document.getElementById('fDeskripsi').value = data.deskripsi || '';
  document.getElementById('modal').classList.add('active');
}

async function saveKegiatan(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const payload = {
    judul: document.getElementById('fJudul').value,
    tanggal: document.getElementById('fTanggal').value,
    kategori: document.getElementById('fKategori').value,
    lokasi: document.getElementById('fLokasi').value,
    deskripsi: document.getElementById('fDeskripsi').value,
    author_id: currentUser.id,
    author_name: currentProfile ? currentProfile.nama : currentUser.email
  };

  let error;
  if (editingId) {
    ({ error } = await db.from('kegiatan').update(payload).eq('id', editingId));
  } else {
    ({ error } = await db.from('kegiatan').insert(payload));
  }

  btn.disabled = false;
  btn.textContent = 'Simpan';

  if (error) {
    showToast('Gagal menyimpan: ' + error.message, 'error');
    return;
  }

  showToast(editingId ? 'Kegiatan diperbarui!' : 'Kegiatan ditambahkan!', 'success');
  closeModal();
  loadKegiatan();
}

async function deleteKegiatan(id) {
  if (!confirm('Hapus kegiatan ini?')) return;
  const { error } = await db.from('kegiatan').delete().eq('id', id);
  if (error) { showToast('Gagal menghapus', 'error'); return; }
  showToast('Kegiatan dihapus', 'success');
  loadKegiatan();
}
