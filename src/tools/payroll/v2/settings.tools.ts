import { z } from "zod";

import { CreateXeroTool } from "../../../helpers/create-xero-tool.js";
import {
  field,
  handleResponse,
  lines,
  messageResponse,
  warningLines,
} from "../../../helpers/payroll-format.js";
import {
  PAY_ITEM_TYPES,
  PayItemType,
  createPayrollBenefit,
  createPayrollDeduction,
  createPayrollEarningsRate,
  createPayrollReimbursement,
  createPayrollSuperannuation,
  listPayrollPayItems,
  listPayrollSettings,
} from "../../../handlers/payroll/v2/settings.handler.js";
import { NZ_ONLY, RegionalTool, UK_ONLY, V2, forRegions } from "../regional-tool.js";

const ListPayrollSettingsTool = CreateXeroTool(
  "list-payroll-settings",
  `List the Xero Payroll settings for the organisation - the general ledger accounts payroll posts to, and the tracking categories used for employee groups and timesheets.`,
  {},
  async () => {
    const response = await listPayrollSettings();

    return handleResponse("listing payroll settings", response, (settings) =>
      messageResponse(
        lines(
          `Found ${settings.accounts.length} payroll accounts:`,
          ...settings.accounts.map((account) =>
            lines(
              `Account: ${account.name}`,
              field("ID", account.accountID),
              field("Code", account.code),
              field("Type", account.type),
            ),
          ),
          settings.trackingCategories
            ? lines(
                "",
                "Tracking Categories:",
                field(
                  "Employee Groups",
                  settings.trackingCategories.employeeGroupsTrackingCategoryID,
                ),
                field(
                  "Timesheet Categories",
                  settings.trackingCategories.timesheetTrackingCategoryID,
                ),
              )
            : null,
          warningLines(settings.warnings),
        ),
      ),
    );
  },
);

const ListPayrollPayItemsTool = CreateXeroTool(
  "list-payroll-pay-items",
  `List the pay item library in Xero Payroll - earnings rates, deductions, reimbursements, leave types and, depending on region, benefits, superannuations, statutory deductions and earnings orders.
Use this to look up the IDs needed when creating timesheets, pay templates or leave.
Omit "types" to fetch everything; pass specific types to keep the response small.`,
  {
    types: z
      .array(z.enum(PAY_ITEM_TYPES))
      .optional()
      .describe("Pay item collections to fetch. Omit for all of them."),
  },
  async ({ types }) => {
    const response = await listPayrollPayItems((types ?? []) as PayItemType[]);

    return handleResponse("listing pay items", response, (items) =>
      messageResponse(
        lines(
          items.earningsRates &&
            lines(
              `Earnings Rates (${items.earningsRates.length}):`,
              ...items.earningsRates.map((rate) =>
                `  ${rate.name} [${rate.earningsRateID}] - ${rate.earningsType ?? ""} ${
                  rate.rateType ?? ""
                }`.trimEnd(),
              ),
            ),
          items.deductions &&
            lines(
              `\nDeductions (${items.deductions.length}):`,
              ...items.deductions.map(
                (deduction) =>
                  `  ${deduction.deductionName} [${deduction.deductionId}] - ${
                    deduction.deductionCategory ?? ""
                  }`.trimEnd(),
              ),
            ),
          items.reimbursements &&
            lines(
              `\nReimbursements (${items.reimbursements.length}):`,
              ...items.reimbursements.map(
                (reimbursement) =>
                  `  ${reimbursement.name} [${reimbursement.reimbursementID}]`,
              ),
            ),
          items.leaveTypes &&
            lines(
              `\nLeave Types (${items.leaveTypes.length}):`,
              ...items.leaveTypes.map(
                (leaveType) =>
                  `  ${leaveType.name} [${leaveType.leaveTypeID}]${
                    leaveType.isPaidLeave ? " - paid" : ""
                  }`,
              ),
            ),
          items.benefits &&
            lines(
              `\nBenefits (${items.benefits.length}):`,
              ...items.benefits.map(
                (benefit) => `  ${benefit.name} [${benefit.id}] - ${benefit.category ?? ""}`.trimEnd(),
              ),
            ),
          items.superannuations &&
            lines(
              `\nSuperannuations (${items.superannuations.length}):`,
              ...items.superannuations.map(
                (superannuation) =>
                  `  ${superannuation.name} [${superannuation.id}]`,
              ),
            ),
          items.statutoryDeductions &&
            lines(
              `\nStatutory Deductions (${items.statutoryDeductions.length}):`,
              ...items.statutoryDeductions.map(
                (deduction) => `  ${deduction.name} [${deduction.id}]`,
              ),
            ),
          items.earningsOrders &&
            lines(
              `\nEarnings Orders (${items.earningsOrders.length}):`,
              ...items.earningsOrders.map(
                (order) => `  ${order.name} [${order.id}]`,
              ),
            ),
          warningLines(items.warnings) && `\n${warningLines(items.warnings)}`,
        ),
      ),
    );
  },
);

const CreatePayrollEarningsRateTool = CreateXeroTool(
  "create-payroll-earnings-rate",
  `Create an earnings rate in Xero Payroll - the pay item that ordinary time, overtime, allowances or bonuses are recorded against.`,
  {
    name: z.string().describe("Name of the earnings rate."),
    earningsType: z
      .string()
      .describe(
        "Earnings type, for example RegularEarnings, Overtime, Allowance or Bonus.",
      ),
    rateType: z
      .string()
      .describe(
        "How the rate is calculated: RatePerUnit, MultipleOfOrdinaryEarningsRate or FixedAmount.",
      ),
    typeOfUnits: z.string().describe("Unit the rate is measured in, e.g. Hours."),
    expenseAccountID: z
      .string()
      .describe("Expense account the earnings post to."),
    ratePerUnit: z
      .number()
      .optional()
      .describe("Rate per unit, for RatePerUnit rates."),
    multipleOfOrdinaryEarningsRate: z
      .number()
      .optional()
      .describe("Multiplier, for MultipleOfOrdinaryEarningsRate rates."),
    fixedAmount: z
      .number()
      .optional()
      .describe("Amount, for FixedAmount rates."),
  },
  async (earningsRate) => {
    const response = await createPayrollEarningsRate(earningsRate);

    return handleResponse("creating earnings rate", response, (created) =>
      messageResponse(
        `Successfully created earnings rate with ID: ${created?.earningsRateID}`,
      ),
    );
  },
);

