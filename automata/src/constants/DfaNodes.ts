import type { Node } from "@xyflow/react";

const createNode = (
    id: string,
    x: number,
    y: number,
    isAccept: boolean = false,
    label: string = "",
): Node => ({
    id,
    type: "circle",
    position: { x, y },
    data: {
        label: label,
        isAcceptState: isAccept,
        isHighlighting: false,
        isHighlighted: false,
        isValid: null,
    },
});

export const Dfa01Nodes: Node[] = [

    createNode("q0", 0, 0, false, "-"),
    createNode("q1", 150, -200, false,),
    createNode("q2", 150, 0, false,),
    createNode('q3', 150, 200, false,),
    createNode('q4', 300, 0, false,),
    createNode('q5', 450, -200, false,),
    createNode('q6', 450, 200, false,),
    createNode('q7', 600, -300, true,),
    createNode('q8', 600, 0, false,),
    createNode('q9', 600, 200, false,),
    createNode('q10', 750, -200, false,),
    createNode('q11', 750, 200, false,),
    createNode('q12', 900, -200, false,),
    createNode('q13', 900, 0, false,),
    createNode('q14', 1050, -200, true, "+"),
    createNode('q15', 1050, 0, true, "+"),
    createNode('q16', 1200, -300, true, "+"),
    createNode('q17', 1200, 200, true, "+"),

    // createNode("q0", 0, 0, false, "q0"),
    // createNode("q1", 150, -200, false, "q1"),
    // createNode("q2", 150, 0, false, "q2"),
    // createNode('q3', 150, 200, false, "q3"),
    // createNode('q4', 300, 0, false, "q4"),
    // createNode('q5', 450, -200, false, "q5"),
    // createNode('q6', 450, 200, false, "q6"),
    // createNode('q7', 600, -300, true, "q7"),
    // createNode('q8', 600, 0, false, "q8"),
    // createNode('q9', 600, 200, false, "q9"),
    // createNode('q10', 750, -200, false, "q10"),
    // createNode('q11', 750, 200, false, "q11"),
    // createNode('q12', 900, -200, false, "q12"),
    // createNode('q13', 900, 0, false, "q13"),
    // createNode('q14', 1050, -200, true, "q14"),
    // createNode('q15', 1050, 0, true, "q15"),
    // createNode('q16', 1200, -300, true, "q16"),
    // createNode('q17', 1200, 200, true, "q17"),


];

export const DfaAbNodes: Node[] = [
    createNode('q0', 0, 0, false, "-"),
    createNode('q1', 150, 0),
    createNode('q2', 300, -200),
    createNode('q3', 300, 200),
    createNode('q4', 450, -200),
    createNode('q5', 450, 0),
    createNode('q6', 450, 200),
    createNode('q7', 600, -200),
    createNode('q8', 600, 0),
    createNode('q9', 750, -200),
    createNode('q10', 750, 200),
    createNode('q11', 1350, -200),
    createNode('q12', 900, 0),
    createNode('q13', 900, 200),
    createNode('q14', 1050, 0),
    createNode('q15', 1200, 0, true, "+"),
    createNode('q16', 1200, 200, true, "+"),
];
