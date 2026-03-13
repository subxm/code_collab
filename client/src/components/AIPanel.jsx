import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  MessageSquare,
  Search,
  Zap,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  X,
} from "lucide-react";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "review", label: "Review", icon: Search },
  { id: "fix", label: "Fix", icon: Zap },
];

// ── Severity icon ────────────────────────────────────────
const SeverityIcon = ({ severity }) => {
  if (severity === "error") return <AlertTriangle size={13} color="#ff4d4d" />;
  if (severity === "warning")
    return <AlertTriangle size={13} color="#ffa657" />;
  return <Info size={13} color="var(--accent-cyan)" />;
};

const SEVERITY_COLORS = {
  error: "#ff4d4d",
  warning: "#ffa657",
  suggestion: "var(--accent-cyan)",
};

// ── Chat Message ─────────────────────────────────────────
const ChatMessage = ({ msg }) => (
  <motion.div
    style={{
      ...styles.message,
      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
    }}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    {msg.role === "assistant" && (
      <div style={styles.aiLabel}>
        <Brain size={11} color="var(--accent-cyan)" /> AI
      </div>
    )}
    <div
      style={{
        ...styles.bubble,
        background:
          msg.role === "user" ? "rgba(0,212,255,0.12)" : "var(--bg-elevated)",
        border: `1px solid ${
          msg.role === "user" ? "rgba(0,212,255,0.2)" : "var(--border)"
        }`,
      }}
    >
      <p style={styles.messageText}>{msg.content}</p>
    </div>
  </motion.div>
);

