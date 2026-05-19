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
  ReactFlowProvider,
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
  nodeType: "start" | "read" | "push" | "pop" | "accept" | "reject";
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────
//  CUSTOM NODE SHAPES — professor's flowchart style
//  oval  = START / ACCEPT / REJECT
//  diamond = READ / POP
//  rectangle = PUSH
// ─────────────────────────────────────────────────────────────

/** Invisible handle helper */
const H = (
  type: "source" | "target",
  pos: Position,
  id: string,
  extra?: React.CSSProperties
) => <Handle type={type} position={pos} id={id} style={{ opacity: 0, ...extra }} />;

const AllHandles = () => (
  <>
    {H("source", Position.Top, "st")}
    {H("target", Position.Top, "tt")}
    {H("source", Position.Top, "stl", { left: "25%" })}
    {H("target", Position.Top, "ttl", { left: "25%" })}
    {H("source", Position.Top, "str", { left: "75%" })}
    {H("target", Position.Top, "ttr", { left: "75%" })}
    {H("source", Position.Bottom, "sb")}
    {H("target", Position.Bottom, "tb")}
    {H("source", Position.Bottom, "sbl", { left: "25%" })}
    {H("target", Position.Bottom, "tbl", { left: "25%" })}
    {H("source", Position.Bottom, "sbr", { left: "75%" })}
    {H("target", Position.Bottom, "tbr", { left: "75%" })}
    {H("source", Position.Left, "sl")}
    {H("target", Position.Left, "tl")}
    {H("source", Position.Left, "slt", { top: "25%" })}
    {H("target", Position.Left, "tlt", { top: "25%" })}
    {H("source", Position.Left, "slb", { top: "75%" })}
    {H("target", Position.Left, "tlb", { top: "75%" })}
    {H("source", Position.Right, "sr")}
    {H("target", Position.Right, "tr")}
    {H("source", Position.Right, "srt", { top: "25%" })}
    {H("target", Position.Right, "trt", { top: "25%" })}
    {H("source", Position.Right, "srb", { top: "75%" })}
    {H("target", Position.Right, "trb", { top: "75%" })}
  </>
);

/** Oval — START / ACCEPT / REJECT */
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
      position: "relative",
      width: 84, height: 38,
      borderRadius: 19,
      background: bg,
      border: `2px solid ${border}`,
      color,
      fontFamily: "monospace",
      fontWeight: 700,
      fontSize: 11,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    }}>
      {label}
      <AllHandles />
    </div>
  );
};

/** Diamond — READ / POP */
const DiamondNode: React.FC<{ data: PDANodeData }> = ({ data }) => {
  const { nodeType, label } = data;
  const isRead = nodeType === "read";
  const bg     = isRead ? "#0c1a2e" : "#1a0c2e";
  const border = isRead ? "#74DCFF" : "#c084fc";
  const color  = isRead ? "#74DCFF" : "#c084fc";

  return (
    <div style={{ position: "relative", width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute",
        width: 56, height: 56,
        background: bg,
        border: `2px solid ${border}`,
        transform: "rotate(45deg)",
        transition: "all 0.2s ease",
      }} />
      <div style={{
        position: "relative", zIndex: 2,
        color, fontFamily: "monospace", fontWeight: 700,
        fontSize: 9, textAlign: "center", lineHeight: 1.2, userSelect: "none",
      }}>
        {label}
      </div>
      <AllHandles />
    </div>
  );
};

/** Rectangle — PUSH */
const PushNode: React.FC<{ data: PDANodeData }> = ({ data }) => (
  <div style={{
    position: "relative",
    width: 90, height: 36,
    borderRadius: 3,
    background: "#0a1a0a",
    border: "2px solid #4ade80",
    color: "#4ade80",
    fontFamily: "monospace", fontWeight: 700, fontSize: 11,
    display: "flex", alignItems: "center", justifyContent: "center",
    userSelect: "none",
  }}>
    {data.label}
    <AllHandles />
  </div>
);

const nodeTypes = { oval: OvalNode, diamond: DiamondNode, push: PushNode };

// ─────────────────────────────────────────────────────────────
//  GRAPH BUILDER HELPERS
// ─────────────────────────────────────────────────────────────

type NType = PDANodeData["nodeType"];

function N(id: string, x: number, y: number, label: string, nodeType: NType): Node {
  const type = nodeType === "read" || nodeType === "pop" ? "diamond"
             : nodeType === "push" ? "push" : "oval";
  return { id, type, position: { x, y }, data: { label, nodeType } };
}

