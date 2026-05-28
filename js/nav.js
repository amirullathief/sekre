// ============================================
// DYNAMIC NAVIGATION COMPONENT
// ============================================

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-home', href: 'dashboard.html' },
  { id: 'kegiatan', label: 'Kegiatan', icon: 'fa-calendar-check', href: 'kegiatan.html' },
  { id: 'agenda', label: 'Agenda', icon: 'fa-calendar-alt', href: 'agenda.html' },
  { id: 'notulen', label: 'Notulen', icon: 'fa-file-alt', href: 'notulen.html' },
  { id: 'surat', label: 'Surat', icon: 'fa-envelope', href: 'surat.html' },
  { id: 'dokumentasi', label: 'Dokumentasi', icon: 'fa-camera', href: 'dokumentasi.html' },
  { id: 'profil', label: 'Profil', icon: 'fa-user', href: 'profil.html' },
];

const BOTTOM_NAV_IDS = ['dashboard', 'kegiatan', 'agenda', 'notulen', 'dokumentasi'];

function getActivePage() {
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  return path.replace('.html', '');
}

function buildNavigation() {
  const activePage = getActivePage();
  const app = document.getElementById('app');
  if (!app) return;

  // Hamburger button
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.innerHTML = '<i class="fas fa-bars"></i>';
  hamburger.onclick = () => {
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
  };
  document.body.appendChild(hamburger);

  // Sidebar overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.onclick = () => {
    document.querySelector('.sidebar').classList.remove('open');
    overlay.classList.remove('active');
  };
  document.body.appendChild(overlay);

  // Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">SK</div>
      <div class="sidebar-title">Sekretaris KKN</div>
      <div class="sidebar-subtitle">UIN SMDD Bukittinggi</div>
    </div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}">
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <a href="#" class="nav-item" onclick="logout(); return false;">
        <i class="fas fa-sign-out-alt"></i>
        <span>Keluar</span>
      </a>
    </div>
  `;
  app.insertBefore(sidebar, app.firstChild);

  // Bottom nav
  const bottomNav = document.createElement('div');
  bottomNav.className = 'bottom-nav';
  const bottomItems = NAV_ITEMS.filter(i => BOTTOM_NAV_IDS.includes(i.id));
  bottomNav.innerHTML = `
    <div class="bottom-nav-inner">
      ${bottomItems.map(item => `
        <a href="${item.href}" class="bottom-nav-item ${activePage === item.id ? 'active' : ''}">
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `).join('')}
      <a href="profil.html" class="bottom-nav-item ${activePage === 'profil' ? 'active' : ''}">
        <i class="fas fa-ellipsis-h"></i>
        <span>Lainnya</span>
      </a>
    </div>
  `;
  document.body.appendChild(bottomNav);
}

// Build navigation when DOM is ready
document.addEventListener('DOMContentLoaded', buildNavigation);
