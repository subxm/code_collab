import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Plus, LogOut, Users, Clock,
  ArrowRight, X, Hash, Globe, Sparkles, AlertCircle, Signal, Edit3, Trash2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import axios from 'axios'
import toast from 'react-hot-toast'
import { renderAvatar } from './ProfilePage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const LANG_COLORS = {
  javascript: '#ffa657',
  python:     '#4ec9b0',
  java:       '#ff7b72',
  cpp:        '#79c0ff',
  c:          '#79c0ff',
  typescript: '#3178c6',
  go:         '#00acd7',
  rust:       '#ce422b',
}

const timeAgo = (dateStr) => {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Create Room Modal ────────────────────────────────────
const CreateRoomModal = ({ onClose, onCreated, token }) => {
  const [form, setForm]       = useState({ name: '', language: 'javascript' })
  const [loading, setLoading] = useState(false)

  const languages = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust'
  ]

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Room name is required'); return }
    try {
      setLoading(true)
      const res = await axios.post(
        `${API_URL}/api/rooms/create`, form,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Room created!')
      onCreated(res.data.room)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Create a Room</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div className="divider" style={{ margin: '16px 0' }} />

        <div style={styles.modalBody}>
          <div style={styles.field}>
            <label style={styles.label}>Room Name</label>
            <input
              className="input"
              placeholder="e.g. Backend API Review"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Language</label>
            <div style={styles.langGrid}>
              {languages.map(lang => {
                const color = LANG_COLORS[lang] || 'var(--accent-purple)'
                const selected = form.language === lang
                return (
                  <button
                    key={lang}
                    onClick={() => setForm(p => ({ ...p, language: lang }))}
                    style={{
                      ...styles.langOption,
                      borderColor: selected ? color : 'var(--border)',
                      background: selected ? `${color}15` : 'var(--bg-elevated)',
                      color: selected ? color : 'var(--text-secondary)',
                    }}
                  >
                    {lang.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? (
              <span style={{ fontSize: '13px' }}>Creating...</span>
            ) : (
              <><Plus size={16} /> Create Room</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Join Room Modal ──────────────────────────────────────
const JoinRoomModal = ({ onClose, token, navigate }) => {
  const [roomId, setRoomId]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!roomId.trim()) { toast.error('Room ID is required'); return }
    try {
      setLoading(true)
      await axios.post(
        `${API_URL}/api/rooms/join/${roomId.trim()}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Joined room!')
      navigate(`/room/${roomId.trim()}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Room not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Join a Room</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div className="divider" style={{ margin: '16px 0' }} />

        <div style={styles.modalBody}>
          <div style={styles.field}>
            <label style={styles.label}>Room ID</label>
            <input
              className="input"
              placeholder="Paste room ID here…"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
            />
            <span style={styles.hint}>
              Ask the room owner to share their Room ID with you
            </span>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleJoin} disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? (
              <span style={{ fontSize: '13px' }}>Joining...</span>
            ) : (
              <><ArrowRight size={16} /> Join Room</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Rename Room Modal ────────────────────────────────────
const RenameRoomModal = ({ room, onClose, onRenamed, token }) => {
  const [name, setName] = useState(room.name)
  const [loading, setLoading] = useState(false)

  const handleRename = async () => {
    if (!name.trim()) { toast.error('Room name is required'); return }
    try {
      setLoading(true)
      await axios.put(
        `${API_URL}/api/rooms/${room.id}`,
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Room renamed!')
      onRenamed(room.id, name.trim())
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Rename Room</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div className="divider" style={{ margin: '16px 0' }} />

        <div style={styles.modalBody}>
          <div style={styles.field}>
            <label style={styles.label}>New Room Name</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleRename} disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? (
              <span style={{ fontSize: '13px' }}>Renaming...</span>
            ) : (
              <>Save Changes</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Delete Room Modal ────────────────────────────────────
const DeleteRoomModal = ({ room, onClose, onDeleted, token }) => {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      await axios.delete(
        `${API_URL}/api/rooms/${room.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Room deleted successfully!')
      onDeleted(room.id)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle} style={{ color: '#ff4d4d' }}>Delete Room</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div className="divider" style={{ margin: '16px 0' }} />

        <div style={styles.modalBody}>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Are you sure you want to delete the room <strong style={{ color: '#ffffff' }}>{room.name}</strong>?
          </p>
          <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-muted)', marginTop: 8 }}>
            This action is permanent and will delete all files and saved snapshots in this room.
          </p>
        </div>

        <div style={styles.modalFooter}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleDelete} 
            disabled={loading} 
            style={{ flex: 1, background: '#ff4d4d', borderColor: '#ff4d4d', justifyContent: 'center' }}
          >
            {loading ? (
              <span style={{ fontSize: '13px' }}>Deleting...</span>
            ) : (
              <>Delete</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()

  // Rooms & Activities State
  const [rooms, setRooms]                 = useState([])
  const [activities, setActivities]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [showCreate, setShowCreate]       = useState(false)
  const [showJoin, setShowJoin]           = useState(false)
  const [renameRoomObj, setRenameRoomObj] = useState(null)
  const [deleteRoomObj, setDeleteRoomObj] = useState(null)

  // Fetch Rooms & Activities
  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsRes, actRes] = await Promise.all([
        axios.get(`${API_URL}/api/rooms/my-rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/rooms/recent-activity`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error("Failed to load activity:", err)
          return { data: { activities: [] } }
        })
      ])
      setRooms(roomsRes.data.rooms)
      setActivities(actRes.data.activities || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const handleRoomCreated = (room) => {
    setShowCreate(false)
    setRooms(prev => [{ ...room, myRole: 'owner' }, ...prev])
    navigate(`/room/${room.id}`)
  }

  const handleRoomRenamed = (roomId, newName) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: newName } : r))
  }

  const handleRoomDeleted = (roomId) => {
    setRooms(prev => prev.filter(r => r.id !== roomId))
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/')
  }

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div className="spinner-container">
          <div className="spinner-ring" />
          <h2 style={styles.stillLoaderText}>Loading Dashboard...</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* ── Navbar ─────────────────────────────────── */}
      <motion.nav
        style={styles.nav}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => navigate('/')} >
            <Logo size={22} style={{ marginRight: 6 }} />
            <span style={styles.logoText}>CodeCollab</span>
          </div>
          <div style={styles.navRight}>
            <Link to="/profile" style={styles.profileLink} title="My Profile">
              {renderAvatar(user?.avatar, user?.username, 26)}
              <span style={styles.userName}>{user?.username}</span>
            </Link>
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: '7px 14px', fontSize: '13px', gap: 6, borderRadius: '24px', fontWeight: 600 }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Main ───────────────────────────────────── */}
      <main style={styles.main}>

        {/* Welcome Section */}
        <motion.div
          style={styles.pageHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <h1 style={styles.pageTitle}>
              Good to see you, <span style={styles.nameAccent}>{user?.username}</span>
            </h1>
            <p style={styles.pageSub}>
              Welcome to your collaboration hub. Create sandbox rooms, review code with AI, and work together in real-time.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowJoin(true)}
              style={{ gap: 8 }}
            >
              <Globe size={15} /> Join Room
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
              style={{ gap: 8 }}
            >
              <Plus size={15} /> New Room
            </button>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="dashboard-grid" style={{ marginTop: 24 }}>
          {/* Left Column: Rooms */}
          <div style={styles.leftCol}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>My Collaborative Rooms</h2>
            </div>

            {rooms.length === 0 ? (
              <div style={styles.emptyFeed}>
                <Code2 size={24} color="var(--text-secondary)" style={{ marginBottom: 8 }} />
                <p style={styles.emptyFeedText}>You don't have any rooms yet. Create a new room above to start collaborating!</p>
              </div>
            ) : (
              <div style={styles.roomsGrid}>
                {rooms.map((room, i) => {
                  const color = LANG_COLORS[room.language] || 'var(--accent-purple)'
                  return (
                    <motion.div
                      key={room.id}
                      style={styles.roomCard}
                      whileHover={{ y: -4, borderColor: 'var(--border-bright)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div style={styles.roomCardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ ...styles.langDot, background: color }} />
                          <h4 style={styles.roomCardName}>{room.name}</h4>
                        </div>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          padding: '3px 8px', 
                          borderRadius: '12px',
                          background: room.myRole === 'owner' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                          color: room.myRole === 'owner' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                          border: room.myRole === 'owner' ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(255,255,255,0.08)'
                        }}>
                          {room.myRole === 'owner' ? 'Owner' : 'Editor'}
                        </span>
                      </div>
                      
                      <div style={styles.roomCardMeta}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {room.language.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Updated {timeAgo(room.updatedAt)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <div>
                          {room.myRole === 'owner' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameRoomObj(room);
                                }}
                                style={styles.cardActionBtn}
                                className="card-action-btn"
                                title="Rename Room"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteRoomObj(room);
                                }}
                                style={styles.cardActionBtnDelete}
                                className="card-action-btn-delete"
                                title="Delete Room"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate(`/room/${room.id}`)}
                          style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px', fontWeight: 600 }}
                        >
                          Enter Room
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity Timeline */}
          <div style={styles.rightCol}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Recent Activity</h2>
            </div>
            
            <div style={styles.activityCard}>
              {activities.length === 0 ? (
                <div style={styles.emptyActivity}>
                  <Clock size={16} color="var(--text-muted)" style={{ marginBottom: 6 }} />
                  <p style={styles.emptyActivityText}>No recent activity yet</p>
                </div>
              ) : (
                <div style={styles.timeline}>
                  {activities.map((act, i) => {
                    let ActIcon = Clock
                    let actColor = 'var(--text-secondary)'
                    if (act.type === 'file_update') {
                      ActIcon = Edit3
                      actColor = 'var(--accent-cyan)'
                    } else if (act.type === 'snapshot_save') {
                      ActIcon = Clock
                      actColor = 'var(--accent-purple)'
                    } else if (act.type === 'room_create') {
                      ActIcon = Plus
                      actColor = '#50fa7b'
                    }

                    return (
                      <motion.div
                        key={act.id}
                        style={styles.timelineItem}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {i < activities.length - 1 && (
                          <div
                            style={{
                              position: 'absolute',
                              left: -13,
                              top: 24,
                              width: 2,
                              bottom: -20,
                              backgroundColor: 'var(--border)',
                              zIndex: 1,
                            }}
                          />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            left: -24,
                            top: 2,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-primary)',
                            border: `2px solid ${actColor}`,
                            color: actColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                          }}
                        >
                          <ActIcon size={12} />
                        </div>
                        <div style={{ paddingLeft: 12 }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {act.title}
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 4px' }}>
                            {act.detail}
                          </p>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {timeAgo(act.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateRoomModal
            onClose={() => setShowCreate(false)}
            onCreated={handleRoomCreated}
            token={token}
          />
        )}
        {showJoin && (
          <JoinRoomModal
            onClose={() => setShowJoin(false)}
            token={token}
            navigate={navigate}
          />
        )}
        {renameRoomObj && (
          <RenameRoomModal
            room={renameRoomObj}
            onClose={() => setRenameRoomObj(null)}
            onRenamed={handleRoomRenamed}
            token={token}
          />
        )}
        {deleteRoomObj && (
          <DeleteRoomModal
            room={deleteRoomObj}
            onClose={() => setDeleteRoomObj(null)}
            onDeleted={handleRoomDeleted}
            token={token}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────
const styles = {
  lobbyChatCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 12,
  },
  lobbyChatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
    paddingBottom: 12,
  },
  lobbyChatTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  onlineBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '4px 10px',
    borderRadius: 20,
    border: '1px solid var(--border)',
  },
  onlinePulsingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent-purple)',
    boxShadow: '0 0 8px var(--accent-purple)',
    display: 'inline-block',
  },
  chatMessageLog: {
    height: 250,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingRight: 6,
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    border: '1px solid var(--border)',
  },
  emptyChat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
  },
  emptyChatText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    maxWidth: 220,
  },
  chatMessageRow: {
    fontSize: '13px',
    lineHeight: '1.4',
    textAlign: 'left',
  },
  chatMessageText: {
    color: 'var(--text-primary)',
  },
  chatInviteCard: {
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.02)',
    textAlign: 'left',
  },
  inviteAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--accent-purple)',
    color: '#141414',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
  },
  chatInputWrapper: {
    display: 'flex',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  chatSendBtn: {
    background: 'var(--accent-purple)',
    border: 'none',
    borderRadius: '8px',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  },
  roomsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    marginTop: 12,
  },
  roomCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  roomCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomCardName: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  roomCardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  roomShareBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  cardActionBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  cardActionBtnDelete: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    color: 'rgba(255, 77, 77, 0.7)',
    borderRadius: '6px',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  rosterCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  rosterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  rosterItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rosterName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  activePulsingIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--accent-purple)',
    boxShadow: '0 0 8px var(--accent-purple)',
  },
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(0,0,0,0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
  },
  navInner: {
    width: '100%',
    padding: '0 40px', height: 60,
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex', alignItems: 'center',
    gap: 10, cursor: 'pointer',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700, fontSize: '18px',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  profileLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 100, padding: '4px 14px 4px 4px',
    textDecoration: 'none', color: 'var(--text-primary)',
    transition: 'all 0.2s',
  },
  userAvatar: {
    width: 26, height: 26, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ffffff 100%)',
    color: 'var(--bg-primary)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px', fontWeight: 700,
  },
  userName: { fontSize: '13px', fontWeight: 600 },

  main: {
    maxWidth: 1200, margin: '0 auto',
    padding: '40px 24px',
  },
  pageHeader: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap',
    gap: 16, marginBottom: 36,
  },
  pageTitle: {
    fontSize: '32px', fontWeight: 800,
    fontFamily: 'var(--font-display)',
    marginBottom: 6,
  },
  nameAccent: { color: 'var(--accent-cyan)' },
  pageSub: { fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 640 },
  headerActions: { display: 'flex', gap: 10 },

  leftCol: { display: 'flex', flexDirection: 'column', gap: 24 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20 },

  statsPanel: {
    display: 'flex', alignItems: 'center',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
    width: 'fit-content',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  statBox: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2, padding: '0 24px',
  },
  statBoxValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px', fontWeight: 800,
  },
  statBoxLabel: { fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' },
  statDivider: { width: 1, height: 32, background: 'var(--border)' },

  aiGlowCard: {
    background: 'linear-gradient(to bottom, #19142b, #141414)',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: '0 8px 30px rgba(139,92,246,0.02)',
  },
  aiCardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiCardTitle: { fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' },
  aiCardText: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 },

  sectionHeader: { marginBottom: 12 },
  sectionTitle: {
    fontSize: '16px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
  },

  emptyFeed: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '32px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    textAlign: 'center',
  },
  emptyFeedText: { fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 260 },

  activityCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  },
  emptyActivity: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px',
    textAlign: 'center',
    gap: 8,
  },
  emptyActivityText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  timeline: {
    display: 'flex', flexDirection: 'column', position: 'relative',
    paddingLeft: 16,
    margin: '10px 0 0 12px', gap: 24,
  },
  timelineItem: { position: 'relative', minHeight: 48 },

  // Lobby Card styles
  lobbyCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  lobbyTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  lobbyPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: '20px', padding: '6px 14px',
  },
  lobbyStatusText: { fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)' },
  telemetrySection: { display: 'flex', flexDirection: 'column', gap: 10 },
  telemetryTitle: {
    fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4
  },
  telemetryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' },
  telemetryLabel: { color: 'var(--text-secondary)' },
  telemetryValue: { fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' },

  // Recent Rooms list styles
  recentRoomsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  recentRoomItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '14px 16px',
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
  recentRoomLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  langDot: { width: 8, height: 8, borderRadius: '50%' },
  recentRoomText: { display: 'flex', flexDirection: 'column', gap: 2 },
  recentRoomName: { fontSize: '13px', fontWeight: 700 },
  recentRoomLang: { fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' },

  // Still Black Loader styles
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#050505',
  },
  stillLoaderInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stillLoaderText: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-display)',
  },

  // Modals Styles (Shared)
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    margin: 'auto',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 0',
  },
  modalTitle: { fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' },
  closeBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', padding: 4, borderRadius: 6,
    display: 'flex', alignItems: 'center',
  },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', gap: 10, paddingTop: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' },
  langGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  langOption: {
    padding: '8px', borderRadius: 6, border: '1px solid', cursor: 'pointer',
    fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)',
    transition: 'all 0.15s ease', textTransform: 'uppercase',
  },
  hint: { fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 },
}

export default Dashboard
