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
//  VALIDATION  (identical to original)
// ─────────────────────────────────────────────────────────────

function validatePDA(input: string, regex: RegexChoice): boolean {
  if (regex === "regex1") {
    return /^(a|b)(a|b)*(aa|bb)(ab|ba)(a|b)*(aba|baa)$/.test(input);
  } else {
    return /^(11|00)(1|0)*(101|111|01)(0+|1+)(1|0|11)$/.test(input);
  }
}

// ─────────────────────────────────────────────────────────────
//  SHARED SVG HELPERS  (identical to original)
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
}> = ({ cx, cy, rx = 34, ry = 16, label, fill, stroke, textFill }) => (
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
//  ALPHABET SVG  (regex1) — (a+b)(a+b)*(aa+bb)(ab+ba)(a+b)*(aba+baa)
// ─────────────────────────────────────────────────────────────

const T1 = {
  bg:           "#0d0d0d",
  diamondFill:  "#0f1f3d",
  diamondStroke:"#74DCFF",
  startFill:    "#3b1f6e",
  startStroke:  "#a855f7",
  acceptFill:   "#14532d",
  acceptStroke: "#22c55e",
  rejectFill:   "#450a0a",
  rejectStroke: "#ef4444",
  arrowGrey:    "#6b7280",
  arrowRed:     "#ef4444",
  arrowGreen:   "#22c55e",
  nodeText:     "#74DCFF",
  edgeLabel:    "#e5e7eb",
  dimLabel:     "#9ca3af",
};

const VW1 = 1380, VH1 = 660;
const DW1 = 44, DH1 = 28;
const OR1 = { rx: 34, ry: 16 };
const OS1 = { rx: 32, ry: 15 };

const NA = {
  start:    [68,  315] as [number,number],
  read1:    [178, 315] as [number,number],
  rejBelow1:[178, 490] as [number,number],
  read2:    [298, 315] as [number,number],
  rejLeft2: [248, 170] as [number,number],
  read3a:   [398, 195] as [number,number],
  read3b:   [398, 435] as [number,number],
  rejTop3a: [398,  75] as [number,number],
  rejBot3b: [398, 555] as [number,number],
  read4a:   [515, 195] as [number,number],
  read4b:   [515, 435] as [number,number],
  rejTop4a: [515,  75] as [number,number],
  rejBot4b: [515, 555] as [number,number],
  read5:    [628, 315] as [number,number],
  rejLeft5: [628, 170] as [number,number],
  read6a:   [755, 195] as [number,number],
  read6b:   [755, 435] as [number,number],
  rejTop6a: [755,  75] as [number,number],
  rejBot6b: [755, 555] as [number,number],
  read7a:   [880, 195] as [number,number],
  read7b:   [880, 435] as [number,number],
  rejTop7a: [880,  75] as [number,number],
  rejBot7b: [880, 555] as [number,number],
  racc:     [1010, 315] as [number,number],
  accept:   [1145, 315] as [number,number],
};

const DmdA: React.FC<{ cx: number; cy: number; top: string; bot?: string }> = ({ cx, cy, top, bot }) => {
  const pts = `${cx},${cy - DH1} ${cx + DW1},${cy} ${cx},${cy + DH1} ${cx - DW1},${cy}`;
  return (
    <g>
      <polygon points={pts} fill={T1.diamondFill} stroke={T1.diamondStroke} strokeWidth={1.8} />
      <text x={cx} y={bot ? cy - 5 : cy} textAnchor="middle" dominantBaseline="central"
        fontSize={9} fontWeight={700} fill={T1.nodeText}>{top}</text>
      {bot && (
        <text x={cx} y={cy + 7} textAnchor="middle" dominantBaseline="central"
          fontSize={8} fill={T1.nodeText}>{bot}</text>
      )}
    </g>
  );
};

const RejectA: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <Ovl cx={cx} cy={cy} rx={OS1.rx} ry={OS1.ry} label="REJECT"
    fill={T1.rejectFill} stroke={T1.rejectStroke} textFill="#f87171" />
);

