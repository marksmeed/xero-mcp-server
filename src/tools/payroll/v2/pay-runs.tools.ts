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
  createPayrollCalendar,
  createPayrollPayRun,
  getPayrollCalendar,
  getPayrollPayRun,
  getPayrollPayslip,
  listPayrollCalendars,
  listPayrollPayRuns,
  listPayrollPayslips,
  updatePayrollPayslipLines,
} from "../../../handlers/payroll/v2/pay-runs.handler.js";
import {
  PayrollV2PayRun,
  PayrollV2PayRunCalendar,
  PayrollV2Payslip,
} from "../../../types/payroll-v2.js";
import { NZ_ONLY, RegionalTool, V2, forRegions } from "../regional-tool.js";

const formatPayRun = (payRun: PayrollV2PayRun) =>
  lines(
    `Pay Run: ${payRun.payRunID}`,
    field("Status", payRun.payRunStatus),
    field("Type", payRun.payRunType),
    field("Calendar", payRun.payrollCalendarID),
    field("Period", `${payRun.periodStartDate} to ${payRun.periodEndDate}`),
    field("Payment Date", payRun.paymentDate),
    field("Total Pay", payRun.totalPay),
    field("Total Cost", payRun.totalCost),
    field("Posted", payRun.postedDateTime),
    field("Payslips", payRun.paySlips?.length),
  );

const formatPayslipSummary = (payslip: PayrollV2Payslip) =>
  lines(
    `Payslip: ${payslip.paySlipID}`,
    field("Employee", payslip.employeeID),
    field("Name", [payslip.firstName, payslip.lastName].filter(Boolean).join(" ")),
    field("Gross Earnings", payslip.grossEarnings),
    field("Total Earnings", payslip.totalEarnings),
    field("Total Deductions", payslip.totalDeductions),
    field("Total Employee Taxes", payslip.totalEmployeeTaxes),
    field("Total Employer Taxes", payslip.totalEmployerTaxes),
    field("Total Reimbursements", payslip.totalReimbursements),
    field("Total Statutory Deductions", payslip.totalStatutoryDeductions),
    field("Total Superannuation", payslip.totalSuperannuation),
    field("Total Pay", payslip.totalPay),
  );

const formatCalendar = (calendar: PayrollV2PayRunCalendar) =>
  lines(
    `Payroll Calendar: ${calendar.name}`,
    field("ID", calendar.payrollCalendarID),
    field("Type", calendar.calendarType),
    field("Period Start Date", calendar.periodStartDate),
    field("Period End Date", calendar.periodEndDate),
    field("Payment Date", calendar.paymentDate),
  );

