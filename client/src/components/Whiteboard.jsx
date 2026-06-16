import { useState, useEffect, useRef } from "react";
import {
  MousePointer,
  Pencil,
  Minus,
  Square,
  Circle as CircleIcon,
  Type,
  Eraser,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand
} from "lucide-react";

// Theme configuration styles for background, grid and control bars
const THEME_STYLES = {
  "vs-dark": {
    bg: "#101014",
    grid: "rgba(255, 255, 255, 0.04)",
    toolbarBg: "rgba(15, 15, 22, 0.85)",
    border: "rgba(255, 255, 255, 0.08)",
    textColor: "#ffffff",
    mutedColor: "#888888"
  },
  "light": {
    bg: "#ffffff",
    grid: "rgba(0, 0, 0, 0.05)",
    toolbarBg: "rgba(243, 243, 243, 0.9)",
    border: "rgba(0, 0, 0, 0.08)",
    textColor: "#1e1e1e",
    mutedColor: "#666666"
  },
  "dracula": {
    bg: "#282a36",
    grid: "rgba(248, 248, 242, 0.05)",
    toolbarBg: "rgba(40, 42, 54, 0.85)",
    border: "rgba(248, 248, 242, 0.08)",
    textColor: "#f8f8f2",
    mutedColor: "#6272a4"
  },
  "monokai": {
    bg: "#272822",
    grid: "rgba(248, 248, 242, 0.05)",
    toolbarBg: "rgba(39, 40, 34, 0.85)",
    border: "rgba(248, 248, 242, 0.08)",
    textColor: "#f8f8f2",
    mutedColor: "#75715e"
  },
  "onedark": {
    bg: "#282c34",
    grid: "rgba(171, 178, 191, 0.05)",
    toolbarBg: "rgba(40, 44, 52, 0.85)",
    border: "rgba(171, 178, 191, 0.08)",
    textColor: "#abb2bf",
    mutedColor: "#5c6370"
  }
};

const getColors = (themeName) => {
  if (themeName === "light") {
    return [
      { value: "#1e1e1e", label: "Charcoal" },
      { value: "#0066cc", label: "Blue" },
      { value: "#800080", label: "Purple" },
      { value: "#008000", label: "Green" },
      { value: "#ff8c00", label: "Orange" },
      { value: "#ff0000", label: "Red" }
    ];
  }
  return [
    { value: "#ffffff", label: "White" },
    { value: "#00f0ff", label: "Cyan" },
    { value: "#bd93f9", label: "Purple" },
    { value: "#50fa7b", label: "Green" },
    { value: "#f1fa8c", label: "Yellow" },
    { value: "#ff5555", label: "Red" }
  ];
};

// Helper: Generate unique element ID without calling impure function inside component render/handlers
const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Helper: Calculate distance from point to line segment
const distToSegment = (p, v, w) => {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
};

// Helper: Find element at click position (handles select & erase tools)
const getElementAtPosition = (x, y, elements) => {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.type === "rectangle") {
      const minX = Math.min(el.x, el.x + el.width);
      const maxX = Math.max(el.x, el.x + el.width);
      const minY = Math.min(el.y, el.y + el.height);
      const maxY = Math.max(el.y, el.y + el.height);
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) return el;
    } else if (el.type === "circle") {
      const dist = Math.sqrt((x - el.cx) ** 2 + (y - el.cy) ** 2);
      if (dist <= el.r) return el;
    } else if (el.type === "line") {
      const dist = distToSegment({ x, y }, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
      if (dist < 8) return el;
    } else if (el.type === "pencil") {
      const onPath = el.points.some(p => {
        const dist = Math.sqrt((x - p[0]) ** 2 + (y - p[1]) ** 2);
        return dist < 12; // threshold for drawing path
      });
      if (onPath) return el;
    } else if (el.type === "text") {
      const minX = el.x;
      const maxX = el.x + (el.text.length * 9); // rough width estimate
      const minY = el.y - 18;
      const maxY = el.y + 6;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) return el;
    }
  }
  return null;
};

