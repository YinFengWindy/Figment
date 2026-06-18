import { expect, test } from "@playwright/test";

test("room screen renders the three-pane shell", async ({ page }) => {
  await page.goto("/rooms/demo-room");

  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Canvas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Thread" })).toBeVisible();
});
