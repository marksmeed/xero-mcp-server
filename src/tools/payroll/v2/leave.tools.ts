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
  createPayrollEmployeeLeave,
  createPayrollEmployeeLeaveSetup,
  createPayrollEmployeeLeaveType,
  createPayrollLeaveType,
  createPayrollStatutorySickLeave,
  deletePayrollEmployeeLeave,
  getPayrollStatutorySickLeave,
  listPayrollEmployeeLeave,
  listPayrollEmployeeLeaveBalances,
  listPayrollEmployeeLeaveTypes,
  listPayrollLeavePeriods,
  listPayrollLeaveTypes,
  listPayrollStatutoryLeave,
  updatePayrollEmployeeLeave,
} from "../../../handlers/payroll/v2/leave.handler.js";
import { NZ_ONLY, RegionalTool, UK_ONLY, V2, forRegions } from "../regional-tool.js";

const ListPayrollEmployeeLeaveTool = CreateXeroTool(
  "list-payroll-employee-leave",
  "List all leave records for a specific employee in Xero. This shows all leave transactions including approved, pending, and processed time off. Provide an employee ID to see their leave history.",
  {
    employeeId: z
      .string()
      .describe("The Xero employee ID to fetch leave records for"),
  },
  async ({ employeeId }) => {
    const response = await listPayrollEmployeeLeave(employeeId);

    return handleResponse("listing employee leave", response, (leave) =>
      listResponse("leave records", leave, (record) =>
        lines(
          `Leave: ${record.leaveID}`,
          field("Leave Type", record.leaveTypeID),
          field("Description", record.description),
          field("Start Date", record.startDate),
          field("End Date", record.endDate),
          field("Periods", record.periods?.length),
          field("Last Updated", record.updatedDateUTC?.toString()),
        ),
      ),
    );
  },
);

const CreatePayrollEmployeeLeaveTool = CreateXeroTool(
  "create-payroll-employee-leave",
  `Record a leave request for an employee in Xero Payroll.
Use list-payroll-employee-leave-types first to find the leave type ID the employee is entitled to.`,
  {
    employeeId: z.string().describe("The Xero employee ID taking the leave."),
    leaveTypeID: z.string().describe("The type of leave being taken."),
    description: z.string().describe("Description shown against the leave."),
    startDate: z.string().describe("First day of leave (YYYY-MM-DD)."),
    endDate: z.string().describe("Last day of leave (YYYY-MM-DD)."),
    periods: z
      .array(
        z.object({
          periodStartDate: z
            .string()
            .describe("Start of the pay period (YYYY-MM-DD)."),
          periodEndDate: z
            .string()
            .describe("End of the pay period (YYYY-MM-DD)."),
          numberOfUnits: z
            .number()
            .describe("Units of leave taken in this period."),
          periodStatus: z
            .string()
            .optional()
            .describe("Period status, for example Approved."),
        }),
      )
      .optional()
      .describe(
        "Optional per-pay-period breakdown. Xero calculates this when omitted.",
      ),
  },
  async ({ employeeId, ...leave }) => {
    const response = await createPayrollEmployeeLeave(employeeId, leave);

    return handleResponse("creating employee leave", response, (created) =>
      messageResponse(
        `Successfully created leave record with ID: ${created?.leaveID}`,
      ),
    );
  },
);

const UpdatePayrollEmployeeLeaveTool = CreateXeroTool(
  "update-payroll-employee-leave",
  `Update an existing leave record for an employee in Xero Payroll.
Send the full set of leave details - omitted fields are not preserved.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    leaveID: z.string().describe("The leave record to update."),
    leaveTypeID: z.string().describe("The type of leave being taken."),
    description: z.string().describe("Description shown against the leave."),
    startDate: z.string().describe("First day of leave (YYYY-MM-DD)."),
    endDate: z.string().describe("Last day of leave (YYYY-MM-DD)."),
    periods: z
      .array(
        z.object({
          periodStartDate: z.string().describe("Start of the pay period."),
          periodEndDate: z.string().describe("End of the pay period."),
          numberOfUnits: z.number().describe("Units of leave in this period."),
          periodStatus: z.string().optional().describe("Period status."),
        }),
      )
      .optional()
      .describe("Optional per-pay-period breakdown."),
  },
  async ({ employeeId, leaveID, ...leave }) => {
    const response = await updatePayrollEmployeeLeave(
      employeeId,
      leaveID,
      leave,
    );

    return handleResponse("updating employee leave", response, () =>
      messageResponse(`Successfully updated leave record: ${leaveID}`),
    );
  },
);

const DeletePayrollEmployeeLeaveTool = CreateXeroTool(
  "delete-payroll-employee-leave",
  `Delete a leave record from an employee in Xero Payroll. Leave that has already been paid cannot be deleted.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    leaveID: z.string().describe("The leave record to delete."),
  },
  async ({ employeeId, leaveID }) => {
    const response = await deletePayrollEmployeeLeave(employeeId, leaveID);

    return handleResponse("deleting employee leave", response, (id) =>
      messageResponse(`Successfully deleted leave record: ${id}`),
    );
  },
);

