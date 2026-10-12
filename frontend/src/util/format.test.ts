import {describe, expect, it} from "vitest";
import {formatElo, formatEloChange, formatOrdinal} from "./format";

describe("formatEloChange", () => {
    it("signs gains and losses with a true minus sign", () => {
        expect(formatEloChange(12.34)).toBe("+12.3");
        expect(formatEloChange(-7)).toBe("−7.0");
        expect(formatEloChange(0)).toBe("0.0");
    });
});

describe("formatElo", () => {
    it("always shows one decimal place", () => {
        expect(formatElo(1500)).toBe("1,500.0");
    });
});

describe("formatOrdinal", () => {
    it("gives English ordinal suffixes, including the teens", () => {
        expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(formatOrdinal))
            .toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
    });
});
