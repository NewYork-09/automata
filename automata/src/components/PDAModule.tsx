import React, { useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

type RegexChoice = "regex1" | "regex2";

interface PDANodeData {
  label: string;
  nodeType: "start" | "read" | "accept" | "reject";
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────
//  CUSTOM NODE SHAPES
//  oval    = START / ACCEPT / REJECT
//  diamond = READ (all branching states)
// ─────────────────────────────────────────────────────────────

// Each node gets one handle per cardinal direction (top/bottom/left/right).
// We keep it simple — one handle per side — so edge sourceHandle/targetHandle
// IDs are always predictable and never missing.
const Handles = () => (
  <>
    <Handle type="source" position={Position.Top}    id="s-top"    style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Top}    id="t-top"    style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} id="s-bot"    style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Bottom} id="t-bot"    style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Left}   id="s-left"   style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left}   id="t-left"   style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right}  id="s-right"  style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Right}  id="t-right"  style={{ opacity: 0 }} />
  </>
);

const OvalNode: React.FC<{ data: PDANodeData }> = ({ data }) => {
  const { nodeType, label } = data;
  const isAccept = nodeType === "accept";
  const isReject = nodeType === "reject";
  const isStart  = nodeType === "start";
  const bg     = isAccept ? "#052e16" : isReject ? "#3b0000" : isStart ? "#1e1a35" : "#2a2a2a";
  const border = isAccept ? "#4ade80" : isReject ? "#f87171" : isStart ? "#a78bfa" : "#acacac";
  const color  = isAccept ? "#4ade80" : isReject ? "#f87171" : isStart ? "#a78bfa" : "#ffffff";
  return (
    <div style={{
      position: "relative", width: 84, height: 38, borderRadius: 19,
      background: bg, border: `2px solid ${border}`, color,
      fontFamily: "monospace", fontWeight: 700, fontSize: 11,
      display: "flex", alignItems: "center", justifyContent: "center",
      userSelect: "none",
    }}>
      {label}
      <Handles />
    </div>
  );
};

const DiamondNode: React.FC<{ data: PDANodeData }> = ({ data }) => {
  const { label } = data;
  return (
    <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", width: 58, height: 58,
        background: "#0c1a2e", border: "2px solid #74DCFF",
        transform: "rotate(45deg)",
      }} />
      <div style={{
        position: "relative", zIndex: 2, color: "#74DCFF",
        fontFamily: "monospace", fontWeight: 700,
        fontSize: 9, textAlign: "center", lineHeight: 1.2, userSelect: "none",
      }}>
        {label}
      </div>
      <Handles />
    </div>
  );
};

const nodeTypes = { oval: OvalNode, diamond: DiamondNode };

// ─────────────────────────────────────────────────────────────
//  BUILDER HELPERS
// ─────────────────────────────────────────────────────────────

function N(id: string, x: number, y: number, label: string, nodeType: PDANodeData["nodeType"]): Node {
  return {
    id, type: nodeType === "read" ? "diamond" : "oval",
    position: { x, y },
    data: { label, nodeType },
  };
}

// sh / th = "s-top" | "s-bot" | "s-left" | "s-right" | "t-top" | "t-bot" | "t-left" | "t-right"
function E(
  id: string, source: string, target: string, label: string,
  sh: string, th: string,
  curved = false,
): Edge {
  return {
    id, source, target, label,
    sourceHandle: sh, targetHandle: th,
    type: curved ? "smoothstep" : "straight",
    animated: false,
    labelStyle: { fill: "#e2e8f0", fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: "#1a1a1a", fillOpacity: 0.92 },
    labelBgPadding: [3, 5] as [number, number],
    labelBgBorderRadius: 3,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#6b7280" },
    style: { strokeWidth: 2.5, stroke: "#57565699" },
  };
}

