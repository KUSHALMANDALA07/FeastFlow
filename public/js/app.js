import api from './api.js';

// STATE
let cart = JSON.parse(localStorage.getItem('glasseats_cart')) || [];
let currentRest = null;
let restaurants = [];

// INIT
document.addEventListener('DOMContentLoaded', async () => {
    // Attempt to fetch restaurants. If none, seed the DB (for first time use)
    restaurants = await api.getRestaurants();
    if (restaurants.length === 0) {
        await api.seedDatabase();
        restaurants = await api.getRestaurants();
    }
    
    renderRestaurants();
    updateCartBadge();
    generateParticles();
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if(window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // Handle initial navigation if any
    window.navigateTo = navigateTo;
    window.openRestaurant = openRestaurant;
    window.addToCart = addToCart;
    window.updateQty = updateQty;
    window.toggleCart = toggleCart;
    window.goToCheckout = goToCheckout;
    window.selectPay = selectPay;
    window.placeOrder = placeOrder;
    window.showToast = showToast;
});

function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

function generateParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const emojis = ['🍔','🍕','🌮','🍣','🍜','🥗','🍰','🍩','🍟','🍦'];
    for(let i=0; i<15; i++) {
        const el = document.createElement('div');
        el.className = 'food-particle';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (15 + Math.random() * 10) + 's';
        el.style.animationDelay = (Math.random() * 10) + 's';
        el.style.fontSize = (20 + Math.random() * 20) + 'px';
        container.appendChild(el);
    }
}

// RENDER FUNCTIONS
function renderRestaurants() {
    const grid = document.getElementById('restaurant-grid');
    if (!grid) return;
    grid.innerHTML = restaurants.map(r => `
        <div class="rest-card glass-card" onclick="openRestaurant(${r.id})">
            ${r.discount ? `<div class="badge-discount">${r.discount}</div>` : ''}
            <div class="rest-img" style="background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.2)); border: 1px solid rgba(255,255,255,0.05);">
                ${r.emoji}
            </div>
            <div class="rest-title">
                <span>${r.name}</span>
                <div class="rest-rating">${r.rating} ⭐</div>
            </div>
            <div class="rest-meta">
                <span>${r.cuisine}</span>
                <span>${r.time}</span>
            </div>
        </div>
    `).join('');
}

async function openRestaurant(id) {
    const r = restaurants.find(x => x.id === id);
    if (!r) return;
    currentRest = r;
    document.getElementById('r-name').innerText = r.name;
    document.getElementById('r-cuisine').innerText = r.cuisine;
    document.getElementById('r-rating').innerText = r.rating;
    document.getElementById('r-time').innerText = r.time;
    document.getElementById('r-min').innerText = '₹'+r.min;
    document.getElementById('r-emoji').innerText = r.emoji;
    
    // Fetch menu from backend
    const menu = await api.getMenu(r.id);
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = menu.map(m => {
        const inCart = cart.find(x => x.id === m.id);
        const qty = inCart ? inCart.qty : 0;
        
        return `
        <div class="menu-item glass-card">
            <div class="menu-item-info">
                <div class="menu-item-title">
                    <span class="veg-dot ${m.veg ? 'veg' : 'non-veg'}"></span>${m.name}
                </div>
                <p class="text-muted mb-2 text-sm">${m.desc}</p>
                <h4 class="mb-3">₹${m.price}</h4>
                
                ${qty > 0 ? `
                    <div class="qty-selector">
                        <button class="qty-btn" onclick="updateQty(${m.id}, -1, event)">-</button>
                        <span>${qty}</span>
                        <button class="qty-btn" onclick="updateQty(${m.id}, 1, event)">+</button>
                    </div>
                ` : `
                    <button class="glass-btn primary-glow add-btn" onclick="addToCart(${m.id}, '${m.name}', ${m.price}, event)">+ Add</button>
                `}
            </div>
            <div class="menu-item-img" style="background: rgba(255,255,255,0.05);">
                ${m.emoji}
            </div>
        </div>
    `}).join('');
    
    navigateTo('screen-restaurant');
}

// CART FUNCTIONS
function addToCart(id, name, price, e) {
    if (e) e.stopPropagation();
    cart.push({ id, name, price, qty: 1 });
    saveCart();
    showToast(`Added ${name} to cart!`);
    if(currentRest) openRestaurant(currentRest.id); // re-render buttons
    
    const badge = document.getElementById('cart-badge');
    badge.classList.add('pop');
    setTimeout(() => badge.classList.remove('pop'), 300);
}

function updateQty(id, change, e) {
    if(e) e.stopPropagation();
    const item = cart.find(x => x.id === id);
    if(item) {
        item.qty += change;
        if(item.qty <= 0) {
            cart = cart.filter(x => x.id !== id);
        }
        saveCart();
        if(currentRest) openRestaurant(currentRest.id);
        renderCart();
    }
}

