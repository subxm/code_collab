import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Plus, LogOut, Users, Clock, Play, Terminal,
  ArrowRight, X, Hash, Loader2, Globe, Sparkles, User, MessageSquare
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
                const color = LANG_COLORS[lang] || '#00e5ff'
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
          <button className="btn btn-primary" onClick={handleJoin} disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
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
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()

  // Rooms & Activities State
  const [rooms, setRooms]                 = useState([])
  const [activities, setActivities]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [showCreate, setShowCreate]       = useState(false)
  const [showJoin, setShowJoin]           = useState(false)

  // Sandbox Scratchpad State
  const [sandboxLang, setSandboxLang]     = useState('javascript')
  const [sandboxCode, setSandboxCode]     = useState('console.log("Hello, CodeCollab!");')
  const [sandboxOutput, setSandboxOutput] = useState(null)
  const [sandboxRunning, setSandboxRunning] = useState(false)

  const DEFAULT_CODES = {
    javascript: 'console.log("Hello, CodeCollab!");',
    typescript: 'let message: string = "Hello, TS!";\nconsole.log(message);',
    python: 'print("Hello from Python!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}',
    cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello from C++!" << endl;\n    return 0;\n}',
    c: '#include <stdio.h>\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}',
    go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello from Go!")\n}',
    rust: 'fn main() {\n    println!("Hello from Rust!");\n}',
  }

  const handleLanguageChange = (lang) => {
    setSandboxLang(lang)
    setSandboxCode(DEFAULT_CODES[lang] || '')
  }

  // Fetch Rooms & Activities
  const fetchData = async () => {
    try {
      setLoading(true)
      const roomsRes = await axios.get(`${API_URL}/api/rooms/my-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRooms(roomsRes.data.rooms)

      const actRes = await axios.get(`${API_URL}/api/rooms/recent-activity`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActivities(actRes.data.activities)
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

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/')
  }

  // Execute sandbox code
  const runSandbox = async () => {
    try {
      setSandboxRunning(true)
      setSandboxOutput(null)
      const res = await axios.post(
        `${API_URL}/api/execute/run`,
        { code: sandboxCode, language: sandboxLang },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const { stdout, stderr, compileOutput, status } = res.data.output
      if (stderr) {
        setSandboxOutput(`Error: ${stderr}`)
      } else if (compileOutput) {
        setSandboxOutput(`Compile Error:\n${compileOutput}`)
      } else {
        setSandboxOutput(stdout || `Executed successfully with status: ${status}`)
      }
      toast.success('Code executed!')
    } catch (err) {
      setSandboxOutput(err.response?.data?.message || 'Execution failed.')
      toast.error('Failed to run code')
    } finally {
      setSandboxRunning(false)
    }
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
            {/* Link to Profile Page */}
            <Link to="/profile" style={styles.profileLink} title="My Profile">
              <div style={styles.userAvatar}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
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

        {/* Split grid */}
        <div className="dashboard-grid">
          
          {/* Left Column: Activity Feed & Stats */}
          <div style={styles.leftCol}>
            
            {/* Quick Stats Panel */}
            <motion.div
              style={styles.statsPanel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div style={styles.statBox}>
                <span style={styles.statBoxValue}>{rooms.length}</span>
                <span style={styles.statBoxLabel}>Total Rooms</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <span style={styles.statBoxValue}>
                  {rooms.filter(r => r.myRole === 'owner').length}
                </span>
                <span style={styles.statBoxLabel}>Rooms Owned</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <span style={styles.statBoxValue}>
                  {[...new Set(rooms.map(r => r.language))].length}
                </span>
                <span style={styles.statBoxLabel}>Languages</span>
              </div>
            </motion.div>

            {/* AI Insights Card */}
            <motion.div
              style={styles.aiGlowCard}
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div style={styles.aiCardHeader}>
                <Sparkles size={16} color="#00ff9d" />
                <h3 style={styles.aiCardTitle}>AI Code Reviewer</h3>
              </div>
              <p style={styles.aiCardText}>
                Need an extra set of eyes? Invoke AI inside any active room to get automated reviews, complexity reports, and one-click bug fixes.
              </p>
            </motion.div>

            {/* Live Activity Timeline */}
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Recent Activity</h2>
            </div>

            {loading ? (
              <div style={styles.loadingFeed}>
                <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite' }} color="var(--text-secondary)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading activities…</span>
              </div>
            ) : activities.length === 0 ? (
              <div style={styles.emptyFeed}>
                <Clock size={20} color="var(--text-muted)" />
                <p style={styles.emptyFeedText}>No recent activity yet. Collaborations and files will log here.</p>
              </div>
            ) : (
              <div style={styles.timeline}>
                {activities.map((act, i) => (
                  <motion.div
                    key={act.id}
                    style={styles.timelineItem}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div style={styles.timelineDot} />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.timelineTitle}>{act.title}</span>
                        <span style={styles.timelineTime}>{timeAgo(act.timestamp)}</span>
                      </div>
                      <p style={styles.timelineDetail}>{act.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Code Scratchpad compiler sandbox */}
          <div style={styles.rightCol}>
            
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Sandbox Scratchpad</h2>
            </div>

            <motion.div
              style={styles.sandboxCard}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Sandbox selector bar */}
              <div style={styles.sandboxBar}>
                <span style={styles.sandboxTitle}>
                  <Terminal size={14} color="#00ff9d" />
                  Quick Playground
                </span>
                
                <select
                  value={sandboxLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={styles.langSelect}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python 3</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              {/* Code TextArea */}
              <div style={styles.textareaWrap}>
                <textarea
                  style={styles.codeTextarea}
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  placeholder="// Type some code to execute..."
                />
              </div>

              {/* Action Bar */}
              <div style={styles.sandboxActions}>
                <button
                  className="btn btn-primary"
                  onClick={runSandbox}
                  disabled={sandboxRunning}
                  style={{ gap: 8, padding: '8px 16px', fontSize: '13px' }}
                >
                  {sandboxRunning ? (
                    <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                  ) : (
                    <Play size={12} fill="currentColor" />
                  )}
                  Run Script
                </button>
              </div>

              {/* Output Console Mockup */}
              {sandboxOutput && (
                <div style={styles.consoleMockup}>
                  <div style={styles.consoleHeader}>
                    <span style={styles.consoleDot} />
                    <span style={styles.consoleDot} />
                    <span style={styles.consoleDot} />
                    <span style={styles.consoleTitle}>Console Output</span>
                  </div>
                  <pre style={styles.consoleText}>
                    {sandboxOutput}
                  </pre>
                </div>
              )}
            </motion.div>
            
          </div>
        </div>

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
    background: 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-purple) 100%)',
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
  statBoxLabel: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  statDivider: { width: 1, height: 32, background: 'var(--border)' },

  aiGlowCard: {
    background: 'linear-gradient(to bottom, #1d2b24, #141414)',
    border: '1px solid rgba(0,255,157,0.12)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: '0 8px 30px rgba(0,255,157,0.02)',
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

  loadingFeed: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0',
  },
  emptyFeed: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '32px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    textAlign: 'center',
  },
  emptyFeedText: { fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 260 },

  timeline: {
    display: 'flex', flexDirection: 'column', position: 'relative',
    paddingLeft: 16, borderLeft: '2px solid var(--border)',
    margin: '10px 0 0 4px', gap: 20,
  },
  timelineItem: { position: 'relative' },
  timelineDot: {
    position: 'absolute', left: -22, top: 4, width: 10, height: 10,
    borderRadius: '50%', background: '#00ff9d',
    border: '2px solid var(--bg-primary)',
  },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  timelineTitle: { fontSize: '13px', fontWeight: 700 },
  timelineTime: { fontSize: '11px', color: 'var(--text-muted)' },
  timelineDetail: { fontSize: '12px', color: 'var(--text-secondary)' },

  // Sandbox Scratchpad Styles
  sandboxCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  sandboxBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sandboxTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 700 },
  langSelect: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px',
    padding: '4px 10px', cursor: 'pointer', outline: 'none',
  },
  textareaWrap: {
    background: '#181818', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: 12,
  },
  codeTextarea: {
    width: '100%', height: 160, background: 'transparent', border: 'none', outline: 'none',
    color: '#00ff9d', fontFamily: 'var(--font-mono)', fontSize: '12px',
    resize: 'none', lineHeight: 1.5,
  },
  sandboxActions: { display: 'flex', justifyContent: 'flex-end' },
  consoleMockup: {
    background: '#0d0d0d', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', overflow: 'hidden',
  },
  consoleHeader: {
    background: '#141414', padding: '6px 12px',
    display: 'flex', alignItems: 'center', gap: 6,
    borderBottom: '1px solid var(--border)',
  },
  consoleDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' },
  consoleTitle: { fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 6 },
  consoleText: {
    padding: 12, margin: 0, color: '#f8f8f2', fontFamily: 'var(--font-mono)',
    fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto',
  },

  // Modals Styles (Shared)
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContents: 'center',
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
  hint: { fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 },
}

export default Dashboard
