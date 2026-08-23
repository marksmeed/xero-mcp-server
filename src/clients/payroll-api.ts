import { xeroClient } from "./xero-client.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";
import { formatError } from "../helpers/format-error.js";
import { PayrollRegion } from "../types/payroll-region.js";
import { PayrollV2Api } from "../types/payroll-v2.js";
import { XeroClientResponse } from "../types/tool-response.js";

/** Request options every payroll call passes so Xero sees our user agent. */
export const payrollOptions = getClientHeaders;

export interface PayrollV2Context {
  api: PayrollV2Api;
  region: Extract<PayrollRegion, "UK" | "NZ">;
  tenantId: string;
}

/**
 * Authenticate and resolve the Payroll v2 client for this organisation.
 *
 * UK and NZ are structurally the same API, so both are exposed through the
 * `PayrollV2Api` facade. The cast is the single place where the generated SDK
 * types are traded for the shared shape.
 */
export async function payrollV2(): Promise<PayrollV2Context> {
  await xeroClient.authenticate();

  const region = await xeroClient.getPayrollRegion();

  if (region !== "UK" && region !== "NZ") {
    throw new Error(
      `This tool requires a UK or NZ Xero Payroll organisation${
        region ? ` - this organisation is ${region}` : ""
      }.`,
    );
  }

  const api = (
    region === "UK" ? xeroClient.payrollUKApi : xeroClient.payrollNZApi
  ) as unknown as PayrollV2Api;

  return { api, region, tenantId: xeroClient.tenantId };
}

export interface PayrollAuContext {
  api: typeof xeroClient.payrollAUApi;
  tenantId: string;
}

/** Authenticate and resolve the Australian Payroll (v1) client. */
export async function payrollAu(): Promise<PayrollAuContext> {
  await xeroClient.authenticate();

  const region = await xeroClient.getPayrollRegion();

  if (region !== "AU") {
    throw new Error(
      `This tool requires an Australian Xero Payroll organisation${
        region ? ` - this organisation is ${region}` : ""
      }.`,
    );
  }

  return { api: xeroClient.payrollAUApi, tenantId: xeroClient.tenantId };
}

/**
 * Run a payroll request and normalise both outcomes into `XeroClientResponse`.
 *
 * Every payroll handler shares this wrapper so error formatting stays in one
 * place - `formatError` is what keeps bearer tokens out of the response.
 */
export async function payrollRequest<T>(
  request: () => Promise<T>,
): Promise<XeroClientResponse<T>> {
  try {
    return {
      result: await request(),
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      isError: true,
      error: formatError(error),
    };
  }
}

/**
 * Methods that exist in only one v2 region are optional on the facade. This
 * turns "not available here" into a clear message instead of a TypeError.
 */
export function requireMethod<T>(
  method: T | undefined,
  toolName: string,
  region: PayrollRegion,
): T {
  if (!method) {
    throw new Error(
      `${toolName} is not supported by Xero Payroll ${region}.`,
    );
  }
  return method;
}
