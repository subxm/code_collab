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

    // Connect to socket with explicit transport config
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"], // try websocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected:", socket.id);
      // Join room immediately on connect
      socket.emit("join-room", { roomId, username });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("❌ Disconnected");
    });

    socket.on("reconnect", () => {
      setIsConnected(true);
      // Rejoin room after reconnect
      socket.emit("join-room", { roomId, username });
    });

    // Sync initial state
    socket.on("sync-state", (stateVector) => {
      Y.applyUpdate(ydoc, new Uint8Array(stateVector));
    });

    // Receive code updates
    socket.on("code-update", ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    // Send our changes
    ydoc.on("update", (update) => {
      socket.emit("code-update", {
        roomId,
        update: Array.from(update),
      });
    });

    // Users list — this is what populates the online counter
    socket.on("room-users", (roomUsers) => {
      console.log("👥 Users update:", roomUsers);
      setUsers(roomUsers);
    });

    // Language change
    socket.on("language-change", ({ language }) => {
      setLanguage(language);
    });

    // Chat messages
    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // User left
    socket.on("user-left", ({ username }) => {
      console.log(`👋 ${username} left`);
    });

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      ydoc.destroy();
      socket.disconnect();
    };
  }, [roomId, username]);

  // Bind Yjs to Monaco editor
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

  const sendMessage = (message) => {
    if (!socketRef.current) return;
    socketRef.current.emit("chat-message", { roomId, message, username });
  };

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
