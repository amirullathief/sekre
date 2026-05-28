let currentUser = null;
let currentProfile = null;
let editingId = null;
let currentFilter = 'semua';

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;
  currentUser = session.user;
  currentProfile = await getUserProfile(currentUser.id);
  loadSurat();
});

function filterSurat(filter) {
  currentFilter = filter;
  document.querySelectorAll('#suratTabs .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  loadSurat();
}

async function loadSurat() {
  let query = db.from('surat').select('*').order('tanggal', { ascending: false });
  if (currentFilter !== 'semua') query = query.eq('jenis', currentFilter);

  const { data } = await query;
  const container = document.getElementById('suratList');
  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-envelope"></i><h3>Belum ada surat</h3></div>`;
    return;
  }

  const canDelete = currentProfile && currentProfile.role === 'sekretaris';

  container.innerHTML = data.map((item, i) => `
    <div class="item-card" style="animation-delay:${i * 0.05}s">
      <div class="item-card-header">
        <div>
          <div class="item-card-title">${item.perihal}</div>
          <div class="item-card-meta">
            <span><i class="fas fa-hashtag"></i>${item.nomor_surat || '-'}</span>
            <span><i class="fas fa-calendar"></i>${formatDate(item.tanggal)}</span>
            <span><i class="fas fa-arrow-right"></i>${item.jenis === 'masuk' ? item.pengirim : item.penerima || '-'}</span>
            <span><i class="fas fa-user"></i>${item.author_name}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge badge-${item.jenis === 'masuk' ? 'blue' : 'green'}">${item.jenis}</span>
          <span class="badge badge-${item.status === 'selesai' ? 'green' : 'gold'}">${item.status}</span>
          ${(canDelete || item.author_id === currentUser.id) ? `
            <div class="item-actions">
              <button class="btn-edit" onclick="editSurat('${item.id}')"><i class="fas fa-pen"></i></button>
              <button class="btn-delete" onclick="deleteSurat('${item.id}')"><i class="fas fa-trash"></i></button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Tambah Surat';
  ['fNomor','fPerihal','fPengirim','fPenerima'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fJenis').value = 'masuk';
  document.getElementById('fStatus').value = 'diproses';
  document.getElementById('fTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal').classList.add('active');
}
function closeModal() { document.getElementById('modal').classList.remove('active'); }

async function editSurat(id) {
  const { data } = await db.from('surat').select('*').eq('id', id).single();
  if (!data) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Surat';
  document.getElementById('fJenis').value = data.jenis;
  document.getElementById('fNomor').value = data.nomor_surat || '';
  document.getElementById('fPerihal').value = data.perihal;
  document.getElementById('fPengirim').value = data.pengirim || '';
  document.getElementById('fPenerima').value = data.penerima || '';
  document.getElementById('fTanggal').value = data.tanggal;
  document.getElementById('fStatus').value = data.status || 'diproses';
  document.getElementById('modal').classList.add('active');
}

async function saveSurat(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  const payload = {
    jenis: document.getElementById('fJenis').value,
    nomor_surat: document.getElementById('fNomor').value,
    perihal: document.getElementById('fPerihal').value,
    pengirim: document.getElementById('fPengirim').value,
    penerima: document.getElementById('fPenerima').value,
    tanggal: document.getElementById('fTanggal').value,
    status: document.getElementById('fStatus').value,
    author_id: currentUser.id,
    author_name: currentProfile ? currentProfile.nama : currentUser.email
  };
  let error;
  if (editingId) { ({ error } = await db.from('surat').update(payload).eq('id', editingId)); }
  else { ({ error } = await db.from('surat').insert(payload)); }
  btn.disabled = false;
  if (error) { showToast('Gagal menyimpan', 'error'); return; }
  showToast(editingId ? 'Surat diperbarui!' : 'Surat ditambahkan!', 'success');
  closeModal(); loadSurat();
}

async function deleteSurat(id) {
  if (!confirm('Hapus surat ini?')) return;
  await db.from('surat').delete().eq('id', id);
  showToast('Surat dihapus', 'success');
  loadSurat();
}

async function exportPDF() {
  const { data } = await db.from('surat').select('*').order('tanggal', { ascending: false });
  if (!data || data.length === 0) { showToast('Belum ada surat', 'error'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.text('REKAP SURAT MASUK & KELUAR', 148, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Sekretaris KKN - UIN SMDD Bukittinggi', 148, 22, { align: 'center' });

  const rows = data.map((s, i) => [i + 1, s.jenis.toUpperCase(), s.nomor_surat || '-', s.perihal, s.pengirim || '-', s.penerima || '-', formatDate(s.tanggal), s.status]);
  doc.autoTable({
    startY: 28,
    head: [['No', 'Jenis', 'No Surat', 'Perihal', 'Pengirim', 'Penerima', 'Tanggal', 'Status']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [230, 168, 23] },
    styles: { fontSize: 8 }
  });
  doc.save('rekap_surat_kkn.pdf');
  showToast('PDF berhasil diexport!', 'success');
}
