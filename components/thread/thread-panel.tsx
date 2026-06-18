import { CommandComposer } from "@/components/thread/command-composer";
import { PlanCard } from "@/components/thread/plan-card";

type ThreadPanelProps = {
  roomId?: string;
  messages: Array<{ id: string; role: string; content: string }>;
};

export function ThreadPanel({ roomId = "room_1", messages }: ThreadPanelProps) {
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
        <PlanCard plan={{ scene: "Waiting for first plan", action: "Type a prompt to begin" }} />
        <CommandComposer roomId={roomId} />
      </div>
    </section>
  );
}