function E(
  id: string, source: string, target: string, label: string,
  sh: string, th: string, type: "straight" | "smoothstep" = "straight"
): Edge {
  return {
    id, source, target, label,
    labelStyle: { fill: "#e2e8f0", fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: "#1a1a1a", fillOpacity: 0.92 },
    labelBgPadding: [3, 5] as [number, number],
    labelBgBorderRadius: 3,
    sourceHandle: sh, targetHandle: th, type,
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#6b7280" },
    style: { strokeWidth: 2.5, stroke: "#57565699" },
  };
}

// ─────────────────────────────────────────────────────────────
//  PDA GRAPH — Regex 1 (a/b)
//  Language: (a+b)(a+b)*(aa+bb)(ab+ba)(a+b)*(aba+baa)
//
//  Flowchart mirrors professor's diagram style:
//  START → READ₁ (reads first char, pushes it)
//        → PUSH a / PUSH b
//        → READ₂ (loop: read & push middle chars)
//        → READ₃ (reads 'b' branch for structural check)
//        → POP    (pops a, checks stack)
//        → READ₄  (reads remaining, checks Δ)
//        → POP₂   (final stack empty check)
//        → ACCEPT / REJECT
//
//  Layout: top-to-bottom / left-to-right cascade
// ─────────────────────────────────────────────────────────────

export const PdaAbNodes: Node[] = [
  // Col 0
  N("start",       80,   0,  "START",      "start"),
  N("r1",          80,  90,  "READ₁",        "read"),
  N("rej_r1",      80, 210,  "REJECT",     "reject"),
  // Col 1
  N("rej_r2",     260, -40,  "REJECT",     "reject"),
  N("r2",         260,  90,  "READ₂",        "read"),
  // Col 2
  N("r3a",        440,  20,  "READ 3a",   "read"),
  N("r3b",        440, 160,  "READ 3b",   "read"),
  // Col 3
  N("rej_r3a",    620, -40,  "REJECT",     "reject"),
  N("r4a",        620,  20,  "READ 4a",   "read"),
  N("r4b",        620, 160,  "READ 4b",   "read"),
  N("rej_r3b",    620, 260,  "REJECT",     "reject"),
  // Col 4
  N("rej_r5",     800, -40,  "REJECT",     "reject"),
  N("r5",         800,  90,  "READ₅",        "read"),
  // Col 5
  N("r6a",        980,  20,  "READ 6a",   "read"),
  N("rej_r6a",    980, -80,  "REJECT",     "reject"),
  N("r6b",        980, 160,  "READ 6b",   "read"),
  N("rej_r6b",    980, 260,  "REJECT",     "reject"),
  // Col 6
  N("r7a",       1160,  20,  "READ 7a",   "read"),
  N("rej_r7a",   1160, -80,  "REJECT",     "reject"),
  N("r7b",       1160, 160,  "READ 7b",   "read"),
  N("rej_r7b",   1160, 260,  "REJECT",     "reject"),
  // Col 7
  N("r_acc",     1340,  90,  "R.ACC", "read"),
  // Col 8
  N("accept",    1520,  90,  "ACCEPT",     "accept"),
];

