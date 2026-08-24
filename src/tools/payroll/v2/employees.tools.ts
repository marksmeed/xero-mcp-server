import { z } from "zod";

import { CreateXeroTool } from "../../../helpers/create-xero-tool.js";
import {
  field,
  handleResponse,
  lines,
  listResponse,
  messageResponse,
  warningLines,
} from "../../../helpers/payroll-format.js";
import {
  EMPLOYEE_INCLUDES,
  EmployeeInclude,
  createPayrollEmployee,
  createPayrollEmployeeEarningsTemplate,
  createPayrollEmployeePaymentMethod,
  createPayrollEmployeeSalaryAndWage,
  createPayrollEmployeeWorkingPattern,
  createPayrollEmployment,
  deletePayrollEmployeeEarningsTemplate,
  deletePayrollEmployeeSalaryAndWage,
  deletePayrollEmployeeWorkingPattern,
  getPayrollEmployee,
  listPayrollEmployeeSalaryAndWages,
  listPayrollEmployeeWorkingPatterns,
  listPayrollEmployees,
  setPayrollEmployeeOpeningBalances,
  updatePayrollEmployee,
  updatePayrollEmployeeEarningsTemplate,
  updatePayrollEmployeeSalaryAndWage,
  updatePayrollEmployeeTax,
} from "../../../handlers/payroll/v2/employees.handler.js";
import {
  PayrollV2EarningsTemplate,
  PayrollV2Employee,
  PayrollV2SalaryAndWage,
} from "../../../types/payroll-v2.js";
import { NZ_ONLY, RegionalTool, V2, forRegions } from "../regional-tool.js";

const addressSchema = z.object({
  addressLine1: z.string().describe("First line of the street address."),
  addressLine2: z.string().optional().describe("Second line of the street address."),
  city: z.string().describe("City or town."),
  suburb: z.string().optional().describe("Suburb (NZ)."),
  region: z.string().optional().describe("Region, county or state."),
  postCode: z.string().describe("Postal or ZIP code."),
  countryName: z.string().optional().describe("Country name."),
});

const employeeFields = {
  title: z.string().optional().describe("Salutation, for example Mr or Ms."),
  firstName: z.string().describe("The employee's first name."),
  lastName: z.string().describe("The employee's last name."),
  dateOfBirth: z.string().describe("Date of birth (YYYY-MM-DD)."),
  address: addressSchema.describe("The employee's home address."),
  email: z.string().optional().describe("The employee's email address."),
  gender: z
    .string()
    .optional()
    .describe("Gender recorded on the payroll record, for example M or F."),
  phoneNumber: z.string().optional().describe("Contact phone number."),
  startDate: z.string().optional().describe("Employment start date (YYYY-MM-DD)."),
  payrollCalendarID: z
    .string()
    .optional()
    .describe("The payroll calendar the employee is paid on."),
  jobTitle: z.string().optional().describe("Job title (NZ only)."),
  engagementType: z
    .string()
    .optional()
    .describe("Engagement type (NZ only): Permanent, FixedTerm or Casual."),
  niCategory: z
    .string()
    .optional()
    .describe("National Insurance category letter (UK only)."),
  nationalInsuranceNumber: z
    .string()
    .optional()
    .describe("National Insurance number (UK only)."),
};

const formatEmployee = (employee: PayrollV2Employee) =>
  lines(
    `Employee: ${employee.employeeID}`,
    field("Name", [employee.firstName, employee.lastName].filter(Boolean).join(" ")),
    field("Email", employee.email),
    field("Phone", employee.phoneNumber),
    field("Date of Birth", employee.dateOfBirth),
    field("Start Date", employee.startDate),
    field("End Date", employee.endDate),
    field("Job Title", employee.jobTitle),
    field("Engagement Type", employee.engagementType),
    field("NI Number", employee.nationalInsuranceNumber),
    field("Payroll Calendar", employee.payrollCalendarID),
    field("Last Updated", employee.updatedDateUTC?.toString()),
  );

