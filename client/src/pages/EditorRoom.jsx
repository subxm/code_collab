import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { useAuth } from '../context/AuthContext'
import useCollaboration from '../hooks/useCollaboration'
import useExecution from '../hooks/useExecution'
import useAI from '../hooks/useAI'
import TerminalPanel from '../components/TerminalPanel'
import AIPanel from '../components/AIPanel'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Code2, Play, Users, ChevronDown,
  Copy, Check, Brain, Terminal,
  ArrowLeft, Wifi, WifiOff, Save
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const LANGUAGES = ['javascript','typescript','python','java','cpp','c','go','rust']

// ── Copy button ──────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} style={styles.iconBtn} title="Copy Room ID">
      {copied
        ? <Check size={14} color="var(--accent-green)" />
        : <Copy  size={14} color="var(--text-muted)"   />
      }
    </button>
  )
}

// ── EditorRoom ───────────────────────────────────────────
const EditorRoom = () => {
  const { roomId }        = useParams()
  const navigate          = useNavigate()
  const { user, token }   = useAuth()
  const editorRef         = useRef(null)

  const [room,         setRoom]         = useState(null)
  const [language,     setLanguage]     = useState('javascript')
  const [showLangDrop, setShowLangDrop] = useState(false)
  const [bottomPanel,  setBottomPanel]  = useState('terminal') // 'terminal' | 'hidden'
  const [rightPanel,   setRightPanel]   = useState('ai')       // 'ai' | 'hidden'
  const [lastError,    setLastError]    = useState(null)
  const [saving,       setSaving]       = useState(false)

  // ── Hooks ──────────────────────────────────────────────
  const {
    users, messages, isConnected,
    bindEditor, sendMessage, changeLanguage
  } = useCollaboration(roomId, user?.username, editorRef)

  const {
    output, isRunning, error: execError,
    runCode, clearOutput
  } = useExecution()

  const ai = useAI(token)

  // ── Load room data ─────────────────────────────────────
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRoom(res.data.room)
        setLanguage(res.data.room.language || 'javascript')
      } catch {
        toast.error('Room not found or access denied')
        navigate('/dashboard')
      }
    }
    fetchRoom()
  }, [roomId, token])

  // ── Track last error for AI autofix ───────────────────
  useEffect(() => {
    if (output?.stderr)        setLastError(output.stderr)
    else if (output?.compileOutput) setLastError(output.compileOutput)
    else if (execError)        setLastError(execError)
  }, [output, execError])

  // ── Editor mounted ─────────────────────────────────────
  const handleEditorMount = (editor) => {
    editorRef.current = editor
    bindEditor(editor)
  }

  // ── Get current code from editor ──────────────────────
  const getCode = useCallback(() => {
    return editorRef.current?.getValue() || ''
  }, [])

  // ── Run code ───────────────────────────────────────────
  const handleRun = () => {
    const code = getCode()
    if (!code.trim()) { toast.error('Write some code first!'); return }
    setBottomPanel('terminal')
    runCode(code, language)
  }

  // ── Language change ────────────────────────────────────
  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    changeLanguage(lang)
    setShowLangDrop(false)
  }

  // ── Save snapshot ──────────────────────────────────────
  const handleSave = async () => {
    const code = getCode()
    try {
      setSaving(true)
      await axios.post(
        `${API_URL}/api/rooms/${roomId}/snapshot`,
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Snapshot saved!')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Apply AI fix ───────────────────────────────────────
  const handleApplyFix = (fixedCode) => {
    if (!editorRef.current) return
    editorRef.current.setValue(fixedCode)
    ai.clearFix()
    toast.success('Fix applied!')
  }

  // ── Monaco editor options ──────────────────────────────
  const editorOptions = {
    fontSize: 14,
    fontFamily: "'Space Mono', monospace",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'on',
    padding: { top: 16, bottom: 16 },
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    contextmenu: false,
    scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
    renderLineHighlight: 'line',
    theme: 'vs-dark',
  }

  if (!room) {
    return (
      <div style={styles.loading}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Code2 size={28} color="var(--accent-cyan)" />
        </motion.div>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Loading room…
        </span>
      </div>
    )
  }

  return (
    <div style={styles.page}>

      {/* ── Toolbar ────────────────────────────────── */}
      <div style={styles.toolbar}>

        {/* Left */}
        <div style={styles.toolbarLeft}>
          <button
            onClick={() => navigate('/dashboard')}
            style={styles.iconBtn}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} color="var(--text-muted)" />
          </button>

          <div style={styles.toolbarDivider} />

          <Code2 size={16} color="var(--accent-cyan)" />
          <span style={styles.roomName}>{room.name}</span>

          {/* Connection status */}
          <span style={styles.connStatus}>
            {isConnected
              ? <><Wifi    size={11} color="var(--accent-green)" /> Live</>
              : <><WifiOff size={11} color="#ff4d4d"             /> Offline</>
            }
          </span>
        </div>

        {/* Center — Language picker */}
        <div style={styles.toolbarCenter}>
          <div style={styles.langDropWrap}>
            <button
              onClick={() => setShowLangDrop(p => !p)}
              style={styles.langDropBtn}
            >
              {language}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showLangDrop && (
                <motion.div
                  style={styles.langDropMenu}
                  initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      style={{
                        ...styles.langOption,
                        color: lang === language
                          ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        background: lang === language
                          ? 'rgba(0,212,255,0.08)' : 'transparent',
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right */}
        <div style={styles.toolbarRight}>
          {/* Online users */}
          <div style={styles.onlineUsers}>
            {users.slice(0, 4).map((u, i) => (
              <div
                key={i}
                title={u.username}
                style={{
                  ...styles.userDot,
                  background: u.color,
                  marginLeft: i > 0 ? -6 : 0,
                  zIndex: 10 - i,
                }}
              >
                {u.username?.[0]?.toUpperCase()}
              </div>
            ))}
            {users.length > 0 && (
              <span style={styles.userCount}>
                <Users size={11} /> {users.length}
              </span>
            )}
          </div>

          {/* Room ID copy */}
          <div style={styles.roomIdWrap}>
            <span style={styles.roomIdText}>{roomId.slice(0, 8)}…</span>
            <CopyButton text={roomId} />
          </div>

          <div style={styles.toolbarDivider} />

          {/* Panel toggles */}
          <button
            onClick={() => setRightPanel(p => p === 'ai' ? 'hidden' : 'ai')}
            style={{
              ...styles.iconBtn,
              color: rightPanel === 'ai' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            }}
            title="Toggle AI Panel"
          >
            <Brain size={16} />
          </button>
          <button
            onClick={() => setBottomPanel(p => p === 'terminal' ? 'hidden' : 'terminal')}
            style={{
              ...styles.iconBtn,
              color: bottomPanel === 'terminal' ? 'var(--accent-green)' : 'var(--text-muted)',
            }}
            title="Toggle Terminal"
          >
            <Terminal size={16} />
          </button>

          <div style={styles.toolbarDivider} />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...styles.iconBtn }}
            title="Save Snapshot"
          >
            {saving
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Save size={15} color="var(--accent-cyan)" />
                </motion.div>
              : <Save size={15} color="var(--text-muted)" />
            }
          </button>

          {/* Run */}
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={isRunning}
            style={{ padding: '6px 16px', fontSize: '13px', gap: 6 }}
          >
            {isRunning
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Play size={13} />
                </motion.div>
              : <Play size={13} />
            }
            Run
          </button>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────── */}
      <div style={styles.layout}>

        {/* Editor + Terminal column */}
        <div style={styles.editorCol}>

          {/* Monaco Editor */}
          <div style={styles.editorWrap}>
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              onMount={handleEditorMount}
              options={editorOptions}
            />
          </div>

          {/* Terminal panel */}
          <AnimatePresence>
            {bottomPanel === 'terminal' && (
              <motion.div
                style={styles.terminalWrap}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 220, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <TerminalPanel
                  output={output}
                  isRunning={isRunning}
                  error={execError}
                  onClear={clearOutput}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {rightPanel === 'ai' && (
            <motion.div
              style={styles.aiPanelWrap}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <AIPanel
                code={getCode()}
                language={language}
                chatHistory={ai.chatHistory}
                chatLoading={ai.chatLoading}
                onSendChat={ai.sendChat}
                reviewLoading={ai.reviewLoading}
                reviewIssues={ai.reviewIssues}
                onReview={ai.reviewCode}
                onClearReview={ai.clearReview}
                fixLoading={ai.fixLoading}
                fixResult={ai.fixResult}
                onFix={ai.autoFix}
                onApplyFix={handleApplyFix}
                onClearFix={ai.clearFix}
                lastError={lastError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────
const styles = {
  page: {
    height: '100vh', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  loading: {
    height: '100vh', display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 12,
  },

  toolbar: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px', height: 48,
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0, gap: 12,
  },
  toolbarLeft: {
    display: 'flex', alignItems: 'center',
    gap: 10, flex: 1, minWidth: 0,
  },
  toolbarCenter: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarRight: {
    display: 'flex', alignItems: 'center',
    gap: 8, flex: 1, justifyContent: 'flex-end',
  },
  toolbarDivider: {
    width: 1, height: 20,
    background: 'var(--border)', margin: '0 4px',
  },
  roomName: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700, fontSize: '14px',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', maxWidth: 180,
  },
  connStatus: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: '11px', fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  iconBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', padding: 6, borderRadius: 6,
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },

  langDropWrap: { position: 'relative' },
  langDropBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6, padding: '5px 12px',
    color: 'var(--text-secondary)',
    fontSize: '13px', fontFamily: 'var(--font-mono)',
    cursor: 'pointer', transition: 'border-color 0.15s',
  },
  langDropMenu: {
    position: 'absolute', top: '110%', left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8, overflow: 'hidden',
    minWidth: 140, zIndex: 100,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    transformOrigin: 'top center',
  },
  langOption: {
    display: 'block', width: '100%',
    padding: '8px 14px', textAlign: 'left',
    background: 'transparent', border: 'none',
    fontSize: '13px', fontFamily: 'var(--font-mono)',
    cursor: 'pointer', transition: 'background 0.1s',
  },

  onlineUsers: { display: 'flex', alignItems: 'center', gap: 6 },
  userDot: {
    width: 24, height: 24, borderRadius: '50%',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '10px',
    fontWeight: 700, color: '#fff',
    border: '2px solid var(--bg-secondary)',
    cursor: 'default',
  },
  userCount: {
    display: 'flex', alignItems: 'center', gap: 3,
    fontSize: '12px', color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  roomIdWrap: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6, padding: '4px 8px',
  },
  roomIdText: {
    fontFamily: 'var(--font-mono)', fontSize: '12px',
    color: 'var(--text-muted)',
  },

  layout: {
    flex: 1, display: 'flex',
    overflow: 'hidden', minHeight: 0,
  },
  editorCol: {
    flex: 1, display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
    minWidth: 0,
  },
  editorWrap: { flex: 1, overflow: 'hidden' },
  terminalWrap: { overflow: 'hidden', flexShrink: 0 },
  aiPanelWrap: { overflow: 'hidden', flexShrink: 0 },
}

export default EditorRoom
