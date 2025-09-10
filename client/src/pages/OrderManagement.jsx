import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
];

export default function OrderManagement() {
  const { user, api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    trackingNumber: '',
    notes: ''
  });

  // Wrap loadOrders in useCallback to avoid missing dependency warning
  const loadOrders = useCallback(async () => {
    try {
      const data = await api('/api/orders/seller');
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
    if (user && (user.role === 'seller' || user.role === 'admin')) {
      loadOrders();
    }
  }, [user, loadOrders]);

  const handleStatusUpdate = async (orderId) => {
    try {
      const result = await api(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(updateForm)
      });

      // Update the order in the local state
      setOrders(orders.map(order =>
        order._id === orderId ? result : order
      ));

      setSelectedOrder(null);
      setUpdateForm({ status: '', trackingNumber: '', notes: '' });
      alert('Order status updated successfully!');
    } catch (error) {
      alert('Failed to update order status: ' + error.message);
    }
  };

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      notes: order.notes || ''
    });
  };

  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p className="text-gray-600">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>

      {orders.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-600">No orders found for your products</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                  <p className="text-sm text-gray-600">
                    Buyer: {order.buyerName} ({order.buyerEmail})
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                    statusOptions.find(s => s.value === order.status)?.color
                  }`}>
                    {statusOptions.find(s => s.value === order.status)?.label}
                  </div>
                  <div className="text-lg font-semibold">₹{order.totalAmount}</div>
                  <button
                    className="btn btn-primary text-sm mt-2"
                    onClick={() => openUpdateModal(order)}
                  >
                    Update Status
                  </button>
                </div>
              </div>

              {/* Order Items */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-3 p-2 bg-gray-50 rounded">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            Qty: {item.quantity} × ₹{item.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    <div>{order.shipping.name}</div>
                    <div>{order.shipping.address}</div>
                    <div>{order.shipping.phone}</div>
                  </div>

                  {order.trackingNumber && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-1">Tracking</h4>
                      <div className="text-sm text-blue-600">{order.trackingNumber}</div>
                    </div>
                  )}

                  {order.notes && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-1">Notes</h4>
                      <div className="text-sm text-gray-600">{order.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Update Order #{selectedOrder._id.slice(-8)}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="input w-full"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tracking Number (optional)</label>
                <input
                  type="text"
                  className="input w-full"
                  value={updateForm.trackingNumber}
                  onChange={(e) => setUpdateForm({...updateForm, trackingNumber: e.target.value})}
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  rows={3}
                  className="input w-full"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                  placeholder="Add any notes about this order"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn btn-primary flex-1"
                onClick={() => handleStatusUpdate(selectedOrder._id)}
              >
                Update Order
              </button>
              <button
                className="btn border border-gray-300 hover:bg-gray-50 flex-1"
                onClick={() => setSelectedOrder(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
