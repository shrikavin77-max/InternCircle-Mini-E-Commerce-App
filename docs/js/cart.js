/**
 * LUXORA — Shopping Cart Core Logic & State Management
 * 
 * Manages:
 * - In-memory cart state: Array of { id: string, quantity: number }
 * - LocalStorage persistence with error handling
 * - Calculation of subtotal via Array.reduce()
 * - Delivery fee rule (Free for >= ₹500, ₹40 for < ₹500, ₹0 when empty)
 * - Rendering cart line items, quantity adjustments, and summary totals
 */

// Storage key used in localStorage
const CART_STORAGE_KEY = 'luxora_cart_data';

// Delivery rule constants
const FREE_DELIVERY_THRESHOLD = 500;
const STANDARD_DELIVERY_FEE = 40;

// Central in-memory state
let cart = [];

/**
 * Currency Formatter Utility
 * Uses toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
 * Keeps prices numeric internally while presenting standard Indian Rupee notation.
 */
function formatCurrency(amount) {
  return Number(amount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

/**
 * Load cart from localStorage with defensive parsing
 * Requirement 8: Corrupt data or missing key must never crash the app.
 */
function loadCart() {
  try {
    const rawData = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawData) {
      cart = [];
      return cart;
    }

    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      // Validate that each item has a valid id in PRODUCTS and positive integer quantity
      cart = parsed.filter(item => {
        return item && 
               typeof item.id === 'string' && 
               typeof item.quantity === 'number' && 
               item.quantity > 0 &&
               getProductById(item.id);
      });
    } else {
      cart = [];
    }
  } catch (error) {
    console.warn('[LUXORA] Error reading cart from localStorage. Resetting to empty cart.', error);
    cart = [];
  }
  return cart;
}

/**
 * Save current cart state to localStorage
 */
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('[LUXORA] Failed to save cart to localStorage:', error);
  }
}

/**
 * Calculate totals using Array.reduce()
 * 
 * Rules:
 * - Subtotal = sum of (price * quantity) for all items in cart
 * - Item count = sum of all quantities
 * - Delivery fee:
 *    • If cart is empty (subtotal === 0): ₹0
 *    • If subtotal >= ₹500: ₹0 (Free delivery)
 *    • If subtotal < ₹500: ₹40
 * - Grand Total = subtotal + deliveryFee
 */
function calculateTotals() {
  // Requirement 7: Calculate subtotal using Array.reduce()
  const subtotal = cart.reduce((accumulator, item) => {
    const product = getProductById(item.id);
    return accumulator + (product ? product.price * item.quantity : 0);
  }, 0);

  // Requirement 6: Display total item count
  const itemCount = cart.reduce((accumulator, item) => {
    return accumulator + item.quantity;
  }, 0);

  // Requirement 8 & Prompt: Delivery Fee Rule
  let deliveryFee = 0;
  if (subtotal === 0) {
    deliveryFee = 0;
  } else if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    deliveryFee = 0;
  } else {
    deliveryFee = STANDARD_DELIVERY_FEE;
  }

  // Calculate Grand Total
  const grandTotal = subtotal + deliveryFee;

  return {
    itemCount,
    subtotal,
    deliveryFee,
    grandTotal,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    amountNeededForFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)
  };
}

/**
 * Add a product to the cart
 * If already present, increments quantity; otherwise adds new entry.
 */
