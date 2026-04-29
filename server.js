const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// DATA FILE FOR FALLBACK (Persistence without MongoDB)
const DATA_FILE = path.join(__dirname, 'data.json');
const initData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ restaurants: [], menuItems: [], orders: [] }, null, 2));
    }
};
initData();

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Connect to MongoDB (Optional Fallback)
let useMongo = false;
mongoose.connect('mongodb://127.0.0.1:27017/glasseats', {
    serverSelectionTimeoutMS: 2000
}).then(() => {
    console.log('MongoDB Connected');
    useMongo = true;
}).catch(err => {
    console.log('MongoDB not found, using JSON file database for persistence.');
});

// Models (for Mongo)
const RestaurantSchema = new mongoose.Schema({ id: Number, name: String, cuisine: String, rating: Number, time: String, min: Number, discount: String, emoji: String });
const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
const MenuItemSchema = new mongoose.Schema({ id: Number, restaurantId: Number, name: String, desc: String, price: Number, veg: Boolean, emoji: String });
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const OrderSchema = new mongoose.Schema({ orderId: String, items: Array, total: Number, status: { type: String, default: 'New' }, createdAt: { type: Date, default: Date.now } });
const Order = mongoose.model('Order', OrderSchema);

// API Routes
app.get('/api/restaurants', async (req, res) => {
    if (useMongo) {
        return res.json(await Restaurant.find());
    }
    res.json(readData().restaurants);
});

app.get('/api/restaurants/:id/menu', async (req, res) => {
    const id = parseInt(req.params.id);
    if (useMongo) {
        return res.json(await MenuItem.find({ restaurantId: id }));
    }
    res.json(readData().menuItems.filter(m => m.restaurantId === id));
});

app.post('/api/orders', async (req, res) => {
    const orderData = {
        orderId: 'ORD-' + Math.floor(1000000 + Math.random() * 9000000),
        items: req.body.items,
        total: req.body.total,
        status: 'New',
        createdAt: new Date()
    };
    
    if (useMongo) {
        const order = new Order(orderData);
        await order.save();
        return res.status(201).json(order);
    }
    
    const data = readData();
    data.orders.push(orderData);
    writeData(data);
    res.status(201).json(orderData);
});

app.get('/api/orders', async (req, res) => {
    if (useMongo) {
        return res.json(await Order.find().sort({ createdAt: -1 }));
    }
    res.json(readData().orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/seed', async (req, res) => {
    const initialRestaurants = [
        { id: 1, name: 'Spice Garden', cuisine: 'Indian', rating: 4.3, time: '30 mins', min: 150, discount: '35% OFF', emoji: '🍛' },
        { id: 2, name: 'Tokyo Bites', cuisine: 'Japanese', rating: 4.7, time: '40 mins', min: 200, discount: '', emoji: '🍣' },
        { id: 3, name: 'Burger Republic', cuisine: 'American', rating: 4.5, time: '25 mins', min: 100, discount: '20% OFF', emoji: '🍔' },
        { id: 4, name: 'Pizza Nova', cuisine: 'Italian', rating: 4.2, time: '35 mins', min: 120, discount: '', emoji: '🍕' },
        { id: 5, name: 'Green Bowl', cuisine: 'Healthy', rating: 4.8, time: '20 mins', min: 180, discount: '10% OFF', emoji: '🥗' },
        { id: 6, name: 'Taco Fiesta', cuisine: 'Mexican', rating: 4.4, time: '30 mins', min: 130, discount: '', emoji: '🌮' },
        { id: 7, name: 'Noodle Ninja', cuisine: 'Asian', rating: 4.6, time: '35 mins', min: 150, discount: 'FREE DELIVERY', emoji: '🍜' },
        { id: 8, name: 'Sweet Tooth', cuisine: 'Desserts', rating: 4.9, time: '15 mins', min: 80, discount: '', emoji: '🍰' },
        { id: 9, name: 'Wrap God', cuisine: 'Fast Food', rating: 4.1, time: '25 mins', min: 100, discount: '15% OFF', emoji: '🌯' },
        { id: 10, name: 'Curry House', cuisine: 'Indian', rating: 4.5, time: '40 mins', min: 200, discount: '', emoji: '🍲' },
        { id: 11, name: 'Sushi Master', cuisine: 'Japanese', rating: 4.8, time: '45 mins', min: 250, discount: '', emoji: '🍱' },
        { id: 12, name: 'Morning Brew', cuisine: 'Cafe', rating: 4.7, time: '20 mins', min: 90, discount: '10% OFF', emoji: '☕' }
    ];

    let menuItems = [];
    initialRestaurants.forEach(r => {
        menuItems.push(
            { id: r.id*10+1, restaurantId: r.id, name: `Signature ${r.name} Special`, desc: 'Chef\'s special preparation with premium ingredients', price: 280, veg: false, emoji: r.emoji },
            { id: r.id*10+2, restaurantId: r.id, name: 'Classic Delight', desc: 'The traditional recipe passed down generations', price: 220, veg: true, emoji: '🥘' },
            { id: r.id*10+3, restaurantId: r.id, name: 'Spicy Volcano', desc: 'Extra hot and spicy for the brave ones', price: 250, veg: false, emoji: '🌶️' },
            { id: r.id*10+4, restaurantId: r.id, name: 'Healthy Choice Bowl', desc: 'Low calories, high protein, great taste', price: 310, veg: true, emoji: '🥗' },
            { id: r.id*10+5, restaurantId: r.id, name: 'Family Combo Feast', desc: 'Perfect for sharing. Serves 3-4 people', price: 799, veg: true, emoji: '🍱' },
            { id: r.id*10+6, restaurantId: r.id, name: 'Sweet Ending Dessert', desc: 'Rich, creamy and melts in your mouth', price: 150, veg: true, emoji: '🍨' }
        );
    });

    if (useMongo) {
        await Restaurant.deleteMany();
        await MenuItem.deleteMany();
        await Restaurant.insertMany(initialRestaurants);
        await MenuItem.insertMany(menuItems);
    } else {
        writeData({ restaurants: initialRestaurants, menuItems, orders: [] });
    }
    
    res.json({ message: 'Database Seeded Successfully' });
});

// Fallback to index.html for SPA
app.use((req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
