import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, Plus, FileText, Image, CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react';

const ADMIN_PASSWORD = 'finlabs2024';
const API = 'http://localhost:3001';

const CATEGORIES = ['Finexa Feature', 'Festival', 'News', 'Trainings', 'Creatives', 'Testimonial'];
const TABS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'videos', label: 'Videos' },
];

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`admin-toast admin-toast-${type}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}

export default function AdminDashboard({ onClose, onDataChange }) {
  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem('admin_authed') === 'true';
  });
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  const [tab, setTab] = useState('whatsapp');
  const [entries, setEntries] = useState({ whatsappCreatives: [], emailTemplates: [], videos: [] });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Form state
  const [form, setForm] = useState({
    title: '', category: 'Finexa Feature', date: '', topic: '',
    subjectLine: '', videoUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/entries`);
      const data = await res.json();
      setEntries(data);
      if (onDataChange) onDataChange();
    } catch {
      addToast('Could not connect to upload server. Make sure it is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchEntries();
  }, [authed]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      localStorage.setItem('admin_authed', 'true');
      setPwError('');
    } else {
      setPwError('Incorrect password. Try again.');
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      addToast('Title and Date are required.', 'error');
      return;
    }
    if (tab !== 'videos' && !selectedFile && !form.videoUrl) {
      addToast('Please select a file to upload.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let filePath = '';

      // 1. Upload file if selected
      if (selectedFile) {
        const fd = new FormData();
        fd.append('file', selectedFile);
        const uploadRes = await fetch(`${API}/api/upload`, { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error(uploadData.error);
        filePath = uploadData.path;
      }

      // 2. Build the entry object
      const isImage = selectedFile && selectedFile.type.startsWith('image/');
      const isDoc = selectedFile && !isImage;

      const entry = {
        id: `${tab === 'whatsapp' ? 'wa' : tab === 'email' ? 'em' : 'vid'}-${Date.now()}`,
        title: form.title,
        category: form.category,
        date: form.date,
        topic: form.topic,
      };

      if (tab === 'videos') {
        entry.videoUrl = form.videoUrl;
        entry.thumbnail = '';
      } else if (tab === 'email') {
        entry.subjectLine = form.subjectLine;
        if (isImage) entry.image = filePath;
        else if (isDoc) entry.file = filePath;
      } else {
        if (isImage) entry.image = filePath;
        else if (isDoc) entry.file = filePath;
      }

      // 3. Add to mockData.js
      const addRes = await fetch(`${API}/api/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab, entry }),
      });
      const addData = await addRes.json();
      if (!addData.success) throw new Error(addData.error);

      addToast(`"${form.title}" added successfully!`);
      // Reset form
      setForm({ title: '', category: 'Finexa Feature', date: '', topic: '', subjectLine: '', videoUrl: '' });
      setSelectedFile(null);
      setFilePreview(null);
      fetchEntries();
      
      // Auto-close modal after 1.2s so they can see the success toast message
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      addToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`${API}/api/delete-entry/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      addToast('Entry deleted successfully.');
      fetchEntries();
    } catch (err) {
      addToast(err.message || 'Delete failed.', 'error');
    }
  };

  const currentEntries = tab === 'whatsapp'
    ? (entries.whatsappCreatives || [])
    : tab === 'email'
      ? (entries.emailTemplates || [])
      : (entries.videos || []);

  // ── Password Gate ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="admin-overlay">
        <div className="admin-login-card animate-fade-in">
          <button className="modal-close" onClick={onClose}><X size={22} /></button>
          <div className="admin-login-icon"><Lock size={28} /></div>
          <h2 className="modal-title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Admin Access</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Enter the admin password to manage content
          </p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter admin password"
                value={pwInput}
                onChange={e => setPwInput(e.target.value)}
                autoFocus
              />
              {pwError && <p className="admin-field-error">{pwError}</p>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="admin-overlay">
      {/* Toast notifications */}
      <div className="admin-toasts">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <div className="admin-panel animate-fade-in">
        {/* Header */}
        <div className="admin-panel-header">
          <div>
            <h2 className="admin-panel-title">Admin Dashboard</h2>
            <p className="admin-panel-subtitle">Upload and manage content</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button
              onClick={() => {
                setAuthed(false);
                localStorage.removeItem('admin_authed');
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              Logout
            </button>
            <button className="modal-close admin-close-btn" style={{ position: 'static' }} onClick={onClose}><X size={22} /></button>
          </div>
        </div>

        {/* Tab selector */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-body">
          {/* ── Upload Form ── */}
          <div className="admin-upload-section">
            <h3 className="admin-section-title"><Plus size={18} /> Add New {tab === 'whatsapp' ? 'Creative' : tab === 'email' ? 'Template' : 'Video'}</h3>

            <form onSubmit={handleSubmit} className="admin-form">
              {/* File Upload (not for videos) */}
              {tab !== 'videos' && (
                <div className="form-group">
                  <label className="form-label">File (Image or Document)</label>
                  <div
                    className={`admin-dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif,.webp,.docx,.pdf,.doc"
                      style={{ display: 'none' }}
                      onChange={e => handleFileSelect(e.target.files[0])}
                    />
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="admin-file-preview-img" />
                    ) : selectedFile ? (
                      <div className="admin-file-info">
                        <FileText size={36} color="var(--accent-primary)" />
                        <span>{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="admin-dropzone-placeholder">
                        <Upload size={32} color="var(--accent-primary)" style={{ opacity: 0.6 }} />
                        <span>Drag & drop or click to select</span>
                        <small>PNG, JPG, DOCX, PDF — max 50MB</small>
                      </div>
                    )}
                  </div>
                  {selectedFile && (
                    <button type="button" className="admin-clear-file" onClick={() => { setSelectedFile(null); setFilePreview(null); }}>
                      <X size={14} /> Remove file
                    </button>
                  )}
                </div>
              )}

              {/* Video URL */}
              {tab === 'videos' && (
                <div className="form-group">
                  <label className="form-label">YouTube URL</label>
                  <input type="url" className="form-input" placeholder="https://www.youtube.com/watch?v=..." value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} />
                </div>
              )}

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Finexa Feature Update" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>

              {/* Email subject line */}
              {tab === 'email' && (
                <div className="form-group">
                  <label className="form-label">Subject Line</label>
                  <input type="text" className="form-input" placeholder="Email subject line" value={form.subjectLine} onChange={e => setForm({ ...form, subjectLine: e.target.value })} />
                </div>
              )}

              {/* Category + Date row */}
              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>

              {/* Topic */}
              <div className="form-group">
                <label className="form-label">Topic</label>
                <input type="text" className="form-input" placeholder="e.g. Product Updates" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
              </div>

              <button type="submit" className="btn btn-primary admin-submit-btn" disabled={submitting}>
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : <><Plus size={18} /> Add to Library</>}
              </button>
            </form>
          </div>

          {/* ── Existing Entries Table ── */}
          <div className="admin-entries-section">
            <h3 className="admin-section-title">
              <Image size={18} />
              Existing {tab === 'whatsapp' ? 'Creatives' : tab === 'email' ? 'Templates' : 'Videos'}
              <span className="admin-count-badge">{currentEntries.length}</span>
            </h3>
            {loading ? (
              <div className="admin-loading"><Loader2 size={28} className="animate-spin" /></div>
            ) : currentEntries.length === 0 ? (
              <div className="admin-empty">No entries yet in this section</div>
            ) : (
              <div className="admin-entries-list">
                {currentEntries.map(item => (
                  <div key={item.id} className="admin-entry-row">
                    <div className="admin-entry-thumb">
                      {item.image ? (
                        <img src={item.image} alt={item.title} />
                      ) : (
                        <div className="admin-entry-thumb-placeholder">
                          <FileText size={20} color="var(--accent-primary)" />
                        </div>
                      )}
                    </div>
                    <div className="admin-entry-info">
                      <span className="admin-entry-title">{item.title}</span>
                      <span className="admin-entry-meta">{item.category} · {item.date}</span>
                    </div>
                    <button
                      className="admin-delete-btn"
                      onClick={() => handleDelete(item.id)}
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
