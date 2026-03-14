import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, MessageSquare, Send, Loader2, Users, X } from "lucide-react";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "ai", label: "Ask AI", icon: Brain },
];

// ── Room Chat Message ────────────────────────────────────
const RoomChatMessage = ({ msg, currentUser }) => {
  const isMe = msg.username === currentUser;
  return (
    <motion.div
      style={{
        ...styles.msgWrap,
        alignItems: isMe ? "flex-end" : "flex-start",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isMe && <span style={styles.msgUsername}>{msg.username}</span>}
      <div
        style={{
          ...styles.bubble,
          background: isMe ? "rgba(0,212,255,0.12)" : "var(--bg-elevated)",
          border: `1px solid ${isMe ? "rgba(0,212,255,0.25)" : "var(--border)"}`,
          borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
        }}
      >
        <p style={styles.msgText}>{msg.message}</p>
      </div>
      <span style={styles.msgTime}>
        {new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </motion.div>
  );
};

// ── AI Chat Message ──────────────────────────────────────
const AIChatMessage = ({ msg }) => (
  <motion.div
    style={{
      ...styles.msgWrap,
      alignItems: msg.role === "user" ? "flex-end" : "flex-start",
    }}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
  >
    {msg.role === "assistant" && (
      <span style={styles.aiLabel}>
        <Brain size={10} color="var(--accent-cyan)" /> AI
      </span>
    )}
    <div
      style={{
        ...styles.bubble,
        background:
          msg.role === "user" ? "rgba(0,212,255,0.12)" : "var(--bg-elevated)",
        border: `1px solid ${msg.role === "user" ? "rgba(0,212,255,0.25)" : "var(--border)"}`,
        borderRadius:
          msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
      }}
    >
      <p style={{ ...styles.msgText, whiteSpace: "pre-wrap" }}>{msg.content}</p>
    </div>
  </motion.div>
);

// ── Main Panel ───────────────────────────────────────────
const AIPanel = ({
  currentUser,
  users,
  messages,
  onSendRoomMessage,
  chatHistory,
  chatLoading,
  onSendChat,
  code,
  language,
}) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [roomInput, setRoomInput] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);

  const chatBottomRef = useRef(null);
  const aiBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const handleRoomSend = () => {
    if (!roomInput.trim()) return;
    onSendRoomMessage(roomInput);
    setRoomInput("");
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    onSendChat(aiInput, code, language);
    setAiInput("");
  };

  return (
    <div style={styles.panel}>
      {/* ── Tabs ─────────────────────────────────── */}
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

      {/* ── ROOM CHAT TAB ────────────────────────── */}
      {activeTab === "chat" && (
        <div style={styles.tabWrap}>
          {/* Online members */}
          <div style={styles.membersHeader}>
            <button
              style={styles.membersToggle}
              onClick={() => setShowMembers((p) => !p)}
            >
              <Users size={12} color="var(--accent-green)" />
              <span style={styles.membersCount}>{users.length} online</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {showMembers ? "▲" : "▼"}
              </span>
            </button>

            <AnimatePresence>
              {showMembers && (
                <motion.div
                  style={styles.membersList}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {users.map((u, i) => (
                    <div key={i} style={styles.memberItem}>
                      <div
                        style={{
                          ...styles.memberAvatar,
                          background: u.color || "var(--accent-cyan)",
                        }}
                      >
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <span style={styles.memberName}>
                        {u.username}
                        {u.username === currentUser && (
                          <span style={styles.youBadge}> you</span>
                        )}
                      </span>
                      <span style={styles.onlineDot} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.length === 0 && (
              <div style={styles.emptyState}>
                <MessageSquare size={24} color="var(--text-muted)" />
                <p style={styles.emptyText}>
                  No messages yet. Say hi to your team!
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <RoomChatMessage key={i} msg={msg} currentUser={currentUser} />
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              style={styles.inputField}
              placeholder="Message the room…"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRoomSend();
                }
              }}
            />
            <button
              onClick={handleRoomSend}
              disabled={!roomInput.trim()}
              style={styles.sendBtn}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── ASK AI TAB ───────────────────────────── */}
      {activeTab === "ai" && (
        <div style={styles.tabWrap}>
          {/* Messages */}
          <div style={styles.messages}>
            {chatHistory.length === 0 && (
              <div style={styles.emptyState}>
                <Brain size={28} color="var(--text-muted)" />
                <p style={styles.emptyText}>
                  Ask me anything about your code. I can see what's in the
                  editor!
                </p>
                {/* Suggestion chips */}
                <div style={styles.chips}>
                  {[
                    "Explain this code",
                    "How can I improve this?",
                    "Find bugs",
                    "Add comments",
                  ].map((chip) => (
                    <button
                      key={chip}
                      style={styles.chip}
                      onClick={() => {
                        onSendChat(chip, code, language);
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <AIChatMessage key={i} msg={msg} />
            ))}

            {chatLoading && (
              <motion.div
                style={styles.aiTyping}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Brain size={11} color="var(--accent-cyan)" />
                <motion.span
                  style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  AI is thinking…
                </motion.span>
              </motion.div>
            )}
            <div ref={aiBottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              style={styles.inputField}
              placeholder="Ask AI about your code…"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAiSend();
                }
              }}
            />
            <button
              onClick={handleAiSend}
              disabled={chatLoading || !aiInput.trim()}
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
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────
const styles = {
  panel: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-secondary)",
    borderLeft: "1px solid var(--border)",
    overflow: "hidden",
  },
  tabs: {
    display: "flex",
    flexShrink: 0,
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-card)",
  },
  tab: {
    flex: 1,
    padding: "11px 4px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "color 0.15s",
  },
  tabWrap: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },

  membersHeader: { flexShrink: 0, borderBottom: "1px solid var(--border)" },
  membersToggle: {
    width: "100%",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  membersCount: {
    fontSize: "12px",
    color: "var(--accent-green)",
    fontFamily: "var(--font-mono)",
    flex: 1,
    textAlign: "left",
  },
  membersList: {
    overflow: "hidden",
    background: "var(--bg-card)",
    borderTop: "1px solid var(--border)",
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
  },
  memberAvatar: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  memberName: { fontSize: "12px", color: "var(--text-secondary)", flex: 1 },
  youBadge: {
    fontSize: "10px",
    color: "var(--accent-cyan)",
    fontFamily: "var(--font-mono)",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--accent-green)",
    flexShrink: 0,
  },

  messages: {
    flex: 1,
    overflow: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "32px 12px",
    textAlign: "center",
  },
  emptyText: {
    fontSize: "12px",
    color: "var(--text-muted)",
    lineHeight: 1.6,
    maxWidth: 200,
  },

  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  chip: {
    padding: "5px 10px",
    borderRadius: 100,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    fontSize: "11px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "border-color 0.15s, color 0.15s",
  },

  msgWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    maxWidth: "90%",
  },
  msgUsername: {
    fontSize: "10px",
    color: "var(--accent-cyan)",
    fontFamily: "var(--font-mono)",
    paddingLeft: 4,
  },
  bubble: { padding: "7px 10px" },
  msgText: {
    fontSize: "13px",
    lineHeight: 1.55,
    color: "var(--text-primary)",
  },
  msgTime: {
    fontSize: "10px",
    color: "var(--text-muted)",
    paddingLeft: 4,
  },
  aiLabel: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--accent-cyan)",
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  aiTyping: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 0",
  },

  inputRow: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-card)",
    flexShrink: 0,
  },
  inputField: {
    flex: 1,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "7px 10px",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontFamily: "var(--font-body)",
    outline: "none",
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "var(--accent-cyan)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--bg-primary)",
    flexShrink: 0,
  },
};

export default AIPanel;
