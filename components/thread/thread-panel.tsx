type ThreadPanelProps = {
  messages: Array<{ id: string; role: string; content: string }>;
};

export function ThreadPanel({ messages }: ThreadPanelProps) {
  return (
    <section className="pane">
      <header className="paneHeader">
        <h2>Thread</h2>
      </header>
      <div className="paneBody">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => <p key={message.id}>{message.content}</p>)
        )}
      </div>
    </section>
  );
}
