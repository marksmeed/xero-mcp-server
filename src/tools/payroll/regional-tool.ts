import { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";

import { ToolDefinition } from "../../types/tool-definition.js";
import { PayrollRegion } from "../../types/payroll-region.js";

type PayrollTool = () => ToolDefinition<ZodRawShapeCompat>;

/**
 * A payroll tool together with the regions whose API actually supports it.
 *
 * Only the detected region's tools are registered, so the model never sees a
 * tool that would fail with "not supported in this region".
 */
export interface RegionalTool {
  tool: PayrollTool;
  regions: PayrollRegion[];
}

export const forRegions = (
  regions: PayrollRegion[],
  tool: PayrollTool,
): RegionalTool => ({ tool, regions });

/** Both Payroll v2 regions. */
export const V2: PayrollRegion[] = ["UK", "NZ"];
export const UK_ONLY: PayrollRegion[] = ["UK"];
export const NZ_ONLY: PayrollRegion[] = ["NZ"];
export const AU_ONLY: PayrollRegion[] = ["AU"];
