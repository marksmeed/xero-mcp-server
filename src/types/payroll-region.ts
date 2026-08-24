/**
 * The three Xero Payroll product regions.
 *
 * AU is served by the older Payroll v1 API (`payrollAUApi`), while NZ and UK
 * are served by the Payroll v2 APIs (`payrollNZApi` / `payrollUKApi`). The two
 * generations expose different models and endpoints, so most payroll handlers
 * branch on this value.
 */
export type PayrollRegion = "AU" | "NZ" | "UK";

export const PAYROLL_REGIONS: PayrollRegion[] = ["AU", "NZ", "UK"];

export const isPayrollRegion = (value: unknown): value is PayrollRegion =>
  typeof value === "string" &&
  (PAYROLL_REGIONS as string[]).includes(value.toUpperCase());

const REGION_BY_COUNTRY: Record<string, PayrollRegion> = {
  AU: "AU",
  NZ: "NZ",
  GB: "UK",
};

/**
 * Work out which Xero Payroll product an organisation uses.
 *
 * `version` is the authoritative signal: it carries the regional edition,
 * including the "ONRAMP" migration variants (AUONRAMP, NZONRAMP, UKONRAMP).
 * When a version is reported it decides the answer on its own - a GB
 * organisation on the GLOBAL edition has no Xero Payroll UK product, so its
 * country code must not be allowed to override the edition. `countryCode` is
 * only consulted for organisations that report no version at all.
 *
 * Returns null for editions with no Xero Payroll product, such as GLOBAL and
 * US, in which case no payroll tools are registered.
 */
export function resolvePayrollRegion(
  version?: string,
  countryCode?: string,
): PayrollRegion | null {
  if (version) {
    const edition = version.toUpperCase();
    return (
      PAYROLL_REGIONS.find((region) => edition.startsWith(region)) ?? null
    );
  }

  const country = countryCode?.toUpperCase();

  return country ? (REGION_BY_COUNTRY[country] ?? null) : null;
}
