import { describe, expect, it } from "vitest";
import { syncWithServer } from "../lib/sync";

describe("syncWithServer", () => {
  it("executes cleanly as deprecated no-op for React Query migration", async () => {
    await expect(syncWithServer()).resolves.toBeUndefined();
  });
});