const formatSalaryAndWage = (salary: PayrollV2SalaryAndWage) =>
  lines(
    `Salary and Wage: ${salary.salaryAndWagesID}`,
    field("Earnings Rate", salary.earningsRateID),
    field("Payment Type", salary.paymentType),
    field("Status", salary.status),
    field("Annual Salary", salary.annualSalary),
    field("Rate Per Unit", salary.ratePerUnit),
    field("Units Per Week", salary.numberOfUnitsPerWeek),
    field("Units Per Day", salary.numberOfUnitsPerDay),
    field("Effective From", salary.effectiveFrom),
  );

const formatEarningsTemplate = (template: PayrollV2EarningsTemplate) =>
  lines(
    `Pay Template Earning: ${template.payTemplateEarningID}`,
    field("Name", template.name),
    field("Earnings Rate", template.earningsRateID),
    field("Rate Per Unit", template.ratePerUnit),
    field("Number Of Units", template.numberOfUnits),
    field("Fixed Amount", template.fixedAmount),
  );

const ListPayrollEmployeesTool = CreateXeroTool(
  "list-payroll-employees",
  `List payroll employees in Xero.
Returns names, employee IDs, contact details, start dates and engagement information for the staff on your payroll.`,
  {
    filter: z
      .string()
      .optional()
      .describe(
        'Optional Xero filter on first name, last name or off-payroll worker status, e.g. firstName=="Jane".',
      ),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async ({ filter, page }) => {
    const response = await listPayrollEmployees(filter, page);

    return handleResponse("listing payroll employees", response, (employees) =>
      listResponse("payroll employees", employees, formatEmployee),
    );
  },
);

const GetPayrollEmployeeTool = CreateXeroTool(
  "get-payroll-employee",
  `Retrieve a single payroll employee, optionally with their payroll configuration.
Pass "include" to pull in related records in the same call - tax settings, pay template, salary and wages, payment method, opening balances, leave balances, leave entitlements and (NZ) working patterns.
Sub-resources that are not configured for the employee are reported as warnings rather than failing the whole call.`,
  {
    employeeId: z.string().describe("The Xero employee ID to retrieve."),
    include: z
      .array(z.enum(EMPLOYEE_INCLUDES))
      .optional()
      .describe(
        "Related records to fetch alongside the employee. Omit for the employee record only.",
      ),
  },
  async ({ employeeId, include }) => {
    const response = await getPayrollEmployee(
      employeeId,
      (include ?? []) as EmployeeInclude[],
    );

    return handleResponse("getting payroll employee", response, (detail) => {
      if (!detail.employee) {
        return messageResponse(`No employee found with ID: ${employeeId}`);
      }

      return messageResponse(
        lines(
          formatEmployee(detail.employee),
          detail.tax && `\nTax:\n${JSON.stringify(detail.tax, null, 2)}`,
          detail.payTemplate &&
            `\nPay Template:\n${JSON.stringify(detail.payTemplate, null, 2)}`,
          detail.salaryAndWages &&
            `\nSalary and Wages:\n${detail.salaryAndWages
              .map(formatSalaryAndWage)
              .join("\n\n")}`,
          detail.paymentMethod &&
            `\nPayment Method:\n${JSON.stringify(detail.paymentMethod, null, 2)}`,
          detail.openingBalances &&
            `\nOpening Balances:\n${JSON.stringify(detail.openingBalances, null, 2)}`,
          detail.leaveBalances &&
            `\nLeave Balances:\n${detail.leaveBalances
              .map((balance) =>
                lines(
                  `${balance.name ?? balance.leaveTypeID}: ${balance.balance ?? 0} ${
                    balance.typeOfUnits ?? ""
                  }`.trim(),
                ),
              )
              .join("\n")}`,
          detail.leaveTypes &&
            `\nLeave Entitlements:\n${JSON.stringify(detail.leaveTypes, null, 2)}`,
          detail.workingPatterns &&
            `\nWorking Patterns:\n${JSON.stringify(detail.workingPatterns, null, 2)}`,
          warningLines(detail.warnings) && `\n${warningLines(detail.warnings)}`,
        ),
      );
    });
  },
);

const CreatePayrollEmployeeTool = CreateXeroTool(
  "create-payroll-employee",
  `Create a payroll employee in Xero.
Creates the employee record only. Follow up with create-payroll-employment to put them on a payroll calendar, and create-payroll-employee-salary-and-wage to set their pay.`,
  employeeFields,
  async (params) => {
    const response = await createPayrollEmployee(params as PayrollV2Employee);

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
  `Update an existing payroll employee's personal details in Xero.
Send the complete set of details you want the employee to have - fields you omit are not preserved.`,
  {
    employeeId: z.string().describe("The Xero employee ID to update."),
    ...employeeFields,
  },
  async ({ employeeId, ...employee }) => {
    const response = await updatePayrollEmployee(
      employeeId,
      employee as PayrollV2Employee,
    );

    return handleResponse("updating payroll employee", response, (updated) =>
      messageResponse(
        `Successfully updated payroll employee: ${updated?.employeeID ?? employeeId}`,
      ),
    );
  },
);

const CreatePayrollEmploymentTool = CreateXeroTool(
  "create-payroll-employment",
  `Set an employee's employment details in Xero Payroll - the payroll calendar they are paid on and their start date.
Required before the employee can appear in a pay run.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    payrollCalendarID: z
      .string()
      .describe("The payroll calendar the employee is paid on."),
    startDate: z.string().describe("Employment start date (YYYY-MM-DD)."),
    employeeNumber: z
      .string()
      .optional()
      .describe("Employer's own employee number (UK)."),
    engagementType: z
      .string()
      .optional()
      .describe("Engagement type (NZ): Permanent, FixedTerm or Casual."),
    fixedTermEndDate: z
      .string()
      .optional()
      .describe("End date for a fixed term engagement (NZ, YYYY-MM-DD)."),
    niCategory: z
      .string()
      .optional()
      .describe("National Insurance category letter (UK)."),
  },
  async ({ employeeId, ...employment }) => {
    const response = await createPayrollEmployment(employeeId, employment);

    return handleResponse("creating employment details", response, () =>
      messageResponse(
        `Successfully set employment details for employee: ${employeeId}`,
      ),
    );
  },
);

const UpdatePayrollEmployeeTaxTool = CreateXeroTool(
  "update-payroll-employee-tax",
  `Update an employee's tax settings in Xero Payroll NZ - IRD number, tax code, KiwiSaver and student loan settings.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    irdNumber: z.string().optional().describe("The employee's IRD number."),
    taxCode: z.string().optional().describe("NZ tax code, for example M or ME."),
    specialTaxRatePercentage: z
      .number()
      .optional()
      .describe("Special tax rate percentage, if one applies."),
    isEligibleForKiwiSaver: z
      .boolean()
      .optional()
      .describe("Whether the employee is eligible for KiwiSaver."),
    esctRatePercentage: z
      .number()
      .optional()
      .describe("Employer superannuation contribution tax rate percentage."),
    kiwiSaverContributions: z
      .string()
      .optional()
      .describe("KiwiSaver contribution status."),
    kiwiSaverEmployeeContributionRatePercentage: z
      .number()
      .optional()
      .describe("Employee KiwiSaver contribution rate percentage."),
    kiwiSaverEmployerContributionRatePercentage: z
      .number()
      .optional()
      .describe("Employer KiwiSaver contribution rate percentage."),
    hasStudentLoanBalance: z
      .boolean()
      .optional()
      .describe("Whether the employee has a student loan balance."),
    studentLoanBalance: z
      .number()
      .optional()
      .describe("Outstanding student loan balance."),
  },
  async ({ employeeId, ...tax }) => {
    const response = await updatePayrollEmployeeTax(employeeId, tax);

    return handleResponse("updating employee tax", response, () =>
      messageResponse(
        `Successfully updated tax settings for employee: ${employeeId}`,
      ),
    );
  },
);

const ListPayrollEmployeeSalaryAndWagesTool = CreateXeroTool(
  "list-payroll-employee-salary-and-wages",
  `List an employee's salary and wages records in Xero Payroll.
Each record links an earnings rate to a pay rate and the date it takes effect.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    page: z.number().optional().describe("Page number, 100 records per page."),
  },
  async ({ employeeId, page }) => {
    const response = await listPayrollEmployeeSalaryAndWages(employeeId, page);

    return handleResponse("listing salary and wages", response, (records) =>
      listResponse("salary and wages records", records, formatSalaryAndWage),
    );
  },
);

const salaryAndWageFields = {
  earningsRateID: z
    .string()
    .describe("The ordinary earnings rate this pay is based on."),
  numberOfUnitsPerWeek: z.number().describe("Units (usually hours) per week."),
  effectiveFrom: z.string().describe("Date the rate takes effect (YYYY-MM-DD)."),
  annualSalary: z.number().describe("Annual salary amount."),
  status: z.string().describe("Active or Pending."),
  paymentType: z.string().describe("Salary or Hourly."),
  ratePerUnit: z.number().optional().describe("Rate per unit for hourly pay."),
  numberOfUnitsPerDay: z.number().optional().describe("Units per day."),
  daysPerWeek: z.number().optional().describe("Days worked per week (NZ)."),
  workPatternType: z
    .string()
    .optional()
    .describe("Working pattern type (NZ)."),
};

const CreatePayrollEmployeeSalaryAndWageTool = CreateXeroTool(
  "create-payroll-employee-salary-and-wage",
  `Add a salary and wages record to an employee in Xero Payroll, setting what they are paid and from when.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    ...salaryAndWageFields,
  },
  async ({ employeeId, ...salary }) => {
    const response = await createPayrollEmployeeSalaryAndWage(
      employeeId,
      salary as PayrollV2SalaryAndWage,
    );

    return handleResponse("creating salary and wage", response, (record) =>
      messageResponse(
        `Successfully created salary and wage record: ${record?.salaryAndWagesID}`,
      ),
    );
  },
);

