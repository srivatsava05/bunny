import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Cart() {
  const { items, updateQty, remove, totals } = useCart();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      {items.length === 0 ? (
        <div className="card p-6">
          <p className="text-gray-600">Cart is empty.</p>
          <Link to="/" className="btn btn-primary mt-3 inline-block">Browse products</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {items.map(({ product, qty }) => (
              <div key={product._id} className="card p-3 flex gap-3">
                <img src={product.image} alt={product.title} className="w-24 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <div className="font-semibold">{product.title}</div>
                  <div className="text-sm text-gray-500">₹{product.price}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="btn border border-gray-300 hover:bg-gray-50"
                      onClick={() => updateQty(product._id, qty - 1)}
                      disabled={qty <= 1}
                    >
                      -
                    </button>
                    <span className="px-3">{qty}</span>
                    <button
                      className="btn border border-gray-300 hover:bg-gray-50"
                      onClick={() => updateQty(product._id, qty + 1)}
                    >
                      +
                    </button>
                    <button
                      className="btn border border-gray-300 hover:bg-gray-50"
                      onClick={() => remove(product._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4">
            <div className="font-semibold mb-2">Order Summary</div>
            <div className="flex justify-between text-sm mb-1">
              <span>Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold mb-4">
              <span>Total</span>
              <span>₹{totals.subtotal}</span>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
