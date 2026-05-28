// ============================================
// AUTH GUARD & HELPER FUNCTIONS
// ============================================

// Cek apakah user sudah login
async function checkAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

// Ambil profil user dari tabel profiles
async function getUserProfile(userId) {
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) {
    // Self-healing: jika profil tidak ditemukan, coba buat dari session user metadata
    const { data: { session } } = await db.auth.getSession();
    if (session && session.user && session.user.id === userId) {
      const meta = session.user.user_metadata || {};
      const newProfile = {
        id: userId,
        email: session.user.email,
        nama: meta.nama || session.user.email.split('@')[0],
        nim: meta.nim || '',
        role: meta.role || 'ketua'
      };
      const { error: insertError } = await db.from('profiles').insert(newProfile);
      if (!insertError) {
        return newProfile;
      }
    }
  }
  return data;
}

// Ambil semua anggota
async function getAllMembers() {
  const { data } = await db.from('profiles').select('*').order('created_at');
  return data || [];
}

// Logout
async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

// Toast notification
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Format tanggal Indonesia
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateFull(dateStr) {
  if (!dateStr) return '-';
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date(dateStr);
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getLocalDateString(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

