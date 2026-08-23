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
  createAuPayRun,
  createAuPayrollCalendar,
  getAuPayRun,
  getAuPayrollCalendar,
  getAuPayslip,
  listAuPayRuns,
  listAuPayrollCalendars,
  updateAuPayRun,
  updateAuPayslip,
} from "../../../handlers/payroll/au/pay-runs.handler.js";
import {
  AuPayRun,
  AuPayrollCalendar,
  AuPayslipLines,
} from "../../../types/payroll-au-types.js";
import { AU_ONLY, RegionalTool, forRegions } from "../regional-tool.js";

const formatPayRun = (payRun: AuPayRun) =>
  lines(
    `Pay Run: ${payRun.payRunID}`,
    field("Status", payRun.payRunStatus?.toString()),
    field("Calendar", payRun.payrollCalendarID),
    field(
      "Period",
      `${payRun.payRunPeriodStartDate} to ${payRun.payRunPeriodEndDate}`,
    ),
    field("Payment Date", payRun.paymentDate),
    field("Wages", payRun.wages),
    field("Deductions", payRun.deductions),
    field("Tax", payRun.tax),
    field("Reimbursement", payRun.reimbursement),
    field("Net Pay", payRun.netPay),
    field("Payslips", payRun.payslips?.length),
    field("Last Updated", payRun.updatedDateUTC?.toString()),
  );

const formatCalendar = (calendar: AuPayrollCalendar) =>
  lines(
    `Payroll Calendar: ${calendar.name}`,
    field("ID", calendar.payrollCalendarID),
    field("Type", calendar.calendarType?.toString()),
    field("Start Date", calendar.startDate),
    field("Payment Date", calendar.paymentDate),
    field("Reference Date", calendar.referenceDate),
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
      superMembershipID: z
        .string()
        .optional()
        .describe("Super membership for the line."),
      description: z.string().optional().describe("Line description."),
      amount: z.number().optional().describe("Line amount."),
      numberOfUnits: z.number().optional().describe("Number of units."),
      ratePerUnit: z.number().optional().describe("Rate per unit."),
    }),
  )
  .optional();

