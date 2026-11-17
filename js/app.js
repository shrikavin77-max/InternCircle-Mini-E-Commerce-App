/**
 * LUXORA — Main Application Controller & UI Coordinator
 * 
 * Coordinates:
 * - Dynamic product catalog rendering
 * - Real-time search, category filtering, and price sorting
 * - Product detail preview modal (HTML5 Dialog)
 * - Shopping cart drawer interactions and Event Delegation
 * - Checkout preview dialog with validation & demo order confirmation
 * - Non-intrusive toast notifications and responsive navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Initial State ---
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'featured';

  // --- 2. DOM Elements Cache ---
  const productGrid = document.getElementById('product-grid');
  const emptyCatalogView = document.getElementById('empty-catalog-view');
  const productCountDisplay = document.getElementById('product-count-display');
  const searchInput = document.getElementById('product-search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const filterChips = document.querySelectorAll('.filter-chip');
  const sortSelect = document.getElementById('price-sort-select');
  const filterStatusBar = document.getElementById('filter-status-bar');
  const filterStatusText = document.getElementById('filter-status-text');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const catalogResetBtn = document.getElementById('catalog-reset-btn');

  // Cart Drawer Elements
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const exploreBtn = document.getElementById('explore-btn');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Dialog Elements
  const productDetailDialog = document.getElementById('product-detail-dialog');
  const detailDialogContent = document.getElementById('detail-dialog-content');
  const detailCloseBtn = document.getElementById('detail-close-btn');

  const checkoutDialog = document.getElementById('checkout-dialog');
  const dialogCloseBtn = document.getElementById('dialog-close-btn');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutItemsSummary = document.getElementById('checkout-items-summary');
  const orderSuccessState = document.getElementById('order-success-state');
  const checkoutBody = document.getElementById('checkout-body');
  const successDismissBtn = document.getElementById('success-dismiss-btn');

  // Mobile Nav Elements
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================
  function showToast(message, type = 'normal') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'remove' ? 'toast-remove' : ''}`;
    
    // Icon
    const iconSvg = type === 'remove' 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 2800);
  }
  window.showToast = showToast;

  // ==========================================================================
  // Product Filtering, Sorting, and Dynamic Rendering
  // ==========================================================================
  function getFilteredProducts() {
    let result = [...PRODUCTS];

    // 1. Filter by category
    if (currentCategory !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
    }

    // 2. Filter by search query (name or description)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // 3. Sort products
    if (currentSort === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating-desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }

  function renderProductGrid() {
    const productsToRender = getFilteredProducts();

    // Update count display
    if (productCountDisplay) {
      productCountDisplay.textContent = `Showing ${productsToRender.length} ${productsToRender.length === 1 ? 'item' : 'items'}`;
    }

    // Update active filter status bar
    if (filterStatusBar && filterStatusText) {
      const hasActiveFilter = currentCategory !== 'all' || searchQuery.trim() !== '' || currentSort !== 'featured';
      if (hasActiveFilter) {
        filterStatusBar.style.display = 'flex';
        const parts = [];
        if (currentCategory !== 'all') parts.push(`Category: "${currentCategory}"`);
        if (searchQuery.trim() !== '') parts.push(`Search: "${searchQuery}"`);
        if (currentSort !== 'featured') parts.push(`Sorted: ${sortSelect.options[sortSelect.selectedIndex].text}`);
        filterStatusText.textContent = `Active: ${parts.join(' | ')}`;
      } else {
        filterStatusBar.style.display = 'none';
      }
    }

    // Handle Empty Results State
    if (productsToRender.length === 0) {
      if (productGrid) {
        productGrid.style.display = 'none';
        productGrid.innerHTML = '';
      }
      if (emptyCatalogView) emptyCatalogView.style.display = 'block';
      return;
    }

    if (emptyCatalogView) emptyCatalogView.style.display = 'none';
    if (productGrid) {
      productGrid.style.display = 'grid';
      productGrid.innerHTML = productsToRender.map(product => {
        const ratingHtml = product.rating ? `
          <div class="card-rating">
            <svg class="star-icon" width="12" height="12" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>${product.rating.toFixed(1)}</span>
          </div>
        ` : '';

        const badgeHtml = product.badge ? `
          <span class="product-badge">${product.badge}</span>
        ` : '';

        return `
          <article class="product-card" data-id="${product.id}">
            <div class="card-media-wrap">
              <img src="${product.image}" alt="${product.name}" loading="lazy">
              ${badgeHtml}
              <button 
                type="button" 
                class="quick-view-btn" 
                data-action="quick-view" 
                data-id="${product.id}"
                aria-label="Quick view ${product.name}"
              >
                Quick Preview
              </button>
            </div>

            <div class="card-content">
              <div class="card-category-rating">
                <span class="card-category">${product.category}</span>
                ${ratingHtml}
              </div>

              <h3 class="card-title">${product.name}</h3>
              <p class="card-desc">${product.description}</p>

              <div class="card-footer">
                <span class="card-price price-tag">${formatCurrency(product.price)}</span>
                <button 
                  type="button" 
                  class="add-to-bag-btn" 
                  data-action="add-to-cart" 
                  data-id="${product.id}"
                  aria-label="Add ${product.name} to shopping bag"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                  </svg>
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }
  }

  // ==========================================================================
  // Product Detail Preview Dialog (Quick View Modal)
  // ==========================================================================
  function openProductDetail(id) {
    const product = getProductById(id);
    if (!product || !productDetailDialog || !detailDialogContent) return;

    const detailsTableHtml = product.details ? `
      <ul class="detail-specs-list">
        ${Object.entries(product.details).map(([key, val]) => `
          <li>
            <span>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
            <strong>${val}</strong>
          </li>
        `).join('')}
      </ul>
    ` : '';

    detailDialogContent.innerHTML = `
      <div class="detail-layout">
        <div class="detail-image-wrap">
          <img src="${product.image}" alt="${product.name}">
          ${product.badge ? `<span class="product-badge" style="top: 18px; left: 18px;">${product.badge}</span>` : ''}
        </div>

        <div class="detail-info">
          <div class="detail-meta-row">
            <span class="detail-category">${product.category}</span>
            ${product.rating ? `
              <div class="card-rating">
                <svg class="star-icon" width="14" height="14" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span>${product.rating.toFixed(1)} (${product.reviewsCount || 0} reviews)</span>
              </div>
            ` : ''}
          </div>

          <h2 class="detail-title" id="detail-title">${product.name}</h2>
          <div class="detail-price">${formatCurrency(product.price)}</div>
          <p class="detail-desc">${product.description}</p>

          ${detailsTableHtml}

          <div class="detail-action-bar">
            <button 
              type="button" 
              class="btn btn-primary btn-block" 
              data-action="add-and-open" 
              data-id="${product.id}"
            >
              Add to Bag &bull; ${formatCurrency(product.price)}
            </button>
          </div>
        </div>
      </div>
    `;

    productDetailDialog.showModal();
  }

  // ==========================================================================
  // Shopping Cart Drawer Controls
  // ==========================================================================
  function openCartDrawer() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // Checkout Preview Dialog Modal & Payment Methods
  // ==========================================================================
  const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
  const paymentCards = document.querySelectorAll('.payment-card');
  const paymentPanelCod = document.getElementById('payment-panel-cod');
  const paymentPanelUpi = document.getElementById('payment-panel-upi');
  const paymentPanelCard = document.getElementById('payment-panel-card');
  const mockCardholderDisplay = document.getElementById('mock-cardholder-display');
  const mockCardholderName = document.getElementById('mock-cardholder-name');
  const mockUpiId = document.getElementById('mock-upi-id');
  const confirmOrderBtn = document.getElementById('confirm-order-btn');
  const simulatedProcessingState = document.getElementById('simulated-processing-state');
  const processingTitle = document.getElementById('processing-title');
  const processingSubtitle = document.getElementById('processing-subtitle');
  const customerNameInput = document.getElementById('customer-name');

  function updatePaymentMethodUI(method) {
    const totals = calculateTotals();
    
    paymentCards.forEach(card => {
      const radio = card.querySelector('input[type="radio"]');
      card.classList.toggle('active', radio && radio.value === method);
    });

    if (paymentPanelCod) paymentPanelCod.style.display = method === 'COD' ? 'block' : 'none';
    if (paymentPanelUpi) paymentPanelUpi.style.display = method === 'UPI' ? 'block' : 'none';
    if (paymentPanelCard) paymentPanelCard.style.display = method === 'CARD' ? 'block' : 'none';

    if (confirmOrderBtn) {
      if (method === 'COD') {
        confirmOrderBtn.textContent = 'Confirm & Place Order (Pay on Handover)';
      } else if (method === 'UPI') {
        confirmOrderBtn.textContent = `Authorize Demo UPI Payment \u2022 ${formatCurrency(totals.grandTotal)}`;
      } else if (method === 'CARD') {
        confirmOrderBtn.textContent = `Authorize Demo Card Payment \u2022 ${formatCurrency(totals.grandTotal)}`;
      }
    }
  }

  // Listen for radio payment changes
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        updatePaymentMethodUI(e.target.value);
      }
    });
  });

  // Sync customer name with cardholder preview
  if (customerNameInput) {
    customerNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (mockCardholderDisplay) {
        mockCardholderDisplay.textContent = val ? val.toUpperCase() : 'LUXORA PATRON';
      }
      if (mockCardholderName) {
        mockCardholderName.value = val || 'Aanya Sharma';
      }
    });
  }

  function openCheckoutDialog() {
    const totals = calculateTotals();
    if (totals.itemCount === 0) {
      showToast('Your bag is empty. Please add items before checking out.');
      return;
    }

    closeCartDrawer();

    // Populate Order Breakdown inside Modal
    if (checkoutItemsSummary) {
      checkoutItemsSummary.innerHTML = cart.map(item => {
        const product = getProductById(item.id);
        if (!product) return '';
        const lineTotal = product.price * item.quantity;
        return `
          <div class="checkout-item-row">
            <div class="checkout-item-info">
              <span class="checkout-item-qty">${item.quantity}x</span>
              <span class="checkout-item-name">${product.name}</span>
            </div>
            <span class="checkout-item-total">${formatCurrency(lineTotal)}</span>
          </div>
        `;
      }).join('');
    }

    // Populate Modal Totals
    const modalItemCount = document.getElementById('modal-item-count');
    const modalSubtotal = document.getElementById('modal-subtotal');
    const modalDelivery = document.getElementById('modal-delivery');
    const modalGrandTotal = document.getElementById('modal-grand-total');

    if (modalItemCount) modalItemCount.textContent = totals.itemCount;
    if (modalSubtotal) modalSubtotal.textContent = formatCurrency(totals.subtotal);
    if (modalDelivery) {
      modalDelivery.textContent = totals.deliveryFee === 0 ? 'FREE' : formatCurrency(totals.deliveryFee);
    }
    if (modalGrandTotal) modalGrandTotal.textContent = formatCurrency(totals.grandTotal);

    // Reset Form & Error States
    if (checkoutForm) {
      checkoutForm.reset();
      checkoutForm.querySelectorAll('.field-error').forEach(el => el.textContent = '');
      checkoutForm.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
      
      // Default to COD
      const codRadio = document.getElementById('pay-cod');
      if (codRadio) codRadio.checked = true;
      updatePaymentMethodUI('COD');
    }

    if (checkoutBody) checkoutBody.style.display = 'flex';
    if (simulatedProcessingState) simulatedProcessingState.style.display = 'none';
    if (orderSuccessState) orderSuccessState.style.display = 'none';

    if (checkoutDialog) checkoutDialog.showModal();
  }

  function closeCheckoutDialog() {
    if (checkoutDialog) checkoutDialog.close();
  }

  // Validate and Confirm Checkout
  function handleCheckoutSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    const cityInput = document.getElementById('customer-city');
    const pincodeInput = document.getElementById('customer-pincode');

    let isValid = true;

    // Helper for showing field errors
    const validateField = (input, errorId, condition, errorMessage) => {
      const errorEl = document.getElementById(errorId);
      if (!condition) {
        if (errorEl) errorEl.textContent = errorMessage;
        input.classList.add('input-error');
        isValid = false;
      } else {
        if (errorEl) errorEl.textContent = '';
        input.classList.remove('input-error');
      }
    };

    // 1. Name validation
    validateField(
      nameInput, 
      'name-error', 
      nameInput.value.trim().length >= 2, 
      'Please enter your full name (at least 2 letters).'
    );

    // 2. Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    validateField(
      phoneInput, 
      'phone-error', 
      phoneRegex.test(phoneInput.value.trim()), 
      'Please enter a valid 10-digit Indian mobile number.'
    );

    // 3. Address validation
    validateField(
      addressInput, 
      'address-error', 
      addressInput.value.trim().length >= 6, 
      'Please enter your complete street address.'
    );

    // 4. City validation
    validateField(
      cityInput, 
      'city-error', 
      cityInput.value.trim().length >= 2, 
      'Please enter your city.'
    );

    // 5. PIN code validation (6 digits)
    const pinRegex = /^[0-9]{6}$/;
    validateField(
      pincodeInput, 
      'pincode-error', 
      pinRegex.test(pincodeInput.value.trim()), 
      'Please enter a valid 6-digit PIN code.'
    );

    if (!isValid) return;

    const totals = calculateTotals();
    const orderId = '#LX-' + Math.floor(1000 + Math.random() * 9000);

    const orderRefEl = document.getElementById('order-reference-id');
    if (orderRefEl) orderRefEl.textContent = orderId;

    // Get Selected Payment Method
    const selectedRadio = document.querySelector('input[name="payment_method"]:checked');
    const selectedMethod = selectedRadio ? selectedRadio.value : 'COD';

    let paymentMethodHtml = '';
    let paymentStatusHtml = '';

    if (selectedMethod === 'COD') {
      paymentMethodHtml = 'Cash on Delivery (White-Glove Pay on Handover)';
      paymentStatusHtml = '<strong style="color: var(--color-accent);">Pending Handover</strong>';
    } else if (selectedMethod === 'UPI') {
      const vpa = (mockUpiId && mockUpiId.value.trim()) || 'demo.patron@okhdfcbank';
      paymentMethodHtml = `Instant UPI (${vpa} &bull; Simulated)`;
      paymentStatusHtml = '<strong style="color: var(--color-success);">Approved (Simulated Demo)</strong>';
    } else if (selectedMethod === 'CARD') {
      const holder = (mockCardholderName && mockCardholderName.value.trim()) || nameInput.value.trim() || 'Aanya Sharma';
      paymentMethodHtml = `Credit / Debit Card (•••• 4242 &bull; ${holder} &bull; Simulated)`;
      paymentStatusHtml = '<strong style="color: var(--color-success);">Approved (Simulated Demo)</strong>';
    }

    const receiptSummary = document.getElementById('order-receipt-summary');
    if (receiptSummary) {
      receiptSummary.innerHTML = `
        <div class="receipt-row">
          <span>Recipient:</span>
          <strong>${nameInput.value.trim()} (${phoneInput.value.trim()})</strong>
        </div>
        <div class="receipt-row">
          <span>Destination:</span>
          <strong>${addressInput.value.trim()}, ${cityInput.value.trim()} - ${pincodeInput.value.trim()}</strong>
        </div>
        <div class="receipt-row">
          <span>Items Ordered:</span>
          <strong>${totals.itemCount} items</strong>
        </div>
        <div class="receipt-row">
          <span>Delivery Standard:</span>
          <strong>${totals.deliveryFee === 0 ? 'Complimentary Express' : 'Standard Delivery (₹40)'}</strong>
        </div>
        <div class="receipt-row">
          <span>Payment Method:</span>
          <strong>${paymentMethodHtml}</strong>
        </div>
        <div class="receipt-row">
          <span>Payment Status:</span>
          ${paymentStatusHtml}
        </div>
        <div class="receipt-row bold">
          <span>${selectedMethod === 'COD' ? 'Amount Payable on Handover:' : 'Total Amount Paid (Demo):'}</span>
          <strong>${formatCurrency(totals.grandTotal)}</strong>
        </div>
      `;
    }

    // Function to finalize confirmation and clear cart
    const completeOrderPlacement = () => {
      if (simulatedProcessingState) simulatedProcessingState.style.display = 'none';
      if (checkoutBody) checkoutBody.style.display = 'none';
      if (orderSuccessState) orderSuccessState.style.display = 'flex';

      clearCart();
      const methodLabel = selectedMethod === 'COD' ? 'Cash on Delivery' : selectedMethod === 'UPI' ? 'Instant UPI' : 'Card';
      showToast(`Order ${orderId} confirmed via ${methodLabel}!`);
    };

    // If electronic demo payment (UPI / Card), show simulated processing screen
    if (selectedMethod === 'UPI' || selectedMethod === 'CARD') {
      if (checkoutBody) checkoutBody.style.display = 'none';
      if (simulatedProcessingState) {
        simulatedProcessingState.style.display = 'flex';
        if (selectedMethod === 'UPI') {
          const vpa = (mockUpiId && mockUpiId.value.trim()) || 'demo.patron@okhdfcbank';
          if (processingTitle) processingTitle.textContent = 'Authorizing Demo UPI Payment';
          if (processingSubtitle) processingSubtitle.textContent = `Contacting simulated UPI network for ${vpa}...`;
        } else {
          if (processingTitle) processingTitle.textContent = 'Authorizing Demo Card Payment';
          if (processingSubtitle) processingSubtitle.textContent = 'Contacting simulated card network for •••• 4242...';
        }
      }

      setTimeout(() => {
        completeOrderPlacement();
      }, 950);
    } else {
      // COD directly completes
      completeOrderPlacement();
    }
  }

  // ==========================================================================
  // Event Listeners & Delegation Setup
  // ==========================================================================

  // 1. Search Input Listener (Real-time filtering)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? 'block' : 'none';
      }
      renderProductGrid();
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.style.display = 'none';
      searchInput.focus();
      renderProductGrid();
    });
  }

  // 2. Category Filter Chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      filterChips.forEach(c => c.classList.remove('active'));
      const targetChip = e.currentTarget;
      targetChip.classList.add('active');
      currentCategory = targetChip.dataset.category;
      renderProductGrid();
    });
  });

  // 3. Price Sorting Dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProductGrid();
    });
  }

  // 4. Reset Filters Buttons
  const resetAllFilters = () => {
    currentCategory = 'all';
    searchQuery = '';
    currentSort = 'featured';

    if (searchInput) {
      searchInput.value = '';
      if (searchClearBtn) searchClearBtn.style.display = 'none';
    }

    filterChips.forEach(c => {
      c.classList.toggle('active', c.dataset.category === 'all');
    });

    if (sortSelect) sortSelect.value = 'featured';

    renderProductGrid();
  };

  if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAllFilters);
  if (catalogResetBtn) catalogResetBtn.addEventListener('click', resetAllFilters);

  // 5. Featured Categories Cards & Footer Links click handling
  document.querySelectorAll('.category-card, .footer-cat-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = btn.dataset.category || btn.dataset.cat;
      if (!cat) return;

      currentCategory = cat;
      filterChips.forEach(c => {
        c.classList.toggle('active', c.dataset.category.toLowerCase() === cat.toLowerCase());
      });

      renderProductGrid();

      // Smooth scroll to catalog section
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 6. Product Grid Event Delegation (Cards: Add to Bag & Quick Preview)
  if (productGrid) {
    productGrid.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-action="add-to-cart"]');
      if (addBtn) {
        e.stopPropagation();
        const id = addBtn.dataset.id;
        addToCart(id);
        return;
      }

      const quickBtn = e.target.closest('[data-action="quick-view"]');
      if (quickBtn) {
        e.stopPropagation();
        const id = quickBtn.dataset.id;
        openProductDetail(id);
        return;
      }

      // Clicking card media opens detail
      const card = e.target.closest('.product-card');
      if (card && !e.target.closest('button')) {
        const id = card.dataset.id;
        openProductDetail(id);
      }
    });
  }

  // 7. Product Detail Dialog Event Delegation
  if (productDetailDialog) {
    productDetailDialog.addEventListener('click', (e) => {
      // Backdrop click detection
      const rect = productDetailDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        productDetailDialog.close();
      }

      // Add to bag from preview
      const addBtn = e.target.closest('[data-action="add-and-open"]');
      if (addBtn) {
        const id = addBtn.dataset.id;
        addToCart(id);
        productDetailDialog.close();
        openCartDrawer();
      }
    });
  }

  if (detailCloseBtn) {
    detailCloseBtn.addEventListener('click', () => {
      if (productDetailDialog) productDetailDialog.close();
    });
  }

  // 8. Cart Drawer Event Delegation (Increase, Decrease, Remove)
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
      const incBtn = e.target.closest('[data-action="increase"]');
      if (incBtn) {
        changeQuantity(incBtn.dataset.id, 1);
        return;
      }

      const decBtn = e.target.closest('[data-action="decrease"]');
      if (decBtn) {
        changeQuantity(decBtn.dataset.id, -1);
        return;
      }

      const remBtn = e.target.closest('[data-action="remove"]');
      if (remBtn) {
        removeItem(remBtn.dataset.id);
        return;
      }
    });
  }

  // 9. Drawer Triggers
  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      closeCartDrawer();
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 10. Checkout Dialog Triggers & Form Handler
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutDialog);
  if (dialogCloseBtn) dialogCloseBtn.addEventListener('click', closeCheckoutDialog);
  if (successDismissBtn) successDismissBtn.addEventListener('click', closeCheckoutDialog);

  if (checkoutDialog) {
    checkoutDialog.addEventListener('click', (e) => {
      // Backdrop click closes checkout dialog
      const rect = checkoutDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        checkoutDialog.close();
      }
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // 11. Mobile Navigation Menu Toggle
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 12. Keyboard Accessibility (Escape key closes drawer)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cartDrawer && cartDrawer.classList.contains('active')) {
        closeCartDrawer();
      }
    }
  });

  // ==========================================================================
  // Initialization Sequence
  // ==========================================================================
  // 1. Load persisted cart data from localStorage
  loadCart();

  // 2. Render initial cart state & badge
  renderCart();

  // 3. Render dynamic product catalog
  renderProductGrid();

  console.log('[LUXORA] Atelier initialized successfully. Ready for clients.');
});