const UpdatePayrollEmployeeSalaryAndWageTool = CreateXeroTool(
  "update-payroll-employee-salary-and-wage",
  `Update an existing salary and wages record for an employee in Xero Payroll.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    salaryAndWagesID: z.string().describe("The salary and wages record to update."),
    ...salaryAndWageFields,
  },
  async ({ employeeId, salaryAndWagesID, ...salary }) => {
    const response = await updatePayrollEmployeeSalaryAndWage(
      employeeId,
      salaryAndWagesID,
      salary as PayrollV2SalaryAndWage,
    );

    return handleResponse("updating salary and wage", response, () =>
      messageResponse(
        `Successfully updated salary and wage record: ${salaryAndWagesID}`,
      ),
    );
  },
);

const DeletePayrollEmployeeSalaryAndWageTool = CreateXeroTool(
  "delete-payroll-employee-salary-and-wage",
  `Delete a salary and wages record from an employee in Xero Payroll.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    salaryAndWagesID: z.string().describe("The salary and wages record to delete."),
  },
  async ({ employeeId, salaryAndWagesID }) => {
    const response = await deletePayrollEmployeeSalaryAndWage(
      employeeId,
      salaryAndWagesID,
    );

    return handleResponse("deleting salary and wage", response, (id) =>
      messageResponse(`Successfully deleted salary and wage record: ${id}`),
    );
  },
);

