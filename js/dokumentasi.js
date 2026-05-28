let currentUser = null;
let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;
  currentUser = session.user;
  currentProfile = await getUserProfile(currentUser.id);
  loadDokumentasi();
});

async function loadDokumentasi() {
  const { data } = await db.from('dokumentasi').select('*').order('tanggal', { ascending: false });
  const container = document.getElementById('photoGrid');

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-camera"></i><h3>Belum ada dokumentasi</h3><p>Upload foto kegiatan KKN</p></div>`;
    return;
  }

  const canDelete = currentProfile && currentProfile.role === 'sekretaris';

  container.innerHTML = data.map((item, i) => `
    <div class="photo-card" style="animation-delay:${i * 0.05}s">
      <img src="${item.foto_url}" alt="${item.judul}" onclick="openLightbox('${item.foto_url}')" style="cursor:pointer">
      <div class="photo-card-body">
        <h4>${item.judul}</h4>
        <p><i class="fas fa-calendar" style="margin-right:4px"></i>${formatDate(item.tanggal)} · ${item.author_name}</p>
        ${item.deskripsi ? `<p style="margin-top:4px">${item.deskripsi}</p>` : ''}
        ${(canDelete || item.author_id === currentUser.id) ? `
          <button class="btn btn-danger btn-sm" style="margin-top:8px" onclick="deleteDok('${item.id}','${item.foto_url}')">
            <i class="fas fa-trash"></i> Hapus
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function previewFile(input) {
  const preview = document.getElementById('filePreview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function openModal() {
  document.getElementById('fJudul').value = '';
  document.getElementById('fTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('fDeskripsi').value = '';
  document.getElementById('fFoto').value = '';
  document.getElementById('filePreview').innerHTML = '';
  document.getElementById('modal').classList.add('active');
}
function closeModal() { document.getElementById('modal').classList.remove('active'); }

async function uploadDokumentasi(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';

  const file = document.getElementById('fFoto').files[0];
  if (!file) { showToast('Pilih foto terlebih dahulu', 'error'); btn.disabled = false; btn.textContent = 'Upload'; return; }

  // Upload file ke Supabase Storage
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const { data: uploadData, error: uploadError } = await db.storage
    .from('dokumentasi')
    .upload(fileName, file);

  if (uploadError) {
    showToast('Gagal upload foto: ' + uploadError.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Upload';
    return;
  }

  // Dapatkan public URL
  const { data: urlData } = db.storage.from('dokumentasi').getPublicUrl(fileName);
  const fotoUrl = urlData.publicUrl;

  // Simpan ke database
  const { error } = await db.from('dokumentasi').insert({
    judul: document.getElementById('fJudul').value,
    tanggal: document.getElementById('fTanggal').value,
    deskripsi: document.getElementById('fDeskripsi').value,
    foto_url: fotoUrl,
    author_id: currentUser.id,
    author_name: currentProfile ? currentProfile.nama : currentUser.email
  });

  btn.disabled = false;
  btn.textContent = 'Upload';

  if (error) { showToast('Gagal menyimpan data', 'error'); return; }
  showToast('Dokumentasi berhasil diupload!', 'success');
  closeModal();
  loadDokumentasi();
}

async function deleteDok(id, fotoUrl) {
  if (!confirm('Hapus dokumentasi ini?')) return;
  // Hapus file dari storage
  const fileName = fotoUrl.split('/').pop();
  await db.storage.from('dokumentasi').remove([fileName]);
  // Hapus dari database
  await db.from('dokumentasi').delete().eq('id', id);
  showToast('Dokumentasi dihapus', 'success');
  loadDokumentasi();
}

function openLightbox(url) {
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('active'); }

// Close lightbox on click outside
document.getElementById('lightbox')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});