const ListPayrollEmployeeLeaveBalancesTool = CreateXeroTool(
  "list-payroll-employee-leave-balances",
  "List all leave balances for a specific employee in Xero. This shows current leave balances for all leave types available to the employee, including annual, sick, and other leave types.",
  {
    employeeId: z
      .string()
      .describe("The Xero employee ID to fetch leave balances for"),
  },
  async ({ employeeId }) => {
    const response = await listPayrollEmployeeLeaveBalances(employeeId);

    return handleResponse("listing leave balances", response, (balances) =>
      listResponse("leave balances", balances, (balance) =>
        lines(
          `Leave Type: ${balance.name ?? balance.leaveTypeID}`,
          field("Leave Type ID", balance.leaveTypeID),
          field("Balance", balance.balance),
          field("Units", balance.typeOfUnits),
        ),
      ),
    );
  },
);

const ListPayrollEmployeeLeaveTypesTool = CreateXeroTool(
  "list-payroll-employee-leave-types",
  "List all leave types available for a specific employee in Xero. This shows detailed information about the types of leave an employee can take, including schedule of accrual, leave type name, and entitlement.",
  {
    employeeId: z
      .string()
      .describe("The Xero employee ID to fetch leave types for"),
  },
  async ({ employeeId }) => {
    const response = await listPayrollEmployeeLeaveTypes(employeeId);

    return handleResponse("listing employee leave types", response, (types) =>
      listResponse("employee leave types", types, (type) =>
        lines(
          `Leave Type: ${type.leaveTypeID}`,
          field("Schedule Of Accrual", type.scheduleOfAccrual),
          field("Hours Accrued Annually", type.hoursAccruedAnnually),
          field("Units Accrued Annually", type.unitsAccruedAnnually),
          field("Maximum To Accrue", type.maximumToAccrue),
          field("Opening Balance", type.openingBalance),
          field("Rate Accrued Hourly", type.rateAccruedHourly),
        ),
      ),
    );
  },
);