const Whiteboard = ({ socketRef, roomId, roomData, theme = "vs-dark" }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const themeStyle = THEME_STYLES[theme] || THEME_STYLES["vs-dark"];
  const activeColors = getColors(theme);

  // States
  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState("pencil"); // select, hand (pan), pencil, line, rectangle, circle, text, eraser
  const [color, setColor] = useState(() => (theme === "light" ? "#1e1e1e" : "#00f0ff"));

  // Adjust current drawing color when switching themes
  useEffect(() => {
    if (theme === "light") {
      if (color === "#ffffff" || color === "#00f0ff" || color === "#bd93f9") {
        setTimeout(() => setColor("#1e1e1e"), 0);
      }
    } else {
      if (color === "#1e1e1e" || color === "#0066cc") {
        setTimeout(() => setColor("#00f0ff"), 0);
      }
    }
  }, [theme, color]);
  const [width, setWidth] = useState(3);
  const [fillStyle, setFillStyle] = useState("none"); // none, semi, solid

  // Canvas Transform
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Interaction States
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeElement, setActiveElement] = useState(null); // element being drawn
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Text Tool State
  const [textInput, setTextInput] = useState(null); // { x, y, value }

  // Collaborative Cursors
  const [remoteWhiteboardCursors, setRemoteWhiteboardCursors] = useState({});

  // 1. Load initial board state from room data
  useEffect(() => {
    if (roomData && roomData.whiteboardElements) {
      try {
        const parsed = JSON.parse(roomData.whiteboardElements);
        if (Array.isArray(parsed)) {
          setTimeout(() => {
            setElements(parsed);
          }, 0);
        }
      } catch (err) {
        console.error("Failed to parse initial whiteboard elements", err);
      }
    }
  }, [roomData]);

  // 2. Set up Socket Listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("whiteboard-update", ({ elements: incomingElements }) => {
      setElements(incomingElements);
    });

    socket.on("whiteboard-clear", () => {
      setElements([]);
    });

    socket.on("whiteboard-cursor", ({ socketId, username, color: cursorColor, cursor }) => {
      setRemoteWhiteboardCursors((prev) => {
        if (!cursor) {
          const next = { ...prev };
          delete next[socketId];
          return next;
        }
        return {
          ...prev,
          [socketId]: { username, color: cursorColor, cursor }
        };
      });
    });

    return () => {
      socket.off("whiteboard-update");
      socket.off("whiteboard-clear");
      socket.off("whiteboard-cursor");
    };
  }, [socketRef]);

  // Keyboard listeners for tools shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in text input or editor
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.classList.contains("input")) {
        return;
      }
      
      const key = e.key.toLowerCase();
      if (key === "v") setTool("select");
      else if (key === "h") setTool("hand");
      else if (key === "p") setTool("pencil");
      else if (key === "l") setTool("line");
      else if (key === "r") setTool("rectangle");
      else if (key === "o") setTool("circle");
      else if (key === "t") setTool("text");
      else if (key === "e") setTool("eraser");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. Coordinate Helper
  const getMouseCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Inverse transform (pan & zoom) to get original canvas coordinates
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom
    };
  };

  // 4. Mouse Event Handlers
  const handleMouseDown = (e) => {
    if (textInput) {
      completeTextInput();
      return;
    }

    const { x, y } = getMouseCoords(e);

    // Hand/Panning
    if (tool === "hand" || e.button === 1 || (e.button === 0 && e.spaceKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Left click only

    setIsDrawing(true);

    // Selection/Drag tool
    if (tool === "select") {
      const clickedEl = getElementAtPosition(x, y, elements);
      if (clickedEl) {
        setSelectedElement(clickedEl);
        if (clickedEl.type === "rectangle" || clickedEl.type === "text") {
          setDragOffset({ x: x - clickedEl.x, y: y - clickedEl.y });
        } else if (clickedEl.type === "circle") {
          setDragOffset({ x: x - clickedEl.cx, y: y - clickedEl.cy });
        } else if (clickedEl.type === "line") {
          setDragOffset({
            x1: x - clickedEl.x1,
            y1: y - clickedEl.y1,
            x2: x - clickedEl.x2,
            y2: y - clickedEl.y2
          });
        } else if (clickedEl.type === "pencil") {
          const offsets = clickedEl.points.map(p => [x - p[0], y - p[1]]);
          setDragOffset({ pencilOffsets: offsets });
        }
      } else {
        setSelectedElement(null);
      }
      return;
    }

    // Eraser tool
    if (tool === "eraser") {
      const clickedEl = getElementAtPosition(x, y, elements);
      if (clickedEl) {
        const nextElements = elements.filter(el => el.id !== clickedEl.id);
        setElements(nextElements);
        socketRef.current.emit("whiteboard-update", { roomId, elements: nextElements });
        socketRef.current.emit("whiteboard-save", { roomId, elements: nextElements });
      }
      return;
    }

    // Text tool
    if (tool === "text") {
      setTextInput({ x, y, value: "" });
      setIsDrawing(false);
      return;
    }

    // Drawing shapes
    const newId = generateId();
    let newEl = null;

    if (tool === "pencil") {
      newEl = {
        id: newId,
        type: "pencil",
        points: [[x, y]],
        strokeColor: color,
        strokeWidth: width
      };
    } else if (tool === "line") {
      newEl = {
        id: newId,
        type: "line",
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        strokeColor: color,
        strokeWidth: width
      };
    } else if (tool === "rectangle") {
      newEl = {
        id: newId,
        type: "rectangle",
        x: x,
        y: y,
        width: 0,
        height: 0,
        strokeColor: color,
        strokeWidth: width,
        fillStyle: fillStyle
      };
    } else if (tool === "circle") {
      newEl = {
        id: newId,
        type: "circle",
        cx: x,
        cy: y,
        r: 0,
        strokeColor: color,
        strokeWidth: width,
        fillStyle: fillStyle
      };
    }

    if (newEl) {
      setActiveElement(newEl);
      setElements(prev => [...prev, newEl]);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getMouseCoords(e);

    // Broadcast cursor position
    if (socketRef.current) {
      socketRef.current.emit("whiteboard-cursor", {
        roomId,
        cursor: { x, y }
      });
    }

    // Panning canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!isDrawing) return;

    // Moving shapes
    if (tool === "select" && selectedElement) {
      const updatedElements = elements.map((el) => {
        if (el.id !== selectedElement.id) return el;

        if (el.type === "rectangle" || el.type === "text") {
          return {
            ...el,
            x: x - dragOffset.x,
            y: y - dragOffset.y
          };
        } else if (el.type === "circle") {
          return {
            ...el,
            cx: x - dragOffset.x,
            cy: y - dragOffset.y
          };
        } else if (el.type === "line") {
          return {
            ...el,
            x1: x - dragOffset.x1,
            y1: y - dragOffset.y1,
            x2: x - dragOffset.x2,
            y2: y - dragOffset.y2
          };
        } else if (el.type === "pencil") {
          const newPoints = el.points.map((_, i) => [
            x - dragOffset.pencilOffsets[i][0],
            y - dragOffset.pencilOffsets[i][1]
          ]);
          return {
            ...el,
            points: newPoints
          };
        }
        return el;
      });

      setElements(updatedElements);
      socketRef.current.emit("whiteboard-update", { roomId, elements: updatedElements });
      return;
    }

    // Drawing updates
    if (!activeElement) return;

    const updatedElements = elements.map((el) => {
      if (el.id !== activeElement.id) return el;

      if (el.type === "pencil") {
        return {
          ...el,
          points: [...el.points, [x, y]]
        };
      } else if (el.type === "line") {
        return {
          ...el,
          x2: x,
          y2: y
        };
      } else if (el.type === "rectangle") {
        return {
          ...el,
          width: x - el.x,
          height: y - el.y
        };
      } else if (el.type === "circle") {
        const radius = Math.sqrt((x - el.cx) ** 2 + (y - el.cy) ** 2);
        return {
          ...el,
          r: radius
        };
      }
      return el;
    });

    setElements(updatedElements);
    socketRef.current.emit("whiteboard-update", { roomId, elements: updatedElements });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsPanning(false);

    if (activeElement || (tool === "select" && selectedElement)) {
      // Save changes to database
      socketRef.current.emit("whiteboard-save", { roomId, elements });
    }

    setActiveElement(null);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    setIsPanning(false);
    setActiveElement(null);

    // Remove our cursor from other peers
    if (socketRef.current) {
      socketRef.current.emit("whiteboard-cursor", { roomId, cursor: null });
    }
  };

  // 5. Text Input Helpers
  const completeTextInput = () => {
    if (!textInput) return;
    if (textInput.value.trim() === "") {
      setTextInput(null);
      return;
    }

    const newId = generateId();
    const newEl = {
      id: newId,
      type: "text",
      x: textInput.x,
      y: textInput.y,
      text: textInput.value,
      strokeColor: color,
      fontSize: width * 6 + 12
    };

    const nextElements = [...elements, newEl];
    setElements(nextElements);
    setTextInput(null);

    socketRef.current.emit("whiteboard-update", { roomId, elements: nextElements });
    socketRef.current.emit("whiteboard-save", { roomId, elements: nextElements });
  };

  // 6. Canvas Operations
  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the canvas?")) {
      setElements([]);
      socketRef.current.emit("whiteboard-clear", { roomId });
    }
  };

  const handleZoom = (factor) => {
    if (factor === 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom((prev) => Math.max(0.2, Math.min(4, prev * factor)));
    }
  };

  // Render elements in SVG
  const renderElements = () => {
    return elements.map((el) => {
      const commonProps = {
        key: el.id,
        stroke: el.strokeColor,
        strokeWidth: el.strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round"
      };

      const fillOpacity = el.fillStyle === "semi" ? 0.25 : el.fillStyle === "solid" ? 1 : 0;
      const fillVal = el.fillStyle === "none" ? "none" : el.strokeColor;

      switch (el.type) {
        case "pencil": {
          if (el.points.length < 2) return null;
          const d = el.points.reduce(
            (acc, p, index) => (index === 0 ? `M ${p[0]} ${p[1]}` : `${acc} L ${p[0]} ${p[1]}`),
            ""
          );
          return <path d={d} fill="none" {...commonProps} />;
        }

        case "line":
          return <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} {...commonProps} />;

        case "rectangle":
          return (
            <rect
              x={Math.min(el.x, el.x + el.width)}
              y={Math.min(el.y, el.y + el.height)}
              width={Math.abs(el.width)}
              height={Math.abs(el.height)}
              fill={fillVal}
              fillOpacity={fillOpacity}
              {...commonProps}
            />
          );

        case "circle":
          return (
            <circle
              cx={el.cx}
              cy={el.cy}
              r={el.r}
              fill={fillVal}
              fillOpacity={fillOpacity}
              {...commonProps}
            />
          );

        case "text":
          return (
            <text
              x={el.x}
              y={el.y}
              fill={el.strokeColor}
              fontSize={el.fontSize || 16}
              fontFamily="var(--font-mono)"
              fontWeight="bold"
            >
              {el.text}
            </text>
          );

        default:
          return null;
      }
    });
  };

  return (
    <div
      ref={containerRef}
      style={{ ...styles.whiteboardContainer, background: themeStyle.bg }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Subgrid Aesthetics Overlay ── */}
      <div style={{ ...styles.gridOverlay, backgroundImage: `radial-gradient(${themeStyle.grid} 1px, transparent 1px)` }} />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: tool === "hand" || isPanning ? "grabbing" : tool === "select" ? "default" : "crosshair"
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {renderElements()}

          {/* Render Remote User Cursors */}
          {Object.entries(remoteWhiteboardCursors).map(([sid, cursorData]) => {
            if (!cursorData.cursor) return null;
            return (
              <g key={sid} transform={`translate(${cursorData.cursor.x}, ${cursorData.cursor.y})`}>
                {/* Pointer tip */}
                <path
                  d="M0 0 L15 15 L8 15 L6 22 Z"
                  fill={cursorData.color || "#00f0ff"}
                  stroke="#07070a"
                  strokeWidth="1.5"
                />
                {/* Username label overlay */}
                <g transform="translate(14, 18)">
                  <rect
                    rx="4"
                    fill="rgba(15, 15, 22, 0.9)"
                    stroke={cursorData.color || "#00f0ff"}
                    strokeWidth="1"
                    height="18"
                    width={cursorData.username.length * 7 + 12}
                    x="-4"
                    y="-12"
                  />
                  <text
                    fill="#ffffff"
                    fontSize="9px"
                    fontFamily="var(--font-body)"
                    fontWeight="600"
                  >
                    {cursorData.username}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── Text Input Floating Box ── */}
      {textInput && (
        <textarea
          autoFocus
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            left: `${textInput.x * zoom + pan.x}px`,
            top: `${textInput.y * zoom + pan.y - 12}px`,
            background: theme === "light" ? "rgba(255, 255, 255, 0.98)" : "rgba(10, 10, 15, 0.95)",
            color: color,
            border: `1px solid ${color}`,
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: `${width * 6 + 12}px`,
            fontFamily: "var(--font-mono)",
            fontWeight: "bold",
            outline: "none",
            resize: "both",
            zIndex: 100,
            caretColor: color,
            boxShadow: `0 0 10px ${color}22`
          }}
          value={textInput.value}
          onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
          onBlur={completeTextInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              completeTextInput();
            } else if (e.key === "Escape") {
              setTextInput(null);
            }
          }}
        />
      )}

      {/* ── FLOATING TOOLBAR (Top center) ── */}
      <div style={{
        ...styles.toolbar,
        background: themeStyle.toolbarBg,
        borderColor: themeStyle.border
      }}>
        {[
          { id: "select", icon: MousePointer, label: "Select (V)" },
          { id: "hand", icon: Hand, label: "Pan (H)" },
          { id: "pencil", icon: Pencil, label: "Pencil (P)" },
          { id: "line", icon: Minus, label: "Line (L)" },
          { id: "rectangle", icon: Square, label: "Rectangle (R)" },
          { id: "circle", icon: CircleIcon, label: "Circle (O)" },
          { id: "text", icon: Type, label: "Text (T)" },
          { id: "eraser", icon: Eraser, label: "Eraser (E)" }
        ].map((t) => {
          const Icon = t.icon;
          const active = tool === t.id;
          const activeColor = theme === 'light' ? '#0066cc' : '#00f0ff';
          return (
            <button
              key={t.id}
              onClick={() => { setSelectedElement(null); setTool(t.id); }}
              style={{
                ...styles.toolBtn,
                background: active ? (theme === 'light' ? "rgba(0, 102, 204, 0.12)" : "rgba(0, 240, 255, 0.15)") : "transparent",
                color: active ? activeColor : themeStyle.textColor,
                border: active ? `1px solid ${activeColor}55` : "1px solid transparent",
                opacity: active ? 1 : 0.7
              }}
              title={t.label}
            >
              <Icon size={14} />
            </button>
          );
        })}
        <div style={styles.toolbarDivider} />
        <button
          onClick={handleClear}
          style={{
            ...styles.clearBtn,
            color: themeStyle.textColor,
            opacity: 0.7
          }}
          title="Clear Board"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* ── FLOATING SETTINGS BAR (Left center) ── */}
      <div style={{
        ...styles.settingsPanel,
        background: themeStyle.toolbarBg,
        borderColor: themeStyle.border
      }}>
        {/* Colors */}
        <div style={styles.settingsSection}>
          <span style={{ ...styles.settingsLabel, color: themeStyle.textColor, opacity: 0.5 }}>COLORS</span>
          <div style={styles.colorGrid}>
            {activeColors.map((c) => {
              const active = color === c.value;
              const borderVal = active
                ? (theme === 'light' ? `2px solid #1e1e1e` : `2px solid #ffffff`)
                : `1px solid ${themeStyle.border}`;
              return (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  style={{
                    ...styles.colorCircle,
                    background: c.value,
                    border: borderVal,
                    transform: active ? "scale(1.1)" : "scale(1)",
                    boxShadow: active ? `0 0 8px ${c.value}66` : "none"
                  }}
                  title={c.label}
                />
              );
            })}
          </div>
        </div>

        {/* Thickness */}
        <div style={styles.settingsSection}>
          <span style={{ ...styles.settingsLabel, color: themeStyle.textColor, opacity: 0.5 }}>STROKE WIDTH</span>
          <div style={styles.thicknessRow}>
            {[2, 4, 8].map((w, index) => {
              const active = width === w;
              const labels = ["Thin", "Medium", "Thick"];
              const activeColor = theme === 'light' ? '#0066cc' : '#00f0ff';
              return (
                <button
                  key={w}
                  onClick={() => setWidth(w)}
                  style={{
                    ...styles.settingsOptionBtn,
                    color: active ? activeColor : themeStyle.textColor,
                    background: active ? (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)') : 'transparent',
                    borderColor: active ? activeColor : themeStyle.border,
                    opacity: active ? 1 : 0.7
                  }}
                >
                  {labels[index]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fill Style */}
        <div style={styles.settingsSection}>
          <span style={{ ...styles.settingsLabel, color: themeStyle.textColor, opacity: 0.5 }}>FILL</span>
          <div style={styles.thicknessRow}>
            {[
              { id: "none", label: "None" },
              { id: "semi", label: "Hollow" },
              { id: "solid", label: "Solid" }
            ].map((f) => {
              const active = fillStyle === f.id;
              const activeColor = theme === 'light' ? '#0066cc' : '#00f0ff';
              return (
                <button
                  key={f.id}
                  onClick={() => setFillStyle(f.id)}
                  style={{
                    ...styles.settingsOptionBtn,
                    color: active ? activeColor : themeStyle.textColor,
                    background: active ? (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)') : 'transparent',
                    borderColor: active ? activeColor : themeStyle.border,
                    opacity: active ? 1 : 0.7
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ZOOM CONTROLS (Bottom left) ── */}
      <div style={{
        ...styles.zoomControls,
        background: themeStyle.toolbarBg,
        borderColor: themeStyle.border
      }}>
        <button onClick={() => handleZoom(0.85)} style={{ ...styles.zoomBtn, color: themeStyle.textColor }} title="Zoom Out">
          <ZoomOut size={12} />
        </button>
        <span style={{ ...styles.zoomText, color: themeStyle.textColor }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => handleZoom(1.15)} style={{ ...styles.zoomBtn, color: themeStyle.textColor }} title="Zoom In">
          <ZoomIn size={12} />
        </button>
        <div style={styles.zoomDivider} />
        <button onClick={() => handleZoom(1)} style={{ ...styles.zoomBtn, color: themeStyle.textColor }} title="Reset View">
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
};

// Styling for darkboard components
const styles = {
  whiteboardContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    background: "#0c0c10", // deep rich space background
    overflow: "hidden",
    userSelect: "none"
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
    backgroundSize: "24px 24px",
    pointerEvents: "none"
  },
  toolbar: {
    position: "absolute",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 10px",
    background: "rgba(15, 15, 22, 0.85)",
    backdropFilter: "blur(12px)",
    borderRadius: "30px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    zIndex: 10
  },
  toolBtn: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  toolbarDivider: {
    width: "1px",
    height: "16px",
    background: "rgba(255, 255, 255, 0.15)",
    margin: "0 4px"
  },
  clearBtn: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    color: "var(--text-muted)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  settingsPanel: {
    position: "absolute",
    top: "80px",
    left: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "12px",
    background: "rgba(15, 15, 22, 0.85)",
    backdropFilter: "blur(12px)",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    zIndex: 10,
    width: "120px"
  },
  settingsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  settingsLabel: {
    fontSize: "8px",
    fontWeight: "bold",
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
    fontFamily: "var(--font-mono)"
  },
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px"
  },
  colorCircle: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    cursor: "pointer",
    padding: 0,
    transition: "all 0.2s ease"
  },
  thicknessRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  settingsOptionBtn: {
    width: "100%",
    padding: "4px 6px",
    fontSize: "10px",
    textAlign: "left",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 500,
    fontFamily: "var(--font-body)",
    transition: "all 0.15s ease"
  },
  zoomControls: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    background: "rgba(15, 15, 22, 0.85)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    zIndex: 10
  },
  zoomBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  zoomText: {
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-secondary)",
    minWidth: "32px",
    textAlign: "center"
  },
  zoomDivider: {
    width: "1px",
    height: "10px",
    background: "rgba(255, 255, 255, 0.15)",
    margin: "0 2px"
  }
};

export default Whiteboard;
