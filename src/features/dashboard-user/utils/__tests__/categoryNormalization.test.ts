import { normalizeCategoriesFromSeason } from "../categoryNormalization";

describe("normalizeCategoriesFromSeason", () => {
  it("filters sparse category arrays", () => {
    expect(
      normalizeCategoriesFromSeason({
        categories: [null, { id: "cat-1", name: "Open Singles" }, undefined],
      }),
    ).toEqual([{ id: "cat-1", name: "Open Singles" }]);
  });

  it("normalizes a singular category field", () => {
    expect(
      normalizeCategoriesFromSeason({
        category: { id: "cat-2", name: "Mixed Doubles" },
      }),
    ).toEqual([{ id: "cat-2", name: "Mixed Doubles" }]);
  });
});
