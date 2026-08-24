import {
  payrollRequest,
  payrollV2,
  payrollOptions,
  requireMethod,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import {
  PayrollV2PayRun,
  PayrollV2PayRunCalendar,
  PayrollV2Payslip,
} from "../../../types/payroll-v2.js";

export async function listPayrollPayRuns(
  status?: "Draft" | "Posted",
  page?: number,
): Promise<XeroClientResponse<PayrollV2PayRun[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getPayRuns(
      tenantId,
      page,
      status,
      payrollOptions(),
    );
    return response.body.payRuns ?? [];
  });
}

export async function getPayrollPayRun(
  payRunID: string,
): Promise<XeroClientResponse<PayrollV2PayRun | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getPayRun(
      tenantId,
      payRunID,
      payrollOptions(),
    );
    return response.body.payRun ?? null;
  });
}

export async function createPayrollPayRun(
  payRun: PayrollV2PayRun,
): Promise<XeroClientResponse<PayrollV2PayRun | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const create = requireMethod(
      api.createPayRun,
      "create-payroll-pay-run",
      region,
    );
    const response = await create.call(api, tenantId, payRun, payrollOptions());
    return response.body.payRun ?? null;
  });
}

export async function listPayrollPayslips(
  payRunID: string,
  page?: number,
): Promise<XeroClientResponse<PayrollV2Payslip[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getPaySlips(
      tenantId,
      payRunID,
      page,
      payrollOptions(),
    );
    return response.body.paySlips ?? [];
  });
}

export async function getPayrollPayslip(
  payslipID: string,
): Promise<XeroClientResponse<PayrollV2Payslip | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getPaySlip(
      tenantId,
      payslipID,
      payrollOptions(),
    );
    return response.body.paySlip ?? null;
  });
}

export async function updatePayrollPayslipLines(
  payslipID: string,
  paySlip: PayrollV2Payslip,
): Promise<XeroClientResponse<PayrollV2Payslip | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const update = requireMethod(
      api.updatePaySlipLineItems,
      "update-payroll-payslip",
      region,
    );
    const response = await update.call(
      api,
      tenantId,
      payslipID,
      paySlip,
      payrollOptions(),
    );
    return response.body.paySlip ?? null;
  });
}

export async function listPayrollCalendars(
  page?: number,
): Promise<XeroClientResponse<PayrollV2PayRunCalendar[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getPayRunCalendars(
      tenantId,
      page,
      payrollOptions(),
    );
    return response.body.payRunCalendars ?? [];
  });
}

export async function getPayrollCalendar(
  payrollCalendarID: string,
): Promise<XeroClientResponse<PayrollV2PayRunCalendar | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getPayRunCalendar(
      tenantId,
      payrollCalendarID,
      payrollOptions(),
    );
    return response.body.payRunCalendar ?? null;
  });
}

export async function createPayrollCalendar(
  calendar: PayrollV2PayRunCalendar,
): Promise<XeroClientResponse<PayrollV2PayRunCalendar | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createPayRunCalendar(
      tenantId,
      calendar,
      payrollOptions(),
    );
    return response.body.payRunCalendar ?? null;
  });
}
