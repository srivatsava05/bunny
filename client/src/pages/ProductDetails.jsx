import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getJSON, postJSON } from '../api.js';

const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

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

export default function ProductDetails() {
  const { id } = useParams();
  const { add } = useCart();
  const { user, api } = useAuth();
  const [p, setP] = useState(null);
  const [review, setReview] = useState({ user: '', rating: 5, comment: '' });

  useEffect(() => {
    getJSON(`/api/products/${id}`).then(setP).catch(() => setP(null));
  }, [id]);

  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  const submitReview = async (e) => {
    e.preventDefault();
    const updated = await postJSON(`/api/products/${id}/reviews`, review);
    setP(updated);
    setReview({ user: '', rating: 5, comment: '' });
  };

  if (p === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-sm text-gray-500 mb-3"><Link to="/" className="hover:underline">← Back</Link></div>
        <div className="card p-6">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="text-gray-600">The product you are looking for doesn’t exist.</p>
        </div>
      </div>
    );
  }
  if (!p) return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>;

  const imgs = (p.images && p.images.length ? p.images : (p.image ? [p.image] : []));
  console.log('Product object:', p);
  console.log('Product images array:', imgs);
  console.log('Current image index:', current);
  const avg = p.reviews?.length ? (p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1) : '—';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-sm text-gray-500 mb-3"><Link to="/" className="hover:underline">← Back</Link></div>
      <div className="grid md:grid-cols-2 gap-6 card p-4">
        <div>
          <div className="relative">
            {imgs.length === 0 && (
              <div className="w-full h-80 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
                No images available
              </div>
            )}
            {imgs.length > 0 && (
              <img
                src={imgs[current]}
                alt={p.title}
                className="w-full h-80 object-cover rounded-lg cursor-zoom-in"
                onClick={() => setLightbox({ open: true, index: current })}
                onError={(e)=>{ e.currentTarget.src='https://via.placeholder.com/800x600?text=No+Image'; }}
              />
            )}
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {imgs.map((url, idx) => (
                <button key={idx} onClick={() => setCurrent(idx)}
                        className={`h-16 w-16 rounded-md overflow-hidden border ${current===idx?'border-emerald-600':'border-gray-200'}`}>
                  <img src={url} alt={`thumb-${idx}`} className="h-full w-full object-cover"
                       onError={(e)=>{ e.currentTarget.src='https://via.placeholder.com/120?text=No'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{p.title}</h1>
          <div className="text-gray-600">by {p.sellerName}</div>
          <div className="mt-3 text-2xl font-extrabold">₹{p.price}</div>
          <div className="mt-2 text-sm"><span className="badge">{p.category}</span></div>
          <div className="mt-2 text-sm">Average rating: <b>{renderStars(Math.round(parseFloat(avg) || 0))}</b></div>
          <p className="mt-4 text-gray-700">{p.description}</p>
          <div className="mt-5 flex gap-3">
            <button className="btn btn-primary" onClick={() => add(p, 1)}>Add to Cart</button>
            <a className="btn border border-gray-300 hover:bg-gray-50" href={`mailto:seller@example.com?subject=Interested in ${encodeURIComponent(p.title)}`}>Contact Seller</a>
          </div>

          <h3 className="mt-6 font-semibold">Reviews</h3>
          <ul className="space-y-2 mt-2">
            {p.reviews?.map((r, i) => (
              <li key={i} className="border rounded p-2">
                <div className="font-medium">{r.user} — {renderStars(r.rating)}</div>
                <div className="text-sm text-gray-600">{r.comment}</div>
                {r.reply?.text && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium text-gray-800">Seller reply:</div>
                    <div className="text-gray-700">{r.reply.text}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Replied on {new Date(r.reply.repliedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {(user?.name === p.sellerName) && (user?.role === 'seller' || user?.role === 'admin') && (
                  <ReplyForm
                    productId={p._id}
                    reviewIndex={i}
                    initialText={r.reply?.text || ''}
                    onReplyUpdated={(updatedText) => {
                      const updatedReviews = [...p.reviews];
                      updatedReviews[i].reply = { text: updatedText, repliedAt: updatedText ? new Date().toISOString() : undefined };
                      setP({ ...p, reviews: updatedReviews });
                    }}
                    api={api}
                  />
                )}
              </li>
            ))}
            {!p.reviews?.length && <li className="text-sm text-gray-500">No reviews yet.</li>}
          </ul>

          <form onSubmit={submitReview} className="mt-4 space-y-2">
            <input required placeholder="Name" className="input w-full" value={review.user} onChange={(e)=>setReview({...review, user: e.target.value})} />
            <select className="input w-full" value={review.rating} onChange={(e)=>setReview({...review, rating: Number(e.target.value)})}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{renderStars(n)}</option>)}
            </select>
            <textarea required placeholder="Comment" className="input w-full" value={review.comment} onChange={(e)=>setReview({...review, comment: e.target.value})} />
            <button className="btn btn-primary">Submit Review</button>
          </form>
        </div>
      </div>

      {lightbox.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={()=>setLightbox({open:false,index:0})}>
          <img
            src={imgs[lightbox.index]}
            alt="zoom"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e)=>e.stopPropagation()}
            onError={(e)=>{ e.currentTarget.src='https://via.placeholder.com/1200x800?text=No+Image'; }}
          />
          <button className="absolute top-4 right-4 text-white text-xl" onClick={()=>setLightbox({open:false,index:0})}>✕</button>
          {imgs.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl"
                onClick={(e)=>{ e.stopPropagation(); setLightbox(s=>({ ...s, index: (s.index-1+imgs.length)%imgs.length })); }}>
                ‹
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl"
                onClick={(e)=>{ e.stopPropagation(); setLightbox(s=>({ ...s, index: (s.index+1)%imgs.length })); }}>
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
