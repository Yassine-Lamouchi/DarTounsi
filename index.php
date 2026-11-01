<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0b0d13">
  <title>DarTounsi — Find Your Perfect Home in Tunisia</title>
  <meta name="description" content="Premium property rentals, flat sharing, and student housing in Tunisia. Verified listings, smart matchmaking, AI-powered assistance.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏠</text></svg>">
  <link rel="stylesheet" href="style.css">
</head>

<body>
  <header class="navbar" id="navbar"></header>
  <main id="app"></main>
  <footer class="footer" id="footer"></footer>

  <!-- Toast notifications container -->
  <div id="toast-container"></div>

  <!-- Modal overlay for popups -->
  <div class="modal-overlay" id="modal-overlay">
    <div class="modal" id="modal"></div>
  </div>

  <!-- SamsarBot floating AI assistant -->
  <div class="samsar-fab" id="samsar-fab" onclick="toggleSamsarBot()" title="SamsarBot AI Assistant">
    <span class="samsar-fab-icon">🤖</span>
    <span class="samsar-fab-pulse"></span>
  </div>
  <div class="samsar-panel" id="samsar-panel">
    <div class="samsar-header">
      <div class="samsar-title">🤖 SamsarBot <span class="samsar-ai-badge">AI</span></div>
      <button class="samsar-close" onclick="toggleSamsarBot()">✕</button>
    </div>
    <div class="samsar-messages" id="samsar-messages"></div>
    <div class="samsar-suggestions" id="samsar-suggestions"></div>
    <div class="samsar-input-area">
      <input class="samsar-input" id="samsar-input" placeholder="Ask me anything..." onkeydown="if(event.key==='Enter')samsarSend()">
      <button class="samsar-send" onclick="samsarSend()">➤</button>
    </div>
  </div>

  <!-- Toolbar: Theme toggle + Language switcher -->
  <div class="toolbar-float" id="toolbar-float">
    <button class="toolbar-btn" id="theme-toggle" onclick="toggleTheme()" title="Toggle theme">🌙</button>
    <div class="toolbar-lang" id="lang-switcher">
      <button class="toolbar-btn" onclick="cycleLang()" title="Switch language" id="lang-btn">EN</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>

</html>