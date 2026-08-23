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
  addPayrollTimesheetLine,
  approvePayrollTimesheet,
  createPayrollTimesheet,
  deletePayrollTimesheet,
  deletePayrollTimesheetLine,
  getPayrollTimesheet,
  listPayrollTimesheets,
  revertPayrollTimesheet,
  updatePayrollTimesheetLine,
} from "../../../handlers/payroll/v2/timesheets.handler.js";
import { PayrollV2Timesheet } from "../../../types/payroll-v2.js";
import { RegionalTool, V2, forRegions } from "../regional-tool.js";

const timesheetLineFields = {
  earningsRateID: z.string().describe("The ID of the earnings rate."),
  numberOfUnits: z
    .number()
    .describe("The number of units for the timesheet line."),
  date: z.string().describe("The date for the timesheet line (YYYY-MM-DD)."),
  trackingItemID: z
    .string()
    .optional()
    .describe("Optional tracking option to attribute the hours to."),
};

const formatTimesheet = (timesheet: PayrollV2Timesheet) =>
  lines(
    `Timesheet ID: ${timesheet.timesheetID}`,
    field("Employee ID", timesheet.employeeID),
    field("Payroll Calendar", timesheet.payrollCalendarID),
    field("Start Date", timesheet.startDate),
    field("End Date", timesheet.endDate),
    field("Status", timesheet.status),
    field("Total Hours", timesheet.totalHours),
    field("Last Updated", timesheet.updatedDateUTC?.toString()),
  );

const ListPayrollTimesheetsTool = CreateXeroTool(
  "list-timesheets",
  `List all payroll timesheets in Xero.
This retrieves comprehensive timesheet details including timesheet IDs, employee IDs, start and end dates, total hours, and the last updated date.
Narrow the results by employee, status or date range.`,
  {
    employeeId: z
      .string()
      .optional()
      .describe("Only return timesheets for this employee."),
    status: z
      .string()
      .optional()
      .describe("Only return timesheets with this status, e.g. Draft or Approved."),
    startDate: z
      .string()
      .optional()
      .describe("Only return timesheets starting on or after this date (YYYY-MM-DD)."),
    endDate: z
      .string()
      .optional()
      .describe("Only return timesheets ending on or before this date (YYYY-MM-DD)."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async (filters) => {
    const response = await listPayrollTimesheets(filters);

    return handleResponse("listing timesheets", response, (timesheets) =>
      listResponse("timesheets", timesheets, formatTimesheet),
    );
  },
);

const GetPayrollTimesheetTool = CreateXeroTool(
  "get-timesheet",
  `Retrieve a single payroll timesheet from Xero by its ID.
This provides details such as the timesheet ID, employee ID, start and end dates, total hours, and the individual timesheet lines.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to retrieve."),
  },
  async ({ timesheetID }) => {
    const response = await getPayrollTimesheet(timesheetID);

    return handleResponse("getting timesheet", response, (timesheet) =>
      messageResponse(
        timesheet
          ? lines(
              formatTimesheet(timesheet),
              timesheet.timesheetLines?.length
                ? `\nLines:\n${timesheet.timesheetLines
                    .map((line) =>
                      lines(
                        `  Line: ${line.timesheetLineID}`,
                        `  Date: ${line.date}`,
                        `  Earnings Rate: ${line.earningsRateID}`,
                        `  Units: ${line.numberOfUnits}`,
                      ),
                    )
                    .join("\n\n")}`
                : null,
            )
          : `No timesheet found with ID: ${timesheetID}`,
      ),
    );
  },
);

const CreatePayrollTimesheetTool = CreateXeroTool(
  "create-timesheet",
  `Create a new payroll timesheet in Xero.
This allows you to specify details such as the employee ID, payroll calendar ID, start and end dates, and timesheet lines.`,
  {
    payrollCalendarID: z.string().describe("The ID of the payroll calendar."),
    employeeID: z.string().describe("The ID of the employee."),
    startDate: z
      .string()
      .describe("The start date of the timesheet period (YYYY-MM-DD)."),
    endDate: z
      .string()
      .describe("The end date of the timesheet period (YYYY-MM-DD)."),
    timesheetLines: z
      .array(z.object(timesheetLineFields))
      .optional()
      .describe("The lines of the timesheet."),
  },
  async (timesheet) => {
    const response = await createPayrollTimesheet(timesheet);

    return handleResponse("creating timesheet", response, (created) =>
      messageResponse(
        `Successfully created timesheet with ID: ${created?.timesheetID}`,
      ),
    );
  },
);

const DeletePayrollTimesheetTool = CreateXeroTool(
  "delete-timesheet",
  `Delete an existing payroll timesheet in Xero by its ID.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to delete."),
  },
  async ({ timesheetID }) => {
    const response = await deletePayrollTimesheet(timesheetID);

    return handleResponse("deleting timesheet", response, (id) =>
      messageResponse(`Successfully deleted timesheet with ID: ${id}`),
    );
  },
);

const ApprovePayrollTimesheetTool = CreateXeroTool(
  "approve-timesheet",
  `Approve a payroll timesheet in Xero by its ID.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to approve."),
  },
  async ({ timesheetID }) => {
    const response = await approvePayrollTimesheet(timesheetID);

    return handleResponse("approving timesheet", response, (timesheet) =>
      messageResponse(
        `Successfully approved timesheet with ID: ${timesheet?.timesheetID ?? timesheetID}`,
      ),
    );
  },
);

const RevertPayrollTimesheetTool = CreateXeroTool(
  "revert-timesheet",
  `Revert a payroll timesheet to draft in Xero by its ID.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to revert."),
  },
  async ({ timesheetID }) => {
    const response = await revertPayrollTimesheet(timesheetID);

    return handleResponse("reverting timesheet", response, (timesheet) =>
      messageResponse(
        `Successfully reverted timesheet with ID: ${timesheet?.timesheetID ?? timesheetID}`,
      ),
    );
  },
);

