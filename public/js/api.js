const API_BASE_URL = '/api';

const api = {
    async getRestaurants() {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            return [];
        }
    },

    async getMenu(restaurantId) {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menu`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching menu:', error);
            return [];
        }
    },

    async placeOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    },

    async getOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },

    async seedDatabase() {
        try {
            const response = await fetch(`${API_BASE_URL}/seed`, { method: 'POST' });
            return await response.json();
        } catch (error) {
            console.error('Error seeding database:', error);
        }
    }
};

export default api;
