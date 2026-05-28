// ============================================
// DASHBOARD LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;

  const profile = await getUserProfile(session.user.id);
  if (profile) {
    document.getElementById('welcomeText').textContent = `Selamat datang, ${profile.nama}!`;
  }

  loadStats();
  loadUpcomingAgenda();
});

async function loadStats() {
  const tables = ['kegiatan', 'agenda', 'notulen', 'surat'];
  const ids = ['totalKegiatan', 'totalAgenda', 'totalNotulen', 'totalSurat'];

  for (let i = 0; i < tables.length; i++) {
    const { count } = await db.from(tables[i]).select('*', { count: 'exact', head: true });
    document.getElementById(ids[i]).textContent = count || 0;
  }
}

async function loadUpcomingAgenda() {
  const today = getLocalDateString();
  const { data } = await db.from('agenda')
    .select('*')
    .gte('tanggal', today)
    .order('tanggal', { ascending: true })
    .limit(5);

  const container = document.getElementById('upcomingAgenda');

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-alt"></i><h3>Belum ada agenda mendatang</h3></div>`;
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="item-card">
      <div class="item-card-header">
        <div>
          <div class="item-card-title">${item.judul}</div>
          <div class="item-card-meta">
            <span><i class="fas fa-calendar"></i>${formatDate(item.tanggal)}</span>
            ${item.waktu ? `<span><i class="fas fa-clock"></i>${item.waktu}</span>` : ''}
            ${item.lokasi ? `<span><i class="fas fa-map-marker-alt"></i>${item.lokasi}</span>` : ''}
          </div>
        </div>
        <span class="badge badge-${item.jenis === 'rapat' ? 'blue' : item.jenis === 'acara' ? 'gold' : 'green'}">${item.jenis || 'umum'}</span>
      </div>
    </div>
  `).join('');
}

