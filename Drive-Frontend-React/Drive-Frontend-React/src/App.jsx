import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { Icon, typeColor } from './icons.jsx';

const MAX_BYTES = 10 * 1024 * 1024; // same limit as the backend
const fmtSize = n => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const fmtDate = iso => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
const savedView = () => { try { return localStorage.getItem('driveView') === 'grid' ? 'grid' : 'list'; } catch { return 'list'; } };

function NewFolderDialog({ parentId, onClose, onDone }) {
  const [name, setName] = useState('Untitled folder');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n || n.length > 255 || /[\\/]/.test(n) || n === '.' || n === '..') {
      setError('Enter a name up to 255 characters, without / or \\.');
      return;
    }
    setBusy(true);
    try { await api.createFolder(n, parentId); onDone(); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="dialog" onSubmit={submit} onMouseDown={e => e.stopPropagation()} onKeyDown={e => e.key === 'Escape' && onClose()}>
        <h2>New folder</h2>
        <input autoFocus value={name} onChange={e => { setName(e.target.value); setError(''); }} onFocus={e => e.target.select()} aria-label="Folder name" />
        <p className="err">{error}</p>
        <div className="dlg-actions">
          <button type="button" className="text-btn" onClick={onClose}>Cancel</button>
          <button className="text-btn strong" disabled={busy}>Create</button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState([{ id: null, name: 'My Drive' }]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState('');
  const [view, setView] = useState(savedView);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [toast, setToast] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);
  const folderId = path[path.length - 1].id;

  const notify = useCallback((msg, bad = false) => {
    setToast({ msg, bad });
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => setToast(null), bad ? 5000 : 2500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.list(folderId)); setOffline(false); }
    catch (e) { setItems([]); if (e.offline) setOffline(true); else notify(e.message, true); }
    finally { setLoading(false); }
  }, [folderId, notify]);

  useEffect(() => { load(); setSelected(null); setQuery(''); }, [load]);
  useEffect(() => { try { localStorage.setItem('driveView', view); } catch { /* ignore */ } }, [view]);
  useEffect(() => {
    if (!menu) return undefined;
    const close = e => { if (!e.target.closest('.new-wrap')) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(i => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'FOLDER' ? -1 : 1));
  }, [items, query]);

  const open = it => { if (it.kind === 'FOLDER') setPath(p => [...p, { id: it.id, name: it.name }]); };

  async function upload(files) {
    let done = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > MAX_BYTES) { notify(`"${f.name}" is larger than 10 MB.`, true); continue; }
      setBusy(`Uploading ${i + 1} of ${files.length}: ${f.name}`);
      try { await api.upload(f, folderId); done++; }
      catch (e) { notify(`${f.name}: ${e.message}`, true); }
    }
    setBusy('');
    if (done) notify(done === 1 ? '1 file uploaded' : `${done} files uploaded`);
    load();
  }

  async function remove(it) {
    if (!window.confirm(`Delete "${it.name}"? This cannot be undone.`)) return;
    try { await api.remove(it.id); notify('Deleted'); }
    catch (e) { notify(e.message, true); }
    load();
  }

  const onDrop = e => { e.preventDefault(); setDrag(false); const l = [...e.dataTransfer.files]; if (l.length) upload(l); };
  const onLeave = e => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false); };

  const actions = it => (
    <div className="acts" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
      {it.kind === 'FILE' && <a className="ib" href={api.contentUrl(it.id)} download title="Download" aria-label={`Download ${it.name}`}><Icon name="download" size={20} /></a>}
      <button className="ib" title="Delete" aria-label={`Delete ${it.name}`} onClick={() => remove(it)}><Icon name="trash" size={20} /></button>
    </div>
  );
  const rowProps = it => ({
    tabIndex: 0,
    className: `item ${selected === it.id ? 'sel' : ''}`,
    onClick: () => setSelected(it.id),
    onDoubleClick: () => open(it),
    onKeyDown: e => { if (e.key === 'Enter') open(it); }
  });

  return (
    <div className="app">
      <aside className="side">
        <div className="logo">
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fbbc04" d="M8 3h8l6 10h-8z" /><path fill="#34a853" d="M8 3 2 13l4 7 6-10z" /><path fill="#4285f4" d="M6 20h12l4-7H10z" /></svg>
          <span>Drive</span>
        </div>
        <div className="new-wrap">
          <button className="new-btn" onClick={() => setMenu(m => !m)} aria-haspopup="menu" aria-expanded={menu}><Icon name="plus" size={26} color="#1f1f1f" />New</button>
          {menu && (
            <div className="menu" role="menu">
              <button role="menuitem" onClick={() => { setMenu(false); setDialog(true); }}><Icon name="newfolder" size={20} />New folder</button>
              <hr />
              <button role="menuitem" onClick={() => { setMenu(false); fileRef.current.click(); }}><Icon name="upload" size={20} />File upload</button>
            </div>
          )}
          <input ref={fileRef} type="file" multiple hidden onChange={e => { const l = [...e.target.files]; e.target.value = ''; if (l.length) upload(l); }} />
        </div>
        <nav>
          <button className={`nav ${path.length === 1 ? 'active' : ''}`} onClick={() => setPath([path[0]])}><Icon name="folder" size={20} />My Drive</button>
        </nav>
      </aside>

      <div className="content">
        <header className="top">
          <label className="search">
            <Icon name="search" size={22} color="#5f6368" />
            <input placeholder="Search in this folder" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search in this folder" />
          </label>
        </header>

        <main className={`panel ${drag ? 'drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={onLeave} onDrop={onDrop}>
          <div className="head">
            <nav className="crumbs" aria-label="Folder path">
              {path.map((p, i) => (
                <span key={p.id ?? 'root'} className="crumb">
                  {i > 0 && <Icon name="chevron" size={20} color="#5f6368" />}
                  {i === path.length - 1
                    ? <h1>{p.name}</h1>
                    : <button onClick={() => setPath(path.slice(0, i + 1))}>{p.name}</button>}
                </span>
              ))}
            </nav>
            <div className="toggle" role="group" aria-label="View">
              <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} title="List view" aria-label="List view"><Icon name="list" size={20} /></button>
              <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} title="Grid view" aria-label="Grid view"><Icon name="grid" size={20} /></button>
            </div>
          </div>

          {offline && (
            <div className="banner">Cannot reach Drive-Service. Start the backend on port 8091. <button onClick={load}>Retry</button></div>
          )}

          {view === 'list' && shown.length > 0 && (
            <div className="list">
              <div className="row hdr"><span>Name</span><span>Created</span><span>File size</span><span /></div>
              {shown.map(it => (
                <div key={it.id} {...rowProps(it)} role="row">
                  <span className="c-name"><Icon name={it.kind === 'FOLDER' ? 'folder' : 'file'} color={typeColor(it)} /><span title={it.name}>{it.name}</span></span>
                  <span className="muted">{fmtDate(it.createdAt)}</span>
                  <span className="muted">{it.kind === 'FOLDER' ? '—' : fmtSize(it.size)}</span>
                  {actions(it)}
                </div>
              ))}
            </div>
          )}

          {view === 'grid' && shown.length > 0 && (
            <div className="cards">
              {shown.map(it => (
                <div key={it.id} {...rowProps(it)}>
                  <div className="thumb"><Icon name={it.kind === 'FOLDER' ? 'folder' : 'file'} size={56} color={typeColor(it)} /></div>
                  <div className="foot">
                    <span className="c-name"><Icon name={it.kind === 'FOLDER' ? 'folder' : 'file'} size={20} color={typeColor(it)} /><span title={it.name}>{it.name}</span></span>
                    {actions(it)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !offline && shown.length === 0 && (
            <div className="empty">
              <Icon name="upload" size={64} color="#9aa0a6" />
              <h2>{query ? 'No matching files' : 'Drop files here'}</h2>
              <p>{query ? 'Try a different search.' : 'Or use the New button to upload files or create a folder.'}</p>
            </div>
          )}
          {loading && <p className="muted pad">Loading…</p>}
          {drag && <div className="drop-hint">Drop files to upload</div>}
        </main>
      </div>

      {busy && <div className="toast">{busy}</div>}
      {toast && !busy && <div className={`toast ${toast.bad ? 'bad' : ''}`} role="status">{toast.msg}</div>}
      {dialog && <NewFolderDialog parentId={folderId} onClose={() => setDialog(false)} onDone={() => { setDialog(false); notify('Folder created'); load(); }} />}
    </div>
  );
}