const AIPanel = ({
  code,
  language,
  chatHistory,
  chatLoading,
  onSendChat,
  reviewLoading,
  reviewIssues,
  onReview,
  onClearReview,
  fixLoading,
  fixResult,
  onFix,
  onApplyFix,
  onClearFix,
  lastError,
}) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    onSendChat(chatInput, code, language);
    setChatInput("");
  };

  return (
    <div style={styles.panel}>
      {/* ── Tabs ───────────────────────────────────── */}
      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--accent-cyan)"
                  : "2px solid transparent",
              color:
                activeTab === tab.id
                  ? "var(--accent-cyan)"
                  : "var(--text-muted)",
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────── */}
      <div style={styles.content}>
        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div style={styles.chatWrap}>
            <div style={styles.messages}>
              {chatHistory.length === 0 && (
                <div style={styles.emptyChat}>
                  <Brain size={28} color="var(--text-muted)" />
                  <p style={styles.emptyChatText}>
                    Ask me anything about your code
                  </p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {chatLoading && (
                <motion.div
                  style={styles.aiTyping}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Brain size={11} color="var(--accent-cyan)" />
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    AI is thinking…
                  </motion.span>
                </motion.div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat input */}
            <div style={styles.chatInput}>
              <input
                style={styles.chatField}
                placeholder="Ask about your code…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
              />
              <button
                onClick={handleSend}
                disabled={chatLoading || !chatInput.trim()}
                style={styles.sendBtn}
              >
                {chatLoading ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        )}

        {/* REVIEW TAB */}
        {activeTab === "review" && (
          <div style={styles.tabContent}>
            <button
              className="btn btn-ghost"
              onClick={() => onReview(code, language)}
              disabled={reviewLoading}
              style={{
                width: "100%",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {reviewLoading ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />{" "}
                  Reviewing…
                </>
              ) : (
                <>
                  <Search size={14} /> Review Code
                </>
              )}
            </button>

            {reviewIssues.length > 0 && (
              <div style={styles.issuesList}>
                <div style={styles.issuesHeader}>
                  <span style={styles.issuesCount}>
                    {reviewIssues.length} issue
                    {reviewIssues.length !== 1 ? "s" : ""} found
                  </span>
                  <button onClick={onClearReview} style={styles.clearIssues}>
                    <X size={12} /> Clear
                  </button>
                </div>
                {reviewIssues.map((issue, i) => (
                  <motion.div
                    key={i}
                    style={{
                      ...styles.issue,
                      borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity] || "var(--border)"}`,
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div style={styles.issueTop}>
                      <SeverityIcon severity={issue.severity} />
                      <span
                        style={{
                          ...styles.issueSeverity,
                          color: SEVERITY_COLORS[issue.severity],
                        }}
                      >
                        {issue.severity}
                      </span>
                      <span style={styles.issueLine}>Line {issue.line}</span>
                    </div>
                    <p style={styles.issueMsg}>{issue.message}</p>
                    <p style={styles.issueFix}>💡 {issue.fix}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {!reviewLoading && reviewIssues.length === 0 && (
              <div style={styles.noIssues}>
                <CheckCircle size={24} color="var(--accent-green)" />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Click Review to analyse your code
                </span>
              </div>
            )}
          </div>
        )}

        {/* FIX TAB */}
        {activeTab === "fix" && (
          <div style={styles.tabContent}>
            <button
              className="btn btn-ghost"
              onClick={() => onFix(code, lastError, language)}
              disabled={fixLoading || !lastError}
              style={{
                width: "100%",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              {fixLoading ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />{" "}
                  Fixing…
                </>
              ) : (
                <>
                  <Zap size={14} /> Auto-fix Last Error
                </>
              )}
            </button>

            {!lastError && (
              <p style={styles.noError}>
                Run your code first. If there's an error, AI will fix it here.
              </p>
            )}

            {lastError && !fixResult && (
              <div style={styles.errorPreview}>
                <span style={styles.errorLabel}>Last error:</span>
                <pre style={styles.errorPre}>{lastError}</pre>
              </div>
            )}

            <AnimatePresence>
              {fixResult && (
                <motion.div
                  style={styles.fixResult}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div style={styles.fixHeader}>
                    <CheckCircle size={14} color="var(--accent-green)" />
                    <span style={styles.fixTitle}>Fix ready</span>
                    <button onClick={onClearFix} style={styles.clearIssues}>
                      <X size={12} />
                    </button>
                  </div>
                  <p style={styles.fixExplanation}>{fixResult.explanation}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => onApplyFix(fixResult.fixedCode)}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginTop: 12,
                    }}
                  >
                    Apply Fix
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  panel: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-secondary)",
    borderLeft: "1px solid var(--border)",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-card)",
  },
  tab: {
    flex: 1,
    padding: "10px 4px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    transition: "color 0.15s",
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  chatWrap: { display: "flex", flexDirection: "column", height: "100%" },
  messages: {
    flex: 1,
    overflow: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  emptyChat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "32px 16px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  emptyChatText: { fontSize: "13px", color: "var(--text-muted)" },
  aiLabel: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--accent-cyan)",
    marginBottom: 4,
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
  },
  message: { display: "flex", flexDirection: "column", maxWidth: "88%" },
  bubble: { borderRadius: 10, padding: "8px 12px" },
  messageText: {
    fontSize: "13px",
    lineHeight: 1.65,
    color: "var(--text-primary)",
    whiteSpace: "pre-wrap",
  },
  aiTyping: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 0",
  },
  chatInput: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-card)",
  },
  chatField: {
    flex: 1,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontFamily: "var(--font-body)",
    outline: "none",
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "var(--accent-cyan)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--bg-primary)",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },

  tabContent: { padding: "14px", overflow: "auto", flex: 1 },
  issuesList: { display: "flex", flexDirection: "column", gap: 10 },
  issuesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  issuesCount: {
    fontSize: "12px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  clearIssues: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  issue: {
    background: "var(--bg-card)",
    borderRadius: 8,
    padding: "10px 12px",
    border: "1px solid var(--border)",
  },
  issueTop: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  issueSeverity: {
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
  },
  issueLine: {
    fontSize: "11px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    marginLeft: "auto",
  },
  issueMsg: {
    fontSize: "13px",
    color: "var(--text-primary)",
    marginBottom: 6,
    lineHeight: 1.5,
  },
  issueFix: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  noIssues: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "32px 0",
    color: "var(--text-muted)",
  },

  noError: {
    fontSize: "13px",
    color: "var(--text-muted)",
    textAlign: "center",
    padding: "16px 0",
    lineHeight: 1.6,
  },
  errorPreview: {
    background: "var(--bg-card)",
    border: "1px solid rgba(255,77,77,0.2)",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 8,
  },
  errorLabel: {
    fontSize: "11px",
    color: "#ff4d4d",
    fontFamily: "var(--font-mono)",
  },
  errorPre: {
    fontSize: "12px",
    color: "#ff6b6b",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    marginTop: 6,
    fontFamily: "var(--font-mono)",
  },
  fixResult: {
    background: "var(--bg-card)",
    border: "1px solid rgba(0,255,157,0.2)",
    borderRadius: 8,
    padding: "12px",
  },
  fixHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  fixTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--accent-green)",
    flex: 1,
  },
  fixExplanation: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
};

export default AIPanel;
