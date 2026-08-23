import {
  payrollRequest,
  payrollV2,
  payrollOptions,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import {
  PayrollV2Timesheet,
  PayrollV2TimesheetLine,
} from "../../../types/payroll-v2.js";

export interface ListTimesheetsFilters {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

export async function listPayrollTimesheets(
  filters: ListTimesheetsFilters = {},
): Promise<XeroClientResponse<PayrollV2Timesheet[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getTimesheets(
      tenantId,
      filters.page,
      filters.employeeId ? `employeeId==${filters.employeeId}` : undefined,
      filters.status,
      filters.startDate,
      filters.endDate,
      undefined, // sort
      payrollOptions(),
    );
    return response.body.timesheets ?? [];
  });
}

export async function getPayrollTimesheet(
  timesheetID: string,
): Promise<XeroClientResponse<PayrollV2Timesheet | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getTimesheet(
      tenantId,
      timesheetID,
      payrollOptions(),
    );
    return response.body.timesheet ?? null;
  });
}

export async function createPayrollTimesheet(
  timesheet: PayrollV2Timesheet,
): Promise<XeroClientResponse<PayrollV2Timesheet | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createTimesheet(
      tenantId,
      timesheet,
      payrollOptions(),
    );
    return response.body.timesheet ?? null;
  });
}

export async function deletePayrollTimesheet(
  timesheetID: string,
): Promise<XeroClientResponse<string>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    await api.deleteTimesheet(tenantId, timesheetID, payrollOptions());
    return timesheetID;
  });
}

export async function approvePayrollTimesheet(
  timesheetID: string,
): Promise<XeroClientResponse<PayrollV2Timesheet | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.approveTimesheet(
      tenantId,
      timesheetID,
      payrollOptions(),
    );
    return response.body.timesheet ?? null;
  });
}

export async function revertPayrollTimesheet(
  timesheetID: string,
): Promise<XeroClientResponse<PayrollV2Timesheet | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.revertTimesheet(
      tenantId,
      timesheetID,
      payrollOptions(),
    );
    return response.body.timesheet ?? null;
  });
}

export async function addPayrollTimesheetLine(
  timesheetID: string,
  timesheetLine: PayrollV2TimesheetLine,
): Promise<XeroClientResponse<PayrollV2TimesheetLine | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createTimesheetLine(
      tenantId,
      timesheetID,
      timesheetLine,
      payrollOptions(),
    );
    return response.body.timesheetLine ?? null;
  });
}

export async function updatePayrollTimesheetLine(
  timesheetID: string,
  timesheetLineID: string,
  timesheetLine: PayrollV2TimesheetLine,
): Promise<XeroClientResponse<PayrollV2TimesheetLine | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.updateTimesheetLine(
      tenantId,
      timesheetID,
      timesheetLineID,
      timesheetLine,
      payrollOptions(),
    );
    return response.body.timesheetLine ?? null;
  });
}

export async function deletePayrollTimesheetLine(
  timesheetID: string,
  timesheetLineID: string,
): Promise<XeroClientResponse<string>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    await api.deleteTimesheetLine(
      tenantId,
      timesheetID,
      timesheetLineID,
      payrollOptions(),
    );
    return timesheetLineID;
  });
}
