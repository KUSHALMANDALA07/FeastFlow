const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

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
    try {
        const initialRestaurants = [
            { id: 1, name: 'Spice Garden', cuisine: 'North Indian', rating: 4.3, time: '30 mins', min: 150, discount: '35% OFF', emoji: '🍛' },
            { id: 2, name: 'Tokyo Bites', cuisine: 'Japanese', rating: 4.7, time: '40 mins', min: 200, discount: '10% OFF', emoji: '🍣' },
            { id: 3, name: 'Burger Republic', cuisine: 'American', rating: 4.5, time: '25 mins', min: 100, discount: '20% OFF', emoji: '🍔' },
            { id: 4, name: 'Pizza Nova', cuisine: 'Italian', rating: 4.2, time: '35 mins', min: 120, discount: 'Buy 1 Get 1', emoji: '🍕' },
            { id: 5, name: 'Green Bowl', cuisine: 'Healthy', rating: 4.8, time: '20 mins', min: 180, discount: '15% OFF', emoji: '🥗' },
            { id: 6, name: 'Taco Fiesta', cuisine: 'Mexican', rating: 4.4, time: '30 mins', min: 130, discount: 'Free Taco', emoji: '🌮' },
            { id: 7, name: 'Noodle Ninja', cuisine: 'Chinese', rating: 4.6, time: '35 mins', min: 150, discount: 'FREE DELIVERY', emoji: '🍜' },
            { id: 8, name: 'Sweet Tooth', cuisine: 'Desserts', rating: 4.9, time: '15 mins', min: 80, discount: '5% OFF', emoji: '🍰' },
            { id: 9, name: 'Chai & Chat', cuisine: 'Street Food', rating: 4.5, time: '15 mins', min: 50, discount: '10% OFF', emoji: '🥨' }
        ];

        const allFoodPool = [
            { name: 'Butter Chicken', desc: 'Creamy tomato-based curry with chicken', price: 380, veg: false, emoji: '🍗', cat: 'Indian' },
            { name: 'Paneer Tikka', desc: 'Grilled spiced cottage cheese', price: 280, veg: true, emoji: '🧀', cat: 'Indian' },
            { name: 'Hyderabadi Biryani', desc: 'Aromatic basmati rice', price: 350, veg: false, emoji: '🥘', cat: 'Indian' },
            { name: 'Veg Hakka Noodles', desc: 'Stir-fried noodles with veg', price: 190, veg: true, emoji: '🍜', cat: 'Noodles' },
            { name: 'Chicken Manchurian', desc: 'Spicy soy-based gravy', price: 260, veg: false, emoji: '🍲', cat: 'Chinese' },
            { name: 'Dim Sums', desc: 'Steamed dumplings', price: 220, veg: true, emoji: '🥟', cat: 'Dumplings' },
            { name: 'Pani Puri', desc: 'Crispy hollow puris with spiced water', price: 60, veg: true, emoji: '🍢', cat: 'Street Food' },
            { name: 'Vada Pav', desc: 'Mumbai style spicy potato slider', price: 40, veg: true, emoji: '🍔', cat: 'Street Food' },
            { name: 'Margherita Pizza', desc: 'Classic cheese and tomato basil', price: 299, veg: true, emoji: '🍕', cat: 'Pizza' },
            { name: 'Alfredo Pasta', desc: 'Creamy white sauce pasta', price: 320, veg: true, emoji: '🍝', cat: 'Continental' },
            { name: 'Classic Cheeseburger', desc: 'Juicy patty with melted cheddar', price: 240, veg: false, emoji: '🍔', cat: 'Burgers' },
            { name: 'French Fries', desc: 'Golden crispy potato strips', price: 120, veg: true, emoji: '🍟', cat: 'Street Food' },
            { name: 'Smoked BBQ Wings', desc: 'Slow-cooked in hickory sauce', price: 350, veg: false, emoji: '🍖', cat: 'BBQ' },
            { name: 'Pulled Pork Sandwich', desc: 'Tender pork in brioche bun', price: 420, veg: false, emoji: '🥪', cat: 'Sandwiches' },
            { name: 'Salmon Sushi', desc: 'Fresh salmon on vinegared rice', price: 580, veg: false, emoji: '🍣', cat: 'Sushi' },
            { name: 'Grilled Prawns', desc: 'Garlic butter grilled prawns', price: 650, veg: false, emoji: '🍤', cat: 'Seafood' },
            { name: 'Croissant', desc: 'Buttery flaky French pastry', price: 150, veg: true, emoji: '🥐', cat: 'Bakery' },
            { name: 'Double Chocolate Brownie', desc: 'Fudgy and rich', price: 180, veg: true, emoji: '🍰', cat: 'Desserts' },
            { name: 'Gelato Scoop', desc: 'Authentic Italian ice cream', price: 120, veg: true, emoji: '🍦', cat: 'Ice Cream' },
            { name: 'Latte', desc: 'Rich espresso with steamed milk', price: 210, veg: true, emoji: '☕', cat: 'Coffee' },
            { name: 'Iced Tea', desc: 'Refreshing lemon iced tea', price: 90, veg: true, emoji: '🥤', cat: 'Drinks' }
        ];

        let menuItems = [];
        let idCounter = 1;
        
        initialRestaurants.forEach(r => {
            // Give each restaurant a subset of relevant food items based on their cuisine
            allFoodPool.forEach(m => {
                if (r.cuisine.includes(m.cat) || Math.random() > 0.7) {
                    menuItems.push({
                        id: idCounter++,
                        restaurantId: r.id,
                        name: m.name,
                        desc: m.desc,
                        price: m.price,
                        veg: m.veg,
                        emoji: m.emoji,
                        cat: m.cat
                    });
                }
            });
        });

        if (useMongo) {
            await Restaurant.deleteMany();
            await MenuItem.deleteMany();
            await Restaurant.insertMany(initialRestaurants);
            await MenuItem.insertMany(menuItems);
        } else {
            writeData({ restaurants: initialRestaurants, menuItems, orders: [] });
        }
        
        res.json({ message: `Database Seeded Successfully with ${initialRestaurants.length} restaurants and ${menuItems.length} food items!` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// For any other route, send a message (React will be served by Vite in dev)
app.get('/', (req, res) => {
    res.json({ message: 'GlassEats API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