const ListPayrollPayRunsTool = CreateXeroTool(
  "list-payroll-pay-runs",
  `List pay runs in Xero Payroll, with their period, payment date, status and totals.
Filter by status to separate draft pay runs still being prepared from posted ones.`,
  {
    status: z
      .enum(["Draft", "Posted"])
      .optional()
      .describe("Only return pay runs with this status."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async ({ status, page }) => {
    const response = await listPayrollPayRuns(status, page);

    return handleResponse("listing pay runs", response, (payRuns) =>
      listResponse("pay runs", payRuns, formatPayRun),
    );
  },
);

const GetPayrollPayRunTool = CreateXeroTool(
  "get-payroll-pay-run",
  `Retrieve a single pay run in Xero Payroll, including a summary of every payslip it contains.`,
  {
    payRunID: z.string().describe("The pay run to retrieve."),
  },
  async ({ payRunID }) => {
    const response = await getPayrollPayRun(payRunID);

    return handleResponse("getting pay run", response, (payRun) => {
      if (!payRun) {
        return messageResponse(`No pay run found with ID: ${payRunID}`);
      }

      return {
        content: [
          { type: "text" as const, text: formatPayRun(payRun) },
          ...(payRun.paySlips ?? []).map((payslip) => ({
            type: "text" as const,
            text: formatPayslipSummary(payslip),
          })),
        ],
      };
    });
  },
);

const CreatePayrollPayRunTool = CreateXeroTool(
  "create-payroll-pay-run",
  `Create a draft pay run in Xero Payroll NZ for a payroll calendar's next period.
The pay run is created as a draft - review it in Xero before posting. Posting a pay run pays employees and cannot be undone through the API.`,
  {
    payrollCalendarID: z
      .string()
      .describe("The payroll calendar to create the pay run for."),
    periodStartDate: z
      .string()
      .optional()
      .describe("Pay period start date (YYYY-MM-DD)."),
    periodEndDate: z
      .string()
      .optional()
      .describe("Pay period end date (YYYY-MM-DD)."),
    paymentDate: z
      .string()
      .optional()
      .describe("Date employees are paid (YYYY-MM-DD)."),
  },
  async (payRun) => {
    const response = await createPayrollPayRun(payRun);

    return handleResponse("creating pay run", response, (created) =>
      messageResponse(
        created
          ? lines(
              `Successfully created draft pay run with ID: ${created.payRunID}`,
              formatPayRun(created),
            )
          : "Pay run created.",
      ),
    );
  },
);

const ListPayrollPayslipsTool = CreateXeroTool(
  "list-payroll-payslips",
  `List the payslips in a pay run in Xero Payroll, with each employee's earnings, deductions, tax and net pay.`,
  {
    payRunID: z.string().describe("The pay run whose payslips to list."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async ({ payRunID, page }) => {
    const response = await listPayrollPayslips(payRunID, page);

    return handleResponse("listing payslips", response, (payslips) =>
      listResponse("payslips", payslips, formatPayslipSummary),
    );
  },
);

const GetPayrollPayslipTool = CreateXeroTool(
  "get-payroll-payslip",
  `Retrieve a single payslip in Xero Payroll with its full line detail - earnings, leave, timesheet, deduction, reimbursement, tax and accrual lines.`,
  {
    payslipID: z.string().describe("The payslip to retrieve."),
  },
  async ({ payslipID }) => {
    const response = await getPayrollPayslip(payslipID);

    return handleResponse("getting payslip", response, (payslip) =>
      messageResponse(
        payslip
          ? lines(
              formatPayslipSummary(payslip),
              "",
              JSON.stringify(
                {
                  earningsLines: payslip.earningsLines,
                  leaveEarningsLines: payslip.leaveEarningsLines,
                  timesheetEarningsLines: payslip.timesheetEarningsLines,
                  deductionLines: payslip.deductionLines,
                  reimbursementLines: payslip.reimbursementLines,
                  leaveAccrualLines: payslip.leaveAccrualLines,
                  benefitLines: payslip.benefitLines,
                  superannuationLines: payslip.superannuationLines,
                  employeeTaxLines: payslip.employeeTaxLines,
                  employerTaxLines: payslip.employerTaxLines,
                },
                null,
                2,
              ),
            )
          : `No payslip found with ID: ${payslipID}`,
      ),
    );
  },
);

const payslipLineSchema = z
  .array(
    z.object({
      earningsRateID: z.string().optional().describe("Earnings rate for the line."),
      leaveTypeID: z.string().optional().describe("Leave type for the line."),
      deductionTypeID: z.string().optional().describe("Deduction type for the line."),
      reimbursementTypeID: z
        .string()
        .optional()
        .describe("Reimbursement type for the line."),
      description: z.string().optional().describe("Line description."),
      amount: z.number().optional().describe("Line amount."),
      numberOfUnits: z.number().optional().describe("Number of units."),
      ratePerUnit: z.number().optional().describe("Rate per unit."),
      fixedAmount: z.number().optional().describe("Fixed amount."),
    }),
  )
  .optional();

const UpdatePayrollPayslipTool = CreateXeroTool(
  "update-payroll-payslip",
  `Adjust the line items on a draft payslip in Xero Payroll NZ.
Only works while the pay run is still a draft. Send the complete set of lines for each category you are changing - omitted lines are removed.`,
  {
    payslipID: z.string().describe("The payslip to update."),
    earningsLines: payslipLineSchema.describe("Earnings lines."),
    deductionLines: payslipLineSchema.describe("Deduction lines."),
    reimbursementLines: payslipLineSchema.describe("Reimbursement lines."),
    leaveEarningsLines: payslipLineSchema.describe("Leave earnings lines."),
    superannuationLines: payslipLineSchema.describe("Superannuation lines."),
  },
  async ({ payslipID, ...payslip }) => {
    const response = await updatePayrollPayslipLines(payslipID, payslip);

    return handleResponse("updating payslip", response, (updated) =>
      messageResponse(
        updated
          ? formatPayslipSummary(updated)
          : `Successfully updated payslip: ${payslipID}`,
      ),
    );
  },
);

const ListPayrollCalendarsTool = CreateXeroTool(
  "list-payroll-calendars",
  `List the payroll calendars in Xero Payroll - the pay cycles employees are assigned to, with their period dates and payment dates.`,
  {
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async ({ page }) => {
    const response = await listPayrollCalendars(page);

    return handleResponse("listing payroll calendars", response, (calendars) =>
      listResponse("payroll calendars", calendars, formatCalendar),
    );
  },
);

const GetPayrollCalendarTool = CreateXeroTool(
  "get-payroll-calendar",
  `Retrieve a single payroll calendar in Xero Payroll.`,
  {
    payrollCalendarID: z.string().describe("The payroll calendar to retrieve."),
  },
  async ({ payrollCalendarID }) => {
    const response = await getPayrollCalendar(payrollCalendarID);

    return handleResponse("getting payroll calendar", response, (calendar) =>
      messageResponse(
        calendar
          ? formatCalendar(calendar)
          : `No payroll calendar found with ID: ${payrollCalendarID}`,
      ),
    );
  },
);

const CreatePayrollCalendarTool = CreateXeroTool(
  "create-payroll-calendar",
  `Create a payroll calendar in Xero Payroll, defining a pay cycle employees can be assigned to.`,
  {
    name: z.string().describe("Name of the payroll calendar."),
    calendarType: z
      .string()
      .describe(
        "Pay frequency, for example Weekly, Fortnightly, FourWeekly, Monthly, Quarterly or Annual.",
      ),
    periodStartDate: z
      .string()
      .describe("Start date of the first pay period (YYYY-MM-DD)."),
    paymentDate: z
      .string()
      .describe("Payment date for the first pay period (YYYY-MM-DD)."),
    periodEndDate: z
      .string()
      .optional()
      .describe("End date of the first pay period (YYYY-MM-DD)."),
  },
  async (calendar) => {
    const response = await createPayrollCalendar(calendar);

    return handleResponse("creating payroll calendar", response, (created) =>
      messageResponse(
        `Successfully created payroll calendar with ID: ${created?.payrollCalendarID}`,
      ),
    );
  },
);

export const V2PayRunTools: RegionalTool[] = [
  forRegions(V2, ListPayrollPayRunsTool),
  forRegions(V2, GetPayrollPayRunTool),
  forRegions(NZ_ONLY, CreatePayrollPayRunTool),
  forRegions(V2, ListPayrollPayslipsTool),
  forRegions(V2, GetPayrollPayslipTool),
  forRegions(NZ_ONLY, UpdatePayrollPayslipTool),
  forRegions(V2, ListPayrollCalendarsTool),
  forRegions(V2, GetPayrollCalendarTool),
  forRegions(V2, CreatePayrollCalendarTool),
];