const ListPayRunsTool = CreateXeroTool(
  "list-payroll-pay-runs",
  `List pay runs in Xero Payroll AU, with their period, payment date, status and totals.`,
  {
    where: z
      .string()
      .optional()
      .describe('Optional Xero filter, e.g. PayRunStatus=="DRAFT".'),
    order: z.string().optional().describe("Optional sort order."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async (filters) => {
    const response = await listAuPayRuns(filters);

    return handleResponse("listing pay runs", response, (payRuns) =>
      listResponse("pay runs", payRuns, formatPayRun),
    );
  },
);

const GetPayRunTool = CreateXeroTool(
  "get-payroll-pay-run",
  `Retrieve a single pay run in Xero Payroll AU, including a summary of every payslip it contains.`,
  {
    payRunID: z.string().describe("The pay run to retrieve."),
  },
  async ({ payRunID }) => {
    const response = await getAuPayRun(payRunID);

    return handleResponse("getting pay run", response, (payRun) => {
      if (!payRun) {
        return messageResponse(`No pay run found with ID: ${payRunID}`);
      }

      return {
        content: [
          { type: "text" as const, text: formatPayRun(payRun) },
          ...(payRun.payslips ?? []).map((payslip) => ({
            type: "text" as const,
            text: lines(
              `Payslip: ${payslip.payslipID}`,
              field("Employee", payslip.employeeID),
              field(
                "Name",
                [payslip.firstName, payslip.lastName].filter(Boolean).join(" "),
              ),
              field("Wages", payslip.wages),
              field("Deductions", payslip.deductions),
              field("Tax", payslip.tax),
              field("Reimbursements", payslip.reimbursements),
              field("Net Pay", payslip.netPay),
            ),
          })),
        ],
      };
    });
  },
);

const CreatePayRunTool = CreateXeroTool(
  "create-payroll-pay-run",
  `Create a draft pay run in Xero Payroll AU for a payroll calendar's next period.
The pay run is created as a draft - review it before posting with update-payroll-pay-run.`,
  {
    payrollCalendarID: z
      .string()
      .describe("The payroll calendar to create the pay run for."),
    payRunPeriodStartDate: z
      .string()
      .optional()
      .describe("Pay period start date (YYYY-MM-DD)."),
    payRunPeriodEndDate: z
      .string()
      .optional()
      .describe("Pay period end date (YYYY-MM-DD)."),
    paymentDate: z
      .string()
      .optional()
      .describe("Date employees are paid (YYYY-MM-DD)."),
    payslipMessage: z
      .string()
      .optional()
      .describe("Message shown on every payslip in the run."),
  },
  async (payRun) => {
    const response = await createAuPayRun(payRun as AuPayRun);

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

const UpdatePayRunTool = CreateXeroTool(
  "update-payroll-pay-run",
  `Update a draft pay run in Xero Payroll AU.
Setting payRunStatus to POSTED posts the pay run, which pays employees and cannot be undone through the API. Confirm with the user before posting.`,
  {
    payRunID: z.string().describe("The pay run to update."),
    payrollCalendarID: z
      .string()
      .describe("The payroll calendar the pay run belongs to."),
    payRunStatus: z
      .enum(["DRAFT", "POSTED"])
      .optional()
      .describe("Set to POSTED to post the pay run. This cannot be undone."),
    paymentDate: z
      .string()
      .optional()
      .describe("Date employees are paid (YYYY-MM-DD)."),
    payslipMessage: z
      .string()
      .optional()
      .describe("Message shown on every payslip in the run."),
  },
  async ({ payRunID, ...payRun }) => {
    const response = await updateAuPayRun(payRunID, payRun as AuPayRun);

    return handleResponse("updating pay run", response, (updated) =>
      messageResponse(
        updated ? formatPayRun(updated) : `Successfully updated pay run: ${payRunID}`,
      ),
    );
  },
);

const GetPayslipTool = CreateXeroTool(
  "get-payroll-payslip",
  `Retrieve a payslip from Xero Payroll AU with its full line detail - earnings, leave, timesheet, deduction, reimbursement, superannuation and tax lines.`,
  {
    payslipID: z.string().describe("The payslip to retrieve."),
  },
  async ({ payslipID }) => {
    const response = await getAuPayslip(payslipID);

    return handleResponse("getting payslip", response, (payslip) =>
      messageResponse(
        payslip
          ? lines(
              `Payslip: ${payslip.payslipID}`,
              field("Employee", payslip.employeeID),
              field(
                "Name",
                [payslip.firstName, payslip.lastName].filter(Boolean).join(" "),
              ),
              field("Wages", payslip.wages),
              field("Deductions", payslip.deductions),
              field("Tax", payslip.tax),
              field("Reimbursements", payslip.reimbursements),
              field("Net Pay", payslip.netPay),
              "",
              JSON.stringify(
                {
                  earningsLines: payslip.earningsLines,
                  leaveEarningsLines: payslip.leaveEarningsLines,
                  timesheetEarningsLines: payslip.timesheetEarningsLines,
                  deductionLines: payslip.deductionLines,
                  leaveAccrualLines: payslip.leaveAccrualLines,
                  reimbursementLines: payslip.reimbursementLines,
                  superannuationLines: payslip.superannuationLines,
                  taxLines: payslip.taxLines,
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

const UpdatePayslipTool = CreateXeroTool(
  "update-payroll-payslip",
  `Adjust the line items on a payslip in a draft pay run in Xero Payroll AU.
Send the complete set of lines for each category you are changing - omitted lines are removed.`,
  {
    payslipID: z.string().describe("The payslip to update."),
    earningsLines: payslipLineSchema.describe("Earnings lines."),
    leaveEarningsLines: payslipLineSchema.describe("Leave earnings lines."),
    deductionLines: payslipLineSchema.describe("Deduction lines."),
    reimbursementLines: payslipLineSchema.describe("Reimbursement lines."),
    superannuationLines: payslipLineSchema.describe("Superannuation lines."),
  },
  async ({ payslipID, ...payslipLines }) => {
    const response = await updateAuPayslip(
      payslipID,
      payslipLines as AuPayslipLines,
    );

    return handleResponse("updating payslip", response, () =>
      messageResponse(`Successfully updated payslip: ${payslipID}`),
    );
  },
);

const ListCalendarsTool = CreateXeroTool(
  "list-payroll-calendars",
  `List the payroll calendars in Xero Payroll AU - the pay cycles employees are assigned to.`,
  {
    where: z.string().optional().describe("Optional Xero filter."),
    order: z.string().optional().describe("Optional sort order."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async (filters) => {
    const response = await listAuPayrollCalendars(filters);

    return handleResponse("listing payroll calendars", response, (calendars) =>
      listResponse("payroll calendars", calendars, formatCalendar),
    );
  },
);

const GetCalendarTool = CreateXeroTool(
  "get-payroll-calendar",
  `Retrieve a single payroll calendar from Xero Payroll AU.`,
  {
    payrollCalendarID: z.string().describe("The payroll calendar to retrieve."),
  },
  async ({ payrollCalendarID }) => {
    const response = await getAuPayrollCalendar(payrollCalendarID);

    return handleResponse("getting payroll calendar", response, (calendar) =>
      messageResponse(
        calendar
          ? formatCalendar(calendar)
          : `No payroll calendar found with ID: ${payrollCalendarID}`,
      ),
    );
  },
);

const CreateCalendarTool = CreateXeroTool(
  "create-payroll-calendar",
  `Create a payroll calendar in Xero Payroll AU, defining a pay cycle employees can be assigned to.`,
  {
    name: z.string().describe("Name of the payroll calendar."),
    calendarType: z
      .string()
      .describe(
        "Pay frequency, for example WEEKLY, FORTNIGHTLY, FOURWEEKLY, MONTHLY, TWICEMONTHLY or QUARTERLY.",
      ),
    startDate: z
      .string()
      .describe("Start date of the first pay period (YYYY-MM-DD)."),
    paymentDate: z
      .string()
      .describe("Payment date for the first pay period (YYYY-MM-DD)."),
  },
  async (calendar) => {
    // calendarType is a generated enum; the tool takes it as a string so the
    // model can pass the documented value directly.
    const response = await createAuPayrollCalendar(
      calendar as unknown as AuPayrollCalendar,
    );

    return handleResponse("creating payroll calendar", response, (created) =>
      messageResponse(
        `Successfully created payroll calendar with ID: ${created?.payrollCalendarID}`,
      ),
    );
  },
);

export const AuPayRunTools: RegionalTool[] = [
  forRegions(AU_ONLY, ListPayRunsTool),
  forRegions(AU_ONLY, GetPayRunTool),
  forRegions(AU_ONLY, CreatePayRunTool),
  forRegions(AU_ONLY, UpdatePayRunTool),
  forRegions(AU_ONLY, GetPayslipTool),
  forRegions(AU_ONLY, UpdatePayslipTool),
  forRegions(AU_ONLY, ListCalendarsTool),
  forRegions(AU_ONLY, GetCalendarTool),
  forRegions(AU_ONLY, CreateCalendarTool),
];
