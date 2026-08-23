import {
  payrollAu,
  payrollOptions,
  payrollRequest,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import { AuEmployee } from "../../../types/payroll-au-types.js";

export interface ListAuEmployeeFilters {
  where?: string;
  order?: string;
  page?: number;
}

export async function listAuPayrollEmployees(
  filters: ListAuEmployeeFilters = {},
): Promise<XeroClientResponse<AuEmployee[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getEmployees(
      tenantId,
      undefined, // ifModifiedSince
      filters.where,
      filters.order,
      filters.page,
      payrollOptions(),
    );
    return response.body.employees ?? [];
  });
}

/**
 * AU returns the full employee record - pay template, opening balances, tax
 * declaration, leave balances and super memberships are all embedded, so there
 * are no sub-resource endpoints to fan out to the way UK/NZ have.
 */
export async function getAuPayrollEmployee(
  employeeID: string,
): Promise<XeroClientResponse<AuEmployee | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getEmployee(
      tenantId,
      employeeID,
      payrollOptions(),
    );
    return response.body.employees?.[0] ?? null;
  });
}

export async function createAuPayrollEmployee(
  employee: AuEmployee,
): Promise<XeroClientResponse<AuEmployee | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    // The AU endpoints take and return collections even for a single record.
    const response = await api.createEmployee(
      tenantId,
      [employee],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.employees?.[0] ?? null;
  });
}

export async function updateAuPayrollEmployee(
  employeeID: string,
  employee: AuEmployee,
): Promise<XeroClientResponse<AuEmployee | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.updateEmployee(
      tenantId,
      employeeID,
      [employee],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.employees?.[0] ?? null;
  });
}
