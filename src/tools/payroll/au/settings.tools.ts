import { z } from "zod";

import { CreateXeroTool } from "../../../helpers/create-xero-tool.js";
import {
  field,
  handleResponse,
  lines,
  listResponse,
  messageResponse,
} from "../../../helpers/payroll-format.js";
import {
  createAuPayItem,
  createAuSuperfund,
  getAuSuperfund,
  listAuPayItems,
  listAuPayrollSettings,
  listAuSuperfundProducts,
  listAuSuperfunds,
  updateAuSuperfund,
} from "../../../handlers/payroll/au/settings.handler.js";
import { AuPayItem, AuSuperFund } from "../../../types/payroll-au-types.js";
import { AU_ONLY, RegionalTool, forRegions } from "../regional-tool.js";

const formatSuperfund = (fund: AuSuperFund) =>
  lines(
    `Super Fund: ${fund.name}`,
    field("ID", fund.superFundID),
    field("Type", fund.type?.toString()),
    field("ABN", fund.aBN),
    field("USI", fund.uSI),
    field("SPIN", fund.sPIN),
    field("BSB", fund.bSB),
    field("Account Number", fund.accountNumber),
    field("Account Name", fund.accountName),
    field("Employer Number", fund.employerNumber),
    field("Electronic Service Address", fund.electronicServiceAddress),
  );

const ListPayrollSettingsTool = CreateXeroTool(
  "list-payroll-settings",
  `List the Xero Payroll AU settings for the organisation - the general ledger accounts payroll posts to, the tracking categories used for employee groups and timesheets, and the number of days in the payroll year.`,
  {},
  async () => {
    const response = await listAuPayrollSettings();

    return handleResponse("listing payroll settings", response, (settings) =>
      messageResponse(
        settings
          ? lines(
              field("Days In Payroll Year", settings.daysInPayrollYear),
              `Found ${settings.accounts?.length ?? 0} payroll accounts:`,
              ...(settings.accounts ?? []).map((account) =>
                lines(
                  `Account: ${account.name}`,
                  field("ID", account.accountID),
                  field("Code", account.code),
                  field("Type", account.type?.toString()),
                ),
              ),
              settings.trackingCategories
                ? `\nTracking Categories:\n${JSON.stringify(
                    settings.trackingCategories,
                    null,
                    2,
                  )}`
                : null,
            )
          : "No payroll settings returned.",
      ),
    );
  },
);

