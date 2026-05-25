import React, { useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

type RegexChoice = "regex1" | "regex2";

interface PDAFlowchartProps {
  lastSimulated: { input: string; rowId: number } | null;
  selectedRegex: RegexChoice;
  onSimulationComplete: (rowId: number, isValid: boolean) => void;
}

// ─────────────────────────────────────────────────────────────
//  VALIDATION
// ─────────────────────────────────────────────────────────────

function validatePDA(input: string, regex: RegexChoice): boolean {
  if (regex === "regex1") {
    return /^(a|b)(a|b)*(aa|bb)(ab|ba)(a|b)*(aba|baa)$/.test(input);
  } else {
    return /^(11|00)(1|0)*(101|111|01)(0+|1+)(1|0|11)$/.test(input);
  }
}

// ─────────────────────────────────────────────────────────────
//  SHARED SVG HELPERS
// ─────────────────────────────────────────────────────────────

const Marker: React.FC<{ id: string; color: string }> = ({ id, color }) => (
  <marker id={id} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill={color} />
  </marker>
);

const Arrow: React.FC<{
  pts: [number, number][];
  marker: string;
  color: string;
  dashed?: boolean;
}> = ({ pts, marker, color, dashed }) => {
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={1.5}
      strokeDasharray={dashed ? "5,3" : undefined}
      markerEnd={`url(#${marker})`} />
  );
};

const EL: React.FC<{
  x: number; y: number; text: string;
  red?: boolean; cyan?: boolean; green?: boolean;
}> = ({ x, y, text, red, cyan, green }) => {
  const fill = red ? "#fafafa" : cyan ? "#74DCFF" : green ? "#4ade80" : "#e5e7eb";
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700} fill={fill}>
      {text}
    </text>
  );
};

const Ovl: React.FC<{
  cx: number; cy: number; rx?: number; ry?: number;
  label: string; fill: string; stroke: string; textFill: string;
}> = ({ cx, cy, rx = 28, ry = 14, label, fill, stroke, textFill }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill={fill} stroke={stroke} strokeWidth={1.8} />
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
      fontSize={9} fontWeight={800} fill={textFill} letterSpacing={0.4}>
      {label}
    </text>
  </g>
);

// ─────────────────────────────────────────────────────────────
//  ALPHABET SVG (regex1) — Extended Arrow Spans
// ─────────────────────────────────────────────────────────────

const T1 = {
  bg:            "#0d0d0d",
  diamondFill:   "#0f1f3d",
  diamondStroke: "#74DCFF",
  startFill:     "#3b1f6e",
  startStroke:   "#a855f7",
  acceptFill:    "#14532d",
  acceptStroke:  "#22c55e",
  arrowGrey:     "#6b7280",
  arrowPink:     "#f7f7f7",
  arrowBlue:     "#60a5fa",
  nodeText:      "#74DCFF",
};

const VW1 = 900, VH1 = 1100;
const DW1 = 34, DH1 = 20;

const NA = {
  start:    [450, 40]   as [number, number],
  read1:    [450, 110]  as [number, number],
  read2:    [450, 210]  as [number, number],
  read3:    [250, 280]  as [number, number],
  read4:    [650, 280]  as [number, number],
  read5:    [450, 390]  as [number, number],
  read6:    [250, 460]  as [number, number],
  read7:    [650, 460]  as [number, number],
  read8:    [450, 570]  as [number, number],
  
  // Left Branch Structure
  read9:    [200, 670]  as [number, number],
  read10:   [200, 780]  as [number, number],
  read11:   [200, 930]  as [number, number],
  acceptL:  [200, 1040] as [number, number],

  // Right Branch Structure
  read12:   [710, 670]  as [number, number],
  read13:   [710, 780]  as [number, number],
  read14:   [710, 930]  as [number, number],
  acceptR:  [710, 1040] as [number, number],
};

