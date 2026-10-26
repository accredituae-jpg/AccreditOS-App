import { describe, expect, it } from "vitest";
import { formatAED, DIRHAM_SYMBOL } from "../lib/utils";

describe("formatAED", () => {
  it("formats numeric amounts with official Dirham symbol", () => {
    expect(formatAED(1500, true)).toBe(`${DIRHAM_SYMBOL} 1,500`);
    expect(formatAED(1500, true, false)).toBe("AED 1,500");
  });

  it("returns a safe zero value for missing amounts", () => {
    expect(formatAED(undefined, true)).toBe(`${DIRHAM_SYMBOL} 0`);
    expect(formatAED(null)).toBe(`${DIRHAM_SYMBOL} 0`);
    expect(formatAED("", true)).toBe(`${DIRHAM_SYMBOL} 0`);
  });

  it("handles invalid numeric strings gracefully", () => {
    expect(formatAED("not-a-number", true)).toBe(`${DIRHAM_SYMBOL} 0`);
  });
});

import { convertAmountToWords } from "../features/billing/utils/billing.utils";

describe("convertAmountToWords", () => {
  it("converts 0 correctly", () => {
    expect(convertAmountToWords(0)).toBe("Zero Only");
  });

  it("converts integer amounts correctly", () => {
    expect(convertAmountToWords(1500)).toBe("One Thousand Five Hundred Only");
  });

  it("converts decimal amounts with Fils correctly", () => {
    expect(convertAmountToWords(2500.5)).toBe("Two Thousand Five Hundred and Fils Fifty Only");
  });

  it("converts large amounts correctly", () => {
    expect(convertAmountToWords(1000000)).toBe("One Million Only");
  });
});

