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
  createAuLeaveApplication,
  decideAuLeaveApplication,
  getAuLeaveApplication,
  listAuLeaveApplications,
  updateAuLeaveApplication,
} from "../../../handlers/payroll/au/leave.handler.js";
import { AuLeaveApplication } from "../../../types/payroll-au-types.js";
import { AU_ONLY, RegionalTool, forRegions } from "../regional-tool.js";

const leavePeriodsSchema = z
  .array(
    z.object({
      payPeriodStartDate: z
        .string()
        .describe("Start of the pay period (YYYY-MM-DD)."),
      payPeriodEndDate: z
        .string()
        .describe("End of the pay period (YYYY-MM-DD)."),
      numberOfUnits: z.number().describe("Units of leave taken in this period."),
      leavePeriodStatus: z
        .string()
        .optional()
        .describe("Period status, for example SCHEDULED or PROCESSED."),
    }),
  )
  .optional()
  .describe(
    "Optional per-pay-period breakdown. Xero calculates this when omitted.",
  );

const formatLeaveApplication = (leave: AuLeaveApplication) =>
  lines(
    `Leave Application: ${leave.leaveApplicationID}`,
    field("Employee", leave.employeeID),
    field("Leave Type", leave.leaveTypeID),
    field("Title", leave.title),
    field("Description", leave.description),
    field("Start Date", leave.startDate),
    field("End Date", leave.endDate),
    field("Periods", leave.leavePeriods?.length),
    field("Last Updated", leave.updatedDateUTC?.toString()),
  );

const ListLeaveApplicationsTool = CreateXeroTool(
  "list-payroll-leave-applications",
  `List leave applications in Xero Payroll AU, with their leave type, dates and pay period breakdown.`,
  {
    where: z
      .string()
      .optional()
      .describe('Optional Xero filter, e.g. EmployeeID==guid("...").'),
    order: z.string().optional().describe("Optional sort order."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async (filters) => {
    const response = await listAuLeaveApplications(filters);

    return handleResponse("listing leave applications", response, (leaves) =>
      listResponse("leave applications", leaves, formatLeaveApplication),
    );
  },
);

const GetLeaveApplicationTool = CreateXeroTool(
  "get-payroll-leave-application",
  `Retrieve a single leave application from Xero Payroll AU.`,
  {
    leaveApplicationID: z
      .string()
      .describe("The leave application to retrieve."),
  },
  async ({ leaveApplicationID }) => {
    const response = await getAuLeaveApplication(leaveApplicationID);

    return handleResponse("getting leave application", response, (leave) =>
      messageResponse(
        leave
          ? lines(
              formatLeaveApplication(leave),
              leave.leavePeriods?.length
                ? `\nPeriods:\n${JSON.stringify(leave.leavePeriods, null, 2)}`
                : null,
            )
          : `No leave application found with ID: ${leaveApplicationID}`,
      ),
    );
  },
);

const CreateLeaveApplicationTool = CreateXeroTool(
  "create-payroll-leave-application",
  `Create a leave application for an employee in Xero Payroll AU.
Use list-payroll-pay-items to find the leave type ID.`,
  {
    employeeID: z.string().describe("The employee taking the leave."),
    leaveTypeID: z.string().describe("The type of leave being taken."),
    title: z.string().describe("Title shown against the leave."),
    startDate: z.string().describe("First day of leave (YYYY-MM-DD)."),
    endDate: z.string().describe("Last day of leave (YYYY-MM-DD)."),
    description: z.string().optional().describe("Description of the leave."),
    leavePeriods: leavePeriodsSchema,
  },
  async (leave) => {
    const response = await createAuLeaveApplication(leave as AuLeaveApplication);

    return handleResponse("creating leave application", response, (created) =>
      messageResponse(
        `Successfully created leave application with ID: ${created?.leaveApplicationID}`,
      ),
    );
  },
);

const UpdateLeaveApplicationTool = CreateXeroTool(
  "update-payroll-leave-application",
  `Update an existing leave application in Xero Payroll AU.
Send the full set of leave details - omitted fields are not preserved.`,
  {
    leaveApplicationID: z.string().describe("The leave application to update."),
    employeeID: z.string().describe("The employee taking the leave."),
    leaveTypeID: z.string().describe("The type of leave being taken."),
    title: z.string().describe("Title shown against the leave."),
    startDate: z.string().describe("First day of leave (YYYY-MM-DD)."),
    endDate: z.string().describe("Last day of leave (YYYY-MM-DD)."),
    description: z.string().optional().describe("Description of the leave."),
    leavePeriods: leavePeriodsSchema,
  },
  async ({ leaveApplicationID, ...leave }) => {
    const response = await updateAuLeaveApplication(
      leaveApplicationID,
      leave as AuLeaveApplication,
    );

    return handleResponse("updating leave application", response, () =>
      messageResponse(
        `Successfully updated leave application: ${leaveApplicationID}`,
      ),
    );
  },
);

const DecideLeaveApplicationTool = CreateXeroTool(
  "decide-payroll-leave-application",
  `Approve or reject a requested leave application in Xero Payroll AU.
Approving the leave commits it to the employee's leave balance and upcoming pay runs.`,
  {
    leaveApplicationID: z.string().describe("The leave application to decide."),
    decision: z
      .enum(["approve", "reject"])
      .describe("Whether to approve or reject the request."),
  },
  async ({ leaveApplicationID, decision }) => {
    const response = await decideAuLeaveApplication(
      leaveApplicationID,
      decision,
    );

    return handleResponse(
      `${decision === "approve" ? "approving" : "rejecting"} leave application`,
      response,
      () =>
        messageResponse(
          `Successfully ${
            decision === "approve" ? "approved" : "rejected"
          } leave application: ${leaveApplicationID}`,
        ),
    );
  },
);

export const AuLeaveTools: RegionalTool[] = [
  forRegions(AU_ONLY, ListLeaveApplicationsTool),
  forRegions(AU_ONLY, GetLeaveApplicationTool),
  forRegions(AU_ONLY, CreateLeaveApplicationTool),
  forRegions(AU_ONLY, UpdateLeaveApplicationTool),
  forRegions(AU_ONLY, DecideLeaveApplicationTool),
];
