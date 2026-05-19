import React, { useEffect, useRef } from "react";
import {
    AlertTriangle,
    TerminalSquare,
    BookOpen,
    Activity,
    CheckCircle2,
} from "lucide-react";
import "../CfgVisualizer.css";
import { type TraceStep } from "../lib/CfgEngine";

interface CfgVisualizerProps {
    steps: TraceStep[];
    grammarFormal: {
        V: string[];
        T: string[];
        P: string[];
        S: string;
    };
    currentStepIndex: number;
    errorMsg: string | null;
    isSimulationComplete: boolean;
}

export const CfgVisualizer: React.FC<CfgVisualizerProps> = ({
    steps,
    grammarFormal,
    currentStepIndex,
    errorMsg,
    isSimulationComplete,
}) => {
    const traceListRef = useRef<HTMLDivElement>(null);
    const activeItemRef = useRef<HTMLDivElement>(null);

    // Auto-scroll the trace panel so the active step is always visible
    useEffect(() => {
        if (activeItemRef.current && traceListRef.current) {
            const container = traceListRef.current;
            const item = activeItemRef.current;

            const scrollTarget =
                item.offsetTop -
                container.clientHeight / 2 +
                item.clientHeight / 2;

            container.scrollTo({
                top: scrollTarget,
                behavior: "smooth",
            });
        }
    }, [currentStepIndex]);

    return (
        <div className="cfg-container">
            {/* Left Panel: Grammar Formal Definition (VTPS) */}
            <div className="cfg-panel rules-panel">
                <h3 className="panel-title">
                    <BookOpen size={16} />
                    Grammar Definition
                </h3>
                <div className="vtps-content">
                    <div className="vtps-section">
                        <span className="vtps-label">V (Variables):</span>
                        <span className="vtps-value">
                            {"{ "} {grammarFormal.V.join(", ")} {" }"}
                        </span>
                    </div>

                    <div className="vtps-section">
                        <span className="vtps-label">T (Terminals):</span>
                        <span className="vtps-value">
                            {"{ "} {grammarFormal.T.join(", ")} {" }"}
                        </span>
                    </div>

                    <div className="vtps-section">
                        <span className="vtps-label">S (Start):</span>
                        <span className="vtps-value">{grammarFormal.S}</span>
                    </div>

                    <div className="vtps-section production-section">
                        <div className="production-list">
                            <div className="production-header">
                                <span className="vtps-label">
                                    P (Production Rules):
                                </span>
                            </div>
                            <div className="rules-container">
                                {grammarFormal.P.map((rule, idx) => {
                                    const parts = rule.split("->");
                                    return (
                                        <div key={idx} className="rule-line">
                                            <span className="lhs">
                                                {parts[0].trim()}
                                            </span>
                                            <span className="arrow">→</span>
                                            <span className="rhs">
                                                {parts[1]?.trim() || "ε"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Derivation Trace */}
            <div className="cfg-panel trace-panel" ref={traceListRef}>
                <h3 className="panel-title">
                    <Activity size={16} />
                    Derivation Trace
                </h3>

                {/* Error State */}
                {errorMsg ? (
                    <div className="trace-error">
                        <div className="error-icon">
                            <AlertTriangle size={36} color="#ef4444" strokeWidth={1.5} />
                        </div>
                        <div className="error-text">String Rejected</div>
                        <div className="error-subtext">{errorMsg}</div>
                    </div>
                ) : steps.length === 0 ? (
                    /* Empty State (Waiting for Simulation) */
                    <div className="trace-empty">
                        <TerminalSquare size={42} color="#333" strokeWidth={1.2} className="empty-icon" />
                        <p>Waiting for simulation...</p>
                        <p className="trace-empty-sub">
                            Enter a valid string and click Simulate.
                        </p>
                    </div>
                ) : (
                    /* Active Trace List */
                    <div className="trace-list">
                        {steps.map((s, idx) => {
                            // Prevent rendering future steps until they are active
                            if (idx > currentStepIndex) return null;

                            const isActive = idx === currentStepIndex;
                            const isPast = idx < currentStepIndex;
                            const isFinalValid = isSimulationComplete && idx === steps.length - 1;

                            // Consolidate current focus logic to prevent duplicate spans
                            const activeFocus = idx === 0 ? s.activeNonTerminal : s.activeTerminal;

                            return (
                                <div
                                    key={idx}
                                    ref={isActive ? activeItemRef : null}
                                    className={`trace-item ${isActive ? "active" : ""} ${isPast ? "past" : ""} ${isFinalValid ? "valid-final" : ""}`.trim()}
                                >
                                    <div className="step-header">
                                        <span className="step-number">
                                            Step {s.step}
                                        </span>
                                        {isFinalValid && (
                                            <CheckCircle2 size={16} color="#4ade80" strokeWidth={2.5} />
                                        )}
                                    </div>
                                    <div className="derivation-string">
                                        <span className="done">{s.processed}</span>
                                        {activeFocus && (
                                            <span className="current-focus">
                                                ({activeFocus})
                                            </span>
                                        )}
                                        <span className="future">{s.futureNonTerminal}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};