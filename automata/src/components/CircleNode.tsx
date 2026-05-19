import { Handle, Position } from "@xyflow/react";

import "../node.css";


export interface CircleNodeData {
    isAcceptState: boolean;
    isHighlighting: boolean;
    isHighlighted: boolean;
    isValid: boolean | null
    label: string;
}

interface CircleNodeProps {
    data: CircleNodeData
}

export const CircleNode: React.FC<CircleNodeProps> = ({ data }) => {
    const { isAcceptState, isHighlighting, isHighlighted, isValid, label } = data;

    const classes = [
        "state-circle",
        isAcceptState ? "accept-state" : "",
        isHighlighting ? "highlighting" : "",
        isHighlighted ? "highlighted" : "",
        isValid == null ? "" : (isValid ? 'is-valid' : 'is-invalid')
    ].join(" ");

    return (
        <div className={classes}>
            {label}

            {/* TOP SIDE */}
            <Handle
                type="target"
                position={Position.Top}
                id="target-top-left"
                className="horizontal-left"
            />
            <Handle
                type="source"
                position={Position.Top}
                id="source-top-left"
                className="horizontal-left"
            />
            <Handle
                type="target"
                position={Position.Top}
                id="target-top-mid"
                className="horizontal-mid"
            />
            <Handle
                type="source"
                position={Position.Top}
                id="source-top-mid"
                className="horizontal-mid"
            />
            <Handle
                type="target"
                position={Position.Top}
                id="target-top-right"
                className="horizontal-right"
            />
            <Handle
                type="source"
                position={Position.Top}
                id="source-top-right"
                className="horizontal-right"
            />

            {/* BOTTOM SIDE */}
            <Handle
                type="target"
                position={Position.Bottom}
                id="target-bottom-left"
                className="horizontal-left"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="source-bottom-left"
                className="horizontal-left"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="target-bottom-mid"
                className="horizontal-mid"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="source-bottom-mid"
                className="horizontal-mid"
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id="target-bottom-right"
                className="horizontal-right"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="source-bottom-right"
                className="horizontal-right"
            />

            {/* LEFT SIDE */}
            <Handle
                type="target"
                position={Position.Left}
                id="target-left-top"
                className="vertical-top"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="source-left-top"
                className="vertical-top"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="target-left-mid"
                className="vertical-mid"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="source-left-mid"
                className="vertical-mid"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="target-left-bottom"
                className="vertical-bottom"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="source-left-bottom"
                className="vertical-bottom"
            />

            {/* RIGHT SIDE */}
            <Handle
                type="target"
                position={Position.Right}
                id="target-right-top"
                className="vertical-top"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="source-right-top"
                className="vertical-top"
            />
            <Handle
                type="target"
                position={Position.Right}
                id="target-right-mid"
                className="vertical-mid"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="source-right-mid"
                className="vertical-mid"
            />
            <Handle
                type="target"
                position={Position.Right}
                id="target-right-bottom"
                className="vertical-bottom"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="source-right-bottom"
                className="vertical-bottom"
            />
        </div>
    );
};
