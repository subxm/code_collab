import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Plus, LogOut, Users, Clock,
  ArrowRight, X, Hash, Loader2, Globe
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Language colors ──────────────────────────────────────
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

const LANG_LABELS = {
  javascript: 'JS', python: 'PY', java: 'Java',
  cpp: 'C++', c: 'C', typescript: 'TS', go: 'Go', rust: 'RS'
}

// ── Time formatter ───────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr)
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ── Room Card ────────────────────────────────────────────
const RoomCard = ({ room, onClick, index }) => {
  const color = LANG_COLORS[room.language] || 'var(--accent-cyan)'
  const label = LANG_LABELS[room.language] || room.language

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      style={{ ...styles.roomCard, '--lang-color': color }}
    >
      {/* Top accent line */}
      <div style={{ ...styles.roomAccent, background: color }} />

      <div style={styles.roomTop}>
        {/* Language badge */}
        <span style={{ ...styles.langBadge, background: `${color}18`, color, border: `1px solid ${color}30` }}>
          {label}
        </span>
        {/* Role badge */}
        <span style={{
          ...styles.roleBadge,
          background: room.myRole === 'owner'
            ? 'rgba(0,255,157,0.1)' : 'rgba(0,212,255,0.1)',
          color: room.myRole === 'owner'
            ? 'var(--accent-green)' : 'var(--accent-cyan)',
        }}>
          {room.myRole}
        </span>
      </div>

      <h3 style={styles.roomName}>{room.name}</h3>

      <div style={styles.roomMeta}>
        <span style={styles.metaItem}>
          <Users size={12} />
          {room.members?.length || 1} member{room.members?.length !== 1 ? 's' : ''}
        </span>
        <span style={styles.metaItem}>
          <Clock size={12} />
          {timeAgo(room.updatedAt)}
        </span>
      </div>

      <div style={styles.roomFooter}>
        <span style={styles.roomId}>
          <Hash size={10} />
          {room.id.slice(0, 8)}…
        </span>
        <span style={styles.openRoom}>
          Open <ArrowRight size={12} />
        </span>
      </div>
    </motion.div>
  )
}

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
          {/* Room name */}
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

          {/* Language picker */}
          <div style={styles.field}>
            <label style={styles.label}>Language</label>
            <div style={styles.langGrid}>
              {languages.map(lang => {
                const color = LANG_COLORS[lang] || 'var(--accent-cyan)'
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
                    {LANG_LABELS[lang] || lang}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button className="btn btn-secondary" onClick={onClose}
            style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}
            disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
            {loading
              ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
              : <><Plus size={16} /> Create Room</>
            }
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
          <button className="btn btn-primary" onClick={handleJoin}
            disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
            {loading
              ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
              : <><ArrowRight size={16} /> Join Room</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const navigate        = useNavigate()
  const { user, token, logout } = useAuth()

  const [rooms,        setRooms]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showCreate,   setShowCreate]   = useState(false)
  const [showJoin,     setShowJoin]     = useState(false)

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/rooms/my-rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRooms(res.data.rooms)
      } catch {
        toast.error('Failed to load rooms')
      } finally {
        setLoading(false)
      }
    }
    fetchRooms()
  }, [token])

  const handleRoomCreated = (room) => {
    setShowCreate(false)
    setRooms(prev => [{ ...room, myRole: 'owner' }, ...prev])
    navigate(`/room/${room.id}`)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/')
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
            <Code2 size={20} color="var(--accent-cyan)" />
            <span style={styles.logoText}>CodeCollab</span>
          </div>
          <div style={styles.navRight}>
            <div style={styles.userPill}>
              <div style={styles.userAvatar}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <span style={styles.userName}>{user?.username}</span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: '7px 14px', fontSize: '13px', gap: 6 }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Main ───────────────────────────────────── */}
      <main style={styles.main}>

        {/* Header */}
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
              {rooms.length > 0
                ? `You have ${rooms.length} room${rooms.length !== 1 ? 's' : ''}. Pick up where you left off.`
                : 'Create your first room to start collaborating.'}
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

        {/* Stats bar */}
        <motion.div
          style={styles.statsBar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={styles.statItem}>
            <span style={styles.statVal}>{rooms.length}</span>
            <span style={styles.statKey}>Total Rooms</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statVal}>
              {rooms.filter(r => r.myRole === 'owner').length}
            </span>
            <span style={styles.statKey}>Owned</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statVal}>
              {[...new Set(rooms.map(r => r.language))].length}
            </span>
            <span style={styles.statKey}>Languages</span>
          </div>
        </motion.div>

        {/* Rooms grid */}
        {loading ? (
          <div style={styles.loadingWrap}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={28} color="var(--accent-cyan)" />
            </motion.div>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Loading rooms…
            </span>
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            style={styles.emptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div style={styles.emptyIcon}>
              <Code2 size={32} color="var(--text-muted)" />
            </div>
            <h3 style={styles.emptyTitle}>No rooms yet</h3>
            <p style={styles.emptySub}>
              Create your first room and invite your team to collaborate.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
              style={{ marginTop: 8 }}
            >
              <Plus size={15} /> Create First Room
            </button>
          </motion.div>
        ) : (
          <div style={styles.roomsGrid}>
            {rooms.map((room, i) => (
              <RoomCard
                key={room.id}
                room={room}
                index={i}
                onClick={() => navigate(`/room/${room.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────── */}
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
      </AnimatePresence>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(8,12,16,0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
  },
  navInner: {
    maxWidth: 1200, margin: '0 auto',
    padding: '0 24px', height: 60,
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
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 100, padding: '4px 12px 4px 4px',
  },
  userAvatar: {
    width: 26, height: 26, borderRadius: '50%',
    background: 'var(--accent-cyan)',
    color: 'var(--bg-primary)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px', fontWeight: 700,
  },
  userName: { fontSize: '13px', fontWeight: 500 },

  main: {
    maxWidth: 1200, margin: '0 auto',
    padding: '40px 24px',
  },
  pageHeader: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', flexWrap: 'wrap',
    gap: 16, marginBottom: 32,
  },
  pageTitle: {
    fontSize: '28px', fontWeight: 800,
    fontFamily: 'var(--font-display)',
    marginBottom: 6,
  },
  nameAccent: { color: 'var(--accent-cyan)' },
  pageSub: { fontSize: '14px', color: 'var(--text-secondary)' },
  headerActions: { display: 'flex', gap: 10 },

  statsBar: {
    display: 'flex', alignItems: 'center',
    gap: 0, marginBottom: 32,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 28px',
    width: 'fit-content',
  },
  statItem: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2, padding: '0 20px',
  },
  statVal: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px', fontWeight: 800,
    color: 'var(--text-primary)',
  },
  statKey: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  statDivider: { width: 1, height: 32, background: 'var(--border)' },

  loadingWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
    padding: '80px 0',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
    padding: '80px 24px', textAlign: 'center',
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: '18px', fontWeight: 700,
    fontFamily: 'var(--font-display)',
  },
  emptySub: { fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 320 },

  roomsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  roomCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  roomAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
  },
  roomTop: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  langBadge: {
    padding: '3px 8px', borderRadius: 4,
    fontSize: '11px', fontWeight: 700,
    fontFamily: 'var(--font-mono)',
  },
  roleBadge: {
    padding: '3px 8px', borderRadius: 4,
    fontSize: '10px', fontWeight: 600,
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
  },
  roomName: {
    fontSize: '15px', fontWeight: 700,
    fontFamily: 'var(--font-display)',
    marginBottom: 10, color: 'var(--text-primary)',
  },
  roomMeta: { display: 'flex', gap: 16, marginBottom: 14 },
  metaItem: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: '12px', color: 'var(--text-muted)',
  },
  roomFooter: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
  roomId: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    color: 'var(--text-muted)',
  },
  openRoom: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-cyan)',
  },

  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    width: '100%', maxWidth: 460,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 0',
  },
  modalTitle: {
    fontSize: '18px', fontWeight: 700,
    fontFamily: 'var(--font-display)',
  },
  closeBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', padding: 4, borderRadius: 6,
    display: 'flex', alignItems: 'center',
  },
  modalBody: { padding: '0 24px' },
  modalFooter: {
    display: 'flex', gap: 10,
    padding: '16px 24px 24px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  langGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
  },
  langOption: {
    padding: '8px', borderRadius: 6,
    border: '1px solid', cursor: 'pointer',
    fontSize: '12px', fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.15s ease',
  },
  hint: { fontSize: '12px', color: 'var(--text-muted)' },
}

export default Dashboard