export const PdaAbEdges: Edge[] = [
  // START -> READ1
  E("s-r1",        "start",  "r1",      "",      "sb",  "tt"),

  // READ1: a->READ2, b->READ2, Delta->REJECT
  E("r1-r2a",      "r1",     "r2",      "a",     "srt", "tl"),
  E("r1-r2b",      "r1",     "r2",      "b",     "srb", "tlb"),
  E("r1-rej",      "r1",     "rej_r1",  "Δ", "sb",  "tt"),

  // READ2: a->READ3A, b->READ3B, Delta->REJECT
  E("r2-r3a",      "r2",     "r3a",     "a",     "srt", "tlb"),
  E("r2-r3b",      "r2",     "r3b",     "b",     "srb", "tlt"),
  E("r2-rej",      "r2",     "rej_r2",  "Δ", "st",  "tb"),

  // READ3A: a->READ4A, b->READ2(loop back)
  E("r3a-r4a",     "r3a",    "r4a",     "a",     "sr",  "tl"),
  E("r3a-r2",      "r3a",    "r2",      "b",     "sb",  "stl", "smoothstep"),

  // READ3B: b->READ4B, a->READ2(loop back)
  E("r3b-r4b",     "r3b",    "r4b",     "b",     "sr",  "tl"),
  E("r3b-r2",      "r3b",    "r2",      "a",     "st",  "sbl", "smoothstep"),

  // READ4A: b->READ5, a->READ2(reset)
  E("r4a-r5",      "r4a",    "r5",      "b",     "sr",  "stl"),
  E("r4a-r2",      "r4a",    "r2",      "a",     "sb",  "str", "smoothstep"),
  E("r4a-rej",     "r4a",    "rej_r3a", "Δ", "st",  "tb"),

  // READ4B: a->READ5, b->READ2(reset)
  E("r4b-r5",      "r4b",    "r5",      "a",     "sr",  "sbl"),
  E("r4b-r2",      "r4b",    "r2",      "b",     "sb",  "sbr", "smoothstep"),
  E("r4b-rej",     "r4b",    "rej_r3b", "Δ", "sb",  "tt"),

  // READ5: a->READ6A, b->READ6B, Delta->REJECT
  E("r5-r6a",      "r5",     "r6a",     "a",     "srt", "tlb"),
  E("r5-r6b",      "r5",     "r6b",     "b",     "srb", "tlt"),
  E("r5-rej",      "r5",     "rej_r5",  "Δ", "st",  "tb"),

  // READ6A: a->READ6A(self-loop), b->READ7A, Delta->REJECT
  E("r6a-self",    "r6a",    "r6a",     "a",     "slt", "ttr", "smoothstep"),
  E("r6a-r7a",     "r6a",    "r7a",     "b",     "sr",  "tl"),
  E("r6a-rej",     "r6a",    "rej_r6a", "Δ", "st",  "tb"),

  // READ6B: b->READ6B(self-loop), a->READ7B, Delta->REJECT
  E("r6b-self",    "r6b",    "r6b",     "b",     "slb", "tbr", "smoothstep"),
  E("r6b-r7b",     "r6b",    "r7b",     "a",     "sr",  "tl"),
  E("r6b-rej",     "r6b",    "rej_r6b", "Δ", "sb",  "tt"),

  // READ7A: a->READ_ACCEPT, b->READ6B, Delta->REJECT
  E("r7a-acc",     "r7a",    "r_acc",   "a",     "sr",  "stl"),
  E("r7a-r6b",     "r7a",    "r6b",     "b",     "sb",  "tr", "smoothstep"),
  E("r7a-rej",     "r7a",    "rej_r7a", "Δ", "st",  "tb"),

  // READ7B: a->READ_ACCEPT, b->READ6B, Delta->REJECT
  E("r7b-acc",     "r7b",    "r_acc",   "a",     "sr",  "sbl"),
  E("r7b-r6b",     "r7b",    "r6b",     "b",     "sb",  "trb", "smoothstep"),
  E("r7b-rej",     "r7b",    "rej_r7b", "Δ", "sb",  "tt"),

  // READ_ACCEPT: Delta->ACCEPT, a->READ6A, b->READ6B
  E("racc-acc",    "r_acc",  "accept",  "Δ", "sr",  "tl"),
  E("racc-r6a",    "r_acc",  "r6a",     "a",     "st",  "srb", "smoothstep"),
  E("racc-r6b",    "r_acc",  "r6b",     "b",     "sb",  "srb", "smoothstep"),
];

// ─────────────────────────────────────────────────────────────
//  PDA GRAPH — Regex 2 (0/1)
//  Language: (11+00)(1+0)*(101+111+01)(00*+11*)(1+0+11)
// ─────────────────────────────────────────────────────────────

export const Pda01Nodes: Node[] = [
  // Col 0: START + initial split
  N("start",       80,   0,  "START",      "start"),
  N("r1a",         80,  90,  "READ 1a",   "read"),
  N("rej_r1a",     80, 200,  "REJECT",     "reject"),
  N("r1b",        -80,  90,  "READ 1b",   "read"),
  N("rej_r1b",    -80, 200,  "REJECT",     "reject"),
  // Col 1: READ2 hub
  N("rej_r2",     260, -40,  "REJECT",     "reject"),
  N("r2",         260,  90,  "READ₂",        "read"),
  // Col 2: READ3A/3B
  N("r3a",        440,  20,  "READ 3a",   "read"),
  N("r3b",        440, 160,  "READ 3b",   "read"),
  // Col 3: READ4A/4B + rejects
  N("rej_r4a",    620, -60,  "REJECT",     "reject"),
  N("r4a",        620,  20,  "READ 4a",   "read"),
  N("r4b",        620, 160,  "READ 4b",   "read"),
  N("rej_r4b",    620, 270,  "REJECT",     "reject"),
  // Col 4: READ5
  N("rej_r5",     800, -40,  "REJECT",     "reject"),
  N("r5",         800,  90,  "READ₅",        "read"),
  // Col 5: READ6A/6B
  N("r6a",        980,  20,  "READ 6a",   "read"),
  N("rej_r6a",    980, -80,  "REJECT",     "reject"),
  N("r6b",        980, 160,  "READ 6b",   "read"),
  N("rej_r6b",    980, 270,  "REJECT",     "reject"),
  // Col 6: READ7A/7B + READ8
  N("r7a",       1160,  20,  "READ 7a",   "read"),
  N("rej_r7a",   1160, -80,  "REJECT",     "reject"),
  N("r7b",       1160, 160,  "READ 7b",   "read"),
  N("rej_r7b",   1160, 270,  "REJECT",     "reject"),
  N("r8",        1160,  90,  "READ₈",        "read"),
  // Col 7: READ_ACCEPT + ACCEPT
  N("r_acc",     1340,  90,  "R.ACC", "read"),
  N("accept",    1520,  90,  "ACCEPT",     "accept"),
];

