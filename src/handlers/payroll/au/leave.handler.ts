import {
  payrollAu,
  payrollOptions,
  payrollRequest,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import { AuLeaveApplication } from "../../../types/payroll-au-types.js";

export interface ListAuLeaveFilters {
  where?: string;
  order?: string;
  page?: number;
}

export async function listAuLeaveApplications(
  filters: ListAuLeaveFilters = {},
): Promise<XeroClientResponse<AuLeaveApplication[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    // V2 is the current endpoint: it returns leave applications with the
    // leave periods that older responses omitted.
    const response = await api.getLeaveApplicationsV2(
      tenantId,
      undefined, // ifModifiedSince
      filters.where,
      filters.order,
      filters.page,
      payrollOptions(),
    );
    return response.body.leaveApplications ?? [];
  });
}

export async function getAuLeaveApplication(
  leaveApplicationID: string,
): Promise<XeroClientResponse<AuLeaveApplication | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.getLeaveApplication(
      tenantId,
      leaveApplicationID,
      payrollOptions(),
    );
    return response.body.leaveApplications?.[0] ?? null;
  });
}

export async function createAuLeaveApplication(
  leaveApplication: AuLeaveApplication,
): Promise<XeroClientResponse<AuLeaveApplication | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.createLeaveApplication(
      tenantId,
      [leaveApplication],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.leaveApplications?.[0] ?? null;
  });
}

export async function updateAuLeaveApplication(
  leaveApplicationID: string,
  leaveApplication: AuLeaveApplication,
): Promise<XeroClientResponse<AuLeaveApplication | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response = await api.updateLeaveApplication(
      tenantId,
      leaveApplicationID,
      [leaveApplication],
      undefined, // idempotencyKey
      payrollOptions(),
    );
    return response.body.leaveApplications?.[0] ?? null;
  });
}

export async function decideAuLeaveApplication(
  leaveApplicationID: string,
  decision: "approve" | "reject",
): Promise<XeroClientResponse<AuLeaveApplication | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollAu();
    const response =
      decision === "approve"
        ? await api.approveLeaveApplication(
            tenantId,
            leaveApplicationID,
            undefined, // idempotencyKey
            payrollOptions(),
          )
        : await api.rejectLeaveApplication(
            tenantId,
            leaveApplicationID,
            undefined, // idempotencyKey
            payrollOptions(),
          );
    return response.body.leaveApplications?.[0] ?? null;
  });
}
