import React from "react";

type LibraryPanelProps = {
  items: Array<{ id: string; title: string; type: string }>;
};

export function LibraryPanel({ items }: LibraryPanelProps) {
  return (
    <section className="pane">
      <header className="paneHeader">
        <h2>Library</h2>
      </header>
      <div className="paneBody">
        {items.length === 0 ? (
          <p>No library items yet.</p>
        ) : (
          items.map((item) => <div key={item.id}>{item.title}</div>)
        )}
      </div>
    </section>
  );
}
