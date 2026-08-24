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
  createAuPayrollEmployee,
  getAuPayrollEmployee,
  listAuPayrollEmployees,
  updateAuPayrollEmployee,
} from "../../../handlers/payroll/au/employees.handler.js";
import { AuEmployee } from "../../../types/payroll-au-types.js";
import { AU_ONLY, RegionalTool, forRegions } from "../regional-tool.js";

const homeAddressSchema = z.object({
  addressLine1: z.string().describe("First line of the street address."),
  addressLine2: z.string().optional().describe("Second line of the street address."),
  city: z.string().optional().describe("Suburb or city."),
  region: z
    .string()
    .optional()
    .describe("State, for example NSW, VIC, QLD, WA, SA, TAS, ACT or NT."),
  postalCode: z.string().optional().describe("Postcode."),
  country: z.string().optional().describe("Country."),
});

const employeeFields = {
  firstName: z.string().describe("The employee's first name."),
  lastName: z.string().describe("The employee's last name."),
  dateOfBirth: z.string().describe("Date of birth (YYYY-MM-DD)."),
  homeAddress: homeAddressSchema.optional().describe("The employee's home address."),
  startDate: z.string().optional().describe("Employment start date (YYYY-MM-DD)."),
  title: z.string().optional().describe("Salutation, for example Mr or Ms."),
  middleNames: z.string().optional().describe("Middle names."),
  email: z.string().optional().describe("Email address."),
  gender: z.string().optional().describe("Gender: M or F."),
  phone: z.string().optional().describe("Phone number."),
  mobile: z.string().optional().describe("Mobile number."),
  jobTitle: z.string().optional().describe("Job title."),
  classification: z.string().optional().describe("Award classification."),
  ordinaryEarningsRateID: z
    .string()
    .optional()
    .describe("The earnings rate used for ordinary hours."),
  payrollCalendarID: z
    .string()
    .optional()
    .describe("The payroll calendar the employee is paid on."),
  employeeGroupName: z
    .string()
    .optional()
    .describe("Employee group used for tracking."),
  incomeType: z
    .string()
    .optional()
    .describe("STP income type, for example SALARYANDWAGES."),
  employmentType: z
    .string()
    .optional()
    .describe("Employment type, for example EMPLOYEE or CONTRACTOR."),
  isAuthorisedToApproveLeave: z
    .boolean()
    .optional()
    .describe("Whether the employee can approve leave."),
  isAuthorisedToApproveTimesheets: z
    .boolean()
    .optional()
    .describe("Whether the employee can approve timesheets."),
  terminationDate: z
    .string()
    .optional()
    .describe("Termination date (YYYY-MM-DD)."),
};

const formatEmployee = (employee: AuEmployee) =>
  lines(
    `Employee: ${employee.employeeID}`,
    field("Name", [employee.firstName, employee.lastName].filter(Boolean).join(" ")),
    field("Email", employee.email),
    field("Phone", employee.phone ?? employee.mobile),
    field("Date of Birth", employee.dateOfBirth),
    field("Start Date", employee.startDate),
    field("Termination Date", employee.terminationDate),
    field("Job Title", employee.jobTitle),
    field("Status", employee.status?.toString()),
    field("Payroll Calendar", employee.payrollCalendarID),
    field("Employee Group", employee.employeeGroupName),
    field("Last Updated", employee.updatedDateUTC?.toString()),
  );

