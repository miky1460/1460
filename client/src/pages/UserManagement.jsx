import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLES = ['ceo', 'admin', 'hr', 'ops_manager', 'team_lead', 'agent', 'office_manager', 'finance', 'employee'];
const ROLE_COLORS = { ceo: '#dc2626', admin: '#7c3aed', hr: '#2563eb', ops_manager: '#0891b2', team_lead: '#0d9488', agent: '#16a34a', office_manager: '#9333ea', finance: '#ca8a04', employee: '#6b7280' };

export default function UserManagement() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', employee_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    const [ur, er] = await Promise.all([
      authFetch('/api/auth/users'),
      authFetch('/api/employees'),
    ]);
    if (ur.ok) setUsers(await ur.json());
    if (er.ok) setEmployees(await er.json());
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name:'', email:'', password:'', role:'employee', employee_id:'' }); setError(''); setShowModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name:u.name, email:u.email, password:'', role:u.role, employee_id:u.employee_id||'' }); setError(''); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const body = { ...form, employee_id: form.employee_id || null };
    if (editing && !form.password) delete body.password;
    const res = await authFetch(editing ? `/api/auth/users/${editing.id}` : '/api/auth/users', {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setSuccess(editing ? 'User updated!' : 'User created!');
    setShowModal(false);
    load();
    setTimeout(() => setSuccess(''), 3000);
  };

  const remove = async (u) => {
    if (!confirm(`Delete user ${u.name}?`)) return;
    const res = await authFetch(`/api/auth/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) { load(); setSuccess('User deleted'); setTimeout(() => setSuccess(''), 3000); }
  };

  const roleLabel = (role) => ({ ceo:'👑 CEO', admin:'🔐 Admin', hr:'🧑‍💼 HR', ops_manager:'📊 Ops Manager', team_lead:'🎯 Team Lead', agent:'📞 Agent', finance:'💼 Finance', office_manager:'🏢 Office Mgr', employee:'👤 Employee' }[role] || role);

  return (
    <div>
      <div className="page-header">
        <div><h3 style={{margin:0}}>User Accounts</h3><p style={{margin:'4px 0 0',color:'#6b7280',fontSize:14}}>Manage login access for all staff</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Linked Employee</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => {
              const emp = employees.find(e => e.id === u.employee_id);
              return (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span style={{background:ROLE_COLORS[u.role],color:'white',padding:'2px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>{roleLabel(u.role)}</span></td>
                  <td>{emp ? `${emp.first_name} ${emp.last_name} (${emp.employee_id})` : <span style={{color:'#9ca3af'}}>—</span>}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => openEdit(u)} style={{marginRight:6}}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={save} className="form-grid">
                {error && <div className="alert alert-error" style={{gridColumn:'1/-1'}}>{error}</div>}
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Password {editing ? '(leave blank to keep)' : '*'}</label>
                  <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} {...(!editing&&{required:true})} placeholder={editing?'Leave blank to keep current':''} />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                    <option value="ceo">👑 CEO (All Access)</option>
                    <option value="admin">🔐 Admin (Full System Access)</option>
                    <option value="hr">🧑‍💼 HR (Manage Staff)</option>
                    <option value="ops_manager">📊 Operations Manager</option>
                    <option value="team_lead">🎯 Team Lead</option>
                    <option value="agent">📞 Agent / SDR</option>
                    <option value="finance">💼 Finance</option>
                    <option value="office_manager">🏢 Office Manager</option>
                    <option value="employee">👤 Employee (Own Data Only)</option>
                  </select>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Link to Employee (for HR/Employee roles)</label>
                  <select value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})}>
                    <option value="">— Not linked —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
                  </select>
                </div>
                <div style={{gridColumn:'1/-1',display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