export const Pda01Edges: Edge[] = [
  // START -> READ1A (1) and READ1B (0)
  E("s-r1a",       "start",  "r1a",     "1",     "srt", "tt"),
  E("s-r1b",       "start",  "r1b",     "0",     "slt", "tt"),

  // READ1A: 1->READ2, 0->REJECT, Delta->REJECT
  E("r1a-r2",      "r1a",    "r2",      "1",     "sr",  "tl"),
  E("r1a-rej",     "r1a",    "rej_r1a", "0, Δ", "sb", "tt"),

  // READ1B: 0->READ2, 1->REJECT, Delta->REJECT
  E("r1b-r2",      "r1b",    "r2",      "0",     "sr",  "tlb"),
  E("r1b-rej",     "r1b",    "rej_r1b", "1, Δ", "sb", "tt"),

  // READ2: 1->READ3A, 0->READ3B, Delta->REJECT
  E("r2-r3a",      "r2",     "r3a",     "1",     "srt", "tlb"),
  E("r2-r3b",      "r2",     "r3b",     "0",     "srb", "tlt"),
  E("r2-rej",      "r2",     "rej_r2",  "Δ", "st",  "tb"),

  // READ3A: 1->READ4A, 0->READ4B, Delta->REJECT
  E("r3a-r4a",     "r3a",    "r4a",     "1",     "sr",  "tl"),
  E("r3a-r4b",     "r3a",    "r4b",     "0",     "srb", "tlb"),

  // READ3B: 1->READ5, 0->READ2(loop), Delta->REJECT
  E("r3b-r5",      "r3b",    "r5",      "1",     "sr",  "sbl"),
  E("r3b-r2",      "r3b",    "r2",      "0",     "sb",  "sbr", "smoothstep"),

  // READ4A: 1->READ5, 0->READ2(reset), Delta->REJECT
  E("r4a-r5",      "r4a",    "r5",      "1",     "sr",  "stl"),
  E("r4a-r2",      "r4a",    "r2",      "0",     "sb",  "str", "smoothstep"),
  E("r4a-rej",     "r4a",    "rej_r4a", "Δ", "st",  "tb"),

  // READ4B: 1->READ5, 0->READ2(reset), Delta->REJECT
  E("r4b-r5",      "r4b",    "r5",      "1",     "sr",  "sbl"),
  E("r4b-r2",      "r4b",    "r2",      "0",     "sb",  "sbr", "smoothstep"),
  E("r4b-rej",     "r4b",    "rej_r4b", "Δ", "sb",  "tt"),

  // READ5: 1->READ6A, 0->READ6B, Delta->REJECT
  E("r5-r6a",      "r5",     "r6a",     "1",     "srt", "tlb"),
  E("r5-r6b",      "r5",     "r6b",     "0",     "srb", "tlt"),
  E("r5-rej",      "r5",     "rej_r5",  "Δ", "st",  "tb"),

  // READ6A: 1->READ6A(loop), 0->READ7B, Delta->REJECT
  E("r6a-self",    "r6a",    "r6a",     "1",     "slt", "ttr", "smoothstep"),
  E("r6a-r7b",     "r6a",    "r7b",     "0",     "srb", "tlt"),
  E("r6a-rej",     "r6a",    "rej_r6a", "Δ", "st",  "tb"),

  // READ6B: 0->READ6B(loop), 1->READ7A, Delta->REJECT
  E("r6b-self",    "r6b",    "r6b",     "0",     "slb", "tbr", "smoothstep"),
  E("r6b-r7a",     "r6b",    "r7a",     "1",     "srt", "tlb"),
  E("r6b-rej",     "r6b",    "rej_r6b", "Δ", "sb",  "tt"),

  // READ7A (after 0+ path): 0->READ_ACCEPT, 1->READ8, Delta->REJECT
  E("r7a-acc",     "r7a",    "r_acc",   "0",     "sr",  "stl"),
  E("r7a-r8",      "r7a",    "r8",      "1",     "sb",  "tlt"),
  E("r7a-rej",     "r7a",    "rej_r7a", "Δ", "st",  "tb"),

  // READ7B (after 1+ path): 0->READ_ACCEPT, 1->READ8, Delta->REJECT
  E("r7b-acc",     "r7b",    "r_acc",   "0",     "sr",  "sbl"),
  E("r7b-r8",      "r7b",    "r8",      "1",     "st",  "tlb"),
  E("r7b-rej",     "r7b",    "rej_r7b", "Δ", "sb",  "tt"),

  // READ8: 1->READ_ACCEPT (satisfies 11), 0->READ2(reset), Delta->ACCEPT via r_acc
  E("r8-acc",      "r8",     "r_acc",   "1",     "sr",  "sl"),
  E("r8-r2",       "r8",     "r2",      "0",     "sl",  "sbr", "smoothstep"),

  // READ_ACCEPT: Delta->ACCEPT, 1->READ3A, 0->READ3B
  E("racc-acc",    "r_acc",  "accept",  "Δ", "sr",  "tl"),
  E("racc-r3a",    "r_acc",  "r3a",     "1",     "st",  "srb", "smoothstep"),
  E("racc-r3b",    "r_acc",  "r3b",     "0",     "sb",  "srb", "smoothstep"),
];

