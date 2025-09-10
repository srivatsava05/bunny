import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const loadOrders = useCallback(async () => {
    try {
      const data = await api('/api/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const result = await api('/api/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (result) {
        alert('Profile updated successfully!');
        setEditing(false);
        // Refresh user data if needed
        window.location.reload();
      }
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p className="text-gray-600">Please login to view your profile</p>
          <Link to="/login" className="btn btn-primary mt-4">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-outline text-sm"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="input w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <div className="font-medium">{user.name}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <div className="font-medium">{user.email}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role:</span>
                <div className="font-medium capitalize">{user.role}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Member since:</span>
                <div className="font-medium">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/orders" className="btn btn-primary w-full text-left">
              View My Orders ({orders.length})
            </Link>
            {user.role === 'seller' || user.role === 'admin' ? (
              <>
                <Link to="/dashboard" className="btn btn-outline w-full text-left">
                  Seller Dashboard
                </Link>
                <Link to="/orders/manage" className="btn btn-outline w-full text-left">
                  Manage Orders
                </Link>
              </>
            ) : null}
            <Link to="/" className="btn btn-outline w-full text-left">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        {loading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-gray-600">You haven't placed any orders yet</p>
            <Link to="/" className="btn btn-primary mt-4">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order._id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      Order #{order._id.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ₹{order.totalAmount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {orders.length > 3 && (
              <Link to="/orders" className="btn btn-outline w-full">
                View All Orders ({orders.length})
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