// ─────────────────────────────────────────────────────────────
//  PDA — Regex 1 (a/b)
//  Language: (a+b)(a+b)*(aa+bb)(ab+ba)(a+b)*(aba+baa)
//
//  State machine (from spec):
//  START → READ1
//  READ1:  a/b → READ2,  Δ → REJECT
//  READ2:  a → READ3A,   b → READ3B,  Δ → REJECT
//  READ3A: a → READ4A,   b → READ2,   Δ → REJECT
//  READ3B: b → READ4B,   a → READ2,   Δ → REJECT
//  READ4A: b → READ5,    a → READ2,   Δ → REJECT
//  READ4B: a → READ5,    b → READ2,   Δ → REJECT
//  READ5:  a → READ6A,   b → READ6B,  Δ → REJECT
//  READ6A: a → READ6A,   b → READ7A,  Δ → REJECT
//  READ6B: b → READ6B,   a → READ7B,  Δ → REJECT
//  READ7A: a → RACC,     b → READ6B,  Δ → REJECT
//  READ7B: a → RACC,     b → READ6B,  Δ → REJECT
//  RACC:   Δ → ACCEPT,   a → READ6A,  b → READ6B
//
//  Layout strategy: columns spaced 200px apart, rows spaced 130px.
//  Each READ state is centred at a column/row intersection.
//  REJECT nodes float above or below their parent.
// ─────────────────────────────────────────────────────────────

// Column x-positions
const C1=80, C2=280, C3A=460, C3B=460, C4A=640, C4B=640, C5=820, C6A=1000, C6B=1000, C7A=1180, C7B=1180, C8=1360, C9=1540;
// Row y-positions (upper track = y≈60, lower track = y≈190)
const RU=60, RL=190, RM=125;

export const PdaAbNodes: Node[] = [
  N("start",  C1-10, RM-125, "START",   "start"),
  N("r1",     C1-10, RM,     "READ₁",   "read"),
  N("rej_r1", C1-10, RM+130, "REJECT",  "reject"),

  N("r2",     C2,    RM,     "READ₂",   "read"),
  N("rej_r2", C2,    RM-100, "REJECT",  "reject"),

  N("r3a",    C3A,   RU,     "READ 3a", "read"),
  N("r3b",    C3B,   RL,     "READ 3b", "read"),
  N("rej_r3a",C3A,   RU-100, "REJECT",  "reject"),
  N("rej_r3b",C3B,   RL+100, "REJECT",  "reject"),

  N("r4a",    C4A,   RU,     "READ 4a", "read"),
  N("r4b",    C4B,   RL,     "READ 4b", "read"),
  N("rej_r4a",C4A,   RU-100, "REJECT",  "reject"),
  N("rej_r4b",C4B,   RL+100, "REJECT",  "reject"),

  N("r5",     C5,    RM,     "READ₅",   "read"),
  N("rej_r5", C5,    RM-100, "REJECT",  "reject"),

  N("r6a",    C6A,   RU,     "READ 6a", "read"),
  N("r6b",    C6B,   RL,     "READ 6b", "read"),
  N("rej_r6a",C6A,   RU-100, "REJECT",  "reject"),
  N("rej_r6b",C6B,   RL+100, "REJECT",  "reject"),

  N("r7a",    C7A,   RU,     "READ 7a", "read"),
  N("r7b",    C7B,   RL,     "READ 7b", "read"),
  N("rej_r7a",C7A,   RU-100, "REJECT",  "reject"),
  N("rej_r7b",C7B,   RL+100, "REJECT",  "reject"),

  N("r_acc",  C8,    RM,     "R.ACC",   "read"),
  N("accept", C9,    RM,     "ACCEPT",  "accept"),
];

