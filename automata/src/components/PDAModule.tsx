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
  const fill = red ? "#f87171" : cyan ? "#74DCFF" : green ? "#4ade80" : "#e5e7eb";
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
  arrowPink:     "#f472b6",
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
  read9:    [150, 670]  as [number, number],
  read10:   [150, 780]  as [number, number],
  read11:   [150, 930]  as [number, number],
  acceptL:  [150, 1040] as [number, number],

  // Right Branch Structure
  read12:   [750, 670]  as [number, number],
  read13:   [750, 780]  as [number, number],
  read14:   [750, 930]  as [number, number],
  acceptR:  [750, 1040] as [number, number],
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
    <EL x={342} y={235} text="a" cyan />
    
    <Arrow pts={[[NA.read2[0] + 18, NA.read2[1] + 10], [NA.read4[0] - 12, NA.read4[1] - 18]]} marker="a_mp" color={T1.arrowPink} />
    <EL x={558} y={235} text="b" red />

    {/* Horizontal Crisscrossing Connections */}
    <path d={`M ${NA.read3[0] + DW1} ${NA.read3[1] - 6} Q 450 235 ${NA.read4[0] - DW1} ${NA.read4[1] - 6}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    {/* Shifted y down from 229 to 254 to accurately position it right under the downward curving path */}
    <EL x={450} y={254} text="b" red />

    <path d={`M ${NA.read4[0] - DW1} ${NA.read4[1] + 6} Q 450 325 ${NA.read3[0] + DW1} ${NA.read3[1] + 6}`} fill="none" stroke={T1.arrowBlue} strokeWidth={1.5} markerEnd="url(#a_mb)" />
    <EL x={450} y={314} text="a" cyan />

    {/* Converging routes to Row 3 Middle */}
    <path d={`M ${NA.read3[0]} ${NA.read3[1] + DH1} Q 310 390 ${NA.read5[0] - DW1} ${NA.read5[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={313} y={356} text="a" />

    <path d={`M ${NA.read4[0]} ${NA.read4[1] + DH1} Q 590 390 ${NA.read5[0] + DW1} ${NA.read5[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={587} y={356} text="b" />

    {/* ── PHASE 3: SECOND DIAMOND LOOP ── */}
    <Arrow pts={[[NA.read5[0] - 18, NA.read5[1] + 10], [NA.read6[0] + 12, NA.read6[1] - 18]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={342} y={422} text="a" />

    <Arrow pts={[[NA.read5[0] + 18, NA.read5[1] + 10], [NA.read7[0] - 12, NA.read7[1] - 18]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={558} y={422} text="b" />

    {/* Reciprocal loop connections back to Center */}
    <path d={`M ${NA.read6[0] + 12} ${NA.read6[1] - 18} Q 360 440 ${NA.read5[0] - 12} ${NA.read5[1] + 18}`} fill="none" stroke={T1.arrowBlue} strokeWidth={1.5} markerEnd="url(#a_mb)" />
    <EL x={348} y={438} text="a" cyan />

    <path d={`M ${NA.read7[0] - 12} ${NA.read7[1] - 18} Q 540 440 ${NA.read5[0] + 12} ${NA.read5[1] + 18}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={552} y={438} text="b" red />

    {/* Converging routes out to Row 5 Center */}
    <path d={`M ${NA.read6[0]} ${NA.read6[1] + DH1} Q 310 570 ${NA.read8[0] - DW1} ${NA.read8[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={327} y={528} text="b" />

    <path d={`M ${NA.read7[0]} ${NA.read7[1] + DH1} Q 590 570 ${NA.read8[0] + DW1} ${NA.read8[1]}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={573} y={528} text="a" />

    {/* ── PHASE 4: WIDE BRANCHING NETWORK ── */}
    <path d={`M ${NA.read8[0] - DW1} ${NA.read8[1]} Q 300 570 ${NA.read9[0]} ${NA.read9[1] - DH1}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={306} y={578} text="a" />

    <path d={`M ${NA.read8[0] + DW1} ${NA.read8[1]} Q 600 570 ${NA.read12[0]} ${NA.read12[1] - DH1}`} fill="none" stroke={T1.arrowGrey} strokeWidth={1.5} markerEnd="url(#a_mg)" />
    <EL x={594} y={578} text="b" />

    {/* LEFT-SIDE BASE FLOW */}
    {/* Self Loop a */}
    <path d={`M ${NA.read9[0] - 15} ${NA.read9[1] - DH1} C 65 595, 65 645, ${NA.read9[0] - DW1 + 3} ${NA.read9[1] - 3}`} fill="none" stroke={T1.arrowBlue} strokeWidth={1.5} markerEnd="url(#a_mb)" />
    <EL x={80} y={620} text="a" cyan />

    <Arrow pts={[[NA.read9[0], NA.read9[1] + DH1], [NA.read10[0], NA.read10[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={142} y={725} text="b" />

    <Arrow pts={[[NA.read10[0], NA.read10[1] + DH1], [NA.read11[0], NA.read11[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={142} y={855} text="a" />

    <Arrow pts={[[NA.read11[0], NA.read11[1] + DH1], [NA.acceptL[0], NA.acceptL[1] - 14]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={142} y={985} text="Δ" />

    {/* RIGHT-SIDE BASE FLOW */}
    {/* Self Loop b */}
    <path d={`M ${NA.read12[0] + 15} ${NA.read12[1] - DH1} C 835 595, 835 645, ${NA.read12[0] + DW1 - 3} ${NA.read12[1] - 3}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={820} y={620} text="b" red />

    <Arrow pts={[[NA.read12[0], NA.read12[1] + DH1], [NA.read13[0], NA.read13[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={758} y={725} text="a" />

    {/* Read 13 -> Read 14 Base Connection */}
    <Arrow pts={[[NA.read13[0], NA.read13[1] + DH1], [NA.read14[0], NA.read14[1] - DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={758} y={855} text="a" />

    <Arrow pts={[[NA.read14[0], NA.read14[1] + DH1], [NA.acceptR[0], NA.acceptR[1] - 14]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={758} y={985} text="Δ" />

    {/* ── INTER-BRANCH ROUTING ── */}
    
    {/* 1. Read 14 gives Read 9 an "a" */}
    <Arrow pts={[[NA.read14[0] - DW1, NA.read14[1]], [NA.read9[0] + DW1, NA.read9[1]]]} marker="a_mb" color={T1.arrowBlue} />
    <EL x={410} y={792} text="a" cyan />

    {/* 2. Read 10 gives Read 12 a "b" */}
    <path d={`M ${NA.read10[0] + 15} ${NA.read10[1] - 10} L ${NA.read12[0] - DW1} ${NA.read12[1] + 3}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={480} y={692} text="b" red />

    {/* 3a. Read 13 gives Read 10 a "b" */}
    <Arrow pts={[[NA.read13[0] - DW1, NA.read13[1]], [NA.read10[0] + DW1, NA.read10[1]]]} marker="a_mp" color={T1.arrowPink} />
    <EL x={450} y={754} text="b" red />

    {/* 3b. Read 14 gives Read 10 a "b" */}
    <path d={`M ${NA.read14[0] - 8} ${NA.read14[1] - DH1} Q 480 880, ${NA.read10[0] + 20} ${NA.read10[1] + 15}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={500} y={864} text="b" red />

    {/* 4. Read 11 gives Read 14 an "a" */}
    <Arrow pts={[[NA.read11[0] + DW1, NA.read11[1]], [NA.read14[0] - DW1, NA.read14[1]]]} marker="a_mb" color={T1.arrowBlue} />
    <EL x={450} y={937} text="a" cyan />

    {/* 5. Read 11 gives Read 10 a "b" */}
    <path d={`M ${NA.read11[0] - 12} ${NA.read11[1] - 18} Q 70 855, ${NA.read10[0] - 12} ${NA.read10[1] + 18}`} fill="none" stroke={T1.arrowPink} strokeWidth={1.5} markerEnd="url(#a_mp)" />
    <EL x={59} y={855} text="b" red />

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
//  BINARY SVG (regex2) — Extended Arrow Spans
// ─────────────────────────────────────────────────────────────

const T2 = {
  bg:            "#0d0d0d",
  diamondFill:   "#0f1f3d",
  diamondStroke: "#74DCFF",
  loopFill:      "#0d2b1f",
  loopStroke:    "#34d399",
  startFill:     "#3b1f6e",
  startStroke:   "#a855f7",
  acceptFill:    "#14532d",
  acceptStroke:  "#22c55e",
  rejectFill:    "#450a0a",
  rejectStroke:  "#ef4444",
  arrowGrey:     "#6b7280",
  arrowRed:      "#ef4444",
  arrowGreen:    "#22c55e",
  arrowCyan:     "#74DCFF",
  nodeText:      "#74DCFF",
  loopText:      "#34d399",
  edgeLabel:     "#e5e7eb",
  dimLabel:      "#6b7280",
};

const VW2 = 1660, VH2 = 790;
const DW2 = 32, DH2 = 18;
const OR2 = { rx: 28, ry: 13 };
const SR2 = { rx: 26, ry: 12 };

const NB = {
  start:       [60,  370] as [number, number],
  accept:      [1580, 370] as [number, number],
  s1:          [170, 370] as [number, number],
  s1b1:        [295, 195] as [number, number],
  s1b0:        [295, 545] as [number, number],
  rej_s1_d:    [170, 530] as [number, number],
  rej_s1b1_0:  [215,  65] as [number, number],
  rej_s1b1_d:  [340,  65] as [number, number],
  rej_s1b0_1:  [215, 675] as [number, number],
  rej_s1b0_d:  [340, 675] as [number, number],
  loop:        [435, 370] as [number, number],
  s3br:        [560, 370] as [number, number],
  rej_s3_d:    [560, 530] as [number, number],
  s3_1:        [670, 195] as [number, number],
  s3_0:        [670, 545] as [number, number],
  rej_s3_1_d:  [670,  65] as [number, number],
  rej_s3_0_x:  [745, 675] as [number, number],
  s3_10:       [785, 220] as [number, number],
  s3_11:       [785, 140] as [number, number],
  rej_s3_10_x: [940, 107] as [number, number],
  rej_s3_11_x: [940,  27] as [number, number],
  s4br:        [920, 370] as [number, number],
  rej_s4_d:    [920, 530] as [number, number],
  s4_1loop:    [1035, 195] as [number, number],
  s4_0loop:    [1035, 545] as [number, number],
  s5br:        [1160, 370] as [number, number],
  rej_s5_d:    [1160, 530] as [number, number],
  s5_1:        [1270, 195] as [number, number],
  s5_0:        [1270, 545] as [number, number],
  rej_s5_1_x:  [1270,  65] as [number, number],
  rej_s5_0_x:  [1270, 675] as [number, number],
  s5_11:       [1390, 195] as [number, number],
  rej_s5_11_x: [1390,  65] as [number, number],
  racc:        [1465, 370] as [number, number],
};

const DmdB: React.FC<{
  cx: number; cy: number; line1: string; line2?: string; loop?: boolean;
}> = ({ cx, cy, line1, line2, loop }) => {
  const pts = `${cx},${cy - DH2} ${cx + DW2},${cy} ${cx},${cy + DH2} ${cx - DW2},${cy}`;
  const fill   = loop ? T2.loopFill   : T2.diamondFill;
  const stroke = loop ? T2.loopStroke : T2.diamondStroke;
  const tFill  = loop ? T2.loopText   : T2.nodeText;
  return (
    <g>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.8} />
      <text x={cx} y={line2 ? cy - 5 : cy} textAnchor="middle" dominantBaseline="central"
        fontSize={9} fontWeight={700} fill={tFill}>{line1}</text>
      {line2 && (
        <text x={cx} y={cy + 7} textAnchor="middle" dominantBaseline="central"
          fontSize={8} fill={tFill}>{line2}</text>
      )}
    </g>
  );
};

const RejB: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <Ovl cx={cx} cy={cy} rx={SR2.rx} ry={SR2.ry} label="REJECT"
    fill={T2.rejectFill} stroke={T2.rejectStroke} textFill="#f87171" />
);

const SelfLoop: React.FC<{ cx: number; cy: number; color: string; markerId: string }> = ({
  cx, cy, color, markerId,
}) => {
  const r = 22;
  const x1 = cx - DW2 * 0.5, y1 = cy - DH2 * 0.5;
  const x2 = cx + DW2 * 0.5, y2 = y1;
  return (
    <path d={`M${x1},${y1} C${x1},${y1 - r * 2} ${x2},${y2 - r * 2} ${x2},${y2}`}
      fill="none" stroke={color} strokeWidth={1.5} markerEnd={`url(#${markerId})`} />
  );
};

const StageLabel: React.FC<{ x: number; text: string }> = ({ x, text }) => (
  <text x={x} y={22} textAnchor="middle" fontSize={9} fontWeight={600}
    fill="#374151" letterSpacing={0.3}>{text}</text>
);

const Divider: React.FC<{ x: number }> = ({ x }) => (
  <line x1={x} y1={35} x2={x} y2={VH2 - 20}
    stroke="#1f2937" strokeWidth={1} strokeDasharray="4,4" />
);

const BinarySVG: React.FC = () => (
  <svg viewBox={`0 0 ${VW2} ${VH2}`} width={VW2} height={VH2}
    xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <defs>
      <Marker id="b_mg"  color={T2.arrowGrey}  />
      <Marker id="b_mr"  color={T2.arrowRed}   />
      <Marker id="b_mc"  color={T2.arrowGreen} />
      <Marker id="b_mcy" color={T2.arrowCyan}  />
    </defs>

    <Divider x={120} /><Divider x={390} /><Divider x={510} />
    <Divider x={880} /><Divider x={1120} /><Divider x={1430} />
    <StageLabel x={63}   text="START" />
    <StageLabel x={250}  text="S1: (11+00)" />
    <StageLabel x={450}  text="S2: (1+0)*" />
    <StageLabel x={700}  text="S3: (101+111+01)" />
    <StageLabel x={1000} text="S4: (00*+11*)" />
    <StageLabel x={1275} text="S5: (1+0+11)" />
    <StageLabel x={1550} text="END" />

    {/* START → S1 */}
    <Arrow pts={[[NB.start[0]+OR2.rx, NB.start[1]], [NB.s1[0]-DW2, NB.s1[1]]]} marker="b_mg" color={T2.arrowGrey} />

    {/* S1 → S1b1 */}
    <Arrow pts={[[NB.s1[0]+8, NB.s1[1]-DH2], [NB.s1b1[0]-DW2, NB.s1b1[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={226} y={270} text="1" />

    {/* S1 → S1b0 */}
    <Arrow pts={[[NB.s1[0]+8, NB.s1[1]+DH2], [NB.s1b0[0]-DW2, NB.s1b0[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={226} y={470} text="0" />

    {/* S1 → REJ_S1_d */}
    <Arrow pts={[[NB.s1[0], NB.s1[1]+DH2], [NB.rej_s1_d[0], NB.rej_s1_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={158} y={452} text="Δ" red />

    {/* S1b1 → LOOP */}
    <Arrow pts={[[NB.s1b1[0]+DW2, NB.s1b1[1]], [NB.loop[0]-DW2, NB.loop[1]]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={365} y={262} text="1" cyan />

    {/* S1b1 → REJ_S1b1_0 */}
    <Arrow pts={[[NB.s1b1[0]-8, NB.s1b1[1]-DH2], [NB.rej_s1b1_0[0]+SR2.rx, NB.rej_s1b1_0[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={260} y={122} text="0" red />

    {/* S1b1 → REJ_S1b1_d */}
    <Arrow pts={[[NB.s1b1[0]+8, NB.s1b1[1]-DH2], [NB.rej_s1b1_d[0]-SR2.rx, NB.rej_s1b1_d[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={316} y={122} text="Δ" red />

    {/* S1b0 → LOOP */}
    <Arrow pts={[[NB.s1b0[0]+DW2, NB.s1b0[1]], [NB.loop[0]-DW2, NB.loop[1]]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={365} y={478} text="0" cyan />

    {/* S1b0 → REJ_S1b0_1 */}
    <Arrow pts={[[NB.s1b0[0]-8, NB.s1b0[1]+DH2], [NB.rej_s1b0_1[0]+SR2.rx, NB.rej_s1b0_1[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={260} y={618} text="1" red />

    {/* S1b0 → REJ_S1b0_d */}
    <Arrow pts={[[NB.s1b0[0]+8, NB.s1b0[1]+DH2], [NB.rej_s1b0_d[0]-SR2.rx, NB.rej_s1b0_d[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={316} y={618} text="Δ" red />

    {/* LOOP self-loop */}
    <SelfLoop cx={NB.loop[0]} cy={NB.loop[1]} color={T2.loopStroke} markerId="b_mg" />
    <EL x={435} y={335} text="1, 0" green />

    {/* LOOP → S3_BRANCH */}
    <Arrow pts={[[NB.loop[0]+DW2, NB.loop[1]], [NB.s3br[0]-DW2, NB.s3br[1]]]} marker="b_mg" color={T2.arrowGrey} dashed />
    <EL x={497} y={357} text="Δ" />

    {/* S3_BRANCH → S3_1 */}
    <Arrow pts={[[NB.s3br[0]+12, NB.s3br[1]-DH2], [NB.s3_1[0]-DW2, NB.s3_1[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={611} y={260} text="1" />

    {/* S3_BRANCH → S3_0 */}
    <Arrow pts={[[NB.s3br[0]+12, NB.s3br[1]+DH2], [NB.s3_0[0]-DW2, NB.s3_0[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={611} y={480} text="0" />

    {/* S3_BRANCH → REJ_S3_d */}
    <Arrow pts={[[NB.s3br[0], NB.s3br[1]+DH2], [NB.rej_s3_d[0], NB.rej_s3_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={548} y={452} text="Δ" red />

    {/* S3_1 → S3_10 */}
    <Arrow pts={[[NB.s3_1[0]+DW2, NB.s3_1[1]], [NB.s3_10[0]-DW2, NB.s3_10[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={732} y={200} text="0" />

    {/* S3_1 → S3_11 */}
    <Arrow pts={[[NB.s3_1[0]+8, NB.s3_1[1]-DH2], [NB.s3_11[0]-DW2, NB.s3_11[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={716} y={158} text="1" />

    {/* S3_1 → REJ_S3_1_d */}
    <Arrow pts={[[NB.s3_1[0]-8, NB.s3_1[1]-DH2], [NB.rej_s3_1_d[0]+SR2.rx, NB.rej_s3_1_d[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={642} y={122} text="Δ" red />

    {/* S3_0 → S4_BRANCH */}
    <Arrow pts={[[NB.s3_0[0]+DW2, NB.s3_0[1]], [NB.s4br[0]+8, NB.s4br[1]+DH2]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={811} y={483} text="1" cyan />

    {/* S3_0 → REJ_S3_0_x */}
    <Arrow pts={[[NB.s3_0[0]+8, NB.s3_0[1]+DH2], [NB.rej_s3_0_x[0]-SR2.rx, NB.rej_s3_0_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={698} y={618} text="0, Δ" red />

    {/* S3_10 → S4_BRANCH */}
    <Arrow pts={[[NB.s3_10[0]+DW2, NB.s3_10[1]], [NB.s4br[0]-8, NB.s4br[1]-DH2]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={861} y={279} text="1" cyan />

    {/* S3_10 → REJ_S3_10_x */}
    <Arrow pts={[[NB.s3_10[0]+DW2, NB.s3_10[1]], [NB.rej_s3_10_x[0]-SR2.rx, NB.rej_s3_10_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={881} y={142} text="0, Δ" red />

    {/* S3_11 → S4_BRANCH */}
    <Arrow pts={[[NB.s3_11[0]+DW2, NB.s3_11[1]], [NB.s4br[0], NB.s4br[1]-DH2-8]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={851} y={214} text="1" cyan />

    {/* S3_11 → REJ_S3_11_x */}
    <Arrow pts={[[NB.s3_11[0]+DW2, NB.s3_11[1]], [NB.rej_s3_11_x[0]-SR2.rx, NB.rej_s3_11_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={881} y={72} text="0, Δ" red />

    {/* S4_BRANCH → S4_1loop */}
    <Arrow pts={[[NB.s4br[0]+12, NB.s4br[1]-DH2], [NB.s4_1loop[0]-DW2, NB.s4_1loop[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={976} y={260} text="1" />

    {/* S4_BRANCH → S4_0loop */}
    <Arrow pts={[[NB.s4br[0]+12, NB.s4br[1]+DH2], [NB.s4_0loop[0]-DW2, NB.s4_0loop[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={976} y={480} text="0" />

    {/* S4_BRANCH → REJ_S4_d */}
    <Arrow pts={[[NB.s4br[0], NB.s4br[1]+DH2], [NB.rej_s4_d[0], NB.rej_s4_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={908} y={452} text="Δ" red />

    {/* S4_1loop self-loop */}
    <SelfLoop cx={NB.s4_1loop[0]} cy={NB.s4_1loop[1]} color={T2.loopStroke} markerId="b_mg" />
    <EL x={1035} y={155} text="1" green />

    {/* S4_1loop → S5_BRANCH */}
    <Arrow pts={[[NB.s4_1loop[0]+DW2, NB.s4_1loop[1]], [NB.s5br[0]-8, NB.s5br[1]-DH2]]} marker="b_mg" color={T2.arrowGrey} dashed />
    <EL x={1105} y={262} text="Δ" />

    {/* S4_0loop self-loop */}
    <SelfLoop cx={NB.s4_0loop[0]} cy={NB.s4_0loop[1]} color={T2.loopStroke} markerId="b_mg" />
    <EL x={1035} y={585} text="0" green />

    {/* S4_0loop → S5_BRANCH */}
    <Arrow pts={[[NB.s4_0loop[0]+DW2, NB.s4_0loop[1]], [NB.s5br[0]-8, NB.s5br[1]+DH2]]} marker="b_mg" color={T2.arrowGrey} dashed />
    <EL x={1105} y={478} text="Δ" />

    {/* S5_BRANCH → S5_1 */}
    <Arrow pts={[[NB.s5br[0]+12, NB.s5br[1]-DH2], [NB.s5_1[0]-DW2, NB.s5_1[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={1216} y={260} text="1" />

    {/* S5_BRANCH → S5_0 */}
    <Arrow pts={[[NB.s5br[0]+12, NB.s5br[1]+DH2], [NB.s5_0[0]-DW2, NB.s5_0[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={1216} y={480} text="0" />

    {/* S5_BRANCH → REJ_S5_d */}
    <Arrow pts={[[NB.s5br[0], NB.s5br[1]+DH2], [NB.rej_s5_d[0], NB.rej_s5_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1148} y={452} text="Δ" red />

    {/* S5_1 → R.ACC */}
    <Arrow pts={[[NB.s5_1[0]+DW2, NB.s5_1[1]], [NB.racc[0]-8, NB.racc[1]-DH2]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1365} y={262} text="Δ" green />

    {/* S5_1 → S5_11 */}
    <Arrow pts={[[NB.s5_1[0]+8, NB.s5_1[1]-DH2], [NB.s5_11[0]-DW2, NB.s5_11[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={1331} y={158} text="1" />

    {/* S5_1 → REJ_S5_1_x */}
    <Arrow pts={[[NB.s5_1[0]-8, NB.s5_1[1]-DH2], [NB.rej_s5_1_x[0]+SR2.rx, NB.rej_s5_1_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1242} y={122} text="0" red />

    {/* S5_0 → R.ACC */}
    <Arrow pts={[[NB.s5_0[0]+DW2, NB.s5_0[1]], [NB.racc[0]-8, NB.racc[1]+DH2]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1365} y={478} text="Δ" green />

    {/* S5_0 → REJ_S5_0_x */}
    <Arrow pts={[[NB.s5_0[0]+8, NB.s5_0[1]+DH2], [NB.rej_s5_0_x[0]-SR2.rx, NB.rej_s5_0_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1242} y={618} text="1, 0" red />

    {/* S5_11 → R.ACC */}
    <Arrow pts={[[NB.s5_11[0]+DW2, NB.s5_11[1]], [NB.racc[0]-8, NB.racc[1]-DH2-8]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1430} y={252} text="Δ" green />

    {/* S5_11 → REJ_S5_11_x */}
    <Arrow pts={[[NB.s5_11[0]+DW2, NB.s5_11[1]], [NB.rej_s5_11_x[0]-SR2.rx, NB.rej_s5_11_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1430} y={107} text="1, 0" red />

    {/* R.ACC → ACCEPT */}
    <Arrow pts={[[NB.racc[0]+DW2, NB.racc[1]], [NB.accept[0]-OR2.rx, NB.accept[1]]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1522} y={357} text="Δ" green />

    {/* ── NODES ── */}
    <Ovl cx={NB.start[0]}  cy={NB.start[1]}  label="START"  fill={T2.startFill}  stroke={T2.startStroke}  textFill="#c084fc" />
    <Ovl cx={NB.accept[0]} cy={NB.accept[1]} rx={34} ry={15} label="ACCEPT" fill={T2.acceptFill} stroke={T2.acceptStroke} textFill="#4ade80" />

    <RejB cx={NB.rej_s1_d[0]}   cy={NB.rej_s1_d[1]}   />
    <RejB cx={NB.rej_s1b1_0[0]} cy={NB.rej_s1b1_0[1]} />
    <RejB cx={NB.rej_s1b1_d[0]} cy={NB.rej_s1b1_d[1]} />
    <RejB cx={NB.rej_s1b0_1[0]} cy={NB.rej_s1b0_1[1]} />
    <RejB cx={NB.rej_s1b0_d[0]} cy={NB.rej_s1b0_d[1]} />
    <RejB cx={NB.rej_s3_d[0]}   cy={NB.rej_s3_d[1]}   />
    <RejB cx={NB.rej_s3_1_d[0]} cy={NB.rej_s3_1_d[1]} />
    <RejB cx={NB.rej_s3_0_x[0]} cy={NB.rej_s3_0_x[1]} />
    <RejB cx={NB.rej_s3_10_x[0]}cy={NB.rej_s3_10_x[1]}/>
    <RejB cx={NB.rej_s3_11_x[0]}cy={NB.rej_s3_11_x[1]}/>
    <RejB cx={NB.rej_s4_d[0]}   cy={NB.rej_s4_d[1]}   />
    <RejB cx={NB.rej_s5_d[0]}   cy={NB.rej_s5_d[1]}   />
    <RejB cx={NB.rej_s5_1_x[0]} cy={NB.rej_s5_1_x[1]} />
    <RejB cx={NB.rej_s5_0_x[0]} cy={NB.rej_s5_0_x[1]} />
    <RejB cx={NB.rej_s5_11_x[0]}cy={NB.rej_s5_11_x[1]}/>

    <DmdB cx={NB.s1[0]}      cy={NB.s1[1]}      line1="READ 1" line2="S1" />
    <DmdB cx={NB.s1b1[0]}    cy={NB.s1b1[1]}    line1="READ 2" line2="1b" />
    <DmdB cx={NB.s1b0[0]}    cy={NB.s1b0[1]}    line1="READ 3" line2="0b" />
    <DmdB cx={NB.loop[0]}    cy={NB.loop[1]}    line1="LOOP" line2="1+0" loop />
    <DmdB cx={NB.s3br[0]}    cy={NB.s3br[1]}    line1="READ 4" line2="S3" />
    <DmdB cx={NB.s3_1[0]}    cy={NB.s3_1[1]}    line1="READ 5" line2="3a" />
    <DmdB cx={NB.s3_0[0]}    cy={NB.s3_0[1]}    line1="READ 6" line2="3b" />
    <DmdB cx={NB.s3_10[0]}   cy={NB.s3_10[1]}   line1="READ 7" line2="3c" />
    <DmdB cx={NB.s3_11[0]}   cy={NB.s3_11[1]}   line1="READ 8" line2="3d" />
    <DmdB cx={NB.s4br[0]}    cy={NB.s4br[1]}    line1="READ 9" line2="S4" />
    <DmdB cx={NB.s4_1loop[0]}cy={NB.s4_1loop[1]}line1="LOOP" line2="1*" loop />
    <DmdB cx={NB.s4_0loop[0]}cy={NB.s4_0loop[1]}line1="LOOP" line2="0*" loop />
    <DmdB cx={NB.s5br[0]}    cy={NB.s5br[1]}    line1="READ 10" line2="S5" />
    <DmdB cx={NB.s5_1[0]}    cy={NB.s5_1[1]}    line1="READ 11" line2="5a" />
    <DmdB cx={NB.s5_0[0]}    cy={NB.s5_0[1]}    line1="READ 12" line2="5b" />
    <DmdB cx={NB.s5_11[0]}   cy={NB.s5_11[1]}   line1="READ 13" line2="5c" />
    <DmdB cx={NB.racc[0]}    cy={NB.racc[1]}    line1="R.ACC" />

    <text x={VW2 / 2} y={VH2 - 12} textAnchor="middle"
      fontSize={10} fill={T2.dimLabel} letterSpacing={0.3}>
      Pushdown Automaton · (11+00)(1+0)* (101+111+01)(00*+11*)(1+0+11)
    </text>
  </svg>
);

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
      fitViewOptions={{ padding: 0.05 }}
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
