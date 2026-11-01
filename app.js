/* ============================================
   DarTounsi v2 — Single Page Application
   Features: SPA routing, theme toggle, 3-language,
   SamsarBot AI, avatar system, smooth animations
   ============================================ */

// ---- App State ----
const API = "api.php";
let currentUser = null;    // Logged-in user object (null = guest)
let notifInterval = null;  // Interval for checking new notifications
let currentLang = "en";    // Current language: en, fr, ar

// ---- Translation System ----
// Each key maps to { en, fr, ar } translations
const T = {
  home: { en: "Home", fr: "Accueil", ar: "الرئيسية" },
  search: { en: "Search", fr: "Rechercher", ar: "بحث" },
  dashboard: { en: "Dashboard", fr: "Tableau de bord", ar: "لوحة التحكم" },
  addListing: { en: "Add Listing", fr: "Ajouter", ar: "إضافة" },
  messages: { en: "Messages", fr: "Messages", ar: "الرسائل" },
  admin: { en: "Admin", fr: "Admin", ar: "الإدارة" },
  signIn: { en: "Sign In", fr: "Connexion", ar: "تسجيل الدخول" },
  signUp: { en: "Sign Up", fr: "Inscription", ar: "إنشاء حساب" },
  logout: { en: "Logout", fr: "Déconnexion", ar: "خروج" },
  myProfile: { en: "My Profile", fr: "Mon Profil", ar: "ملفي" },
  favorites: { en: "Favorites", fr: "Favoris", ar: "المفضلة" },
  matchmaking: { en: "Matchmaking", fr: "Colocation", ar: "التوافق" },
  about: { en: "About", fr: "À propos", ar: "حول" },
  findHome: { en: "Find Your Perfect", fr: "Trouvez Votre", ar: "اعثر على" },
  homeInTunisia: { en: "Home in Tunisia", fr: "Logement en Tunisie", ar: "منزلك في تونس" },
  heroDesc: { en: "The leading platform for property rentals, flat sharing, and student housing. Verified listings, smart matchmaking, and AI-powered assistance.", fr: "La première plateforme de location immobilière, colocation et logement étudiant. Annonces vérifiées, matchmaking intelligent et assistance IA.", ar: "المنصة الرائدة لتأجير العقارات والسكن المشترك وسكن الطلاب. إعلانات موثقة، توافق ذكي ومساعدة بالذكاء الاصطناعي." },
  explore: { en: "Explore", fr: "Explorer", ar: "استكشاف" },
  browseProperties: { en: "Browse Properties", fr: "Parcourir les biens", ar: "تصفح العقارات" },
  welcomeBack: { en: "Welcome Back", fr: "Bienvenue", ar: "مرحباً بعودتك" },
  createAccount: { en: "Create Account", fr: "Créer un compte", ar: "إنشاء حساب" },
  email: { en: "Email", fr: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", fr: "Mot de passe", ar: "كلمة المرور" },
  noResults: { en: "No properties found", fr: "Aucun bien trouvé", ar: "لم يتم العثور على عقارات" },
  perMonth: { en: "/month", fr: "/mois", ar: "/شهر" },
  allCities: { en: "All Cities", fr: "Toutes les villes", ar: "كل المدن" },
  allTypes: { en: "All Types", fr: "Tous les types", ar: "كل الأنواع" },
  applyRent: { en: "Apply to Rent", fr: "Demander Location", ar: "طلب إيجار" },
  saveProfile: { en: "Save Profile", fr: "Enregistrer", ar: "حفظ الملف" },
  submitReview: { en: "Submit Review", fr: "Envoyer l'avis", ar: "إرسال التقييم" },
  samsarGreeting: { en: "Hello! I'm SamsarBot, your AI assistant. How can I help you today?", fr: "Bonjour! Je suis SamsarBot, votre assistant IA. Comment puis-je vous aider?", ar: "مرحباً! أنا سمسار بوت، مساعدك الذكي. كيف يمكنني مساعدتك؟" },
};

// Returns translated text for current language
function t(key) { return T[key]?.[currentLang] || T[key]?.en || key; }

// ---- Utility Functions ----
// Escape HTML to prevent XSS
function esc(s) { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }

// Get initials from a name (e.g., "John Doe" → "JD")
function initials(name) { return (name || "?").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase(); }

// Get a consistent color for a name (used for avatars)
function avatarColor(name) {
  const colors = ["#e85d04","#3b82f6","#22c55e","#a855f7","#ef4444","#f59e0b","#14b8a6","#ec4899","#6366f1","#0ea5e9"];
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// Generate avatar HTML (shows image if URL exists, otherwise colored initials)
function avatar(name, url, size = "") {
  const cls = size ? `avatar ${size}` : "avatar";
  if (url) return `<div class="${cls}"><img src="${esc(url)}" alt="${esc(name)}" onerror="this.parentElement.innerHTML='${initials(name)}'"></div>`;
  return `<div class="${cls}" style="background:${avatarColor(name)}">${initials(name)}</div>`;
}

// Generate star rating HTML
function stars(rating) {
  let h = '<div class="stars">';
  for (let i = 1; i <= 5; i++) h += `<span class="star ${i <= Math.round(rating || 0) ? "filled" : ""}">★</span>`;
  return h + "</div>";
}

// Convert date to relative time (e.g., "2h ago")
function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago"; if (s < 604800) return Math.floor(s / 86400) + "d ago";
  return new Date(d).toLocaleDateString();
}

// Generate a role badge (colored label)
function roleBadge(role) {
  const labels = { super_admin: "Super Admin", admin: "Admin", owner: "Owner", hotel_manager: "Hotel Manager", tenant: "Tenant" };
  return `<span class="badge badge-role badge-${role}">${labels[role] || role}</span>`;
}

// Generate a status badge
function statusBadge(status) {
  const map = { active: "badge-verified", pending: "badge-pending", rejected: "badge-error", rented: "badge-rented", archived: "badge-pending", accepted: "badge-verified" };
  return `<span class="badge ${map[status] || "badge-pending"}">${status}</span>`;
}

// Property type icons
function propTypeIcon(type) { return { apartment: "🏢", house: "🏡", studio: "🏠", room: "🛏️", hotel_room: "🏨" }[type] || "🏠"; }

// Gradient backgrounds for property cards without images
function propGradient(id, type) {
  const grads = { apartment: "linear-gradient(135deg,#1e3a5f,#2d5a8e)", house: "linear-gradient(135deg,#1a4731,#2d7a50)", studio: "linear-gradient(135deg,#3b1f5e,#6b3fa0)", room: "linear-gradient(135deg,#5c2d0e,#a8551a)", hotel_room: "linear-gradient(135deg,#4a3000,#8b6914)" };
  return grads[type] || grads.apartment;
}

// Amenity labels with emoji
function amenityLabel(a) {
  const map = { wifi:"📶 WiFi", ac:"❄️ AC", parking:"🅿️ Parking", pool:"🏊 Pool", gym:"💪 Gym", elevator:"🛗 Elevator", garden:"🌿 Garden", security:"🔒 Security", furnished:"🛋️ Furnished", sea_view:"🌊 Sea View", terrace:"☀️ Terrace", near_university:"🎓 Near Uni", near_transport:"🚇 Transit", near_beach:"🏖️ Beach", balcony:"🌅 Balcony", washing_machine:"🧺 Washer", bbq:"🍖 BBQ", breakfast:"🍳 Breakfast", room_service:"🛎️ Room Service", spa:"💆 Spa", concierge:"🎩 Concierge" };
  return map[a] || a;
}

// ---- Toast Notification System ----
function toast(msg, type = "info") {
  const c = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = msg;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateX(40px)"; setTimeout(() => el.remove(), 300); }, 3500);
}

// ---- API Client ----
// Makes a request to api.php with route, action, and options
async function api(route, action, opts = {}) {
  let url = `${API}?route=${route}&action=${action}`;
  if (opts.params) Object.entries(opts.params).forEach(([k, v]) => { if (v !== undefined && v !== "") url += `&${k}=${encodeURIComponent(v)}`; });
  const fetchOpts = { method: opts.method || "GET", credentials: "same-origin" };
  if (opts.body) { fetchOpts.method = "POST"; fetchOpts.headers = { "Content-Type": "application/json" }; fetchOpts.body = JSON.stringify(opts.body); }
  if (opts.formData) { fetchOpts.method = "POST"; fetchOpts.body = opts.formData; }
  try {
    const r = await fetch(url, fetchOpts);
    const d = await r.json();
    if (!r.ok && d.message && r.status !== 401) toast(d.message, "error");
    return { ok: r.ok, status: r.status, ...d };
  } catch (e) { toast("Connection error", "error"); return { ok: false, message: "Network error" }; }
}

// ---- Router ----
function navigate(hash) { window.location.hash = hash; }
function getHash() { return window.location.hash.slice(1) || "/"; }

// Match hash against a pattern like "/property/:id" and extract params
function getRouteParams(pattern, hash) {
  const ps = pattern.split("/"), hs = hash.split("/");
  if (ps.length !== hs.length) return null;
  const params = {};
  for (let i = 0; i < ps.length; i++) { if (ps[i].startsWith(":")) params[ps[i].slice(1)] = hs[i]; else if (ps[i] !== hs[i]) return null; }
  return params;
}

// Main router — renders the correct page based on URL hash
async function router() {
  const hash = getHash(), app = document.getElementById("app");
  app.style.opacity = "0";
  setTimeout(async () => {
    let m;
    if (hash === "/" || hash === "") await renderHome(app);
    else if (hash === "/search") await renderSearch(app);
    else if ((m = getRouteParams("/property/:id", hash))) await renderProperty(app, m.id);
    else if (hash === "/login") renderLogin(app);
    else if (hash === "/register") renderRegister(app);
    else if (hash === "/dashboard") await renderDashboard(app);
    else if (hash === "/profile") await renderEditProfile(app);
    else if ((m = getRouteParams("/profile/:id", hash))) await renderUserProfile(app, m.id);
    else if (hash === "/admin") await renderAdmin(app);
    else if (hash === "/add-property") renderAddProperty(app);
    else if (hash === "/matchmaking") await renderMatchmaking(app);
    else if (hash === "/messages") await renderMessages(app);
    else if ((m = getRouteParams("/messages/:id", hash))) await renderChat(app, m.id);
    else if (hash === "/notifications") await renderNotifications(app);
    else if (hash === "/favorites") await renderFavorites(app);
    else if (hash === "/about") await renderAbout(app);
    else render404(app);
    app.style.opacity = "1"; app.style.transition = "opacity 0.3s ease";
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateSamsarContext(); // Update SamsarBot suggestions for the new page
  }, 150);
}

// ---- Theme Toggle ----
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("dt_theme", next);
  document.getElementById("theme-toggle").textContent = next === "dark" ? "🌙" : "☀️";
}

