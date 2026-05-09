import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode2,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  File,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

const FileTree = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast.error("File name is required");
      return;
    }
    // Determine language from extension
    const ext = newFileName.split(".").pop();
    const languageMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rs: "rust",
      json: "json",
      html: "html",
      css: "css",
    };
    const language = languageMap[ext] || "javascript";
    onCreateFile(newFileName, language);
    setNewFileName("");
    setIsCreating(false);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop();
    const iconMap = {
      js: "#f7df1e",
      jsx: "#61dafb",
      ts: "#3178c6",
      tsx: "#3178c6",
      py: "#3776ab",
      java: "#ed8b00",
      go: "#00add8",
      rs: "#dea584",
      json: "#cbcb41",
      html: "#e34c26",
      css: "#264de4",
    };
    return iconMap[ext] || "var(--text-muted)";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Files</span>
        <button
          onClick={() => setIsCreating(true)}
          style={styles.addBtn}
          title="New file"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* New file input */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={styles.createForm}
            onSubmit={handleCreateFile}
          >
            <input
              autoFocus
              style={styles.createInput}
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => !newFileName && setIsCreating(false)}
            />
            <button type="submit" style={styles.createSubmit}>
              <Plus size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewFileName("");
              }}
              style={styles.createCancel}
            >
              <X size={12} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* File list */}
      <div style={styles.fileList}>
        {files.map((file) => (
          <div key={file.id} style={styles.fileItemWrap}>
            <div
              style={{
                ...styles.fileItem,
                background:
                  activeFile?.id === file.id
                    ? "var(--bg-elevated)"
                    : "transparent",
                borderLeft:
                  activeFile?.id === file.id
                    ? "2px solid var(--accent-cyan)"
                    : "2px solid transparent",
              }}
              onClick={() => onSelectFile(file)}
            >
              <FileCode2
                size={14}
                color={getFileIcon(file.name)}
                style={styles.fileIcon}
              />
              <span style={styles.fileName}>{file.name}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(file.id);
                  }}
                  style={styles.deleteBtn}
                  title="Delete file"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Delete confirmation */}
            <AnimatePresence>
              {showDeleteConfirm === file.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={styles.deleteConfirm}
                >
                  <span style={styles.deleteText}>Delete "{file.name}"?</span>
                  <button
                    onClick={() => {
                      onDeleteFile(file.id);
                      setShowDeleteConfirm(null);
                    }}
                    style={styles.deleteConfirmBtn}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    style={styles.deleteCancelBtn}
                  >
                    No
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {files.length === 0 && (
          <div style={styles.empty}>No files yet</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--bg-secondary)",
    borderRight: "1px solid var(--border)",
    minWidth: 180,
    maxWidth: 220,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  addBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: 4,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s, background 0.2s",
  },
  createForm: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 12px",
    borderBottom: "1px solid var(--border)",
    overflow: "hidden",
  },
  createInput: {
    flex: 1,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: "12px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-primary)",
    outline: "none",
  },
  createSubmit: {
    background: "var(--accent-cyan)",
    border: "none",
    borderRadius: 4,
    padding: 4,
    cursor: "pointer",
    color: "var(--bg-primary)",
    display: "flex",
  },
  createCancel: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: 4,
    display: "flex",
  },
  fileList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  },
  fileItemWrap: {
    position: "relative",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  fileIcon: {
    flexShrink: 0,
  },
  fileName: {
    flex: 1,
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-secondary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: 2,
    opacity: 0,
    transition: "opacity 0.2s",
  },
  deleteConfirm: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border)",
    flexWrap: "wrap",
  },
  deleteText: {
    fontSize: "11px",
    color: "var(--text-muted)",
    flex: 1,
  },
  deleteConfirmBtn: {
    background: "#ff4d4d",
    border: "none",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: "11px",
    cursor: "pointer",
    color: "#fff",
  },
  deleteCancelBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: "11px",
    cursor: "pointer",
    color: "var(--text-muted)",
  },
  empty: {
    padding: "20px 12px",
    textAlign: "center",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
};

export default FileTree;