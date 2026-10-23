/**
 * XTRADE Progressive Web App Controller
 */

// STATE MANAGEMENT
const AppState = {
  theme: localStorage.getItem('xtrade_theme') || 'dark',
  lang: localStorage.getItem('xtrade_lang') || 'id',
  data: null,
  deferredInstallPrompt: null
};

// DOM SHORTCUT
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 1. REGISTER SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[PWA] Service Worker terdaftar:', reg.scope))
      .catch((err) => console.error('[PWA] Pendaftaran SW gagal:', err));
  });
}

// 2. FLASHSCREEN DISMISSAL
window.addEventListener('DOMContentLoaded', async () => {
  applyTheme(AppState.theme);
  await loadApplicationData();
  
  // Simulasi inisialisasi modul berkualitas
  setTimeout(() => {
    const splash = $('#splash-screen');
    if (splash) splash.classList.add('fade-out');
  }, 950);
});

// 3. FETCH MOCK DATA
async function loadApplicationData() {
  try {
    const res = await fetch('./app-data.json');
    AppState.data = await res.json();
    renderAppComponents();
  } catch (e) {
    console.error('Gagal memuat data lokal JSON, menjalankan fallback state:', e);
  }
}

// 4. RENDER UI COMPONENTS
function renderAppComponents() {
  if (!AppState.data) return;

  // Render Carousel Banners
  const bannerTrack = $('#banner-track');
  if (bannerTrack) {
    bannerTrack.innerHTML = AppState.data.banners.map(b => `
      <div class="carousel-slide" style="background: ${b.color};">
        <span>${b.badge}</span>
        <h3 style="font-size: 16px; font-weight: 800;">${b.title}</h3>
      </div>
    `).join('');
  }

  // Render Categories
  const catGrid = $('#category-container');
  if (catGrid) {
    catGrid.innerHTML = AppState.data.categories.map(c => `
      <button class="cat-item">
        <div class="cat-icon-squircle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          </svg>
        </div>
        <span>${c.name}</span>
      </button>
    `).join('');
  }

  // Render Products & Dismiss Shimmer
  const productContainer = $('#product-container');
  const bottomShimmer = $('#bottom-shimmer');

  setTimeout(() => {
    if (productContainer) {
      productContainer.innerHTML = AppState.data.products.map(p => `
        <article class="product-card">
          <img src="${p.image}" class="product-img" alt="${p.name}" loading="lazy"/>
          <div class="product-meta">
            <span style="font-size: 10px; color: var(--primary); font-weight: 700;">${p.category}</span>
            <h4 class="product-name">${p.name}</h4>
            <div class="original-price">Rp ${p.originalPrice.toLocaleString('id-ID')}</div>
            <div class="product-price">Rp ${p.price.toLocaleString('id-ID')}</div>
          </div>
        </article>
      `).join('');
    }
    if (bottomShimmer) bottomShimmer.style.display = 'none';
  }, 1200);

  // Render FAQs
  const faqList = $('#faq-list-container');
  if (faqList) {
    faqList.innerHTML = AppState.data.faqs.map((f, i) => `
      <div class="accordion-item" data-faq-index="${i}">
        <button class="accordion-header">
          <span>${f.q}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="accordion-body">${f.a}</div>
      </div>
    `).join('');

    $$('.accordion-header').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.currentTarget.parentElement;
        item.classList.toggle('open');
      });
    });
  }

  // Render Payment Methods
  const payContainer = $('#payment-list-container');
  if (payContainer) {
    payContainer.innerHTML = AppState.data.paymentMethods.map((m, idx) => `
      <div class="payment-card ${idx === 0 ? 'selected' : ''}" data-method-id="${m.id}">
        <div style="flex-grow: 1;">
          <div style="font-size: 13px; font-weight: 700;">${m.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${m.desc}</div>
        </div>
        ${m.badge ? `<span style="font-size: 9px; font-weight: 800; background: var(--primary); color: #fff; padding: 2px 6px; border-radius: 4px;">${m.badge}</span>` : ''}
      </div>
    `).join('');

    $$('.payment-card[data-method-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        $$('.payment-card[data-method-id]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }
}

// 5. THEME TOGGLE
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('xtrade_theme', theme);
  AppState.theme = theme;
}

$('#theme-toggle-btn')?.addEventListener('click', () => {
  const targetTheme = AppState.theme === 'dark' ? 'light' : 'dark';
  applyTheme(targetTheme);
});

// 6. LANGUAGE BOTTOM SHEET
$('#lang-modal-trigger')?.addEventListener('click', () => {
  $('#modal-language').classList.add('active');
});

$$('[data-set-lang]').forEach(el => {
  el.addEventListener('click', () => {
    $$('[data-set-lang]').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    AppState.lang = el.getAttribute('data-set-lang');
    localStorage.setItem('xtrade_lang', AppState.lang);
    $('#current-lang-lbl').innerText = AppState.lang.toUpperCase();
  });
});

$('#btn-close-lang')?.addEventListener('click', () => {
  $('#modal-language').classList.remove('active');
});

// 7. BOTTOM NAVIGATION CONTROLLER
$$('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    
    const tab = item.getAttribute('data-tab');
    if (tab === 'checkout') $('#modal-payment').classList.add('active');
    if (tab === 'faq') $('#modal-faq').classList.add('active');
    if (tab === 'terms') $('#modal-terms').classList.add('active');
  });
});

// MODAL CLOSE ON OUTSIDE CLICK
$$('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
});

// 8. T&C SCROLL PROGRESSION & INTERSECTION OBSERVER
const termsBox = $('#terms-scrollable-content');
const progressBar = $('#terms-reading-progress');
const agreeBtn = $('#btn-agree-terms');
const bottomMarker = $('#terms-bottom-marker');

if (termsBox && progressBar) {
  termsBox.addEventListener('scroll', () => {
    const total = termsBox.scrollHeight - termsBox.clientHeight;
    const current = termsBox.scrollTop;
    const pct = Math.min(100, Math.round((current / total) * 100));
    progressBar.style.width = pct + '%';
  });
}

if (bottomMarker && agreeBtn) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        agreeBtn.removeAttribute('disabled');
      }
    });
  }, { threshold: 0.9 });

  observer.observe(bottomMarker);

  agreeBtn.addEventListener('click', () => {
    $('#modal-terms').classList.remove('active');
  });
}

// 9. PWA BEFORE INSTALL PROMPT (A2HS)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  AppState.deferredInstallPrompt = e;
  const a2hsCard = $('#a2hs-card');
  if (a2hsCard) a2hsCard.classList.remove('hidden');
});

$('#btn-pwa-install')?.addEventListener('click', async () => {
  if (!AppState.deferredInstallPrompt) return;
  AppState.deferredInstallPrompt.prompt();
  const { outcome } = await AppState.deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    $('#a2hs-card').classList.add('hidden');
  }
  AppState.deferredInstallPrompt = null;
});

// 10. FAB ACTION (OPEN QUICK CHAT)
$('#fab-chat-action')?.addEventListener('click', () => {
  window.open('https://wa.me/6289501857938?text=Halo%20Admin%20XTRADE,%20saya%20ingin%20konsultasi%20layanan', '_blank');
});
