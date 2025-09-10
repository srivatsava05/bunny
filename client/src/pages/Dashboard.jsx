// client/src/pages/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getJSON } from '../api';
import { generateProductDescriptionV3_AI } from '../utils/ai';
import { useAuth } from '../context/AuthContext.jsx';

const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

const blank = {
  title: '',
  description: '',
  featuresText: '',
  price: '',
  image: '',
  moreImages: '',
  category: 'jewelry',
  sellerName: '',
  featured: false,
  specJson: ''
};

function splitToUrls(s='') {
  return s.split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
}

function ReplyForm({ productId, reviewIndex, initialText, onReplyUpdated, api }) {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);

  const submitReply = async () => {
    setLoading(true);
    try {
      await api(`/api/products/${productId}/reviews/${reviewIndex}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ text: text.trim() })
      });
      onReplyUpdated(text.trim());
    } catch (err) {
      alert('Error updating reply: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="mt-2">
      <textarea className="input w-full" rows={2} placeholder="Write a reply..." value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2 mt-1">
        <button className="btn btn-primary" onClick={submitReply} disabled={loading}>{loading ? 'Saving...' : 'Reply'}</button>
        {text && <button className="btn border border-gray-300 hover:bg-gray-50" onClick={() => setText('')}>Clear</button>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [tone, setTone] = useState('warm');
  const [reviewsProduct, setReviewsProduct] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { api, user } = useAuth();

  async function load() {
    setLoading(true);
    const res = await getJSON('/api/products', { limit: 100, sort: '-createdAt' });
    const userProducts = res.items.filter(p => p.sellerName === user.name);
    setItems(userProducts);
    setLoading(false);
  }
  useEffect(() => { if (user) { load(); } }, [user]);

  const reset = () => {
    setForm({ ...blank, sellerName: user.name });
    setEditingId(null);
  };

  async function submit(e) {
    e.preventDefault();
    const images = [form.image, ...splitToUrls(form.moreImages)].filter(Boolean);
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      sellerName: user.name,
      featured: !!form.featured,
      images,
      image: images[0] || ''
    };
    try {
      if (editingId) {
        await api(`/api/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      reset();
      load();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  }

  async function del(id) {
    if (!confirm('Delete this product?')) return;
    const res = await api(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Delete failed');
    load();
  }

  function edit(p) {
    setEditingId(p._id);
    const more = (p.images || []).slice(1).join('\n');
    setForm({
      title: p.title,
      description: p.description,
      featuresText: '',
      price: p.price,
      image: p.image || (p.images?.[0] || ''),
      moreImages: more,
      category: p.category,
      sellerName: p.sellerName,
      featured: !!p.featured,
      specJson: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function autoDesc() {
    setIsGenerating(true);
    try {
      let spec = {};
      try { spec = form.specJson ? JSON.parse(form.specJson) : {}; } catch {}
      
      const materials = spec.materials || (
        form.title.toLowerCase().includes('bamboo') ? ['bamboo'] :
        form.title.toLowerCase().includes('silver') ? ['sterling silver'] : []
      );

      const productData = {
        title: form.title || 'Handmade piece',
        category: form.category,
        materials,
        tone,
        useCase: spec.useCase || 'gifting or home décor',
        keywords: ['handcrafted', 'artisan', 'eco-friendly'],
        spec,
      };

      const { description, features } = await generateProductDescriptionV3_AI(productData);
      
      setForm((f) => ({ ...f, description, featuresText: (features || []).join('\n') }));
    } catch (error) {
        alert('Failed to generate AI description. Please try again. Error: ' + error.message);
    } finally {
        setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <nav className="flex justify-end mb-4 gap-4">
        {user ? (
          <>
            <NavLink to="/profile" className="btn btn-outline">Profile</NavLink>
            {(user.role === 'seller' || user.role === 'admin') && (
              <NavLink to="/orders/manage" className="btn btn-primary">Manage Orders</NavLink>
            )}
            <button className="btn border border-gray-300 hover:bg-gray-50" onClick={() => api('/api/auth/logout')}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" className="btn btn-primary">Login</NavLink>
        )}
      </nav>
      {(user?.role !== 'seller' && user?.role !== 'admin') && (
        <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          You are logged in as a {user?.role || 'guest'}. Only sellers can add or edit products.
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Seller Dashboard</h1>

      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 card p-4 mb-6">
        <input required placeholder="Title" className="input" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} />
        <input required placeholder="Primary Image URL" className="input" value={form.image} onChange={(e)=>setForm({...form, image:e.target.value})} />
        <input required type="number" placeholder="Price (₹)" className="input" value={form.price} onChange={(e)=>setForm({...form, price:e.target.value})} />
        <select className="input" value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})}>
          <option value="jewelry">Jewelry</option>
          <option value="paintings">Paintings</option>
          <option value="home-decor">Home Décor</option>
          <option value="crafts">Crafts</option>
          <option value="stationery">Stationery</option>
          <option value="pottery">Pottery</option>
          <option value="textiles">Textiles</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e)=>setForm({...form, featured:e.target.checked})} />
          Featured
        </label>
        <textarea placeholder="More Image URLs (comma or newline separated)" className="input md:col-span-2" rows={2}
          value={form.moreImages} onChange={(e)=>setForm({...form, moreImages:e.target.value})} />
        <textarea placeholder='Spec (JSON: { "materials": ["wood"], "dimensions": "10x12cm" })'
          className="input md:col-span-2" rows={3}
          value={form.specJson} onChange={(e)=>setForm({...form, specJson:e.target.value})} />
        <textarea required placeholder="Description" className="input md:col-span-2" rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
        <textarea placeholder="Features (optional, one per line)" className="input md:col-span-2" rows={3} value={form.featuresText} onChange={(e)=>setForm({...form, featuresText:e.target.value})} />
        <div className="flex items-center gap-2">
          <select className="input" value={tone} onChange={(e)=>setTone(e.target.value)}>
            <option value="warm">Warm</option>
            <option value="luxury">Luxury</option>
            <option value="playful">Playful</option>
            <option value="earthy">Earthy</option>
          </select>
          <button type="button" className="btn border border-gray-300 hover:bg-gray-50" onClick={autoDesc} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Auto-generate Description'}
          </button>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary">{editingId ? 'Update' : 'Add'} Product</button>
          {editingId && <button type="button" className="btn border border-gray-300 hover:bg-gray-50" onClick={reset}>Cancel</button>}
        </div>
      </form>

      {reviewsProduct && (
        <div className="mb-6 card p-4">
          {/* (Review JSX unchanged) */}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Your Products</h2>
      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600">No products yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p._id} className="card">
              <img src={p.image || p.images?.[0]} alt={p.title} className="h-40 w-full object-cover"
                   onError={(e)=>{ e.currentTarget.src='https://via.placeholder.com/400x300?text=No+Image'; }} />
              <div className="p-3">
                <div className="font-semibold line-clamp-1">{p.title}</div>
                <div className="text-sm text-gray-500">₹{p.price} • {p.category}</div>
                <div className="mt-2 flex gap-2">
                  <button className="btn border border-gray-300 hover:bg-gray-50" onClick={() => edit(p)}>Edit</button>
                  <button className="btn border border-gray-300 hover:bg-gray-50" onClick={() => del(p._id)}>Delete</button>
                  <button className="btn border border-gray-300 hover:bg-gray-50" onClick={() => setReviewsProduct(p)}>Reviews</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}