const ListPayItemsTool = CreateXeroTool(
  "list-payroll-pay-items",
  `List the pay item library in Xero Payroll AU - earnings rates, deduction types, leave types and reimbursement types.
Use this to look up the IDs needed when creating timesheets, leave applications or pay templates.`,
  {
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async ({ page }) => {
    const response = await listAuPayItems(page);

    return handleResponse("listing pay items", response, (items) =>
      messageResponse(
        items
          ? lines(
              `Earnings Rates (${items.earningsRates?.length ?? 0}):`,
              ...(items.earningsRates ?? []).map(
                (rate) =>
                  `  ${rate.name} [${rate.earningsRateID}] - ${
                    rate.earningsType?.toString() ?? ""
                  }`.trimEnd(),
              ),
              `\nDeduction Types (${items.deductionTypes?.length ?? 0}):`,
              ...(items.deductionTypes ?? []).map(
                (deduction) =>
                  `  ${deduction.name} [${deduction.deductionTypeID}]`,
              ),
              `\nLeave Types (${items.leaveTypes?.length ?? 0}):`,
              ...(items.leaveTypes ?? []).map(
                (leaveType) =>
                  `  ${leaveType.name} [${leaveType.leaveTypeID}]${
                    leaveType.isPaidLeave ? " - paid" : ""
                  }`,
              ),
              `\nReimbursement Types (${items.reimbursementTypes?.length ?? 0}):`,
              ...(items.reimbursementTypes ?? []).map(
                (reimbursement) =>
                  `  ${reimbursement.name} [${reimbursement.reimbursementTypeID}]`,
              ),
            )
          : "No pay items returned.",
      ),
    );
  },
);

const CreatePayItemTool = CreateXeroTool(
  "create-payroll-pay-item",
  `Create pay items in Xero Payroll AU. One call can create earnings rates, deduction types, leave types and reimbursement types together - supply only the collections you want to add.`,
  {
    earningsRates: z
      .array(
        z.object({
          name: z.string().describe("Name of the earnings rate."),
          accountCode: z.string().describe("Account code the earnings post to."),
          typeOfUnits: z
            .string()
            .optional()
            .describe("Unit the rate is measured in, for example Hours."),
          earningsType: z
            .string()
            .optional()
            .describe(
              "Earnings type, for example ORDINARYTIMEEARNINGS, OVERTIMEEARNINGS or ALLOWANCE.",
            ),
          rateType: z
            .string()
            .optional()
            .describe("RATEPERUNIT, MULTIPLE or FIXEDAMOUNT."),
          ratePerUnit: z.string().optional().describe("Rate per unit."),
          multiplier: z.number().optional().describe("Multiplier for MULTIPLE rates."),
          amount: z.number().optional().describe("Amount for FIXEDAMOUNT rates."),
          accrueLeave: z
            .boolean()
            .optional()
            .describe("Whether leave accrues on this rate."),
          isExemptFromTax: z.boolean().optional().describe("Exempt from tax."),
          isExemptFromSuper: z
            .boolean()
            .optional()
            .describe("Exempt from superannuation."),
        }),
      )
      .optional()
      .describe("Earnings rates to create."),
    deductionTypes: z
      .array(
        z.object({
          name: z.string().describe("Name of the deduction type."),
          accountCode: z.string().describe("Account code the deduction posts to."),
          reducesTax: z.boolean().optional().describe("Whether it reduces tax."),
          reducesSuper: z
            .boolean()
            .optional()
            .describe("Whether it reduces superannuation."),
        }),
      )
      .optional()
      .describe("Deduction types to create."),
    leaveTypes: z
      .array(
        z.object({
          name: z.string().describe("Name of the leave type."),
          typeOfUnits: z
            .string()
            .optional()
            .describe("Unit the leave is tracked in, for example Hours."),
          normalEntitlement: z
            .number()
            .optional()
            .describe("Annual entitlement in units."),
          leaveLoadingRate: z.number().optional().describe("Leave loading rate."),
          isPaidLeave: z.boolean().optional().describe("Whether the leave is paid."),
          showOnPayslip: z
            .boolean()
            .optional()
            .describe("Whether it appears on payslips."),
        }),
      )
      .optional()
      .describe("Leave types to create."),
    reimbursementTypes: z
      .array(
        z.object({
          name: z.string().describe("Name of the reimbursement type."),
          accountCode: z
            .string()
            .describe("Account code the reimbursement posts to."),
        }),
      )
      .optional()
      .describe("Reimbursement types to create."),
  },
  async (payItem) => {
    const response = await createAuPayItem(payItem as unknown as AuPayItem);

    return handleResponse("creating pay items", response, () =>
      messageResponse("Successfully created the requested pay items."),
    );
  },
);

const ListSuperfundsTool = CreateXeroTool(
  "list-payroll-superfunds",
  `List the superannuation funds set up in Xero Payroll AU, with their ABN, USI and payment details.`,
  {
    where: z.string().optional().describe("Optional Xero filter."),
    order: z.string().optional().describe("Optional sort order."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async (filters) => {
    const response = await listAuSuperfunds(filters);

    return handleResponse("listing super funds", response, (funds) =>
      listResponse("super funds", funds, formatSuperfund),
    );
  },
);

const GetSuperfundTool = CreateXeroTool(
  "get-payroll-superfund",
  `Retrieve a single superannuation fund from Xero Payroll AU.`,
  {
    superFundID: z.string().describe("The super fund to retrieve."),
  },
  async ({ superFundID }) => {
    const response = await getAuSuperfund(superFundID);

    return handleResponse("getting super fund", response, (fund) =>
      messageResponse(
        fund
          ? formatSuperfund(fund)
          : `No super fund found with ID: ${superFundID}`,
      ),
    );
  },
);

const superfundFields = {
  type: z
    .string()
    .describe("Fund type: REGULATED for an APRA fund, or SMSF for a self-managed fund."),
  name: z.string().optional().describe("Name of the fund."),
  aBN: z.string().optional().describe("ABN of the fund (SMSF)."),
  uSI: z.string().optional().describe("Unique Superannuation Identifier (REGULATED)."),
  sPIN: z.string().optional().describe("SPIN of the fund."),
  bSB: z.string().optional().describe("BSB of the fund's bank account (SMSF)."),
  accountNumber: z
    .string()
    .optional()
    .describe("Fund bank account number (SMSF)."),
  accountName: z.string().optional().describe("Fund bank account name (SMSF)."),
  employerNumber: z
    .string()
    .optional()
    .describe("Employer number with the fund."),
  electronicServiceAddress: z
    .string()
    .optional()
    .describe("Electronic service address alias (SMSF)."),
};

const CreateSuperfundTool = CreateXeroTool(
  "create-payroll-superfund",
  `Add a superannuation fund to Xero Payroll AU so employees can be given a membership of it.
Use list-payroll-superfund-products to look up a regulated fund's USI before adding it.`,
  superfundFields,
  async (superFund) => {
    const response = await createAuSuperfund(
      superFund as unknown as AuSuperFund,
    );

    return handleResponse("creating super fund", response, (created) =>
      messageResponse(
        `Successfully created super fund with ID: ${created?.superFundID}`,
      ),
    );
  },
);

const UpdateSuperfundTool = CreateXeroTool(
  "update-payroll-superfund",
  `Update a superannuation fund in Xero Payroll AU.
Send the complete set of fund details - omitted fields are not preserved.`,
  {
    superFundID: z.string().describe("The super fund to update."),
    ...superfundFields,
  },
  async ({ superFundID, ...superFund }) => {
    const response = await updateAuSuperfund(
      superFundID,
      superFund as unknown as AuSuperFund,
    );

    return handleResponse("updating super fund", response, () =>
      messageResponse(`Successfully updated super fund: ${superFundID}`),
    );
  },
);

const ListSuperfundProductsTool = CreateXeroTool(
  "list-payroll-superfund-products",
  `Look up regulated superannuation fund products in Xero Payroll AU by ABN or USI, to find the details needed to add the fund.`,
  {
    abn: z.string().optional().describe("Search by the fund's ABN."),
    usi: z.string().optional().describe("Search by the fund's USI."),
  },
  async ({ abn, usi }) => {
    const response = await listAuSuperfundProducts(abn, usi);

    return handleResponse("listing super fund products", response, (products) =>
      listResponse("super fund products", products, (product) =>
        lines(
          `Product: ${product.productName}`,
          field("ABN", product.aBN),
          field("USI", product.uSI),
          field("SPIN", product.sPIN),
        ),
      ),
    );
  },
);

export const AuSettingsTools: RegionalTool[] = [
  forRegions(AU_ONLY, ListPayrollSettingsTool),
  forRegions(AU_ONLY, ListPayItemsTool),
  forRegions(AU_ONLY, CreatePayItemTool),
  forRegions(AU_ONLY, ListSuperfundsTool),
  forRegions(AU_ONLY, GetSuperfundTool),
  forRegions(AU_ONLY, CreateSuperfundTool),
  forRegions(AU_ONLY, UpdateSuperfundTool),
  forRegions(AU_ONLY, ListSuperfundProductsTool),
];
