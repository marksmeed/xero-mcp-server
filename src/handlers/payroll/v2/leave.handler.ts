import {
  payrollRequest,
  payrollV2,
  payrollOptions,
  requireMethod,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import {
  PayrollV2EmployeeLeave,
  PayrollV2EmployeeLeaveType,
  PayrollV2LeaveBalance,
  PayrollV2LeavePeriod,
  PayrollV2LeaveSetup,
  PayrollV2LeaveType,
  PayrollV2StatutoryLeaveSummary,
  PayrollV2StatutorySickLeave,
} from "../../../types/payroll-v2.js";

export async function listPayrollEmployeeLeave(
  employeeId: string,
): Promise<XeroClientResponse<PayrollV2EmployeeLeave[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getEmployeeLeaves(
      tenantId,
      employeeId,
      payrollOptions(),
    );
    return response.body.leave ?? [];
  });
}

export async function createPayrollEmployeeLeave(
  employeeId: string,
  leave: PayrollV2EmployeeLeave,
): Promise<XeroClientResponse<PayrollV2EmployeeLeave | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEmployeeLeave(
      tenantId,
      employeeId,
      leave,
      payrollOptions(),
    );
    return response.body.leave ?? null;
  });
}

export async function updatePayrollEmployeeLeave(
  employeeId: string,
  leaveID: string,
  leave: PayrollV2EmployeeLeave,
): Promise<XeroClientResponse<PayrollV2EmployeeLeave | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.updateEmployeeLeave(
      tenantId,
      employeeId,
      leaveID,
      leave,
      payrollOptions(),
    );
    return response.body.leave ?? null;
  });
}

export async function deletePayrollEmployeeLeave(
  employeeId: string,
  leaveID: string,
): Promise<XeroClientResponse<string>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    await api.deleteEmployeeLeave(
      tenantId,
      employeeId,
      leaveID,
      payrollOptions(),
    );
    return leaveID;
  });
}

export async function listPayrollEmployeeLeaveBalances(
  employeeId: string,
): Promise<XeroClientResponse<PayrollV2LeaveBalance[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getEmployeeLeaveBalances(
      tenantId,
      employeeId,
      payrollOptions(),
    );
    return response.body.leaveBalances ?? [];
  });
}

export async function listPayrollEmployeeLeaveTypes(
  employeeId: string,
): Promise<XeroClientResponse<PayrollV2EmployeeLeaveType[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getEmployeeLeaveTypes(
      tenantId,
      employeeId,
      payrollOptions(),
    );
    return response.body.leaveTypes ?? [];
  });
}

export async function createPayrollEmployeeLeaveType(
  employeeId: string,
  leaveType: PayrollV2EmployeeLeaveType,
): Promise<XeroClientResponse<PayrollV2EmployeeLeaveType | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEmployeeLeaveType(
      tenantId,
      employeeId,
      leaveType,
      payrollOptions(),
    );
    return response.body.leaveType ?? null;
  });
}

export async function listPayrollLeavePeriods(
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<XeroClientResponse<PayrollV2LeavePeriod[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getEmployeeLeavePeriods(
      tenantId,
      employeeId,
      startDate,
      endDate,
      payrollOptions(),
    );
    return response.body.periods ?? [];
  });
}

export async function listPayrollLeaveTypes(
  page?: number,
  activeOnly?: boolean,
): Promise<XeroClientResponse<PayrollV2LeaveType[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getLeaveTypes(
      tenantId,
      page,
      activeOnly,
      payrollOptions(),
    );
    return response.body.leaveTypes ?? [];
  });
}

export async function createPayrollLeaveType(
  leaveType: PayrollV2LeaveType,
): Promise<XeroClientResponse<PayrollV2LeaveType | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createLeaveType(
      tenantId,
      leaveType,
      payrollOptions(),
    );
    return response.body.leaveType ?? null;
  });
}

export async function createPayrollEmployeeLeaveSetup(
  employeeId: string,
  leaveSetup: PayrollV2LeaveSetup,
): Promise<XeroClientResponse<PayrollV2LeaveSetup | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const create = requireMethod(
      api.createEmployeeLeaveSetup,
      "create-payroll-employee-leave-setup",
      region,
    );
    const response = await create.call(
      api,
      tenantId,
      employeeId,
      leaveSetup,
      payrollOptions(),
    );
    return response.body.leaveSetup ?? null;
  });
}

export async function listPayrollStatutoryLeave(
  employeeId: string,
  activeOnly?: boolean,
): Promise<XeroClientResponse<PayrollV2StatutoryLeaveSummary[]>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const get = requireMethod(
      api.getStatutoryLeaveSummary,
      "list-payroll-statutory-leave",
      region,
    );
    const response = await get.call(
      api,
      tenantId,
      employeeId,
      activeOnly,
      payrollOptions(),
    );
    return response.body.statutoryLeaves ?? [];
  });
}

export async function getPayrollStatutorySickLeave(
  statutorySickLeaveID: string,
): Promise<XeroClientResponse<PayrollV2StatutorySickLeave | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const get = requireMethod(
      api.getEmployeeStatutorySickLeave,
      "get-payroll-statutory-sick-leave",
      region,
    );
    const response = await get.call(
      api,
      tenantId,
      statutorySickLeaveID,
      payrollOptions(),
    );
    return response.body.statutorySickLeave ?? null;
  });
}

export async function createPayrollStatutorySickLeave(
  leave: PayrollV2StatutorySickLeave,
): Promise<XeroClientResponse<PayrollV2StatutorySickLeave | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const create = requireMethod(
      api.createEmployeeStatutorySickLeave,
      "create-payroll-statutory-sick-leave",
      region,
    );
    const response = await create.call(api, tenantId, leave, payrollOptions());
    return response.body.statutorySickLeave ?? null;
  });
}
