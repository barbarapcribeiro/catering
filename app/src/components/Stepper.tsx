import { Fragment } from "react";

export function Stepper({ steps, current }: { steps: { title: string; sub: string }[]; current: number }) {
  return (
    <div className="stepper">
      {steps.map((st, i) => {
        const num = i + 1;
        const isCurrent = num === current;
        const isDone = num < current;
        return (
          <Fragment key={num}>
            <div className="stepper__step">
              <div
                className="stepper__circle"
                style={{
                  background: isCurrent ? "var(--color-primary)" : isDone ? "var(--color-success-soft)" : "#eaeef5",
                  color: isCurrent ? "#fff" : isDone ? "var(--color-success)" : "var(--color-text-muted)",
                }}
              >
                {num}
              </div>
              <div>
                <div className="stepper__title" style={{ color: isCurrent ? "var(--color-text)" : "var(--color-text-muted)" }}>
                  {st.title}
                </div>
                <div className="stepper__sub">{st.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <svg className="stepper__chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d3dae6" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
