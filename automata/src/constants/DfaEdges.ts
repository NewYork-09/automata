import { type Edge, MarkerType } from "@xyflow/react";

type HorizontalSide = "top" | "bottom";
type HorizontalPos = "left" | "mid" | "right";
type VerticalSide = "left" | "right";
type VerticalPos = "top" | "mid" | "bottom";

const createEdge = (
    id: string,
    sourceHandle:
        | `source-${HorizontalSide}-${HorizontalPos}`
        | `source-${VerticalSide}-${VerticalPos}`,
    targetHandle:
        | `target-${HorizontalSide}-${HorizontalPos}`
        | `target-${VerticalSide}-${VerticalPos}`,
): Edge => {
    const [source, label, target] = id.split("-");
    const isSelfLoop = source == target;

    return {
        id,
        source: source,
        target: target,
        label: label,
        labelStyle: { fill: "#ffffff", fontWeight: 600, fontSize: 15 },
        labelBgStyle: { fill: "#413d3d", fillOpacity: 0.1 },
        sourceHandle,
        targetHandle,
        type: isSelfLoop ? "default" : "straight",
        ...(isSelfLoop && {
            pathOptions: { curvature: 0.6 },
        }),
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#504f4f" },
        style: { strokeWidth: 3, stroke: "#57565657" },
    };
};

export const Dfa01Edges: Edge[] = [
    createEdge("q0-0-q1", "source-top-right", "target-left-bottom"),
    createEdge("q0-1-q3", "source-bottom-right", "target-left-top"),

    createEdge("q1-0-q4", "source-right-bottom", "target-top-left"),
    createEdge("q1-1-q2", "source-bottom-mid", "target-top-mid"),

    createEdge("q2-0-q2", "source-bottom-left", "target-left-top"),
    createEdge("q2-1-q2", "source-bottom-right", "target-right-top"),

    createEdge("q3-0-q2", "source-top-mid", "target-bottom-mid"),
    createEdge("q3-1-q4", "source-right-top", "target-bottom-left"),

    createEdge('q4-0-q5', 'source-top-right', 'target-left-bottom'),
    createEdge('q4-1-q6', 'source-bottom-right', 'target-left-top'),

    createEdge('q5-0-q5', 'source-left-mid', 'target-top-right'),
    createEdge('q5-1-q10', 'source-right-mid', 'target-left-mid'),

    createEdge('q6-0-q5', 'source-top-mid', 'target-bottom-mid'),
    createEdge('q6-1-q8', 'source-right-top', 'target-bottom-left'),

    createEdge('q7-0-q5', 'source-bottom-left', 'target-right-top'),
    createEdge('q7-1-q10', 'source-bottom-right', 'target-left-top'),

    createEdge('q8-0-q5', 'source-top-left', 'target-right-bottom'),
    createEdge('q8-1-q9', 'source-bottom-mid', 'target-top-mid'),

    createEdge('q9-0-q11', 'source-right-mid', 'target-left-mid'),
    createEdge('q9-1-q13', 'source-right-top', 'target-left-bottom'),

    createEdge('q10-0-q11', 'source-bottom-mid', 'target-top-mid'),
    createEdge('q10-1-q12', 'source-right-mid', 'target-left-mid'),

    createEdge('q11-0-q15', 'source-right-top', 'target-left-bottom'),
    createEdge('q11-1-q17', 'source-right-mid', 'target-left-mid'),

    createEdge('q12-0-q7', 'source-left-top', 'target-right-bottom'),
    createEdge('q12-1-q14', 'source-right-mid', 'target-left-mid'),

    createEdge('q13-0-q15', 'source-right-mid', 'target-left-mid'),
    createEdge('q13-1-q14', 'source-top-right', 'target-bottom-left'),

    createEdge('q14-0-q15', 'source-bottom-mid', 'target-top-mid'),
    createEdge('q14-1-q14', 'source-bottom-right', 'target-right-mid'),

    createEdge('q15-0-q15', 'source-top-right', 'target-right-mid'),
    createEdge('q15-1-q17', 'source-right-bottom', 'target-top-left'),

    createEdge('q16-0-q7', 'source-left-top', 'target-right-top'),
    createEdge('q16-1-q14', 'source-left-bottom', 'target-top-right'),

    createEdge('q17-0-q11', 'source-right-bottom', 'target-right-bottom'),
    createEdge('q17-1-q16', 'source-top-right', 'target-bottom-right'),
];

export const DfaAbEdges: Edge[] = [
    createEdge("q0-a,b-q1", "source-right-mid", "target-left-mid"),

    createEdge("q1-a-q2", "source-top-mid", "target-left-mid"),
    createEdge("q1-b-q3", "source-bottom-mid", "target-left-mid"),

    createEdge("q2-a-q4", "source-right-mid", "target-left-mid"),
    createEdge("q2-b-q3", "source-bottom-right", "target-top-right"),
    
    createEdge("q3-a-q2", "source-top-left", "target-bottom-left"),
    createEdge("q3-b-q6", "source-right-mid", "target-left-mid"),

    createEdge("q4-a-q7", "source-right-mid", "target-left-mid"),
    createEdge("q4-b-q5", "source-bottom-mid", "target-top-mid"),

    createEdge("q5-a-q9", "source-right-top", "target-left-bottom"),
    createEdge("q5-b-q6", "source-bottom-mid", "target-top-mid"),

    createEdge("q6-a-q8", "source-right-top", "target-bottom-left"),
    createEdge("q6-b-q10", "source-right-mid", "target-left-mid"),

    createEdge("q7-a-q7", "source-top-left", "target-right-top"),
    createEdge("q7-b-q9", "source-right-mid", "target-left-mid"),

    createEdge("q8-a-q4", "source-top-left", "target-bottom-right"),
    createEdge("q8-b-q9", "source-top-right", "target-bottom-left"),

    createEdge("q9-a-q11", "source-right-mid", "target-left-mid"),
    createEdge("q9-b-q12", "source-bottom-right", "target-left-mid"),

    createEdge("q10-a-q9", "source-top-mid", "target-bottom-mid"),
    createEdge("q10-b-q10", "source-bottom-left", "target-right-bottom"),

    createEdge("q11-a-q11", "source-top-left", "target-right-top"),
    createEdge("q11-b-q14", "source-right-mid", "target-top-right"),

    createEdge("q12-a-q13", "source-bottom-mid", "target-top-mid"),
    createEdge("q12-b-q12", "source-top-left", "target-right-top"),
    
    createEdge("q13-a-q16", "source-right-mid", "target-left-mid"),
    createEdge("q13-b-q14", "source-right-top", "target-bottom-left"),

    createEdge("q14-a-q15", "source-right-top", "target-left-top"),
    createEdge("q14-b-q12", "source-left-mid", "target-right-mid"),

    createEdge("q15-a-q16", "source-bottom-mid", "target-top-mid"),
    createEdge("q15-b-q14", "source-left-bottom", "target-right-bottom"),

    createEdge("q16-a-q11", "source-right-top", "target-bottom-mid"),
    createEdge("q16-b-q14", "source-left-top", "target-bottom-right"),
];
