import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderManagement from './pages/OrderManagement.jsx';
import Profile from './pages/Profile.jsx';
import Assistant from './pages/Assistant.jsx';
import { CartProvider, useCart } from './context/CartContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Navbar() {
  const { totals } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleSearchSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('search') || '';
    // Navigate to home with search query as state or param
    navigate('/', { state: { search: query } });
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <NavLink to="/" className="font-extrabold text-xl tracking-tight text-emerald-700">Craftify</NavLink>
        <form className="flex-1 max-w-xl" onSubmit={handleSearchSubmit}>
          <input name="search" className="input w-full" placeholder="Search handmade products..." />
        </form>
        <nav className="flex items-center gap-3 text-sm">
          {(user?.role === 'seller' || user?.role === 'admin') && (
            <NavLink to="/dashboard" className="hover:underline">Seller</NavLink>
          )}
          <NavLink to="/assistant" className="hover:underline">Assistant</NavLink>
          <NavLink to="/cart" className="hover:underline relative">
            Cart
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-emerald-600 text-white">
              {totals.count}
            </span>
          </NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className="hover:underline">Profile</NavLink>
              <span className="text-gray-600">Hi, {user.name.split(' ')}</span>
              <button className="btn border border-gray-300 hover:bg-gray-50" onClick={logout}>Logout</button>
            </>
          ) : (
            <NavLink to="/login" className="hover:underline">Login</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex justify-between">
        <div>© {new Date().getFullYear()} Craftify</div>
        <div className="flex gap-4"><a className="hover:underline">Privacy</a><a className="hover:underline">Terms</a></div>
      </div>
    </footer>
  );
}

function App() {
  const location = useLocation();
  const state = location.state || {};
  const searchFromState = state.search || '';

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-full flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/dashboard" element={
                <ProtectedRoute roles={['seller','admin']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute roles={['buyer','seller','admin']}>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/orders/manage" element={
                <ProtectedRoute roles={['seller','admin']}>
                  <OrderManagement />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute roles={['buyer','seller','admin']}>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute roles={['buyer','seller','admin']}>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={<Cart />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