export const PdaAbEdges: Edge[] = [
  // START → READ1
  E("s-r1",       "start",  "r1",      "",    "s-bot",   "t-top"),

  // READ1: a/b → READ2,  Δ → REJECT
  E("r1-r2a",     "r1",     "r2",      "a",   "s-right", "t-left"),
  E("r1-r2b",     "r1",     "r2",      "b",   "s-right", "t-left"),
  E("r1-rej",     "r1",     "rej_r1",  "Δ",   "s-bot",   "t-top"),

  // READ2: a → READ3A,  b → READ3B,  Δ → REJECT
  E("r2-r3a",     "r2",     "r3a",     "a",   "s-right", "t-left"),
  E("r2-r3b",     "r2",     "r3b",     "b",   "s-right", "t-left"),
  E("r2-rej",     "r2",     "rej_r2",  "Δ",   "s-top",   "t-bot"),

  // READ3A: a → READ4A,  b → READ2 (back),  Δ → REJECT
  E("r3a-r4a",    "r3a",    "r4a",     "a",   "s-right", "t-left"),
  E("r3a-r2",     "r3a",    "r2",      "b",   "s-bot",   "t-bot",   true),
  E("r3a-rej",    "r3a",    "rej_r3a", "Δ",   "s-top",   "t-bot"),

  // READ3B: b → READ4B,  a → READ2 (back),  Δ → REJECT
  E("r3b-r4b",    "r3b",    "r4b",     "b",   "s-right", "t-left"),
  E("r3b-r2",     "r3b",    "r2",      "a",   "s-top",   "t-bot",   true),
  E("r3b-rej",    "r3b",    "rej_r3b", "Δ",   "s-bot",   "t-top"),

  // READ4A: b → READ5,  a → READ2 (back),  Δ → REJECT
  E("r4a-r5",     "r4a",    "r5",      "b",   "s-right", "t-left"),
  E("r4a-r2",     "r4a",    "r2",      "a",   "s-bot",   "t-top",   true),
  E("r4a-rej",    "r4a",    "rej_r4a", "Δ",   "s-top",   "t-bot"),

  // READ4B: a → READ5,  b → READ2 (back),  Δ → REJECT
  E("r4b-r5",     "r4b",    "r5",      "a",   "s-right", "t-left"),
  E("r4b-r2",     "r4b",    "r2",      "b",   "s-top",   "t-bot",   true),
  E("r4b-rej",    "r4b",    "rej_r4b", "Δ",   "s-bot",   "t-top"),

  // READ5: a → READ6A,  b → READ6B,  Δ → REJECT
  E("r5-r6a",     "r5",     "r6a",     "a",   "s-right", "t-left"),
  E("r5-r6b",     "r5",     "r6b",     "b",   "s-right", "t-left"),
  E("r5-rej",     "r5",     "rej_r5",  "Δ",   "s-top",   "t-bot"),

  // READ6A: a → READ6A (self),  b → READ7A,  Δ → REJECT
  E("r6a-self",   "r6a",    "r6a",     "a",   "s-top",   "t-left",  true),
  E("r6a-r7a",    "r6a",    "r7a",     "b",   "s-right", "t-left"),
  E("r6a-rej",    "r6a",    "rej_r6a", "Δ",   "s-top",   "t-bot"),

  // READ6B: b → READ6B (self),  a → READ7B,  Δ → REJECT
  E("r6b-self",   "r6b",    "r6b",     "b",   "s-bot",   "t-right", true),
  E("r6b-r7b",    "r6b",    "r7b",     "a",   "s-right", "t-left"),
  E("r6b-rej",    "r6b",    "rej_r6b", "Δ",   "s-bot",   "t-top"),

  // READ7A: a → RACC,  b → READ6B,  Δ → REJECT
  E("r7a-acc",    "r7a",    "r_acc",   "a",   "s-right", "t-top"),
  E("r7a-r6b",    "r7a",    "r6b",     "b",   "s-bot",   "t-right", true),
  E("r7a-rej",    "r7a",    "rej_r7a", "Δ",   "s-top",   "t-bot"),

  // READ7B: a → RACC,  b → READ6B,  Δ → REJECT
  E("r7b-acc",    "r7b",    "r_acc",   "a",   "s-right", "t-bot"),
  E("r7b-r6b",    "r7b",    "r6b",     "b",   "s-top",   "t-right", true),
  E("r7b-rej",    "r7b",    "rej_r7b", "Δ",   "s-bot",   "t-top"),

  // RACC: Δ → ACCEPT,  a → READ6A,  b → READ6B
  E("racc-acc",   "r_acc",  "accept",  "Δ",   "s-right", "t-left"),
  E("racc-r6a",   "r_acc",  "r6a",     "a",   "s-top",   "t-right", true),
  E("racc-r6b",   "r_acc",  "r6b",     "b",   "s-bot",   "t-right", true),
];

