import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";

const TerminalPanel = ({ output, isRunning, error, onClear, consoleLogs }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output, error, consoleLogs]);

  return (
    <div style={styles.terminal}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Terminal size={14} color="var(--text-secondary)" style={{ marginRight: 6 }} />
          <span style={styles.headerTitle}>Terminal</span>
          {isRunning && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <Loader2 size={12} color="var(--accent-cyan)" />
            </motion.div>
          )}
        </div>
        <div style={styles.headerRight}>
          {/* Status indicator */}
          {output && !isRunning && (
            <span style={styles.status}>
              {output.status === "Accepted" ? (
                <>
                  <CheckCircle size={11} color="var(--accent-green)" /> Accepted
                </>
              ) : (
                <>
                  <XCircle size={11} color="#ff4d4d" /> {output.status}
                </>
              )}
            </span>
          )}
          {(output || error) && (
            <button onClick={onClear} style={styles.clearBtn} title="Clear">
              <Trash2 size={13} color="var(--text-muted)" />
            </button>
          )}
        </div>
      </div>

      {/* Output */}
      <div style={styles.body}>
        <AnimatePresence mode="wait">
          {isRunning ? (
            <motion.div
              key="running"
              style={styles.running}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span style={styles.prompt}>$</span>
              <motion.span
                style={{ color: "var(--accent-cyan)" }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Running…
              </motion.span>
            </motion.div>
          ) : (
            <motion.div key="output-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Show console logs from preview */}
              {consoleLogs && consoleLogs.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
                    Browser Console Logs
                  </div>
                  {consoleLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px' }}>
                        <span className={log.type === 'error' ? 'term-error' : log.type === 'warn' ? 'term-warning' : 'term-system'} style={{ fontWeight: 600 }}>
                          {log.type.toUpperCase()}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{log.timestamp}</span>
                      </div>
                      <pre style={styles.pre} className={log.type === 'error' ? 'term-error' : log.type === 'warn' ? 'term-warning' : 'term-success'}>
                        {log.text}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Show server compilation output */}
              {output && (
                <div>
                  {output.stdout && (
                    <div style={styles.outputBlock}>
                      <span className="term-system" style={{ marginRight: 10 }}>stdout</span>
                      <pre style={styles.pre} className="term-success">{output.stdout}</pre>
                    </div>
                  )}
                  {output.stderr && (
                    <div style={styles.outputBlock}>
                      <span className="term-error" style={styles.prompt}>stderr</span>
                      <pre style={styles.pre} className="term-error">{output.stderr}</pre>
                    </div>
                  )}
                  {output.compileOutput && (
                    <div style={styles.outputBlock}>
                      <span className="term-warning" style={styles.prompt}>compile</span>
                      <pre style={styles.pre} className="term-warning">{output.compileOutput}</pre>
                    </div>
                  )}
                  {output.time && (
                    <div style={styles.meta}>
                      Finished in {output.time}s
                      {output.memory && ` · ${Math.round(output.memory / 1024)}MB`}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={styles.errorText}>
                  <span style={styles.prompt}>$</span>
                  {error}
                </div>
              )}

              {!error && !output && (!consoleLogs || consoleLogs.length === 0) && (
                <div style={styles.empty}>
                  <span style={styles.prompt}>$</span>
                  <span className="term-system">Run your code or open preview to see output here</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const styles = {
  terminal: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "rgba(10, 10, 14, 0.9)",
    fontFamily: "var(--font-mono)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(20, 20, 26, 0.45)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
    borderRadius: 4,
  },
  body: {
    flex: 1,
    overflow: "auto",
    padding: "12px 16px",
    fontSize: "13px",
    lineHeight: 1.7,
  },
  prompt: {
    color: "var(--accent-green)",
    marginRight: 10,
    userSelect: "none",
  },
  running: { display: "flex", alignItems: "center" },
  errorText: {
    display: "flex",
    alignItems: "flex-start",
    color: "#ff6b6b",
    gap: 8,
  },
  outputBlock: { marginBottom: 8 },
  pre: {
    margin: "4px 0 0 28px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "var(--text-primary)",
    fontSize: "13px",
  },
  meta: {
    marginTop: 8,
    fontSize: "11px",
    color: "var(--text-muted)",
    paddingTop: 8,
    borderTop: "1px solid var(--border)",
  },
  empty: { display: "flex", alignItems: "center", gap: 0, opacity: 0.6 },
};

export default TerminalPanel;