const CreatePayrollEmployeeLeaveTypeTool = CreateXeroTool(
  "create-payroll-employee-leave-type",
  `Give an employee an entitlement to a leave type in Xero Payroll, including how it accrues.
Use list-payroll-leave-types to find the organisation-wide leave type ID.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    leaveTypeID: z.string().describe("The organisation leave type to grant."),
    scheduleOfAccrual: z
      .string()
      .describe(
        "How the entitlement accrues, for example BeginningOfCalendarYear, OnHourWorked or NoAccruals.",
      ),
    hoursAccruedAnnually: z
      .number()
      .optional()
      .describe("Hours accrued each year (UK)."),
    unitsAccruedAnnually: z
      .number()
      .optional()
      .describe("Units accrued each year (NZ)."),
    typeOfUnitsToAccrue: z
      .string()
      .optional()
      .describe("Unit type accrued, for example Hours or Weeks (NZ)."),
    maximumToAccrue: z.number().optional().describe("Accrual cap."),
    openingBalance: z.number().optional().describe("Opening balance."),
    rateAccruedHourly: z
      .number()
      .optional()
      .describe("Rate accrued per hour worked."),
    percentageOfGrossEarnings: z
      .number()
      .optional()
      .describe("Percentage of gross earnings accrued (NZ)."),
    includeHolidayPayEveryPay: z
      .boolean()
      .optional()
      .describe("Pay holiday pay with every pay run (NZ)."),
    scheduleOfAccrualDate: z
      .string()
      .optional()
      .describe("Anniversary date the accrual schedule runs from (YYYY-MM-DD)."),
  },
  async ({ employeeId, ...leaveType }) => {
    const response = await createPayrollEmployeeLeaveType(
      employeeId,
      leaveType,
    );

    return handleResponse("creating employee leave type", response, () =>
      messageResponse(
        `Successfully granted leave type ${leaveType.leaveTypeID} to employee: ${employeeId}`,
      ),
    );
  },
);

const ListPayrollLeavePeriodsTool = CreateXeroTool(
  "list-payroll-leave-periods",
  "List all leave periods for a specific employee in Xero. This shows detailed time off periods including start and end dates, period status, payment dates, and leave types. Provide an employee ID to see their leave periods.",
  {
    employeeId: z
      .string()
      .describe("The Xero employee ID to fetch leave periods for"),
    startDate: z
      .string()
      .optional()
      .describe("Optional start date in YYYY-MM-DD format"),
    endDate: z
      .string()
      .optional()
      .describe("Optional end date in YYYY-MM-DD format"),
  },
  async ({ employeeId, startDate, endDate }) => {
    const response = await listPayrollLeavePeriods(
      employeeId,
      startDate,
      endDate,
    );

    return handleResponse("listing leave periods", response, (periods) =>
      listResponse("leave periods", periods, (period) =>
        lines(
          field("Period Start Date", period.periodStartDate),
          field("Period End Date", period.periodEndDate),
          field("Number Of Units", period.numberOfUnits),
          field("Period Status", period.periodStatus),
        ),
      ),
    );
  },
);

const ListPayrollLeaveTypesTool = CreateXeroTool(
  "list-payroll-leave-types",
  "Lists all available leave types in Xero Payroll. This provides information about all the leave categories configured in your Xero system, including statutory and organization-specific leave types.",
  {
    activeOnly: z
      .boolean()
      .optional()
      .describe("Return only leave types that are currently active."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async ({ activeOnly, page }) => {
    const response = await listPayrollLeaveTypes(page, activeOnly);

    return handleResponse("listing payroll leave types", response, (types) =>
      listResponse("leave types", types, (type) =>
        lines(
          `Leave Type: ${type.name}`,
          field("ID", type.leaveTypeID),
          field("Paid Leave", type.isPaidLeave),
          field("Show On Payslip", type.showOnPayslip),
          field("Active", type.isActive),
          field("Statutory", type.isStatutoryLeave),
          field("Units", type.typeOfUnits),
        ),
      ),
    );
  },
);

const CreatePayrollLeaveTypeTool = CreateXeroTool(
  "create-payroll-leave-type",
  `Create an organisation-wide leave type in Xero Payroll that employees can then be entitled to.`,
  {
    name: z.string().describe("Name of the leave type."),
    isPaidLeave: z.boolean().describe("Whether the leave is paid."),
    showOnPayslip: z.boolean().describe("Whether it appears on payslips."),
    typeOfUnits: z
      .string()
      .optional()
      .describe("Unit the leave is tracked in, for example Hours (NZ)."),
    typeOfUnitsToAccrue: z
      .string()
      .optional()
      .describe("Unit the leave accrues in (NZ)."),
  },
  async (leaveType) => {
    const response = await createPayrollLeaveType(leaveType);

    return handleResponse("creating leave type", response, (created) =>
      messageResponse(
        `Successfully created leave type with ID: ${created?.leaveTypeID}`,
      ),
    );
  },
);

const CreatePayrollEmployeeLeaveSetupTool = CreateXeroTool(
  "create-payroll-employee-leave-setup",
  `Configure an employee's initial leave setup in Xero Payroll NZ - holiday pay, annual leave and sick leave opening balances and accrual settings.
Run this once when onboarding an employee, before recording leave for them.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    includeHolidayPay: z
      .boolean()
      .optional()
      .describe("Pay holiday pay with every pay run."),
    holidayPayOpeningBalance: z
      .number()
      .optional()
      .describe("Holiday pay opening balance."),
    annualLeaveOpeningBalance: z
      .number()
      .optional()
      .describe("Annual leave opening balance."),
    negativeAnnualLeaveBalancePaidAmount: z
      .number()
      .optional()
      .describe("Amount already paid against a negative annual leave balance."),
    sickLeaveToAccrueAnnually: z
      .number()
      .optional()
      .describe("Sick leave accrued each year."),
    sickLeaveMaximumToAccrue: z
      .number()
      .optional()
      .describe("Maximum sick leave that can accrue."),
    sickLeaveOpeningBalance: z
      .number()
      .optional()
      .describe("Sick leave opening balance."),
    sickLeaveScheduleOfAccrual: z
      .string()
      .optional()
      .describe("Sick leave accrual schedule."),
    sickLeaveAnniversaryDate: z
      .string()
      .optional()
      .describe("Sick leave anniversary date (YYYY-MM-DD)."),
    annualLeaveAnniversaryDate: z
      .string()
      .optional()
      .describe("Annual leave anniversary date (YYYY-MM-DD)."),
  },
  async ({ employeeId, ...setup }) => {
    const response = await createPayrollEmployeeLeaveSetup(employeeId, setup);

    return handleResponse("creating leave setup", response, () =>
      messageResponse(
        `Successfully created leave setup for employee: ${employeeId}`,
      ),
    );
  },
);

