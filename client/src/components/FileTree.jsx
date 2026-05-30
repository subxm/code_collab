import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode2,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Trash2,
  FolderPlus,
} from "lucide-react";
import toast from "react-hot-toast";

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

// ── FileNode recursive component ──────────────────────────────
const FileNode = ({
  node,
  level,
  activeFile,
  onSelectFile,
  onDeleteFile,
  onCreateFile,
  expandedFolders,
  toggleFolder,
  files,
}) => {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [inputVal, setInputVal] = useState("");

  if (!node.isDir) {
    const file = node.fileObj;
    const isSelected = activeFile?.id === file.id;
    return (
      <div
        className={`file-tree-item ${isSelected ? "active" : ""}`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => onSelectFile(file)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <FileCode2
            size={14}
            color={getFileIcon(node.name)}
            style={styles.fileIcon}
          />
          <span
            style={{
              ...styles.fileName,
              color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {node.name}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${node.name}"?`)) {
              onDeleteFile(file.id);
            }
          }}
          className="file-delete-btn"
          title="Delete file"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  const isOpen = expandedFolders[node.path] || false;
  const childrenKeys = Object.keys(node.children).sort((a, b) => {
    const nodeA = node.children[a];
    const nodeB = node.children[b];
    if (nodeA.isDir && !nodeB.isDir) return -1;
    if (!nodeA.isDir && nodeB.isDir) return 1;
    return a.localeCompare(b);
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    // Use root path if it's the root node, else build relative path
    const fullPath = node.path ? `${node.path}/${inputVal.trim()}` : inputVal.trim();
    if (isCreatingFolder) {
      // Create empty folder via placeholder
      onCreateFile(`${fullPath}/.placeholder`, "javascript");
    } else {
      // Create file
      const ext = inputVal.split(".").pop();
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
      onCreateFile(fullPath, language);
    }
    setInputVal("");
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
  };

  return (
    <div className="file-tree-node">
      {/* Folder Header */}
      {node.name !== "root" && (
        <div
          className="file-tree-folder-header"
          style={{ paddingLeft: `${level * 12}px` }}
          onClick={() => toggleFolder(node.path)}
        >
          <div className={`file-tree-folder-title ${isOpen ? "open" : ""}`}>
            {isOpen ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
            <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "14px" }}>{isOpen ? "📂" : "📁"}</span>
              {node.name}
            </span>
          </div>
          <div className="file-tree-folder-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="file-tree-folder-action-btn"
              onClick={() => {
                toggleFolder(node.path, true);
                setIsCreatingFile(true);
                setIsCreatingFolder(false);
              }}
              title="New File"
            >
              <Plus size={12} />
            </button>
            <button
              className="file-tree-folder-action-btn"
              onClick={() => {
                toggleFolder(node.path, true);
                setIsCreatingFolder(true);
                setIsCreatingFile(false);
              }}
              title="New Folder"
            >
              <FolderPlus size={12} />
            </button>
            <button
              className="file-tree-folder-action-btn"
              onClick={() => {
                if (confirm(`Delete folder "${node.name}" and all its contents?`)) {
                  const prefix = `${node.path}/`;
                  const folderFiles = files.filter(
                    (f) => f.name.startsWith(prefix) || f.name === node.path
                  );
                  folderFiles.forEach((f) => onDeleteFile(f.id));
                }
              }}
              title="Delete Folder"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input Form for New File/Folder inside this Node */}
      <AnimatePresence>
        {(isCreatingFile || isCreatingFolder) && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ ...styles.createForm, paddingLeft: `${(level + 1) * 12}px` }}
            onSubmit={handleCreateSubmit}
          >
            <input
              autoFocus
              style={styles.createInput}
              placeholder={isCreatingFolder ? "folder_name" : "filename.js"}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={() => {
                setTimeout(() => {
                  if (!inputVal) {
                    setIsCreatingFile(false);
                    setIsCreatingFolder(false);
                  }
                }, 200);
              }}
            />
            <button type="submit" style={styles.createSubmit}>
              <Plus size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFile(false);
                setIsCreatingFolder(false);
                setInputVal("");
              }}
              style={styles.createCancel}
            >
              <X size={12} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Folder Children */}
      {(node.name === "root" || isOpen) && (
        <div className="file-tree-folder-children">
          {childrenKeys.map((key) => (
            <FileNode
              key={key}
              node={node.children[key]}
              level={node.name === "root" ? 0 : level + 1}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onCreateFile={onCreateFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              files={files}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main FileTree Component ───────────────────────────────────
const FileTree = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [isCreatingRootFile, setIsCreatingRootFile] = useState(false);
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false);
  const [rootInputVal, setRootInputVal] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (path, forceState) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: forceState !== undefined ? forceState : !prev[path],
    }));
  };

  // Convert flat files into hierarchical folder structure
  const buildTree = (filesList) => {
    const root = { name: "root", isDir: true, children: {} };
    filesList.forEach((file) => {
      const parts = file.name.split("/");
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
          if (part === ".placeholder") {
            // Virtual folder entry; don't render the placeholder itself
            continue;
          }
          current.children[part] = {
            name: part,
            path: file.name,
            isDir: false,
            fileObj: file,
          };
        } else {
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: parts.slice(0, i + 1).join("/"),
              isDir: true,
              children: {},
            };
          }
          current = current.children[part];
        }
      }
    });
    return root;
  };

  const handleRootCreateSubmit = (e) => {
    e.preventDefault();
    if (!rootInputVal.trim()) return;

    if (isCreatingRootFolder) {
      onCreateFile(`${rootInputVal.trim()}/.placeholder`, "javascript");
    } else {
      const ext = rootInputVal.split(".").pop();
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
      onCreateFile(rootInputVal.trim(), language);
    }
    setRootInputVal("");
    setIsCreatingRootFile(false);
    setIsCreatingRootFolder(false);
  };

  const treeRoot = buildTree(files);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Files</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => {
              setIsCreatingRootFile(true);
              setIsCreatingRootFolder(false);
            }}
            style={styles.addBtn}
            title="New file"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => {
              setIsCreatingRootFolder(true);
              setIsCreatingRootFile(false);
            }}
            style={styles.addBtn}
            title="New folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {/* Root new file/folder input */}
      <AnimatePresence>
        {(isCreatingRootFile || isCreatingRootFolder) && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={styles.createForm}
            onSubmit={handleRootCreateSubmit}
          >
            <input
              autoFocus
              style={styles.createInput}
              placeholder={isCreatingRootFolder ? "folder_name" : "filename.js"}
              value={rootInputVal}
              onChange={(e) => setRootInputVal(e.target.value)}
              onBlur={() => {
                setTimeout(() => {
                  if (!rootInputVal) {
                    setIsCreatingRootFile(false);
                    setIsCreatingRootFolder(false);
                  }
                }, 200);
              }}
            />
            <button type="submit" style={styles.createSubmit}>
              <Plus size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingRootFile(false);
                setIsCreatingRootFolder(false);
                setRootInputVal("");
              }}
              style={styles.createCancel}
            >
              <X size={12} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={styles.fileList}>
        <FileNode
          node={treeRoot}
          level={0}
          activeFile={activeFile}
          onSelectFile={onSelectFile}
          onDeleteFile={onDeleteFile}
          onCreateFile={onCreateFile}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          files={files}
        />
        {files.length === 0 && <div style={styles.empty}>No files yet</div>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "rgba(10, 10, 14, 0.45)",
    borderRight: "1px solid var(--border)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
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
  empty: {
    padding: "20px 12px",
    textAlign: "center",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
};

export default FileTree;