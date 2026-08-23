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
  createAuTimesheet,
  getAuTimesheet,
  listAuTimesheets,
  updateAuTimesheet,
} from "../../../handlers/payroll/au/timesheets.handler.js";
import { AuTimesheet } from "../../../types/payroll-au-types.js";
import { AU_ONLY, RegionalTool, forRegions } from "../regional-tool.js";

/**
 * AU timesheet lines carry one entry in `numberOfUnits` per day of the
 * timesheet period, in order from the start date.
 */
const timesheetLinesSchema = z
  .array(
    z.object({
      earningsRateID: z.string().describe("The earnings rate for the line."),
      numberOfUnits: z
        .array(z.number())
        .describe(
          "Units worked, one entry per day of the timesheet period in order from the start date.",
        ),
      trackingItemID: z
        .string()
        .optional()
        .describe("Optional tracking option to attribute the hours to."),
    }),
  )
  .optional()
  .describe("The lines of the timesheet.");

const formatTimesheet = (timesheet: AuTimesheet) =>
  lines(
    `Timesheet ID: ${timesheet.timesheetID}`,
    field("Employee ID", timesheet.employeeID),
    field("Start Date", timesheet.startDate),
    field("End Date", timesheet.endDate),
    field("Status", timesheet.status?.toString()),
    field("Hours", timesheet.hours),
    field("Lines", timesheet.timesheetLines?.length),
    field("Last Updated", timesheet.updatedDateUTC?.toString()),
  );

const ListTimesheetsTool = CreateXeroTool(
  "list-timesheets",
  `List payroll timesheets in Xero Payroll AU, with employee, period, status and total hours.`,
  {
    where: z
      .string()
      .optional()
      .describe('Optional Xero filter, e.g. Status=="APPROVED".'),
    order: z.string().optional().describe("Optional sort order."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async (filters) => {
    const response = await listAuTimesheets(filters);

    return handleResponse("listing timesheets", response, (timesheets) =>
      listResponse("timesheets", timesheets, formatTimesheet),
    );
  },
);

const GetTimesheetTool = CreateXeroTool(
  "get-timesheet",
  `Retrieve a single payroll timesheet from Xero Payroll AU, including its lines.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to retrieve."),
  },
  async ({ timesheetID }) => {
    const response = await getAuTimesheet(timesheetID);

    return handleResponse("getting timesheet", response, (timesheet) =>
      messageResponse(
        timesheet
          ? lines(
              formatTimesheet(timesheet),
              timesheet.timesheetLines?.length
                ? `\nLines:\n${JSON.stringify(timesheet.timesheetLines, null, 2)}`
                : null,
            )
          : `No timesheet found with ID: ${timesheetID}`,
      ),
    );
  },
);

const CreateTimesheetTool = CreateXeroTool(
  "create-timesheet",
  `Create a payroll timesheet in Xero Payroll AU.
Each line's numberOfUnits is an array with one entry per day of the period, so a weekly timesheet has seven entries.`,
  {
    employeeID: z.string().describe("The ID of the employee."),
    startDate: z
      .string()
      .describe("The start date of the timesheet period (YYYY-MM-DD)."),
    endDate: z
      .string()
      .describe("The end date of the timesheet period (YYYY-MM-DD)."),
    status: z
      .enum(["DRAFT", "PROCESSED", "APPROVED", "REJECTED"])
      .optional()
      .describe("Timesheet status. Defaults to DRAFT."),
    timesheetLines: timesheetLinesSchema,
  },
  async (timesheet) => {
    const response = await createAuTimesheet(
      timesheet as unknown as AuTimesheet,
    );

    return handleResponse("creating timesheet", response, (created) =>
      messageResponse(
        `Successfully created timesheet with ID: ${created?.timesheetID}`,
      ),
    );
  },
);

const UpdateTimesheetTool = CreateXeroTool(
  "update-timesheet",
  `Update a payroll timesheet in Xero Payroll AU.
AU has no separate approve or revert endpoint - set status to APPROVED to approve the timesheet, or DRAFT to return it to draft. Send the complete set of lines; omitted lines are removed.`,
  {
    timesheetID: z.string().describe("The ID of the timesheet to update."),
    employeeID: z.string().describe("The ID of the employee."),
    startDate: z
      .string()
      .describe("The start date of the timesheet period (YYYY-MM-DD)."),
    endDate: z
      .string()
      .describe("The end date of the timesheet period (YYYY-MM-DD)."),
    status: z
      .enum(["DRAFT", "PROCESSED", "APPROVED", "REJECTED"])
      .optional()
      .describe("Timesheet status."),
    timesheetLines: timesheetLinesSchema,
  },
  async ({ timesheetID, ...timesheet }) => {
    const response = await updateAuTimesheet(
      timesheetID,
      timesheet as unknown as AuTimesheet,
    );

    return handleResponse("updating timesheet", response, (updated) =>
      messageResponse(
        updated
          ? formatTimesheet(updated)
          : `Successfully updated timesheet: ${timesheetID}`,
      ),
    );
  },
);

export const AuTimesheetTools: RegionalTool[] = [
  forRegions(AU_ONLY, ListTimesheetsTool),
  forRegions(AU_ONLY, GetTimesheetTool),
  forRegions(AU_ONLY, CreateTimesheetTool),
  forRegions(AU_ONLY, UpdateTimesheetTool),
];
