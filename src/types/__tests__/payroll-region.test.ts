import { describe, it, expect } from "vitest";

import { isPayrollRegion, resolvePayrollRegion } from "../payroll-region.js";

describe("resolvePayrollRegion", () => {
  it.each([
    ["AU", "AU"],
    ["NZ", "NZ"],
    ["UK", "UK"],
  ] as const)("maps the %s edition to %s", (version, expected) => {
    expect(resolvePayrollRegion(version)).toBe(expected);
  });

  it.each([
    ["AUONRAMP", "AU"],
    ["NZONRAMP", "NZ"],
    ["UKONRAMP", "UK"],
  ] as const)("maps the %s migration edition to %s", (version, expected) => {
    expect(resolvePayrollRegion(version)).toBe(expected);
  });

  it.each(["GLOBAL", "US", "GLOBALONRAMP", "USONRAMP"])(
    "returns null for the %s edition, which has no Xero Payroll product",
    (version) => {
      expect(resolvePayrollRegion(version)).toBeNull();
    },
  );

  it("falls back to the country code when no version is reported", () => {
    expect(resolvePayrollRegion(undefined, "GB")).toBe("UK");
    expect(resolvePayrollRegion(undefined, "AU")).toBe("AU");
    expect(resolvePayrollRegion(undefined, "NZ")).toBe("NZ");
  });

  it("returns null for a country with no payroll product", () => {
    expect(resolvePayrollRegion(undefined, "US")).toBeNull();
    expect(resolvePayrollRegion("GLOBAL", "FR")).toBeNull();
  });

  it("returns null when the organisation reports neither", () => {
    expect(resolvePayrollRegion()).toBeNull();
  });

  it("is not case sensitive", () => {
    expect(resolvePayrollRegion("uk")).toBe("UK");
    expect(resolvePayrollRegion(undefined, "gb")).toBe("UK");
  });

  it("prefers the version over the country code", () => {
    // A UK organisation reporting a GLOBAL edition has no payroll product,
    // even though its country code would otherwise map to UK.
    expect(resolvePayrollRegion("GLOBAL", "GB")).toBeNull();
  });
});

describe("isPayrollRegion", () => {
  it("accepts the three payroll regions in any case", () => {
    expect(isPayrollRegion("AU")).toBe(true);
    expect(isPayrollRegion("nz")).toBe(true);
    expect(isPayrollRegion("Uk")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isPayrollRegion("US")).toBe(false);
    expect(isPayrollRegion("")).toBe(false);
    expect(isPayrollRegion(undefined)).toBe(false);
    expect(isPayrollRegion(42)).toBe(false);
  });
});
