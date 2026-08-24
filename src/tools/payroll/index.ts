import { xeroClient } from "../../clients/xero-client.js";
import { PayrollRegion } from "../../types/payroll-region.js";
import { ToolList } from "../../types/tool-list.js";
import { RegionalTool } from "./regional-tool.js";

import { AuEmployeeTools } from "./au/employees.tools.js";
import { AuLeaveTools } from "./au/leave.tools.js";
import { AuPayRunTools } from "./au/pay-runs.tools.js";
import { AuSettingsTools } from "./au/settings.tools.js";
import { AuTimesheetTools } from "./au/timesheets.tools.js";
import { V2EmployeeTools } from "./v2/employees.tools.js";
import { V2LeaveTools } from "./v2/leave.tools.js";
import { V2PayRunTools } from "./v2/pay-runs.tools.js";
import { V2SettingsTools } from "./v2/settings.tools.js";
import { V2TimesheetTools } from "./v2/timesheets.tools.js";

const PAYROLL_TOOLS: RegionalTool[] = [
  ...V2EmployeeTools,
  ...V2LeaveTools,
  ...V2PayRunTools,
  ...V2SettingsTools,
  ...V2TimesheetTools,
  ...AuEmployeeTools,
  ...AuLeaveTools,
  ...AuPayRunTools,
  ...AuSettingsTools,
  ...AuTimesheetTools,
];

/**
 * The payroll tools that apply to a given region.
 *
 * UK, NZ and AU expose different endpoints under the same concepts, so several
 * tools share a name across regions with a region-specific implementation. Only
 * one region's set is ever registered, which keeps the names unambiguous.
 */
export const getPayrollToolsForRegion = (region: PayrollRegion): ToolList =>
  PAYROLL_TOOLS.filter(({ regions }) => regions.includes(region)).map(
    ({ tool }) => tool,
  );

/**
 * Detect the organisation's payroll region and return its tools.
 *
 * Payroll is optional: an organisation on an edition without a Xero Payroll
 * product, or a connection without payroll scopes, simply gets no payroll
 * tools. That must not stop the accounting tools from loading, so detection
 * failures are reported on stderr and swallowed.
 */
export async function getPayrollTools(): Promise<ToolList> {
  try {
    const region = await xeroClient.getPayrollRegion();

    if (!region) {
      console.error(
        "Xero Payroll: no payroll region detected for this organisation - payroll tools were not registered.",
      );
      return [];
    }

    const tools = getPayrollToolsForRegion(region);
    console.error(
      `Xero Payroll: detected ${region} - registered ${tools.length} payroll tools.`,
    );
    return tools;
  } catch (error) {
    console.error(
      "Xero Payroll: could not determine the payroll region, payroll tools were not registered.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