function addToCart(id) {
  const product = getProductById(id);
  if (!product) {
    console.error(`[LUXORA] Cannot add unknown product ID: ${id}`);
    return;
  }

  const existingItem = cart.find(item => item.id === id);

  if (existingItem) {
    // Prevent invalid or excessive quantities (max 99 per item)
    if (existingItem.quantity < 99) {
      existingItem.quantity += 1;
    }
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart();
  renderCart();

  // Trigger non-intrusive toast feedback
  if (window.showToast) {
    window.showToast(`"${product.name}" added to your bag`);
  }
}

/**
 * Change quantity of an item by a relative delta (+1 or -1)
 * Prevents invalid quantities: if quantity drops to 0, item is removed.
 */
function changeQuantity(id, delta) {
  const itemIndex = cart.findIndex(item => item.id === id);
  if (itemIndex === -1) return;

  const currentQuantity = cart[itemIndex].quantity;
  const newQuantity = currentQuantity + delta;

  if (newQuantity <= 0) {
    // Decreasing below 1 removes the item
    removeItem(id);
  } else if (newQuantity > 99) {
    // Cap at 99
    cart[itemIndex].quantity = 99;
    saveCart();
    renderCart();
  } else {
    cart[itemIndex].quantity = newQuantity;
    saveCart();
    renderCart();
  }
}

/**
 * Remove an individual product from the cart completely
 */
function removeItem(id) {
  const item = cart.find(i => i.id === id);
  const product = item ? getProductById(item.id) : null;

  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();

  if (window.showToast && product) {
    window.showToast(`"${product.name}" removed from bag`, 'remove');
  }
}

/**
 * Clear the entire cart (used after successful checkout confirmation)
 */
function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

/**
 * Render the complete shopping cart UI
 * Updates badge count, items list, empty-state visibility, and summary totals.
 */
function renderCart() {
  const totals = calculateTotals();

  // 1. Update Cart Badge Count in Header
  const badgeElement = document.getElementById('cart-count-badge');
  if (badgeElement) {
    badgeElement.textContent = totals.itemCount;
    // Highlight animation
    badgeElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      badgeElement.style.transform = 'scale(1)';
    }, 200);
  }

  // 2. Update Drawer Header Item Count
  const drawerCountElement = document.getElementById('drawer-item-count');
  if (drawerCountElement) {
    drawerCountElement.textContent = `(${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'})`;
  }

  // 3. Update Free Delivery Motivation Banner
  const deliveryBannerText = document.getElementById('free-delivery-text');
  const deliveryProgressBar = document.getElementById('delivery-progress-bar');
  
  if (deliveryBannerText && deliveryProgressBar) {
    if (totals.subtotal === 0) {
      deliveryBannerText.textContent = `Complimentary delivery on orders ₹500 or above`;
      deliveryBannerText.classList.remove('qualified');
      deliveryProgressBar.style.width = '0%';
      deliveryProgressBar.classList.remove('qualified');
    } else if (totals.subtotal >= totals.freeDeliveryThreshold) {
      deliveryBannerText.textContent = `✨ You have unlocked complimentary delivery!`;
      deliveryBannerText.classList.add('qualified');
      deliveryProgressBar.style.width = '100%';
      deliveryProgressBar.classList.add('qualified');
    } else {
      const percentage = Math.min(100, Math.round((totals.subtotal / totals.freeDeliveryThreshold) * 100));
      deliveryBannerText.textContent = `Add ${formatCurrency(totals.amountNeededForFreeDelivery)} more for complimentary delivery`;
      deliveryBannerText.classList.remove('qualified');
      deliveryProgressBar.style.width = `${percentage}%`;
      deliveryProgressBar.classList.remove('qualified');
    }
  }

  // 4. Containers for Items and Empty View
  const itemsContainer = document.getElementById('cart-items-container');
  const emptyView = document.getElementById('empty-cart-view');
  const cartFooter = document.getElementById('cart-footer');

  if (cart.length === 0) {
    // Empty Cart State
    if (emptyView) emptyView.style.display = 'flex';
    if (itemsContainer) {
      itemsContainer.style.display = 'none';
      itemsContainer.innerHTML = '';
    }
    if (cartFooter) {
      // Keep footer visible but disable checkout
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) checkoutBtn.disabled = true;
    }
  } else {
    // Active Cart State with Items
    if (emptyView) emptyView.style.display = 'none';
    if (itemsContainer) {
      itemsContainer.style.display = 'flex';
      
      // Render line items
      itemsContainer.innerHTML = cart.map(item => {
        const product = getProductById(item.id);
        if (!product) return '';

        const lineTotal = product.price * item.quantity;

        return `
          <div class="cart-line-item" data-id="${product.id}">
            <div class="cart-item-thumb">
              <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            
            <div class="cart-item-details">
              <div>
                <span class="cart-item-category">${product.category}</span>
                <h4 class="cart-item-title">${product.name}</h4>
                <span class="cart-item-unit-price">${formatCurrency(product.price)} each</span>
              </div>

              <!-- Quantity Stepper Pill (- qty +) -->
              <div class="cart-qty-stepper" aria-label="Adjust quantity">
                <button 
                  type="button" 
                  class="qty-step-btn" 
                  data-action="decrease" 
                  data-id="${product.id}"
                  aria-label="Decrease quantity of ${product.name}"
                >&minus;</button>
                <span class="cart-qty-val" aria-live="polite">${item.quantity}</span>
                <button 
                  type="button" 
                  class="qty-step-btn" 
                  data-action="increase" 
                  data-id="${product.id}"
                  aria-label="Increase quantity of ${product.name}"
                >&plus;</button>
              </div>
            </div>

            <div class="cart-item-actions">
              <button 
                type="button" 
                class="remove-item-btn" 
                data-action="remove" 
                data-id="${product.id}"
                aria-label="Remove ${product.name} from bag"
              >
                &times; Remove
              </button>
              <span class="cart-item-line-total">${formatCurrency(lineTotal)}</span>
            </div>
          </div>
        `;
      }).join('');

      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) checkoutBtn.disabled = false;
    }
  }

  // 5. Update Footer Summary Lines
  const subtotalEl = document.getElementById('cart-subtotal');
  const deliveryEl = document.getElementById('cart-delivery');
  const grandTotalEl = document.getElementById('cart-grand-total');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(totals.subtotal);
  
  if (deliveryEl) {
    if (totals.subtotal === 0) {
      deliveryEl.textContent = formatCurrency(0);
    } else if (totals.deliveryFee === 0) {
      deliveryEl.innerHTML = '<span style="color: var(--color-success); font-weight: 700;">FREE</span>';
    } else {
      deliveryEl.textContent = formatCurrency(totals.deliveryFee);
    }
  }

  if (grandTotalEl) grandTotalEl.textContent = formatCurrency(totals.grandTotal);
}

// Expose on global window scope
window.cart = cart;
window.formatCurrency = formatCurrency;
window.loadCart = loadCart;
window.saveCart = saveCart;
window.calculateTotals = calculateTotals;
window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.renderCart = renderCart;
