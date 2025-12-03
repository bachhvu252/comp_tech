import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Save,
  X,
  Clock,
  Trash2,
  FileText,
  LogOut,
  User,
} from 'lucide-react'
import { documentsAPI } from '../services/api'
import Profile from './Profile'
import UserList from './UserList'
import './Wikidashboard.css'

const markdownToHtml = (md) => {
  if (!md) return ''
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

export default function WikiDashboard({ user, onLogout }) {
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('view') // 'view' | 'edit'
  const [loading, setLoading] = useState(true)

  // View hiện tại: 'dashboard' | 'profile'
  const [activeView, setActiveView] = useState('dashboard')

  // ===== Name & Avatar hiển thị trên header, lưu theo email =====
  const [displayName, setDisplayName] = useState(() => {
    const email = user?.email
    if (!email) return user.name || ''
    const key = `name:${email}`
    const saved = window.localStorage.getItem(key)
    return saved || user.name || ''
  })

  const [avatarUrl, setAvatarUrl] = useState(() => {
    const email = user?.email
    if (!email) return user.avatarURL || ''
    const key = `avatar:${email}`
    const saved = window.localStorage.getItem(key)
    return saved || user.avatarURL || ''
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  // lưu name vào localStorage khi đổi
  useEffect(() => {
    const email = user?.email
    if (!email) return
    const key = `name:${email}`
    if (displayName) {
      window.localStorage.setItem(key, displayName)
    } else {
      window.localStorage.removeItem(key)
    }
  }, [displayName, user?.email])

  // lưu avatar vào localStorage khi đổi
  useEffect(() => {
    const email = user?.email
    if (!email) return
    const key = `avatar:${email}`
    if (avatarUrl) {
      window.localStorage.setItem(key, avatarUrl)
    } else {
      window.localStorage.removeItem(key)
    }
  }, [avatarUrl, user?.email])

  const loadDocuments = async () => {
    try {
      const res = await documentsAPI.getAll()
      if (res.success) setDocuments(res.documents)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const loadDocument = async (id) => {
    try {
      const res = await documentsAPI.getOne(id)
      if (res.success) {
        setSelectedDoc(res.document)
        setViewMode('view')
        setActiveView('dashboard')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const createDocument = async () => {
    try {
      const res = await documentsAPI.create(
        'New Document',
        'Start writing...'
      )
      if (res.success) {
        await loadDocuments()
        setSelectedDoc(res.document)
        setEditTitle(res.document.title)
        // convert existing markdown to HTML for the contenteditable editor
        setEditContent(markdownToHtml(res.document.content || ''))
        setViewMode('edit')
        setActiveView('dashboard')
      }
    } catch (e) {
      alert('Failed to create')
    }
  }

  const updateDocument = async () => {
    if (!selectedDoc) return
    try {
      const res = await documentsAPI.update(selectedDoc._id, {
        title: editTitle,
        content: editContent,
      })
      if (res.success) {
        await loadDocuments()
        setSelectedDoc(res.document)
        setViewMode('view')
      }
    } catch (e) {
      alert('Failed to save')
    }
  }

  const deleteDocument = async (id) => {
    if (!confirm('Delete this document?')) return
    try {
      await documentsAPI.delete(id)
      await loadDocuments()
      if (selectedDoc?._id === id) setSelectedDoc(null)
    } catch (e) {
      alert('Failed to delete')
    }
  }

  const restoreRevision = async (revId) => {
    if (!selectedDoc) return
    if (!confirm('Restore this version?')) return
    try {
      const res = await documentsAPI.restore(selectedDoc._id, revId)
      if (res.success) {
        await loadDocuments()
        setSelectedDoc(res.document)
      }
    } catch (e) {
      alert('Failed to restore')
    }
  }

  // ref for the editable content area and simple formatting helper
  const editorRef = useRef(null)

  const applyFormat = (cmd, value) => {
    try {
      document.execCommand(cmd, false, value)
      if (editorRef.current) setEditContent(editorRef.current.innerHTML)
    } catch (e) {
      console.warn('Formatting failed', e)
    }
  }

  // adjust editor height to fit content (auto-resize)
  const adjustEditorHeight = (el) => {
    if (!el) return
    // reset height to measure scrollHeight correctly
    el.style.height = 'auto'
    // add small padding to avoid cropping
    const newH = el.scrollHeight + 6
    el.style.height = `${newH}px`
  }

  // when switching to edit mode or content changes, ensure editor height updates
  useEffect(() => {
    if (viewMode === 'edit' && editorRef.current) {
      adjustEditorHeight(editorRef.current)
    }
  }, [viewMode, editContent])

  // Keep the editor's innerHTML in sync only when necessary. We avoid
  // setting `dangerouslySetInnerHTML` on every render because that
  // resets the caret position while typing. Instead, only update the
  // DOM when the editor is presented or when external `editContent`
  // changes (e.g. loading a document).
  useEffect(() => {
    if (viewMode === 'edit' && editorRef.current) {
      const cur = editorRef.current
      if (cur.innerHTML !== editContent) {
        cur.innerHTML = editContent
      }
      adjustEditorHeight(cur)
    }
    // We intentionally depend on `editContent` so external updates
    // are applied. On user typing, `onInput` updates `editContent`
    // to match `innerHTML`, so this effect will not overwrite it.
  }, [viewMode, editContent])

  // ===== PERMISSIONS =====
  const canEdit = (doc) =>
    user.role === 'admin' || doc?.ownerEmail === user.email
  const canCreate = () => user.role !== 'viewer'
  const canDelete = (doc) =>
    user.role === 'admin' || doc?.ownerEmail === user.email

  const roleBadgeClass = {
    admin: 'user-role user-role-admin',
    editor: 'user-role user-role-editor',
    viewer: 'user-role user-role-viewer',
  }

  // Chuẩn hoá document từ backend
  const normalizeDoc = (doc) => ({
    ...doc,
    ownerEmail: doc.ownerEmail || doc.owner_email,
    ownerName: doc.ownerName || doc.owner_name,
    updatedAt: doc.updatedAt || doc.updated_at,
    createdAt: doc.createdAt || doc.created_at,
    isPublic: doc.isPublic || doc.is_public,
    lastEditedBy: doc.lastEditedBy || doc.last_edited_by,
  })

  const normalizedDocs = documents.map(normalizeDoc)
  const filteredDocs = normalizedDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const normalizedSelected = selectedDoc ? normalizeDoc(selectedDoc) : null

  // ===== FILTER HISTORY THEO ROLE =====
  const getVisibleRevisions = (doc) => {
    const all = doc.revisions || []

    if (user.role === 'admin') return all

    if (user.role === 'editor') {
      return all.filter((rev) => {
        const email = rev.authorEmail || rev.author_email
        return email && email === user.email
      })
    }

    // viewer: không thấy lịch sử
    return []
  }

  const allRevisions = normalizedSelected?.revisions || []
  const latestRevisionId =
    allRevisions.length > 0 ? allRevisions[allRevisions.length - 1]._id : null
  const visibleRevisions = normalizedSelected
    ? getVisibleRevisions(normalizedSelected)
    : []

  // Nhận dữ liệu từ Profile khi bấm Save
  const handleProfileUpdate = (updatedUser) => {
    if (updatedUser.name) setDisplayName(updatedUser.name)
    if (updatedUser.avatarURL) setAvatarUrl(updatedUser.avatarURL)
  }

  if (loading) {
    return (
      <div className="wiki-dashboard wiki-loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="wiki-dashboard">
      {/* ============== HEADER ============== */}
      <header className="wiki-header">
        <nav className="wiki-tabs">
          {/* IRONDOC: luôn pill xanh, click về dashboard */}
          <button
            className="tab tab-brand"
            onClick={() => setActiveView('dashboard')}
          >
            IRONDOC
          </button>

          {/* Manage Doc cũng về dashboard */}
          <button
            className={`tab ${activeView === 'dashboard' ? 'tab-active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            Manage Doc
          </button>

          {/* User List (admin only) */}
          {user?.role === 'admin' && (
            <button className={`tab ${activeView === 'userlist' ? 'tab-active' : ''}`} onClick={() => setActiveView('userlist')}>User List</button>
          )}
        </nav>

        <div className="header-right">
          {/* Bấm user-pill => sang Profile */}
          <div
            className="user-pill"
            onClick={() => setActiveView('profile')}
          >
            <div className="user-avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="user-avatar-img"
                />
              ) : displayName ? (
                displayName[0]
              ) : (
                <User size={12} />
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{displayName || user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <span className={roleBadgeClass[user.role] || 'user-role'}>
              {user.role}
            </span>
            <button
              className="logout-btn"
              onClick={(e) => {
                e.stopPropagation()
                onLogout()
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ============== MAIN ============== */}
      <main className="wiki-main">
        {activeView === 'profile' ? (
          // ===== PROFILE VIEW =====
          <section className="wiki-card profile-section">
            <Profile
              user={{
                ...user,
                name: displayName || user.name,
                avatarURL: avatarUrl,
              }}
              onUpdateProfile={handleProfileUpdate}
            />
          </section>
        ) : activeView === 'userlist' ? (
          <section className="wiki-card wiki-board">
            <UserList currentUser={user} />
          </section>
        ) : (
          // ===== DASHBOARD VIEW =====
          <>
            {/* BOARD TRÊN: search + create + doc cards */}
            <section className="wiki-card wiki-board">
              <div className="board-top">
                <div className="board-search-wrapper">
                  <Search className="board-search-icon" size={16} />
                  <input
                    className="board-search-input"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {canCreate() && (
                  <button className="create-btn" onClick={createDocument}>
                    <Plus size={16} /> <span>Create</span>
                  </button>
                )}
              </div>

              <div className="wiki-doc-grid">
                {filteredDocs.length === 0 ? (
                  <div className="wiki-doc-empty">No documents found</div>
                ) : (
                  filteredDocs.map((doc) => {
                    const d = doc
                    const selected = normalizedSelected?._id === d._id

                    return (
                      <div
                        key={d._id}
                        className={`wiki-doc-card ${
                          selected ? 'active' : ''
                        }`}
                        onClick={() => loadDocument(d._id)}
                      >
                        <div className="doc-card-header">
                          <div>
                            <div className="doc-label">Name</div>
                            <p className="doc-title">{d.title}</p>
                          </div>
                          {canDelete(d) && (
                            <button
                              className="doc-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteDocument(d._id)
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="doc-desc-block">
                          <div className="doc-label">Description</div>
                          <p className="doc-desc">
                            {(d.content || '').slice(0, 90) ||
                              'No description yet.'}
                          </p>
                        </div>

                        <div className="doc-info">
                          <p>
                            <span className="info-label">Owner: </span>
                            {d.ownerName || '—'}
                          </p>
                          <p>
                            <span className="info-label">Updated: </span>
                            {d.updatedAt
                              ? new Date(d.updatedAt).toLocaleDateString()
                              : '—'}
                          </p>
                          <p>
                            <span className="info-label">
                              Date create:{' '}
                            </span>
                            {d.createdAt
                              ? new Date(d.createdAt).toLocaleDateString()
                              : '—'}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            {/* PANEL DƯỚI: view / edit document + history */}
            {normalizedSelected ? (
              <section className="wiki-card wiki-edit-section">
                <div className="edit-left">
                  <div className="edit-header">
                    <div className="edit-header-left">
                      <span className="edit-chip">EDIT</span>
                      <span className="edit-title-text">
                        {normalizedSelected.title}
                      </span>
                    </div>

                    {canEdit(normalizedSelected) && viewMode === 'view' && (
                      <button
                        className="edit-header-btn"
                        onClick={() => {
                          setEditTitle(normalizedSelected.title || '')
                          // convert existing markdown to HTML for the editor
                          setEditContent(markdownToHtml(normalizedSelected.content || ''))
                          setViewMode('edit')
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    )}
                  </div>

                  <div className="edit-field">
                    <label className="edit-label">Name</label>
                    {viewMode === 'edit' ? (
                      <input
                        className="edit-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    ) : (
                      <div className="edit-view">
                        {normalizedSelected.title}
                      </div>
                    )}
                  </div>

                  <div className="edit-field edit-field-flex">
                    <label className="edit-label">Description</label>
                    {viewMode === 'edit' ? (
                      <>
                        <div className="rich-toolbar">
                          <button type="button" onClick={() => applyFormat('bold')} title="Bold"><strong>B</strong></button>
                          <button type="button" onClick={() => applyFormat('italic')} title="Italic"><em>I</em></button>
                          <button type="button" onClick={() => applyFormat('insertUnorderedList')} title="Bullet">• List</button>
                          <button type="button" onClick={() => applyFormat('insertOrderedList')} title="Numbered">1. List</button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt('Enter URL (https://...)')
                              if (url) applyFormat('createLink', url)
                            }}
                            title="Link"
                          >
                            🔗
                          </button>
                        </div>

                        <div
                          ref={editorRef}
                          className={`rich-edit edit-textarea ${(!editContent || editContent === '<br>' ) ? 'rich-empty' : ''}`}
                          data-placeholder="Start writing..."
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) => {
                            setEditContent(e.currentTarget.innerHTML)
                            adjustEditorHeight(e.currentTarget)
                          }}
                        />
                      </>
                    ) : (
                      <div
                        className="edit-view edit-view-content"
                        dangerouslySetInnerHTML={{
                          __html: markdownToHtml(
                            normalizedSelected.content || ''
                          ),
                        }}
                      />
                    )}
                  </div>

                  {viewMode === 'edit' && canEdit(normalizedSelected) && (
                    <div className="edit-actions">
                      <button className="btn-save" onClick={updateDocument}>
                        <Save size={14} /> Save
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setViewMode('view')}
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* History: admin xem hết, editor xem lịch sử của mình, viewer không thấy */}
                {user.role !== 'viewer' && (
                  <aside className="edit-history">
                    <div className="history-header">
                      <div className="history-title">
                        <Clock size={12} style={{ marginRight: 4 }} />
                        VERSION HISTORY
                      </div>
                      <div className="history-subtitle">
                        {normalizedSelected.ownerName || 'Editor'}
                      </div>
                    </div>

                    <div className="history-list">
                      {visibleRevisions.length === 0 ? (
                        <div className="history-item-meta">
                          No visible revisions.
                        </div>
                      ) : (
                        [...visibleRevisions].reverse().map((rev) => (
                          <div className="history-item" key={rev._id}>
                            <div className="history-item-title">
                              {rev.changes || 'Updated document'}{' '}
                              {rev._id === latestRevisionId && (
                                <span className="history-current">
                                  (Current)
                                </span>
                              )}
                            </div>
                            <div className="history-item-meta">
                              {rev.authorName || 'Unknown'} •{' '}
                              {new Date(
                                rev.createdAt
                              ).toLocaleString()}
                            </div>
                            {rev._id !== latestRevisionId &&
                              canEdit(normalizedSelected) && (
                                <button
                                  className="history-restore-btn"
                                  onClick={() => restoreRevision(rev._id)}
                                >
                                  Restore
                                </button>
                              )}
                          </div>
                        ))
                      )}
                    </div>
                  </aside>
                )}
              </section>
            ) : (
              <section className="wiki-card wiki-empty-section">
                <div className="empty-inner">
                  <FileText size={40} />
                  <p>Select a document card above to view or edit.</p>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
