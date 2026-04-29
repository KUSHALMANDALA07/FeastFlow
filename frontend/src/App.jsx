import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ShoppingCart, Search, Star, Clock, CreditCard,
  ChevronRight, ArrowLeft, Phone, MessageSquare,
  MapPin, CheckCircle, Package, Truck, PartyPopper, X,
  Minus, Plus
} from 'lucide-react';
import './App.css';

// --- UTILS ---
const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');

// --- COMPONENTS ---

const Navbar = ({ cartCount, onNavigate, onToggleCart }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar glass ${isScrolled ? 'scrolled' : ''}`}>
      <div className="logo" onClick={() => onNavigate('home')}>
        <span style={{ fontSize: '28px' }}>🍜</span> FeastFlow
      </div>
      <div className="nav-links">
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('delivery'); }}>Delivery Partner</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}>Restaurant Partner</a>
      </div>
      <div className="nav-right">
        <button className="glass-btn cart-btn" onClick={onToggleCart}>
          <ShoppingCart size={18} />
          <span className={`cart-badge ${cartCount > 0 ? 'pop' : ''}`}>{cartCount}</span>
        </button>
      </div>
    </nav>
  );
};

const Home = ({ restaurants, onOpenRestaurant }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [category, setCategory] = useState(null);

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || r.cuisine.toLowerCase().includes(category.toLowerCase());
    const matchesFilter = filter === 'All' || 
                         (filter === '4.5+' && r.rating >= 4.5) ||
                         (filter === 'Offers' && r.discount);
    return matchesSearch && matchesCategory && matchesFilter;
  });

  return (
    <section className="container" style={{ paddingTop: '100px' }}>
      <div className="hero">
        <h1 className="gradient-text">Crave It. Order It.<br/>Get It.</h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '18px' }}>
          Experience premium food delivery with real-time tracking and unmatched taste.
        </p>
        
        <div className="search-bar glass">
          <Search size={20} color="var(--primary)" style={{ marginLeft: '15px' }} />
          <input 
            type="text" 
            className="glass-input" 
            placeholder="Search for restaurants or cuisines..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="glass-btn primary-glow">Find Food</button>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-3">What's on your mind?</h3>
        <div className="category-scroll">
          {[
            '🍕 Pizza', '🍔 Burgers', '🍣 Sushi', '🌮 Tacos', '🍜 Noodles', '🥗 Salads', 
            '🍰 Desserts', '🥤 Drinks', '🍛 Indian', '🍖 BBQ', '🥪 Sandwiches', '🍦 Ice Cream',
            '🥟 Dumplings', '🥘 Continental', '🍢 Street Food', '☕ Coffee', '🥐 Bakery', '🍤 Seafood'
          ].map((cat, i) => {
            const name = cat.split(' ')[1];
            return (
              <div 
                key={i} 
                className={`category-chip ${category === name ? 'active' : ''}`}
                onClick={() => setCategory(category === name ? null : name)}
              >
                <div className="cat-icon">{cat.split(' ')[0]}</div>
                <span>{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex-center" style={{ gap: '12px', flexWrap: 'wrap' }}>
        {['All', '4.5+', 'Offers', 'Fastest'].map(f => (
          <button 
            key={f}
            className={`glass-btn ${filter === f ? 'primary-glow' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 mb-5">
        <div className="flex-between mb-4">
          <h2>{category || 'Top'} Restaurants in your City</h2>
          <span className="text-muted">{filteredRestaurants.length} found</span>
        </div>
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-5">
            <h3>No restaurants found.</h3>
            <button className="glass-btn mt-3" onClick={() => { setSearch(''); setCategory(null); setFilter('All'); }}>Clear All Filters</button>
          </div>
        ) : (
          <div className="grid-3">
            {filteredRestaurants.map(r => (
              <div key={r.id} className="rest-card" onClick={() => onOpenRestaurant(r)}>
                {r.discount && <div className="badge-discount">{r.discount}</div>}
                <div className="rest-img">{r.emoji}</div>
                <div className="rest-title">
                  <span>{r.name}</span>
                  <div className="rest-rating">{r.rating} <Star size={14} fill="currentColor" /></div>
                </div>
                <div className="rest-meta">
                  <span>{r.cuisine} • {r.time}</span>
                  <span style={{ color: 'var(--primary)' }}>Min ₹{r.min}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const RestaurantDetail = ({ restaurant, onBack, cart, onUpdateCart }) => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    axios.get(`/api/restaurants/${restaurant.id}/menu`)
      .then(res => {
        setMenu(res.data);
        setLoading(false);
      });
  }, [restaurant.id]);

  const categories = ['All', ...new Set(menu.map(m => m.cat || 'Recommended'))];
  const filteredMenu = activeCategory === 'All' ? menu : menu.filter(m => (m.cat || 'Recommended') === activeCategory);

  const getCatIcon = (cat) => {
    const icons = {
      'All': '🍴', 'Recommended': '⭐', 'Indian': '🍛', 'Chinese': '🍜', 'Italian': '🍕',
      'Burgers': '🍔', 'Sushi': '🍣', 'Noodles': '🍜', 'Tacos': '🌮', 'Salads': '🥗',
      'Desserts': '🍰', 'Drinks': '🥤', 'Street Food': '🍢', 'BBQ': '🍖', 'Seafood': '🍤',
      'Bakery': '🥐', 'Dumplings': '🥟', 'Continental': '🥘', 'Healthy': '🥗'
    };
    return icons[cat] || '🍽️';
  };

  return (
    <section className="container" style={{ paddingTop: '100px' }}>
      <button className="glass-btn mb-4" onClick={onBack}><ArrowLeft size={18} /> Back</button>
      
      <div className="rest-hero">
        <div className="rest-emoji-bg">{restaurant.emoji}</div>
        <div className="rest-hero-info glass-card">
          <h1>{restaurant.name}</h1>
          <div className="flex-between mb-2">
            <span className="text-muted">{restaurant.cuisine}</span>
            <div className="rest-rating">{restaurant.rating} <Star size={14} fill="currentColor" /></div>
          </div>
          <div className="flex-center" style={{ gap: '20px' }}>
            <span className="text-muted"><Clock size={16} /> {restaurant.time}</span>
            <span className="text-muted"><CreditCard size={16} /> Min ₹{restaurant.min}</span>
          </div>
        </div>
      </div>

      <div className="menu-layout">
        <div className="menu-sidebar glass-card" style={{ padding: '16px' }}>
          <h3 className="mb-3">Categories</h3>
          <ul style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {categories.map(cat => (
              <li
                key={cat}
                className={activeCategory === cat ? 'active' : ''}
                onClick={() => setActiveCategory(cat)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span>{getCatIcon(cat)}</span>
                {cat}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex-between mb-4">
            <h2>{activeCategory} Items</h2>
            <span className="text-muted">{filteredMenu.length} items</span>
          </div>
          {loading ? (
            <div className="text-center py-5"><h3 className="shimmer">Loading Menu...</h3></div>
          ) : (
            <div className="menu-sections">
              {categories.filter(c => activeCategory === 'All' || c === activeCategory).map(cat => {
                const items = filteredMenu.filter(m => (m.cat || 'Recommended') === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="mb-5">
                    <h3 className="mb-4" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', pb: '10px' }}>{cat}</h3>
                    <div className="grid-2">
                      {items.map(m => {
                        const cartItem = cart.find(x => x.id === m.id);
                        const qty = cartItem ? cartItem.qty : 0;
                        return (
                          <div key={m.id} className="menu-item glass-card">
                            <div className="menu-item-info">
                              <div className="menu-item-title">
                                <span className={`veg-dot ${m.veg ? 'veg' : 'non-veg'}`}></span>{m.name}
                              </div>
                              <p className="text-muted mb-2" style={{ fontSize: '13px' }}>{m.desc}</p>
                              <h4 style={{ color: 'var(--primary)' }}>₹{m.price}</h4>
                              {qty > 0 ? (
                                <div className="qty-selector mt-3" style={{ width: 'fit-content' }}>
                                  <button className="qty-btn" onClick={() => onUpdateCart(m, -1)}><Minus size={14} /></button>
                                  <span>{qty}</span>
                                  <button className="qty-btn" onClick={() => onUpdateCart(m, 1)}><Plus size={14} /></button>
                                </div>
                              ) : (
                                <button className="glass-btn add-btn" onClick={() => onUpdateCart(m, 1)}>+ Add</button>
                              )}
                            </div>
                            <div className="menu-item-img">
                              {m.emoji}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const CartSidebar = ({ isOpen, cart, onClose, onUpdateQty, onCheckout }) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(subtotal * 0.05);
  const delivery = subtotal > 0 ? 40 : 0;
  const total = subtotal + tax + delivery;

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose}></div>
      <div className="cart-panel open">
        <X className="cart-close" onClick={onClose} />
        <h2>Your Order</h2>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="text-center mt-5">
              <div style={{ fontSize: '60px', opacity: 0.2 }}>🛒</div>
              <p className="text-muted mt-3">Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '4px' }}>{item.name}</h4>
                  <p className="text-muted text-sm">₹{item.price}</p>
                </div>
                <div className="qty-selector">
                  <button className="qty-btn" onClick={() => onUpdateQty(item, -1)}><Minus size={12} /></button>
                  <span>{item.qty}</span>
                  <button className="qty-btn" onClick={() => onUpdateQty(item, 1)}><Plus size={12} /></button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-summary mt-4" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
            <div className="flex-between mb-2"><span className="text-muted">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex-between mb-4"><span className="text-muted">Delivery & Taxes</span><span>{formatCurrency(tax + delivery)}</span></div>
            <div className="flex-between mb-4"><h3 style={{ color: 'var(--primary)' }}>Total</h3><h3 style={{ color: 'var(--primary)' }}>{formatCurrency(total)}</h3></div>
            <button className="glass-btn primary-glow" style={{ width: '100%', padding: '16px' }} onClick={onCheckout}>Checkout</button>
          </div>
        )}
      </div>
    </>
  );
};

const PartnerDashboard = ({ type, onBack }) => (
  <section className="container" style={{ paddingTop: '120px' }}>
    <button className="glass-btn mb-4" onClick={onBack}><ArrowLeft size={18} /> Back</button>
    <div className="glass-card text-center py-5">
      <h1 className="mb-3">{type} Dashboard</h1>
      <p className="text-muted mb-5">Welcome back! Manage your operations in real-time.</p>
      <div className="grid-3">
        <div className="glass-card"><h3>Active Orders</h3><h1 className="mt-3" style={{ color: 'var(--primary)' }}>12</h1></div>
        <div className="glass-card"><h3>Daily Revenue</h3><h1 className="mt-3" style={{ color: 'var(--primary)' }}>₹4,250</h1></div>
        <div className="glass-card"><h3>User Rating</h3><h1 className="mt-3" style={{ color: 'var(--primary)' }}>4.9 ★</h1></div>
      </div>
      <div className="mt-5">
        <button className="glass-btn primary-glow">View Recent Orders</button>
        <button className="glass-btn ml-3" style={{ marginLeft: '12px' }}>Account Settings</button>
      </div>
    </div>
  </section>
);

const App = () => {
  const [view, setView] = useState('home');
  const [restaurants, setRestaurants] = useState([]);
  const [currentRest, setCurrentRest] = useState(null);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('glasseats_cart')) || []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    axios.get('/api/restaurants').then(res => {
      if (res.data.length === 0) {
        axios.post('/api/seed').then(() => {
          axios.get('/api/restaurants').then(r => setRestaurants(r.data));
        });
      } else {
        setRestaurants(res.data);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('glasseats_cart', JSON.stringify(cart));
  }, [cart]);

  const showToast = (msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const updateCart = (item, change) => {
    setCart(prev => {
      const existing = prev.find(x => x.id === item.id);
      if (existing) {
        const newQty = existing.qty + change;
        if (newQty <= 0) return prev.filter(x => x.id !== item.id);
        return prev.map(x => x.id === item.id ? { ...x, qty: newQty } : x);
      } else if (change > 0) {
        showToast(`Added ${item.name} to cart!`);
        return [...prev, { ...item, qty: 1 }];
      }
      return prev;
    });
  };

  const placeOrder = async () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = subtotal + Math.round(subtotal * 0.05) + 40;
    try {
      await axios.post('/api/orders', { items: cart, total });
      setCart([]);
      setView('tracking');
      showToast("Order Placed Successfully!");
    } catch (err) {
      showToast("Error placing order.");
    }
  };

  return (
    <div className="App">
      <div className="particles-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        {['🍕', '🍔', '🍣', '🌮', '🍜', '🍩', '🍦', '🍤', '🍗'].map((emoji, i) => (
          <div 
            key={i} 
            className="food-particle" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * -3}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <Navbar 
        cartCount={cart.reduce((s, i) => s + i.qty, 0)} 
        onNavigate={setView} 
        onToggleCart={() => setIsCartOpen(!isCartOpen)} 
      />

      <div id="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <CheckCircle size={20} color="var(--primary)" /> {t.msg}
          </div>
        ))}
      </div>

      <main>
        {view === 'home' && <Home restaurants={restaurants} onOpenRestaurant={(r) => { setCurrentRest(r); setView('restaurant'); }} />}
        {view === 'restaurant' && currentRest && (
          <RestaurantDetail 
            restaurant={currentRest} 
            onBack={() => setView('home')} 
            cart={cart}
            onUpdateCart={updateCart}
          />
        )}
        {view === 'tracking' && <Tracking onDone={() => setView('home')} />}
        {view === 'delivery' && <PartnerDashboard type="Delivery Partner" onBack={() => setView('home')} />}
        {view === 'partner' && <PartnerDashboard type="Restaurant Partner" onBack={() => setView('home')} />}
        
        {view === 'checkout' && (
          <section className="container" style={{ paddingTop: '120px' }}>
            <button className="glass-btn mb-4" onClick={() => setView('home')}><ArrowLeft size={18} /> Back</button>
            <h1 className="mb-4">Checkout</h1>
            <div className="checkout-grid">
              <div className="checkout-form glass-card">
                <h3 className="mb-4">Delivery Details</h3>
                <div className="grid-2 mb-3">
                  <input type="text" className="glass-input" placeholder="First Name" defaultValue="Kushal" />
                  <input type="text" className="glass-input" placeholder="Last Name" defaultValue="Mandala" />
                </div>
                <input type="text" className="glass-input mb-3" placeholder="Phone Number" defaultValue="+91 9876543210" />
                <input type="text" className="glass-input mb-3" placeholder="Address" defaultValue="Apt 404, Glass Tower" />
                <h3 className="mb-3 mt-4">Payment Method</h3>
                <div className="payment-options">
                  {['UPI', 'Card', 'Cash'].map(p => (
                    <div key={p} className={`pay-option ${p === 'UPI' ? 'selected' : ''}`}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{p === 'UPI' ? '📱' : p === 'Card' ? '💳' : '💵'}</div>
                      <div>{p}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="checkout-summary glass-card" style={{ height: 'fit-content' }}>
                <h3 className="mb-4">Order Summary</h3>
                <div className="mb-4">
                  {cart.map(i => (
                    <div key={i.id} className="flex-between mb-2">
                      <span>{i.qty}x {i.name}</span>
                      <span>{formatCurrency(i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>
                <button className="glass-btn primary-glow" style={{ width: '100%', padding: '18px', fontSize: '20px' }} onClick={placeOrder}>Confirm Order</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <CartSidebar 
        isOpen={isCartOpen} 
        cart={cart} 
        onClose={() => setIsCartOpen(false)} 
        onUpdateQty={updateCart}
        onCheckout={() => { setIsCartOpen(false); setView('checkout'); }}
      />
    </div>
  );
};

const Tracking = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const routeRef = useRef(null);
  const riderRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s < 4 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === 0) {
      const path = routeRef.current;
      const rider = riderRef.current;
      if (path && rider) {
        path.style.transition = 'stroke-dashoffset 20s linear';
        path.style.strokeDashoffset = '0';
        let start = null;
        const animate = (time) => {
          if (!start) start = time;
          const progress = (time - start) / 20000;
          if (progress <= 1) {
            const pt = path.getPointAtLength(progress * path.getTotalLength());
            rider.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }
    }
  }, [step]);

  return (
    <section className="container" style={{ paddingTop: '120px' }}>
      <h1 className="mb-2 text-center">Track Your Order</h1>
      <div className="timeline">
        {['Placed', 'Confirmed', 'Preparing', 'On the Way', 'Delivered'].map((s, i) => (
          <div key={i} className={`timeline-step ${i < step ? 'completed' : i === step ? 'active' : ''}`}>
            <div className="step-icon">{i < step ? '✅' : ['📝', '🍳', '👨‍🍳', '🛵', '🎉'][i]}</div>
            <p>{s}</p>
          </div>
        ))}
      </div>
      <div className="map-card glass-card mb-4" style={{ padding: 0 }}>
        <svg viewBox="0 0 1000 450" className="map">
          <path ref={routeRef} d="M 150 350 L 300 350 L 300 150 L 600 150 L 600 250 L 850 250" stroke="var(--primary)" strokeWidth="6" fill="none" strokeDasharray="1500" strokeDashoffset="1500" />
          <g ref={riderRef} transform="translate(150, 350)">
            <circle r="16" fill="white" />
            <text dy="5" textAnchor="middle" fontSize="16">🛵</text>
          </g>
        </svg>
      </div>
      <button className="glass-btn" onClick={onDone}>Back to Home</button>
    </section>
  );
};

export default App;
