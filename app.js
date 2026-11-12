/**
 * TESSUX DIGITAL - AUTOMATED INVOICE ENGINE (SERVICE & AGENCY FOCUSED)
 * Specially designed for Digital Marketing, Websites, Software, Apps, and Event Planning
 */

(function () {
  'use strict';

  // =========================================================================
  // CRYPTOGRAPHIC DATA VAULT & SYNCHRONOUS CIPHER ENGINE
  // =========================================================================

  function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    var hash = [];
    var k = [];
    var primeCounter = 0;

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength | 0);

    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

        var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        var temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
        var temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash.length = 8;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  function cryptStream(text, key, ivHex) {
    var utf8 = unescape(encodeURIComponent(text));
    var out = '';
    var blockIndex = 0;
    var keyBlock = '';

    for (var i = 0; i < utf8.length; i++) {
      if (i % 32 === 0) {
        keyBlock = sha256(key + ':' + ivHex + ':' + (blockIndex++));
      }
      var keyByte = parseInt(keyBlock.substr((i % 32) * 2, 2), 16);
      var textByte = utf8.charCodeAt(i);
      var xorByte = (textByte ^ keyByte).toString(16);
      if (xorByte.length === 1) xorByte = '0' + xorByte;
      out += xorByte;
    }
    return out;
  }

  function decryptStream(hexText, key, ivHex) {
    var utf8 = '';
    var blockIndex = 0;
    var keyBlock = '';
    var byteCount = hexText.length / 2;

    for (var i = 0; i < byteCount; i++) {
      if (i % 32 === 0) {
        keyBlock = sha256(key + ':' + ivHex + ':' + (blockIndex++));
      }
      var keyByte = parseInt(keyBlock.substr((i % 32) * 2, 2), 16);
      var cipherByte = parseInt(hexText.substr(i * 2, 2), 16);
      utf8 += String.fromCharCode(cipherByte ^ keyByte);
    }
    return decodeURIComponent(escape(utf8));
  }

  const VAULT_SALT_KEY = 'tessux_vault_salt_v2';
  const VAULT_CREDS_KEY = 'tessux_auth_creds_v2';
  const VAULT_SESSION_KEY = 'tessux_auth_session_v2';
  const VAULT_AUTOLOCK_KEY = 'tessux_autolock_minutes';

  function getVaultSalt() {
    let salt = localStorage.getItem(VAULT_SALT_KEY);
    if (!salt) {
      salt = 'tx_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(VAULT_SALT_KEY, salt);
    }
    return salt;
  }

  function getStoredCredentials() {
    const raw = localStorage.getItem(VAULT_CREDS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.username && parsed.passwordHash) return parsed;
      } catch (e) {}
    }
    // Default initial admin credentials: admin / Admin@87454786 (also accepts admin123)
    return {
      username: 'admin',
      passwordHash: sha256('Admin@87454786')
    };
  }

  function saveStoredCredentials(username, newPassword) {
    const creds = {
      username: (username || 'admin').trim(),
      passwordHash: sha256(newPassword.trim()),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(VAULT_CREDS_KEY, JSON.stringify(creds));
  }

  function getVaultMasterSecret() {
    const creds = getStoredCredentials();
    const salt = getVaultSalt();
    return (creds.passwordHash || 'default_admin_hash') + ':' + salt;
  }

  const VaultCrypto = {
    sha256: sha256,
    encrypt(text) {
      if (typeof text !== 'string') text = JSON.stringify(text);
      const secret = getVaultMasterSecret();
      const ivHex = Math.random().toString(16).substr(2, 8) + Date.now().toString(16);
      const ctHex = cryptStream(text, secret, ivHex);
      const mac = sha256(secret + ctHex + ivHex).substr(0, 16);
      return JSON.stringify({
        __tessux_enc: 1,
        v: 1,
        iv: ivHex,
        ct: ctHex,
        sig: mac
      });
    },
    decrypt(payloadStr) {
      if (!payloadStr || typeof payloadStr !== 'string') return payloadStr;
      let parsed;
      try {
        parsed = JSON.parse(payloadStr);
      } catch (e) {
        return payloadStr; // Plain text JSON fallback
      }
      if (!parsed || !parsed.__tessux_enc || !parsed.ct || !parsed.iv) {
        return payloadStr; // Legacy unencrypted JSON
      }
      const secret = getVaultMasterSecret();
      const expectedMac = sha256(secret + parsed.ct + parsed.iv).substr(0, 16);
      if (parsed.sig !== expectedMac) {
        console.warn('Vault integrity tag mismatch, trying fallback');
      }
      try {
        return decryptStream(parsed.ct, secret, parsed.iv);
      } catch (err) {
        console.warn('Failed to decrypt stream:', err);
        return payloadStr;
      }
    }
  };

  const VaultStorage = {
    getItem(key) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return VaultCrypto.decrypt(raw);
      } catch (e) {
        return localStorage.getItem(key);
      }
    },
    setItem(key, value) {
      try {
        const enc = VaultCrypto.encrypt(value);
        localStorage.setItem(key, enc);
        updateVaultStatusBadge('saved');
      } catch (e) {
        localStorage.setItem(key, value);
      }
    },
    removeItem(key) {
      localStorage.removeItem(key);
    }
  };

  function updateVaultStatusBadge(state) {
    const pill = document.getElementById('vault-status-pill');
    const txt = document.getElementById('vault-status-text');
    if (!pill || !txt) return;
    if (state === 'saving') {
      pill.classList.add('saving');
      txt.textContent = 'Saving...';
    } else {
      pill.classList.remove('saving');
      txt.textContent = 'Vault Protected';
    }
  }

  // Session & Authentication
  function getActiveSession() {
    let sessionRaw = sessionStorage.getItem(VAULT_SESSION_KEY) || localStorage.getItem(VAULT_SESSION_KEY);
    if (!sessionRaw) return null;
    try {
      const sess = JSON.parse(sessionRaw);
      if (sess && sess.expiresAt && sess.expiresAt > Date.now()) {
        return sess;
      }
    } catch (e) {}
    return null;
  }

  function setActiveSession(user, remember) {
    const timeoutMinutes = parseInt(localStorage.getItem(VAULT_AUTOLOCK_KEY) || '30', 10);
    const durationMs = remember ? (7 * 24 * 60 * 60 * 1000) : (timeoutMinutes > 0 ? timeoutMinutes * 60 * 1000 : 2 * 60 * 60 * 1000);
    const sess = {
      user: user,
      token: 'txs_' + Math.random().toString(36).substr(2) + Date.now().toString(36),
      loginAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      remember: !!remember
    };
    if (remember) {
      localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(sess));
    } else {
      sessionStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(sess));
    }
    return sess;
  }

  function clearActiveSession() {
    sessionStorage.removeItem(VAULT_SESSION_KEY);
    localStorage.removeItem(VAULT_SESSION_KEY);
  }

  let failedAttempts = 0;
  let lockoutUntil = 0;

  function attemptLogin(username, password, remember) {
    const now = Date.now();
    if (now < lockoutUntil) {
      const waitSec = Math.ceil((lockoutUntil - now) / 1000);
      return { success: false, message: `Security cooldown active. Try again in ${waitSec}s.` };
    }

    const creds = getStoredCredentials();
    const inputUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const inputHash = sha256(cleanPass);
    const targetHash = sha256('Admin@87454786');
    const legacyHash = sha256('admin123');

    const isMatch = (inputUser === creds.username.toLowerCase() && inputHash === creds.passwordHash) ||
                    (inputUser === 'admin' && (inputHash === targetHash || inputHash === legacyHash));

    if (isMatch) {
      failedAttempts = 0;
      lockoutUntil = 0;
      // Sync to Admin@87454786 if logging in with new master password or first time
      if (inputHash === targetHash || !localStorage.getItem(VAULT_CREDS_KEY)) {
        saveStoredCredentials('admin', 'Admin@87454786');
      }
      const session = setActiveSession(creds.username || 'admin', remember);
      return { success: true, session: session };
    } else {
      failedAttempts++;
      if (failedAttempts >= 5) {
        lockoutUntil = Date.now() + 60000;
        return { success: false, message: 'Too many incorrect attempts! Security cooldown active for 60 seconds.' };
      }
      return { success: false, message: `Incorrect username or password. (${5 - failedAttempts} attempts remaining)` };
    }
  }

  function checkAuthState() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    const session = getActiveSession();
    if (session) {
      overlay.classList.add('hidden');
      updateSecurityModalInfo();
    } else {
      overlay.classList.remove('hidden');
      const pwdInput = document.getElementById('auth-password');
      if (pwdInput) pwdInput.value = '';
    }
  }

  function lockStudio(reason) {
    clearActiveSession();
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.remove('hidden');
    const errBox = document.getElementById('auth-error-msg');
    if (errBox) {
      if (reason) {
        errBox.textContent = reason;
        errBox.style.display = 'flex';
      } else {
        errBox.style.display = 'none';
      }
    }
    showToast('Invoice Studio locked. Please authenticate.', 'info');
  }

  let lastUserActivity = Date.now();
  function registerActivity() {
    lastUserActivity = Date.now();
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', registerActivity, { passive: true });
    window.addEventListener('keydown', registerActivity, { passive: true });
    window.addEventListener('click', registerActivity, { passive: true });

    setInterval(() => {
      const session = getActiveSession();
      if (!session) return;
      const timeoutMinutes = parseInt(localStorage.getItem(VAULT_AUTOLOCK_KEY) || '30', 10);
      if (timeoutMinutes <= 0) return;
      if (Date.now() - lastUserActivity > timeoutMinutes * 60 * 1000) {
        lockStudio(`Session auto-locked after ${timeoutMinutes} minutes of inactivity.`);
      }
    }, 15000);
  }

  let autoSaveTimeout = null;
  function triggerAutoSave() {
    clearTimeout(autoSaveTimeout);
    updateVaultStatusBadge('saving');
    autoSaveTimeout = setTimeout(() => {
      try {
        if (typeof invoice !== 'undefined') {
          const totals = computeTotals();
          const draft = {
            ...invoice,
            updatedAt: new Date().toISOString(),
            computedTotal: totals.grandTotal
          };
          VaultStorage.setItem('tessux_encrypted_draft', JSON.stringify(draft));
          updateVaultStatusBadge('saved');
        }
      } catch (e) {
        console.warn('Auto-save error:', e);
      }
    }, 1200);
  }

  function updateSecurityModalInfo() {
    const session = getActiveSession();
    const history = getSavedInvoices();
    const countEl = document.getElementById('sec-invoice-count');
    const userEl = document.getElementById('sec-session-user');
    const userInput = document.getElementById('sec-input-username');
    const timeoutSelect = document.getElementById('select-auto-lock-timeout');

    if (countEl) countEl.textContent = `${history.length} records`;
    if (userEl) userEl.textContent = session ? session.user : 'admin';
    if (userInput && session) userInput.value = session.user;
    if (timeoutSelect) {
      timeoutSelect.value = localStorage.getItem(VAULT_AUTOLOCK_KEY) || '30';
    }
  }

  function exportEncryptedVaultPackage() {
    const history = getSavedInvoices();
    const profile = getStoredProfile();
    const payload = {
      appName: 'Tessux Digital Invoice Vault',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      recordCount: history.length,
      history: history,
      companyProfile: profile,
      checksum: sha256(JSON.stringify(history) + JSON.stringify(profile))
    };
    const encryptedText = VaultCrypto.encrypt(JSON.stringify(payload));
    const blob = new Blob([encryptedText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tessux-encrypted-vault-${getTodayString()}.tessux-vault`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Encrypted vault package exported safely!', 'success');
  }

  function importEncryptedVaultPackage(fileContent) {
    try {
      let decrypted = VaultCrypto.decrypt(fileContent);
      let parsed = JSON.parse(decrypted);
      if (!parsed || !parsed.history) {
        throw new Error('Invalid or unreadable backup package.');
      }
      if (Array.isArray(parsed.history)) {
        VaultStorage.setItem('tessux_invoices_history', JSON.stringify(parsed.history));
      }
      if (parsed.companyProfile) {
        VaultStorage.setItem('tessux_company_profile', JSON.stringify(parsed.companyProfile));
      }
      renderApp();
      updateHistoryCountBadge();
      updateSecurityModalInfo();
      showToast(`Successfully restored ${parsed.history ? parsed.history.length : 0} invoices from vault!`, 'success');
    } catch (err) {
      showToast('Failed to decrypt or restore vault: ' + err.message, 'error');
    }
  }

  // --- CURRENCY DEFINITIONS ---
  const CURRENCIES = {
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', format: 'en-IN' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', format: 'en-US' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', format: 'de-DE' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', format: 'en-GB' },
    AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', format: 'en-AE' },
    CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', format: 'en-CA' },
    AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', format: 'en-AU' },
    SGD: { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', format: 'en-SG' }
  };

  // --- AGENCY PRESETS CATEGORIZED BY TESSUX DIGITAL DOMAINS ---
  const SERVICE_DOMAINS = {
    marketing: {
      name: "📈 Digital Marketing",
      items: [
        { title: "Social Media Marketing (SMM) - Monthly Retainer", desc: "Monthly content calendar, 20 bespoke graphics, 8 reels/video shorts, captions, community moderation & weekly analytics review", unitType: "month", qty: 1, rate: 28000, sac: "998315" },
        { title: "Meta & Google Ads Campaign Management", desc: "Full-funnel PPC campaign architecture, audience segmentation, creative A/B testing, pixel conversion tracking & weekly ROAS report", unitType: "month", qty: 1, rate: 35000, sac: "998315" },
        { title: "Search Engine Optimization (SEO) & Content Strategy", desc: "Technical SEO audit, high-intent keyword mapping, on-page optimization, schema markup & high-authority backlink building", unitType: "month", qty: 1, rate: 30000, sac: "998315" },
        { title: "Influencer Marketing & Brand Launch Campaign", desc: "Influencer outreach & contracting, creative brief delivery, sponsored post review & post-campaign reach audit", unitType: "campaign", qty: 1, rate: 50000, sac: "998315" }
      ]
    },
    website: {
      name: "🌐 Website & E-Commerce",
      items: [
        { title: "Custom Corporate Website Development", desc: "Responsive 8-page website, interactive UI/UX Figma system, custom contact forms, CMS setup & fast loading optimization", unitType: "milestone", qty: 1, rate: 55000, sac: "998314" },
        { title: "E-Commerce Web Portal (Shopify / Custom Gateway)", desc: "Product catalogue setup, cart & checkout flow, payment gateway integration (Razorpay/Stripe), automated tax & inventory sync", unitType: "milestone", qty: 1, rate: 85000, sac: "998313" },
        { title: "High-Converting Sales Landing Page & Funnel", desc: "Direct-response copywriting, modern high-contrast layout, lead capture form, analytics integration & Google PageSpeed 95+ score", unitType: "fixed", qty: 1, rate: 22000, sac: "998314" },
        { title: "Annual Website Maintenance & Cloud Hosting", desc: "24/7 uptime monitoring, security firewalls, daily automated backups, SSL renewals & 10 hours monthly content changes", unitType: "year", qty: 1, rate: 36000, sac: "998316" }
      ]
    },
    software: {
      name: "💻 Software & SaaS",
      items: [
        { title: "Custom SaaS / Web Application Architecture", desc: "System architecture, PostgreSQL/MongoDB schema design, multi-tenant database modeling, JWT/OAuth authentication & RBAC", unitType: "milestone", qty: 1, rate: 120000, sac: "998313" },
        { title: "Frontend Admin Dashboard & Client Portal", desc: "Modular React/Next.js interface, interactive data tables, real-time analytics graphs, CSV export & responsive dark/light modes", unitType: "milestone", qty: 1, rate: 75000, sac: "998313" },
        { title: "Backend Microservices & REST / GraphQL APIs", desc: "High-throughput Node.js/Python API endpoints, webhook integrations, Redis caching layer & automated API documentation", unitType: "milestone", qty: 1, rate: 65000, sac: "998313" },
        { title: "DevOps CI/CD Pipeline & Cloud Infrastructure Setup", desc: "Docker containerization, AWS/GCP server orchestration, Nginx reverse proxy, automated GitHub Actions deployment & SSL", unitType: "fixed", qty: 1, rate: 35000, sac: "998316" }
      ]
    },
    apps: {
      name: "📱 Mobile Apps (iOS & Android)",
      items: [
        { title: "Cross-Platform Mobile App (Milestone 1 - MVP)", desc: "Production Flutter / React Native mobile app development, core navigation, secure user authentication & backend API binding", unitType: "milestone", qty: 1, rate: 95000, sac: "998313" },
        { title: "Mobile UI/UX Wireframing & Interactive Prototype", desc: "Complete mobile design kit, component library, interactive touch prototypes, user journey mapping & dev design specs", unitType: "fixed", qty: 1, rate: 32000, sac: "998314" },
        { title: "Push Notifications & In-App Purchases System", desc: "Firebase Cloud Messaging integration, segmented user notification triggers, Apple StoreKit & Google Play billing setup", unitType: "milestone", qty: 1, rate: 28000, sac: "998313" },
        { title: "App Store & Google Play Store Publishing & Approval", desc: "App store metadata optimization, privacy policy compliance, screenshot graphics generation, review submission & launch", unitType: "fixed", qty: 1, rate: 15000, sac: "998313" }
      ]
    },
    events: {
      name: "🎪 Event Planning & Management",
      items: [
        { title: "End-to-End Corporate Event Production & Staging", desc: "Complete venue management, physical stage setup, attendee flow, show running sheet execution & technical crew direction", unitType: "event", qty: 1, rate: 150000, sac: "998596" },
        { title: "Audio-Visual (AV) Technical Setup, Sound & Lighting", desc: "Professional sound system, wireless lapel/handheld mics, stage lighting truss, LED backdrop display & live audio engineer", unitType: "days", qty: 2, rate: 65000, sac: "998596" },
        { title: "Event Branding, 3D Stage Backdrop & Motion Visuals", desc: "Custom 3D stage backdrop design, speaker intro video loops, countdown motion graphics, attendee badges & banner standees", unitType: "fixed", qty: 1, rate: 38000, sac: "998314" },
        { title: "Digital Event Portal, RSVP & QR Code Badge System", desc: "Custom attendee registration website, automatic email confirmation with unique QR check-in pass & on-site mobile check-in app", unitType: "event", qty: 1, rate: 28000, sac: "998313" }
      ]
    }
  };

  // --- UNIT TYPE LABELS ---
  const UNIT_LABELS = {
    fixed: "Fixed Scope",
    milestone: "Milestone",
    month: "Month(s)",
    hours: "Hours",
    days: "Days",
    event: "Event",
    campaign: "Campaign",
    units: "Qty"
  };

  // --- NUMBER TO WORDS ENGINE (INDIAN & INTERNATIONAL) ---
  function numberToWords(amount, currencyCode) {
    if (isNaN(amount) || amount === null || amount === undefined) return '';
    const rounded = Math.round(amount * 100) / 100;
    const parts = rounded.toFixed(2).split('.');
    const num = parseInt(parts[0], 10);
    const paise = parseInt(parts[1], 10);

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertUnderHundred(n) {
      if (n < 20) return ones[n];
      const t = tens[Math.floor(n / 10)];
      const o = ones[n % 10];
      return t + (o ? ' ' + o : '');
    }

    function convertUnderThousand(n) {
      const h = Math.floor(n / 100);
      const r = n % 100;
      let str = '';
      if (h > 0) str += ones[h] + ' Hundred';
      if (r > 0) str += (str ? ' and ' : '') + convertUnderHundred(r);
      return str;
    }

    let words = '';
    if (num === 0) {
      words = 'Zero';
    } else if (currencyCode === 'INR') {
      let rem = num;
      const crore = Math.floor(rem / 10000000);
      rem %= 10000000;
      const lakh = Math.floor(rem / 100000);
      rem %= 100000;
      const thousand = Math.floor(rem / 1000);
      rem %= 1000;
      const hundred = rem;

      const segments = [];
      if (crore > 0) segments.push(convertUnderThousand(crore) + ' Crore');
      if (lakh > 0) segments.push(convertUnderThousand(lakh) + ' Lakh');
      if (thousand > 0) segments.push(convertUnderThousand(thousand) + ' Thousand');
      if (hundred > 0) segments.push(convertUnderThousand(hundred));
      words = segments.join(' ');
    } else {
      let rem = num;
      const billion = Math.floor(rem / 1000000000);
      rem %= 1000000000;
      const million = Math.floor(rem / 1000000);
      rem %= 1000000;
      const thousand = Math.floor(rem / 1000);
      rem %= 1000;
      const hundred = rem;

      const segments = [];
      if (billion > 0) segments.push(convertUnderThousand(billion) + ' Billion');
      if (million > 0) segments.push(convertUnderThousand(million) + ' Million');
      if (thousand > 0) segments.push(convertUnderThousand(thousand) + ' Thousand');
      if (hundred > 0) segments.push(convertUnderThousand(hundred));
      words = segments.join(' ');
    }

    const cur = CURRENCIES[currencyCode] || CURRENCIES.INR;
    let result = words ? words.trim() : 'Zero';

    if (currencyCode === 'INR') {
      result += ' Rupees';
      if (paise > 0) {
        result += ' and ' + convertUnderHundred(paise) + ' Paise';
      }
    } else {
      result += ' ' + (cur.name || currencyCode);
      if (paise > 0) {
        result += ' and ' + convertUnderHundred(paise) + ' Cents';
      }
    }
    result += ' Only';
    return result;
  }

  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  function getDueDateString(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + (daysAhead || 15));
    return d.toISOString().split('T')[0];
  }

  const defaultProfile = {
    name: "TESSUX DIGITAL",
    tagline: "Digital Marketing • Software & Web • Mobile Apps • Events",
    email: "contact@tessuxdigital.com",
    phone: "+91 98765 43210",
    website: "www.tessuxdigital.com",
    address: "Plot 42, Digital Park, Cyber Hills",
    city: "Hyderabad",
    state: "Telangana",
    zip: "500081",
    country: "India",
    gstin: "36ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    bankName: "State Bank Of India",
    accName: "Aditya A B",
    accNumber: "40847230068",
    gpayPhone: "6383258945",
    ifsc: "",
    branch: "",
    swift: "",
    upiId: "6383258945@ybl",
    qrMode: "official",
    qrImage: (typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : "assets/payment-qr.png",
    logo: (typeof window !== 'undefined' && window.TESSUX_DEFAULT_LOGO) ? window.TESSUX_DEFAULT_LOGO : "assets/tessux-logo.jpg",
    signatoryName: "Aditya A B",
    signatoryTitle: "Founder / Director, Tessux Digital",
    notes: "Thank you for partnering with Tessux Digital! We are committed to delivering excellence across all project deliverables.",
    terms: "1. Payment is due within 15 days of invoice date.\n2. Intellectual property and source code rights transfer to client upon full payment clearance.\n3. Third-party ad budgets / cloud infrastructure costs are billed directly to client accounts or funded in advance."
  };

  function getStoredProfile() {
    try {
      const p = VaultStorage.getItem('tessux_company_profile');
      if (p) {
        const parsed = JSON.parse(p);
        // Automatic migration: replace old HDFC placeholder with official State Bank Of India details
        if (!parsed.bankName || parsed.bankName === 'HDFC Bank Ltd' || parsed.bankName === 'HDFC Bank' || parsed.accNumber === '50200089123456') {
          parsed.bankName = "State Bank Of India";
          parsed.accName = "Aditya A B";
          parsed.accNumber = "40847230068";
          parsed.gpayPhone = "6383258945";
          parsed.upiId = "6383258945@ybl";
          parsed.qrMode = "official";
          parsed.qrImage = (typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : "assets/payment-qr.png";
          if (!parsed.signatoryName || parsed.signatoryName === "Authorized Signatory") {
            parsed.signatoryName = "Aditya A B";
          }
          VaultStorage.setItem('tessux_company_profile', JSON.stringify(parsed));
        }
        return { ...defaultProfile, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read stored profile:', e);
    }
    return { ...defaultProfile };
  }

  function getDefaultInvoice() {
    const profile = getStoredProfile();
    try {
      const draftRaw = VaultStorage.getItem('tessux_encrypted_draft');
      if (draftRaw) {
        const parsedDraft = JSON.parse(draftRaw);
        if (parsedDraft && parsedDraft.invoiceNumber && parsedDraft.items && parsedDraft.items.length) {
          return { ...parsedDraft };
        }
      }
    } catch (e) {}
    return {
      id: "inv_" + Date.now(),
      template: "tessux",
      accent: "black",
      invoiceNumber: "TD-2026-001",
      issueDate: getTodayString(),
      dueDate: getDueDateString(15),
      currency: "INR",
      status: "pending",

      // From (Company)
      fromName: profile.name,
      fromTagline: profile.tagline,
      fromEmail: profile.email,
      fromPhone: profile.phone,
      fromWebsite: profile.website,
      fromAddress: profile.address,
      fromCity: profile.city,
      fromState: profile.state,
      fromZip: profile.zip,
      fromCountry: profile.country,
      fromGstin: profile.gstin,
      fromPan: profile.pan,
      fromLogo: profile.logo,

      // Bill To (Client)
      clientName: "Alex Morgan",
      clientCompany: "Apex Media & Tech Solutions",
      clientEmail: "alex@apexmedia.io",
      clientPhone: "+91 91234 56789",
      clientAddress: "Tower B, Level 6, Tech Park",
      clientCity: "Bengaluru",
      clientState: "Karnataka",
      clientZip: "560100",
      clientCountry: "India",
      clientGstin: "29XYZAB5678C1Z2",
      placeOfSupply: "29 - Karnataka",

      // Line Items (Services)
      items: [
        {
          id: "item_1",
          title: "Custom SaaS / Web Application Architecture",
          desc: "Modular database schema, REST API backend, secure JWT authentication & multi-tenant cloud setup",
          sac: "998313",
          unitType: "milestone", // milestone, month, fixed, hours, days, event
          qty: 1,
          rate: 85000,
          discount: 0
        },
        {
          id: "item_2",
          title: "Cross-Platform Mobile App (iOS & Android) - Milestone 1",
          desc: "Flutter app frontend, screen navigation, interactive Figma UI implementation & API integration",
          sac: "998313",
          unitType: "milestone",
          qty: 1,
          rate: 75000,
          discount: 0
        },
        {
          id: "item_3",
          title: "Social Media & Performance Marketing Campaign",
          desc: "Meta & Google Ads management, 20 high-converting creative ad variations, copy & conversion tracking",
          sac: "998315",
          unitType: "month",
          qty: 1,
          rate: 35000,
          discount: 10
        }
      ],

      // GST & SAC Toggles (Disabled by default)
      enableGst: false,
      enableSac: false,

      // Tax & Fees Settings
      taxType: "none", // none, flat, gst-inter, gst-intra
      gstRate: 18,
      flatTaxRate: 18,
      overallDiscountType: "percent",
      overallDiscountValue: 0,
      additionalFeeLabel: "Cloud / Server / Ad Spend Fees",
      shipping: 0,
      roundOff: true,

      // Payment Details
      bankName: profile.bankName || "State Bank Of India",
      accName: profile.accName || "Aditya A B",
      accNumber: profile.accNumber || "40847230068",
      gpayPhone: profile.gpayPhone || "6383258945",
      ifsc: profile.ifsc || "",
      branch: profile.branch || "",
      swift: profile.swift || "",
      upiId: profile.upiId || "6383258945@ybl",
      qrMode: profile.qrMode || "official",
      qrImage: profile.qrImage || ((typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : "assets/payment-qr.png"),
      showUpiQr: true,

      // Notes & Sign
      notes: profile.notes,
      terms: profile.terms,
      signatoryName: profile.signatoryName,
      signatoryTitle: profile.signatoryTitle,
      signImage: ""
    };
  }

  // Active state - Defaults to clean blank invoice for manual data entry
  let invoice = getBlankInvoice();
  let zoomLevel = 1.0;
  let activePresetTab = 'marketing';

  // --- CALCULATION LOGIC ---
  function computeTotals() {
    let subtotal = 0;
    const computedItems = invoice.items.map(item => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const disc = parseFloat(item.discount) || 0;
      const base = qty * rate;
      const itemDiscAmount = base * (disc / 100);
      const total = base - itemDiscAmount;
      subtotal += total;
      return {
        ...item,
        qty,
        rate,
        discount: disc,
        lineTotal: total
      };
    });

    let discountAmount = 0;
    const discVal = parseFloat(invoice.overallDiscountValue) || 0;
    if (invoice.overallDiscountType === 'percent') {
      discountAmount = subtotal * (discVal / 100);
    } else {
      discountAmount = Math.min(discVal, subtotal);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let flatTax = 0;
    let taxTotal = 0;

    if (invoice.enableGst) {
      if (invoice.taxType === 'gst-intra') {
        const halfRate = (parseFloat(invoice.gstRate) || 18) / 2;
        cgst = taxableAmount * (halfRate / 100);
        sgst = taxableAmount * (halfRate / 100);
        taxTotal = cgst + sgst;
      } else if (invoice.taxType === 'gst-inter') {
        const rate = parseFloat(invoice.gstRate) || 18;
        igst = taxableAmount * (rate / 100);
        taxTotal = igst;
      }
    }
    if (invoice.taxType === 'flat') {
      const rate = parseFloat(invoice.flatTaxRate) || 0;
      flatTax = taxableAmount * (rate / 100);
      taxTotal = flatTax;
    }

    const additionalFees = parseFloat(invoice.shipping) || 0;
    const rawTotal = taxableAmount + taxTotal + additionalFees;

    let roundOffAmount = 0;
    let grandTotal = rawTotal;
    if (invoice.roundOff) {
      grandTotal = Math.round(rawTotal);
      roundOffAmount = grandTotal - rawTotal;
    }

    const words = numberToWords(grandTotal, invoice.currency);

    return {
      items: computedItems,
      subtotal,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      flatTax,
      taxTotal,
      additionalFees,
      roundOffAmount,
      grandTotal,
      words
    };
  }

  function formatMoney(amount, currencyCode) {
    const cur = CURRENCIES[currencyCode] || CURRENCIES.INR;
    const val = parseFloat(amount) || 0;
    try {
      return cur.symbol + val.toLocaleString(cur.format, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
      return cur.symbol + val.toFixed(2);
    }
  }

  // --- RENDER FUNCTIONS ---
  function renderApp() {
    renderFormInputs();
    renderPresetCategories();
    renderLineItemsList();
    renderInvoicePreview();
  }

  function renderFormInputs() {
    // Invoice Details & Dates
    setVal('input-inv-num', invoice.invoiceNumber);
    setVal('input-issue-date', invoice.issueDate);
    setVal('input-due-date', invoice.dueDate);
    setVal('input-currency', invoice.currency);
    setVal('input-status', invoice.status);

    // From
    setVal('input-from-name', invoice.fromName);
    setVal('input-from-tagline', invoice.fromTagline);
    setVal('input-from-email', invoice.fromEmail);
    setVal('input-from-phone', invoice.fromPhone);
    setVal('input-from-website', invoice.fromWebsite);
    setVal('input-from-address', invoice.fromAddress);
    setVal('input-from-city', invoice.fromCity);
    setVal('input-from-state', invoice.fromState);
    setVal('input-from-zip', invoice.fromZip);
    setVal('input-from-country', invoice.fromCountry);
    setVal('input-from-gstin', invoice.fromGstin);
    setVal('input-from-pan', invoice.fromPan);

    // Client
    setVal('input-client-name', invoice.clientName);
    setVal('input-client-company', invoice.clientCompany);
    setVal('input-client-email', invoice.clientEmail);
    setVal('input-client-phone', invoice.clientPhone);
    setVal('input-client-address', invoice.clientAddress);
    setVal('input-client-city', invoice.clientCity);
    setVal('input-client-state', invoice.clientState);
    setVal('input-client-zip', invoice.clientZip);
    setVal('input-client-country', invoice.clientCountry);
    setVal('input-client-gstin', invoice.clientGstin);
    setVal('input-client-pos', invoice.placeOfSupply);

    // Tax & Summary controls
    setVal('select-tax-type', invoice.taxType);
    setVal('input-gst-rate', invoice.gstRate);
    setVal('input-flat-rate', invoice.flatTaxRate);
    setVal('select-discount-type', invoice.overallDiscountType);
    setVal('input-discount-val', invoice.overallDiscountValue);
    setVal('input-fee-label', invoice.additionalFeeLabel);
    setVal('input-shipping', invoice.shipping);
    setVal('check-roundoff', invoice.roundOff, true);

    // Payment
    setVal('input-bank-name', invoice.bankName);
    setVal('input-acc-name', invoice.accName);
    setVal('input-acc-num', invoice.accNumber);
    setVal('input-gpay-phone', invoice.gpayPhone || '6383258945');
    setVal('input-ifsc', invoice.ifsc);
    setVal('input-branch', invoice.branch);
    setVal('input-swift', invoice.swift);
    setVal('input-upi-id', invoice.upiId);
    setVal('select-qr-mode', invoice.qrMode || 'official');
    setVal('check-show-upi', invoice.showUpiQr !== false, true);

    const qrThumb = document.getElementById('qr-preview-thumbnail');
    if (qrThumb) {
      qrThumb.src = invoice.qrImage || ((typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : 'assets/payment-qr.png');
    }

    // Notes
    setVal('input-notes', invoice.notes);
    setVal('input-terms', invoice.terms);
    setVal('input-signatory-name', invoice.signatoryName);
    setVal('input-signatory-title', invoice.signatoryTitle);

    // GST & SAC Toggles
    setVal('check-enable-gst', invoice.enableGst, true);
    setVal('check-enable-sac', invoice.enableSac, true);

    const fromGstRow = document.getElementById('from-gst-row');
    const clientGstRow = document.getElementById('client-gst-row');
    if (fromGstRow) fromGstRow.style.display = invoice.enableGst ? 'grid' : 'none';
    if (clientGstRow) clientGstRow.style.display = invoice.enableGst ? 'grid' : 'none';

    document.querySelectorAll('.gst-option').forEach(opt => {
      opt.style.display = invoice.enableGst ? 'block' : 'none';
    });

    // Toggle tax rows
    const gstRow = document.getElementById('gst-rate-row');
    const flatRow = document.getElementById('flat-rate-row');
    if (gstRow) gstRow.style.display = (invoice.enableGst && (invoice.taxType === 'gst-intra' || invoice.taxType === 'gst-inter')) ? 'flex' : 'none';
    if (flatRow) flatRow.style.display = (invoice.taxType === 'flat') ? 'flex' : 'none';

    // Toolbar template & accent
    document.querySelectorAll('.template-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.template === invoice.template);
    });
    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.accent === invoice.accent);
    });
  }

  function setVal(id, val, isCheckbox = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isCheckbox) {
      el.checked = Boolean(val);
    } else {
      el.value = val !== undefined ? val : '';
    }
  }

  // Render Agency Preset Tabs & Buttons
  function renderPresetCategories() {
    const tabsContainer = document.getElementById('preset-category-tabs');
    const pillsContainer = document.getElementById('preset-pills-container');
    if (!tabsContainer || !pillsContainer) return;

    tabsContainer.innerHTML = '';
    Object.keys(SERVICE_DOMAINS).forEach(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `preset-cat-btn ${key === activePresetTab ? 'active' : ''}`;
      btn.textContent = SERVICE_DOMAINS[key].name;
      btn.addEventListener('click', () => {
        activePresetTab = key;
        renderPresetCategories();
      });
      tabsContainer.appendChild(btn);
    });

    pillsContainer.innerHTML = '';
    const currentDomain = SERVICE_DOMAINS[activePresetTab];
    if (currentDomain) {
      currentDomain.items.forEach((p, idx) => {
        const pBtn = document.createElement('button');
        pBtn.type = 'button';
        pBtn.className = 'pill-btn';
        // Remove trailing parentheticals or trailing dashes, without breaking compound words like E-Commerce
        const cleanTitle = p.title.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+-\s+.*$/, '').trim();
        pBtn.innerHTML = `+ ${escapeHtml(cleanTitle)} <span style="opacity:0.75; font-size:0.68rem;">(${UNIT_LABELS[p.unitType] || p.unitType})</span>`;
        pBtn.addEventListener('click', () => {
          invoice.items.push({
            id: "item_" + Date.now(),
            title: p.title,
            desc: p.desc,
            sac: p.sac,
            unitType: p.unitType,
            qty: p.qty,
            rate: p.rate,
            discount: 0
          });
          renderLineItemsList();
          renderInvoicePreview();
          showToast(`Added deliverable: ${p.title}`, 'success');
        });
        pillsContainer.appendChild(pBtn);
      });
    }
  }

  // Render Line items editor in form
  function renderLineItemsList() {
    const container = document.getElementById('line-items-container');
    if (!container) return;

    container.classList.toggle('hide-sac', !invoice.enableSac);
    container.innerHTML = '';
    const cur = CURRENCIES[invoice.currency] || CURRENCIES.INR;

    invoice.items.forEach((item, index) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const disc = parseFloat(item.discount) || 0;
      const lineTotal = (qty * rate) * (1 - disc / 100);

      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-row-top">
          <input type="text" class="input-field item-title-input" placeholder="Service / Deliverable Scope Name" value="${escapeHtml(item.title)}" data-index="${index}" data-field="title" />
          <button type="button" class="btn-remove-item" data-index="${index}" title="Remove Deliverable">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
        <textarea class="textarea-field item-desc-input" placeholder="Deliverable details, milestones, technologies, scope coverage..." data-index="${index}" data-field="desc" rows="2">${escapeHtml(item.desc || '')}</textarea>
        <div class="item-row-grid">
          <div class="item-sac-col">
            <label class="item-field-label">SAC Code</label>
            <input type="text" class="input-field item-sac-input" placeholder="998313" value="${escapeHtml(item.sac || '')}" data-index="${index}" data-field="sac" />
          </div>
          <div class="item-unit-col">
            <label class="item-field-label">Billing Unit</label>
            <select class="select-field item-unittype-select" data-index="${index}" data-field="unitType">
              <option value="fixed" ${item.unitType === 'fixed' ? 'selected' : ''}>Fixed Scope</option>
              <option value="milestone" ${item.unitType === 'milestone' ? 'selected' : ''}>Milestone</option>
              <option value="month" ${item.unitType === 'month' ? 'selected' : ''}>Monthly</option>
              <option value="hours" ${item.unitType === 'hours' ? 'selected' : ''}>Hourly</option>
              <option value="days" ${item.unitType === 'days' ? 'selected' : ''}>Days</option>
              <option value="event" ${item.unitType === 'event' ? 'selected' : ''}>Event</option>
              <option value="campaign" ${item.unitType === 'campaign' ? 'selected' : ''}>Campaign</option>
              <option value="units" ${item.unitType === 'units' ? 'selected' : ''}>Qty Units</option>
            </select>
          </div>
          <div class="item-qty-col">
            <label class="item-field-label">Duration / Qty</label>
            <input type="number" step="any" min="0" class="input-field item-qty-input" value="${item.qty}" data-index="${index}" data-field="qty" />
          </div>
          <div class="item-rate-col">
            <label class="item-field-label">Fee (${cur.symbol})</label>
            <input type="number" step="any" min="0" class="input-field item-rate-input" value="${item.rate}" data-index="${index}" data-field="rate" />
          </div>
          <div class="item-disc-col">
            <label class="item-field-label">Disc %</label>
            <input type="number" step="any" min="0" max="100" class="input-field item-disc-input" value="${item.discount || 0}" data-index="${index}" data-field="discount" />
          </div>
          <div class="item-amount-col">
            <label class="item-field-label" style="text-align:right;">Line Total</label>
            <div class="item-line-total">${formatMoney(lineTotal, invoice.currency)}</div>
          </div>
        </div>
      `;
      container.appendChild(row);
    });

    const totals = computeTotals();
    const subtotalEl = document.getElementById('summary-subtotal');
    const discEl = document.getElementById('summary-discount');
    const taxEl = document.getElementById('summary-tax');
    const totalEl = document.getElementById('summary-total');
    const wordsEl = document.getElementById('summary-words');

    if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal, invoice.currency);
    if (discEl) discEl.textContent = '- ' + formatMoney(totals.discountAmount, invoice.currency);
    if (taxEl) taxEl.textContent = '+ ' + formatMoney(totals.taxTotal, invoice.currency);
    if (totalEl) totalEl.textContent = formatMoney(totals.grandTotal, invoice.currency);
    if (wordsEl) wordsEl.textContent = totals.words;
  }

  function formatUnitDisplay(item) {
    const type = item.unitType || 'fixed';
    const qty = parseFloat(item.qty) || 1;

    switch (type) {
      case 'fixed':
        return '<span class="unit-badge">Fixed Scope</span>';
      case 'milestone':
        return `<span class="unit-badge">Milestone ${qty > 1 ? qty : ''}</span>`;
      case 'month':
        return `<span class="unit-badge">${qty} Month${qty > 1 ? 's' : ''}</span>`;
      case 'hours':
        return `<span class="unit-badge">${qty} Hrs</span>`;
      case 'days':
        return `<span class="unit-badge">${qty} Day${qty > 1 ? 's' : ''}</span>`;
      case 'event':
        return `<span class="unit-badge">${qty} Event</span>`;
      case 'campaign':
        return `<span class="unit-badge">${qty} Campaign</span>`;
      default:
        return `<span class="unit-badge">${qty}</span>`;
    }
  }

  function cleanText(val, fallback = '') {
    if (val === null || val === undefined) return fallback;
    const str = String(val).trim();
    return str.length > 0 ? str : fallback;
  }

  function formatDate(dStr) {
    if (!dStr || !String(dStr).trim()) return '-';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- RENDER LIVE INVOICE PREVIEW ---
  function renderInvoicePreview() {
    const paper = document.getElementById('invoice-paper');
    if (!paper) return;

    const totals = computeTotals();
    const cur = CURRENCIES[invoice.currency] || CURRENCIES.INR;

    paper.className = `invoice-sheet template-${invoice.template} accent-${invoice.accent}`;

    // Stamp
    let stampHtml = '';
    if (invoice.status && invoice.status !== 'draft') {
      const stampClass = invoice.status === 'paid' ? 'stamp-paid' : (invoice.status === 'overdue' ? 'stamp-overdue' : 'stamp-draft');
      stampHtml = `<div class="invoice-stamp visible ${stampClass}">${invoice.status.toUpperCase()}</div>`;
    }

    // Logo
    const hasCustomLogo = !!(invoice.fromLogo && invoice.fromLogo.trim());
    const defaultLogo = (typeof window !== 'undefined' && window.TESSUX_DEFAULT_LOGO) ? window.TESSUX_DEFAULT_LOGO : "assets/tessux-logo.jpg";
    const logoSrc = hasCustomLogo ? invoice.fromLogo.trim() : defaultLogo;
    const logoHtml = logoSrc ? `<img src="${logoSrc}" alt="Tessux Digital Logo" class="inv-logo" />` : '';

    // QR Code (Official PhonePe QR or Dynamic Amount UPI QR)
    let upiQrHtml = '';
    const qrMode = invoice.qrMode || 'official';
    const qrImgSrc = invoice.qrImage || ((typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : "assets/payment-qr.png");

    if (invoice.showUpiQr && qrMode !== 'none') {
      if (qrMode === 'official' && qrImgSrc) {
        upiQrHtml = `
          <div class="qr-container">
            <img src="${qrImgSrc}" alt="PhonePe QR - Aditya A B" style="width:84px; height:84px; object-fit:contain; border-radius:4px; display:block; margin:0 auto 4px auto; background:#fff; border:1px solid #cbd5e1; padding:2px;" />
            <span style="font-size:7pt; color:#475569; font-weight:700;">Scan & Pay via PhonePe / GPay</span>
          </div>
        `;
      } else if (qrMode === 'dynamic' && invoice.upiId && totals.grandTotal > 0) {
        const upiUrl = `upi://pay?pa=${encodeURIComponent(invoice.upiId.trim())}&pn=${encodeURIComponent(invoice.accName || invoice.fromName || 'Aditya A B')}&am=${totals.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoice.invoiceNumber)}`;
        try {
          if (window.QRCodeGenerator && window.QRCodeGenerator.toSVG) {
            const qrSvg = window.QRCodeGenerator.toSVG(upiUrl, 82);
            upiQrHtml = `
              <div class="qr-container">
                ${qrSvg}
                <span>Scan & Pay via UPI</span>
              </div>
            `;
          }
        } catch (err) {
          console.warn('QR Code generation error:', err);
        }
      }
    }

    // Table Headers based on SAC toggle
    const tableHeaderHtml = `
      <thead>
        <tr>
          <th class="th-center" style="width: 32px;">#</th>
          <th>Deliverables & Scope of Work</th>
          ${invoice.enableSac ? '<th class="th-center" style="width: 80px;">SAC</th>' : ''}
          <th class="th-center" style="width: 105px;">Period / Unit</th>
          <th class="th-right" style="width: 90px;">Fee Rate</th>
          <th class="th-right" style="width: 65px;">Disc</th>
          <th class="th-right" style="width: 105px;">Amount (${cur.symbol})</th>
        </tr>
      </thead>
    `;

    // Line items table rows HTML
    let itemsTableRowsHtml = '';
    totals.items.forEach((item, idx) => {
      const itemTitle = cleanText(item.title, '-');
      const itemDesc = cleanText(item.desc);
      const itemSac = cleanText(item.sac, '-');
      const itemDisc = parseFloat(item.discount) || 0;
      const unitDisplay = formatUnitDisplay(item);

      itemsTableRowsHtml += `
        <tr>
          <td class="td-center" style="width: 32px; color: #94a3b8;">${idx + 1}</td>
          <td>
            <div class="item-title">${escapeHtml(itemTitle)}</div>
            ${itemDesc ? `<div class="item-desc">${escapeHtml(itemDesc)}</div>` : ''}
          </td>
          ${invoice.enableSac ? `<td class="td-center item-code" style="width: 80px;">${escapeHtml(itemSac)}</td>` : ''}
          <td class="td-center" style="width: 105px;">${unitDisplay}</td>
          <td class="td-right" style="width: 90px;">${formatMoney(item.rate, invoice.currency)}</td>
          <td class="td-right" style="width: 65px;">${itemDisc > 0 ? itemDisc + '%' : '-'}</td>
          <td class="td-right" style="width: 105px; font-weight:700;">${formatMoney(item.lineTotal, invoice.currency)}</td>
        </tr>
      `;
    });

    // Tax breakdown
    let taxRowsHtml = '';
    if (invoice.enableGst) {
      if (invoice.taxType === 'gst-intra') {
        const halfRate = (parseFloat(invoice.gstRate) || 18) / 2;
        taxRowsHtml += `
          <tr>
            <td class="totals-label">CGST (${halfRate}%):</td>
            <td class="totals-val">${formatMoney(totals.cgst, invoice.currency)}</td>
          </tr>
          <tr>
            <td class="totals-label">SGST (${halfRate}%):</td>
            <td class="totals-val">${formatMoney(totals.sgst, invoice.currency)}</td>
          </tr>
        `;
      } else if (invoice.taxType === 'gst-inter') {
        taxRowsHtml += `
          <tr>
            <td class="totals-label">IGST (${invoice.gstRate}%):</td>
            <td class="totals-val">${formatMoney(totals.igst, invoice.currency)}</td>
          </tr>
        `;
      }
    }
    if (invoice.taxType === 'flat' && totals.flatTax > 0) {
      taxRowsHtml += `
        <tr>
          <td class="totals-label">Tax / VAT (${invoice.flatTaxRate}%):</td>
          <td class="totals-val">${formatMoney(totals.flatTax, invoice.currency)}</td>
        </tr>
      `;
    }

    // Payment block (Only included if at least one payment field or QR is present)
    let paymentBlockHtml = '';
    const bankName = cleanText(invoice.bankName);
    const accHolder = cleanText(invoice.accName);
    const accNum = cleanText(invoice.accNumber);
    const gpayPhone = cleanText(invoice.gpayPhone);
    const ifsc = cleanText(invoice.ifsc);
    const branch = cleanText(invoice.branch);
    const swift = cleanText(invoice.swift);
    const upiId = cleanText(invoice.upiId);

    const hasPayDetails = !!(bankName || accHolder || accNum || gpayPhone || ifsc || swift || upiId || (invoice.showUpiQr && upiQrHtml));

    if (hasPayDetails) {
      paymentBlockHtml = `
        <div class="pay-details">
          <div>
            <div style="font-weight:700; font-size:8.5pt; text-transform:uppercase; color:var(--inv-theme); margin-bottom:5px;">Payment Details:</div>
            ${bankName ? `<div><strong>Bank Name:</strong> ${escapeHtml(bankName)}</div>` : ''}
            ${accHolder ? `<div><strong>Account Holder:</strong> ${escapeHtml(accHolder)}</div>` : ''}
            ${accNum ? `<div><strong>Account No:</strong> <span style="font-family:var(--font-mono); font-weight:700;">${escapeHtml(accNum)}</span></div>` : ''}
            ${gpayPhone ? `<div><strong>Gpay No:</strong> <span style="font-family:var(--font-mono); font-weight:700;">${escapeHtml(gpayPhone)}</span></div>` : ''}
            ${ifsc ? `<div><strong>IFSC:</strong> <span style="font-family:var(--font-mono);">${escapeHtml(ifsc)}</span> ${branch ? `| <strong>Branch:</strong> ${escapeHtml(branch)}` : ''}</div>` : ''}
            ${swift ? `<div><strong>SWIFT:</strong> ${escapeHtml(swift)}</div>` : ''}
            ${upiId ? `<div><strong>UPI ID:</strong> <span style="font-family:var(--font-mono); font-weight:700;">${escapeHtml(upiId)}</span></div>` : ''}
          </div>
          ${upiQrHtml}
        </div>
      `;
    }

    // From Party Details
    const fromName = cleanText(invoice.fromName, '-');
    const fromTagline = cleanText(invoice.fromTagline);
    const fromAddress = cleanText(invoice.fromAddress);
    const fromCityParts = [cleanText(invoice.fromCity), cleanText(invoice.fromState), cleanText(invoice.fromZip)].filter(Boolean);
    const fromCityLine = fromCityParts.join(', ');
    const fromCountry = cleanText(invoice.fromCountry);
    const fromEmail = cleanText(invoice.fromEmail);
    const fromPhone = cleanText(invoice.fromPhone);
    const fromGstin = cleanText(invoice.fromGstin);
    const fromPan = cleanText(invoice.fromPan);

    const fromDetailsHtml = [
      fromAddress ? `<div>${escapeHtml(fromAddress)}</div>` : '',
      fromCityLine ? `<div>${escapeHtml(fromCityLine)}</div>` : '',
      (fromCountry && fromCountry.toLowerCase() !== 'india' && !fromCityLine.toLowerCase().includes(fromCountry.toLowerCase())) ? `<div>${escapeHtml(fromCountry)}</div>` : '',
      fromEmail ? `<div>Email: ${escapeHtml(fromEmail)}</div>` : '',
      fromPhone ? `<div>Phone: ${escapeHtml(fromPhone)}</div>` : '',
      (invoice.enableGst && fromGstin) ? `<div><strong>GSTIN:</strong> ${escapeHtml(fromGstin)}</div>` : '',
      (invoice.enableGst && fromPan) ? `<div><strong>PAN:</strong> ${escapeHtml(fromPan)}</div>` : ''
    ].filter(Boolean).join('');

    // Billed To Party Details
    const clientCompany = cleanText(invoice.clientCompany);
    const clientName = cleanText(invoice.clientName);
    const clientAddress = cleanText(invoice.clientAddress);
    const clientCityParts = [cleanText(invoice.clientCity), cleanText(invoice.clientState), cleanText(invoice.clientZip)].filter(Boolean);
    const clientCityLine = clientCityParts.join(', ');
    const clientCountry = cleanText(invoice.clientCountry);
    const clientEmail = cleanText(invoice.clientEmail);
    const clientPhone = cleanText(invoice.clientPhone);
    const clientGstin = cleanText(invoice.clientGstin);
    const clientPos = cleanText(invoice.placeOfSupply);

    let clientHeading = '-';
    let clientAttn = '';
    if (clientCompany && clientName) {
      clientHeading = clientCompany;
      clientAttn = `<div>Attn: ${escapeHtml(clientName)}</div>`;
    } else if (clientCompany) {
      clientHeading = clientCompany;
    } else if (clientName) {
      clientHeading = clientName;
    } else {
      clientHeading = '-';
    }

    const clientDetailsHtml = [
      clientAttn,
      clientAddress ? `<div>${escapeHtml(clientAddress)}</div>` : '',
      clientCityLine ? `<div>${escapeHtml(clientCityLine)}</div>` : '',
      (clientCountry && clientCountry.toLowerCase() !== 'india' && !clientCityLine.toLowerCase().includes(clientCountry.toLowerCase())) ? `<div>${escapeHtml(clientCountry)}</div>` : '',
      clientEmail ? `<div>Email: ${escapeHtml(clientEmail)}</div>` : '',
      clientPhone ? `<div>Phone: ${escapeHtml(clientPhone)}</div>` : '',
      (invoice.enableGst && clientGstin) ? `<div><strong>GSTIN:</strong> ${escapeHtml(clientGstin)}</div>` : '',
      (invoice.enableGst && clientPos) ? `<div><strong>Place of Supply:</strong> ${escapeHtml(clientPos)}</div>` : ''
    ].filter(Boolean).join('');

    // Notes, Terms & Signature
    const notes = cleanText(invoice.notes);
    const terms = cleanText(invoice.terms);
    const signName = cleanText(invoice.signatoryName);
    const signTitle = cleanText(invoice.signatoryTitle);
    const hasSignature = !!(signName || signTitle || invoice.signImage);

    let notesHtml = '';
    if (notes || terms) {
      notesHtml = `
        <div class="footer-notes">
          ${notes ? `<div style="font-weight:600; margin-bottom:2px; color:#334155;">Note:</div><div>${escapeHtml(notes)}</div>` : ''}
          ${terms ? `<div style="font-weight:600; margin-top:${notes ? '6px' : '0'}; margin-bottom:2px; color:#334155;">Terms & Conditions:</div><div style="white-space:pre-line;">${escapeHtml(terms)}</div>` : ''}
        </div>
      `;
    }

    let signatureHtml = '';
    if (hasSignature) {
      signatureHtml = `
        <div class="signature-area">
          ${invoice.signImage ? `<img src="${invoice.signImage}" alt="Signature" class="sign-img" />` : '<div style="height:44px;"></div>'}
          <div class="sign-line">${signName ? escapeHtml(signName) : '-'}</div>
          ${signTitle ? `<div class="sign-sub">${escapeHtml(signTitle)}</div>` : ''}
        </div>
      `;
    }

    let footerHtml = '';
    if (notesHtml || signatureHtml) {
      footerHtml = `
        <div class="inv-footer">
          ${notesHtml}
          ${signatureHtml}
        </div>
      `;
    }

    // Assemble Full Template HTML
    paper.innerHTML = `
      ${stampHtml}
      
      <!-- HEADER -->
      <div class="inv-header">
        <div class="inv-brand">
          ${logoHtml}
          <div class="inv-brand-text">
            <h2>${escapeHtml(fromName)}</h2>
            ${fromTagline ? `<div class="inv-tagline">${escapeHtml(fromTagline)}</div>` : ''}
          </div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">INVOICE</div>
          <div class="inv-meta-grid">
            <span class="inv-meta-label">Invoice No:</span>
            <span class="inv-meta-val" style="font-family:var(--font-mono);">${escapeHtml(cleanText(invoice.invoiceNumber, '-'))}</span>
            <span class="inv-meta-label">Date:</span>
            <span class="inv-meta-val">${formatDate(invoice.issueDate)}</span>
            ${cleanText(invoice.dueDate) ? `
              <span class="inv-meta-label">Due Date:</span>
              <span class="inv-meta-val">${formatDate(invoice.dueDate)}</span>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- PARTIES: FROM & TO -->
      <div class="inv-parties">
        <div class="party-card">
          <h4>From:</h4>
          <h3>${escapeHtml(fromName)}</h3>
          <div class="party-details">
            ${fromDetailsHtml}
          </div>
        </div>

        <div class="party-card">
          <h4>Billed To:</h4>
          <h3>${escapeHtml(clientHeading)}</h3>
          <div class="party-details">
            ${clientDetailsHtml}
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <table class="inv-table">
        ${tableHeaderHtml}
        <tbody>
          ${itemsTableRowsHtml}
        </tbody>
      </table>

      <!-- BOTTOM: PAYMENT & TOTALS -->
      <div class="inv-bottom">
        <div>
          ${paymentBlockHtml}
          <div class="words-block">
            <strong>Amount in Words:</strong><br/>
            <span>${totals.grandTotal > 0 && totals.words ? escapeHtml(totals.words) : '-'}</span>
          </div>
        </div>

        <div>
          <table class="inv-totals-table">
            <tr>
              <td class="totals-label">Subtotal:</td>
              <td class="totals-val">${formatMoney(totals.subtotal, invoice.currency)}</td>
            </tr>
            ${totals.discountAmount > 0 ? `
              <tr>
                <td class="totals-label">Discount:</td>
                <td class="totals-val" style="color:#ef4444;">-${formatMoney(totals.discountAmount, invoice.currency)}</td>
              </tr>
            ` : ''}
            ${taxRowsHtml}
            ${totals.additionalFees > 0 ? `
              <tr>
                <td class="totals-label">${escapeHtml(invoice.additionalFeeLabel || 'Server / Ad Spend / Venue')}:</td>
                <td class="totals-val">${formatMoney(totals.additionalFees, invoice.currency)}</td>
              </tr>
            ` : ''}
            ${totals.roundOffAmount !== 0 ? `
              <tr>
                <td class="totals-label">Round Off:</td>
                <td class="totals-val">${totals.roundOffAmount > 0 ? '+' : ''}${formatMoney(totals.roundOffAmount, invoice.currency)}</td>
              </tr>
            ` : ''}
            <tr class="grand-total">
              <td class="totals-label">Total Amount:</td>
              <td class="totals-val">${formatMoney(totals.grandTotal, invoice.currency)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- FOOTER -->
      ${footerHtml}
    `;

    triggerAutoSave();
  }

  // --- EVENT LISTENERS & BINDINGS ---
  function setupEventListeners() {
    bindClick('btn-new-invoice', createNewInvoice);
    bindClick('btn-blank-invoice', createNewInvoice);
    bindClick('btn-fill-demo', fillDemoData);
    bindClick('btn-save-invoice', saveCurrentInvoice);
    bindClick('btn-show-history', showHistoryModal);
    bindClick('btn-print', printInvoice);
    bindClick('btn-download-pdf', downloadPdf);
    bindClick('btn-share-whatsapp', shareViaWhatsApp);
    bindClick('btn-share-email', shareViaEmail);
    bindClick('btn-company-settings', openSettingsModal);

    // Expand All / Collapse All buttons
    bindClick('btn-expand-all', () => {
      document.querySelectorAll('.form-card').forEach(card => card.classList.add('open'));
    });
    bindClick('btn-collapse-all', () => {
      document.querySelectorAll('.form-card').forEach(card => card.classList.remove('open'));
    });

    // Accordions
    document.querySelectorAll('.card-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('button, input, select, label, a')) return;
        const card = header.closest('.form-card');
        if (card) {
          card.classList.toggle('open');
        }
      });
    });

    // Invoice Details & Dates inputs
    bindInput('input-inv-num', (val) => { invoice.invoiceNumber = val; renderInvoicePreview(); });
    bindInput('input-issue-date', (val) => { invoice.issueDate = val; renderInvoicePreview(); });
    bindInput('input-due-date', (val) => { invoice.dueDate = val; renderInvoicePreview(); });
    bindInput('input-currency', (val) => { invoice.currency = val; renderLineItemsList(); renderInvoicePreview(); });
    bindInput('input-status', (val) => { invoice.status = val; renderInvoicePreview(); });

    // GST & SAC Toggles
    bindInput('check-enable-gst', (val, e) => {
      invoice.enableGst = e.target.checked;
      if (!invoice.enableGst && (invoice.taxType === 'gst-intra' || invoice.taxType === 'gst-inter')) {
        invoice.taxType = 'none';
      }
      renderFormInputs();
      renderInvoicePreview();
    });

    bindInput('check-enable-sac', (val, e) => {
      invoice.enableSac = e.target.checked;
      renderLineItemsList();
      renderInvoicePreview();
    });

    // Due date pills
    document.querySelectorAll('.pill-due-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const days = parseInt(e.target.dataset.days, 10);
        invoice.dueDate = getDueDateString(days);
        setVal('input-due-date', invoice.dueDate);
        renderInvoicePreview();
      });
    });

    // From
    bindInput('input-from-name', (val) => { invoice.fromName = val; renderInvoicePreview(); });
    bindInput('input-from-tagline', (val) => { invoice.fromTagline = val; renderInvoicePreview(); });
    bindInput('input-from-email', (val) => { invoice.fromEmail = val; renderInvoicePreview(); });
    bindInput('input-from-phone', (val) => { invoice.fromPhone = val; renderInvoicePreview(); });
    bindInput('input-from-website', (val) => { invoice.fromWebsite = val; renderInvoicePreview(); });
    bindInput('input-from-address', (val) => { invoice.fromAddress = val; renderInvoicePreview(); });
    bindInput('input-from-city', (val) => { invoice.fromCity = val; renderInvoicePreview(); });
    bindInput('input-from-state', (val) => { invoice.fromState = val; renderInvoicePreview(); });
    bindInput('input-from-zip', (val) => { invoice.fromZip = val; renderInvoicePreview(); });
    bindInput('input-from-country', (val) => { invoice.fromCountry = val; renderInvoicePreview(); });
    bindInput('input-from-gstin', (val) => { invoice.fromGstin = val; renderInvoicePreview(); });
    bindInput('input-from-pan', (val) => { invoice.fromPan = val; renderInvoicePreview(); });

    // Client
    bindInput('input-client-name', (val) => { invoice.clientName = val; renderInvoicePreview(); });
    bindInput('input-client-company', (val) => { invoice.clientCompany = val; renderInvoicePreview(); });
    bindInput('input-client-email', (val) => { invoice.clientEmail = val; renderInvoicePreview(); });
    bindInput('input-client-phone', (val) => { invoice.clientPhone = val; renderInvoicePreview(); });
    bindInput('input-client-address', (val) => { invoice.clientAddress = val; renderInvoicePreview(); });
    bindInput('input-client-city', (val) => { invoice.clientCity = val; renderInvoicePreview(); });
    bindInput('input-client-state', (val) => { invoice.clientState = val; renderInvoicePreview(); });
    bindInput('input-client-zip', (val) => { invoice.clientZip = val; renderInvoicePreview(); });
    bindInput('input-client-country', (val) => { invoice.clientCountry = val; renderInvoicePreview(); });
    bindInput('input-client-gstin', (val) => { invoice.clientGstin = val; renderInvoicePreview(); });
    bindInput('input-client-pos', (val) => { invoice.placeOfSupply = val; renderInvoicePreview(); });

    // Line items delegation - SMOOTH INPUT WITH ZERO FOCUS LOSS
    const lineItemsContainer = document.getElementById('line-items-container');
    if (lineItemsContainer) {
      const handleItemFieldChange = (e) => {
        const target = e.target;
        const index = parseInt(target.dataset.index, 10);
        const field = target.dataset.field;
        if (isNaN(index) || !invoice.items[index]) return;

        invoice.items[index][field] = target.value;

        // If numeric value changed, update this row's line total without rebuilding DOM
        if (field === 'qty' || field === 'rate' || field === 'discount') {
          const qty = parseFloat(invoice.items[index].qty) || 0;
          const rate = parseFloat(invoice.items[index].rate) || 0;
          const disc = parseFloat(invoice.items[index].discount) || 0;
          const lineTotal = (qty * rate) * (1 - disc / 100);
          const totalDisplay = target.closest('.item-row')?.querySelector('.item-line-total');
          if (totalDisplay) {
            totalDisplay.textContent = formatMoney(lineTotal, invoice.currency);
          }
        }

        // Update bottom totals summary in form
        const totals = computeTotals();
        const subtotalEl = document.getElementById('summary-subtotal');
        const discEl = document.getElementById('summary-discount');
        const taxEl = document.getElementById('summary-tax');
        const totalEl = document.getElementById('summary-total');
        const wordsEl = document.getElementById('summary-words');

        if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal, invoice.currency);
        if (discEl) discEl.textContent = '- ' + formatMoney(totals.discountAmount, invoice.currency);
        if (taxEl) taxEl.textContent = '+ ' + formatMoney(totals.taxTotal, invoice.currency);
        if (totalEl) totalEl.textContent = formatMoney(totals.grandTotal, invoice.currency);
        if (wordsEl) wordsEl.textContent = totals.words;

        // Re-render live invoice sheet preview
        renderInvoicePreview();
      };

      lineItemsContainer.addEventListener('input', handleItemFieldChange);
      lineItemsContainer.addEventListener('change', handleItemFieldChange);

      lineItemsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-remove-item');
        if (btn) {
          const index = parseInt(btn.dataset.index, 10);
          if (invoice.items.length <= 1) {
            showToast('Invoice must have at least one deliverable item', 'error');
            return;
          }
          invoice.items.splice(index, 1);
          renderLineItemsList();
          renderInvoicePreview();
        }
      });
    }

    // Add Deliverable Item
    bindClick('btn-add-item', () => {
      invoice.items.push({
        id: "item_" + Date.now(),
        title: "",
        desc: "",
        sac: "998313",
        unitType: "fixed",
        qty: 1,
        rate: 0,
        discount: 0
      });
      renderLineItemsList();
      renderInvoicePreview();
    });

    // Taxes & Summary
    bindInput('select-tax-type', (val) => {
      invoice.taxType = val;
      renderFormInputs();
      renderLineItemsList();
      renderInvoicePreview();
    });

    bindInput('input-gst-rate', (val) => {
      invoice.gstRate = parseFloat(val) || 0;
      renderLineItemsList();
      renderInvoicePreview();
    });

    bindInput('input-flat-rate', (val) => {
      invoice.flatTaxRate = parseFloat(val) || 0;
      renderLineItemsList();
      renderInvoicePreview();
    });

    bindInput('select-discount-type', (val) => {
      invoice.overallDiscountType = val;
      renderLineItemsList();
      renderInvoicePreview();
    });

    bindInput('input-discount-val', (val) => {
      invoice.overallDiscountValue = parseFloat(val) || 0;
      renderLineItemsList();
      renderInvoicePreview();
    });

    bindInput('input-fee-label', (val) => {
      invoice.additionalFeeLabel = val;
      renderInvoicePreview();
    });

    bindInput('input-shipping', (val) => {
      invoice.shipping = parseFloat(val) || 0;
      renderLineItemsList();
      renderInvoicePreview();
    });

    bindInput('check-roundoff', (val, e) => {
      invoice.roundOff = e.target.checked;
      renderLineItemsList();
      renderInvoicePreview();
    });

    // Payment & UPI
    bindInput('input-bank-name', (val) => { invoice.bankName = val; renderInvoicePreview(); });
    bindInput('input-acc-name', (val) => { invoice.accName = val; renderInvoicePreview(); });
    bindInput('input-acc-num', (val) => { invoice.accNumber = val; renderInvoicePreview(); });
    bindInput('input-gpay-phone', (val) => { invoice.gpayPhone = val; renderInvoicePreview(); });
    bindInput('input-ifsc', (val) => { invoice.ifsc = val; renderInvoicePreview(); });
    bindInput('input-branch', (val) => { invoice.branch = val; renderInvoicePreview(); });
    bindInput('input-swift', (val) => { invoice.swift = val; renderInvoicePreview(); });
    bindInput('input-upi-id', (val) => { invoice.upiId = val; renderInvoicePreview(); });
    bindInput('select-qr-mode', (val) => { invoice.qrMode = val; renderInvoicePreview(); });
    bindInput('check-show-upi', (val, e) => { invoice.showUpiQr = e.target.checked; renderInvoicePreview(); });

    // Custom QR image upload
    const qrUploadInput = document.getElementById('input-qr-file');
    if (qrUploadInput) {
      qrUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (re) => {
          invoice.qrImage = re.target.result;
          invoice.qrMode = 'official';
          setVal('select-qr-mode', 'official');
          const thumb = document.getElementById('qr-preview-thumbnail');
          if (thumb) thumb.src = invoice.qrImage;
          renderInvoicePreview();
          showToast('Custom payment QR code uploaded', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset QR to Official Default
    bindClick('btn-reset-qr', () => {
      invoice.qrImage = (typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : "assets/payment-qr.png";
      invoice.qrMode = 'official';
      setVal('select-qr-mode', 'official');
      const thumb = document.getElementById('qr-preview-thumbnail');
      if (thumb) thumb.src = invoice.qrImage;
      renderInvoicePreview();
      showToast('Reset to official PhonePe QR (Aditya A B)', 'success');
    });

    // Save as Default Bank & QR button
    bindClick('btn-save-bank-default', () => {
      const stored = getStoredProfile();
      stored.bankName = invoice.bankName || "State Bank Of India";
      stored.accName = invoice.accName || "Aditya A B";
      stored.accNumber = invoice.accNumber || "40847230068";
      stored.gpayPhone = invoice.gpayPhone || "6383258945";
      stored.upiId = invoice.upiId || "6383258945@ybl";
      stored.ifsc = invoice.ifsc || "";
      stored.branch = invoice.branch || "";
      stored.swift = invoice.swift || "";
      stored.qrMode = invoice.qrMode || "official";
      stored.qrImage = invoice.qrImage || ((typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : "assets/payment-qr.png");
      VaultStorage.setItem('tessux_company_profile', JSON.stringify(stored));
      showToast('State Bank Of India & PhonePe QR saved as default for all invoices!', 'success');
    });

    // Notes, Terms & Sign
    bindInput('input-notes', (val) => { invoice.notes = val; renderInvoicePreview(); });
    bindInput('input-terms', (val) => { invoice.terms = val; renderInvoicePreview(); });
    bindInput('input-signatory-name', (val) => { invoice.signatoryName = val; renderInvoicePreview(); });
    bindInput('input-signatory-title', (val) => { invoice.signatoryTitle = val; renderInvoicePreview(); });

    // Logo change upload
    const logoUploadInput = document.getElementById('input-logo-file');
    if (logoUploadInput) {
      logoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (re) => {
          invoice.fromLogo = re.target.result;
          renderInvoicePreview();
          showToast('Custom logo uploaded', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    bindClick('btn-reset-logo', () => {
      invoice.fromLogo = (typeof window !== 'undefined' && window.TESSUX_DEFAULT_LOGO) ? window.TESSUX_DEFAULT_LOGO : "assets/tessux-logo.jpg";
      renderInvoicePreview();
      showToast('Reset to Tessux Digital logo', 'success');
    });

    // Save as Profile Default
    bindClick('btn-save-as-default', () => {
      const p = {
        name: invoice.fromName,
        tagline: invoice.fromTagline,
        email: invoice.fromEmail,
        phone: invoice.fromPhone,
        website: invoice.fromWebsite,
        address: invoice.fromAddress,
        city: invoice.fromCity,
        state: invoice.fromState,
        zip: invoice.fromZip,
        country: invoice.fromCountry,
        gstin: invoice.fromGstin,
        pan: invoice.fromPan,
        bankName: invoice.bankName,
        accName: invoice.accName,
        accNumber: invoice.accNumber,
        gpayPhone: invoice.gpayPhone,
        ifsc: invoice.ifsc,
        branch: invoice.branch,
        swift: invoice.swift,
        upiId: invoice.upiId,
        qrMode: invoice.qrMode,
        qrImage: invoice.qrImage,
        logo: invoice.fromLogo,
        signatoryName: invoice.signatoryName,
        signatoryTitle: invoice.signatoryTitle,
        notes: invoice.notes,
        terms: invoice.terms
      };
      VaultStorage.setItem('tessux_company_profile', JSON.stringify(p));
      showToast('Saved as Tessux Digital Default Profile!', 'success');
    });

    // Preview Toolbar: Template Switchers
    document.querySelectorAll('.template-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        invoice.template = btn.dataset.template;
        document.querySelectorAll('.template-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderInvoicePreview();
      });
    });

    // Preview Toolbar: Color Accents
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        invoice.accent = swatch.dataset.accent;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        renderInvoicePreview();
      });
    });

    // Zoom Controls
    bindClick('btn-zoom-in', () => { zoomLevel = Math.min(1.4, zoomLevel + 0.1); updateZoom(); });
    bindClick('btn-zoom-out', () => { zoomLevel = Math.max(0.4, zoomLevel - 0.1); updateZoom(); });
    bindClick('btn-zoom-fit', autoFitInvoicePreview);

    // Responsive Mobile Tab Switcher
    const tabEditor = document.getElementById('btn-tab-editor');
    const tabPreview = document.getElementById('btn-tab-preview');
    const editorPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');

    if (tabEditor && tabPreview && editorPanel && previewPanel) {
      tabEditor.addEventListener('click', () => {
        tabEditor.classList.add('active');
        tabPreview.classList.remove('active');
        editorPanel.classList.remove('mobile-hidden');
        previewPanel.classList.add('mobile-hidden');
      });
      tabPreview.addEventListener('click', () => {
        tabPreview.classList.add('active');
        tabEditor.classList.remove('active');
        previewPanel.classList.remove('mobile-hidden');
        editorPanel.classList.add('mobile-hidden');
        setTimeout(autoFitInvoicePreview, 60);
      });
    }

    // Window Resize Responsive Handler
    window.addEventListener('resize', () => {
      autoFitInvoicePreview();
    });

    // Modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      });
    });
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });

    // Search & Filter History
    const historySearch = document.getElementById('history-search-input');
    if (historySearch) {
      historySearch.addEventListener('input', (e) => {
        renderHistoryList(e.target.value, activeHistoryStatusFilter);
      });
    }

    // Status Filter Tabs
    document.querySelectorAll('#history-status-filters .crud-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#history-status-filters .crud-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeHistoryStatusFilter = btn.dataset.status || 'all';
        const q = document.getElementById('history-search-input')?.value || '';
        renderHistoryList(q, activeHistoryStatusFilter);
      });
    });

    // Modal Create New Invoice button
    bindClick('btn-modal-create-new', () => {
      createNewInvoice();
      document.getElementById('modal-history')?.classList.remove('open');
    });

    // Clear All Invoices button
    bindClick('btn-clear-all-invoices', clearAllInvoices);

    // Export & Import
    bindClick('btn-export-backup', exportAllDataJson);
    const importInput = document.getElementById('input-import-backup');
    if (importInput) {
      importInput.addEventListener('change', importDataJson);
    }

    // --- AUTHENTICATION & LOGIN PAGE EVENT LISTENERS ---
    const authForm = document.getElementById('form-auth-login');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const authErrorBox = document.getElementById('auth-error-msg');

    function handleLoginSubmit() {
      const user = (document.getElementById('auth-username')?.value || '').trim();
      const pass = (document.getElementById('auth-password')?.value || '').trim();
      const rem = document.getElementById('auth-remember')?.checked;

      if (!user || !pass) {
        if (authErrorBox) {
          authErrorBox.textContent = 'Please enter both username and password.';
          authErrorBox.style.display = 'flex';
        }
        return;
      }

      const res = attemptLogin(user, pass, rem);
      if (res.success) {
        if (authErrorBox) authErrorBox.style.display = 'none';
        document.getElementById('auth-overlay')?.classList.add('hidden');
        showToast(`Welcome back, ${res.session.user}! Secure Vault Unlocked.`, 'success');
        updateSecurityModalInfo();
        renderApp();
      } else {
        if (authErrorBox) {
          authErrorBox.textContent = res.message;
          authErrorBox.style.display = 'flex';
        }
      }
    }

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLoginSubmit();
      });
    }
    if (btnAuthSubmit) {
      btnAuthSubmit.addEventListener('click', handleLoginSubmit);
    }

    // Toggle password visibility
    const btnTogglePwd = document.getElementById('btn-toggle-pwd');
    if (btnTogglePwd) {
      btnTogglePwd.addEventListener('click', () => {
        const p = document.getElementById('auth-password');
        if (p) {
          p.type = p.type === 'password' ? 'text' : 'password';
        }
      });
    }

    // Quick-fill admin credentials
    bindClick('btn-auth-quickfill', () => {
      const u = document.getElementById('auth-username');
      const p = document.getElementById('auth-password');
      if (u) u.value = 'admin';
      if (p) p.value = 'Admin@87454786';
      if (authErrorBox) authErrorBox.style.display = 'none';
      lockoutUntil = 0;
      failedAttempts = 0;
      showToast('Admin credentials filled!', 'info');
    });

    // Lock / Logout buttons
    bindClick('btn-app-lock', () => lockStudio());
    bindClick('btn-sec-logout', () => {
      document.getElementById('modal-security')?.classList.remove('open');
      lockStudio();
    });

    // Open Security Modal
    bindClick('btn-open-security', () => {
      updateSecurityModalInfo();
      document.getElementById('modal-security')?.classList.add('open');
    });

    // Change Credentials in Security Modal
    bindClick('btn-save-credentials', () => {
      const newU = (document.getElementById('sec-input-username')?.value || '').trim();
      const oldP = (document.getElementById('sec-input-old-pwd')?.value || '').trim();
      const newP = (document.getElementById('sec-input-new-pwd')?.value || '').trim();

      const creds = getStoredCredentials();
      if (sha256(oldP) !== creds.passwordHash) {
        showToast('Current password is incorrect!', 'error');
        return;
      }
      if (newP.length < 4) {
        showToast('New password must be at least 4 characters.', 'error');
        return;
      }
      saveStoredCredentials(newU || 'admin', newP);
      const oldInput = document.getElementById('sec-input-old-pwd');
      const newInput = document.getElementById('sec-input-new-pwd');
      if (oldInput) oldInput.value = '';
      if (newInput) newInput.value = '';
      showToast('Admin credentials updated securely in vault!', 'success');
      updateSecurityModalInfo();
    });

    // Auto-lock timeout setting
    const selectAutoLock = document.getElementById('select-auto-lock-timeout');
    if (selectAutoLock) {
      selectAutoLock.addEventListener('change', (e) => {
        localStorage.setItem(VAULT_AUTOLOCK_KEY, e.target.value);
        showToast('Auto-lock preference updated', 'success');
      });
    }

    // Export encrypted vault package
    bindClick('btn-export-encrypted-vault', exportEncryptedVaultPackage);

    // Import encrypted vault package
    const inputImportVault = document.getElementById('input-import-encrypted-vault');
    if (inputImportVault) {
      inputImportVault.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (re) => {
          importEncryptedVaultPackage(re.target.result);
        };
        reader.readAsText(file);
      });
    }
  }

  function updateZoom() {
    const wrapper = document.getElementById('invoice-preview-wrapper');
    const label = document.getElementById('zoom-level-text');
    if (wrapper) wrapper.style.transform = `scale(${zoomLevel})`;
    if (label) label.textContent = `${Math.round(zoomLevel * 100)}%`;
  }

  function autoFitInvoicePreview() {
    const container = document.querySelector('.preview-container');
    const wrapper = document.getElementById('invoice-preview-wrapper');
    if (!container || !wrapper) return;
    const availableWidth = container.clientWidth - 40;
    const sheetWidth = 794; // 210mm in pixels (~96 DPI)
    if (availableWidth > 0 && availableWidth < sheetWidth) {
      const scale = Math.max(0.35, Math.min(1.0, availableWidth / sheetWidth));
      zoomLevel = parseFloat(scale.toFixed(2));
    } else {
      zoomLevel = 1.0;
    }
    updateZoom();
  }

  function bindClick(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  function bindInput(id, fn) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => fn(el.value, e));
      el.addEventListener('change', (e) => fn(el.value, e));
    }
  }

  // Actions
  function printInvoice() {
    saveCurrentInvoice(true);
    showToast(`Invoice ${invoice.invoiceNumber} saved! Opening print dialog...`, 'success');
    window.print();
  }

  function downloadPdf() {
    saveCurrentInvoice(true);
    showToast(`Invoice ${invoice.invoiceNumber} saved! Tip: Select "Save as PDF" in the print dialog`, 'success');
    setTimeout(() => {
      window.print();
    }, 350);
  }

  function shareViaWhatsApp() {
    const totals = computeTotals();
    const msg = `*Invoice from Tessux Digital*\n\n` +
      `*Invoice No:* ${invoice.invoiceNumber}\n` +
      `*Client:* ${invoice.clientCompany || invoice.clientName || 'Valued Client'}\n` +
      `*Total Fee:* ${formatMoney(totals.grandTotal, invoice.currency)}\n` +
      `*Due Date:* ${formatDate(invoice.dueDate)}\n` +
      `*Status:* ${invoice.status.toUpperCase()}\n\n` +
      `*Official Payment Details:*\n` +
      `Bank: ${invoice.bankName || 'State Bank Of India'}\n` +
      `Account Holder: ${invoice.accName || 'Aditya A B'}\n` +
      `A/C No: ${invoice.accNumber || '40847230068'}\n` +
      `GPay / PhonePe: ${invoice.gpayPhone || '6383258945'}\n` +
      (invoice.upiId ? `UPI ID: ${invoice.upiId}\n\n` : '\n') +
      `Thank you for partnering with Tessux Digital!`;

    const phoneClean = (invoice.clientPhone || '').replace(/[^0-9]/g, '');
    const url = phoneClean.length >= 10
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  function shareViaEmail() {
    const totals = computeTotals();
    const subject = `Invoice ${invoice.invoiceNumber} - Tessux Digital`;
    const body = `Dear ${invoice.clientName || invoice.clientCompany || 'Client'},\n\n` +
      `Please find attached Invoice ${invoice.invoiceNumber} from Tessux Digital.\n\n` +
      `Due Date: ${formatDate(invoice.dueDate)}\n` +
      `Total Amount: ${formatMoney(totals.grandTotal, invoice.currency)}\n\n` +
      `Payment Details:\n` +
      `Bank Name: ${invoice.bankName || 'State Bank Of India'}\n` +
      `Account Holder: ${invoice.accName || 'Aditya A B'}\n` +
      `Account No: ${invoice.accNumber || '40847230068'}\n` +
      `Gpay / PhonePe No: ${invoice.gpayPhone || '6383258945'}\n` +
      (invoice.upiId ? `UPI ID: ${invoice.upiId}\n` : '') +
      `\nThank you for choosing Tessux Digital!\n\nBest regards,\nTessux Digital Team\n${invoice.fromWebsite || ''}`;

    const mailto = `mailto:${encodeURIComponent(invoice.clientEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  function getBlankInvoice() {
    const profile = getStoredProfile();
    return {
      id: "inv_" + Date.now(),
      template: "tessux",
      accent: "black",
      invoiceNumber: getNextInvoiceNumber(),
      issueDate: getTodayString(),
      dueDate: getDueDateString(15),
      currency: "INR",
      status: "pending",

      // From (Your Agency - Tessux Digital)
      fromName: profile.name,
      fromTagline: profile.tagline,
      fromEmail: profile.email,
      fromPhone: profile.phone,
      fromWebsite: profile.website,
      fromAddress: profile.address,
      fromCity: profile.city,
      fromState: profile.state,
      fromZip: profile.zip,
      fromCountry: profile.country,
      fromGstin: profile.gstin,
      fromPan: profile.pan,
      fromLogo: profile.logo,

      // Bill To (Client - Clean Blank for manual entry)
      clientName: "",
      clientCompany: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      clientCity: "",
      clientState: "",
      clientZip: "",
      clientCountry: "India",
      clientGstin: "",
      placeOfSupply: "",

      // Line Items (1 Clean Blank Row to start typing immediately)
      items: [
        {
          id: "item_1",
          title: "",
          desc: "",
          sac: "998313",
          unitType: "fixed",
          qty: 1,
          rate: 0,
          discount: 0
        }
      ],

      // GST & SAC Toggles (Disabled by default)
      enableGst: false,
      enableSac: false,

      // Tax & Fees Settings
      taxType: "none",
      gstRate: 18,
      flatTaxRate: 18,
      overallDiscountType: "percent",
      overallDiscountValue: 0,
      additionalFeeLabel: "Cloud / Server / Ad Spend Fees",
      shipping: 0,
      roundOff: true,

      // Payment Details
      bankName: profile.bankName || "State Bank Of India",
      accName: profile.accName || "Aditya A B",
      accNumber: profile.accNumber || "40847230068",
      gpayPhone: profile.gpayPhone || "6383258945",
      ifsc: profile.ifsc || "",
      branch: profile.branch || "",
      swift: profile.swift || "",
      upiId: profile.upiId || "6383258945@ybl",
      qrMode: profile.qrMode || "official",
      qrImage: profile.qrImage || ((typeof window !== 'undefined' && window.TESSUX_DEFAULT_QR_BASE64) ? window.TESSUX_DEFAULT_QR_BASE64 : "assets/payment-qr.png"),
      showUpiQr: true,

      // Notes & Sign
      notes: profile.notes,
      terms: profile.terms,
      signatoryName: profile.signatoryName,
      signatoryTitle: profile.signatoryTitle,
      signImage: ""
    };
  }

  function createNewInvoice() {
    if (!confirm('Start a fresh blank invoice? All fields will be cleared for your own custom entry.')) return;
    VaultStorage.removeItem('tessux_encrypted_draft');
    invoice = getBlankInvoice();
    renderApp();
    showToast(`Fresh blank invoice ${invoice.invoiceNumber} ready for your input!`, 'success');
  }

  function fillDemoData() {
    VaultStorage.removeItem('tessux_encrypted_draft');
    invoice = getDefaultInvoice();
    renderApp();
    showToast('Loaded agency demo deliverables & scope data', 'success');
  }

  function getNextInvoiceNumber() {
    const history = getSavedInvoices();
    if (!history.length) return "TD-2026-001";
    let maxNum = 1;
    history.forEach(item => {
      const match = (item.invoiceNumber || '').match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `TD-2026-${String(maxNum + 1).padStart(3, '0')}`;
  }

  function getSavedInvoices() {
    try {
      const raw = VaultStorage.getItem('tessux_invoices_history');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading saved invoices:', e);
    }
    return [];
  }

  function saveCurrentInvoice(silent = false) {
    const history = getSavedInvoices();
    const totals = computeTotals();
    const existingIndex = history.findIndex(h => h.id === invoice.id || h.invoiceNumber === invoice.invoiceNumber);

    const invoiceSnapshot = {
      ...invoice,
      updatedAt: new Date().toISOString(),
      computedTotal: totals.grandTotal
    };

    if (existingIndex >= 0) {
      history[existingIndex] = invoiceSnapshot;
    } else {
      history.unshift(invoiceSnapshot);
    }

    VaultStorage.setItem('tessux_invoices_history', JSON.stringify(history));
    updateHistoryCountBadge();
    if (!silent) {
      showToast(`Invoice ${invoice.invoiceNumber} securely saved to encrypted vault!`, 'success');
    }
  }

  function updateHistoryCountBadge() {
    const history = getSavedInvoices();
    const badge = document.getElementById('saved-count-badge');
    if (badge) badge.textContent = history.length;
  }

  let activeHistoryStatusFilter = 'all';

  function showHistoryModal() {
    const modal = document.getElementById('modal-history');
    if (!modal) return;
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) searchInput.value = '';
    activeHistoryStatusFilter = 'all';
    document.querySelectorAll('#history-status-filters .crud-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === 'all');
    });
    renderHistoryList('', 'all');
    modal.classList.add('open');
  }

  function renderHistoryKPI() {
    const kpiEl = document.getElementById('history-kpi-summary');
    if (!kpiEl) return;
    const history = getSavedInvoices();
    const totalCount = history.length;
    let paidSum = 0;
    let pendingSum = 0;
    let overdueCount = 0;
    const today = getTodayString();

    history.forEach(inv => {
      const tot = parseFloat(inv.computedTotal) || 0;
      const st = (inv.status || 'draft').toLowerCase();
      if (st === 'paid') {
        paidSum += tot;
      } else if (st === 'pending') {
        pendingSum += tot;
        if (inv.dueDate && inv.dueDate < today) {
          overdueCount++;
        }
      } else if (st === 'overdue') {
        pendingSum += tot;
        overdueCount++;
      }
    });

    kpiEl.innerHTML = `
      <div class="crud-kpi-card">
        <span class="kpi-label">Total Invoices</span>
        <span class="kpi-value">${totalCount}</span>
      </div>
      <div class="crud-kpi-card kpi-paid">
        <span class="kpi-label">Paid Revenue</span>
        <span class="kpi-value">${formatMoney(paidSum, 'INR')}</span>
      </div>
      <div class="crud-kpi-card kpi-pending">
        <span class="kpi-label">Pending Due</span>
        <span class="kpi-value">${formatMoney(pendingSum, 'INR')}</span>
      </div>
      <div class="crud-kpi-card" style="border-color:${overdueCount > 0 ? '#ef4444' : '#334155'};">
        <span class="kpi-label" style="color:${overdueCount > 0 ? '#f87171' : '#94a3b8'};">Overdue Count</span>
        <span class="kpi-value" style="color:${overdueCount > 0 ? '#ef4444' : '#94a3b8'};">${overdueCount}</span>
      </div>
    `;
  }

  function renderHistoryList(filterText, statusFilter = activeHistoryStatusFilter) {
    const listEl = document.getElementById('history-items-list');
    if (!listEl) return;
    renderHistoryKPI();
    const history = getSavedInvoices();
    listEl.innerHTML = '';

    const q = (filterText || '').toLowerCase().trim();
    const stFilter = (statusFilter || 'all').toLowerCase();
    const today = getTodayString();

    const filtered = history.filter(inv => {
      const st = (inv.status || 'draft').toLowerCase();
      const isOverdue = st === 'overdue' || (st === 'pending' && inv.dueDate && inv.dueDate < today);

      if (stFilter === 'pending' && st !== 'pending') return false;
      if (stFilter === 'paid' && st !== 'paid') return false;
      if (stFilter === 'overdue' && !isOverdue) return false;
      if (stFilter === 'draft' && st !== 'draft') return false;

      if (!q) return true;
      return (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.clientName || '').toLowerCase().includes(q) ||
        (inv.clientCompany || '').toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:36px 16px; color:var(--text-dim); background:#0b1120; border-radius:var(--radius-sm); border:1px dashed #334155;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36" style="margin:0 auto 10px auto; color:#64748b; display:block;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p style="font-weight:600; color:#e2e8f0; margin-bottom:4px;">No Invoices Found</p>
          <p style="font-size:0.78rem;">${q || stFilter !== 'all' ? 'Try adjusting your search query or status filter.' : 'Click "+ New Invoice" or "Save" on the top bar to record invoices.'}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'crud-invoice-card';
      const curStatus = (item.status || 'draft').toLowerCase();
      const nextToggleStatus = curStatus === 'paid' ? 'pending' : 'paid';
      const toggleLabel = curStatus === 'paid' ? 'Mark Pending' : 'Mark Paid ✓';
      const isOverdue = curStatus === 'pending' && item.dueDate && item.dueDate < today;

      card.innerHTML = `
        <div class="crud-card-top">
          <div class="crud-card-id-block">
            <span class="crud-inv-num">${escapeHtml(item.invoiceNumber || 'TD-DRAFT')}</span>
            <span class="badge badge-${curStatus}">${curStatus.toUpperCase()}</span>
            ${isOverdue ? '<span class="badge badge-overdue" style="background:#ef4444; color:#fff;">OVERDUE</span>' : ''}
          </div>
          <div class="crud-inv-total">${formatMoney(item.computedTotal || 0, item.currency || 'INR')}</div>
        </div>

        <div class="crud-card-mid">
          <div class="crud-client-name">
            <strong>${escapeHtml(item.clientCompany || item.clientName || 'Unnamed Client')}</strong>
            ${item.clientCompany && item.clientName ? `<span class="crud-contact-sub">(${escapeHtml(item.clientName)})</span>` : ''}
          </div>
        </div>

        <div class="crud-card-meta">
          <span>📅 Date: <strong>${formatDate(item.issueDate)}</strong></span>
          <span>⏰ Due: <strong>${formatDate(item.dueDate)}</strong></span>
          <span>💼 Items: <strong>${item.items ? item.items.length : 0}</strong></span>
        </div>

        <div class="crud-card-actions">
          <button type="button" class="btn btn-primary btn-sm btn-load-inv" data-id="${item.id}" title="Edit this invoice in the studio">
            ✏️ Edit
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-quick-status-inv" data-id="${item.id}" data-target-status="${nextToggleStatus}" title="Toggle between Paid and Pending">
            ${toggleLabel}
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-print-direct-inv" data-id="${item.id}" title="Load and open Print/PDF dialog">
            🖨️ Print/PDF
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-dup-inv" data-id="${item.id}" title="Clone as a new invoice with next number">
            📋 Clone
          </button>
          <button type="button" class="btn btn-danger btn-sm btn-del-inv" data-id="${item.id}" title="Delete this invoice permanently" style="margin-left:auto;">
            🗑️ Delete
          </button>
        </div>
      `;
      listEl.appendChild(card);
    });

    // 1. Edit / Load
    listEl.querySelectorAll('.btn-load-inv').forEach(b => {
      b.addEventListener('click', () => {
        const target = history.find(h => h.id === b.dataset.id);
        if (target) {
          invoice = { ...target };
          renderApp();
          document.getElementById('modal-history')?.classList.remove('open');
          showToast(`Loaded invoice ${invoice.invoiceNumber} for editing`, 'success');
        }
      });
    });

    // 2. Quick Status Toggle
    listEl.querySelectorAll('.btn-quick-status-inv').forEach(b => {
      b.addEventListener('click', () => {
        const targetId = b.dataset.id;
        const newStatus = b.dataset.targetStatus;
        const all = getSavedInvoices();
        const targetIndex = all.findIndex(h => h.id === targetId);
        if (targetIndex >= 0) {
          all[targetIndex].status = newStatus;
          all[targetIndex].updatedAt = new Date().toISOString();
          VaultStorage.setItem('tessux_invoices_history', JSON.stringify(all));
          if (invoice.id === targetId) {
            invoice.status = newStatus;
            setVal('input-status', newStatus);
            renderInvoicePreview();
          }
          renderHistoryList(document.getElementById('history-search-input')?.value || '', activeHistoryStatusFilter);
          showToast(`Invoice ${all[targetIndex].invoiceNumber} marked as ${newStatus.toUpperCase()}`, 'success');
        }
      });
    });

    // 3. Print / PDF Direct
    listEl.querySelectorAll('.btn-print-direct-inv').forEach(b => {
      b.addEventListener('click', () => {
        const target = history.find(h => h.id === b.dataset.id);
        if (target) {
          invoice = { ...target };
          renderApp();
          document.getElementById('modal-history')?.classList.remove('open');
          setTimeout(() => {
            printInvoice();
          }, 350);
        }
      });
    });

    // 4. Clone / Duplicate
    listEl.querySelectorAll('.btn-dup-inv').forEach(b => {
      b.addEventListener('click', () => {
        const target = history.find(h => h.id === b.dataset.id);
        if (target) {
          const nextNum = getNextInvoiceNumber();
          invoice = {
            ...target,
            id: "inv_" + Date.now(),
            invoiceNumber: nextNum,
            issueDate: getTodayString(),
            dueDate: getDueDateString(15),
            status: "draft"
          };
          saveCurrentInvoice(true);
          renderApp();
          renderHistoryList(document.getElementById('history-search-input')?.value || '', activeHistoryStatusFilter);
          document.getElementById('modal-history')?.classList.remove('open');
          showToast(`Cloned into new invoice ${nextNum}!`, 'success');
        }
      });
    });

    // 5. Delete Single Invoice
    listEl.querySelectorAll('.btn-del-inv').forEach(b => {
      b.addEventListener('click', () => {
        const targetId = b.dataset.id;
        const target = history.find(h => h.id === targetId);
        const name = target ? target.invoiceNumber : 'this invoice';
        if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
        const updated = history.filter(h => h.id !== targetId);
        VaultStorage.setItem('tessux_invoices_history', JSON.stringify(updated));
        updateHistoryCountBadge();
        renderHistoryList(document.getElementById('history-search-input')?.value || '', activeHistoryStatusFilter);
        showToast(`Invoice ${name} deleted`, 'info');
      });
    });
  }

  function clearAllInvoices() {
    const history = getSavedInvoices();
    if (!history.length) {
      showToast('No invoices stored to clear', 'info');
      return;
    }
    if (!confirm(`⚠️ DANGER: Delete all ${history.length} saved invoices? This cannot be undone.`)) return;
    VaultStorage.removeItem('tessux_invoices_history');
    updateHistoryCountBadge();
    renderHistoryList('', activeHistoryStatusFilter);
    showToast('All saved invoices cleared', 'info');
  }

  function openSettingsModal() {
    const modal = document.getElementById('modal-settings');
    if (modal) modal.classList.add('open');
  }

  function exportAllDataJson() {
    const data = {
      version: "1.1",
      companyProfile: getStoredProfile(),
      history: getSavedInvoices(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tessux-agency-invoices-backup-${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Invoices backup exported!', 'success');
  }

  function importDataJson(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const data = JSON.parse(re.target.result);
        if (data.history && Array.isArray(data.history)) {
          VaultStorage.setItem('tessux_invoices_history', JSON.stringify(data.history));
        }
        if (data.companyProfile) {
          VaultStorage.setItem('tessux_company_profile', JSON.stringify(data.companyProfile));
        }
        updateHistoryCountBadge();
        renderHistoryList('');
        showToast('Backup restored successfully!', 'success');
      } catch (err) {
        showToast('Failed to import JSON: Invalid format', 'error');
      }
    };
    reader.readAsText(file);
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function init() {
    setupEventListeners();
    updateHistoryCountBadge();
    renderApp();
    setTimeout(autoFitInvoicePreview, 80);
    checkAuthState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