// ---- Language Switcher ----
const LANGS = ["en", "fr", "ar"];
function cycleLang() {
  const idx = (LANGS.indexOf(currentLang) + 1) % LANGS.length;
  setLang(LANGS[idx]);
}
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("dt_lang", lang);
  document.getElementById("lang-btn").textContent = lang.toUpperCase();
  // Set text direction for Arabic
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  // Re-render current page
  renderNavbar(); renderFooter(); router();
}

// ---- Session Check ----
async function checkSession() {
  const r = await api("auth", "session");
  currentUser = r.authenticated ? r.user : null;
  renderNavbar(); renderFooter();
  // Start polling for new notifications if logged in
  if (currentUser && !notifInterval) {
    notifInterval = setInterval(async () => {
      const n = await api("notifications", "count");
      if (n.ok && n.count > 0) {
        const badge = document.getElementById("notif-badge");
        if (badge) { badge.textContent = n.count; badge.classList.remove("hidden"); }
      }
    }, 30000);
  }
}

// ---- Navbar ----
function renderNavbar() {
  const nav = document.getElementById("navbar");
  const u = currentUser;
  const isAdmin = u && (u.role === "admin" || u.role === "super_admin");
  const isOwner = u && (u.role === "owner" || u.role === "hotel_manager");

  nav.innerHTML = `<div class="navbar-inner">
    <a class="navbar-brand" href="#/" onclick="navigate('#/')">🏠 Dar<span>Tounsi</span></a>
    <button class="mobile-menu-btn" onclick="document.querySelector('.navbar-links').classList.toggle('show')">☰</button>
    <div class="navbar-links">
      <a href="#/" class="${getHash() === "/" ? "active" : ""}">🏠 ${t("home")}</a>
      <a href="#/search" class="${getHash() === "/search" ? "active" : ""}">🔍 ${t("search")}</a>
      <a href="#/about" class="${getHash() === "/about" ? "active" : ""}">ℹ️ ${t("about")}</a>
      ${u ? `
        <a href="#/dashboard" class="${getHash() === "/dashboard" ? "active" : ""}">📊 ${t("dashboard")}</a>
        ${isOwner || isAdmin ? `<a href="#/add-property" class="${getHash() === "/add-property" ? "active" : ""}">➕ ${t("addListing")}</a>` : ""}
        <a href="#/messages" class="${getHash() === "/messages" ? "active" : ""}" style="position:relative">💬 ${t("messages")}${u.unread_messages > 0 ? `<span class="nav-badge">${u.unread_messages}</span>` : ""}</a>
        <a href="#/notifications" class="${getHash() === "/notifications" ? "active" : ""}" style="position:relative">🔔<span class="nav-badge ${u.unread_notifications > 0 ? "" : "hidden"}" id="notif-badge">${u.unread_notifications || 0}</span></a>
        ${isAdmin ? `<a href="#/admin" class="${getHash() === "/admin" ? "active" : ""}">⚙️ ${t("admin")}</a>` : ""}
        <div style="position:relative">
          <div class="navbar-user" onclick="document.getElementById('user-dropdown').classList.toggle('show')">
            ${avatar(u.name, u.avatar_url, "avatar-sm")}
            <span class="navbar-user-name">${esc(u.name.split(" ")[0])}</span>
          </div>
          <div class="navbar-dropdown" id="user-dropdown">
            <div style="padding:0.5rem 0.75rem;border-bottom:1px solid var(--border);margin-bottom:0.25rem">
              <div style="font-weight:700;font-size:0.9rem">${esc(u.name)}</div>
              <div style="font-size:0.75rem;color:var(--text-3)">${esc(u.email)}</div>
              <div style="margin-top:0.25rem">${roleBadge(u.role)}</div>
            </div>
            <a href="#/profile">👤 ${t("myProfile")}</a>
            <a href="#/dashboard">📊 ${t("dashboard")}</a>
            <a href="#/favorites">❤️ ${t("favorites")}</a>
            <a href="#/matchmaking">🤝 ${t("matchmaking")}</a>
            <div class="divider"></div>
            <button onclick="logout()" style="color:var(--error)">🚪 ${t("logout")}</button>
          </div>
        </div>
      ` : `
        <a href="#/login" class="btn btn-outline btn-sm">${t("signIn")}</a>
        <a href="#/register" class="btn btn-primary btn-sm">${t("signUp")}</a>
      `}
    </div>
  </div>`;
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const dd = document.getElementById("user-dropdown");
    if (dd && !e.target.closest(".navbar-user") && !e.target.closest(".navbar-dropdown")) dd.classList.remove("show");
  });
}

async function logout() {
  await api("auth", "logout");
  currentUser = null;
  if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
  toast("Logged out successfully", "success");
  navigate("#/"); renderNavbar();
}

// ---- Footer ----
function renderFooter() {
  document.getElementById("footer").innerHTML = `<div class="container">
    <div class="footer-grid">
      <div>
        <h4>🏠 Dar<span style="color:var(--accent)">Tounsi</span></h4>
        <p style="margin-top:0.5rem">The leading platform for property rentals, flat sharing, and student housing in Tunisia. Find your perfect home today.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <a href="#/search">${t("browseProperties")}</a><br>
        <a href="#/matchmaking">${t("matchmaking")}</a><br>
        <a href="#/about">${t("about")}</a><br>
        <a href="#/login">${t("signIn")}</a>
      </div>
      <div>
        <h4>Property Types</h4>
        <a href="#/search">Apartments</a><br><a href="#/search">Houses & Villas</a><br><a href="#/search">Studios</a><br><a href="#/search">Hotel Rooms</a>
      </div>
      <div>
        <h4>Contact</h4>
        <p>📧 contact@dartounsi.tn</p><p>📞 +216 71 000 000</p><p>📍 Tunis, Tunisia</p>
      </div>
    </div>
    <div class="footer-bottom">© ${new Date().getFullYear()} DarTounsi. All rights reserved. Powered by SamsarBot AI.</div>
  </div>`;
}