const ListPayrollEmployeesTool = CreateXeroTool(
  "list-payroll-employees",
  `List payroll employees in Xero Payroll AU.
Returns names, employee IDs, contact details, start dates and status for the staff on your payroll.`,
  {
    where: z
      .string()
      .optional()
      .describe('Optional Xero filter, e.g. Status=="ACTIVE".'),
    order: z.string().optional().describe("Optional sort order, e.g. LastName ASC."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async (filters) => {
    const response = await listAuPayrollEmployees(filters);

    return handleResponse("listing payroll employees", response, (employees) =>
      listResponse("payroll employees", employees, formatEmployee),
    );
  },
);

const GetPayrollEmployeeTool = CreateXeroTool(
  "get-payroll-employee",
  `Retrieve a single payroll employee from Xero Payroll AU.
The AU response is the complete record - pay template, opening balances, tax declaration, leave balances, leave lines, bank accounts and super memberships are all included.`,
  {
    employeeId: z.string().describe("The Xero employee ID to retrieve."),
  },
  async ({ employeeId }) => {
    const response = await getAuPayrollEmployee(employeeId);

    return handleResponse("getting payroll employee", response, (employee) =>
      messageResponse(
        employee
          ? lines(
              formatEmployee(employee),
              "",
              JSON.stringify(
                {
                  homeAddress: employee.homeAddress,
                  taxDeclaration: employee.taxDeclaration,
                  bankAccounts: employee.bankAccounts,
                  payTemplate: employee.payTemplate,
                  openingBalances: employee.openingBalances,
                  leaveBalances: employee.leaveBalances,
                  leaveLines: employee.leaveLines,
                  superMemberships: employee.superMemberships,
                },
                null,
                2,
              ),
            )
          : `No employee found with ID: ${employeeId}`,
      ),
    );
  },
);

const CreatePayrollEmployeeTool = CreateXeroTool(
  "create-payroll-employee",
  `Create a payroll employee in Xero Payroll AU.
Creates the core employee record. Tax declaration, pay template, bank accounts and super memberships are set with update-payroll-employee once the record exists.`,
  employeeFields,
  async (params) => {
    const response = await createAuPayrollEmployee(params as AuEmployee);

    return handleResponse("creating payroll employee", response, (employee) =>
      messageResponse(
        employee
          ? `Successfully created payroll employee with ID: ${employee.employeeID}`
          : "Employee was created but Xero returned no record.",
      ),
    );
  },
);

const UpdatePayrollEmployeeTool = CreateXeroTool(
  "update-payroll-employee",
  `Update an existing payroll employee in Xero Payroll AU, including their tax declaration, bank accounts and super memberships.
Send the complete set of details you want the employee to have - fields you omit are not preserved.`,
  {
    employeeId: z.string().describe("The Xero employee ID to update."),
    ...employeeFields,
    taxDeclaration: z
      .object({
        employmentBasis: z
          .string()
          .optional()
          .describe("FULLTIME, PARTTIME, CASUAL, LABOURHIRE or SUPERINCOMESTREAM."),
        taxFileNumber: z.string().optional().describe("Tax file number."),
        tFNExemptionType: z
          .string()
          .optional()
          .describe("TFN exemption type where no TFN is provided."),
        australianResidentForTaxPurposes: z
          .boolean()
          .optional()
          .describe("Whether the employee is an Australian resident for tax."),
        residencyStatus: z.string().optional().describe("Residency status."),
        taxScaleType: z.string().optional().describe("Tax scale type."),
        taxFreeThresholdClaimed: z
          .boolean()
          .optional()
          .describe("Whether the tax free threshold is claimed."),
        hasHELPDebt: z.boolean().optional().describe("Has a HELP debt."),
        hasSFSSDebt: z.boolean().optional().describe("Has an SFSS debt."),
        hasLoanOrStudentDebt: z
          .boolean()
          .optional()
          .describe("Has a study or training support loan."),
        eligibleToReceiveLeaveLoading: z
          .boolean()
          .optional()
          .describe("Eligible to receive leave loading."),
      })
      .optional()
      .describe("The employee's tax declaration."),
    bankAccounts: z
      .array(
        z.object({
          accountName: z.string().optional().describe("Name on the account."),
          bSB: z.string().optional().describe("BSB number."),
          accountNumber: z.string().optional().describe("Account number."),
          statementText: z
            .string()
            .optional()
            .describe("Text shown on the employee's bank statement."),
          remainder: z
            .boolean()
            .optional()
            .describe("Whether this account receives the remaining balance."),
          amount: z
            .number()
            .optional()
            .describe("Fixed amount paid into this account."),
        }),
      )
      .optional()
      .describe("Bank accounts the employee is paid into."),
    superMemberships: z
      .array(
        z.object({
          superFundID: z.string().describe("The super fund ID."),
          employeeNumber: z
            .string()
            .describe("The employee's membership number with the fund."),
        }),
      )
      .optional()
      .describe("Superannuation fund memberships."),
  },
  async ({ employeeId, ...employee }) => {
    const response = await updateAuPayrollEmployee(
      employeeId,
      employee as AuEmployee,
    );

    return handleResponse("updating payroll employee", response, (updated) =>
      messageResponse(
        `Successfully updated payroll employee: ${updated?.employeeID ?? employeeId}`,
      ),
    );
  },
);

export const AuEmployeeTools: RegionalTool[] = [
  forRegions(AU_ONLY, ListPayrollEmployeesTool),
  forRegions(AU_ONLY, GetPayrollEmployeeTool),
  forRegions(AU_ONLY, CreatePayrollEmployeeTool),
  forRegions(AU_ONLY, UpdatePayrollEmployeeTool),
];