const earningsTemplateFields = {
  earningsRateID: z.string().describe("The earnings rate for this template line."),
  ratePerUnit: z.number().optional().describe("Rate per unit."),
  numberOfUnits: z.number().optional().describe("Number of units per pay period."),
  fixedAmount: z.number().optional().describe("Fixed amount per pay period."),
};

const CreatePayrollEmployeeEarningsTemplateTool = CreateXeroTool(
  "create-payroll-employee-earnings-template",
  `Add an earnings line to an employee's pay template in Xero Payroll, so it is included automatically in every pay run.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    ...earningsTemplateFields,
  },
  async ({ employeeId, ...template }) => {
    const response = await createPayrollEmployeeEarningsTemplate(
      employeeId,
      template as PayrollV2EarningsTemplate,
    );

    return handleResponse("creating earnings template", response, (created) =>
      messageResponse(
        created
          ? `Successfully created pay template earning: ${created.payTemplateEarningID}`
          : "Pay template earning created.",
      ),
    );
  },
);

const UpdatePayrollEmployeeEarningsTemplateTool = CreateXeroTool(
  "update-payroll-employee-earnings-template",
  `Update an earnings line on an employee's pay template in Xero Payroll.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    payTemplateEarningID: z
      .string()
      .describe("The pay template earning line to update."),
    ...earningsTemplateFields,
  },
  async ({ employeeId, payTemplateEarningID, ...template }) => {
    const response = await updatePayrollEmployeeEarningsTemplate(
      employeeId,
      payTemplateEarningID,
      template as PayrollV2EarningsTemplate,
    );

    return handleResponse("updating earnings template", response, (updated) =>
      messageResponse(
        updated
          ? formatEarningsTemplate(updated)
          : `Successfully updated pay template earning: ${payTemplateEarningID}`,
      ),
    );
  },
);

