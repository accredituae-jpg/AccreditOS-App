import { describe, it, expect } from "vitest";
import { unwrapApiArray } from "@/lib/api/client";

describe("unwrapApiArray", () => {
  it("returns the array from a wrapped API response", () => {
    expect(
      unwrapApiArray({ success: true, message: "ok", data: [{ id: "1" }] }),
    ).toEqual([{ id: "1" }]);
  });

  it("falls back to a raw array value", () => {
    expect(unwrapApiArray([{ id: "2" }])).toEqual([{ id: "2" }]);
  });

  it("returns an empty array when the payload is not an array", () => {
    expect(unwrapApiArray({ success: true, message: "ok" } as any)).toEqual([]);
  });
});