// ─────────────────────────────────────────────────────────────
//  CORRECT VALIDATION LOGIC
//  Both regexes validated with precise patterns
// ─────────────────────────────────────────────────────────────

function validatePDA(input: string, regex: RegexChoice): boolean {
  if (regex === "regex1") {
    // (a+b)(a+b)*(aa+bb)(ab+ba)(a+b)*(aba|baa)
    return /^(a|b)(a|b)*(aa|bb)(ab|ba)(a|b)*(aba|baa)$/.test(input);
  } else {
    // (11+00)(1+0)*(101+111+01)(00*+11*)(1+0+11)
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
//  INNER COMPONENT (needs ReactFlow context from parent)
// ─────────────────────────────────────────────────────────────

const PDAInner: React.FC<PDAModuleProps> = ({ lastSimulated, selectedRegex, onSimulationComplete }) => {
  const baseNodes = selectedRegex === "regex1" ? PdaAbNodes : Pda01Nodes;
  const baseEdges = selectedRegex === "regex1" ? PdaAbEdges : Pda01Edges;

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);
  const { fitView } = useReactFlow();
  const prevRegex = useRef(selectedRegex);
  const prevSimRef = useRef<{ input: string; rowId: number } | null>(null);

  // Reset diagram on regex switch
  useEffect(() => {
    if (prevRegex.current !== selectedRegex) {
      prevRegex.current = selectedRegex;
      const nb = selectedRegex === "regex1" ? PdaAbNodes : Pda01Nodes;
      const eb = selectedRegex === "regex1" ? PdaAbEdges : Pda01Edges;
      setNodes(nb);
      setEdges(eb);
      setTimeout(() => fitView({ duration: 400, padding: 0.3 }), 80);
    }
  }, [selectedRegex]);

  // Process simulation — instantly validate, then call back
  useEffect(() => {
    if (!lastSimulated) return;
    if (prevSimRef.current === lastSimulated) return;
    prevSimRef.current = lastSimulated;

    const { input, rowId } = lastSimulated;

    // Validate against correct regex
    const alphabet = selectedRegex === "regex1" ? /^[ab]*$/ : /^[01]*$/;
    if (!alphabet.test(input)) {
      onSimulationComplete(rowId, false);
      return;
    }

    const isValid = validatePDA(input, selectedRegex);
    onSimulationComplete(rowId, isValid);
  }, [lastSimulated, selectedRegex, onSimulationComplete]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#D9D9D9" }}>

      {/* ── ReactFlow Canvas ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
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
          <Background
            color="#515151"
            variant={BackgroundVariant.Dots}
            style={{ backgroundColor: "#000000" }}
          />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  EXPORT — PDAModule uses the ReactFlow context from parent
//  (AutomataSimulator wraps everything in ReactFlowProvider)
// ─────────────────────────────────────────────────────────────

const PDAModule: React.FC<PDAModuleProps> = (props) => <PDAInner {...props} />;
export default PDAModule;