const AddTimesheetLineTool = CreateXeroTool(
  "add-timesheet-line",
  `Add a new timesheet line to an existing payroll timesheet in Xero.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to update."),
    timesheetLine: z
      .object(timesheetLineFields)
      .describe("The details of the timesheet line to add."),
  },
  async ({ timesheetID, timesheetLine }) => {
    const response = await addPayrollTimesheetLine(timesheetID, timesheetLine);

    return handleResponse("adding timesheet line", response, (line) =>
      messageResponse(
        `Successfully added timesheet line with date: ${line?.date}`,
      ),
    );
  },
);

const UpdateTimesheetLineTool = CreateXeroTool(
  "update-timesheet-line",
  `Update an existing timesheet line in a payroll timesheet in Xero.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to update."),
    timesheetLineID: z
      .string()
      .describe("The ID of the timesheet line to update."),
    timesheetLine: z
      .object(timesheetLineFields)
      .describe("The new details for the timesheet line."),
  },
  async ({ timesheetID, timesheetLineID, timesheetLine }) => {
    const response = await updatePayrollTimesheetLine(
      timesheetID,
      timesheetLineID,
      timesheetLine,
    );

    return handleResponse("updating timesheet line", response, (line) =>
      messageResponse(
        `Successfully updated timesheet line with date: ${line?.date ?? timesheetLineID}`,
      ),
    );
  },
);

const DeleteTimesheetLineTool = CreateXeroTool(
  "delete-timesheet-line",
  `Delete a line from an existing payroll timesheet in Xero.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet."),
    timesheetLineID: z
      .string()
      .describe("The ID of the timesheet line to delete."),
  },
  async ({ timesheetID, timesheetLineID }) => {
    const response = await deletePayrollTimesheetLine(
      timesheetID,
      timesheetLineID,
    );

    return handleResponse("deleting timesheet line", response, (id) =>
      messageResponse(`Successfully deleted timesheet line: ${id}`),
    );
  },
);

export const V2TimesheetTools: RegionalTool[] = [
  forRegions(V2, ListPayrollTimesheetsTool),
  forRegions(V2, GetPayrollTimesheetTool),
  forRegions(V2, CreatePayrollTimesheetTool),
  forRegions(V2, DeletePayrollTimesheetTool),
  forRegions(V2, ApprovePayrollTimesheetTool),
  forRegions(V2, RevertPayrollTimesheetTool),
  forRegions(V2, AddTimesheetLineTool),
  forRegions(V2, UpdateTimesheetLineTool),
  forRegions(V2, DeleteTimesheetLineTool),
];
