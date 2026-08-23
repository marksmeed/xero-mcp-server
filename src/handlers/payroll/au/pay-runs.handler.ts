import {
  payrollAu,
  payrollOptions,
  payrollRequest,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import {
  AuPayRun,
  AuPayrollCalendar,
  AuPayslip,
  AuPayslipLines,
} from "../../../types/payroll-au-types.js";

export interface ListAuFilters {
  where?: string;
  order?: string;
  page?: number;
}

export async function listAuPayRuns(
  filters: ListAuFilters = {},
): Promise<XeroClientResponse<AuPayRun[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getPayRuns(
      tenantId,
      undefined, // ifModifiedSince
      filters.where,
      filters.order,
      filters.page,
      payrollOptions(),
    );
    return response.body.payRuns ?? [];
  });
}

export async function getAuPayRun(
  payRunID: string,
): Promise<XeroClientResponse<AuPayRun | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getPayRun(
      tenantId,
      payRunID,
      payrollOptions(),
    );
    return response.body.payRuns?.[0] ?? null;
  });
}

export async function createAuPayRun(
  payRun: AuPayRun,
): Promise<XeroClientResponse<AuPayRun | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.createPayRun(
      tenantId,
      [payRun],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.payRuns?.[0] ?? null;
  });
}

/**
 * Update a draft pay run. Setting `payRunStatus` to POSTED posts the pay run,
 * which is not reversible through the API.
 */
export async function updateAuPayRun(
  payRunID: string,
  payRun: AuPayRun,
): Promise<XeroClientResponse<AuPayRun | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.updatePayRun(
      tenantId,
      payRunID,
      [payRun],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.payRuns?.[0] ?? null;
  });
}

export async function getAuPayslip(
  payslipID: string,
): Promise<XeroClientResponse<AuPayslip | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getPayslip(
      tenantId,
      payslipID,
      payrollOptions(),
    );
    return response.body.payslip ?? null;
  });
}

export async function updateAuPayslip(
  payslipID: string,
  payslipLines: AuPayslipLines,
): Promise<XeroClientResponse<AuPayslip | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.updatePayslip(
      tenantId,
      payslipID,
      [payslipLines],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.payslips?.[0] ?? null;
  });
}

export async function listAuPayrollCalendars(
  filters: ListAuFilters = {},
): Promise<XeroClientResponse<AuPayrollCalendar[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getPayrollCalendars(
      tenantId,
      undefined, // ifModifiedSince
      filters.where,
      filters.order,
      filters.page,
      payrollOptions(),
    );
    return response.body.payrollCalendars ?? [];
  });
}

export async function getAuPayrollCalendar(
  payrollCalendarID: string,
): Promise<XeroClientResponse<AuPayrollCalendar | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getPayrollCalendar(
      tenantId,
      payrollCalendarID,
      payrollOptions(),
    );
    return response.body.payrollCalendars?.[0] ?? null;
  });
}

export async function createAuPayrollCalendar(
  calendar: AuPayrollCalendar,
): Promise<XeroClientResponse<AuPayrollCalendar | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.createPayrollCalendar(
      tenantId,
      [calendar],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.payrollCalendars?.[0] ?? null;
  });
}