const AlphabetSVG: React.FC = () => (
  <svg viewBox={`0 0 ${VW1} ${VH1}`} width={VW1} height={VH1}
    xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <defs>
      <Marker id="a_mg" color={T1.arrowGrey} />
      <Marker id="a_mr" color={T1.arrowRed}  />
      <Marker id="a_mc" color="#22c55e"       />
    </defs>

    {/* START → READ₁ */}
    <Arrow pts={[[NA.start[0]+34, NA.start[1]], [NA.read1[0]-DW1, NA.read1[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={124} y={305} text="a, b" />

    {/* READ₁ → READ₂ */}
    <Arrow pts={[[NA.read1[0]+DW1, NA.read1[1]], [NA.read2[0]-DW1, NA.read2[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={238} y={303} text="a, b" />

    {/* READ₁ → REJECT-below (Δ) */}
    <Arrow pts={[[NA.read1[0], NA.read1[1]+DH1], [NA.rejBelow1[0], NA.rejBelow1[1]-OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={166} y={405} text="Δ" red />

    {/* READ₂ → REJECT-left (Δ) */}
    <Arrow pts={[[NA.read2[0]-18, NA.read2[1]-DH1], [NA.rejLeft2[0]+OS1.rx, NA.rejLeft2[1]]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={271} y={237} text="Δ" red />

    {/* READ₂ → READ 3a (a) */}
    <Arrow pts={[[NA.read2[0]+20, NA.read2[1]-DH1], [NA.read3a[0]-DW1, NA.read3a[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={341} y={242} text="a" />

    {/* READ₂ → READ 3b (b) */}
    <Arrow pts={[[NA.read2[0]+20, NA.read2[1]+DH1], [NA.read3b[0]-DW1, NA.read3b[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={341} y={388} text="b" />

    {/* READ 3a → REJECT top (Δ) */}
    <Arrow pts={[[NA.read3a[0], NA.read3a[1]-DH1], [NA.rejTop3a[0], NA.rejTop3a[1]+OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={386} y={133} text="Δ" red />

    {/* READ 3a → READ 4a (a) */}
    <Arrow pts={[[NA.read3a[0]+DW1, NA.read3a[1]], [NA.read4a[0]-DW1, NA.read4a[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={456} y={183} text="a" />

    {/* READ 3b → REJECT bot (Δ) */}
    <Arrow pts={[[NA.read3b[0], NA.read3b[1]+DH1], [NA.rejBot3b[0], NA.rejBot3b[1]-OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={386} y={497} text="Δ" red />

    {/* READ 3b → READ 4b (b) */}
    <Arrow pts={[[NA.read3b[0]+DW1, NA.read3b[1]], [NA.read4b[0]-DW1, NA.read4b[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={456} y={447} text="b" />

    {/* READ 4a → REJECT top (Δ) */}
    <Arrow pts={[[NA.read4a[0], NA.read4a[1]-DH1], [NA.rejTop4a[0], NA.rejTop4a[1]+OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={503} y={133} text="Δ" red />

    {/* READ 4a → READ₅ (b) */}
    <Arrow pts={[[NA.read4a[0]+DW1, NA.read4a[1]], [NA.read5[0]-12, NA.read5[1]-DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={584} y={238} text="b" />

    {/* READ 4b → REJECT bot (Δ) */}
    <Arrow pts={[[NA.read4b[0], NA.read4b[1]+DH1], [NA.rejBot4b[0], NA.rejBot4b[1]-OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={503} y={497} text="Δ" red />

    {/* READ 4b → READ₅ (a) */}
    <Arrow pts={[[NA.read4b[0]+DW1, NA.read4b[1]], [NA.read5[0]-12, NA.read5[1]+DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={584} y={392} text="a" />

    {/* READ₅ → REJECT-left (Δ) */}
    <Arrow pts={[[NA.read5[0]-18, NA.read5[1]-DH1], [NA.rejLeft5[0], NA.rejLeft5[1]+OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={616} y={237} text="Δ" red />

    {/* READ₅ → READ 6a (a) */}
    <Arrow pts={[[NA.read5[0]+20, NA.read5[1]-DH1], [NA.read6a[0]-DW1, NA.read6a[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={694} y={242} text="a" />

    {/* READ₅ → READ 6b (b) */}
    <Arrow pts={[[NA.read5[0]+20, NA.read5[1]+DH1], [NA.read6b[0]-DW1, NA.read6b[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={694} y={388} text="b" />

    {/* READ 6a → REJECT top (Δ) */}
    <Arrow pts={[[NA.read6a[0], NA.read6a[1]-DH1], [NA.rejTop6a[0], NA.rejTop6a[1]+OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={743} y={133} text="Δ" red />

    {/* READ 6a left-exit → rejLeft5 ('a' wrong turn) */}
    <Arrow pts={[[NA.read6a[0]-DW1, NA.read6a[1]], [NA.rejLeft5[0]+OS1.rx, NA.rejLeft5[1]]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={695} y={197} text="a" red />

    {/* READ 6a → READ 7a (b) */}
    <Arrow pts={[[NA.read6a[0]+DW1, NA.read6a[1]], [NA.read7a[0]-DW1, NA.read7a[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={817} y={183} text="b" />

    {/* READ 6b → REJECT bot (Δ) */}
    <Arrow pts={[[NA.read6b[0], NA.read6b[1]+DH1], [NA.rejBot6b[0], NA.rejBot6b[1]-OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={743} y={497} text="Δ" red />

    {/* READ 6b → READ 7b (b) */}
    <Arrow pts={[[NA.read6b[0]+DW1, NA.read6b[1]], [NA.read7b[0]-DW1, NA.read7b[1]]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={817} y={447} text="b" />

    {/* READ 7a → REJECT top (Δ) */}
    <Arrow pts={[[NA.read7a[0], NA.read7a[1]-DH1], [NA.rejTop7a[0], NA.rejTop7a[1]+OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={868} y={133} text="Δ" red />

    {/* READ 7a → R.ACC (a) */}
    <Arrow pts={[[NA.read7a[0]+DW1, NA.read7a[1]], [NA.racc[0]-12, NA.racc[1]-DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={953} y={238} text="a" />

    {/* READ 7b → REJECT bot (Δ) */}
    <Arrow pts={[[NA.read7b[0], NA.read7b[1]+DH1], [NA.rejBot7b[0], NA.rejBot7b[1]-OS1.ry]]} marker="a_mr" color={T1.arrowRed} />
    <EL x={868} y={497} text="Δ" red />

    {/* READ 7b → R.ACC (a) */}
    <Arrow pts={[[NA.read7b[0]+DW1, NA.read7b[1]], [NA.racc[0]-12, NA.racc[1]+DH1]]} marker="a_mg" color={T1.arrowGrey} />
    <EL x={953} y={392} text="a" />

    {/* R.ACC → ACCEPT (Δ) */}
    <Arrow pts={[[NA.racc[0]+DW1, NA.racc[1]], [NA.accept[0]-OR1.rx, NA.accept[1]]]} marker="a_mc" color="#22c55e" />
    <EL x={1077} y={303} text="Δ" />

    {/* ── NODES ── */}
    <Ovl cx={NA.start[0]} cy={NA.start[1]} label="START"
      fill={T1.startFill} stroke={T1.startStroke} textFill="#c084fc" />
    <Ovl cx={NA.accept[0]} cy={NA.accept[1]} rx={40} ry={18} label="ACCEPT"
      fill={T1.acceptFill} stroke={T1.acceptStroke} textFill="#4ade80" />

    <RejectA cx={NA.rejBelow1[0]} cy={NA.rejBelow1[1]} />
    <RejectA cx={NA.rejLeft2[0]}  cy={NA.rejLeft2[1]}  />
    <RejectA cx={NA.rejTop3a[0]}  cy={NA.rejTop3a[1]}  />
    <RejectA cx={NA.rejBot3b[0]}  cy={NA.rejBot3b[1]}  />
    <RejectA cx={NA.rejTop4a[0]}  cy={NA.rejTop4a[1]}  />
    <RejectA cx={NA.rejBot4b[0]}  cy={NA.rejBot4b[1]}  />
    <RejectA cx={NA.rejLeft5[0]}  cy={NA.rejLeft5[1]}  />
    <RejectA cx={NA.rejTop6a[0]}  cy={NA.rejTop6a[1]}  />
    <RejectA cx={NA.rejBot6b[0]}  cy={NA.rejBot6b[1]}  />
    <RejectA cx={NA.rejTop7a[0]}  cy={NA.rejTop7a[1]}  />
    <RejectA cx={NA.rejBot7b[0]}  cy={NA.rejBot7b[1]}  />

    <DmdA cx={NA.read1[0]}  cy={NA.read1[1]}  top="READ" bot="₁" />
    <DmdA cx={NA.read2[0]}  cy={NA.read2[1]}  top="READ" bot="₂" />
    <DmdA cx={NA.read3a[0]} cy={NA.read3a[1]} top="READ 3a" />
    <DmdA cx={NA.read3b[0]} cy={NA.read3b[1]} top="READ 3b" />
    <DmdA cx={NA.read4a[0]} cy={NA.read4a[1]} top="READ 4a" />
    <DmdA cx={NA.read4b[0]} cy={NA.read4b[1]} top="READ 4b" />
    <DmdA cx={NA.read5[0]}  cy={NA.read5[1]}  top="READ" bot="₅" />
    <DmdA cx={NA.read6a[0]} cy={NA.read6a[1]} top="READ 6a" />
    <DmdA cx={NA.read6b[0]} cy={NA.read6b[1]} top="READ 6b" />
    <DmdA cx={NA.read7a[0]} cy={NA.read7a[1]} top="READ 7a" />
    <DmdA cx={NA.read7b[0]} cy={NA.read7b[1]} top="READ 7b" />
    <DmdA cx={NA.racc[0]}   cy={NA.racc[1]}   top="R.ACC" />

    <text x={VW1 / 2} y={VH1 - 14} textAnchor="middle"
      fontSize={10} fill={T1.dimLabel} letterSpacing={0.3}>
      Pushdown Automaton · (a+b)(a+b)* (aa+bb)(ab+ba)(a+b)* (aba+baa)
    </text>
  </svg>
);

// ─────────────────────────────────────────────────────────────
//  BINARY SVG  (regex2) — (11+00)(1+0)*(101+111+01)(00*+11*)(1+0+11)
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
const DW2 = 42, DH2 = 27;
const OR2 = { rx: 36, ry: 17 };
const SR2 = { rx: 32, ry: 15 };

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
  const r = 18;
  const x1 = cx - DW2 * 0.6, y1 = cy - DH2 * 0.5;
  const x2 = cx + DW2 * 0.6, y2 = y1;
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

    {/* S1 → S1b1 ('1') */}
    <Arrow pts={[[NB.s1[0]+10, NB.s1[1]-DH2], [NB.s1b1[0]-DW2, NB.s1b1[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={225} y={272} text="1" />

    {/* S1 → S1b0 ('0') */}
    <Arrow pts={[[NB.s1[0]+10, NB.s1[1]+DH2], [NB.s1b0[0]-DW2, NB.s1b0[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={225} y={468} text="0" />

    {/* S1 → REJ_S1_d (Δ) */}
    <Arrow pts={[[NB.s1[0], NB.s1[1]+DH2], [NB.rej_s1_d[0], NB.rej_s1_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={158} y={452} text="Δ" red />

    {/* S1b1 → LOOP ('1' = got "11") */}
    <Arrow pts={[[NB.s1b1[0]+DW2, NB.s1b1[1]], [NB.loop[0]-DW2, NB.loop[1]]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={363} y={268} text="1" cyan />

    {/* S1b1 → REJ_S1b1_0 ('0') */}
    <Arrow pts={[[NB.s1b1[0]-10, NB.s1b1[1]-DH2], [NB.rej_s1b1_0[0]+SR2.rx, NB.rej_s1b1_0[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={248} y={125} text="0" red />

    {/* S1b1 → REJ_S1b1_d (Δ) */}
    <Arrow pts={[[NB.s1b1[0]+10, NB.s1b1[1]-DH2], [NB.rej_s1b1_d[0]-SR2.rx, NB.rej_s1b1_d[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={320} y={125} text="Δ" red />

    {/* S1b0 → LOOP ('0' = got "00") */}
    <Arrow pts={[[NB.s1b0[0]+DW2, NB.s1b0[1]], [NB.loop[0]-DW2, NB.loop[1]]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={363} y={472} text="0" cyan />

    {/* S1b0 → REJ_S1b0_1 ('1') */}
    <Arrow pts={[[NB.s1b0[0]-10, NB.s1b0[1]+DH2], [NB.rej_s1b0_1[0]+SR2.rx, NB.rej_s1b0_1[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={248} y={615} text="1" red />

    {/* S1b0 → REJ_S1b0_d (Δ) */}
    <Arrow pts={[[NB.s1b0[0]+10, NB.s1b0[1]+DH2], [NB.rej_s1b0_d[0]-SR2.rx, NB.rej_s1b0_d[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={320} y={615} text="Δ" red />

    {/* LOOP self-loop */}
    <SelfLoop cx={NB.loop[0]} cy={NB.loop[1]} color={T2.loopStroke} markerId="b_mg" />
    <EL x={435} y={323} text="1, 0" green />

    {/* LOOP → S3_BRANCH (Δ) */}
    <Arrow pts={[[NB.loop[0]+DW2, NB.loop[1]], [NB.s3br[0]-DW2, NB.s3br[1]]]} marker="b_mg" color={T2.arrowGrey} dashed />
    <EL x={497} y={358} text="Δ" />

    {/* S3_BRANCH → S3_1 ('1') */}
    <Arrow pts={[[NB.s3br[0]+15, NB.s3br[1]-DH2], [NB.s3_1[0]-DW2, NB.s3_1[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={611} y={270} text="1" />

    {/* S3_BRANCH → S3_0 ('0') */}
    <Arrow pts={[[NB.s3br[0]+15, NB.s3br[1]+DH2], [NB.s3_0[0]-DW2, NB.s3_0[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={611} y={470} text="0" />

    {/* S3_BRANCH → REJ_S3_d (Δ) */}
    <Arrow pts={[[NB.s3br[0], NB.s3br[1]+DH2], [NB.rej_s3_d[0], NB.rej_s3_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={548} y={452} text="Δ" red />

    {/* S3_1 → S3_10 ('0') */}
    <Arrow pts={[[NB.s3_1[0]+DW2, NB.s3_1[1]], [NB.s3_10[0]-DW2, NB.s3_10[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={727} y={205} text="0" />

    {/* S3_1 → S3_11 ('1') */}
    <Arrow pts={[[NB.s3_1[0]+10, NB.s3_1[1]-DH2], [NB.s3_11[0]-DW2, NB.s3_11[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={722} y={162} text="1" />

    {/* S3_1 → REJ_S3_1_d (Δ) */}
    <Arrow pts={[[NB.s3_1[0]-10, NB.s3_1[1]-DH2], [NB.rej_s3_1_d[0]+SR2.rx, NB.rej_s3_1_d[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={656} y={125} text="Δ" red />

    {/* S3_0 → S4_BRANCH ('1' = "01") */}
    <Arrow pts={[[NB.s3_0[0]+DW2, NB.s3_0[1]], [NB.s4br[0]+10, NB.s4br[1]+DH2]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={798} y={486} text="1" cyan />

    {/* S3_0 → REJ_S3_0_x (0, Δ) */}
    <Arrow pts={[[NB.s3_0[0]+10, NB.s3_0[1]+DH2], [NB.rej_s3_0_x[0]-SR2.rx, NB.rej_s3_0_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={705} y={615} text="0, Δ" red />

    {/* S3_10 → S4_BRANCH ('1' = "101") */}
    <Arrow pts={[[NB.s3_10[0]+DW2, NB.s3_10[1]], [NB.s4br[0]-10, NB.s4br[1]-DH2]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={854} y={284} text="1" cyan />

    {/* S3_10 → REJ_S3_10_x */}
    <Arrow pts={[[NB.s3_10[0]+DW2, NB.s3_10[1]], [NB.rej_s3_10_x[0]-SR2.rx, NB.rej_s3_10_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={880} y={180} text="0, Δ" red />

    {/* S3_11 → S4_BRANCH ('1' = "111") */}
    <Arrow pts={[[NB.s3_11[0]+DW2, NB.s3_11[1]], [NB.s4br[0], NB.s4br[1]-DH2-10]]} marker="b_mcy" color={T2.arrowCyan} />
    <EL x={854} y={222} text="1" cyan />

    {/* S3_11 → REJ_S3_11_x */}
    <Arrow pts={[[NB.s3_11[0]+DW2, NB.s3_11[1]], [NB.rej_s3_11_x[0]-SR2.rx, NB.rej_s3_11_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={880} y={100} text="0, Δ" red />

    {/* S4_BRANCH → S4_1loop ('1') */}
    <Arrow pts={[[NB.s4br[0]+15, NB.s4br[1]-DH2], [NB.s4_1loop[0]-DW2, NB.s4_1loop[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={975} y={268} text="1" />

    {/* S4_BRANCH → S4_0loop ('0') */}
    <Arrow pts={[[NB.s4br[0]+15, NB.s4br[1]+DH2], [NB.s4_0loop[0]-DW2, NB.s4_0loop[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={975} y={472} text="0" />

    {/* S4_BRANCH → REJ_S4_d (Δ) */}
    <Arrow pts={[[NB.s4br[0], NB.s4br[1]+DH2], [NB.rej_s4_d[0], NB.rej_s4_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={908} y={452} text="Δ" red />

    {/* S4_1loop self-loop */}
    <SelfLoop cx={NB.s4_1loop[0]} cy={NB.s4_1loop[1]} color={T2.loopStroke} markerId="b_mg" />
    <EL x={1035} y={148} text="1" green />

    {/* S4_1loop → S5_BRANCH (Δ) */}
    <Arrow pts={[[NB.s4_1loop[0]+DW2, NB.s4_1loop[1]], [NB.s5br[0]-10, NB.s5br[1]-DH2]]} marker="b_mg" color={T2.arrowGrey} dashed />
    <EL x={1097} y={268} text="Δ" />

    {/* S4_0loop self-loop */}
    <SelfLoop cx={NB.s4_0loop[0]} cy={NB.s4_0loop[1]} color={T2.loopStroke} markerId="b_mg" />
    <EL x={1035} y={592} text="0" green />

    {/* S4_0loop → S5_BRANCH (Δ) */}
    <Arrow pts={[[NB.s4_0loop[0]+DW2, NB.s4_0loop[1]], [NB.s5br[0]-10, NB.s5br[1]+DH2]]} marker="b_mg" color={T2.arrowGrey} dashed />
    <EL x={1097} y={472} text="Δ" />

    {/* S5_BRANCH → S5_1 ('1') */}
    <Arrow pts={[[NB.s5br[0]+15, NB.s5br[1]-DH2], [NB.s5_1[0]-DW2, NB.s5_1[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={1213} y={268} text="1" />

    {/* S5_BRANCH → S5_0 ('0') */}
    <Arrow pts={[[NB.s5br[0]+15, NB.s5br[1]+DH2], [NB.s5_0[0]-DW2, NB.s5_0[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={1213} y={472} text="0" />

    {/* S5_BRANCH → REJ_S5_d (Δ) */}
    <Arrow pts={[[NB.s5br[0], NB.s5br[1]+DH2], [NB.rej_s5_d[0], NB.rej_s5_d[1]-SR2.ry]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1148} y={452} text="Δ" red />

    {/* S5_1 → R.ACC (Δ = just "1") */}
    <Arrow pts={[[NB.s5_1[0]+DW2, NB.s5_1[1]], [NB.racc[0]-10, NB.racc[1]-DH2]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1367} y={268} text="Δ" green />

    {/* S5_1 → S5_11 ('1') */}
    <Arrow pts={[[NB.s5_1[0]+10, NB.s5_1[1]-DH2], [NB.s5_11[0]-DW2, NB.s5_11[1]]]} marker="b_mg" color={T2.arrowGrey} />
    <EL x={1330} y={162} text="1" />

    {/* S5_1 → REJ_S5_1_x ('0') */}
    <Arrow pts={[[NB.s5_1[0]-10, NB.s5_1[1]-DH2], [NB.rej_s5_1_x[0]+SR2.rx, NB.rej_s5_1_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1255} y={125} text="0" red />

    {/* S5_0 → R.ACC (Δ = just "0") */}
    <Arrow pts={[[NB.s5_0[0]+DW2, NB.s5_0[1]], [NB.racc[0]-10, NB.racc[1]+DH2]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1367} y={472} text="Δ" green />

    {/* S5_0 → REJ_S5_0_x */}
    <Arrow pts={[[NB.s5_0[0]+10, NB.s5_0[1]+DH2], [NB.rej_s5_0_x[0]-SR2.rx, NB.rej_s5_0_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1278} y={615} text="1, 0" red />

    {/* S5_11 → R.ACC (Δ = "11") */}
    <Arrow pts={[[NB.s5_11[0]+DW2, NB.s5_11[1]], [NB.racc[0]-10, NB.racc[1]-DH2-10]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1428} y={260} text="Δ" green />

    {/* S5_11 → REJ_S5_11_x */}
    <Arrow pts={[[NB.s5_11[0]+DW2, NB.s5_11[1]], [NB.rej_s5_11_x[0]-SR2.rx, NB.rej_s5_11_x[1]]]} marker="b_mr" color={T2.arrowRed} />
    <EL x={1392} y={100} text="1, 0" red />

    {/* R.ACC → ACCEPT (Δ) */}
    <Arrow pts={[[NB.racc[0]+DW2, NB.racc[1]], [NB.accept[0]-OR2.rx, NB.accept[1]]]} marker="b_mc" color={T2.arrowGreen} />
    <EL x={1522} y={358} text="Δ" green />

    {/* ── NODES ── */}
    <Ovl cx={NB.start[0]}  cy={NB.start[1]}  label="START"  fill={T2.startFill}  stroke={T2.startStroke}  textFill="#c084fc" />
    <Ovl cx={NB.accept[0]} cy={NB.accept[1]} rx={40} ry={18} label="ACCEPT" fill={T2.acceptFill} stroke={T2.acceptStroke} textFill="#4ade80" />

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

    <DmdB cx={NB.s1[0]}      cy={NB.s1[1]}      line1="READ" line2="S1" />
    <DmdB cx={NB.s1b1[0]}    cy={NB.s1b1[1]}    line1="READ" line2="1b" />
    <DmdB cx={NB.s1b0[0]}    cy={NB.s1b0[1]}    line1="READ" line2="0b" />
    <DmdB cx={NB.loop[0]}    cy={NB.loop[1]}    line1="LOOP" line2="1+0" loop />
    <DmdB cx={NB.s3br[0]}    cy={NB.s3br[1]}    line1="READ" line2="S3" />
    <DmdB cx={NB.s3_1[0]}    cy={NB.s3_1[1]}    line1="READ" line2="3a" />
    <DmdB cx={NB.s3_0[0]}    cy={NB.s3_0[1]}    line1="READ" line2="3b" />
    <DmdB cx={NB.s3_10[0]}   cy={NB.s3_10[1]}   line1="READ" line2="3c" />
    <DmdB cx={NB.s3_11[0]}   cy={NB.s3_11[1]}   line1="READ" line2="3d" />
    <DmdB cx={NB.s4br[0]}    cy={NB.s4br[1]}    line1="READ" line2="S4" />
    <DmdB cx={NB.s4_1loop[0]}cy={NB.s4_1loop[1]}line1="LOOP" line2="1*" loop />
    <DmdB cx={NB.s4_0loop[0]}cy={NB.s4_0loop[1]}line1="LOOP" line2="0*" loop />
    <DmdB cx={NB.s5br[0]}    cy={NB.s5br[1]}    line1="READ" line2="S5" />
    <DmdB cx={NB.s5_1[0]}    cy={NB.s5_1[1]}    line1="READ" line2="5a" />
    <DmdB cx={NB.s5_0[0]}    cy={NB.s5_0[1]}    line1="READ" line2="5b" />
    <DmdB cx={NB.s5_11[0]}   cy={NB.s5_11[1]}   line1="READ" line2="5c" />
    <DmdB cx={NB.racc[0]}    cy={NB.racc[1]}    line1="R.ACC" />

    <text x={VW2 / 2} y={VH2 - 12} textAnchor="middle"
      fontSize={10} fill={T2.dimLabel} letterSpacing={0.3}>
      Pushdown Automaton · (11+00)(1+0)* (101+111+01)(00*+11*)(1+0+11)
    </text>
  </svg>
);

// ─────────────────────────────────────────────────────────────
//  SVG NODE — wraps the entire original SVG as one React Flow node
//  React Flow gives us pan/zoom/controls for free.
//  The diagram itself is untouched.
// ─────────────────────────────────────────────────────────────

interface SvgNodeData {
  svgComponent: React.FC;
  [key: string]: unknown;
}

const SvgNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as SvgNodeData;
  const Svg = d.svgComponent;
  return (
    // No handles needed — this is a display-only, non-connectable node
    <div style={{ lineHeight: 0 }}>
      <Svg />
    </div>
  );
};

const nodeTypes = { svgDiagram: SvgNode };

// ─────────────────────────────────────────────────────────────
//  BUILD REACT FLOW NODES from the two SVGs
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
//  INNER FLOW  (child of ReactFlowProvider so useReactFlow works)
// ─────────────────────────────────────────────────────────────

interface PDAFlowProps {
  selectedRegex: RegexChoice;
}

const PDAFlow: React.FC<PDAFlowProps> = ({ selectedRegex }) => {
  const initialNodes = selectedRegex === "regex1" ? alphabetFlowNodes : binaryFlowNodes;

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Swap diagram when regex changes
  useEffect(() => {
    setNodes(selectedRegex === "regex1" ? alphabetFlowNodes : binaryFlowNodes);
  }, [selectedRegex, setNodes]);

  // Fit on regex change
  useEffect(() => {
    const t = setTimeout(() => fitView({ duration: 400, padding: 0.05 }), 60);
    return () => clearTimeout(t);
  }, [selectedRegex, fitView]);

  // Fit on resize
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
//  MAIN EXPORT  — drop-in replacement, same props as original
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
