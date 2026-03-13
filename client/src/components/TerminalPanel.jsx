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

const TerminalPanel = ({ output, isRunning, error, onClear }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output, error]);

  return (
    <div style={styles.terminal}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Terminal size={13} color="var(--accent-green)" />
          <span style={styles.headerTitle}>Terminal</span>
          {isRunning && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.errorText}
            >
              <span style={styles.prompt}>$</span>
              {error}
            </motion.div>
          ) : output ? (
            <motion.div
              key="output"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {output.stdout && (
                <div style={styles.outputBlock}>
                  <span style={styles.prompt}>stdout</span>
                  <pre style={styles.pre}>{output.stdout}</pre>
                </div>
              )}
              {output.stderr && (
                <div style={styles.outputBlock}>
                  <span style={{ ...styles.prompt, color: "#ff4d4d" }}>
                    stderr
                  </span>
                  <pre style={{ ...styles.pre, color: "#ff6b6b" }}>
                    {output.stderr}
                  </pre>
                </div>
              )}
              {output.compileOutput && (
                <div style={styles.outputBlock}>
                  <span style={{ ...styles.prompt, color: "#ffa657" }}>
                    compile
                  </span>
                  <pre style={{ ...styles.pre, color: "#ffa657" }}>
                    {output.compileOutput}
                  </pre>
                </div>
              )}
              {output.time && (
                <div style={styles.meta}>
                  Finished in {output.time}s
                  {output.memory && ` · ${Math.round(output.memory / 1024)}MB`}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              style={styles.empty}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span style={styles.prompt}>$</span>
              <span style={{ color: "var(--text-muted)" }}>
                Run your code to see output here
              </span>
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
    background: "var(--bg-primary)",
    fontFamily: "var(--font-mono)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-secondary)",
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
