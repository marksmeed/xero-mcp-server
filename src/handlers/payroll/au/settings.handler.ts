import {
  payrollAu,
  payrollOptions,
  payrollRequest,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import {
  AuPayItem,
  AuSettings,
  AuSuperFund,
  AuSuperFundProduct,
} from "../../../types/payroll-au-types.js";

export async function listAuPayrollSettings(): Promise<
  XeroClientResponse<AuSettings | null>
> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getSettings(tenantId, payrollOptions());
    return response.body.settings ?? null;
  });
}

/**
 * AU returns the whole pay item library from one endpoint - earnings rates,
 * deduction types, leave types and reimbursement types together.
 */
export async function listAuPayItems(
  page?: number,
): Promise<XeroClientResponse<AuPayItem | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getPayItems(
      tenantId,
      undefined, // ifModifiedSince
      undefined, // where
      undefined, // order
      page,
      payrollOptions(),
    );
    return response.body.payItems ?? null;
  });
}

export async function createAuPayItem(
  payItem: AuPayItem,
): Promise<XeroClientResponse<AuPayItem | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.createPayItem(
      tenantId,
      payItem,
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.payItems ?? null;
  });
}

export interface ListAuSuperfundFilters {
  where?: string;
  order?: string;
  page?: number;
}

export async function listAuSuperfunds(
  filters: ListAuSuperfundFilters = {},
): Promise<XeroClientResponse<AuSuperFund[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getSuperfunds(
      tenantId,
      undefined, // ifModifiedSince
      filters.where,
      filters.order,
      filters.page,
      payrollOptions(),
    );
    return response.body.superFunds ?? [];
  });
}

export async function getAuSuperfund(
  superFundID: string,
): Promise<XeroClientResponse<AuSuperFund | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getSuperfund(
      tenantId,
      superFundID,
      payrollOptions(),
    );
    return response.body.superFunds?.[0] ?? null;
  });
}

export async function createAuSuperfund(
  superFund: AuSuperFund,
): Promise<XeroClientResponse<AuSuperFund | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.createSuperfund(
      tenantId,
      [superFund],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.superFunds?.[0] ?? null;
  });
}

export async function updateAuSuperfund(
  superFundID: string,
  superFund: AuSuperFund,
): Promise<XeroClientResponse<AuSuperFund | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.updateSuperfund(
      tenantId,
      superFundID,
      [superFund],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.superFunds?.[0] ?? null;
  });
}

export async function listAuSuperfundProducts(
  abn?: string,
  usi?: string,
): Promise<XeroClientResponse<AuSuperFundProduct[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getSuperfundProducts(
      tenantId,
      abn,
      usi,
      payrollOptions(),
    );
    return response.body.superFundProducts ?? [];
  });
}
