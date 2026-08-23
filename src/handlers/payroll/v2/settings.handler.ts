import {
  payrollRequest,
  payrollV2,
  payrollOptions,
  requireMethod,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import { formatError } from "../../../helpers/format-error.js";
import {
  PayrollV2Account,
  PayrollV2Benefit,
  PayrollV2Deduction,
  PayrollV2EarningsRate,
  PayrollV2LeaveType,
  PayrollV2Reimbursement,
  PayrollV2StatutoryDeduction,
  PayrollV2TrackingCategories,
} from "../../../types/payroll-v2.js";

export interface PayrollSettings {
  accounts: PayrollV2Account[];
  trackingCategories: PayrollV2TrackingCategories | null;
  warnings: string[];
}

export async function listPayrollSettings(): Promise<
  XeroClientResponse<PayrollSettings>
> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();

    const settingsResponse = await api.getSettings(tenantId, payrollOptions());

    const settings: PayrollSettings = {
      accounts: settingsResponse.body.settings?.accounts ?? [],
      trackingCategories: null,
      warnings: [],
    };

    // Tracking categories are a separate endpoint and are commonly unset, so a
    // failure here should not lose the accounts we already have.
    try {
      const trackingResponse = await api.getTrackingCategories(
        tenantId,
        payrollOptions(),
      );
      settings.trackingCategories =
        trackingResponse.body.trackingCategories ?? null;
    } catch (error) {
      settings.warnings.push(`trackingCategories: ${formatError(error)}`);
    }

    return settings;
  });
}

/** Pay item collections available across the v2 regions. */
export const PAY_ITEM_TYPES = [
  "earningsRates",
  "deductions",
  "reimbursements",
  "leaveTypes",
  "benefits",
  "superannuations",
  "statutoryDeductions",
  "earningsOrders",
] as const;

export type PayItemType = (typeof PAY_ITEM_TYPES)[number];

export interface PayrollPayItems {
  earningsRates?: PayrollV2EarningsRate[];
  deductions?: PayrollV2Deduction[];
  reimbursements?: PayrollV2Reimbursement[];
  leaveTypes?: PayrollV2LeaveType[];
  benefits?: PayrollV2Benefit[];
  superannuations?: PayrollV2Benefit[];
  statutoryDeductions?: PayrollV2StatutoryDeduction[];
  earningsOrders?: PayrollV2StatutoryDeduction[];
  /** Collections skipped because the region does not have them, or errored. */
  warnings: string[];
}

/**
 * Fetch the organisation's pay item library.
 *
 * Xero splits this across six to eight endpoints depending on region; folding
 * them into one tool keeps the tool list manageable and matches how the data is
 * actually used (looking up an ID before creating a timesheet or pay template).
 */
export async function listPayrollPayItems(
  types: PayItemType[] = [],
): Promise<XeroClientResponse<PayrollPayItems>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();

    const wanted = new Set<PayItemType>(
      types.length > 0 ? types : PAY_ITEM_TYPES,
    );
    const items: PayrollPayItems = { warnings: [] };

    const load = async (type: PayItemType, fetch: () => Promise<void>) => {
      if (!wanted.has(type)) return;
      try {
        await fetch();
      } catch (error) {
        items.warnings.push(`${type}: ${formatError(error)}`);
      }
    };

    await load("earningsRates", async () => {
      const { body } = await api.getEarningsRates(
        tenantId,
        undefined,
        payrollOptions(),
      );
      items.earningsRates = body.earningsRates ?? [];
    });

    await load("deductions", async () => {
      const { body } = await api.getDeductions(
        tenantId,
        undefined,
        payrollOptions(),
      );
      items.deductions = body.deductions ?? [];
    });

    await load("reimbursements", async () => {
      const { body } = await api.getReimbursements(
        tenantId,
        undefined,
        payrollOptions(),
      );
      items.reimbursements = body.reimbursements ?? [];
    });

    await load("leaveTypes", async () => {
      const { body } = await api.getLeaveTypes(
        tenantId,
        undefined,
        undefined,
        payrollOptions(),
      );
      items.leaveTypes = body.leaveTypes ?? [];
    });

    await load("benefits", async () => {
      if (!api.getBenefits) {
        items.warnings.push("benefits: not available in this payroll region");
        return;
      }
      const { body } = await api.getBenefits(
        tenantId,
        undefined,
        payrollOptions(),
      );
      items.benefits = body.benefits ?? [];
    });

    await load("superannuations", async () => {
      if (!api.getSuperannuations) {
        items.warnings.push(
          "superannuations: not available in this payroll region",
        );
        return;
      }
      const { body } = await api.getSuperannuations(
        tenantId,
        undefined,
        payrollOptions(),
      );
      items.superannuations = body.benefits ?? [];
    });

    await load("statutoryDeductions", async () => {
      if (!api.getStatutoryDeductions) {
        items.warnings.push(
          "statutoryDeductions: not available in this payroll region",
        );
        return;
      }
      const { body } = await api.getStatutoryDeductions(
        tenantId,
        undefined,
        payrollOptions(),
      );
      items.statutoryDeductions = body.statutoryDeductions ?? [];
    });

    await load("earningsOrders", async () => {
      if (!api.getEarningsOrders) {
        items.warnings.push(
          "earningsOrders: not available in this payroll region",
        );
        return;
      }
      const { body } = await api.getEarningsOrders(
        tenantId,
        undefined,
        payrollOptions(),
      );
      items.earningsOrders = body.statutoryDeductions ?? [];
    });

    return items;
  });
}

export async function createPayrollEarningsRate(
  earningsRate: PayrollV2EarningsRate,
): Promise<XeroClientResponse<PayrollV2EarningsRate | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEarningsRate(
      tenantId,
      earningsRate,
      payrollOptions(),
    );
    return response.body.earningsRate ?? null;
  });
}

export async function createPayrollDeduction(
  deduction: PayrollV2Deduction,
): Promise<XeroClientResponse<PayrollV2Deduction | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createDeduction(
      tenantId,
      deduction,
      payrollOptions(),
    );
    return response.body.deduction ?? null;
  });
}

export async function createPayrollReimbursement(
  reimbursement: PayrollV2Reimbursement,
): Promise<XeroClientResponse<PayrollV2Reimbursement | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createReimbursement(
      tenantId,
      reimbursement,
      payrollOptions(),
    );
    return response.body.reimbursement ?? null;
  });
}

export async function createPayrollBenefit(
  benefit: PayrollV2Benefit,
): Promise<XeroClientResponse<PayrollV2Benefit | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const create = requireMethod(
      api.createBenefit,
      "create-payroll-benefit",
      region,
    );
    const response = await create.call(
      api,
      tenantId,
      benefit,
      payrollOptions(),
    );
    return response.body.benefit ?? null;
  });
}

export async function createPayrollSuperannuation(
  benefit: PayrollV2Benefit,
): Promise<XeroClientResponse<PayrollV2Benefit | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const create = requireMethod(
      api.createSuperannuation,
      "create-payroll-superannuation",
      region,
    );
    const response = await create.call(
      api,
      tenantId,
      benefit,
      payrollOptions(),
    );
    return response.body.benefit ?? null;
  });
}