const DeletePayrollEmployeeEarningsTemplateTool = CreateXeroTool(
  "delete-payroll-employee-earnings-template",
  `Remove an earnings line from an employee's pay template in Xero Payroll.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    payTemplateEarningID: z
      .string()
      .describe("The pay template earning line to delete."),
  },
  async ({ employeeId, payTemplateEarningID }) => {
    const response = await deletePayrollEmployeeEarningsTemplate(
      employeeId,
      payTemplateEarningID,
    );

    return handleResponse("deleting earnings template", response, (id) =>
      messageResponse(`Successfully deleted pay template earning: ${id}`),
    );
  },
);

const CreatePayrollEmployeePaymentMethodTool = CreateXeroTool(
  "create-payroll-employee-payment-method",
  `Set how an employee is paid in Xero Payroll - electronic transfer to one or more bank accounts, or cheque.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    paymentMethod: z
      .string()
      .describe("Payment method: Electronically, Cheque or Manual."),
    bankAccounts: z
      .array(
        z.object({
          accountName: z.string().describe("Name on the bank account."),
          accountNumber: z.string().describe("Bank account number."),
          sortCode: z.string().describe("Sort code or bank/branch number."),
          particulars: z.string().optional().describe("Statement particulars (NZ)."),
          code: z.string().optional().describe("Statement code (NZ)."),
          reference: z.string().optional().describe("Statement reference (NZ)."),
          dollarAmount: z
            .number()
            .optional()
            .describe("Fixed amount to pay to this account."),
          calculationType: z
            .string()
            .optional()
            .describe("How the split is calculated, e.g. FixedAmount or Balance."),
        }),
      )
      .optional()
      .describe("Bank accounts to pay into, required for electronic payment."),
  },
  async ({ employeeId, ...paymentMethod }) => {
    const response = await createPayrollEmployeePaymentMethod(
      employeeId,
      paymentMethod,
    );

    return handleResponse("setting payment method", response, () =>
      messageResponse(
        `Successfully set the payment method for employee: ${employeeId}`,
      ),
    );
  },
);

const SetPayrollEmployeeOpeningBalancesTool = CreateXeroTool(
  "set-payroll-employee-opening-balances",
  `Record an employee's payroll opening balances in Xero - what they were already paid this tax year before joining Xero Payroll.
NZ takes one entry per pay period. UK takes a single record of statutory payment totals, and only the first entry is used.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    openingBalances: z
      .array(
        z.object({
          periodEndDate: z
            .string()
            .optional()
            .describe("Pay period end date (NZ, YYYY-MM-DD)."),
          daysPaid: z.number().optional().describe("Days paid in the period (NZ)."),
          unpaidWeeks: z.number().optional().describe("Unpaid weeks (NZ)."),
          grossEarnings: z.number().optional().describe("Gross earnings (NZ)."),
          statutoryAdoptionPay: z
            .number()
            .optional()
            .describe("Statutory adoption pay to date (UK)."),
          statutoryMaternityPay: z
            .number()
            .optional()
            .describe("Statutory maternity pay to date (UK)."),
          statutoryPaternityPay: z
            .number()
            .optional()
            .describe("Statutory paternity pay to date (UK)."),
          statutorySharedParentalPay: z
            .number()
            .optional()
            .describe("Statutory shared parental pay to date (UK)."),
          statutorySickPay: z
            .number()
            .optional()
            .describe("Statutory sick pay to date (UK)."),
          priorEmployeeNumber: z
            .number()
            .optional()
            .describe("Employee number with the prior system (UK)."),
        }),
      )
      .describe("Opening balance entries."),
  },
  async ({ employeeId, openingBalances }) => {
    const response = await setPayrollEmployeeOpeningBalances(
      employeeId,
      openingBalances,
    );

    return handleResponse("setting opening balances", response, () =>
      messageResponse(
        `Successfully set opening balances for employee: ${employeeId}`,
      ),
    );
  },
);

const ListPayrollEmployeeWorkingPatternsTool = CreateXeroTool(
  "list-payroll-employee-working-patterns",
  `List an employee's working patterns in Xero Payroll NZ - the hours they work on each day of the week, and when each pattern took effect.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
  },
  async ({ employeeId }) => {
    const response = await listPayrollEmployeeWorkingPatterns(employeeId);

    return handleResponse("listing working patterns", response, (patterns) =>
      listResponse("working patterns", patterns, (pattern) =>
        lines(
          `Working Pattern: ${pattern.payeeWorkingPatternID}`,
          field("Effective From", pattern.effectiveFrom),
          pattern.workingWeeks &&
            `Weeks: ${JSON.stringify(pattern.workingWeeks)}`,
        ),
      ),
    );
  },
);

