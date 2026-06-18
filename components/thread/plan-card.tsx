import React from "react";

export function PlanCard({ plan }: { plan: { scene?: string; action?: string; riskNotes?: string[] } }) {
  return (
    <article className="planCard">
      <h3>Plan</h3>
      <p>{plan.scene ?? "No scene specified yet."}</p>
      <p>{plan.action ?? "No action specified yet."}</p>
      {plan.riskNotes?.length ? <p>{plan.riskNotes.join(", ")}</p> : null}
    </article>
  );
}