const CreatePayrollDeductionTool = CreateXeroTool(
  "create-payroll-deduction",
  `Create a deduction pay item in Xero Payroll, such as a pension contribution, union fee or salary sacrifice.`,
  {
    deductionName: z.string().describe("Name of the deduction."),
    deductionCategory: z
      .string()
      .describe(
        "Deduction category, for example NotTaxable, Union, Pension or Other.",
      ),
    liabilityAccountId: z
      .string()
      .describe("Liability account the deduction posts to."),
    standardAmount: z
      .number()
      .optional()
      .describe("Default amount per pay period."),
    calculationType: z
      .string()
      .optional()
      .describe("How the deduction is calculated (UK)."),
    percentage: z
      .number()
      .optional()
      .describe("Percentage, for percentage-based deductions (UK)."),
    subjectToTax: z
      .boolean()
      .optional()
      .describe("Whether the deduction is subject to tax (UK)."),
    isPension: z
      .boolean()
      .optional()
      .describe("Whether this deduction is a pension contribution (UK)."),
  },
  async (deduction) => {
    const response = await createPayrollDeduction(deduction);

    return handleResponse("creating deduction", response, (created) =>
      messageResponse(
        `Successfully created deduction with ID: ${created?.deductionId}`,
      ),
    );
  },
);

const CreatePayrollReimbursementTool = CreateXeroTool(
  "create-payroll-reimbursement",
  `Create a reimbursement pay item in Xero Payroll for non-taxable payments such as expenses or mileage.`,
  {
    name: z.string().describe("Name of the reimbursement."),
    accountID: z.string().describe("Account the reimbursement posts to."),
    reimbursementCategory: z
      .string()
      .optional()
      .describe("Reimbursement category (NZ)."),
    calculationType: z
      .string()
      .optional()
      .describe("How the reimbursement is calculated (NZ)."),
    standardAmount: z
      .number()
      .optional()
      .describe("Default amount per pay period (NZ)."),
    standardTypeOfUnits: z
      .string()
      .optional()
      .describe("Unit type for rate-based reimbursements (NZ)."),
    standardRatePerUnit: z
      .number()
      .optional()
      .describe("Rate per unit (NZ)."),
  },
  async (reimbursement) => {
    const response = await createPayrollReimbursement(reimbursement);

    return handleResponse("creating reimbursement", response, (created) =>
      messageResponse(
        `Successfully created reimbursement with ID: ${created?.reimbursementID}`,
      ),
    );
  },
);

const CreatePayrollBenefitTool = CreateXeroTool(
  "create-payroll-benefit",
  `Create a benefit pay item in Xero Payroll UK, such as a pension scheme or other employer-funded benefit.`,
  {
    name: z.string().describe("Name of the benefit."),
    category: z
      .string()
      .describe("Benefit category, for example StakeholderPension or Other."),
    liabilityAccountId: z.string().describe("Liability account for the benefit."),
    expenseAccountId: z.string().describe("Expense account for the benefit."),
    calculationType: z
      .string()
      .describe("How the benefit is calculated: FixedAmount or PercentageOfGross."),
    percentage: z.number().describe("Percentage, for percentage-based benefits."),
    standardAmount: z
      .number()
      .optional()
      .describe("Amount, for fixed-amount benefits."),
  },
  async (benefit) => {
    const response = await createPayrollBenefit(benefit);

    return handleResponse("creating benefit", response, (created) =>
      messageResponse(`Successfully created benefit with ID: ${created?.id}`),
    );
  },
);

const CreatePayrollSuperannuationTool = CreateXeroTool(
  "create-payroll-superannuation",
  `Create a superannuation pay item in Xero Payroll NZ, such as a KiwiSaver or complying fund contribution.`,
  {
    name: z.string().describe("Name of the superannuation scheme."),
    category: z.string().describe("Superannuation category."),
    liabilityAccountId: z.string().describe("Liability account for contributions."),
    expenseAccountId: z.string().describe("Expense account for contributions."),
    calculationTypeNZ: z
      .string()
      .optional()
      .describe("How contributions are calculated."),
    standardAmount: z.number().optional().describe("Fixed contribution amount."),
    percentage: z.number().optional().describe("Contribution percentage."),
    companyMax: z
      .number()
      .optional()
      .describe("Maximum employer contribution."),
  },
  async (superannuation) => {
    const response = await createPayrollSuperannuation(superannuation);

    return handleResponse("creating superannuation", response, (created) =>
      messageResponse(
        `Successfully created superannuation with ID: ${created?.id}`,
      ),
    );
  },
);

export const V2SettingsTools: RegionalTool[] = [
  forRegions(V2, ListPayrollSettingsTool),
  forRegions(V2, ListPayrollPayItemsTool),
  forRegions(V2, CreatePayrollEarningsRateTool),
  forRegions(V2, CreatePayrollDeductionTool),
  forRegions(V2, CreatePayrollReimbursementTool),
  forRegions(UK_ONLY, CreatePayrollBenefitTool),
  forRegions(NZ_ONLY, CreatePayrollSuperannuationTool),
];
