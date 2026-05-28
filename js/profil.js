document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;

  const profile = await getUserProfile(session.user.id);
  if (profile) {
    document.getElementById('userName').textContent = profile.nama;
    document.getElementById('userEmail').textContent = profile.email;
    document.getElementById('userNim').textContent = profile.nim || '-';
    document.getElementById('userAvatar').textContent = profile.nama.charAt(0).toUpperCase();
    document.getElementById('userRoleBadge').innerHTML = `<span class="badge badge-${profile.role === 'sekretaris' ? 'gold' : 'blue'}">${profile.role}</span>`;
  }

  loadMembers();
});

async function loadMembers() {
  const members = await getAllMembers();
  const container = document.getElementById('membersList');

  if (!members || members.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><h3>Belum ada anggota</h3></div>`;
    return;
  }

  container.innerHTML = members.map(m => `
    <div class="member-card">
      <div class="member-avatar">${m.nama.charAt(0).toUpperCase()}</div>
      <div class="member-info" style="flex:1">
        <h4>${m.nama}</h4>
        <p>${m.nim || m.email}</p>
      </div>
      <span class="badge badge-${m.role === 'sekretaris' ? 'gold' : 'blue'}">${m.role}</span>
    </div>
  `).join('');
}

async function handleLogout() {
  if (!confirm('Yakin ingin keluar?')) return;
  await logout();
}