const CreatePayrollEmployeeWorkingPatternTool = CreateXeroTool(
  "create-payroll-employee-working-pattern",
  `Create a working pattern for an employee in Xero Payroll NZ, describing the units worked on each day of the week.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    effectiveFrom: z
      .string()
      .describe("Date the pattern takes effect (YYYY-MM-DD)."),
    workingWeeks: z
      .array(
        z.object({
          monday: z.number().describe("Units worked on Monday."),
          tuesday: z.number().describe("Units worked on Tuesday."),
          wednesday: z.number().describe("Units worked on Wednesday."),
          thursday: z.number().describe("Units worked on Thursday."),
          friday: z.number().describe("Units worked on Friday."),
          saturday: z.number().describe("Units worked on Saturday."),
          sunday: z.number().describe("Units worked on Sunday."),
        }),
      )
      .describe("One entry per week in the repeating pattern."),
  },
  async ({ employeeId, ...pattern }) => {
    const response = await createPayrollEmployeeWorkingPattern(
      employeeId,
      pattern,
    );

    return handleResponse("creating working pattern", response, (created) =>
      messageResponse(
        `Successfully created working pattern: ${created?.payeeWorkingPatternID}`,
      ),
    );
  },
);

const DeletePayrollEmployeeWorkingPatternTool = CreateXeroTool(
  "delete-payroll-employee-working-pattern",
  `Delete a working pattern from an employee in Xero Payroll NZ.`,
  {
    employeeId: z.string().describe("The Xero employee ID."),
    employeeWorkingPatternID: z
      .string()
      .describe("The working pattern to delete."),
  },
  async ({ employeeId, employeeWorkingPatternID }) => {
    const response = await deletePayrollEmployeeWorkingPattern(
      employeeId,
      employeeWorkingPatternID,
    );

    return handleResponse("deleting working pattern", response, (id) =>
      messageResponse(`Successfully deleted working pattern: ${id}`),
    );
  },
);

export const V2EmployeeTools: RegionalTool[] = [
  forRegions(V2, ListPayrollEmployeesTool),
  forRegions(V2, GetPayrollEmployeeTool),
  forRegions(V2, CreatePayrollEmployeeTool),
  forRegions(V2, UpdatePayrollEmployeeTool),
  forRegions(V2, CreatePayrollEmploymentTool),
  forRegions(NZ_ONLY, UpdatePayrollEmployeeTaxTool),
  forRegions(V2, ListPayrollEmployeeSalaryAndWagesTool),
  forRegions(V2, CreatePayrollEmployeeSalaryAndWageTool),
  forRegions(V2, UpdatePayrollEmployeeSalaryAndWageTool),
  forRegions(V2, DeletePayrollEmployeeSalaryAndWageTool),
  forRegions(V2, CreatePayrollEmployeeEarningsTemplateTool),
  forRegions(V2, UpdatePayrollEmployeeEarningsTemplateTool),
  forRegions(V2, DeletePayrollEmployeeEarningsTemplateTool),
  forRegions(V2, CreatePayrollEmployeePaymentMethodTool),
  forRegions(V2, SetPayrollEmployeeOpeningBalancesTool),
  forRegions(NZ_ONLY, ListPayrollEmployeeWorkingPatternsTool),
  forRegions(NZ_ONLY, CreatePayrollEmployeeWorkingPatternTool),
  forRegions(NZ_ONLY, DeletePayrollEmployeeWorkingPatternTool),
];