// ─────────────────────────────────────────────────────────────
//  PDA — Regex 2 (0/1)
//  Language: (11+00)(1+0)*(101+111+01)(00*+11*)(1+0+11)
//
//  State machine (from spec):
//  START  → READ1
//  READ1:   1 → READ2A,   0 → READ2B,   Δ → REJECT
//  READ2A:  1 → READ3,    0 → REJECT,   Δ → REJECT
//  READ2B:  0 → READ3,    1 → REJECT,   Δ → REJECT
//  READ3:   1 → READ4A,   0 → READ4B,   Δ → REJECT
//  READ4A:  1 → READ5A,   0 → READ5B,   Δ → REJECT
//  READ4B:  1 → READ6,    0 → READ3,    Δ → REJECT
//  READ5A:  1 → READ6,    0 → READ4B,   Δ → REJECT
//  READ5B:  1 → READ6,    0 → READ3,    Δ → REJECT
//  READ6:   1 → READ7A,   0 → READ7B,   Δ → REJECT
//  READ7A:  1 → READ8A,   0 → READ8C,   Δ → REJECT
//  READ7B:  0 → READ7B,   1 → READ8B,   Δ → REJECT
//  READ8A:  1 → READ9A,   0 → READ8C,   Δ → ACCEPT
//  READ8B:  1 → READ9B,   0 → READ7B,   Δ → ACCEPT
//  READ8C:  1 → READ9B,   0 → READ7B,   Δ → REJECT
//  READ9A:  1 → READ9A,   0 → READ8C,   Δ → ACCEPT
//  READ9B:  1 → READ9A,   0 → READ8C,   Δ → REJECT
// ─────────────────────────────────────────────────────────────

// Column x-positions (200px apart)
const D1=80, D2A=280, D2B=280, D3=480, D4A=680, D4B=680, D5A=880, D5B=880,
      D6=1080, D7A=1280, D7B=1280, D8A=1480, D8B=1480, D8C=1480,
      D9A=1680, D9B=1680, DACC=1880;

// Row y-positions
const T=-30, RR1=80, RR2=200, RR3=320, RR4=440;

export const Pda01Nodes: Node[] = [
  N("start",   D1,   T,     "START",   "start"),
  N("r1",      D1,   RR1,   "READ₁",   "read"),
  N("rej_r1",  D1,   RR2,   "REJECT",  "reject"),

  N("r2a",     D2A,  RR1-60,"READ 2a", "read"),
  N("rej_r2a", D2A,  RR1-160,"REJECT", "reject"),
  N("r2b",     D2B,  RR2+60,"READ 2b", "read"),
  N("rej_r2b", D2B,  RR2+160,"REJECT", "reject"),

  N("r3",      D3,   RR2,   "READ₃",   "read"),
  N("rej_r3",  D3,   RR2-110,"REJECT", "reject"),

  N("r4a",     D4A,  RR1,   "READ 4a", "read"),
  N("rej_r4a", D4A,  RR1-100,"REJECT", "reject"),
  N("r4b",     D4B,  RR3,   "READ 4b", "read"),
  N("rej_r4b", D4B,  RR3+100,"REJECT", "reject"),

  N("r5a",     D5A,  RR1,   "READ 5a", "read"),
  N("rej_r5a", D5A,  RR1-100,"REJECT", "reject"),
  N("r5b",     D5B,  RR3,   "READ 5b", "read"),
  N("rej_r5b", D5B,  RR3+100,"REJECT", "reject"),

  N("r6",      D6,   RR2,   "READ₆",   "read"),
  N("rej_r6",  D6,   RR2-110,"REJECT", "reject"),

  N("r7a",     D7A,  RR1,   "READ 7a", "read"),
  N("rej_r7a", D7A,  RR1-100,"REJECT", "reject"),
  N("r7b",     D7B,  RR3,   "READ 7b", "read"),
  N("rej_r7b", D7B,  RR3+100,"REJECT", "reject"),

  N("r8a",     D8A,  RR1,   "READ 8a", "read"),
  N("acc_r8a", D8A,  RR1-100,"ACCEPT", "accept"),
  N("r8b",     D8B,  RR3,   "READ 8b", "read"),
  N("acc_r8b", D8B,  RR3+100,"ACCEPT", "accept"),
  N("r8c",     D8C,  RR2,   "READ 8c", "read"),
  N("rej_r8c", D8C,  RR2+110,"REJECT", "reject"),

  N("r9a",     D9A,  RR1,   "READ 9a", "read"),
  N("acc_r9a", D9A,  RR1-100,"ACCEPT", "accept"),
  N("r9b",     D9B,  RR3,   "READ 9b", "read"),
  N("rej_r9b", D9B,  RR3+100,"REJECT", "reject"),
];

