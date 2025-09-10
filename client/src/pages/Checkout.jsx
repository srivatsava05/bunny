import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { postJSON } from '../api.js';

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    name: user?.name || '',
    address: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(({ product, qty }) => ({
          productId: product.id || product._id,
          quantity: qty
        })),
        shipping,
        paymentMethod,
        notes: ''
      };

      const result = await api('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
      setOrder(result);
      clear(); // Clear cart after successful order
    } catch (error) {
      alert('Failed to place order: ' + error.message);
    }
    setLoading(false);
  };

  if (order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-green-700">Order Placed Successfully!</h1>
          <p className="text-gray-600 mt-2">Order ID: <span className="font-mono font-semibold">{order._id}</span></p>
          <p className="text-sm text-gray-500 mt-1">
            Total: ₹{order.totalAmount} • Status: {order.status}
          </p>
          <div className="mt-6 space-y-2">
            <button
              className="btn btn-primary w-full"
              onClick={() => navigate('/orders')}
            >
              View My Orders
            </button>
            <button
              className="btn border border-gray-300 hover:bg-gray-50 w-full"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p className="text-gray-600">Your cart is empty</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => navigate('/')}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map(({ product, qty }) => (
              <div key={product.id || product._id} className="flex gap-3">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="font-medium">{product.title}</div>
                  <div className="text-sm text-gray-500">Qty: {qty} × ₹{product.price}</div>
                </div>
                <div className="font-semibold">₹{product.price * qty}</div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>₹{totals.subtotal}</span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping & Payment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                className="input w-full"
                value={shipping.name}
                onChange={(e) => setShipping({...shipping, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                required
                rows={3}
                className="input w-full"
                placeholder="Full address including city, state, pincode"
                value={shipping.address}
                onChange={(e) => setShipping({...shipping, address: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                required
                className="input w-full"
                value={shipping.phone}
                onChange={(e) => setShipping({...shipping, phone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  Credit/Debit Card (Simulated)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  UPI (Simulated)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  Cash on Delivery
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Processing...' : `Pay ₹${totals.subtotal}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
