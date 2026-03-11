import { formatEntryFee } from "../formatEntryFee";

describe("formatEntryFee", () => {
  it("formats numeric and string entry fees", () => {
    expect(formatEntryFee(10)).toBe("10.00");
    expect(formatEntryFee("25.5")).toBe("25.50");
  });

  it("returns null for missing or invalid values", () => {
    expect(formatEntryFee(undefined)).toBeNull();
    expect(formatEntryFee(null)).toBeNull();
    expect(formatEntryFee("")).toBeNull();
    expect(formatEntryFee("not-a-number")).toBeNull();
  });
});
