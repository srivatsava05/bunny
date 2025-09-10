import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function Orders() {
  const { user, api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api('/api/orders');
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
      setError(error.message);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  const getStatusProgress = (status) => {
    const currentIndex = statusSteps.indexOf(status);
    return Math.max(0, (currentIndex / (statusSteps.length - 1)) * 100);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p className="text-gray-600">Please login to view your orders</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p className="text-red-600">Failed to load orders: {error}</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => {
              setError(null);
              setLoading(true);
              loadOrders();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-600">You haven't placed any orders yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Order #{order._id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                  <div className="text-lg font-semibold mt-1">₹{order.totalAmount}</div>
                </div>
              </div>

              {/* Order Progress */}
              {order.status !== 'cancelled' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    {statusSteps.map((step, index) => (
                      <span
                        key={step}
                        className={`${
                          statusSteps.indexOf(order.status) >= index ? 'text-emerald-600 font-medium' : ''
                        }`}
                      >
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                      </span>
                    ))}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getStatusProgress(order.status)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500">
                        Quantity: {item.quantity} × ₹{item.price}
                      </div>
                    </div>
                    <div className="font-semibold">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              {/* Shipping Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Shipping Address</h4>
                <div className="text-sm text-gray-600">
                  <div>{order.shipping.name}</div>
                  <div>{order.shipping.address}</div>
                  <div>{order.shipping.phone}</div>
                </div>
              </div>

              {/* Tracking Info */}
              {order.trackingNumber && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
                  </div>
                </div>
              )}

              {/* Order Notes */}
              {order.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Notes:</span> {order.notes}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