function saveCart() {
    localStorage.setItem('glasseats_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-badge').innerText = totalItems;
}

function toggleCart() {
    const panel = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if(panel.classList.contains('open')) {
        panel.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        renderCart();
        panel.classList.add('open');
        overlay.style.display = 'block';
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if(cart.length === 0) {
        container.innerHTML = '<p class="text-muted text-center mt-5">Your cart is empty.</p>';
        updateCartTotals(0);
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div style="flex:1;">
                <h4 style="margin-bottom: 4px;">${item.name}</h4>
                <p class="text-muted text-sm">₹${item.price}</p>
            </div>
            <div class="qty-selector">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
            <div style="width: 60px; text-align: right; font-weight: bold;">
                ₹${item.price * item.qty}
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    updateCartTotals(subtotal);
}

function updateCartTotals(subtotal) {
    const tax = Math.round(subtotal * 0.05);
    const delivery = subtotal > 0 ? 40 : 0;
    const total = subtotal + tax + delivery;
    
    document.getElementById('cart-subtotal').innerText = formatCurrency(subtotal);
    document.getElementById('cart-tax').innerText = formatCurrency(tax);
    document.getElementById('cart-total').innerText = formatCurrency(total);
    
    // For checkout screen
    const coSub = document.getElementById('co-subtotal');
    if(coSub) {
        coSub.innerText = formatCurrency(subtotal);
        document.getElementById('co-tax').innerText = formatCurrency(tax);
        document.getElementById('co-total').innerText = formatCurrency(total);
    }
}

function goToCheckout() {
    if(cart.length === 0) {
        showToast("Cart is empty!");
        return;
    }
    toggleCart();
    
    const coItems = document.getElementById('co-items');
    coItems.innerHTML = cart.map(item => `
        <div class="flex-between mb-2">
            <span>${item.qty}x ${item.name}</span>
            <span>₹${item.price * item.qty}</span>
        </div>
    `).join('');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    updateCartTotals(subtotal);
    
    navigateTo('screen-checkout');
}

function selectPay(el) {
    document.querySelectorAll('.pay-option').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
}

async function placeOrder() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax + 40;

    try {
        const orderData = {
            items: cart,
            total: total
        };
        const result = await api.placeOrder(orderData);
        
        createConfetti();
        showToast("Order Placed Successfully!");
        cart = [];
        saveCart();
        
        setTimeout(() => {
            navigateTo('screen-tracking');
            startTrackingAnimation();
        }, 1000);
    } catch (error) {
        showToast("Error placing order. Please try again.");
    }
}

// NAVIGATION & UTILS
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        setTimeout(() => s.style.display = 'none', 300);
    });
    
    const target = document.getElementById(screenId);
    setTimeout(() => {
        target.style.display = 'block';
        void target.offsetWidth; // force reflow
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="font-size:20px;">🔔</span> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function createConfetti() {
    const colors = ['#FF6B35', '#8B5CF6', '#4ade80', '#38bdf8', '#facc15'];
    for(let i=0; i<100; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.top = -10 + 'px';
        conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
        conf.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 4000);
    }
}

// TRACKING ANIMATION
function startTrackingAnimation() {
    const route = document.getElementById('active-route');
    const rider = document.getElementById('rider-icon');
    
    if(route) {
        route.style.transition = 'none';
        route.style.strokeDashoffset = '1500';
        
        setTimeout(() => {
            route.style.transition = 'stroke-dashoffset 15s linear';
            route.style.strokeDashoffset = '0';
            
            const pathLen = route.getTotalLength();
            let start = null;
            function animateRider(timestamp) {
                if(!start) start = timestamp;
                let progress = (timestamp - start) / 15000;
                if(progress > 1) progress = 1;
                
                const pt = route.getPointAtLength(progress * pathLen);
                rider.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
                
                if(progress < 1) requestAnimationFrame(animateRider);
            }
            requestAnimationFrame(animateRider);
        }, 500);
    }

    let currentStep = 0;
    const steps = document.querySelectorAll('#tracking-timeline .timeline-step');
    steps.forEach(s => { s.className = 'timeline-step'; });
    steps[0].classList.add('active');
    
    const interval = setInterval(() => {
        if(currentStep < steps.length - 1) {
            steps[currentStep].classList.remove('active');
            steps[currentStep].classList.add('completed');
            currentStep++;
            steps[currentStep].classList.add('active');
        } else {
            clearInterval(interval);
            showToast("Order Delivered! 🎉");
            steps[currentStep].classList.remove('active');
            steps[currentStep].classList.add('completed');
        }
    }, 3750);

    let eta = 28 * 60;
    const etaEl = document.getElementById('eta-timer');
    const etaInt = setInterval(() => {
        eta--;
        const m = Math.floor(eta / 60);
        const s = eta % 60;
        etaEl.innerText = `${m}:${s < 10 ? '0'+s : s}`;
        if(eta <= 0) clearInterval(etaInt);
    }, 1000);
}