const DmdA: React.FC<{ cx: number; cy: number; label: string }> = ({ cx, cy, label }) => {
  const pts = `${cx},${cy - DH1} ${cx + DW1},${cy} ${cx},${cy + DH1} ${cx - DW1},${cy}`;
  return (
    <g>
      <polygon points={pts} fill={T1.diamondFill} stroke={T1.diamondStroke} strokeWidth={1.8} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={9} fontWeight={700} fill={T1.nodeText}>{label}</text>
    </g>
  );
};

const AlphabetSVG: React.FC = () => (
  <svg viewBox={`0 0 ${VW1} ${VH1}`} width={VW1} height={VH1}
    xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <defs>
      <Marker id="a_mg" color={T1.arrowGrey} />
      <Marker id="a_mp" color={T1.arrowPink} />
      <Marker id="a_mb" color={T1.arrowBlue} />
    </defs>

    {/* ── PHASE 1: INITIAL ENTRY ── */}
    <Arrow pts={[[NA.start[0], NA.start[1] + 14], [NA.read1[0], NA.read1[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <Arrow pts={[[NA.read1[0], NA.read1[1] + DH1], [NA.read2[0], NA.read2[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={463} y={160} text="a, b" />

    {/* ── PHASE 2: FIRST DIAMOND LOOP ── */}
    <Arrow pts={[[NA.read2[0] - 18, NA.read2[1] + 10], [NA.read3[0] + 12, NA.read3[1] - 18]]} marker="a_mb" color={T1.arrowBlue} />
    <EL x={342} y={230} text="a" cyan />
    
    <Arrow pts={[[NA.read2[0] + 18, NA.read2[1] + 10], [NA.read4[0] - 12, NA.read4[1] - 18]]} marker="a_mp" color={T1.arrowPink} />
    <EL x={558} y={230} text="b" red />

    {/* Horizontal Crisscrossing Connections */}
    <path d={`M ${NA.read3[0] + DW1} ${NA.read3[1] - 6} Q 450 235 ${NA.read4[0] - DW1} ${NA.read4[1] - 6}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={450} y={265} text="b" red />

    <path d={`M ${NA.read4[0] - DW1} ${NA.read4[1] + 6} Q 450 325 ${NA.read3[0] + DW1} ${NA.read3[1] + 6}`} fill="none" stroke={T1.arrowBlue} strokeWidth={1.5} markerEnd="url(#a_mb)" />
    <EL x={450} y={314} text="a" cyan />

    {/* Converging routes to Row 3 Middle */}
    <path d={`M ${NA.read3[0]} ${NA.read3[1] + DH1} Q 310 390 ${NA.read5[0] - DW1} ${NA.read5[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={313} y={350} text="a" />

    <path d={`M ${NA.read4[0]} ${NA.read4[1] + DH1} Q 590 390 ${NA.read5[0] + DW1} ${NA.read5[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={587} y={350} text="b" />

    {/* ── PHASE 3: SECOND DIAMOND LOOP ── */}
    <Arrow pts={[[NA.read5[0] - 18, NA.read5[1] + 10], [NA.read6[0] + 12, NA.read6[1] - 18]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={342} y={415} text="a" />

    <Arrow pts={[[NA.read5[0] + 18, NA.read5[1] + 10], [NA.read7[0] - 12, NA.read7[1] - 18]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={558} y={415} text="b" />

    {/* Reciprocal loop connections back to Center */}
    <path d={`M ${NA.read6[0] + 12} ${NA.read6[1] - 18} Q 360 440 ${NA.read5[0] - 12} ${NA.read5[1] + 18}`} fill="none" stroke={T1.arrowBlue} strokeWidth={1.5} markerEnd="url(#a_mb)" />
    <EL x={348} y={442} text="a" cyan />

    <path d={`M ${NA.read7[0] - 12} ${NA.read7[1] - 18} Q 540 440 ${NA.read5[0] + 12} ${NA.read5[1] + 18}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={552} y={442} text="b" red />

    {/* Converging routes out to Row 5 Center */}
    <path d={`M ${NA.read6[0]} ${NA.read6[1] + DH1} Q 310 570 ${NA.read8[0] - DW1} ${NA.read8[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={327} y={538} text="b" />

    <path d={`M ${NA.read7[0]} ${NA.read7[1] + DH1} Q 590 570 ${NA.read8[0] + DW1} ${NA.read8[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={573} y={538} text="a" />

    {/* ── PHASE 4: WIDE BRANCHING NETWORK ── */}
    <path d={`M ${NA.read8[0] - DW1} ${NA.read8[1]} Q 300 570 ${NA.read9[0]} ${NA.read9[1] - DH1}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={306} y={578} text="a" />

    <path d={`M ${NA.read8[0] + DW1} ${NA.read8[1]} Q 600 570 ${NA.read12[0]} ${NA.read12[1] - DH1}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={594} y={578} text="b" />

    {/* LEFT-SIDE BASE FLOW */}
    {/* Self Loop a */}
    <path d={`M ${NA.read9[0] - 15} ${NA.read9[1] - DH1} C 150 595, 65 645, ${NA.read9[0] - DW1 + 3} ${NA.read9[1] - 3}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mb)" />
    <EL x={115} y={622} text="a" red />

    <Arrow pts={[[NA.read9[0], NA.read9[1] + DH1], [NA.read10[0], NA.read10[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={190} y={725} text="b" />

    <Arrow pts={[[NA.read10[0], NA.read10[1] + DH1], [NA.read11[0], NA.read11[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={190} y={855} text="a" />

    <Arrow pts={[[NA.read11[0], NA.read11[1] + DH1], [NA.acceptL[0], NA.acceptL[1] - 14]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={190} y={985} text="Δ" />

    {/* RIGHT-SIDE BASE FLOW */}
    {/* Self Loop b */}
    <path d={`M ${NA.read12[0] + 15} ${NA.read12[1] - DH1} C 760 595, 835 645, ${NA.read12[0] + DW1 - 3} ${NA.read12[1] - 3}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={790} y={620} text="b" red />

    <Arrow pts={[[NA.read12[0], NA.read12[1] + DH1], [NA.read13[0], NA.read13[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={720} y={720} text="a" />

    {/* Read 13 -> Read 14 Base Connection */}
    <Arrow pts={[[NA.read13[0], NA.read13[1] + DH1], [NA.read14[0], NA.read14[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={720} y={855} text="a" />

    <Arrow pts={[[NA.read14[0], NA.read14[1] + DH1], [NA.acceptR[0], NA.acceptR[1] - 14]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={720} y={985} text="Δ" />

    {/* ── INTER-BRANCH ROUTING ── */}
    
    {/* 1. Read 14 gives Read 9 an "a" */}
    <Arrow pts={[[NA.read14[0] - DW1, NA.read14[1]], [NA.read9[0] + DW1, NA.read9[1]]]} marker="a_mb" color={T1.arrowBlue} />
    <EL x={410} y={792} text="a" cyan />

    {/* 2. Read 10 gives Read 12 a "b" */}
    <path d={`M ${NA.read10[0] + 15} ${NA.read10[1] - 10} L ${NA.read12[0] - DW1} ${NA.read12[1] + 3}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={480} y={702} text="b" red />

    {/* 3a. Read 13 gives Read 10 a "b" */}
    <Arrow pts={[[NA.read13[0] - DW1, NA.read13[1]], [NA.read10[0] + DW1, NA.read10[1]]]} marker="a_mp" color={T1.arrowPink} />
    <EL x={480} y={767} text="b" red />

    {/* 3b. Read 14 gives Read 10 a "b" */}
    <path d={`M ${NA.read14[0] - 8} ${NA.read14[1] - DH1} Q 480 880, ${NA.read10[0] + 20} ${NA.read10[1] + 15}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={500} y={864} text="b" red />

    {/* 4. Read 11 gives Read 14 an "a" */}
    <Arrow pts={[[NA.read11[0] + DW1, NA.read11[1]], [NA.read14[0] - DW1, NA.read14[1]]]} marker="a_mb" color={T1.arrowBlue} />
    <EL x={450} y={937} text="a" cyan />

    {/* 5. Read 11 gives Read 10 a "b" */}
    <path d={`M ${NA.read11[0] - 12} ${NA.read11[1] - 18} Q 70 855, ${NA.read10[0] - 12} ${NA.read10[1] + 18}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={110} y={855} text="b" red />

    {/* ── DESIGN COMPONENT GRAPHICS ── */}
    <Ovl cx={NA.start[0]} cy={NA.start[1]} label="Start" fill={T1.startFill} stroke={T1.startStroke} textFill="#c084fc" />
    <Ovl cx={NA.acceptL[0]} cy={NA.acceptL[1]} label="ACCEPT" fill={T1.acceptFill} stroke={T1.acceptStroke} textFill="#4ade80" />
    <Ovl cx={NA.acceptR[0]} cy={NA.acceptR[1]} label="ACCEPT" fill={T1.acceptFill} stroke={T1.acceptStroke} textFill="#4ade80" />

    <DmdA cx={NA.read1[0]} cy={NA.read1[1]} label="Read 1" />
    <DmdA cx={NA.read2[0]} cy={NA.read2[1]} label="Read 2" />
    <DmdA cx={NA.read3[0]} cy={NA.read3[1]} label="Read 3" />
    <DmdA cx={NA.read4[0]} cy={NA.read4[1]} label="Read 4" />
    <DmdA cx={NA.read5[0]} cy={NA.read5[1]} label="Read 5" />
    <DmdA cx={NA.read6[0]} cy={NA.read6[1]} label="Read 6" />
    <DmdA cx={NA.read7[0]} cy={NA.read7[1]} label="Read 7" />
    <DmdA cx={NA.read8[0]} cy={NA.read8[1]} label="Read 8" />
    <DmdA cx={NA.read9[0]} cy={NA.read9[1]} label="Read 9" />
    <DmdA cx={NA.read10[0]} cy={NA.read10[1]} label="Read 10" />
    <DmdA cx={NA.read11[0]} cy={NA.read11[1]} label="Read 11" />
    <DmdA cx={NA.read12[0]} cy={NA.read12[1]} label="Read 12" />
    <DmdA cx={NA.read13[0]} cy={NA.read13[1]} label="Read 13" />
    <DmdA cx={NA.read14[0]} cy={NA.read14[1]} label="Read 14" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
//  BINARY SVG (regex2) — Remapped into Diamond Flow Elements
// ─────────────────────────────────────────────────────────────

const T2 = {
  diamondFill:   "#0f1f3d",
  diamondStroke: "#74DCFF",
  trapFill:      "#1a0a0a",
  trapStroke:    "#6b7280",
  startFill:     "#3b1f6e",
  startStroke:   "#a855f7",
  acceptFill:    "#14532d",
  acceptStroke:  "#22c55e",
  arrow:         "#9ca3af",
  nodeText:      "#74DCFF",
  labelText:     "#e5e7eb",
  dimLabel:      "#6b7280",
};

const VW2 = 1800, VH2 = 1000;
const DW2 = 34, DH2 = 20;

// Shifted layout (+45px along X-axis, +0px along Y-axis from your original file) for perfect centering
const P: Record<string, [number, number]> = {
  start:     [135, 500],
  q0:        [265, 500],
  q1:        [430, 300],
  q2:        [430, 500],
  q3:        [430, 700],
  q4:        [595, 500],
  q5:        [760, 300],
  q6:        [760, 700],
  q7:        [925, 180],  
  q8:        [925, 500],
  q9:        [925, 700],
  q10:       [1090, 300],
  q11:       [1090, 700],
  q12:       [1255, 300],
  q13:       [1255, 500],
  q14:       [1420, 300], 
  q15:       [1420, 500], 
  q16:       [1585, 180], 
  q17:       [1585, 700], 
  accept7:   [925,  60],   
  accept145: [1530, 400],  
  accept16:  [1585,  60],   
  accept17:  [1585, 820],  
};

const TRAP_STATES = new Set(["q2"]);

const DmdB: React.FC<{ id: string }> = ({ id }) => {
  const [cx, cy] = P[id];
  const isTrap   = TRAP_STATES.has(id);
  
  const fill   = isTrap ? T2.trapFill : T2.diamondFill;
  const stroke = isTrap ? T2.trapStroke : T2.diamondStroke;
  const tFill  = T2.nodeText;
  
  const numericId = id.replace("q", "");
  const displayLabel = `Read ${numericId}`;

  const pts = `${cx},${cy - DH2} ${cx + DW2},${cy} ${cx},${cy + DH2} ${cx - DW2},${cy}`;

  return (
    <g>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.8} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={8.5} fontWeight={700} fill={tFill}>{displayLabel}</text>
    </g>
  );
};

const StraightEdge: React.FC<{
  from: string; to: string; label: string;
  ox?: number; oy?: number; color?: string;
  fromAngle?: number; toAngle?: number;
  isCustomToCoords?: [number, number];
  isFromOval?: boolean;
}> = ({ from, to, label, ox = 0, oy = -10, color = T2.arrow, fromAngle, toAngle, isCustomToCoords, isFromOval }) => {
  const [x1, y1] = P[from];
  const [x2, y2] = isCustomToCoords || P[to];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = len > 0 ? dx / len : 0, uy = len > 0 ? dy / len : 0;

  let sx = x1, sy = y1, ex = x2, ey = y2;
  if (fromAngle !== undefined) {
    sx = x1 + DW2 * Math.cos(fromAngle);
    sy = y1 + DH2 * Math.sin(fromAngle);
  } else {
    sx = x1 + (isFromOval ? 28 : DW2) * ux;
    sy = y1 + (isFromOval ? 14 : DH2) * uy;
  }
  if (toAngle !== undefined) {
    ex = x2 + DW2 * Math.cos(toAngle);
    ey = y2 + DH2 * Math.sin(toAngle);
  } else if (!isCustomToCoords) {
    ex = x2 - DW2 * ux;
    ey = y2 - DH2 * uy;
  } else {
    ex = x2 - 28 * ux;
    ey = y2 - 14 * uy;
  }

  const mx = (sx + ex) / 2 + ox;
  const my = (sy + ex) / 2 + oy; // matches structural layout calculation from context
  const targetMy = (sy + ey) / 2 + oy;
  const markerId = `b2_arr_${color.replace("#", "")}`;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <line x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={color} strokeWidth={1.5} markerEnd={`url(#${markerId})`} />
      <text x={mx} y={targetMy} textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700} fill={T2.labelText}>{label}</text>
    </g>
  );
};

const CurveEdge: React.FC<{
  from: string; to: string; label: string;
  cx1: number; cy1: number;
  ox?: number; oy?: number;
  color?: string;
  fromAngle?: number; toAngle?: number;
}> = ({ from, to, label, cx1, cy1, ox = 0, oy = -10, color = T2.arrow, fromAngle, toAngle }) => {
  // Apply visual offset constant directly when resolving specific control fields inside shifted layouts
  const adjustedCx1 = cx1 + 45;
  const [x1, y1] = P[from];
  const [x2, y2] = P[to];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;

  let sx = x1, sy = y1, ex = x2, ey = y2;
  if (fromAngle !== undefined) {
    sx = x1 + DW2 * Math.cos(fromAngle);
    sy = y1 + DH2 * Math.sin(fromAngle);
  } else {
    sx = x1 + DW2 * ux;
    sy = y1 + DH2 * uy;
  }
  if (toAngle !== undefined) {
    ex = x2 + DW2 * Math.cos(toAngle);
    ey = y2 + DH2 * Math.sin(toAngle);
  } else {
    ex = x2 - DW2 * ux;
    ey = y2 - DH2 * uy;
  }

  const markerId = `b2_arr_curve_${color.replace("#", "")}`;
  const lx = 0.25 * sx + 0.5 * adjustedCx1 + 0.25 * ex + ox;
  const ly = 0.25 * sy + 0.5 * cy1 + 0.25 * ey + oy;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <path d={`M${sx},${sy} Q${adjustedCx1},${cy1} ${ex},${ey}`}
        fill="none" stroke={color} strokeWidth={1.5} markerEnd={`url(#${markerId})`} />
      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700} fill={T2.labelText}>{label}</text>
    </g>
  );
};

const SelfEdge: React.FC<{
  state: string; label: string;
  side?: "top" | "bottom" | "left" | "right";
  color?: string;
}> = ({ state, label, side = "top", color = T2.arrow }) => {
  const [cx, cy] = P[state];
  const sweep = 40;
  let x1: number, y1: number, x2: number, y2: number;
  let lx: number, ly: number;
  let cpx: number, cpy: number;

  if (side === "top") {
    x1 = cx - 12; y1 = cy - DH2;
    x2 = cx + 12; y2 = cy - DH2;
    cpx = cx; cpy = cy - DH2 - sweep;
    lx = cx; ly = cy - DH2 - sweep - 0;
  } else if (side === "bottom") {
    x1 = cx + 12; y1 = cy + DH2;
    x2 = cx - 12; y2 = cy + DH2;
    cpx = cx; cpy = cy + DH2 + sweep;
    lx = cx; ly = cy + DH2 + sweep + 12;
  } else if (side === "left") {
    x1 = cx - DW2; y1 = cy + 10;
    x2 = cx - DW2; y2 = cy - 10;
    cpx = cx - DW2 - sweep; cpy = cy;
    lx = cx - DW2 - sweep - 0; ly = cy;
  } else {
    x1 = cx + DW2; y1 = cy - 10;
    x2 = cx + DW2; y2 = cy + 10;
    cpx = cx + DW2 - sweep; cpy = cy;
    lx = cx + DW2 + sweep + 14; ly = cy;
  }

  const markerId = `sl_${state}_${side}`;
  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <path d={`M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`}
        fill="none" stroke={color} strokeWidth={1.5} markerEnd={`url(#${markerId})`} />
      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700} fill={T2.labelText}>{label}</text>
    </g>
  );
};

const BinarySVG: React.FC = () => {
  const grey = T2.arrow;
  const green = "#4ade80";

  return (
    <svg viewBox={`0 0 ${VW2} ${VH2}`} width={VW2} height={VH2}
      xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>

      {/* Entry arrow coming directly from the Start Oval State Node */}
      <StraightEdge from="start" to="q0" label="" isFromOval={true} color={grey} />

      {/* Connections Flow Routing */}
      <StraightEdge from="q0" to="q1" label="0" ox={-10} oy={-8} />
      <StraightEdge from="q0" to="q3" label="1" ox={-10} oy={8} />

      <StraightEdge from="q1" to="q4" label="0" ox={0} oy={-12} />
      <StraightEdge from="q1" to="q2" label="1" ox={12} oy={0} />

      <SelfEdge state="q2" label="0,1" side="left" />

      <StraightEdge from="q3" to="q2" label="0" ox={12} oy={0} />
      <StraightEdge from="q3" to="q4" label="1" ox={0} oy={12} />

      <StraightEdge from="q4" to="q5" label="0" ox={0} oy={-12} />
      <StraightEdge from="q4" to="q6" label="1" ox={0} oy={12} />

      <SelfEdge state="q5" label="0" side="top" color={grey} />
      <StraightEdge from="q5" to="q10" label="1" ox={0} oy={-12} color={grey} />

      <StraightEdge from="q6" to="q5"
        label="0" ox={10} oy={-12}
        fromAngle={-Math.PI / 2} toAngle={Math.PI / 2} />
      <StraightEdge from="q6" to="q8" label="1" ox={0} oy={12} />

      {/* Curves dynamically scaled to newly translated spaces */}
      <CurveEdge from="q7" to="q5" label="0"
        cx1={800} cy1={240} ox={-8} oy={-12} />
      <StraightEdge from="q7" to="q10" label="1" ox={0} oy={-12} />

      <CurveEdge from="q8" to="q5" label="0"
        cx1={800} cy1={410} ox={0} oy={-14} />
      <StraightEdge from="q8" to="q9" label="1" ox={0} oy={12} />

      <StraightEdge from="q9" to="q11" label="0" ox={0} oy={12} />
      <CurveEdge from="q9" to="q13" label="1"
        cx1={1045} cy1={630} ox={14} oy={0} />

      <StraightEdge from="q10" to="q11"
        label="0" ox={12} oy={0}
        fromAngle={Math.PI / 2} toAngle={-Math.PI / 2} />
      <StraightEdge from="q10" to="q12" label="1" ox={0} oy={-12} />

      <StraightEdge from="q11" to="q15" label="0" ox={0} oy={12} />
      <StraightEdge from="q11" to="q17" label="1" ox={0} oy={12} color={grey} />

      <CurveEdge from="q12" to="q7" label="0"
        cx1={1045} cy1={220} ox={0} oy={-14} />
      <StraightEdge from="q12" to="q14" label="1" ox={0} oy={-12} color={grey} />

      <StraightEdge from="q13" to="q15" label="0" ox={0} oy={12} />
      <StraightEdge from="q13" to="q14" label="1" ox={0} oy={-12} color={grey} />

      <SelfEdge state="q14" label="1" side="top" color={grey} />
      <StraightEdge from="q14" to="q15"
        label="0" ox={12} oy={0}
        fromAngle={Math.PI / 2} toAngle={-Math.PI / 2} />

      <SelfEdge state="q15" label="0" side="bottom" color={grey} />
      <StraightEdge from="q15" to="q17" label="1" ox={0} oy={12} color={grey} />

      <StraightEdge from="q16" to="q7" label="0" ox={0} oy={-12} color={grey} />
      <CurveEdge from="q16" to="q14" label="1"
        cx1={1460} cy1={240} ox={8} oy={-14} color={grey} />

      <CurveEdge from="q17" to="q11" label="0"
        cx1={1295} cy1={800} ox={0} oy={14} />
      <StraightEdge from="q17" to="q16" label="1" ox={10} oy={12} color={grey} />

      {/* Vertical Accept Lanes */}
      <StraightEdge from="q7" to="accept7" label="Δ" color={green} ox={-12} oy={0} isCustomToCoords={P.accept7} />
      <StraightEdge from="q16" to="accept16" label="Δ" color={green} ox={-12} oy={0} isCustomToCoords={P.accept16} />
      <StraightEdge from="q17" to="accept17" label="Δ" color={green} ox={-12} oy={0} isCustomToCoords={P.accept17} />
      
      <StraightEdge from="q14" to="accept145" label="Δ" color={green} isCustomToCoords={P.accept145} />
      <StraightEdge from="q15" to="accept145" label="Δ" color={green} isCustomToCoords={P.accept145} />

      {/* Render Diamond Nodes over Edges Layer */}
      {Object.keys(P).filter(k => !k.startsWith("accept") && k !== "start").map(id => <DmdB key={id} id={id} />)}

      {/* Render Design Start/Accept State Graphics Layer */}
      <Ovl cx={P.start[0]} cy={P.start[1]} label="Start" fill={T2.startFill} stroke={T2.startStroke} textFill="#c084fc" />
      <Ovl cx={P.accept7[0]} cy={P.accept7[1]} label="ACCEPT" fill={T2.acceptFill} stroke={T2.acceptStroke} textFill="#4ade80" />
      <Ovl cx={P.accept145[0]} cy={P.accept145[1]} label="ACCEPT" fill={T2.acceptFill} stroke={T2.acceptStroke} textFill="#4ade80" />
      <Ovl cx={P.accept16[0]} cy={P.accept16[1]} label="ACCEPT" fill={T2.acceptFill} stroke={T2.acceptStroke} textFill="#4ade80" />
      <Ovl cx={P.accept17[0]} cy={P.accept17[1]} label="ACCEPT" fill={T2.acceptFill} stroke={T2.acceptStroke} textFill="#4ade80" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
//  SVG NODE
// ─────────────────────────────────────────────────────────────

interface SvgNodeData {
  svgComponent: React.FC;
  [key: string]: unknown;
}

const SvgNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as SvgNodeData;
  const Svg = d.svgComponent;
  return (
    <div style={{ lineHeight: 0 }}>
      <Svg />
    </div>
  );
};

const nodeTypes = { svgDiagram: SvgNode };

// ─────────────────────────────────────────────────────────────
//  BUILD REACT FLOW NODES
// ─────────────────────────────────────────────────────────────

const alphabetFlowNodes: Node[] = [
  {
    id: "pda-diagram",
    type: "svgDiagram",
    position: { x: 0, y: 0 },
    data: { svgComponent: AlphabetSVG },
    draggable: false,
    selectable: false,
    connectable: false,
  },
];

const binaryFlowNodes: Node[] = [
  {
    id: "pda-diagram",
    type: "svgDiagram",
    position: { x: 0, y: 0 },
    data: { svgComponent: BinarySVG },
    draggable: false,
    selectable: false,
    connectable: false,
  },
];

// ─────────────────────────────────────────────────────────────
//  INNER FLOW
// ─────────────────────────────────────────────────────────────

interface PDAFlowProps {
  selectedRegex: RegexChoice;
}

const PDAFlow: React.FC<PDAFlowProps> = ({ selectedRegex }) => {
  const initialNodes = selectedRegex === "regex1" ? alphabetFlowNodes : binaryFlowNodes;

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(selectedRegex === "regex1" ? alphabetFlowNodes : binaryFlowNodes);
  }, [selectedRegex, setNodes]);

  useEffect(() => {
    const t = setTimeout(() => fitView({ duration: 400, padding: 0.05 }), 60);
    return () => clearTimeout(t);
  }, [selectedRegex, fitView]);

  useEffect(() => {
    const handler = () => fitView({ padding: 0.05 });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      fitView
      fitViewOptions={{ padding: 0.1 }}
    >
      <Background
        color="#515151"
        variant={BackgroundVariant.Dots}
        style={{ backgroundColor: "#000000" }}
      />
      <Controls />
    </ReactFlow>
  );
};

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────

const PDAModule: React.FC<PDAFlowchartProps> = ({
  lastSimulated,
  selectedRegex,
  onSimulationComplete,
}) => {
  const prevSim = useRef<{ input: string; rowId: number } | null>(null);

  useEffect(() => {
    if (!lastSimulated || prevSim.current === lastSimulated) return;
    prevSim.current = lastSimulated;
    const { input, rowId } = lastSimulated;
    const alphabetOk =
      selectedRegex === "regex1" ? /^[ab]+$/.test(input) : /^[01]+$/.test(input);
    onSimulationComplete(rowId, alphabetOk && validatePDA(input, selectedRegex));
  }, [lastSimulated, selectedRegex, onSimulationComplete]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <PDAFlow selectedRegex={selectedRegex} />
    </div>
  );
};

export default PDAModule;
