/**
 * Import shim for the Australian Payroll (v1) models.
 *
 * xero-node does not re-export the regional payroll models from its package
 * root, so every consumer would otherwise reach into `dist/gen/model/...`
 * directly. Keeping those deep paths in one place means an SDK layout change is
 * a single-file fix.
 *
 * AU is served by the older Payroll v1 API, which has a different model set to
 * the UK/NZ v2 APIs - see `payroll-v2.ts` for those.
 */

export { Employee as AuEmployee } from "xero-node/dist/gen/model/payroll-au/employee.js";
export { EmployeeStatus as AuEmployeeStatus } from "xero-node/dist/gen/model/payroll-au/employeeStatus.js";
export { HomeAddress as AuHomeAddress } from "xero-node/dist/gen/model/payroll-au/homeAddress.js";
export { BankAccount as AuBankAccount } from "xero-node/dist/gen/model/payroll-au/bankAccount.js";
export { PayTemplate as AuPayTemplate } from "xero-node/dist/gen/model/payroll-au/payTemplate.js";
export { OpeningBalances as AuOpeningBalances } from "xero-node/dist/gen/model/payroll-au/openingBalances.js";
export { TaxDeclaration as AuTaxDeclaration } from "xero-node/dist/gen/model/payroll-au/taxDeclaration.js";
export { LeaveBalance as AuLeaveBalance } from "xero-node/dist/gen/model/payroll-au/leaveBalance.js";
export { LeaveLine as AuLeaveLine } from "xero-node/dist/gen/model/payroll-au/leaveLine.js";
export { SuperMembership as AuSuperMembership } from "xero-node/dist/gen/model/payroll-au/superMembership.js";

export { LeaveApplication as AuLeaveApplication } from "xero-node/dist/gen/model/payroll-au/leaveApplication.js";
export { LeavePeriod as AuLeavePeriod } from "xero-node/dist/gen/model/payroll-au/leavePeriod.js";

export { PayRun as AuPayRun } from "xero-node/dist/gen/model/payroll-au/payRun.js";
export { PayRunStatus as AuPayRunStatus } from "xero-node/dist/gen/model/payroll-au/payRunStatus.js";
export { Payslip as AuPayslip } from "xero-node/dist/gen/model/payroll-au/payslip.js";
export { PayslipLines as AuPayslipLines } from "xero-node/dist/gen/model/payroll-au/payslipLines.js";
export { PayslipSummary as AuPayslipSummary } from "xero-node/dist/gen/model/payroll-au/payslipSummary.js";

export { PayrollCalendar as AuPayrollCalendar } from "xero-node/dist/gen/model/payroll-au/payrollCalendar.js";
export { CalendarType as AuCalendarType } from "xero-node/dist/gen/model/payroll-au/calendarType.js";

export { PayItem as AuPayItem } from "xero-node/dist/gen/model/payroll-au/payItem.js";
export { EarningsRate as AuEarningsRate } from "xero-node/dist/gen/model/payroll-au/earningsRate.js";
export { DeductionType as AuDeductionType } from "xero-node/dist/gen/model/payroll-au/deductionType.js";
export { LeaveType as AuLeaveType } from "xero-node/dist/gen/model/payroll-au/leaveType.js";
export { ReimbursementType as AuReimbursementType } from "xero-node/dist/gen/model/payroll-au/reimbursementType.js";

export { Settings as AuSettings } from "xero-node/dist/gen/model/payroll-au/settings.js";
export { Account as AuAccount } from "xero-node/dist/gen/model/payroll-au/account.js";

export { SuperFund as AuSuperFund } from "xero-node/dist/gen/model/payroll-au/superFund.js";
export { SuperFundProduct as AuSuperFundProduct } from "xero-node/dist/gen/model/payroll-au/superFundProduct.js";

export { Timesheet as AuTimesheet } from "xero-node/dist/gen/model/payroll-au/timesheet.js";
export { TimesheetLine as AuTimesheetLine } from "xero-node/dist/gen/model/payroll-au/timesheetLine.js";
export { TimesheetStatus } from "xero-node/dist/gen/model/payroll-au/timesheetStatus.js";
