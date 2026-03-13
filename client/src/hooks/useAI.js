import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const useAI = (token) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewIssues, setReviewIssues] = useState([]);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixResult, setFixResult] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  // ── Chat ──────────────────────────────────────────────
  const sendChat = async (message, code, language) => {
    if (!message.trim()) return;

    const userMsg = { role: "user", content: message };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/ai/chat`,
        { message, code, language, history: chatHistory },
        { headers },
      );
      const aiMsg = { role: "assistant", content: res.data.reply };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an error. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Review ────────────────────────────────────────────
  const reviewCode = async (code, language) => {
    setReviewIssues([]);
    setReviewLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/review`,
        { code, language },
        { headers },
      );
      setReviewIssues(res.data.issues || []);
    } catch {
      setReviewIssues([]);
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Auto-fix ──────────────────────────────────────────
  const autoFix = async (code, error, language) => {
    setFixResult(null);
    setFixLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/autofix`,
        { code, error, language },
        { headers },
      );
      setFixResult(res.data);
    } catch {
      setFixResult(null);
    } finally {
      setFixLoading(false);
    }
  };

  // ── Completion ────────────────────────────────────────
  const getCompletion = async (code, language, cursorPosition) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/complete`,
        { code, language, cursorPosition },
        { headers },
      );
      return res.data.completion || "";
    } catch {
      return "";
    }
  };

  const clearReview = () => setReviewIssues([]);
  const clearFix = () => setFixResult(null);
  const clearChat = () => setChatHistory([]);

  return {
    chatHistory,
    chatLoading,
    sendChat,
    clearChat,
    reviewLoading,
    reviewIssues,
    reviewCode,
    clearReview,
    fixLoading,
    fixResult,
    autoFix,
    clearFix,
    getCompletion,
  };
};

export default useAI;