// ---- Property Card Component ----
function propertyCard(p) {
  // Parse images JSON and get the first image
  let imgs = []; try { imgs = JSON.parse(p.images || "[]"); } catch(e) {}
  const imgSrc = imgs.length > 0 && imgs[0] ? imgs[0] : "";
  const img = imgSrc ? `<img src="${imgSrc}" alt="${esc(p.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : "";
  return `<div class="card" style="cursor:pointer" onclick="navigate('#/property/${p.id}')">
    <div class="card-img-wrap">
      ${img}
      <div class="card-img-placeholder" style="background:${propGradient(p.id, p.type)};${img ? "display:none" : ""}">${propTypeIcon(p.type)}</div>
      <div class="card-badges">
        ${p.is_premium ? '<span class="badge badge-premium">⭐ Premium</span>' : ""}
        ${p.owner_verified ? '<span class="badge badge-verified">✓ Verified</span>' : ""}
      </div>
    </div>
    <div class="card-body">
      <div class="card-price">${Number(p.price).toLocaleString()} TND <span>${t("perMonth")}</span></div>
      <div class="card-title">${esc(p.title)}</div>
      <div class="card-location">📍 ${esc(p.neighborhood || "")}${p.neighborhood ? ", " : ""}${esc(p.city)}</div>
      <div class="card-meta"><span>🛏️ ${p.bedrooms}</span><span>🚿 ${p.bathrooms}</span><span>📐 ${p.area_sqm || "—"} m²</span></div>
      <div class="card-footer">${stars(p.avg_rating)} <span style="font-size:0.8rem;color:var(--text-3)">${p.avg_rating || "—"} (${p.review_count || 0})</span></div>
    </div>
  </div>`;
}

// ---- Pagination Component ----
function renderPagination(pag, onPage) {
  if (!pag || pag.total_pages <= 1) return "";
  let h = '<div class="pagination">';
  h += `<button ${pag.page <= 1 ? "disabled" : ""} onclick="${onPage}(${pag.page - 1})">←</button>`;
  for (let i = 1; i <= pag.total_pages; i++) {
    if (pag.total_pages > 7 && Math.abs(i - pag.page) > 2 && i !== 1 && i !== pag.total_pages) {
      if (i === pag.page - 3 || i === pag.page + 3) h += "<button disabled>...</button>";
      continue;
    }
    h += `<button class="${i === pag.page ? "active" : ""}" onclick="${onPage}(${i})">${i}</button>`;
  }
  h += `<button ${pag.page >= pag.total_pages ? "disabled" : ""} onclick="${onPage}(${pag.page + 1})">→</button>`;
  return h + "</div>";
}

// ==============================
// PAGES
// ==============================

// ---- HOME PAGE ----
async function renderHome(app) {
  const featured = await api("properties", "featured");
  const props = featured.data || [];
  app.innerHTML = `
    <section class="hero">
      <div class="hero-content container fade-in">
        <span class="badge badge-accent" style="margin-bottom:1rem">🇹🇳 #1 Rental Platform in Tunisia</span>
        <h1>${t("findHome")}<br><span class="text-gradient">${t("homeInTunisia")}</span></h1>
        <p>${t("heroDesc")}</p>
        <div class="hero-search fade-in-delay">
          <input type="text" id="hero-q" placeholder="Search by city, neighborhood, or university...">
          <button class="btn btn-primary" onclick="navigate('#/search?q='+document.getElementById('hero-q').value)">🔍 ${t("explore")}</button>
        </div>
        <div class="hero-stats fade-in-delay-2">
          <div><div class="hero-stat-num">2,500+</div><div class="hero-stat-label">Properties</div></div>
          <div><div class="hero-stat-num">8,400+</div><div class="hero-stat-label">Users</div></div>
          <div><div class="hero-stat-num">24</div><div class="hero-stat-label">Cities</div></div>
          <div><div class="hero-stat-num">1,200+</div><div class="hero-stat-label">Matches</div></div>
        </div>
      </div>
    </section>
    <section class="section"><div class="container">
      <div class="section-header fade-in"><span class="badge badge-accent">Why DarTounsi</span><h2>Everything You Need to Find Home</h2><div class="section-divider"></div></div>
      <div class="grid grid-3 fade-in-delay">
        <div class="feature-card"><div class="feature-icon">🗺️</div><h3>Smart Search</h3><p>Browse properties with powerful filters. Search by city, price, type, and amenities.</p></div>
        <div class="feature-card"><div class="feature-icon">🤝</div><h3>Roommate Matching</h3><p>Our algorithm finds compatible roommates based on lifestyle, habits, and budget.</p></div>
        <div class="feature-card"><div class="feature-icon">🤖</div><h3>AI Assistant</h3><p>SamsarBot helps you navigate the platform, answer questions, and make smart decisions.</p></div>
        <div class="feature-card"><div class="feature-icon">✅</div><h3>Verified Listings</h3><p>Trust badges and community reviews ensure legitimate, quality listings.</p></div>
        <div class="feature-card"><div class="feature-icon">💬</div><h3>Direct Messaging</h3><p>Chat directly with owners. Quick and easy communication.</p></div>
        <div class="feature-card"><div class="feature-icon">🛡️</div><h3>Safety Insights</h3><p>Neighborhood safety scores help you make informed decisions about where to live.</p></div>
      </div>
    </div></section>
    <section class="section section-alt"><div class="container">
      <div class="section-header"><span class="badge badge-premium">⭐ Featured</span><h2>Featured Properties</h2><div class="section-divider"></div></div>
      <div class="grid grid-3">${props.length ? props.map(propertyCard).join("") : '<div class="empty-state"><p>No featured properties yet.</p></div>'}</div>
      <div class="text-center mt-xl"><a href="#/search" class="btn btn-outline btn-lg">${t("browseProperties")} →</a></div>
    </div></section>
    <section class="section section-dark"><div class="container">
      <div class="section-header"><h2 style="color:#fff">Our Impact in Numbers</h2><div class="section-divider"></div></div>
      <div class="grid grid-4">
        <div class="stat-card"><div class="stat-number">2,500+</div><div class="stat-label">Properties Listed</div></div>
        <div class="stat-card"><div class="stat-number">8,400+</div><div class="stat-label">Happy Users</div></div>
        <div class="stat-card"><div class="stat-number">96%</div><div class="stat-label">Satisfaction</div></div>
        <div class="stat-card"><div class="stat-number">60%</div><div class="stat-label">Faster Search</div></div>
      </div>
    </div></section>
    <section class="section"><div class="container">
      <div class="section-header"><span class="badge badge-accent">Testimonials</span><h2>What Our Users Say</h2><div class="section-divider"></div></div>
      <div class="grid grid-3">
        <div class="testimonial-card"><div style="color:var(--accent);font-size:2rem">"</div><p class="testimonial-text">DarTounsi helped me find the perfect apartment near my university in just two days!</p><div class="testimonial-author">${avatar("Asma Ben Ali")}<div><h4>Asma Ben Ali</h4><span>Student, Tunis</span></div></div></div>
        <div class="testimonial-card"><div style="color:var(--accent);font-size:2rem">"</div><p class="testimonial-text">As a property owner, managing my listings has never been easier. Great platform!</p><div class="testimonial-author">${avatar("Mehdi Trabelsi")}<div><h4>Mehdi Trabelsi</h4><span>Owner, Sfax</span></div></div></div>
        <div class="testimonial-card"><div style="color:var(--accent);font-size:2rem">"</div><p class="testimonial-text">SamsarBot AI assistant is amazing. It answered all my questions about the neighborhoods!</p><div class="testimonial-author">${avatar("Nour Hamdi")}<div><h4>Nour Hamdi</h4><span>Tenant, Sousse</span></div></div></div>
      </div>
    </div></section>
    <section class="section section-alt"><div class="container text-center">
      <h2>Ready to Find Your Home?</h2><div class="section-divider"></div>
      <p style="max-width:500px;margin:1rem auto 2rem;color:var(--text-2)">Join thousands of Tunisians who found their perfect home through DarTounsi.</p>
      <div class="flex justify-center gap-md">
        <a href="#/search" class="btn btn-primary btn-lg">🔍 ${t("browseProperties")}</a>
        <a href="#/${currentUser ? "add-property" : "register"}" class="btn btn-outline btn-lg">📋 List Your Property</a>
      </div>
    </div></section>`;
}

// ---- SEARCH PAGE ----
async function renderSearch(app, page = 1) {
  const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
  app.innerHTML = `<div class="container" style="padding-top:2rem">
    <h2>🔍 ${t("browseProperties")}</h2><div class="section-divider" style="margin:0.5rem 0 1.5rem"></div>
    <div class="filter-row">
      <input class="form-input" id="s-q" placeholder="${t("search")}..." value="${esc(urlParams.get("q") || "")}">
      <select class="form-select" id="s-city"><option value="">${t("allCities")}</option><option>Tunis</option><option>Sfax</option><option>Sousse</option><option>Monastir</option><option>Hammamet</option><option>Nabeul</option><option>Bizerte</option><option>Kairouan</option><option>Djerba</option><option>Tozeur</option><option>Tabarka</option><option>Mahdia</option></select>
      <select class="form-select" id="s-type"><option value="">${t("allTypes")}</option><option value="apartment">Apartment</option><option value="house">House</option><option value="studio">Studio</option><option value="room">Room</option><option value="hotel_room">Hotel</option></select>
      <select class="form-select" id="s-sort"><option value="newest">Newest</option><option value="price_low">Price ↑</option><option value="price_high">Price ↓</option><option value="rating">Top Rated</option><option value="views">Most Viewed</option></select>
      <button class="btn btn-primary" onclick="doSearch()">${t("search")}</button>
    </div>
    <div class="filter-row">
      <input class="form-input" id="s-min" type="number" placeholder="Min Price (TND)">
      <input class="form-input" id="s-max" type="number" placeholder="Max Price (TND)">
      <select class="form-select" id="s-beds"><option value="">Beds</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select>
      <label class="form-checkbox"><input type="checkbox" id="s-furnished"> Furnished</label>
    </div>
    <div id="search-results"><div class="loading"><div class="spinner"></div></div></div>
  </div>`;
  doSearch(page);
}
window.doSearch = async function(page = 1) {
  const results = document.getElementById("search-results"); if (!results) return;
  results.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const r = await api("properties", "list", { params: { q: document.getElementById("s-q")?.value, city: document.getElementById("s-city")?.value, type: document.getElementById("s-type")?.value, sort: document.getElementById("s-sort")?.value, min_price: document.getElementById("s-min")?.value, max_price: document.getElementById("s-max")?.value, bedrooms: document.getElementById("s-beds")?.value, furnished: document.getElementById("s-furnished")?.checked ? 1 : undefined, page } });
  if (!r.data || r.data.length === 0) { results.innerHTML = `<div class="empty-state"><div class="empty-icon">🏠</div><h3>${t("noResults")}</h3><p>Try adjusting your filters.</p></div>`; return; }
  results.innerHTML = `<p style="color:var(--text-3);margin-bottom:1rem">${r.pagination.total} properties found</p><div class="grid grid-auto">${r.data.map(propertyCard).join("")}</div>${renderPagination(r.pagination, "doSearch")}`;
};

// ---- PROPERTY DETAIL PAGE ----
async function renderProperty(app, id) {
  const r = await api("properties", "get", { params: { id } });
  if (!r.property) { app.innerHTML = '<div class="container" style="padding:3rem"><div class="empty-state"><h3>Property not found</h3></div></div>'; return; }
  const p = r.property;
  const amenities = JSON.parse(p.amenities || "[]");
  let imgs = []; try { imgs = JSON.parse(p.images || "[]"); } catch(e) {}
  const imgSrc = imgs.length > 0 && imgs[0] ? imgs[0] : "";
  const canRequest = currentUser && currentUser.role === "tenant" && p.owner_id != currentUser.id && p.status === "active";

  app.innerHTML = `<div class="container" style="padding-top:2rem">
    <a href="#/search" style="color:var(--text-3);font-size:0.85rem">← Back to search</a>
    <div class="prop-gallery" style="${imgSrc ? "" : "background:" + propGradient(p.id, p.type)};margin-top:1rem">
      ${imgSrc ? `<img src="${imgSrc}" alt="${esc(p.title)}" onerror="this.style.display='none'">` : propTypeIcon(p.type)}
    </div>
    <div class="prop-detail-grid">
      <div>
        <div class="flex items-center gap-sm mb-md">
          ${p.is_premium ? '<span class="badge badge-premium">⭐ Premium</span>' : ""}
          ${p.owner_verified ? '<span class="badge badge-verified">✓ Verified</span>' : ""}
          ${statusBadge(p.status)}
        </div>
        <h1 style="font-size:1.75rem;margin-bottom:0.5rem">${esc(p.title)}</h1>
        <p style="color:var(--text-2);margin-bottom:1rem">📍 ${esc(p.address || "")} ${esc(p.neighborhood || "")}, ${esc(p.city)}</p>
        <div class="grid grid-4" style="margin-bottom:1.5rem">
          <div class="stat-card"><div class="stat-number">${p.bedrooms}</div><div class="stat-label">Bedrooms</div></div>
          <div class="stat-card"><div class="stat-number">${p.bathrooms}</div><div class="stat-label">Bathrooms</div></div>
          <div class="stat-card"><div class="stat-number">${p.area_sqm || "—"}</div><div class="stat-label">m²</div></div>
          <div class="stat-card"><div class="stat-number">${p.views_count}</div><div class="stat-label">Views</div></div>
        </div>
        <h3 style="margin-bottom:0.75rem">Description</h3>
        <p style="color:var(--text-2);line-height:1.8;margin-bottom:1.5rem">${esc(p.description || "No description provided.")}</p>
        ${amenities.length ? `<h3 style="margin-bottom:0.75rem">Amenities</h3><div class="flex gap-sm" style="flex-wrap:wrap;margin-bottom:1.5rem">${amenities.map(a => `<span class="prop-amenity">${amenityLabel(a)}</span>`).join("")}</div>` : ""}
        ${p.safety ? `<h3 style="margin-bottom:0.75rem">🛡️ Neighborhood Safety</h3><div class="card" style="padding:1rem;margin-bottom:1.5rem"><div class="flex items-center justify-between"><span>Safety Score</span><span class="badge ${p.safety.safety_score >= 80 ? "badge-verified" : p.safety.safety_score >= 60 ? "badge-pending" : "badge-error"}">${p.safety.safety_score}/100</span></div><p style="color:var(--text-3);font-size:0.85rem;margin-top:0.5rem">${esc(p.safety.description)}</p></div>` : ""}
        <h3 style="margin-bottom:0.75rem">Reviews (${p.review_count || 0})</h3>
        <div style="margin-bottom:0.5rem">${stars(p.avg_rating)} <span style="color:var(--text-2)">${p.avg_rating || "—"}/5</span></div>
        ${(p.reviews || []).map(rv => `<div class="card" style="padding:1rem;margin-bottom:0.75rem"><div class="flex items-center gap-sm">${avatar(rv.user_name, rv.user_avatar, "avatar-sm")}<div><div style="font-weight:600;font-size:0.9rem">${esc(rv.user_name)}</div><div style="font-size:0.7rem;color:var(--text-3)">${timeAgo(rv.created_at)}</div></div><div style="margin-left:auto">${stars(rv.rating)}</div></div><p style="color:var(--text-2);font-size:0.85rem;margin-top:0.5rem">${esc(rv.comment)}</p></div>`).join("") || '<p style="color:var(--text-3)">No reviews yet.</p>'}
        ${currentUser ? `<div class="card" style="padding:1rem;margin-top:1rem"><h4 style="margin-bottom:0.75rem">${t("submitReview")}</h4><div class="form-group"><label class="form-label">Rating</label><select class="form-select" id="rev-rating"><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select></div><div class="form-group"><textarea class="form-textarea" id="rev-comment" placeholder="Share your experience..." rows="3"></textarea></div><button class="btn btn-primary" onclick="submitReview(${p.id})">${t("submitReview")}</button></div>` : ""}
        ${p.similar && p.similar.length ? `<h3 style="margin:2rem 0 1rem">Similar Properties</h3><div class="grid grid-2">${p.similar.map(s => `<div class="card" style="cursor:pointer" onclick="navigate('#/property/${s.id}')"><div class="card-body"><div class="card-price">${Number(s.price).toLocaleString()} TND <span>/mo</span></div><div class="card-title">${esc(s.title)}</div><div class="card-location">📍 ${esc(s.city)}</div></div></div>`).join("")}</div>` : ""}
      </div>
      <div class="prop-sidebar">
        <div class="card" style="margin-bottom:1rem"><div style="padding:1.5rem;text-align:center"><div style="font-size:2rem;font-weight:800;color:var(--accent)">${Number(p.price).toLocaleString()} TND</div><div style="color:var(--text-3)">${t("perMonth")}</div></div><div style="padding:0 1.5rem 1.5rem">
          ${canRequest ? (p.rental_request_status ? `<div class="text-center" style="margin-bottom:0.5rem">${statusBadge(p.rental_request_status)} <span style="color:var(--text-3);font-size:0.85rem">Your request</span></div>` : `<textarea class="form-textarea" id="rental-msg" placeholder="Write a message to the owner..." rows="3" style="margin-bottom:0.75rem"></textarea><button class="btn btn-primary w-full btn-lg" onclick="requestRental(${p.id})">📋 ${t("applyRent")}</button>`) : !currentUser ? `<a href="#/login" class="btn btn-primary w-full btn-lg">${t("signIn")} to Apply</a>` : p.status !== "active" ? `<div class="text-center">${statusBadge(p.status)}</div>` : ""}
          ${currentUser ? `<button class="btn ${p.is_favorited ? "btn-danger" : "btn-secondary"} w-full mt-md" onclick="toggleFav(${p.id})">${p.is_favorited ? "♥ Saved" : "♡ Save to Favorites"}</button>` : ""}
        </div></div>
        <div class="card" style="padding:1.25rem"><h4 style="margin-bottom:0.75rem">Owner</h4><div class="flex items-center gap-sm" style="margin-bottom:0.75rem">${avatar(p.owner_name, p.owner_avatar)}<div><a href="#/profile/${p.owner_id}" style="font-weight:600">${esc(p.owner_name)}</a>${p.owner_verified ? '<span class="badge badge-verified" style="margin-left:0.3rem">✓</span>' : ""}</div></div>
          ${p.owner_phone ? `<div style="font-size:0.85rem;color:var(--text-2);margin-bottom:0.5rem">📞 ${esc(p.owner_phone)}</div>` : ""}
          ${currentUser && currentUser.id != p.owner_id ? `<button class="btn btn-secondary w-full btn-sm" onclick="navigate('#/messages/${p.owner_id}')">💬 Message Owner</button>` : ""}
        </div>
      </div>
    </div>
  </div>`;
}

window.submitReview = async function(pid) { const r = await api("reviews", "create", { body: { property_id: pid, rating: document.getElementById("rev-rating").value, comment: document.getElementById("rev-comment").value } }); if (r.ok) { toast("Review submitted!", "success"); router(); } };
window.requestRental = async function(pid) { const r = await api("rentals", "request", { body: { property_id: pid, message: document.getElementById("rental-msg")?.value || "" } }); if (r.ok) { toast("Rental request sent! 🎉", "success"); router(); } };
window.toggleFav = async function(pid) { const r = await api("favorites", "toggle", { body: { property_id: pid } }); if (r.ok) { toast(r.favorited ? "Added to favorites ♥" : "Removed from favorites", "success"); router(); } };

// ---- LOGIN PAGE ----
function renderLogin(app) {
  if (currentUser) { navigate("#/dashboard"); return; }
  app.innerHTML = `<div class="auth-page"><div class="auth-card fade-in">
    <h2>${t("welcomeBack")}</h2><p class="auth-subtitle">Sign in to your DarTounsi account</p>
    <form onsubmit="doLogin(event)">
      <div class="form-group"><label class="form-label">${t("email")}</label><input class="form-input" type="email" id="login-email" required placeholder="your@email.tn"></div>
      <div class="form-group"><label class="form-label">${t("password")}</label><input class="form-input" type="password" id="login-pass" required placeholder="••••••••"></div>
      <button type="submit" class="btn btn-primary w-full btn-lg">${t("signIn")}</button>
    </form>
    <div class="auth-divider">or</div>
    <button class="google-btn" onclick="doGoogleLogin()">🔵 Continue with Google</button>
    <div class="auth-switch">Don't have an account? <a onclick="navigate('#/register')">${t("signUp")}</a></div>
  </div></div>`;
}
window.doLogin = async function(e) { e.preventDefault(); const r = await api("auth", "login", { body: { email: document.getElementById("login-email").value, password: document.getElementById("login-pass").value } }); if (r.ok) { currentUser = r.user; toast("Welcome back, " + r.user.name + "!", "success"); await checkSession(); navigate("#/dashboard"); } };
window.doGoogleLogin = async function() { const name = prompt("Enter your name (Google simulation):"); const email = prompt("Enter your email (@email.tn):"); if (!name || !email) return; const r = await api("auth", "google", { body: { name, email } }); if (r.ok) { currentUser = r.user; toast("Welcome, " + r.user.name + "!", "success"); await checkSession(); navigate("#/dashboard"); } };

// ---- REGISTER PAGE ----
function renderRegister(app) {
  if (currentUser) { navigate("#/dashboard"); return; }
  app.innerHTML = `<div class="auth-page"><div class="auth-card fade-in">
    <h2>${t("createAccount")}</h2><p class="auth-subtitle">Join DarTounsi today</p>
    <form onsubmit="doRegister(event)">
      <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" id="reg-name" required placeholder="Your full name"></div>
      <div class="form-group"><label class="form-label">${t("email")} *</label><input class="form-input" type="email" id="reg-email" required placeholder="your@email.tn"></div>
      <div class="form-group"><label class="form-label">${t("password")} *</label><input class="form-input" type="password" id="reg-pass" required placeholder="6+ characters" minlength="6"></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="reg-phone" placeholder="+216 XX XXX XXX"></div>
      <div class="form-group"><label class="form-label">I am a...</label><select class="form-select" id="reg-role"><option value="tenant">🏠 Tenant — Looking for a place</option><option value="owner">🏢 Property Owner</option><option value="hotel_manager">🏨 Hotel Manager</option></select></div>
      <button type="submit" class="btn btn-primary w-full btn-lg">${t("createAccount")}</button>
    </form>
    <div class="auth-divider">or</div>
    <button class="google-btn" onclick="doGoogleLogin()">🔵 Continue with Google</button>
    <div class="auth-switch">Already have an account? <a onclick="navigate('#/login')">${t("signIn")}</a></div>
  </div></div>`;
}
window.doRegister = async function(e) { e.preventDefault(); const r = await api("auth", "register", { body: { name: document.getElementById("reg-name").value, email: document.getElementById("reg-email").value, password: document.getElementById("reg-pass").value, phone: document.getElementById("reg-phone").value, role: document.getElementById("reg-role").value } }); if (r.ok) { currentUser = r.user; toast("Welcome to DarTounsi! 🎉", "success"); await checkSession(); navigate("#/dashboard"); } };

// ---- DASHBOARD ----
async function renderDashboard(app) {
  if (!currentUser) { navigate("#/login"); return; }
  const u = currentUser;
  const isOwner = ["owner","hotel_manager","admin","super_admin"].includes(u.role);
  const isTenant = u.role === "tenant";
  let tabs = [];
  if (isOwner) tabs.push({ id: "my-props", label: "📋 My Properties" });
  if (isOwner) tabs.push({ id: "incoming", label: "📩 Rental Requests" });
  if (isTenant) tabs.push({ id: "my-reqs", label: "📋 My Requests" });
  tabs.push({ id: "favorites", label: "❤️ " + t("favorites") });
  app.innerHTML = `<div class="container" style="padding-top:2rem">
    <div class="flex items-center justify-between mb-lg"><div><h2>${t("dashboard")}</h2><p style="color:var(--text-3)">Welcome back, ${esc(u.name)}! ${roleBadge(u.role)}</p></div>${isOwner ? '<a href="#/add-property" class="btn btn-primary">➕ New Listing</a>' : ""}</div>
    <div class="tabs" id="dash-tabs">${tabs.map((t, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-tab="${t.id}" onclick="switchDashTab('${t.id}')">${t.label}</button>`).join("")}</div>
    <div id="dash-content"><div class="loading"><div class="spinner"></div></div></div>
  </div>`;
  switchDashTab(tabs[0].id);
}

window.switchDashTab = async function(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  const c = document.getElementById("dash-content");
  c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  if (tab === "my-props") {
    const r = await api("properties", "my"); const props = r.data || [];
    if (!props.length) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>No properties yet</h3><a href="#/add-property" class="btn btn-primary mt-md">➕ Add Property</a></div>'; return; }
    c.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Property</th><th>City</th><th>Price</th><th>Status</th><th>Views</th><th>Requests</th><th>Actions</th></tr></thead><tbody>${props.map(p => `<tr><td><a href="#/property/${p.id}" style="font-weight:600">${esc(p.title)}</a></td><td>${esc(p.city)}</td><td>${Number(p.price).toLocaleString()} TND</td><td>${statusBadge(p.status)}</td><td>${p.views_count}</td><td>${p.pending_requests > 0 ? `<span class="badge badge-accent">${p.pending_requests} pending</span>` : "0"}</td><td><button class="btn btn-sm btn-danger" onclick="deleteProp(${p.id})">🗑️</button></td></tr>`).join("")}</tbody></table></div>`;
  } else if (tab === "incoming") {
    const r = await api("rentals", "incoming"); const reqs = r.data || [];
    if (!reqs.length) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">📩</div><h3>No rental requests</h3></div>'; return; }
    c.innerHTML = reqs.map(rr => `<div class="request-card" style="margin-bottom:0.75rem"><div>${avatar(rr.tenant_name, rr.tenant_avatar)}</div><div class="request-info"><div style="font-weight:700">${esc(rr.tenant_name)}</div><div style="font-size:0.85rem;color:var(--text-2)">wants to rent <a href="#/property/${rr.property_id}" style="color:var(--accent)">${esc(rr.property_title)}</a></div>${rr.message ? `<div style="font-size:0.8rem;color:var(--text-3);margin-top:0.3rem;font-style:italic">"${esc(rr.message)}"</div>` : ""}<div style="font-size:0.75rem;color:var(--text-3);margin-top:0.3rem">${timeAgo(rr.created_at)}</div></div><div class="request-actions">${rr.status === "pending" ? `<button class="btn btn-success btn-sm" onclick="acceptRental(${rr.id})">✓ Accept</button><button class="btn btn-danger btn-sm" onclick="rejectRental(${rr.id})">✗ Reject</button>` : statusBadge(rr.status)}</div></div>`).join("");
  } else if (tab === "my-reqs") {
    const r = await api("rentals", "my-requests"); const reqs = r.data || [];
    if (!reqs.length) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>No requests yet</h3><a href="#/search" class="btn btn-primary mt-md">🔍 Browse</a></div>'; return; }
    c.innerHTML = reqs.map(rr => `<div class="request-card" style="margin-bottom:0.75rem"><div style="font-size:2rem">${propTypeIcon(rr.type)}</div><div class="request-info"><a href="#/property/${rr.property_id}" style="font-weight:700">${esc(rr.property_title)}</a><div style="font-size:0.85rem;color:var(--text-2)">📍 ${esc(rr.city)} · ${Number(rr.price).toLocaleString()} TND/mo</div><div style="font-size:0.75rem;color:var(--text-3);margin-top:0.3rem">${timeAgo(rr.created_at)}</div></div><div>${statusBadge(rr.status)}</div></div>`).join("");
  } else if (tab === "favorites") {
    const r = await api("favorites", "list"); const favs = r.data || [];
    if (!favs.length) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">❤️</div><h3>No favorites yet</h3></div>'; return; }
    c.innerHTML = `<div class="grid grid-auto">${favs.map(propertyCard).join("")}</div>`;
  }
};

window.deleteProp = async function(id) { if (!confirm("Delete this property?")) return; const r = await api("properties", "delete", { params: { id }, method: "POST" }); if (r.ok) { toast("Property deleted", "success"); switchDashTab("my-props"); } };
window.acceptRental = async function(id) { if (!confirm("Accept this tenant?")) return; const r = await api("rentals", "accept", { params: { id }, method: "POST" }); if (r.ok) { toast("Tenant accepted! 🎉", "success"); switchDashTab("incoming"); } };
window.rejectRental = async function(id) { if (!confirm("Reject this request?")) return; const r = await api("rentals", "reject", { params: { id }, method: "POST" }); if (r.ok) { toast("Request rejected", "info"); switchDashTab("incoming"); } };

// ---- FAVORITES PAGE ----
async function renderFavorites(app) {
  if (!currentUser) { navigate("#/login"); return; }
  const r = await api("favorites", "list"); const favs = r.data || [];
  app.innerHTML = `<div class="container" style="padding-top:2rem"><h2>❤️ ${t("favorites")}</h2><div class="section-divider" style="margin:0.5rem 0 1.5rem"></div>${favs.length ? `<div class="grid grid-auto">${favs.map(propertyCard).join("")}</div>` : '<div class="empty-state"><div class="empty-icon">❤️</div><h3>No favorites yet</h3></div>'}</div>`;
}

// ---- EDIT PROFILE ----
async function renderEditProfile(app) {
  if (!currentUser) { navigate("#/login"); return; }
  const u = currentUser;
  // Generate suggested avatars (colorful SVGs)
  const suggestedAvatars = ["#e85d04","#3b82f6","#22c55e","#a855f7","#ef4444","#f59e0b","#14b8a6","#ec4899","#6366f1","#0ea5e9"];
  app.innerHTML = `<div class="container" style="padding-top:2rem;max-width:700px">
    <h2>👤 ${t("myProfile")}</h2><div class="section-divider" style="margin:0.5rem 0 1.5rem"></div>
    <div class="card" style="padding:2rem">
      <div class="text-center mb-lg">${avatar(u.name, u.avatar_url, "avatar-xl")}<div style="margin-top:0.5rem">${roleBadge(u.role)}</div></div>
      <form onsubmit="saveProfile(event)">
        <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="p-name" value="${esc(u.name)}" required></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="p-phone" value="${esc(u.phone || "")}"></div>
          <div class="form-group"><label class="form-label">Location</label><input class="form-input" id="p-location" value="${esc(u.location || "")}" placeholder="City, Country"></div>
        </div>
        <div class="form-group"><label class="form-label">Avatar URL or pick below</label><input class="form-input" id="p-avatar" value="${esc(u.avatar_url || "")}" placeholder="https://..."></div>
        <div class="form-group"><label class="form-label">Suggested Avatars <span style="font-size:0.75rem;color:var(--text-3)">— Click to select</span></label>
          <div class="avatar-grid">${suggestedAvatars.map((c, i) => `<div class="avatar-option" style="background:${c}" onclick="document.getElementById('p-avatar').value='';this.classList.toggle('selected')">${initials(u.name)}</div>`).join("")}</div>
        </div>
        <div class="form-group"><label class="form-label">Upload Avatar</label><input type="file" accept="image/*" onchange="uploadAvatar(this)" class="form-input" style="padding:0.4rem"></div>
        <div class="form-group"><label class="form-label">Banner URL</label><input class="form-input" id="p-banner" value="${esc(u.banner_url || "")}" placeholder="https://..."></div>
        <div class="form-group"><label class="form-label">About Me 🤖 <span style="font-size:0.75rem;color:var(--accent)">SamsarBot can help!</span></label><textarea class="form-textarea" id="p-desc" placeholder="Tell others about yourself...">${esc(u.description || "")}</textarea><button type="button" class="btn btn-sm btn-outline mt-sm" onclick="aiSuggestBio()">🤖 AI Suggest</button></div>
        <button type="submit" class="btn btn-primary btn-lg w-full">💾 ${t("saveProfile")}</button>
      </form>
    </div>
  </div>`;
}
window.uploadAvatar = async function(input) {
  if (!input.files[0]) return;
  const fd = new FormData(); fd.append("file", input.files[0]);
  const r = await api("upload", "", { formData: fd });
  if (r.ok && r.url) { document.getElementById("p-avatar").value = r.url; toast("Avatar uploaded!", "success"); }
};
window.aiSuggestBio = function() {
  const name = document.getElementById("p-name").value || "User";
  const location = document.getElementById("p-location").value || "Tunisia";
  const role = currentUser?.role || "tenant";
  const bios = {
    tenant: `Hi, I'm ${name} from ${location}. I'm looking for a comfortable and affordable place to call home. I'm responsible, clean, and respectful of shared spaces.`,
    owner: `I'm ${name}, a property owner based in ${location}. I take pride in maintaining quality homes and providing great living experiences for my tenants.`,
    hotel_manager: `I'm ${name}, a hospitality professional in ${location}. I manage quality accommodations and ensure every guest has a memorable stay.`,
    admin: `I'm ${name}, part of the DarTounsi team in ${location}. I help keep the platform running smoothly and ensure a great experience for all users.`,
    super_admin: `I'm ${name}, the founder and lead administrator of DarTounsi, based in ${location}. I'm dedicated to building Tunisia's best rental platform.`
  };
  document.getElementById("p-desc").value = bios[role] || bios.tenant;
  toast("🤖 SamsarBot suggested a bio for you!", "info");
};
window.saveProfile = async function(e) {
  e.preventDefault();
  const r = await api("users", "update", { body: { name: document.getElementById("p-name").value, phone: document.getElementById("p-phone").value, location: document.getElementById("p-location").value, avatar_url: document.getElementById("p-avatar").value, banner_url: document.getElementById("p-banner").value, description: document.getElementById("p-desc").value } });
  if (r.ok) { currentUser = r.user; toast("Profile updated! ✓", "success"); renderNavbar(); }
};

// ---- VIEW USER PROFILE ----
async function renderUserProfile(app, id) {
  const r = await api("users", "get", { params: { id } });
  if (!r.user) { app.innerHTML = '<div class="container" style="padding:3rem"><div class="empty-state"><h3>User not found</h3></div></div>'; return; }
  const u = r.user;
  app.innerHTML = `<div class="container" style="padding-top:2rem;max-width:800px">
    <div class="profile-banner">${u.banner_url ? `<img src="${esc(u.banner_url)}" onerror="this.style.display='none'">` : ""}</div>
    <div class="profile-header"><div class="profile-avatar" style="background:${avatarColor(u.name)}">${u.avatar_url ? `<img src="${esc(u.avatar_url)}" onerror="this.parentElement.innerHTML='${initials(u.name)}'">` : initials(u.name)}</div><div class="profile-info"><h2>${esc(u.name)} ${u.is_verified ? '<span class="badge badge-verified">✓ Verified</span>' : ""}</h2><div>${roleBadge(u.role)}</div>${u.location ? `<div style="color:var(--text-3);font-size:0.85rem;margin-top:0.25rem">📍 ${esc(u.location)}</div>` : ""}</div></div>
    <div class="grid grid-3 mb-lg"><div class="stat-card"><div class="stat-number">${u.properties_count}</div><div class="stat-label">Properties</div></div><div class="stat-card"><div class="stat-number">${u.reviews_count}</div><div class="stat-label">Reviews</div></div><div class="stat-card"><div class="stat-number">${timeAgo(u.created_at)}</div><div class="stat-label">Member Since</div></div></div>
    ${u.description ? `<div class="card" style="padding:1.5rem;margin-bottom:1rem"><h4>About</h4><p style="color:var(--text-2);margin-top:0.5rem">${esc(u.description)}</p></div>` : ""}
    ${currentUser && currentUser.id != u.id ? `<div class="flex gap-md"><button class="btn btn-primary" onclick="navigate('#/messages/${u.id}')">💬 Send Message</button></div>` : ""}
  </div>`;
}

// ---- ADD PROPERTY ----
function renderAddProperty(app) {
  if (!currentUser) { navigate("#/login"); return; }
  if (!["owner","hotel_manager","admin","super_admin"].includes(currentUser.role)) { app.innerHTML = '<div class="container" style="padding:3rem"><div class="empty-state"><h3>Access Denied</h3><p>Only owners and hotel managers can create listings.</p></div></div>'; return; }
  app.innerHTML = `<div class="container" style="padding-top:2rem;max-width:800px">
    <h2>➕ ${t("addListing")}</h2><div class="section-divider" style="margin:0.5rem 0 1.5rem"></div>
    <div class="card" style="padding:2rem"><form onsubmit="createProp(event)">
      <div class="form-group"><label class="form-label">Title * 🤖</label><input class="form-input" id="ap-title" required placeholder="Modern Apartment in..."></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Type *</label><select class="form-select" id="ap-type" required><option value="apartment">🏢 Apartment</option><option value="house">🏡 House</option><option value="studio">🏠 Studio</option><option value="room">🛏️ Room</option><option value="hotel_room">🏨 Hotel Room</option></select></div><div class="form-group"><label class="form-label">Price (TND/month) *</label><input class="form-input" type="number" id="ap-price" required></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input class="form-input" id="ap-city" required placeholder="Tunis"></div><div class="form-group"><label class="form-label">Neighborhood</label><input class="form-input" id="ap-hood" placeholder="El Manar"></div></div>
      <div class="form-group"><label class="form-label">Address</label><input class="form-input" id="ap-addr" placeholder="Full address"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Bedrooms</label><input class="form-input" type="number" id="ap-beds" value="1" min="1"></div><div class="form-group"><label class="form-label">Bathrooms</label><input class="form-input" type="number" id="ap-baths" value="1" min="1"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Area (m²)</label><input class="form-input" type="number" id="ap-area"></div><div class="form-group"><label class="form-label">Furnished</label><select class="form-select" id="ap-furn"><option value="1">Yes</option><option value="0">No</option></select></div></div>
      <div class="form-group"><label class="form-label">Description 🤖 <span style="font-size:0.75rem;color:var(--accent)">AI-assisted</span></label><textarea class="form-textarea" id="ap-desc" placeholder="Describe your property..."></textarea><button type="button" class="btn btn-sm btn-outline mt-sm" onclick="aiSuggestPropDesc()">🤖 AI Generate</button></div>
      <div class="form-group"><label class="form-label">Amenities</label><div class="flex gap-sm" style="flex-wrap:wrap">${["wifi","ac","parking","pool","gym","elevator","garden","security","sea_view","terrace","near_university","near_transport","near_beach","balcony","washing_machine","furnished","breakfast"].map(a => `<label class="form-checkbox"><input type="checkbox" value="${a}" class="amenity-cb"> ${amenityLabel(a)}</label>`).join("")}</div></div>
      <button type="submit" class="btn btn-primary btn-lg w-full">📋 Create Listing</button>
    </form></div>
  </div>`;
}
window.aiSuggestPropDesc = function() {
  const title = document.getElementById("ap-title").value || "Property"; const city = document.getElementById("ap-city").value || "Tunis"; const type = document.getElementById("ap-type").value;
  document.getElementById("ap-desc").value = `Welcome to this beautiful ${type.replace("_"," ")} in ${city}. ${title} offers a comfortable living experience with modern amenities. The space is well-maintained and conveniently located near essential services. Whether you're a student, professional, or family, this is the perfect place to call home. Contact us to schedule a visit!`;
  toast("🤖 SamsarBot generated a description!", "info");
};
window.createProp = async function(e) { e.preventDefault(); const amenities = [...document.querySelectorAll(".amenity-cb:checked")].map(c => c.value); const r = await api("properties", "create", { body: { title: document.getElementById("ap-title").value, type: document.getElementById("ap-type").value, price: document.getElementById("ap-price").value, city: document.getElementById("ap-city").value, neighborhood: document.getElementById("ap-hood").value, address: document.getElementById("ap-addr").value, bedrooms: document.getElementById("ap-beds").value, bathrooms: document.getElementById("ap-baths").value, area_sqm: document.getElementById("ap-area").value, is_furnished: document.getElementById("ap-furn").value, description: document.getElementById("ap-desc").value, amenities } }); if (r.ok) { toast(r.message, "success"); navigate("#/dashboard"); } };

// ---- ADMIN PANEL ----
async function renderAdmin(app) {
  if (!currentUser || !["admin","super_admin"].includes(currentUser.role)) { navigate("#/"); return; }
  const stats = await api("admin", "stats"); const s = stats.stats || {};
  app.innerHTML = `<div class="container" style="padding-top:2rem">
    <div class="flex items-center justify-between mb-lg"><div><h2>⚙️ ${t("admin")} Panel</h2><p style="color:var(--text-3)">${roleBadge(currentUser.role)} Management Dashboard</p></div></div>
    <div class="dash-stats">
      <div class="dash-stat"><div class="dash-stat-value">${s.users||0}</div><div class="dash-stat-label">Total Users</div></div>
      <div class="dash-stat"><div class="dash-stat-value">${s.properties_active||0}</div><div class="dash-stat-label">Active Listings</div></div>
      <div class="dash-stat"><div class="dash-stat-value" style="color:var(--warning)">${s.properties_pending||0}</div><div class="dash-stat-label">Pending</div></div>
      <div class="dash-stat"><div class="dash-stat-value" style="color:#a855f7">${s.properties_rented||0}</div><div class="dash-stat-label">Rented</div></div>
      <div class="dash-stat"><div class="dash-stat-value" style="color:var(--info)">${s.rental_requests||0}</div><div class="dash-stat-label">Pending Requests</div></div>
      <div class="dash-stat"><div class="dash-stat-value" style="color:var(--error)">${s.reports||0}</div><div class="dash-stat-label">Reports</div></div>
    </div>
    <div class="tabs"><button class="tab active" data-tab="a-users" onclick="switchAdminTab('a-users')">👥 Users</button><button class="tab" data-tab="a-props" onclick="switchAdminTab('a-props')">🏠 Properties</button><button class="tab" data-tab="a-reports" onclick="switchAdminTab('a-reports')">⚠️ Reports</button></div>
    <div id="admin-content"><div class="loading"><div class="spinner"></div></div></div>
  </div>`;
  switchAdminTab("a-users");
}

window.switchAdminTab = async function(tab, page = 1) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  const c = document.getElementById("admin-content");
  c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  if (tab === "a-users") {
    const r = await api("admin", "users", { params: { page } }); const users = r.data || [];
    c.innerHTML = `<div class="search-bar mb-md"><input class="form-input" id="au-q" placeholder="Search users..."><select class="form-select" id="au-role" style="max-width:200px"><option value="">All Roles</option><option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="owner">Owner</option><option value="hotel_manager">Hotel Manager</option><option value="tenant">Tenant</option></select><button class="btn btn-primary" onclick="searchAdminUsers()">Search</button></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Verified</th><th>Location</th><th>Joined</th><th>Actions</th></tr></thead><tbody>${users.map(u => `<tr><td><a href="#/profile/${u.id}" style="font-weight:600">${esc(u.name)}</a></td><td style="font-size:0.8rem">${esc(u.email)}</td><td>${roleBadge(u.role)}</td><td>${u.is_verified ? '<span class="badge badge-verified">✓</span>' : '<span class="badge badge-pending">✗</span>'}</td><td style="font-size:0.8rem">${esc(u.location||"—")}</td><td style="font-size:0.8rem">${timeAgo(u.created_at)}</td><td>${u.role==="super_admin" && currentUser.role!=="super_admin" ? '<span style="font-size:0.75rem;color:var(--text-3)">Protected</span>' : `<div class="flex gap-sm"><button class="btn btn-sm ${u.is_verified?"btn-outline":"btn-success"}" onclick="adminVerify(${u.id},${u.is_verified?0:1})">${u.is_verified?"Unverify":"Verify"}</button>${u.role!=="super_admin"?`<button class="btn btn-sm btn-danger" onclick="adminDeleteUser(${u.id})">🗑️</button>`:""}</div>`}</td></tr>`).join("")}</tbody></table></div>${renderPagination(r.pagination, "p => switchAdminTab('a-users', p)")}`;
  } else if (tab === "a-props") {
    const r = await api("admin", "properties", { params: { page } }); const props = r.data || [];
    c.innerHTML = `<div class="search-bar mb-md"><input class="form-input" id="ap-q2" placeholder="Search properties..."><select class="form-select" id="ap-st" style="max-width:200px"><option value="">All Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="rented">Rented</option></select><button class="btn btn-primary" onclick="searchAdminProps()">Search</button></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Property</th><th>Owner</th><th>City</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>${props.map(p => `<tr><td><a href="#/property/${p.id}" style="font-weight:600">${esc(p.title)}</a></td><td style="font-size:0.85rem">${esc(p.owner_name)}</td><td>${esc(p.city)}</td><td>${Number(p.price).toLocaleString()} TND</td><td>${statusBadge(p.status)}</td><td><div class="flex gap-sm">${p.status==="pending"?`<button class="btn btn-sm btn-success" onclick="adminApproveProp(${p.id},'active')">✓</button><button class="btn btn-sm btn-danger" onclick="adminApproveProp(${p.id},'rejected')">✗</button>`:""}<button class="btn btn-sm btn-danger" onclick="adminDeleteProp(${p.id})">🗑️</button></div></td></tr>`).join("")}</tbody></table></div>${renderPagination(r.pagination, "p => switchAdminTab('a-props', p)")}`;
  } else if (tab === "a-reports") {
    const r = await api("admin", "reports", { params: { page } }); const reports = r.data || [];
    c.innerHTML = reports.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Property</th><th>Reporter</th><th>Reason</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>${reports.map(rp => `<tr><td><a href="#/property/${rp.property_id}">${esc(rp.property_title)}</a></td><td>${esc(rp.reporter_name)}</td><td>${esc(rp.reason)}</td><td style="font-size:0.8rem;max-width:200px">${esc(rp.details)}</td><td>${statusBadge(rp.status)}</td><td>${rp.status!=="resolved"?`<button class="btn btn-sm btn-success" onclick="adminResolve(${rp.id})">Resolve</button>`:"—"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty-state"><p>No reports.</p></div>';
  }
};

window.searchAdminUsers = async function() { const r = await api("admin", "users", { params: { q: document.getElementById("au-q")?.value, role: document.getElementById("au-role")?.value } }); switchAdminTab("a-users"); };
window.searchAdminProps = async function() { switchAdminTab("a-props"); };
window.adminVerify = async function(id, status) { const r = await api("admin", "verify-user", { params: { id, status }, method: "POST" }); if (r.ok) { toast("User verification updated", "success"); switchAdminTab("a-users"); } };
window.adminDeleteUser = async function(id) { if (!confirm("Delete this user?")) return; const r = await api("admin", "delete-user", { params: { id }, method: "POST" }); if (r.ok) { toast("User deleted", "success"); switchAdminTab("a-users"); } };
window.adminApproveProp = async function(id, status) { const r = await api("admin", "approve-property", { params: { id, status }, method: "POST" }); if (r.ok) { toast("Property " + status, "success"); switchAdminTab("a-props"); } };
window.adminDeleteProp = async function(id) { if (!confirm("Delete this property?")) return; const r = await api("admin", "delete-property", { params: { id }, method: "POST" }); if (r.ok) { toast("Property deleted", "success"); switchAdminTab("a-props"); } };
window.adminResolve = async function(id) { const r = await api("admin", "resolve-report", { params: { id }, method: "POST" }); if (r.ok) { toast("Report resolved", "success"); switchAdminTab("a-reports"); } };

// ---- MESSAGES ----
async function renderMessages(app) {
  if (!currentUser) { navigate("#/login"); return; }
  const r = await api("messages", "conversations"); const convos = r.conversations || [];
  app.innerHTML = `<div class="container" style="padding-top:2rem;max-width:800px"><h2>💬 ${t("messages")}</h2><div class="section-divider" style="margin:0.5rem 0 1.5rem"></div>
    ${convos.length ? `<div class="msg-list">${convos.map(c => { const otherId = c.sender_id == currentUser.id ? c.receiver_id : c.sender_id; return `<div class="msg-item ${!c.is_read && c.receiver_id == currentUser.id ? "unread" : ""}" onclick="navigate('#/messages/${otherId}')">${avatar(c.other_name, c.other_avatar)}<div style="flex:1;min-width:0"><div class="msg-name">${esc(c.other_name)}</div><div class="msg-preview">${c.property_title ? `📋 ${esc(c.property_title)} · ` : ""}${esc(c.content)}</div></div><div class="msg-time">${timeAgo(c.created_at)}</div></div>`; }).join("")}</div>` : '<div class="empty-state"><div class="empty-icon">💬</div><h3>No messages yet</h3></div>'}
  </div>`;
}

// ---- CHAT ----
async function renderChat(app, userId) {
  if (!currentUser) { navigate("#/login"); return; }
  const r = await api("messages", "thread", { params: { user_id: userId } }); const msgs = r.messages || []; const other = r.other_user || { name: "User", id: userId };
  app.innerHTML = `<div class="container" style="padding-top:2rem;max-width:800px">
    <div class="flex items-center gap-md mb-lg"><a href="#/messages" class="btn btn-outline btn-sm">← Back</a>${avatar(other.name, other.avatar_url)}<div><a href="#/profile/${other.id}" style="font-weight:700">${esc(other.name)}</a>${other.role ? `<div>${roleBadge(other.role)}</div>` : ""}</div></div>
    <div class="card"><div class="chat-window"><div class="chat-messages" id="chat-msgs">${msgs.map(m => `<div class="chat-bubble ${m.sender_id == currentUser.id ? "sent" : "received"}">${esc(m.content)}<div class="bubble-time">${timeAgo(m.created_at)}</div></div>`).join("") || '<div class="empty-state"><p>Start the conversation!</p></div>'}</div><div class="chat-input-area"><input class="form-input" id="chat-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendMsg(${userId})"><button class="btn btn-primary" onclick="sendMsg(${userId})">Send</button></div></div></div>
  </div>`;
  const chatMsgs = document.getElementById("chat-msgs"); if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;
}
window.sendMsg = async function(userId) { const input = document.getElementById("chat-input"); if (!input.value.trim()) return; const r = await api("messages", "send", { body: { receiver_id: userId, content: input.value } }); if (r.ok) { input.value = ""; renderChat(document.getElementById("app"), userId); } };

// ---- NOTIFICATIONS ----
async function renderNotifications(app) {
  if (!currentUser) { navigate("#/login"); return; }
  const r = await api("notifications", "list"); const notifs = r.data || [];
  api("notifications", "read-all", { method: "POST" });
  const badge = document.getElementById("notif-badge"); if (badge) badge.classList.add("hidden");
  app.innerHTML = `<div class="container" style="padding-top:2rem;max-width:800px"><h2>🔔 Notifications</h2><div class="section-divider" style="margin:0.5rem 0 1.5rem"></div>
    ${notifs.length ? `<div class="card">${notifs.map(n => `<div class="notif-item ${n.is_read ? "" : "unread"}" ${n.link ? `onclick="navigate('${n.link}')" style="cursor:pointer"` : ""}>${!n.is_read ? '<div class="notif-dot"></div>' : '<div style="width:8px"></div>'}<div><div class="notif-title">${esc(n.title)}</div><div class="notif-msg">${esc(n.message)}</div><div class="notif-time">${timeAgo(n.created_at)}</div></div></div>`).join("")}</div>` : '<div class="empty-state"><div class="empty-icon">🔔</div><h3>No notifications</h3></div>'}
  </div>`;
}

// ---- MATCHMAKING ----
async function renderMatchmaking(app) {
  if (!currentUser) { navigate("#/login"); return; }
  const profile = await api("matchmaking", "profile"); const matches = await api("matchmaking", "matches"); const mp = profile.profile;
  app.innerHTML = `<div class="container" style="padding-top:2rem"><h2>🤝 ${t("matchmaking")}</h2><div class="section-divider" style="margin:0.5rem 0 1.5rem"></div>
    <div class="grid grid-2"><div><div class="card" style="padding:1.5rem"><h3 style="margin-bottom:1rem">Your Preferences</h3><form onsubmit="saveMatchProfile(event)">
      <div class="form-row"><div class="form-group"><label class="form-label">Sleep Schedule</label><select class="form-select" id="mm-sleep"><option value="early_bird" ${mp?.sleep_schedule==="early_bird"?"selected":""}>Early Bird</option><option value="night_owl" ${mp?.sleep_schedule==="night_owl"?"selected":""}>Night Owl</option><option value="flexible" ${mp?.sleep_schedule==="flexible"?"selected":""}>Flexible</option></select></div><div class="form-group"><label class="form-label">Noise Level</label><select class="form-select" id="mm-noise"><option value="quiet" ${mp?.noise_level==="quiet"?"selected":""}>Quiet</option><option value="moderate" ${mp?.noise_level==="moderate"?"selected":""}>Moderate</option><option value="social" ${mp?.noise_level==="social"?"selected":""}>Social</option></select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Cleanliness</label><select class="form-select" id="mm-clean"><option value="very_clean" ${mp?.cleanliness==="very_clean"?"selected":""}>Very Clean</option><option value="moderate" ${mp?.cleanliness==="moderate"?"selected":""}>Moderate</option><option value="relaxed" ${mp?.cleanliness==="relaxed"?"selected":""}>Relaxed</option></select></div><div class="form-group"><label class="form-label">Guest Policy</label><select class="form-select" id="mm-guest"><option value="never" ${mp?.guest_policy==="never"?"selected":""}>Never</option><option value="sometimes" ${mp?.guest_policy==="sometimes"?"selected":""}>Sometimes</option><option value="often" ${mp?.guest_policy==="often"?"selected":""}>Often</option></select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-checkbox"><input type="checkbox" id="mm-smoke" ${mp?.is_smoker?"checked":""}> Smoker</label></div><div class="form-group"><label class="form-checkbox"><input type="checkbox" id="mm-pets" ${mp?.pets_allowed?"checked":""}> Pets OK</label></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Budget Min</label><input class="form-input" type="number" id="mm-bmin" value="${mp?.budget_min||""}"></div><div class="form-group"><label class="form-label">Budget Max</label><input class="form-input" type="number" id="mm-bmax" value="${mp?.budget_max||""}"></div></div>
      <div class="form-group"><label class="form-label">Preferred City</label><input class="form-input" id="mm-city" value="${esc(mp?.preferred_city||"")}" placeholder="Tunis"></div>
      <div class="form-group"><label class="form-label">Bio 🤖</label><textarea class="form-textarea" id="mm-bio" placeholder="A bit about yourself...">${esc(mp?.bio||"")}</textarea></div>
      <button type="submit" class="btn btn-primary w-full">💾 Save Preferences</button>
    </form></div></div>
    <div><h3 style="margin-bottom:1rem">Your Matches</h3>
      ${(matches.data||[]).length ? (matches.data||[]).map(m => { const isA = m.user_a_id == currentUser.id; const otherName = isA ? m.user_b_name : m.user_a_name; const otherAvatar = isA ? m.user_b_avatar : m.user_a_avatar; const otherId = isA ? m.user_b_id : m.user_a_id; return `<div class="card" style="padding:1.25rem;margin-bottom:0.75rem"><div class="flex items-center gap-md">${avatar(otherName, otherAvatar)}<div style="flex:1"><a href="#/profile/${otherId}" style="font-weight:700">${esc(otherName)}</a><div style="font-size:0.8rem;color:var(--text-3)">Compatibility</div></div><div style="font-size:1.5rem;font-weight:800;color:var(--accent)">${m.compatibility_score}%</div></div><div class="flex gap-sm mt-md"><button class="btn btn-sm btn-primary" onclick="navigate('#/messages/${otherId}')">💬 Message</button><button class="btn btn-sm btn-outline" onclick="navigate('#/profile/${otherId}')">View Profile</button></div></div>`; }).join("") : '<div class="empty-state"><div class="empty-icon">🤝</div><h3>No matches yet</h3><p>Save your preferences to find compatible roommates!</p></div>'}
    </div></div>
  </div>`;
}
window.saveMatchProfile = async function(e) { e.preventDefault(); const r = await api("matchmaking", "profile", { body: { sleep_schedule: document.getElementById("mm-sleep").value, noise_level: document.getElementById("mm-noise").value, cleanliness: document.getElementById("mm-clean").value, guest_policy: document.getElementById("mm-guest").value, is_smoker: document.getElementById("mm-smoke").checked ? 1 : 0, pets_allowed: document.getElementById("mm-pets").checked ? 1 : 0, budget_min: document.getElementById("mm-bmin").value, budget_max: document.getElementById("mm-bmax").value, preferred_city: document.getElementById("mm-city").value, bio: document.getElementById("mm-bio").value } }); if (r.ok) toast("Preferences saved! ✓", "success"); };

// ---- ABOUT PAGE ----
async function renderAbout(app) {
  const r = await api("about", "");
  const team = r.team || [];
  const roleColors = { "Product Owner": "#e85d04", "Scrum Master": "#3b82f6", "Developer": "#22c55e" };
  app.innerHTML = `<div class="container" style="padding-top:2rem">
    <div class="about-hero fade-in"><h1>About <span class="text-gradient">DarTounsi</span></h1><p>DarTounsi is Tunisia's premier property rental platform, built with love by a dedicated Scrum team. Our mission is to make finding a home in Tunisia easy, safe, and enjoyable.</p></div>
    <div class="section-header"><span class="badge badge-accent">Our Team</span><h2>Meet the Scrum Team</h2><div class="section-divider"></div></div>
    <div class="grid grid-3 mb-lg">${team.map(m => `<div class="team-card fade-in"><div class="team-avatar" style="background:${roleColors[m.role]||"#6366f1"}">${initials(m.name)}</div><h3>${esc(m.name)}</h3><div class="team-role">${esc(m.role)}</div><p>${esc(m.description)}</p></div>`).join("")}</div>
    <div class="section section-alt" style="border-radius:var(--radius-lg);margin:2rem 0;padding:2rem"><div class="text-center"><h3>🤖 Powered by SamsarBot AI</h3><p style="color:var(--text-2);margin-top:0.5rem;max-width:600px;margin-left:auto;margin-right:auto">Our intelligent assistant uses advanced algorithms to help you find the perfect home, answer your questions, and provide smart suggestions throughout the platform.</p></div></div>
    <div class="section-header"><h2>Our Values</h2><div class="section-divider"></div></div>
    <div class="grid grid-3 mb-lg">
      <div class="feature-card"><div class="feature-icon">🔒</div><h3>Trust & Safety</h3><p>Every listing is verified. Safety scores help you make informed decisions.</p></div>
      <div class="feature-card"><div class="feature-icon">🤝</div><h3>Community</h3><p>We connect people. Our matchmaking brings compatible roommates together.</p></div>
      <div class="feature-card"><div class="feature-icon">🚀</div><h3>Innovation</h3><p>AI-powered features and smart algorithms make your experience seamless.</p></div>
    </div>
  </div>`;
}

// ---- 404 PAGE ----
function render404(app) {
  app.innerHTML = `<div class="container text-center" style="padding:5rem 0"><div style="font-size:6rem">🏚️</div><h2 style="margin:1rem 0">Page Not Found</h2><p style="color:var(--text-3);margin-bottom:2rem">The page you're looking for doesn't exist.</p><a href="#/" class="btn btn-primary btn-lg">🏠 Go Home</a></div>`;
}

// ============================================
// SAMSARBOT AI ASSISTANT
// Smart FAQ chatbot using keyword matching
// ============================================

let samsarOpen = false;
let samsarHistory = [];

// Toggle the SamsarBot panel open/close
window.toggleSamsarBot = function() {
  samsarOpen = !samsarOpen;
  document.getElementById("samsar-panel").classList.toggle("show", samsarOpen);
  if (samsarOpen && samsarHistory.length === 0) {
    samsarAddMsg("bot", t("samsarGreeting"));
    updateSamsarContext();
  }
};

// Add a message to the SamsarBot chat
function samsarAddMsg(type, text) {
  samsarHistory.push({ type, text });
  const container = document.getElementById("samsar-messages");
  container.innerHTML = samsarHistory.map(m => `<div class="samsar-msg ${m.type}">${m.text}</div>`).join("");
  container.scrollTop = container.scrollHeight;
}

// Process user input and generate AI response
window.samsarSend = function() {
  const input = document.getElementById("samsar-input");
  const q = input.value.trim(); if (!q) return;
  samsarAddMsg("user", esc(q));
  input.value = "";
  // Generate response using keyword matching
  setTimeout(() => samsarAddMsg("bot", samsarAnswer(q.toLowerCase())), 400);
};

// Click a suggestion button
window.samsarAsk = function(q) {
  samsarAddMsg("user", q);
  setTimeout(() => samsarAddMsg("bot", samsarAnswer(q.toLowerCase())), 400);
};

// Keyword-based FAQ engine — provides relevant answers
function samsarAnswer(q) {
  // General platform questions
  if (q.includes("register") || q.includes("sign up") || q.includes("account")) return "To create an account, click <b>Sign Up</b> in the top navigation. Choose your role (Tenant, Owner, or Hotel Manager) and fill in your details. It's free and takes less than a minute! 🎉";
  if (q.includes("login") || q.includes("sign in")) return "Click <b>Sign In</b> in the navigation bar. Enter your email and password. You can also use the Google simulation button for quick access.";
  if (q.includes("password") || q.includes("forgot")) return "Default passwords for demo accounts vary. Admin accounts use a different password than regular accounts. For security, choose a strong password with 6+ characters when creating a new account. 🔐";
  if (q.includes("rent") || q.includes("apply")) return "To rent a property: 1️⃣ Browse and find a property you like, 2️⃣ Click on it to see details, 3️⃣ Click <b>Apply to Rent</b> and write a message to the owner. The owner will accept or reject your request.";
  if (q.includes("owner") || q.includes("listing") || q.includes("add property")) return "As an Owner or Hotel Manager, you can add properties via <b>Add Listing</b> in the nav. Fill in the details and submit. An admin will review and approve your listing. 📋";
  if (q.includes("search") || q.includes("find") || q.includes("filter")) return "Use the <b>Search</b> page to browse all properties. You can filter by city, type, price range, bedrooms, and more. Sort by newest, price, rating, or views. 🔍";
  if (q.includes("message") || q.includes("chat") || q.includes("contact")) return "You can message any property owner directly from their listing page. Click <b>Message Owner</b> to start a conversation. Check your messages from the <b>Messages</b> tab. 💬";
  if (q.includes("match") || q.includes("roommate")) return "The <b>Matchmaking</b> feature helps you find compatible roommates! Set your preferences (sleep schedule, noise level, budget, etc.) and we'll match you with compatible users. 🤝";
  if (q.includes("admin") || q.includes("manage")) return "Admins can manage users, properties, and reports from the <b>Admin Panel</b>. They can approve/reject listings, verify users, and resolve reports. The Super Admin has the highest privileges. ⚙️";
  if (q.includes("safety") || q.includes("neighborhood") || q.includes("safe")) return "Each neighborhood has a safety score (out of 100) based on crime rates, police stations, and hospitals nearby. You can see this information on property detail pages. 🛡️";
  if (q.includes("review") || q.includes("rating")) return "You can leave a review on any property you've visited. Rate it 1-5 stars and write a comment. Reviews help other users make informed decisions. ⭐";
  if (q.includes("favorite") || q.includes("save")) return "Click the ♡ button on any property to save it to your favorites. Access your saved properties from <b>Favorites</b> in the dashboard or navigation menu. ❤️";
  if (q.includes("theme") || q.includes("dark") || q.includes("light")) return "Click the 🌙/☀️ button on the right side of the screen to switch between dark and light themes. Your preference is saved automatically! 🎨";
  if (q.includes("language") || q.includes("arabic") || q.includes("french")) return "Click the <b>EN/FR/AR</b> button on the right side to cycle through English, French, and Arabic. Arabic activates right-to-left mode. 🌍";
  if (q.includes("about") || q.includes("team")) return "Visit the <b>About</b> page to learn about our Scrum team. Yassine Lamouchi is the Product Owner, Mohamed Khabou is the Scrum Master, and the development team includes Aymen, Adem, Raed, and Mohamed Amin. 👥";
  if (q.includes("premium") || q.includes("featured")) return "Premium properties are highlighted with a ⭐ badge and appear first in search results. They get more visibility and tend to be high-quality listings.";
  if (q.includes("notification")) return "You'll receive notifications for rental requests, messages, reviews, and admin actions. Click the 🔔 icon in the nav to view all notifications. Unread ones are highlighted. 🔔";
  if (q.includes("upload") || q.includes("photo") || q.includes("image") || q.includes("avatar")) return "You can upload a profile photo from the <b>Edit Profile</b> page. Click the upload button, select an image (max 5MB), and it will be set as your avatar. You can also choose from suggested avatars! 📸";
  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) return "Hello! 👋 I'm SamsarBot, DarTounsi's AI assistant. I can help you with searching properties, understanding features, or navigating the platform. What would you like to know?";
  if (q.includes("who are you") || q.includes("what are you")) return "I'm <b>SamsarBot</b>, an AI assistant built into DarTounsi. I use intelligent algorithms to understand your questions and provide helpful answers about the platform. I'm here 24/7 to help! 🤖";
  if (q.includes("thank")) return "You're welcome! 😊 I'm always here to help. Feel free to ask me anything about DarTounsi!";
  // Default response
  return "I'm not sure about that, but I can help you with: searching properties, registration, renting, matchmaking, profile settings, safety scores, and more. Try asking about any of these topics! 🤖";
}

// Update SamsarBot suggestions based on current page
function updateSamsarContext() {
  const hash = getHash();
  let suggestions = [];
  if (hash === "/" || hash === "") suggestions = ["How to search?", "How to register?", "What is matchmaking?", "About the team"];
  else if (hash === "/search") suggestions = ["How to filter?", "Sort by price?", "What is premium?"];
  else if (hash.startsWith("/property/")) suggestions = ["How to rent?", "Safety score?", "Leave a review", "Message owner"];
  else if (hash === "/login") suggestions = ["Forgot password?", "How to register?", "Google login?"];
  else if (hash === "/register") suggestions = ["What roles exist?", "Is it free?", "Password tips"];
  else if (hash === "/dashboard") suggestions = ["My properties", "Rental requests", "View favorites"];
  else if (hash === "/profile") suggestions = ["Upload avatar", "AI suggest bio", "Change banner"];
  else if (hash === "/admin") suggestions = ["Manage users", "Approve listings", "View reports"];
  else if (hash === "/messages") suggestions = ["How messaging works?", "Contact owner"];
  else if (hash === "/matchmaking") suggestions = ["How matching works?", "Set preferences", "View matches"];
  else if (hash === "/about") suggestions = ["Who built this?", "What tech?", "Scrum team"];
  else suggestions = ["How to search?", "About DarTounsi", "Contact support"];

  const container = document.getElementById("samsar-suggestions");
  if (container) container.innerHTML = suggestions.map(s => `<button class="samsar-suggestion" onclick="samsarAsk('${s}')">${s}</button>`).join("");
}

// ---- INITIALIZATION ----
async function init() {
  // Apply saved theme (default = dark)
  const savedTheme = localStorage.getItem("dt_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("theme-toggle").textContent = savedTheme === "dark" ? "🌙" : "☀️";

  // Apply saved language (default = en)
  currentLang = localStorage.getItem("dt_lang") || "en";
  document.getElementById("lang-btn").textContent = currentLang.toUpperCase();
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = currentLang;

  // Force logout on every fresh page load (session cleared)
  await api("auth", "logout");
  currentUser = null;

  // Render UI
  renderNavbar();
  renderFooter();
  router();

  // Listen for hash changes (SPA navigation)
  window.addEventListener("hashchange", () => { renderNavbar(); router(); });

  // Enter key on hero search
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "hero-q") navigate("#/search?q=" + e.target.value); });
}

document.addEventListener("DOMContentLoaded", init);
