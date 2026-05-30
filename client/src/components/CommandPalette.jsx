import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Terminal, Brain, Users, Save, Copy,
  ArrowLeft, FileCode2, Code2, Eye, Search, Command
} from 'lucide-react'

const CommandPalette = ({ isOpen, onClose, actions }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setQuery('')
        setSelectedIndex(0)
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const filtered = useMemo(() => {
    if (!query.trim()) return actions
    const q = query.toLowerCase()
    return actions.filter(a =>
      a.label.toLowerCase().includes(q) ||
      (a.category && a.category.toLowerCase().includes(q))
    )
  }, [query, actions])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex]
      if (item) item.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      filtered[selectedIndex].action()
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        style={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onClose}
      >
        <motion.div
          style={styles.palette}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Search input */}
          <div style={styles.inputWrap}>
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={inputRef}
              style={styles.input}
              placeholder="Type a command..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
            />
            <kbd style={styles.kbd}>ESC</kbd>
          </div>

          {/* Results */}
          <div style={styles.list} ref={listRef}>
            {filtered.length === 0 && (
              <div style={styles.empty}>No matching commands</div>
            )}
            {filtered.map((item, i) => (
              <button
                key={item.id || i}
                style={{
                  ...styles.item,
                  background: i === selectedIndex ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                }}
                onClick={() => { item.action(); onClose() }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span style={styles.itemIcon}>
                  {item.icon || <Command size={14} />}
                </span>
                <span style={styles.itemLabel}>{item.label}</span>
                {item.shortcut && (
                  <span style={styles.itemShortcut}>{item.shortcut}</span>
                )}
                {item.category && (
                  <span style={styles.itemCategory}>{item.category}</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 10001,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '15vh',
  },
  palette: {
    width: '520px',
    maxHeight: '420px',
    background: 'rgba(18, 18, 22, 0.98)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: 'fit-content',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
  },
  kbd: {
    padding: '2px 6px',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px',
    maxHeight: '350px',
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.1s',
    textAlign: 'left',
  },
  itemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  itemLabel: {
    flex: 1,
    fontSize: '13px',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  itemShortcut: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  itemCategory: {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
}

export default CommandPalette
