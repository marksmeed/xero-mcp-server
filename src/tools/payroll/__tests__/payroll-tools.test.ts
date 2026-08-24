import { describe, it, expect, beforeAll } from "vitest";

import { PAYROLL_REGIONS, PayrollRegion } from "../../../types/payroll-region.js";
import { ToolList } from "../../../types/tool-list.js";

// The payroll tool registry pulls in the Xero client, which refuses to load
// without credentials. A bearer token is enough to satisfy that check - no
// request is made while only reading tool definitions.
process.env.XERO_CLIENT_BEARER_TOKEN ||= "test-token";

let getPayrollToolsForRegion: (region: PayrollRegion) => ToolList;
let accountingToolNames: string[];

const namesOf = (tools: ToolList) => tools.map((tool) => tool().name);

beforeAll(async () => {
  ({ getPayrollToolsForRegion } = await import("../index.js"));

  const [{ ListTools }, { CreateTools }, { UpdateTools }] = await Promise.all([
    import("../../list/index.js"),
    import("../../create/index.js"),
    import("../../update/index.js"),
  ]);

  accountingToolNames = namesOf([...ListTools, ...CreateTools, ...UpdateTools]);
});

describe("getPayrollToolsForRegion", () => {
  it.each(PAYROLL_REGIONS)("returns tools for %s", (region) => {
    expect(getPayrollToolsForRegion(region).length).toBeGreaterThan(0);
  });

  it.each(PAYROLL_REGIONS)(
    "registers no duplicate tool names for %s",
    (region) => {
      // Several payroll tools share a name across regions with a
      // region-specific implementation. Only one region is ever registered, so
      // the combined set must still be unique or server.tool would collide.
      const names = [
        ...accountingToolNames,
        ...namesOf(getPayrollToolsForRegion(region)),
      ];

      expect(new Set(names).size).toBe(names.length);
    },
  );

  it("keeps the payroll tool names the accounting tools do not use", () => {
    const payrollNames = namesOf(getPayrollToolsForRegion("UK"));

    expect(payrollNames).toContain("list-payroll-employees");
    expect(accountingToolNames).not.toContain("list-payroll-employees");
  });

  it("only offers AU-specific tools to AU", () => {
    expect(namesOf(getPayrollToolsForRegion("AU"))).toContain(
      "list-payroll-superfunds",
    );
    expect(namesOf(getPayrollToolsForRegion("UK"))).not.toContain(
      "list-payroll-superfunds",
    );
    expect(namesOf(getPayrollToolsForRegion("NZ"))).not.toContain(
      "list-payroll-superfunds",
    );
  });

  it("only offers UK statutory leave to UK", () => {
    expect(namesOf(getPayrollToolsForRegion("UK"))).toContain(
      "list-payroll-statutory-leave",
    );
    expect(namesOf(getPayrollToolsForRegion("NZ"))).not.toContain(
      "list-payroll-statutory-leave",
    );
  });

  it("only offers NZ working patterns and pay run creation to NZ", () => {
    const nz = namesOf(getPayrollToolsForRegion("NZ"));
    const uk = namesOf(getPayrollToolsForRegion("UK"));

    expect(nz).toContain("list-payroll-employee-working-patterns");
    expect(nz).toContain("create-payroll-pay-run");
    expect(uk).not.toContain("list-payroll-employee-working-patterns");
    // The UK API has no pay run creation endpoint.
    expect(uk).not.toContain("create-payroll-pay-run");
  });

  it("keeps the timesheet tool names that existed before the payroll expansion", () => {
    const uk = namesOf(getPayrollToolsForRegion("UK"));

    for (const name of [
      "list-timesheets",
      "get-timesheet",
      "create-timesheet",
      "delete-timesheet",
      "approve-timesheet",
      "revert-timesheet",
      "add-timesheet-line",
      "update-timesheet-line",
      "list-payroll-employee-leave",
      "list-payroll-employee-leave-balances",
      "list-payroll-employee-leave-types",
      "list-payroll-leave-periods",
      "list-payroll-leave-types",
      "list-payroll-employees",
    ]) {
      expect(uk).toContain(name);
    }
  });

  it("gives every tool a description and a schema", () => {
    for (const region of PAYROLL_REGIONS) {
      for (const tool of getPayrollToolsForRegion(region)) {
        const definition = tool();
        expect(definition.name).toMatch(/^[a-z0-9-]+$/);
        expect(definition.description.length).toBeGreaterThan(0);
        expect(definition.schema).toBeDefined();
      }
    }
  });
});
