import { getSeasonSport } from "../questionnaireCheck";

describe("getSeasonSport", () => {
  it("handles sparse category and league arrays without throwing", () => {
    expect(
      getSeasonSport({
        categories: [null],
        leagues: [null],
      }),
    ).toBe("pickleball");
  });

  it("reads the first valid category or league sport", () => {
    expect(
      getSeasonSport({
        categories: [{ game_type: "TENNIS" }],
      }),
    ).toBe("tennis");

    expect(
      getSeasonSport({
        categories: [],
        leagues: [{ sportType: "PADEL" }],
      }),
    ).toBe("padel");
  });
});
