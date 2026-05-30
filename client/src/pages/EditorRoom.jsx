import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { useAuth } from '../context/AuthContext'
import useCollaboration from '../hooks/useCollaboration'
import useExecution from '../hooks/useExecution'
import useAI from '../hooks/useAI'
import TerminalPanel from '../components/TerminalPanel'
import AIPanel from '../components/AIPanel'
import FileTree from '../components/FileTree'
import axios from 'axios'
import toast from 'react-hot-toast'
import JSZip from 'jszip'
import CommandPalette from '../components/CommandPalette'
import {
  Code2, Play, Users, ChevronDown,
  Copy, Check, Brain, Terminal,
  ArrowLeft, Save,
  Loader2, X, Eye, FileCode2
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Logo from '../components/Logo'
import { renderAvatar } from './ProfilePage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const LANGUAGES = ['javascript','typescript','python','java','cpp','c','go','rust']

const EDITOR_THEMES = [
  { id: 'vs-dark', label: 'VS Dark' },
  { id: 'light', label: 'VS Light' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'onedark', label: 'One Dark Pro' },
]

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
  const { theme, toggleTheme } = useTheme()
  const editorRef         = useRef(null)

  const [room,         setRoom]         = useState(null)
  const [files,        setFiles]        = useState([])
  const [activeFile,   setActiveFile]   = useState(null)
  const [language,     setLanguage]     = useState('javascript')
  const [showLangDrop, setShowLangDrop] = useState(false)
  const [showThemeDrop, setShowThemeDrop] = useState(false)
  const [bottomPanel,  setBottomPanel]  = useState('terminal')
  const [rightPanel,   setRightPanel]   = useState('ai')
  const [lastError,    setLastError]    = useState(null)
  const [saving,       setSaving]       = useState(false)

  // Web dev preview state
  const [showPreview, setShowPreview] = useState(false)
  
  // Multi-tab editor state
  const [openTabs, setOpenTabs] = useState([])

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const autoSaveTimerRef = useRef(null)

  // Participants drawer states
  const [showPeople, setShowPeople] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2000)
  }

  // Resizing layout states
  const [fileTreeWidth, setFileTreeWidth] = useState(220)
  const [terminalHeight, setTerminalHeight] = useState(200)
  const [rightPanelWidth, setRightPanelWidth] = useState(320)
  const [isDragging, setIsDragging] = useState(null)

  // ── Hooks ──────────────────────────────────────────────
  const {
    users, messages, isConnected,
    bindEditor, sendMessage, changeLanguage,
    lastEditedBy, setLastEditedBy
  } = useCollaboration(roomId, user?.username, user?.avatar, editorRef)

  const {
    output, isRunning, error: execError,
    runCode, clearOutput
  } = useExecution()

  const ai = useAI(token)

  // Handle panel resizing
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (isDragging === "filetree") {
        const newWidth = Math.max(160, Math.min(450, e.clientX));
        setFileTreeWidth(newWidth);
      } else if (isDragging === "terminal") {
        const newHeight = Math.max(100, Math.min(500, window.innerHeight - e.clientY));
        setTerminalHeight(newHeight);
      } else if (isDragging === "rightpanel") {
        const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // ── Load room data ─────────────────────────────────────
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRoom(res.data.room)
        let roomFiles = res.data.room.files || []
        // If no files (old room), create a default one
        if (roomFiles.length === 0) {
          const newFile = await axios.post(
            `${API_URL}/api/files/${roomId}`,
            { name: 'main.js', language: res.data.room.language || 'javascript' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          roomFiles = [newFile.data.file]
        }
        setFiles(roomFiles)
        setActiveFile(roomFiles[0])
        setLanguage(roomFiles[0].language || 'javascript')
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
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    // Define custom themes
    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'identifier', foreground: 'f8f8f2' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'regexp', foreground: 'ffb86c' },
        { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
        { token: 'class', foreground: '50fa7b' },
        { token: 'function', foreground: '50fa7b' },
      ],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#6272a4',
        'editorLineNumber.activeForeground': '#ff79c6',
        'editor.lineHighlightBackground': '#44475a30',
        'editor.selectionBackground': '#44475a',
      }
    })

    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '75715E' },
        { token: 'keyword', foreground: 'F92672' },
        { token: 'identifier', foreground: 'F8F8F2' },
        { token: 'string', foreground: 'E6DB74' },
        { token: 'number', foreground: 'AE81FF' },
        { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
        { token: 'class', foreground: 'A6E22E' },
        { token: 'function', foreground: 'A6E22E' },
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#F8F8F2',
        'editorLineNumber.foreground': '#90908a',
        'editorLineNumber.activeForeground': '#F92672',
        'editor.lineHighlightBackground': '#3E3D32',
        'editor.selectionBackground': '#49483E',
      }
    })

    monaco.editor.defineTheme('onedark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'identifier', foreground: 'abb2bf' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'class', foreground: 'e5c07b' },
        { token: 'function', foreground: '61afef' },
      ],
      colors: {
        'editor.background': '#282c34',
        'editor.foreground': '#abb2bf',
        'editorLineNumber.foreground': '#4b5263',
        'editorLineNumber.activeForeground': '#c678dd',
        'editor.lineHighlightBackground': '#2c313c',
        'editor.selectionBackground': '#3e4451',
      }
    })

    bindEditor(editor)

    // Set initial content from active file
    if (activeFile?.content) {
      editor.setValue(activeFile.content)
    }
  }

  // ── Sync editor when active file changes ─────────────
  useEffect(() => {
    if (editorRef.current && activeFile) {
      const currentContent = editorRef.current.getValue()
      if (currentContent !== activeFile.content) {
        editorRef.current.setValue(activeFile.content || '')
      }
      setLanguage(activeFile.language || 'javascript')
      // Add to open tabs if not already there
      setOpenTabs(prev => {
        if (prev.find(t => t.id === activeFile.id)) return prev
        return [...prev, activeFile]
      })
    }
  }, [activeFile?.id])

  // ── Auto-save on content change ────────────────────────
  const handleEditorChange = useCallback(() => {
    if (!activeFile || !editorRef.current) return
    const content = editorRef.current.getValue()
    setLastEditedBy({ username: user?.username, timestamp: new Date() })
    // Update local files state
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content } : f))
    // Update openTabs too
    setOpenTabs(prev => prev.map(t => t.id === activeFile.id ? { ...t, content } : t))
    // Debounced auto-save
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    setAutoSaveStatus('saving')
    autoSaveTimerRef.current = setTimeout(async () => {
      await saveFileContent(activeFile.id, content)
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    }, 2000)
  }, [activeFile?.id])

  // ── File operations ───────────────────────────────────
  const handleSelectFile = (file) => {
    // Save current file content before switching
    if (editorRef.current && activeFile) {
      const currentContent = editorRef.current.getValue()
      saveFileContent(activeFile.id, currentContent)
    }
    setActiveFile(file)
  }

  const saveFileContent = async (fileId, content) => {
    try {
      await axios.put(
        `${API_URL}/api/files/${fileId}`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }

  const handleCreateFile = async (name, language) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/files/${roomId}`,
        { name, language },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFiles((prev) => [...prev, res.data.file])
      setActiveFile(res.data.file)
      setLanguage(language)
      toast.success(`Created ${name}`)
    } catch {
      toast.error('Failed to create file')
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (files.length <= 1) {
      toast.error('Cannot delete the last file')
      return
    }
    try {
      await axios.delete(
        `${API_URL}/api/files/${fileId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      setOpenTabs((prev) => prev.filter((t) => t.id !== fileId))
      if (activeFile?.id === fileId) {
        const remaining = files.filter((f) => f.id !== fileId)
        setActiveFile(remaining[0])
      }
      toast.success('File deleted')
    } catch {
      toast.error('Failed to delete file')
    }
  }

  // ── Close a tab ────────────────────────────────────────
  const handleCloseTab = (fileId) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== fileId)
      if (activeFile?.id === fileId && next.length > 0) {
        setActiveFile(next[next.length - 1])
      }
      return next
    })
  }

  // ── Build web preview HTML ─────────────────────────────
  const buildPreviewHTML = useCallback(() => {
    // Save current editor content first
    if (editorRef.current && activeFile) {
      const content = editorRef.current.getValue()
      const updatedFiles = files.map(f => f.id === activeFile.id ? { ...f, content } : f)
      
      const htmlFiles = updatedFiles.filter(f => f.name.endsWith('.html'))
      const cssFiles = updatedFiles.filter(f => f.name.endsWith('.css'))
      const jsFiles = updatedFiles.filter(f => f.name.endsWith('.js') && !f.name.endsWith('.json'))
      
      let baseHTML = htmlFiles.length > 0 ? htmlFiles[0].content || '' : ''
      
      const cssContent = cssFiles.map(f => f.content || '').join('\n')
      const jsContent = jsFiles.map(f => f.content || '').join('\n')
      
      const consoleInterceptor = `
        <script>
          (function() {
            const _log = console.log;
            const _error = console.error;
            const _warn = console.warn;
            const _info = console.info;

            function sendLog(type, args) {
              const text = Array.from(args).map(arg => {
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              window.parent.postMessage({
                type: 'IFRAME_CONSOLE_LOG',
                logType: type,
                text: text
              }, '*');
            }

            console.log = function() { sendLog('log', arguments); _log.apply(console, arguments); };
            console.error = function() { sendLog('error', arguments); _error.apply(console, arguments); };
            console.warn = function() { sendLog('warn', arguments); _warn.apply(console, arguments); };
            console.info = function() { sendLog('info', arguments); _info.apply(console, arguments); };
          })();
        </script>
      `;

      if (!baseHTML) {
        baseHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  ${consoleInterceptor}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${cssContent}</style>
</head>
<body>
  <script>${jsContent}</script>
</body>
</html>`
      } else {
        // Inject consoleInterceptor at start of <head> or <html>
        if (baseHTML.includes('<head>')) {
          baseHTML = baseHTML.replace('<head>', `<head>\n${consoleInterceptor}`)
        } else if (baseHTML.includes('<html>')) {
          baseHTML = baseHTML.replace('<html>', `<html>\n${consoleInterceptor}`)
        } else {
          baseHTML = consoleInterceptor + baseHTML
        }

        // Inject CSS before </head>
        if (cssContent) {
          if (baseHTML.includes('</head>')) {
            baseHTML = baseHTML.replace('</head>', `<style>${cssContent}</style>\n</head>`)
          } else {
            baseHTML = `<style>${cssContent}</style>\n` + baseHTML
          }
        }
        // Inject JS before </body>
        if (jsContent) {
          if (baseHTML.includes('</body>')) {
            baseHTML = baseHTML.replace('</body>', `<script>${jsContent}</script>\n</body>`)
          } else {
            baseHTML = baseHTML + `\n<script>${jsContent}</script>`
          }
        }
      }
      return baseHTML
    }
    return '<html><body><h1>No files to preview</h1></body></html>'
  }, [files, activeFile])

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

  // ── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRun()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [language, getCode])

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

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [consoleLogs, setConsoleLogs] = useState([])
  const [previewHTML, setPreviewHTML] = useState('')

  const monacoRef = useRef(null)

  // ── Iframe console capture ─────────────────────────────
  useEffect(() => {
    const handleIframeMessage = (e) => {
      if (e.data && e.data.type === 'IFRAME_CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, {
          type: e.data.logType,
          text: e.data.text,
          timestamp: new Date().toLocaleTimeString()
        }])
      }
    }
    window.addEventListener('message', handleIframeMessage)
    return () => window.removeEventListener('message', handleIframeMessage)
  }, [])

  // ── Debounce preview content update ───────────────────
  useEffect(() => {
    const html = buildPreviewHTML()
    const timer = setTimeout(() => {
      setPreviewHTML(html)
    }, 400)
    return () => clearTimeout(timer)
  }, [files, activeFile, buildPreviewHTML])

  // ── Download as ZIP ────────────────────────────────────
  const handleDownloadZIP = async () => {
    try {
      const zip = new JSZip()
      files.forEach(file => {
        let content = file.content || ''
        if (activeFile && file.id === activeFile.id && editorRef.current) {
          content = editorRef.current.getValue()
        }
        zip.file(file.name, content)
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${room?.name || 'project'}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Project downloaded as ZIP!')
    } catch (err) {
      console.error('Failed to generate ZIP:', err)
      toast.error('Failed to download ZIP')
    }
  }

  const isWebDev = files.some(f => f.name.endsWith('.html')) && activeFile && (
    activeFile.name.endsWith('.html') ||
    activeFile.name.endsWith('.css') ||
    activeFile.name.endsWith('.js')
  );

  // ── Command palette actions ────────────────────────────
  const commandActions = useMemo(() => {
    const actions = [
      { id: 'run', label: 'Run Code', icon: <Play size={14} />, shortcut: 'Ctrl+Enter', action: handleRun, category: 'Editor' },
      { id: 'save', label: 'Save Snapshot', icon: <Save size={14} />, shortcut: 'Ctrl+S', action: handleSave, category: 'Editor' },
      { id: 'zip', label: 'Download as ZIP', icon: <FileCode2 size={14} />, action: handleDownloadZIP, category: 'File' },
      ...(isWebDev ? [{ id: 'preview', label: 'Open Preview', icon: <Eye size={14} />, action: () => setShowPreview(true), category: 'View' }] : []),
      { id: 'terminal', label: 'Toggle Terminal', icon: <Terminal size={14} />, action: () => setBottomPanel(p => p === 'terminal' ? 'hidden' : 'terminal'), category: 'View' },
      { id: 'ai', label: 'Toggle AI Panel', icon: <Brain size={14} />, action: () => setRightPanel(p => p === 'ai' ? 'hidden' : 'ai'), category: 'View' },
      { id: 'people', label: 'Toggle Participants', icon: <Users size={14} />, action: () => setShowPeople(p => !p), category: 'View' },
      { id: 'copyid', label: 'Copy Room ID', icon: <Copy size={14} />, action: () => { navigator.clipboard.writeText(roomId); toast.success('Room ID copied!') }, category: 'Room' },
      { id: 'dashboard', label: 'Back to Dashboard', icon: <ArrowLeft size={14} />, action: () => navigate('/dashboard'), category: 'Navigation' },
    ]
    // Add theme options
    const themes = [
      { name: 'vs-dark', label: 'Visual Studio Dark' },
      { name: 'light', label: 'Visual Studio Light' },
      { name: 'dracula', label: 'Dracula' },
      { name: 'monokai', label: 'Monokai' },
      { name: 'onedark', label: 'One Dark Pro' },
    ]
    themes.forEach(t => {
      actions.push({
        id: `theme-${t.name}`,
        label: `Theme: ${t.label}`,
        icon: <Eye size={14} />,
        action: () => {
          setEditorTheme(t.name)
          toast.success(`Theme set to ${t.label}`)
        },
        category: 'Appearance'
      })
    })
    // Add language switch commands
    LANGUAGES.forEach(lang => {
      actions.push({
        id: `lang-${lang}`,
        label: `Switch to ${lang}`,
        icon: <Code2 size={14} />,
        action: () => handleLanguageChange(lang),
        category: 'Language',
      })
    })
    // Add file navigation commands
    files.forEach(file => {
      actions.push({
        id: `file-${file.id}`,
        label: `Go to ${file.name}`,
        icon: <FileCode2 size={14} />,
        action: () => handleSelectFile(file),
        category: 'File',
      })
    })
    return actions
  }, [files, language, editorTheme, roomId, activeFile, isWebDev])

  if (!room) {
    return (
      <div style={styles.loading}>
        <div className="spinner-container">
          <div className="spinner-ring" />
          <h2 style={styles.stillLoaderText}>Loading Room...</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            cursor: isDragging === 'terminal' ? 'row-resize' : 'col-resize',
            background: 'transparent',
            userSelect: 'none',
          }}
        />
      )}

      {/* ── Toolbar ────────────────────────────────── */}
      <div style={styles.toolbar}>
        {/* Left */}
        <div style={styles.toolbarLeft}>
          <button
            onClick={() => navigate("/dashboard")}
            style={styles.iconBtn}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} color="var(--text-muted)" />
          </button>

          <div style={styles.toolbarDivider} />

          <Logo size={18} style={{ marginRight: 4 }} />
          <span style={styles.roomName}>{room.name}</span>

          <div style={styles.roomIdWrap}>
            <span style={styles.roomIdText}>{roomId}</span>
            <CopyButton text={roomId} />
          </div>


        </div>

        {/* Center — Language picker, Theme picker & Run Button */}
        <div style={styles.toolbarCenter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Theme Dropdown */}
            <div style={styles.langDropWrap}>
              <button
                onClick={() => setShowThemeDrop((p) => !p)}
                style={styles.langDropBtn}
                title="Select Code Editor Theme"
              >
                {EDITOR_THEMES.find(t => t.id === editorTheme)?.label || editorTheme}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showThemeDrop && (
                  <motion.div
                    style={styles.langDropMenu}
                    initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    {EDITOR_THEMES.map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => {
                          setEditorTheme(themeOption.id);
                          setShowThemeDrop(false);
                          toast.success(`Theme set to ${themeOption.label}`);
                        }}
                        style={{
                          ...styles.langOption,
                          color:
                            themeOption.id === editorTheme
                              ? "var(--accent-cyan)"
                              : "var(--text-secondary)",
                          background:
                            themeOption.id === editorTheme
                              ? "rgba(255,255,255,0.08)"
                              : "transparent",
                        }}
                      >
                        {themeOption.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="btn run-btn-gradient"
              onClick={handleRun}
              disabled={isRunning}
              style={{ padding: "6px 16px", fontSize: "13px", gap: 6 }}
              title="Run Code (Ctrl+Enter)"
            >
              {isRunning ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              ) : (
                <Play size={13} fill="currentColor" />
              )}
              Run
            </button>

            {isWebDev && (
              <button
                onClick={() => setShowPreview(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', fontSize: '13px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 30, color: 'var(--text-primary)',
                  cursor: 'pointer', fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s ease',
                }}
                title="Preview Web Output"
              >
                <Eye size={13} />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={styles.toolbarRight}>
          {/* Clickable Online users list */}
          <button
            onClick={() => setShowPeople(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.03)',
              border: showPeople ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 20,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="View participants"
          >
            <div style={{ display: 'flex' }}>
              {users.slice(0, 3).map((u, i) => (
                <div
                  key={i}
                  style={{
                    marginLeft: i > 0 ? -6 : 0,
                    zIndex: 10 - i,
                    borderRadius: '50%',
                    border: '1.5px solid var(--bg-secondary)',
                    display: 'inline-flex',
                  }}
                >
                  {u.avatar ? (
                    renderAvatar(u.avatar, u.username, 16)
                  ) : (
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: u.color || 'var(--accent-purple)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 700,
                      }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {users.length > 0 && (
              <span style={{ fontSize: '12px', color: showPeople ? '#ffffff' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={11} /> {users.length}
              </span>
            )}
          </button>

          <div style={styles.toolbarDivider} />

          {/* Panel toggles */}
          <button
            onClick={() => setRightPanel((p) => (p === "ai" ? "hidden" : "ai"))}
            style={{
              ...styles.iconBtn,
              color:
                rightPanel === "ai"
                  ? "#ffffff"
                  : "var(--text-muted)",
              background:
                rightPanel === "ai"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "transparent",
            }}
            title="Toggle Right Panel"
          >
            <Brain size={16} />
          </button>
          <button
            onClick={() =>
              setBottomPanel((p) => (p === "terminal" ? "hidden" : "terminal"))
            }
            style={{
              ...styles.iconBtn,
              color:
                bottomPanel === "terminal"
                  ? "#ffffff"
                  : "var(--text-muted)",
              background:
                bottomPanel === "terminal"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "transparent",
            }}
            title="Toggle Terminal"
          >
            <Terminal size={16} />
          </button>

          <div style={styles.toolbarDivider} />

          {/* Auto-save indicator */}
          {autoSaveStatus !== 'idle' && (
            <span className={`autosave-indicator ${autoSaveStatus}`}>
              {autoSaveStatus === 'saving' ? (
                <><Loader2 size={10} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</>
              ) : (
                <><Check size={10} /> Saved</>
              )}
            </span>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...styles.iconBtn }}
            title="Save Snapshot (Ctrl+S)"
          >
            {saving ? (
              <Loader2 size={15} color="var(--accent-cyan)" style={{ animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <Save size={15} color="var(--text-muted)" />
            )}
          </button>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────── */}
      <div style={styles.layout}>
        {/* File tree wrapping for resizability */}
        <div style={{ width: fileTreeWidth, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <FileTree
            files={files}
            activeFile={activeFile}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Resizer */}
        <div
          className={`resize-handle-v ${isDragging === 'filetree' ? 'active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging('filetree');
          }}
        />

        {/* Editor + Terminal column */}
        <div style={styles.editorCol}>
          {/* Tab bar */}
          {openTabs.length > 0 && (
            <div className="editor-tabs-bar">
              {openTabs.map(tab => (
                <div
                  key={tab.id}
                  className={`editor-tab ${activeFile?.id === tab.id ? 'active' : ''}`}
                  onClick={() => handleSelectFile(tab)}
                >
                  <FileCode2 size={12} style={{ opacity: 0.6 }} />
                  {tab.name.split('/').pop()}
                  <button
                    className="editor-tab-close"
                    onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Monaco Editor */}
          <div style={styles.editorWrap}>
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              theme={theme === "light" ? "light" : editorTheme}
              onMount={handleEditorMount}
              onChange={handleEditorChange}
              options={editorOptions}
            />
          </div>

          {/* Horizontal Resizer */}
          {bottomPanel === "terminal" && (
            <div
              className={`resize-handle-h ${isDragging === 'terminal' ? 'active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging('terminal');
              }}
            />
          )}

          {/* Terminal panel */}
          <AnimatePresence>
            {bottomPanel === "terminal" && (
              <motion.div
                style={styles.terminalWrap}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: terminalHeight, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <TerminalPanel
                  output={output}
                  isRunning={isRunning}
                  error={execError}
                  onClear={() => { clearOutput(); setConsoleLogs([]); }}
                  consoleLogs={consoleLogs}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resizer */}
        {rightPanel === "ai" && (
          <div
            className={`resize-handle-v ${isDragging === 'rightpanel' ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging('rightpanel');
            }}
          />
        )}

        {/* AI Panel */}
        <AnimatePresence>
          {rightPanel === "ai" && (
            <motion.div
              style={styles.aiPanelWrap}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: rightPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <AIPanel
                currentUser={user?.username}
                users={users}
                messages={messages}
                onSendRoomMessage={sendMessage}
                chatHistory={ai.chatHistory}
                chatLoading={ai.chatLoading}
                onSendChat={ai.sendChat}
                code={getCode()}
                language={language}
                lastEditedBy={lastEditedBy}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* People Popover */}
      <AnimatePresence>
        {showPeople && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={styles.peoplePopover}
          >
            {/* Header */}
            <div style={styles.peoplePopoverHeader}>
              <span style={{ fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                <Users size={14} color="var(--accent-green)" /> Members ({users.length})
              </span>
              <button onClick={() => setShowPeople(false)} style={styles.popoverClose} title="Close">
                <X size={14} />
              </button>
            </div>

            {/* Invite Section */}
            <div style={styles.popoverInvite}>
              <span style={styles.popoverInviteTitle}>Invite Link</span>
              <div style={styles.popoverInviteRow}>
                <span style={styles.popoverInviteUrl}>{window.location.href}</span>
                <button onClick={handleCopyInvite} style={styles.popoverInviteBtn}>
                  {copiedInvite ? <Check size={11} color="var(--accent-green)" /> : <Copy size={11} />}
                  {copiedInvite ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={styles.peoplePopoverBody}>
              {users.map((u, i) => {
                const isMe = u.username === user?.username;
                const isHost = i === 0;

                return (
                  <div key={i} style={styles.peoplePopoverItem}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      {u.avatar ? (
                        renderAvatar(u.avatar, u.username, 26)
                      ) : (
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: u.color || "var(--accent-cyan)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span style={styles.peopleStatusDot} />
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={styles.peopleName}>
                        {u.username}
                        {isMe && <span style={{ color: "var(--text-muted)", fontSize: "10px" }}> (you)</span>}
                      </span>
                      <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                        {isHost && <span style={styles.hostBadge}>Host</span>}
                        <span style={styles.roleBadge}>Contributor</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Web Dev Preview Overlay ────────────────── */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="preview-header">
              <div className="preview-header-title">
                <Eye size={16} />
                Live Preview
              </div>
              <button
                className="preview-close-btn"
                onClick={() => setShowPreview(false)}
              >
                <X size={16} />
              </button>
            </div>
            <iframe
              className="preview-iframe"
              srcDoc={previewHTML}
              title="Web Preview"
              sandbox="allow-scripts allow-modals"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        actions={commandActions}
      />
    </div>
  );
}
const styles = {
  page: {
    height: '100vh', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  loading: {
    height: '100vh', display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#050505',
  },
  stillLoaderInner: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  stillLoaderText: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)',
    fontFamily: 'var(--font-display)',
  },

  toolbar: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px', height: 48,
    background: 'rgba(10, 10, 14, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0, gap: 12,
    position: 'relative', zIndex: 50,
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
  themeToggleBtn: {
    background: "transparent",
    border: "1px solid var(--border-bright)",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--text-secondary)",
    transition: "all 0.2s ease",
    padding: 0,
  },

  langDropWrap: { position: 'relative' },
  langDropBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 6, padding: '6px 14px',
    color: 'var(--text-primary)',
    fontSize: '13px', fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
  langDropMenu: {
    position: 'absolute', top: '110%', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(20, 20, 26, 0.98)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 8, overflow: 'hidden',
    minWidth: 140, zIndex: 100,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
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
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 6, padding: '4px 10px',
  },
  roomIdText: {
    fontFamily: 'var(--font-mono)', fontSize: '12px',
    color: 'var(--text-primary)',
    fontWeight: 600,
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

  /* Floating People Popover */
  peoplePopover: {
    position: 'fixed',
    top: '56px',
    right: '16px',
    width: '320px',
    maxHeight: 'calc(100vh - 80px)',
    background: 'rgba(10, 10, 14, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  peoplePopoverHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.01)',
  },
  popoverClose: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  popoverInvite: {
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  popoverInviteTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
  },
  popoverInviteRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  popoverInviteUrl: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  popoverInviteBtn: {
    padding: '4px 10px',
    fontSize: '11px',
    background: 'var(--text-primary)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  peoplePopoverBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  peoplePopoverItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.01)",
    border: "1px solid rgba(255, 255, 255, 0.02)",
  },
  peopleStatusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--accent-green)",
    border: "2px solid var(--bg-card)",
  },
  peopleName: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  hostBadge: {
    padding: "1px 5px",
    background: "rgba(255, 255, 255, 0.1)",
    color: "var(--text-primary)",
    fontSize: "9px",
    fontFamily: "var(--font-mono)",
    borderRadius: "4px",
    width: "fit-content",
  },
  roleBadge: {
    padding: "1px 5px",
    background: "rgba(255, 255, 255, 0.03)",
    color: "var(--text-muted)",
    fontSize: "9px",
    fontFamily: "var(--font-mono)",
    borderRadius: "4px",
    width: "fit-content",
  },
  peopleIconBtn: {
    width: 24,
    height: 24,
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
}

export default EditorRoom
