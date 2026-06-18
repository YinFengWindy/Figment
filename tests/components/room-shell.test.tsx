import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomShell } from "@/components/layout/room-shell";

describe("RoomShell", () => {
  it("renders library, canvas, and thread panes", () => {
    render(
      <RoomShell
        room={{ id: "room_1", name: "Phoebe Lab" }}
        libraryItems={[]}
        canvasNodes={[]}
        canvasEdges={[]}
        thread={[]}
      />
    );

    expect(screen.getByRole("heading", { name: "Phoebe Lab" })).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("Thread")).toBeInTheDocument();
  });
});
