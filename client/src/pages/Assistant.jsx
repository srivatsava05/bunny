// client/src/pages/Assistant.jsx

import { useState } from 'react';
import { recommendQueryToFiltersV3_AI } from '../utils/ai';
import { getJSON } from '../api';
import { useCart } from '../context/CartContext.jsx';
import { Link } from 'react-router-dom';

function ProductCard({ p }) {
  const { add } = useCart();
  const avg = p.reviews?.length ? (p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1) : '—';
  return (
    <div className="card group">
      <div className="relative">
        <img src={p.image || p.images?.[0]} alt={p.title}
             className="w-full h-48 object-cover transition duration-300 group-hover:scale-[1.02]"
             onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }} />
        {p.featured && <span className="absolute top-2 left-2 badge bg-emerald-600 text-white">Featured</span>}
      </div>
      <div className="p-3">
        <div className="font-semibold line-clamp-1">{p.title}</div>
        <div className="text-sm text-gray-500">by {p.sellerName}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="font-bold">₹{p.price}</div>
          <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">★ {avg}</div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to={`/product/${p._id}`} className="btn border border-gray-300 hover:bg-gray-50">View</Link>
          <button className="btn btn-primary" onClick={() => add(p, 1)}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

export default function Assistant() {
  const [q, setQ] = useState('');
  const [result, setResult] = useState({ items: [], busy: false, error: '' });
  const [lastFilters, setLastFilters] = useState(null);

  async function ask(e) {
    e?.preventDefault?.();
    setResult((r) => ({ ...r, busy: true, error: '' }));
    try {
      const filters = await recommendQueryToFiltersV3_AI(q);
      setLastFilters(filters);
      
      const data = await getJSON('/api/products', {
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        search: filters.search,
        limit: 24
      });

      if (data.items.length === 0 && filters.category) {
        const data2 = await getJSON('/api/products', {
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          search: filters.search,
          limit: 24
        });
        setResult({ items: data2.items, busy: false, error: '' });
      } else {
        setResult({ items: data.items, busy: false, error: '' });
      }
    } catch (err) {
      console.error("Error during assistant search:", err);
      setResult({ items: [], busy: false, error: 'Failed to fetch products' });
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-3">Shopping Assistant</h1>
      <form onSubmit={ask} className="flex gap-2">
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="e.g., silver minimalist ring under 1000 for her; eco bamboo home decor for housewarming"
          className="input flex-1"
        />
        <button className="btn btn-primary" disabled={result.busy}>
            {result.busy ? 'Thinking...' : 'Recommend'}
        </button>
      </form>

      {lastFilters && (
        <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-2">
          <span className="badge">{lastFilters.category || 'any category'}</span>
          {lastFilters.minPrice != null && <span className="badge">≥ ₹{lastFilters.minPrice}</span>}
          {lastFilters.maxPrice != null && <span className="badge">≤ ₹{lastFilters.maxPrice}</span>}
          {lastFilters._facets?.materials?.map(m => <span key={`m-${m}`} className="badge">{m}</span>)}
          {lastFilters._facets?.styles?.map(s => <span key={`s-${s}`} className="badge">{s}</span>)}
          {lastFilters._facets?.audience?.map(a => <span key={`a-${a}`} className="badge">{a}</span>)}
          {lastFilters._facets?.occasion?.map(o => <span key={`o-${o}`} className="badge">{o}</span>)}
          {lastFilters._facets?.eco?.map(e => <span key={`e-${e}`} className="badge">{e}</span>)}
          {lastFilters.search && <span className="badge">“{lastFilters.search}”</span>}
        </div>
      )}

      {result.busy && <div className="mt-4 text-sm text-gray-600">Finding items…</div>}
      {result.error && <div className="mt-4 text-sm text-red-600">{result.error}</div>}

      {!result.busy && !result.error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {result.items.map((p) => <ProductCard key={p._id} p={p} />)}
          {result.items.length === 0 && lastFilters && <div className="col-span-full text-sm text-gray-600">No matching products found. Try a different search.</div>}
        </div>
      )}
    </div>
  );
}