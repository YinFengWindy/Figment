"use client";

import { useState } from "react";

export function CommandComposer({ roomId }: { roomId: string }) {
  const [value, setValue] = useState("");

  return (
    <form className="composer" data-room-id={roomId}>
      <textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="@Phoebe @Jubi convenience store fight, cinematic wide shot"
      />
      <button type="submit">Plan</button>
    </form>
  );
}