const ListPayrollStatutoryLeaveTool = CreateXeroTool(
  "list-payroll-statutory-leave",
  `List an employee's statutory leave in Xero Payroll UK - sick, maternity, paternity, adoption and shared parental leave.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    activeOnly: z
      .boolean()
      .optional()
      .describe("Return only statutory leave that is currently active."),
  },
  async ({ employeeId, activeOnly }) => {
    const response = await listPayrollStatutoryLeave(employeeId, activeOnly);

    return handleResponse("listing statutory leave", response, (leaves) =>
      listResponse("statutory leave records", leaves, (leave) =>
        lines(
          `Statutory Leave: ${leave.employeeStatutoryLeaveID}`,
          field("Type", leave.type),
          field("Status", leave.status),
          field("Start Date", leave.startDate),
          field("End Date", leave.endDate),
        ),
      ),
    );
  },
);

const GetPayrollStatutorySickLeaveTool = CreateXeroTool(
  "get-payroll-statutory-sick-leave",
  `Retrieve a statutory sick leave record in Xero Payroll UK, including whether the employee was found entitled and why not if they were not.`,
  {
    statutorySickLeaveID: z
      .string()
      .describe("The statutory sick leave record to retrieve."),
  },
  async ({ statutorySickLeaveID }) => {
    const response = await getPayrollStatutorySickLeave(statutorySickLeaveID);

    return handleResponse("getting statutory sick leave", response, (leave) =>
      messageResponse(
        leave
          ? lines(
              `Statutory Sick Leave: ${leave.statutorySickLeaveID}`,
              field("Employee", leave.employeeID),
              field("Start Date", leave.startDate),
              field("End Date", leave.endDate),
              field("Entitled", leave.isEntitled),
              leave.entitlementFailureReasons?.length
                ? `Failure Reasons: ${leave.entitlementFailureReasons.join(", ")}`
                : null,
            )
          : `No statutory sick leave found with ID: ${statutorySickLeaveID}`,
      ),
    );
  },
);

const CreatePayrollStatutorySickLeaveTool = CreateXeroTool(
  "create-payroll-statutory-sick-leave",
  `Record statutory sick leave for an employee in Xero Payroll UK.
Xero evaluates entitlement on submission and returns whether the employee qualifies.`,
  {
    employeeID: z.string().describe("The Xero employee ID."),
    leaveTypeID: z.string().describe("The statutory sick leave type ID."),
    startDate: z.string().describe("First day of sick leave (YYYY-MM-DD)."),
    endDate: z.string().describe("Last day of sick leave (YYYY-MM-DD)."),
    workPattern: z
      .array(z.string())
      .describe(
        "Days the employee normally works, for example [\"Monday\",\"Tuesday\"].",
      ),
    isPregnancyRelated: z
      .boolean()
      .describe("Whether the sickness is pregnancy related."),
    sufficientNotice: z
      .boolean()
      .describe("Whether the employee gave sufficient notice."),
  },
  async (leave) => {
    const response = await createPayrollStatutorySickLeave(leave);

    return handleResponse("creating statutory sick leave", response, (created) =>
      messageResponse(
        lines(
          `Successfully created statutory sick leave: ${created?.statutorySickLeaveID}`,
          field("Entitled", created?.isEntitled),
          created?.entitlementFailureReasons?.length
            ? `Failure Reasons: ${created.entitlementFailureReasons.join(", ")}`
            : null,
        ),
      ),
    );
  },
);

export const V2LeaveTools: RegionalTool[] = [
  forRegions(V2, ListPayrollEmployeeLeaveTool),
  forRegions(V2, CreatePayrollEmployeeLeaveTool),
  forRegions(V2, UpdatePayrollEmployeeLeaveTool),
  forRegions(V2, DeletePayrollEmployeeLeaveTool),
  forRegions(V2, ListPayrollEmployeeLeaveBalancesTool),
  forRegions(V2, ListPayrollEmployeeLeaveTypesTool),
  forRegions(V2, CreatePayrollEmployeeLeaveTypeTool),
  forRegions(V2, ListPayrollLeavePeriodsTool),
  forRegions(V2, ListPayrollLeaveTypesTool),
  forRegions(V2, CreatePayrollLeaveTypeTool),
  forRegions(NZ_ONLY, CreatePayrollEmployeeLeaveSetupTool),
  forRegions(UK_ONLY, ListPayrollStatutoryLeaveTool),
  forRegions(UK_ONLY, GetPayrollStatutorySickLeaveTool),
  forRegions(UK_ONLY, CreatePayrollStatutorySickLeaveTool),
];
