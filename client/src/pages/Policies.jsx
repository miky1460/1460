import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const CATEGORIES = ['Attendance', 'Leave', 'Conduct', 'Compensation', 'Recruitment', 'Compliance', 'Safety', 'IT', 'General'];

const CAT_ICONS = {
  Attendance: '📅', Leave: '🏖️', Conduct: '⚖️', Compensation: '💰',
  Recruitment: '👥', Compliance: '🔒', Safety: '🦺', IT: '💻', General: '📌',
};

const token = () => localStorage.getItem('token');

const apiFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { Authorization: `Bearer ${token()}`, ...opts.headers } });

export default function Policies() {
  const { isHR, isAdmin, isCEO } = useAuth();
  const canManage = isHR || isAdmin || isCEO;

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [policyFile, setPolicyFile] = useState(null);
  const [form, setForm] = useState({
    title: '', category: 'General', description: '', content: '', version: '1.0', effective_date: '', status: 'active',
  });

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat) params.append('category', filterCat);
    const res = await apiFetch(`/api/policies?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPolicies(data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterCat]);

  const openAdd = () => {
    setEditPolicy(null);
    setForm({ title: '', category: 'General', description: '', content: '', version: '1.0', effective_date: '', status: 'active' });
    setPolicyFile(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPolicy(p);
    setForm({
      title: p.title, category: p.category, description: p.description || '',
      content: p.content || '', version: p.version || '1.0',
      effective_date: p.effective_date || '', status: p.status,
    });
    setPolicyFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (policyFile) fd.append('file', policyFile);

    const url = editPolicy ? `/api/policies/${editPolicy.id}` : '/api/policies';
    const method = editPolicy ? 'PUT' : 'POST';
    const res = await fetch(`${API}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token()}` },
      body: fd,
    });
    if (res.ok) {
      setShowModal(false);
      load();
    } else {
      const err = await res.json();
      alert(err.error || 'Error saving policy');
    }
  };

  const deletePolicy = async (id) => {
    if (!window.confirm('Delete this policy?')) return;
    await apiFetch(`/api/policies/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = policies.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(p => p.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const otherCats = [...new Set(filtered.filter(p => !CATEGORIES.includes(p.category)).map(p => p.category))];
  otherCats.forEach(cat => { grouped[cat] = filtered.filter(p => p.category === cat); });

  const fileUrl = (filename) => `${API}/uploads/policies/${filename}`;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>HR Policy Playbook</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>All company policies, guidelines, and procedures</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openAdd}>+ Add Policy</button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: '14px 16px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb' }}>{policies.length}</div>
          <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>Total Policies</div>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '14px 16px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>{policies.filter(p => p.status === 'active').length}</div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Active</div>
        </div>
        <div style={{ background: '#fefce8', borderRadius: 12, padding: '14px 16px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#ca8a04' }}>{[...new Set(policies.map(p => p.category))].length}</div>
          <div style={{ fontSize: 12, color: '#ca8a04', fontWeight: 600 }}>Categories</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <input placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {(filterCat || search) && (
          <button onClick={() => { setFilterCat(''); setSearch(''); }}
            style={{ padding: '8px 14px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16 }}>No policies found</div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{CAT_ICONS[cat] || '📌'}</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{cat}</h3>
              <span style={{ background: '#e5e7eb', borderRadius: 20, padding: '1px 10px', fontSize: 12, color: '#6b7280' }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(p => (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Policy Header */}
                  <div
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</span>
                        <span style={{
                          background: p.status === 'active' ? '#dcfce7' : '#f3f4f6',
                          color: p.status === 'active' ? '#16a34a' : '#6b7280',
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        }}>
                          {p.status === 'active' ? '● Active' : '○ Inactive'}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>v{p.version}</span>
                        {p.effective_date && <span style={{ fontSize: 11, color: '#9ca3af' }}>Effective: {p.effective_date}</span>}
                      </div>
                      {p.description && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{p.description}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                      {canManage && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                            style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deletePolicy(p.id); }}
                            style={{ padding: '4px 8px', background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            ✕
                          </button>
                        </>
                      )}
                      <span style={{ fontSize: 16, color: '#9ca3af', transition: 'transform 0.2s', display: 'inline-block', transform: expanded === p.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>
                  </div>

                  {/* Policy Content (expanded) */}
                  {expanded === p.id && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 18px', background: '#fafafa' }}>
                      {p.content ? (
                        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                          {p.content}
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: 13 }}>No content text added.</div>
                      )}
                      {p.file_filename && (
                        <div style={{ marginTop: 16, background: '#eff6ff', borderRadius: 8, padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>📎</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.file_original_name || 'Attached Document'}</div>
                            <a href={fileUrl(p.file_filename)} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Open / Download Document</a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>{editPolicy ? 'Edit Policy' : 'Add New Policy'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Policy Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} placeholder="e.g. Attendance & Punctuality Policy" />
                </div>
                <div>
                  <label style={lbl}>Category *</label>
                  <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Version</label>
                  <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} style={inp} placeholder="1.0" />
                </div>
                <div>
                  <label style={lbl}>Effective Date</label>
                  <input type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Draft</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Short Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} placeholder="Brief description of this policy" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Policy Content (full text)</label>
                  <textarea rows={10} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                    placeholder="Write the full policy text here. Each rule on a new line..." />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Attach Document (PDF, DOC optional)</label>
                  <input type="file" accept=".pdf,.doc,.docx,.txt"
                    onChange={e => setPolicyFile(e.target.files[0])}
                    style={{ ...inp, padding: '6px' }} />
                  {editPolicy?.file_original_name && !policyFile && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Current: {editPolicy.file_original_name}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editPolicy ? 'Save Changes' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
