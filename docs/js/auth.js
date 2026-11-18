/**
 * LUXORA — Demo Authentication & Customer Account Management
 * 
 * Features:
 * - Client-side demo account registration & login
 * - Safe client-side SHA-256 password hashing with unique salt (No plaintext storage)
 * - Session persistence via localStorage (Remember Me) or sessionStorage
 * - Dynamic header account trigger & user dropdown menu
 * - Customer Account Dashboard with Profile and Order History
 * - Checkout integration: Associates completed orders with logged-in accounts
 * 
 * NOTE FOR EVALUATION:
 * This is a frontend demonstration project for InternCircle Task 5.
 * Seed demo credentials:
 *   Email:    demo@luxora.com
 *   Password: Password123
 */

(function () {
  'use strict';

  // Storage Keys
  const USERS_STORAGE_KEY = 'luxora_demo_users';
  const CURRENT_USER_KEY = 'luxora_current_user';
  const ORDERS_STORAGE_KEY = 'luxora_demo_orders';

  // ==========================================================================
  // Cryptographic Helper (Client-side Salted SHA-256 Hash)
  // ==========================================================================
  async function sha256(text) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Simple fallback hash for older or non-crypto test environments
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return 'fallback_' + Math.abs(hash).toString(16);
    }
  }

  function generateSalt() {
    return Math.random().toString(36).substring(2, 10);
  }

  // ==========================================================================
  // Storage & Seed Initialization
  // ==========================================================================
  function getUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[LUXORA Auth] Failed to read users from storage:', e);
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('[LUXORA Auth] Failed to save users to storage:', e);
    }
  }

  // Seed default demo user if storage is empty
  async function seedDefaultUser() {
    const users = getUsers();
    const demoEmail = 'demo@luxora.com';
    const exists = users.some(u => u.email.toLowerCase() === demoEmail.toLowerCase());

    if (!exists) {
      const salt = 'luxora_salt_99';
      const hash = await sha256('Password123' + salt);
      users.push({
        id: 'usr_demo_101',
        name: 'Aanya Sharma',
        email: demoEmail,
        salt: salt,
        passwordHash: hash,
        phone: '+91 98765 43210',
        address: 'Penthouse 14, Altamount Road, Mumbai',
        city: 'Mumbai',
        pincode: '400026',
        createdAt: '17 Nov 2026'
      });
      saveUsers(users);
    }
  }

  // Current User Session
  function getCurrentUser() {
    try {
      // Check localStorage first (Remember Me), then sessionStorage
      const local = localStorage.getItem(CURRENT_USER_KEY);
      if (local) return JSON.parse(local);
      const session = sessionStorage.getItem(CURRENT_USER_KEY);
      if (session) return JSON.parse(session);
    } catch (e) {
      console.warn('[LUXORA Auth] Failed to get session user:', e);
    }
    return null;
  }

  function setCurrentUser(user, rememberMe = true) {
    try {
      if (!user) {
        localStorage.removeItem(CURRENT_USER_KEY);
        sessionStorage.removeItem(CURRENT_USER_KEY);
      } else {
        const payload = JSON.stringify(user);
        if (rememberMe) {
          localStorage.setItem(CURRENT_USER_KEY, payload);
          sessionStorage.removeItem(CURRENT_USER_KEY);
        } else {
          sessionStorage.setItem(CURRENT_USER_KEY, payload);
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      }
    } catch (e) {
      console.error('[LUXORA Auth] Failed to persist session user:', e);
    }
  }

  // Orders Storage
  function getAllOrders() {
    try {
      const data = localStorage.getItem(ORDERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[LUXORA Auth] Failed to read orders:', e);
      return [];
    }
  }

  function saveCompletedOrder(order) {
    try {
      const orders = getAllOrders();
      orders.unshift(order); // Add to beginning
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('[LUXORA Auth] Failed to save completed order:', e);
    }
  }

  function getUserOrders(userId) {
    const orders = getAllOrders();
    if (!userId || userId === 'guest') return [];
    return orders.filter(o => o.userId === userId);
  }

  // ==========================================================================
  // Auth Business Logic: Register, Login, Logout
  // ==========================================================================
  async function registerUser({ name, email, password }) {
    const users = getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'This email address is already registered. Please sign in.' };
    }

    const salt = generateSalt();
    const passwordHash = await sha256(password + salt);
    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      name: name.trim(),
      email: cleanEmail,
      salt: salt,
      passwordHash: passwordHash,
      createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login newly registered user
    const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    setCurrentUser(sessionUser, true);
    updateHeaderUI();

    return { success: true, user: sessionUser };
  }

  async function loginUser(email, password, rememberMe = true) {
    const users = getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Invalid email or password. Please verify credentials.' };
    }

    const testHash = await sha256(password + user.salt);
    if (testHash !== user.passwordHash) {
      return { success: false, message: 'Invalid email or password. Please verify credentials.' };
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email };
    setCurrentUser(sessionUser, rememberMe);
    updateHeaderUI();

    return { success: true, user: sessionUser };
  }

  function logoutUser() {
    setCurrentUser(null);
    updateHeaderUI();
    if (window.showToast) {
      window.showToast('You have been signed out from the Maison.');
    }
  }

  // ==========================================================================
  // UI Presentations: Navigation Header & Dropdown
  // ==========================================================================
  function updateHeaderUI() {
    const user = getCurrentUser();
    const accountBtn = document.getElementById('account-toggle-btn');
    const accountUserLabel = document.getElementById('account-user-label');
    const accountDropdown = document.getElementById('account-dropdown');
    const mobileAccountItem = document.getElementById('mobile-nav-account-item');

    if (!accountBtn) return;

    if (user) {
      // User is logged in
      const firstName = user.name.split(' ')[0];
      if (accountUserLabel) accountUserLabel.textContent = firstName;
      accountBtn.classList.add('logged-in');
      accountBtn.setAttribute('aria-expanded', 'false');

      // Update mobile menu
      if (mobileAccountItem) {
        mobileAccountItem.innerHTML = `
          <button type="button" class="mobile-account-link" id="mobile-open-dashboard-btn">
            <span>👤 ${user.name}</span>
            <span class="mobile-sub-badge">Client Privilège</span>
          </button>
          <button type="button" class="mobile-logout-link" id="mobile-logout-btn">Sign Out</button>
        `;
        const mDash = document.getElementById('mobile-open-dashboard-btn');
        const mLogout = document.getElementById('mobile-logout-btn');
        if (mDash) mDash.addEventListener('click', openAccountModal);
        if (mLogout) mLogout.addEventListener('click', logoutUser);
      }
    } else {
      // Guest state
      if (accountUserLabel) accountUserLabel.textContent = 'Sign In';
      accountBtn.classList.remove('logged-in');
      accountBtn.setAttribute('aria-expanded', 'false');

      if (mobileAccountItem) {
        mobileAccountItem.innerHTML = `
          <button type="button" class="mobile-account-link" id="mobile-open-login-btn">
            <span>👤 Sign In / Register</span>
          </button>
        `;
        const mLogin = document.getElementById('mobile-open-login-btn');
        if (mLogin) mLogin.addEventListener('click', () => openAuthModal('login'));
      }
    }
  }

  // ==========================================================================
  // Auth Dialog Controller (Login & Register Tabs)
  // ==========================================================================
  const authDialog = document.getElementById('auth-dialog');
  const accountDialog = document.getElementById('account-dialog');

  function openAuthModal(initialTab = 'login') {
    if (!authDialog) return;
    switchAuthTab(initialTab);
    clearAuthErrors();
    authDialog.showModal();
  }

  function closeAuthModal() {
    if (authDialog) authDialog.close();
  }

  function switchAuthTab(tab) {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const formLogin = document.getElementById('login-form');
    const formSignup = document.getElementById('signup-form');
    const modalTitle = document.getElementById('auth-modal-title');

    clearAuthErrors();

    if (tab === 'login') {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabSignup) tabSignup.classList.remove('active');
      if (formLogin) formLogin.style.display = 'flex';
      if (formSignup) formSignup.style.display = 'none';
      if (modalTitle) modalTitle.textContent = 'Client Sign In';
    } else {
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabSignup) tabSignup.classList.add('active');
      if (formLogin) formLogin.style.display = 'none';
      if (formSignup) formSignup.style.display = 'flex';
      if (modalTitle) modalTitle.textContent = 'Create Atelier Account';
    }
  }

  function clearAuthErrors() {
    document.querySelectorAll('.auth-field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.auth-banner-error').forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });
    document.querySelectorAll('.auth-form input').forEach(el => el.classList.remove('input-error'));
  }

  // Toggle Password Visibility Helper
  function setupPasswordToggle(inputId, toggleBtnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(toggleBtnId);
    if (!input || !btn) return;

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      btn.classList.toggle('visible', isPassword);
    });
  }

  // ==========================================================================
  // Account Dashboard Modal & Order History
  // ==========================================================================
  function openAccountModal() {
    const user = getCurrentUser();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!accountDialog) return;

    // Populate Patron Welcome Info
    const avatarEl = document.getElementById('account-avatar-initials');
    const nameEl = document.getElementById('account-welcome-name');
    const emailEl = document.getElementById('account-profile-email');
    const profileNameEl = document.getElementById('account-profile-name');
    const memberSinceEl = document.getElementById('account-profile-since');

    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (profileNameEl) profileNameEl.textContent = user.name;
    
    // Find registered user for member date
    const users = getUsers();
    const fullUser = users.find(u => u.id === user.id);
    if (memberSinceEl) memberSinceEl.textContent = (fullUser && fullUser.createdAt) ? fullUser.createdAt : 'Autumn 2026';

    // Render Order History
    renderAccountOrders(user.id);

    accountDialog.showModal();
  }

  function closeAccountModal() {
    if (accountDialog) accountDialog.close();
  }

  function renderAccountOrders(userId) {
    const ordersContainer = document.getElementById('account-orders-list');
    const emptyOrdersView = document.getElementById('account-empty-orders');
    if (!ordersContainer) return;

    const orders = getUserOrders(userId);

    if (orders.length === 0) {
      if (emptyOrdersView) emptyOrdersView.style.display = 'flex';
      ordersContainer.style.display = 'none';
      ordersContainer.innerHTML = '';
      return;
    }

    if (emptyOrdersView) emptyOrdersView.style.display = 'none';
    ordersContainer.style.display = 'flex';

    ordersContainer.innerHTML = orders.map(order => {
      const itemsHtml = order.items.map(item => `
        <div class="account-order-item">
          <img src="${item.image}" alt="${item.name}" class="order-item-thumb">
          <div class="order-item-info">
            <span class="order-item-title">${item.name}</span>
            <span class="order-item-qty">${item.quantity}x &bull; ${Number(item.price).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="account-order-card">
          <div class="order-card-header">
            <div>
              <span class="order-card-ref">${order.id}</span>
              <span class="order-card-date">&bull; ${order.date}</span>
            </div>
            <span class="order-status-badge">${order.status || 'Confirmed & In Curation'}</span>
          </div>

          <div class="order-card-body">
            <div class="order-items-scroll">
              ${itemsHtml}
            </div>
            <div class="order-card-meta">
              <div class="meta-row">
                <span>Payment:</span>
                <strong>${order.paymentMethodLabel || order.paymentMethod}</strong>
              </div>
              <div class="meta-row">
                <span>Shipping Destination:</span>
                <span class="meta-dest">${order.address}</span>
              </div>
              <div class="meta-row total-row">
                <span>Total Paid:</span>
                <span class="order-grand-total">${Number(order.grandTotal).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // Initialization & Event Attachments
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Seed default demo user
    await seedDefaultUser();

    // 2. Initialize Header State
    updateHeaderUI();

    // 3. Setup Password Visibility Toggles
    setupPasswordToggle('login-password', 'login-pwd-toggle');
    setupPasswordToggle('signup-password', 'signup-pwd-toggle');
    setupPasswordToggle('signup-confirm-pwd', 'signup-confirm-pwd-toggle');

    // 4. Header Account Toggle Trigger
    const accountBtn = document.getElementById('account-toggle-btn');
    const accountDropdown = document.getElementById('account-dropdown');

    if (accountBtn) {
      accountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const user = getCurrentUser();
        if (!user) {
          openAuthModal('login');
        } else {
          // Toggle dropdown menu
          if (accountDropdown) {
            const isVisible = accountDropdown.classList.contains('active');
            accountDropdown.classList.toggle('active', !isVisible);
            accountBtn.setAttribute('aria-expanded', String(!isVisible));
          }
        }
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (accountDropdown && !e.target.closest('.account-dropdown') && !e.target.closest('#account-toggle-btn')) {
        accountDropdown.classList.remove('active');
        if (accountBtn) accountBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Dropdown Actions
    const dropdownAccountBtn = document.getElementById('dropdown-my-account');
    const dropdownOrdersBtn = document.getElementById('dropdown-my-orders');
    const dropdownLogoutBtn = document.getElementById('dropdown-logout');

    if (dropdownAccountBtn) {
      dropdownAccountBtn.addEventListener('click', () => {
        if (accountDropdown) accountDropdown.classList.remove('active');
        openAccountModal();
      });
    }

    if (dropdownOrdersBtn) {
      dropdownOrdersBtn.addEventListener('click', () => {
        if (accountDropdown) accountDropdown.classList.remove('active');
        openAccountModal();
      });
    }

    if (dropdownLogoutBtn) {
      dropdownLogoutBtn.addEventListener('click', () => {
        if (accountDropdown) accountDropdown.classList.remove('active');
        logoutUser();
      });
    }

    // Modal Close Triggers
    const authCloseBtn = document.getElementById('auth-close-btn');
    const accountCloseBtn = document.getElementById('account-close-btn');
    const accountLogoutBtn = document.getElementById('account-logout-btn');
    const accountShopBtn = document.getElementById('account-shop-now-btn');

    if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);
    if (accountCloseBtn) accountCloseBtn.addEventListener('click', closeAccountModal);
    if (accountLogoutBtn) {
      accountLogoutBtn.addEventListener('click', () => {
        closeAccountModal();
        logoutUser();
      });
    }
    if (accountShopBtn) {
      accountShopBtn.addEventListener('click', () => {
        closeAccountModal();
        const catalogEl = document.getElementById('catalog');
        if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Backdrop click dismiss for dialogs
    [authDialog, accountDialog].forEach(dialog => {
      if (dialog) {
        dialog.addEventListener('click', (e) => {
          const rect = dialog.getBoundingClientRect();
          const isIn = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
          );
          if (!isIn) dialog.close();
        });
      }
    });

    // Tab Switchers
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const gotoSignupLink = document.getElementById('goto-signup-link');
    const gotoLoginLink = document.getElementById('goto-login-link');

    if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
    if (tabSignup) tabSignup.addEventListener('click', () => switchAuthTab('signup'));
    if (gotoSignupLink) gotoSignupLink.addEventListener('click', () => switchAuthTab('signup'));
    if (gotoLoginLink) gotoLoginLink.addEventListener('click', () => switchAuthTab('login'));

    // Fill Demo Credentials Shortcut Pill
    const fillDemoBtn = document.getElementById('fill-demo-credentials-btn');
    if (fillDemoBtn) {
      fillDemoBtn.addEventListener('click', () => {
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        if (emailInput) emailInput.value = 'demo@luxora.com';
        if (passInput) passInput.value = 'Password123';
      });
    }

    // Forgot Password Demo Feedback
    const forgotPwdLink = document.getElementById('forgot-password-link');
    if (forgotPwdLink) {
      forgotPwdLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('✨ [LUXORA Atelier Demo]: For evaluation purposes, use the default demo credentials:\n\nEmail: demo@luxora.com\nPassword: Password123\n\nOr create a new demo account with your own password.');
      });
    }

    // --- Login Form Submission ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthErrors();

        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const rememberCheck = document.getElementById('login-remember');
        const bannerError = document.getElementById('login-banner-error');

        const email = emailInput.value.trim();
        const pass = passInput.value;

        if (!email) {
          document.getElementById('login-email-error').textContent = 'Please enter your email address.';
          emailInput.classList.add('input-error');
          return;
        }

        if (!pass) {
          document.getElementById('login-password-error').textContent = 'Please enter your password.';
          passInput.classList.add('input-error');
          return;
        }

        const res = await loginUser(email, pass, rememberCheck ? rememberCheck.checked : true);
        if (res.success) {
          closeAuthModal();
          if (window.showToast) {
            window.showToast(`Welcome back, ${res.user.name}`);
          }
        } else {
          if (bannerError) {
            bannerError.textContent = res.message;
            bannerError.style.display = 'block';
          }
        }
      });
    }

    // --- Sign-Up Form Submission ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthErrors();

        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email');
        const passInput = document.getElementById('signup-password');
        const confirmInput = document.getElementById('signup-confirm-pwd');
        const termsCheck = document.getElementById('signup-terms');
        const bannerError = document.getElementById('signup-banner-error');

        let valid = true;

        if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
          document.getElementById('signup-name-error').textContent = 'Please enter your full name (at least 2 letters).';
          nameInput.classList.add('input-error');
          valid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
          document.getElementById('signup-email-error').textContent = 'Please enter a valid email address.';
          emailInput.classList.add('input-error');
          valid = false;
        }

        if (passInput.value.length < 6) {
          document.getElementById('signup-password-error').textContent = 'Password must be at least 6 characters.';
          passInput.classList.add('input-error');
          valid = false;
        }

        if (passInput.value !== confirmInput.value) {
          document.getElementById('signup-confirm-error').textContent = 'Passwords do not match.';
          confirmInput.classList.add('input-error');
          valid = false;
        }

        if (!termsCheck.checked) {
          document.getElementById('signup-terms-error').textContent = 'You must accept the terms to create an account.';
          valid = false;
        }

        if (!valid) return;

        const res = await registerUser({
          name: nameInput.value,
          email: emailInput.value,
          password: passInput.value
        });

        if (res.success) {
          closeAuthModal();
          if (window.showToast) {
            window.showToast(`Welcome to LUXORA, ${res.user.name}`);
          }
        } else {
          if (bannerError) {
            bannerError.textContent = res.message;
            bannerError.style.display = 'block';
          }
        }
      });
    }
  });

  // Export functions to global scope
  window.luxoraAuth = {
    getCurrentUser,
    registerUser,
    loginUser,
    logoutUser,
    getUserOrders,
    saveCompletedOrder,
    openAuthModal,
    closeAuthModal,
    openAccountModal,
    closeAccountModal,
    updateHeaderUI
  };

})();