export const Pda01Edges: Edge[] = [
  // START → READ1
  E("s-r1",       "start",  "r1",      "",    "s-bot",   "t-top"),

  // READ1: 1 → READ2A,  0 → READ2B,  Δ → REJECT
  E("r1-r2a",     "r1",     "r2a",     "1",   "s-right", "t-left"),
  E("r1-r2b",     "r1",     "r2b",     "0",   "s-right", "t-left"),
  E("r1-rej",     "r1",     "rej_r1",  "Δ",   "s-bot",   "t-top"),

  // READ2A: 1 → READ3,  0/Δ → REJECT
  E("r2a-r3",     "r2a",    "r3",      "1",   "s-right", "t-left"),
  E("r2a-rej",    "r2a",    "rej_r2a", "0, Δ","s-top",   "t-bot"),

  // READ2B: 0 → READ3,  1/Δ → REJECT
  E("r2b-r3",     "r2b",    "r3",      "0",   "s-right", "t-left"),
  E("r2b-rej",    "r2b",    "rej_r2b", "1, Δ","s-bot",   "t-top"),

  // READ3: 1 → READ4A,  0 → READ4B,  Δ → REJECT
  E("r3-r4a",     "r3",     "r4a",     "1",   "s-right", "t-left"),
  E("r3-r4b",     "r3",     "r4b",     "0",   "s-right", "t-left"),
  E("r3-rej",     "r3",     "rej_r3",  "Δ",   "s-top",   "t-bot"),

  // READ4A: 1 → READ5A,  0 → READ5B,  Δ → REJECT
  E("r4a-r5a",    "r4a",    "r5a",     "1",   "s-right", "t-left"),
  E("r4a-r5b",    "r4a",    "r5b",     "0",   "s-right", "t-left"),
  E("r4a-rej",    "r4a",    "rej_r4a", "Δ",   "s-top",   "t-bot"),

  // READ4B: 1 → READ6,  0 → READ3 (back),  Δ → REJECT
  E("r4b-r6",     "r4b",    "r6",      "1",   "s-right", "t-left"),
  E("r4b-r3",     "r4b",    "r3",      "0",   "s-left",  "t-bot",   true),
  E("r4b-rej",    "r4b",    "rej_r4b", "Δ",   "s-bot",   "t-top"),

  // READ5A: 1 → READ6,  0 → READ4B,  Δ → REJECT
  E("r5a-r6",     "r5a",    "r6",      "1",   "s-right", "t-left"),
  E("r5a-r4b",    "r5a",    "r4b",     "0",   "s-bot",   "t-top",   true),
  E("r5a-rej",    "r5a",    "rej_r5a", "Δ",   "s-top",   "t-bot"),

  // READ5B: 1 → READ6,  0 → READ3 (back),  Δ → REJECT
  E("r5b-r6",     "r5b",    "r6",      "1",   "s-right", "t-left"),
  E("r5b-r3",     "r5b",    "r3",      "0",   "s-left",  "t-bot",   true),
  E("r5b-rej",    "r5b",    "rej_r5b", "Δ",   "s-bot",   "t-top"),

  // READ6: 1 → READ7A,  0 → READ7B,  Δ → REJECT
  E("r6-r7a",     "r6",     "r7a",     "1",   "s-right", "t-left"),
  E("r6-r7b",     "r6",     "r7b",     "0",   "s-right", "t-left"),
  E("r6-rej",     "r6",     "rej_r6",  "Δ",   "s-top",   "t-bot"),

  // READ7A: 1 → READ8A,  0 → READ8C,  Δ → REJECT
  E("r7a-r8a",    "r7a",    "r8a",     "1",   "s-right", "t-left"),
  E("r7a-r8c",    "r7a",    "r8c",     "0",   "s-right", "t-left"),
  E("r7a-rej",    "r7a",    "rej_r7a", "Δ",   "s-top",   "t-bot"),

  // READ7B: 0 → READ7B (self),  1 → READ8B,  Δ → REJECT
  E("r7b-self",   "r7b",    "r7b",     "0",   "s-bot",   "t-right", true),
  E("r7b-r8b",    "r7b",    "r8b",     "1",   "s-right", "t-left"),
  E("r7b-rej",    "r7b",    "rej_r7b", "Δ",   "s-bot",   "t-top"),

  // READ8A: 1 → READ9A,  0 → READ8C,  Δ → ACCEPT
  E("r8a-r9a",    "r8a",    "r9a",     "1",   "s-right", "t-left"),
  E("r8a-r8c",    "r8a",    "r8c",     "0",   "s-right", "t-left"),
  E("r8a-acc",    "r8a",    "acc_r8a", "Δ",   "s-top",   "t-bot"),

  // READ8B: 1 → READ9B,  0 → READ7B (back),  Δ → ACCEPT
  E("r8b-r9b",    "r8b",    "r9b",     "1",   "s-right", "t-left"),
  E("r8b-r7b",    "r8b",    "r7b",     "0",   "s-left",  "t-top",   true),
  E("r8b-acc",    "r8b",    "acc_r8b", "Δ",   "s-bot",   "t-top"),

  // READ8C: 1 → READ9B,  0 → READ7B (back),  Δ → REJECT
  E("r8c-r9b",    "r8c",    "r9b",     "1",   "s-right", "t-left"),
  E("r8c-r7b",    "r8c",    "r7b",     "0",   "s-left",  "t-top",   true),
  E("r8c-rej",    "r8c",    "rej_r8c", "Δ",   "s-bot",   "t-top"),

  // READ9A: 1 → READ9A (self),  0 → READ8C (back),  Δ → ACCEPT
  E("r9a-self",   "r9a",    "r9a",     "1",   "s-top",   "t-right", true),
  E("r9a-r8c",    "r9a",    "r8c",     "0",   "s-left",  "t-top",   true),
  E("r9a-acc",    "r9a",    "acc_r9a", "Δ",   "s-top",   "t-bot"),

  // READ9B: 1 → READ9A,  0 → READ8C (back),  Δ → REJECT
  E("r9b-r9a",    "r9b",    "r9a",     "1",   "s-top",   "t-bot",   true),
  E("r9b-r8c",    "r9b",    "r8c",     "0",   "s-left",  "t-bot",   true),
  E("r9b-rej",    "r9b",    "rej_r9b", "Δ",   "s-bot",   "t-top"),
];

