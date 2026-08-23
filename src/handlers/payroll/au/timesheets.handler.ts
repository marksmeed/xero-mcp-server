import {
  payrollAu,
  payrollOptions,
  payrollRequest,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import { AuTimesheet } from "../../../types/payroll-au-types.js";

export interface ListAuTimesheetFilters {
  where?: string;
  order?: string;
  page?: number;
}

export async function listAuTimesheets(
  filters: ListAuTimesheetFilters = {},
): Promise<XeroClientResponse<AuTimesheet[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getTimesheets(
      tenantId,
      undefined, // ifModifiedSince
      filters.where,
      filters.order,
      filters.page,
      payrollOptions(),
    );
    return response.body.timesheets ?? [];
  });
}

export async function getAuTimesheet(
  timesheetID: string,
): Promise<XeroClientResponse<AuTimesheet | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getTimesheet(
      tenantId,
      timesheetID,
      payrollOptions(),
    );
    return response.body.timesheet ?? null;
  });
}

export async function createAuTimesheet(
  timesheet: AuTimesheet,
): Promise<XeroClientResponse<AuTimesheet | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.createTimesheet(
      tenantId,
      [timesheet],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.timesheets?.[0] ?? null;
  });
}

/**
 * AU has no separate approve/revert or line endpoints - the timesheet is
 * replaced wholesale, and `status` drives the approval workflow.
 */
export async function updateAuTimesheet(
  timesheetID: string,
  timesheet: AuTimesheet,
): Promise<XeroClientResponse<AuTimesheet | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.updateTimesheet(
      tenantId,
      timesheetID,
      [timesheet],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.timesheets?.[0] ?? null;
  });
}
