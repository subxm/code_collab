import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const useCollaboration = (roomId, username, editorRef) => {
  const socketRef = useRef(null);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId || !username) return;

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to socket
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected to collaboration server");

      // Join the room
      socket.emit("join-room", { roomId, username });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("❌ Disconnected from collaboration server");
    });

    // ── Receive initial state from server ──────────────
    socket.on("sync-state", (stateVector) => {
      const update = new Uint8Array(stateVector);
      Y.applyUpdate(ydoc, update);
    });

    // ── Receive code updates from other users ──────────
    socket.on("code-update", ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    // ── Listen for our own changes and send them ───────
    ydoc.on("update", (update) => {
      socket.emit("code-update", {
        roomId,
        update: Array.from(update),
      });
    });

    // ── Room users list ────────────────────────────────
    socket.on("room-users", (roomUsers) => {
      setUsers(roomUsers);
    });

    // ── Language change ────────────────────────────────
    socket.on("language-change", ({ language }) => {
      setLanguage(language);
    });

    // ── Chat messages ──────────────────────────────────
    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // ── User left notification ─────────────────────────
    socket.on("user-left", ({ username }) => {
      console.log(`👋 ${username} left the room`);
    });

    return () => {
      // Cleanup on unmount
      if (bindingRef.current) bindingRef.current.destroy();
      ydoc.destroy();
      socket.disconnect();
    };
  }, [roomId, username]);

  // ── Bind Yjs to Monaco Editor ──────────────────────────
  // This runs when the editor is ready
  const bindEditor = (editor) => {
    if (!ydocRef.current || !editor) return;

    const ytext = ydocRef.current.getText("code");
    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
    );
    bindingRef.current = binding;
  };

  // ── Send chat message ──────────────────────────────────
  const sendMessage = (message) => {
    if (!socketRef.current) return;
    socketRef.current.emit("chat-message", { roomId, message, username });
  };

  // ── Change language ────────────────────────────────────
  const changeLanguage = (newLanguage) => {
    if (!socketRef.current) return;
    socketRef.current.emit("language-change", {
      roomId,
      language: newLanguage,
    });
  };

  return {
    users,
    messages,
    language,
    isConnected,
    bindEditor,
    sendMessage,
    changeLanguage,
  };
};

export default useCollaboration;