// ─────────────────────────────────────────────────────────────
//  VALIDATION — correct regex for both problems
// ─────────────────────────────────────────────────────────────

function validatePDA(input: string, regex: RegexChoice): boolean {
  if (regex === "regex1") {
    return /^(a|b)(a|b)*(aa|bb)(ab|ba)(a|b)*(aba|baa)$/.test(input);
  } else {
    return /^(11|00)(1|0)*(101|111|01)(0+|1+)(1|0|11)$/.test(input);
  }
}

// ─────────────────────────────────────────────────────────────
//  PROPS
// ─────────────────────────────────────────────────────────────

interface PDAModuleProps {
  lastSimulated: { input: string; rowId: number } | null;
  selectedRegex: RegexChoice;
  onSimulationComplete: (rowId: number, isValid: boolean) => void;
}

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

const PDAInner: React.FC<PDAModuleProps> = ({ lastSimulated, selectedRegex, onSimulationComplete }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    selectedRegex === "regex1" ? PdaAbNodes : Pda01Nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    selectedRegex === "regex1" ? PdaAbEdges : Pda01Edges
  );
  const { fitView } = useReactFlow();
  const prevRegex = useRef(selectedRegex);
  const prevSim   = useRef<{ input: string; rowId: number } | null>(null);

  // Swap graph when regex changes
  useEffect(() => {
    if (prevRegex.current === selectedRegex) return;
    prevRegex.current = selectedRegex;
    setNodes(selectedRegex === "regex1" ? PdaAbNodes : Pda01Nodes);
    setEdges(selectedRegex === "regex1" ? PdaAbEdges : Pda01Edges);
    setTimeout(() => fitView({ duration: 400, padding: 0.3 }), 80);
  }, [selectedRegex]);

  // Instant validation — no animation
  useEffect(() => {
    if (!lastSimulated || prevSim.current === lastSimulated) return;
    prevSim.current = lastSimulated;
    const { input, rowId } = lastSimulated;
    const alphabetOk = selectedRegex === "regex1" ? /^[ab]+$/.test(input) : /^[01]+$/.test(input);
    onSimulationComplete(rowId, alphabetOk && validatePDA(input, selectedRegex));
  }, [lastSimulated, selectedRegex, onSimulationComplete]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#D9D9D9" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.3 }}
      >
        <Background color="#515151" variant={BackgroundVariant.Dots} style={{ backgroundColor: "#000000" }} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const PDAModule: React.FC<PDAModuleProps> = (props) => <PDAInner {...props} />;
export default PDAModule;
