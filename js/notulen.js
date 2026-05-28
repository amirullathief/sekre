let currentUser = null;
let currentProfile = null;
let editingId = null;
let selectedNotulen = null;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;
  currentUser = session.user;
  currentProfile = await getUserProfile(currentUser.id);
  loadNotulen();
});

async function loadNotulen() {
  const { data } = await db.from('notulen').select('*').order('tanggal', { ascending: false });
  const container = document.getElementById('notulenList');

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-file-alt"></i><h3>Belum ada notulen</h3></div>`;
    return;
  }

  const canDelete = currentProfile && currentProfile.role === 'sekretaris';

  container.innerHTML = data.map((item, i) => `
    <div class="item-card" style="animation-delay:${i * 0.05}s;cursor:pointer" onclick="showDetail('${item.id}')">
      <div class="item-card-header">
        <div>
          <div class="item-card-title">${item.judul_rapat}</div>
          <div class="item-card-meta">
            <span><i class="fas fa-calendar"></i>${formatDate(item.tanggal)}</span>
            ${item.waktu ? `<span><i class="fas fa-clock"></i>${item.waktu}</span>` : ''}
            ${item.lokasi ? `<span><i class="fas fa-map-marker-alt"></i>${item.lokasi}</span>` : ''}
            <span><i class="fas fa-user"></i>${item.author_name}</span>
          </div>
        </div>
        ${(canDelete || item.author_id === currentUser.id) ? `
          <div class="item-actions" onclick="event.stopPropagation()">
            <button class="btn-edit" onclick="editNotulen('${item.id}')"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteNotulen('${item.id}')"><i class="fas fa-trash"></i></button>
          </div>
        ` : ''}
      </div>
      ${item.keputusan ? `<div class="item-card-desc" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${item.keputusan}</div>` : ''}
    </div>
  `).join('');
}

async function showDetail(id) {
  const { data } = await db.from('notulen').select('*').eq('id', id).single();
  if (!data) return;
  selectedNotulen = data;

  document.getElementById('detailTitle').textContent = data.judul_rapat;
  document.getElementById('detailBody').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:20px;font-size:13px;color:var(--text-secondary)">
      <span><i class="fas fa-calendar" style="color:var(--accent);margin-right:6px"></i>${formatDateFull(data.tanggal)}</span>
      ${data.waktu ? `<span><i class="fas fa-clock" style="color:var(--accent);margin-right:6px"></i>${data.waktu}</span>` : ''}
      ${data.lokasi ? `<span><i class="fas fa-map-marker-alt" style="color:var(--accent);margin-right:6px"></i>${data.lokasi}</span>` : ''}
    </div>
    ${section('Peserta', data.peserta)}
    ${section('Pembahasan', data.pembahasan)}
    ${section('Keputusan', data.keputusan)}
    ${section('Tindak Lanjut', data.tindak_lanjut)}
  `;
  document.getElementById('detailModal').classList.add('active');
}

function section(title, content) {
  if (!content) return '';
  return `<div style="margin-bottom:18px"><h4 style="font-size:14px;color:var(--accent);margin-bottom:6px">${title}</h4><p style="font-size:13px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${content}</p></div>`;
}

function closeDetail() { document.getElementById('detailModal').classList.remove('active'); }

function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Tambah Notulen';
  ['fJudul','fLokasi','fPeserta','fPembahasan','fKeputusan','fTindakLanjut','fWaktu'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal').classList.add('active');
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }

async function editNotulen(id) {
  const { data } = await db.from('notulen').select('*').eq('id', id).single();
  if (!data) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Notulen';
  document.getElementById('fJudul').value = data.judul_rapat;
  document.getElementById('fTanggal').value = data.tanggal;
  document.getElementById('fWaktu').value = data.waktu || '';
  document.getElementById('fLokasi').value = data.lokasi || '';
  document.getElementById('fPeserta').value = data.peserta || '';
  document.getElementById('fPembahasan').value = data.pembahasan || '';
  document.getElementById('fKeputusan').value = data.keputusan || '';
  document.getElementById('fTindakLanjut').value = data.tindak_lanjut || '';
  document.getElementById('modal').classList.add('active');
}

async function saveNotulen(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;

  const payload = {
    judul_rapat: document.getElementById('fJudul').value,
    tanggal: document.getElementById('fTanggal').value,
    waktu: document.getElementById('fWaktu').value,
    lokasi: document.getElementById('fLokasi').value,
    peserta: document.getElementById('fPeserta').value,
    pembahasan: document.getElementById('fPembahasan').value,
    keputusan: document.getElementById('fKeputusan').value,
    tindak_lanjut: document.getElementById('fTindakLanjut').value,
    author_id: currentUser.id,
    author_name: currentProfile ? currentProfile.nama : currentUser.email
  };

  let error;
  if (editingId) {
    ({ error } = await db.from('notulen').update(payload).eq('id', editingId));
  } else {
    ({ error } = await db.from('notulen').insert(payload));
  }

  btn.disabled = false;
  if (error) { showToast('Gagal menyimpan', 'error'); return; }
  showToast(editingId ? 'Notulen diperbarui!' : 'Notulen ditambahkan!', 'success');
  closeModal();
  loadNotulen();
}

async function deleteNotulen(id) {
  if (!confirm('Hapus notulen ini?')) return;
  await db.from('notulen').delete().eq('id', id);
  showToast('Notulen dihapus', 'success');
  loadNotulen();
}

// ===== PDF EXPORT =====
function exportSinglePDF() {
  if (!selectedNotulen) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text('NOTULEN RAPAT', 105, y, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Sekretaris KKN - UIN SMDD Bukittinggi', 105, y + 7, { align: 'center' });
  y += 20;
  doc.line(14, y, 196, y);
  y += 10;

  const n = selectedNotulen;
  const fields = [
    ['Judul Rapat', n.judul_rapat],
    ['Tanggal', formatDateFull(n.tanggal)],
    ['Waktu', n.waktu || '-'],
    ['Lokasi', n.lokasi || '-'],
    ['Peserta', n.peserta || '-'],
    ['Pembahasan', n.pembahasan || '-'],
    ['Keputusan', n.keputusan || '-'],
    ['Tindak Lanjut', n.tindak_lanjut || '-'],
  ];

  doc.setFontSize(11);
  fields.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(label + ':', 14, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(value, 170);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  doc.save(`notulen_${n.judul_rapat.replace(/\s+/g, '_')}.pdf`);
  showToast('PDF berhasil diexport!', 'success');
}

async function exportAllPDF() {
  const { data } = await db.from('notulen').select('*').order('tanggal', { ascending: false });
  if (!data || data.length === 0) { showToast('Belum ada notulen', 'error'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('REKAP NOTULEN RAPAT', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Sekretaris KKN - UIN SMDD Bukittinggi', 105, 28, { align: 'center' });

  const tableData = data.map((n, i) => [i + 1, n.judul_rapat, formatDate(n.tanggal), n.lokasi || '-', (n.keputusan || '-').substring(0, 60)]);

  doc.autoTable({
    startY: 35,
    head: [['No', 'Judul Rapat', 'Tanggal', 'Lokasi', 'Keputusan']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [230, 168, 23] },
    styles: { fontSize: 9 }
  });

  doc.save('rekap_notulen_kkn.pdf');
  showToast('PDF rekap berhasil diexport!', 'success');
}
