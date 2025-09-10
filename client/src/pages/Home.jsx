import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { getJSON } from '../api.js';

const categories = [
  { value: '', label: 'All' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'paintings', label: 'Paintings' },
  { value: 'home-decor', label: 'Home Décor' },
  { value: 'crafts', label: 'Crafts' }
];

function ProductCard({ p }) {
  const { add } = useCart();
  return (
    <div className="card group">
      <div className="relative">
        <img
          src={p.image || p.images?.[0]}
          alt={p.title}
          className="w-full h-48 object-cover transition duration-300 group-hover:scale-[1.02]"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
        />
        {p.featured && <span className="absolute top-2 left-2 badge bg-emerald-600 text-white">Featured</span>}
      </div>
      <div className="p-3">
        <div className="font-semibold line-clamp-1">{p.title}</div>
        <div className="text-sm text-gray-500">by {p.sellerName}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="font-bold">₹{p.price}</div>
          <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
            ★ {p.reviews?.length ? (p.reviews.reduce((s,r)=>s+r.rating,0)/p.reviews.length).toFixed(1) : '—'}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to={`/product/${p._id}`} className="btn border border-gray-300 hover:bg-gray-50">View</Link>
          <button className="btn btn-primary" onClick={() => add(p, 1)}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [items, setItems] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasFilters = useMemo(() => {
    return search || cat || minP || maxP;
  }, [search, cat, minP, maxP]);

  async function load() {
    setLoading(true);
    const [list, feat] = await Promise.all([
      getJSON('/api/products', { search, category: cat, minPrice: minP, maxPrice: maxP, limit: 24 }),
      getJSON('/api/products/featured')
    ]);
    setItems(list.items);
    setFeatured(feat);
    setLoading(false);
  }

  function clearFilters() {
    setSearch('');
    setCat('');
    setMinP('');
    setMaxP('');
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, cat, minP, maxP]);

  useEffect(() => {
    const searchQuery = location.state?.search || '';
    setSearch(searchQuery);
  }, [location.state?.search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <section className="mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200 p-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900">Handmade treasures by local artisans</h1>
          <p className="text-gray-700 mt-1">Discover unique jewelry, décor, paintings, and crafts—each piece tells a story.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-gray-500">Category</label>
              <select className="input w-40" value={cat} onChange={(e)=>setCat(e.target.value)}>
                {categories.map((c)=> <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Min ₹</label>
              <input className="input w-28" type="number" value={minP} onChange={(e)=>setMinP(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max ₹</label>
              <input className="input w-28" type="number" value={maxP} onChange={(e)=>setMaxP(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500">Search</label>
              <input className="input w-full" placeholder="e.g., gifts under 500, wall décor, silver ring" value={search} onChange={(e)=>setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={load}>Apply</button>
            {hasFilters && <button className="btn border border-gray-300 hover:bg-gray-50" onClick={clearFilters}>Clear Filters</button>}
          </div>
        </div>
      </section>

      {!hasFilters && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Featured Products</h2>
          {featured.length === 0 ? (
            <div className="text-sm text-gray-600">No featured items.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featured.map((p)=> <ProductCard key={p._id} p={p} />)}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Browse All</h2>
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">No products match the filters.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((p)=> <ProductCard key={p._id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
