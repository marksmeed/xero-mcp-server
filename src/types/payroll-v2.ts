/**
 * Structural facade over the Xero Payroll v2 APIs (UK and NZ).
 *
 * `payrollUKApi` and `payrollNZApi` are generated separately but expose the
 * same endpoints with near-identical models. Rather than duplicating every
 * handler once per region, handlers talk to this facade and the concrete SDK
 * client is cast to it in `src/clients/payroll-api.ts`.
 *
 * Entity fields are the union of the UK and NZ models and are all optional - a
 * field absent in one region simply comes back undefined. Methods that exist in
 * only one region are declared optional and must be guarded at the call site.
 */

export interface PayrollV2Pagination {
  page?: number;
  pageSize?: number;
  pageCount?: number;
  itemCount?: number;
}

export interface PayrollV2Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  suburb?: string;
  region?: string;
  postCode?: string;
  countryName?: string;
}

export interface PayrollV2Employee {
  employeeID?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: PayrollV2Address;
  email?: string;
  gender?: string;
  phoneNumber?: string;
  startDate?: string;
  endDate?: string;
  payrollCalendarID?: string;
  updatedDateUTC?: Date | string;
  createdDateUTC?: Date | string;
  // NZ only
  jobTitle?: string;
  engagementType?: string;
  fixedTermEndDate?: string;
  // UK only
  niCategory?: string;
  nationalInsuranceNumber?: string;
  isOffPayrollWorker?: boolean;
}

export interface PayrollV2Employment {
  payrollCalendarID?: string;
  payRunCalendarID?: string;
  startDate?: string;
  employeeNumber?: string;
  engagementType?: string;
  fixedTermEndDate?: string;
  niCategory?: string;
}

export interface PayrollV2EmployeeTax {
  // UK
  starterType?: string;
  starterDeclaration?: string;
  taxCode?: string;
  previousTaxablePay?: number;
  previousTaxPaid?: number;
  studentLoanDeduction?: string;
  hasPostGraduateLoans?: boolean;
  isDirector?: boolean;
  directorshipStartDate?: string;
  nicCalculationMethod?: string;
  // NZ
  irdNumber?: string;
  specialTaxRatePercentage?: number;
  isEligibleForKiwiSaver?: boolean;
  esctRatePercentage?: number;
  kiwiSaverContributions?: string;
  kiwiSaverEmployeeContributionRatePercentage?: number;
  kiwiSaverEmployerContributionRatePercentage?: number;
  hasStudentLoanBalance?: boolean;
  studentLoanBalance?: number;
}

export interface PayrollV2LeavePeriod {
  periodStartDate?: string;
  periodEndDate?: string;
  numberOfUnits?: number;
  periodStatus?: string;
}

export interface PayrollV2EmployeeLeave {
  leaveID?: string;
  leaveTypeID?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  periods?: PayrollV2LeavePeriod[];
  updatedDateUTC?: Date | string;
}

export interface PayrollV2LeaveBalance {
  name?: string;
  leaveTypeID?: string;
  balance?: number;
  typeOfUnits?: string;
}

export interface PayrollV2LeaveType {
  leaveTypeID?: string;
  name?: string;
  isPaidLeave?: boolean;
  showOnPayslip?: boolean;
  isActive?: boolean;
  isStatutoryLeave?: boolean;
  typeOfUnits?: string;
  typeOfUnitsToAccrue?: string;
  updatedDateUTC?: Date | string;
}

export interface PayrollV2EmployeeLeaveType {
  leaveTypeID?: string;
  scheduleOfAccrual?: string;
  hoursAccruedAnnually?: number;
  unitsAccruedAnnually?: number;
  typeOfUnitsToAccrue?: string;
  maximumToAccrue?: number;
  openingBalance?: number;
  rateAccruedHourly?: number;
  percentageOfGrossEarnings?: number;
  includeHolidayPayEveryPay?: boolean;
  scheduleOfAccrualDate?: string;
}

export interface PayrollV2EarningsRate {
  earningsRateID?: string;
  name?: string;
  earningsType?: string;
  rateType?: string;
  typeOfUnits?: string;
  currentRecord?: boolean;
  expenseAccountID?: string;
  ratePerUnit?: number;
  multipleOfOrdinaryEarningsRate?: number;
  fixedAmount?: number;
}

export interface PayrollV2Deduction {
  deductionId?: string;
  deductionName?: string;
  deductionCategory?: string;
  liabilityAccountId?: string;
  currentRecord?: boolean;
  standardAmount?: number;
  calculationType?: string;
  percentage?: number;
  subjectToTax?: boolean;
  isPension?: boolean;
}

export interface PayrollV2Reimbursement {
  reimbursementID?: string;
  name?: string;
  accountID?: string;
  currentRecord?: boolean;
  reimbursementCategory?: string;
  calculationType?: string;
  standardAmount?: string | number;
  standardTypeOfUnits?: string;
  standardRatePerUnit?: number;
}

export interface PayrollV2Benefit {
  id?: string;
  name?: string;
  category?: string;
  liabilityAccountId?: string;
  expenseAccountId?: string;
  standardAmount?: number;
  percentage?: number;
  companyMax?: number;
  calculationType?: string;
  calculationTypeNZ?: string;
  currentRecord?: boolean;
}

export interface PayrollV2StatutoryDeduction {
  id?: string;
  name?: string;
  statutoryDeductionCategory?: string;
  liabilityAccountId?: string;
  currentRecord?: boolean;
}

export interface PayrollV2EarningsTemplate {
  payTemplateEarningID?: string;
  earningsRateID?: string;
  name?: string;
  ratePerUnit?: number;
  numberOfUnits?: number;
  fixedAmount?: number;
}

export interface PayrollV2PayTemplate {
  employeeID?: string;
  earningTemplates?: PayrollV2EarningsTemplate[];
}

export interface PayrollV2SalaryAndWage {
  salaryAndWagesID?: string;
  earningsRateID?: string;
  numberOfUnitsPerWeek?: number;
  ratePerUnit?: number;
  numberOfUnitsPerDay?: number;
  daysPerWeek?: number;
  effectiveFrom?: string;
  annualSalary?: number;
  status?: string;
  paymentType?: string;
  workPatternType?: string;
}

export interface PayrollV2BankAccount {
  accountName?: string;
  accountNumber?: string;
  sortCode?: string;
  particulars?: string;
  code?: string;
  reference?: string;
  dollarAmount?: number;
  calculationType?: string;
}

export interface PayrollV2PaymentMethod {
  paymentMethod?: string;
  bankAccounts?: PayrollV2BankAccount[];
}

export interface PayrollV2OpeningBalances {
  // UK shape
  statutoryAdoptionPay?: number;
  statutoryMaternityPay?: number;
  statutoryPaternityPay?: number;
  statutorySharedParentalPay?: number;
  statutorySickPay?: number;
  priorEmployeeNumber?: number;
  // NZ shape (sent and returned as an array of period balances)
  periodEndDate?: string;
  daysPaid?: number;
  unpaidWeeks?: number;
  grossEarnings?: number;
}

export interface PayrollV2WorkingWeek {
  monday?: number;
  tuesday?: number;
  wednesday?: number;
  thursday?: number;
  friday?: number;
  saturday?: number;
  sunday?: number;
}

export interface PayrollV2WorkingPattern {
  payeeWorkingPatternID?: string;
  effectiveFrom?: string;
  workingWeeks?: PayrollV2WorkingWeek[];
}

export interface PayrollV2LeaveSetup {
  includeHolidayPay?: boolean;
  holidayPayOpeningBalance?: number;
  annualLeaveOpeningBalance?: number;
  negativeAnnualLeaveBalancePaidAmount?: number;
  sickLeaveHoursToAccrueAnnually?: number;
  sickLeaveMaximumHoursToAccrue?: number;
  sickLeaveToAccrueAnnually?: number;
  sickLeaveMaximumToAccrue?: number;
  sickLeaveOpeningBalance?: number;
  sickLeaveScheduleOfAccrual?: string;
  sickLeaveAnniversaryDate?: string;
  annualLeaveAnniversaryDate?: string;
}

export interface PayrollV2StatutorySickLeave {
  statutorySickLeaveID?: string;
  employeeID?: string;
  leaveTypeID?: string;
  startDate?: string;
  endDate?: string;
  workPattern?: string[];
  isPregnancyRelated?: boolean;
  sufficientNotice?: boolean;
  isEntitled?: boolean;
  entitlementFailureReasons?: string[];
}

export interface PayrollV2StatutoryLeaveSummary {
  employeeStatutoryLeaveID?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PayrollV2PayslipLine {
  earningsRateID?: string;
  leaveTypeID?: string;
  deductionTypeID?: string;
  reimbursementTypeID?: string;
  description?: string;
  displayName?: string;
  amount?: number;
  numberOfUnits?: number;
  ratePerUnit?: number;
  fixedAmount?: number;
}

export interface PayrollV2Payslip {
  paySlipID?: string;
  employeeID?: string;
  payRunID?: string;
  lastEdited?: string;
  firstName?: string;
  lastName?: string;
  totalEarnings?: number;
  grossEarnings?: number;
  totalPay?: number;
  totalEmployerTaxes?: number;
  totalEmployeeTaxes?: number;
  totalDeductions?: number;
  totalReimbursements?: number;
  totalCourtOrders?: number;
  totalBenefits?: number;
  totalStatutoryDeductions?: number;
  totalSuperannuation?: number;
  paymentMethod?: string;
  earningsLines?: PayrollV2PayslipLine[];
  leaveEarningsLines?: PayrollV2PayslipLine[];
  timesheetEarningsLines?: PayrollV2PayslipLine[];
  deductionLines?: PayrollV2PayslipLine[];
  reimbursementLines?: PayrollV2PayslipLine[];
  leaveAccrualLines?: PayrollV2PayslipLine[];
  benefitLines?: PayrollV2PayslipLine[];
  superannuationLines?: PayrollV2PayslipLine[];
  employeeTaxLines?: PayrollV2PayslipLine[];
  employerTaxLines?: PayrollV2PayslipLine[];
}

export interface PayrollV2PayRun {
  payRunID?: string;
  payrollCalendarID?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  paymentDate?: string;
  totalCost?: number;
  totalPay?: number;
  payRunStatus?: string;
  payRunType?: string;
  calendarType?: string;
  postedDateTime?: string;
  paySlips?: PayrollV2Payslip[];
}

export interface PayrollV2PayRunCalendar {
  payrollCalendarID?: string;
  name?: string;
  calendarType?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  paymentDate?: string;
  updatedDateUTC?: Date | string;
}

export interface PayrollV2TimesheetLine {
  timesheetLineID?: string;
  date?: string;
  earningsRateID?: string;
  trackingItemID?: string;
  numberOfUnits?: number;
}

export interface PayrollV2Timesheet {
  timesheetID?: string;
  payrollCalendarID?: string;
  employeeID?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  totalHours?: number;
  updatedDateUTC?: Date | string;
  timesheetLines?: PayrollV2TimesheetLine[];
}

export interface PayrollV2Account {
  accountID?: string;
  type?: string;
  code?: string;
  name?: string;
}

export interface PayrollV2TrackingCategories {
  employeeGroupsTrackingCategoryID?: string;
  timesheetTrackingCategoryID?: string;
}

/** Per-request options accepted by every generated xero-node API method. */
export interface PayrollRequestOptions {
  headers: { [name: string]: string };
}

type Body<T> = Promise<{ body: T }>;

/**
 * Methods declared optional exist in only one of the two v2 regions. Callers
 * must guard on them before invoking.
 */
export interface PayrollV2Api {
  // Employees
  getEmployees(
    tenantId: string,
    filter?: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{
    employees?: PayrollV2Employee[];
    pagination?: PayrollV2Pagination;
  }>;
  getEmployee(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ employee?: PayrollV2Employee }>;
  createEmployee(
    tenantId: string,
    employee: PayrollV2Employee,
    options?: PayrollRequestOptions,
  ): Body<{ employee?: PayrollV2Employee }>;
  updateEmployee(
    tenantId: string,
    employeeID: string,
    employee: PayrollV2Employee,
    options?: PayrollRequestOptions,
  ): Body<{ employee?: PayrollV2Employee }>;
  createEmployment(
    tenantId: string,
    employeeID: string,
    employment: PayrollV2Employment,
    options?: PayrollRequestOptions,
  ): Body<{ employment?: PayrollV2Employment }>;
  getEmployeeTax(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ employeeTax?: PayrollV2EmployeeTax }>;
  updateEmployeeTax?(
    tenantId: string,
    employeeID: string,
    employeeTax: PayrollV2EmployeeTax,
    options?: PayrollRequestOptions,
  ): Body<{ employeeTax?: PayrollV2EmployeeTax }>;

  // Employee leave
  getEmployeeLeaves(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ leave?: PayrollV2EmployeeLeave[] }>;
  createEmployeeLeave(
    tenantId: string,
    employeeID: string,
    employeeLeave: PayrollV2EmployeeLeave,
    options?: PayrollRequestOptions,
  ): Body<{ leave?: PayrollV2EmployeeLeave }>;
  updateEmployeeLeave(
    tenantId: string,
    employeeID: string,
    leaveID: string,
    employeeLeave: PayrollV2EmployeeLeave,
    options?: PayrollRequestOptions,
  ): Body<{ leave?: PayrollV2EmployeeLeave }>;
  deleteEmployeeLeave(
    tenantId: string,
    employeeID: string,
    leaveID: string,
    options?: PayrollRequestOptions,
  ): Body<{ leave?: PayrollV2EmployeeLeave }>;
  getEmployeeLeaveBalances(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ leaveBalances?: PayrollV2LeaveBalance[] }>;
  getEmployeeLeavePeriods(
    tenantId: string,
    employeeID: string,
    startDate?: string,
    endDate?: string,
    options?: PayrollRequestOptions,
  ): Body<{ periods?: PayrollV2LeavePeriod[] }>;
  getEmployeeLeaveTypes(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ leaveTypes?: PayrollV2EmployeeLeaveType[] }>;
  createEmployeeLeaveType(
    tenantId: string,
    employeeID: string,
    employeeLeaveType: PayrollV2EmployeeLeaveType,
    options?: PayrollRequestOptions,
  ): Body<{ leaveType?: PayrollV2EmployeeLeaveType }>;
  createEmployeeLeaveSetup?(
    tenantId: string,
    employeeID: string,
    leaveSetup: PayrollV2LeaveSetup,
    options?: PayrollRequestOptions,
  ): Body<{ leaveSetup?: PayrollV2LeaveSetup }>;
  getLeaveTypes(
    tenantId: string,
    page?: number,
    activeOnly?: boolean,
    options?: PayrollRequestOptions,
  ): Body<{ leaveTypes?: PayrollV2LeaveType[] }>;
  createLeaveType(
    tenantId: string,
    leaveType: PayrollV2LeaveType,
    options?: PayrollRequestOptions,
  ): Body<{ leaveType?: PayrollV2LeaveType }>;

  // UK statutory leave
  getStatutoryLeaveSummary?(
    tenantId: string,
    employeeID: string,
    activeOnly?: boolean,
    options?: PayrollRequestOptions,
  ): Body<{ statutoryLeaves?: PayrollV2StatutoryLeaveSummary[] }>;
  createEmployeeStatutorySickLeave?(
    tenantId: string,
    leave: PayrollV2StatutorySickLeave,
    options?: PayrollRequestOptions,
  ): Body<{ statutorySickLeave?: PayrollV2StatutorySickLeave }>;
  getEmployeeStatutorySickLeave?(
    tenantId: string,
    statutorySickLeaveID: string,
    options?: PayrollRequestOptions,
  ): Body<{ statutorySickLeave?: PayrollV2StatutorySickLeave }>;

  // Pay templates and salary
  /** UK spells this singular, NZ plural; both return `{ payTemplate }`. */
  getEmployeePayTemplate?(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ payTemplate?: PayrollV2PayTemplate }>;
  getEmployeePayTemplates?(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ payTemplate?: PayrollV2PayTemplate }>;
  createEmployeeEarningsTemplate(
    tenantId: string,
    employeeID: string,
    earningsTemplate: PayrollV2EarningsTemplate,
    options?: PayrollRequestOptions,
  ): Body<{ earningTemplate?: PayrollV2EarningsTemplate }>;
  updateEmployeeEarningsTemplate(
    tenantId: string,
    employeeID: string,
    payTemplateEarningID: string,
    earningsTemplate: PayrollV2EarningsTemplate,
    options?: PayrollRequestOptions,
  ): Body<{ earningTemplate?: PayrollV2EarningsTemplate }>;
  deleteEmployeeEarningsTemplate(
    tenantId: string,
    employeeID: string,
    payTemplateEarningID: string,
    options?: PayrollRequestOptions,
  ): Body<unknown>;
  getEmployeeSalaryAndWages(
    tenantId: string,
    employeeID: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ salaryAndWages?: PayrollV2SalaryAndWage[] }>;
  createEmployeeSalaryAndWage(
    tenantId: string,
    employeeID: string,
    salaryAndWage: PayrollV2SalaryAndWage,
    options?: PayrollRequestOptions,
  ): Body<{ salaryAndWage?: PayrollV2SalaryAndWage }>;
  updateEmployeeSalaryAndWage(
    tenantId: string,
    employeeID: string,
    salaryAndWagesID: string,
    salaryAndWage: PayrollV2SalaryAndWage,
    options?: PayrollRequestOptions,
  ): Body<{ salaryAndWage?: PayrollV2SalaryAndWage }>;
  deleteEmployeeSalaryAndWage(
    tenantId: string,
    employeeID: string,
    salaryAndWagesID: string,
    options?: PayrollRequestOptions,
  ): Body<unknown>;
  getEmployeePaymentMethod(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ paymentMethod?: PayrollV2PaymentMethod }>;
  createEmployeePaymentMethod(
    tenantId: string,
    employeeID: string,
    paymentMethod: PayrollV2PaymentMethod,
    options?: PayrollRequestOptions,
  ): Body<{ paymentMethod?: PayrollV2PaymentMethod }>;
  getEmployeeOpeningBalances(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{
    openingBalances?: PayrollV2OpeningBalances | PayrollV2OpeningBalances[];
  }>;
  createEmployeeOpeningBalances(
    tenantId: string,
    employeeID: string,
    openingBalances: PayrollV2OpeningBalances | PayrollV2OpeningBalances[],
    options?: PayrollRequestOptions,
  ): Body<{
    openingBalances?: PayrollV2OpeningBalances | PayrollV2OpeningBalances[];
  }>;
  updateEmployeeOpeningBalances?(
    tenantId: string,
    employeeID: string,
    openingBalances: PayrollV2OpeningBalances,
    options?: PayrollRequestOptions,
  ): Body<{ openingBalances?: PayrollV2OpeningBalances }>;

  // NZ working patterns
  getEmployeeWorkingPatterns?(
    tenantId: string,
    employeeID: string,
    options?: PayrollRequestOptions,
  ): Body<{ payeeWorkingPatterns?: PayrollV2WorkingPattern[] }>;
  createEmployeeWorkingPattern?(
    tenantId: string,
    employeeID: string,
    workingPattern: PayrollV2WorkingPattern,
    options?: PayrollRequestOptions,
  ): Body<{ payeeWorkingPattern?: PayrollV2WorkingPattern }>;
  deleteEmployeeWorkingPattern?(
    tenantId: string,
    employeeID: string,
    employeeWorkingPatternID: string,
    options?: PayrollRequestOptions,
  ): Body<unknown>;

  // Pay items
  getEarningsRates(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ earningsRates?: PayrollV2EarningsRate[] }>;
  createEarningsRate(
    tenantId: string,
    earningsRate: PayrollV2EarningsRate,
    options?: PayrollRequestOptions,
  ): Body<{ earningsRate?: PayrollV2EarningsRate }>;
  getDeductions(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ deductions?: PayrollV2Deduction[] }>;
  createDeduction(
    tenantId: string,
    deduction: PayrollV2Deduction,
    options?: PayrollRequestOptions,
  ): Body<{ deduction?: PayrollV2Deduction }>;
  getReimbursements(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ reimbursements?: PayrollV2Reimbursement[] }>;
  createReimbursement(
    tenantId: string,
    reimbursement: PayrollV2Reimbursement,
    options?: PayrollRequestOptions,
  ): Body<{ reimbursement?: PayrollV2Reimbursement }>;
  getBenefits?(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ benefits?: PayrollV2Benefit[] }>;
  createBenefit?(
    tenantId: string,
    benefit: PayrollV2Benefit,
    options?: PayrollRequestOptions,
  ): Body<{ benefit?: PayrollV2Benefit }>;
  getSuperannuations?(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ benefits?: PayrollV2Benefit[] }>;
  createSuperannuation?(
    tenantId: string,
    benefit: PayrollV2Benefit,
    options?: PayrollRequestOptions,
  ): Body<{ benefit?: PayrollV2Benefit }>;
  getStatutoryDeductions?(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ statutoryDeductions?: PayrollV2StatutoryDeduction[] }>;
  getEarningsOrders?(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ statutoryDeductions?: PayrollV2StatutoryDeduction[] }>;

  // Pay runs, payslips, calendars
  getPayRuns(
    tenantId: string,
    page?: number,
    status?: "Draft" | "Posted",
    options?: PayrollRequestOptions,
  ): Body<{ payRuns?: PayrollV2PayRun[] }>;
  getPayRun(
    tenantId: string,
    payRunID: string,
    options?: PayrollRequestOptions,
  ): Body<{ payRun?: PayrollV2PayRun }>;
  createPayRun?(
    tenantId: string,
    payRun: PayrollV2PayRun,
    options?: PayrollRequestOptions,
  ): Body<{ payRun?: PayrollV2PayRun }>;
  getPaySlips(
    tenantId: string,
    payRunID: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ paySlips?: PayrollV2Payslip[] }>;
  getPaySlip(
    tenantId: string,
    payslipID: string,
    options?: PayrollRequestOptions,
  ): Body<{ paySlip?: PayrollV2Payslip }>;
  updatePaySlipLineItems?(
    tenantId: string,
    paySlipID: string,
    paySlip: PayrollV2Payslip,
    options?: PayrollRequestOptions,
  ): Body<{ paySlip?: PayrollV2Payslip }>;
  getPayRunCalendars(
    tenantId: string,
    page?: number,
    options?: PayrollRequestOptions,
  ): Body<{ payRunCalendars?: PayrollV2PayRunCalendar[] }>;
  getPayRunCalendar(
    tenantId: string,
    payRunCalendarID: string,
    options?: PayrollRequestOptions,
  ): Body<{ payRunCalendar?: PayrollV2PayRunCalendar }>;
  createPayRunCalendar(
    tenantId: string,
    payRunCalendar: PayrollV2PayRunCalendar,
    options?: PayrollRequestOptions,
  ): Body<{ payRunCalendar?: PayrollV2PayRunCalendar }>;

  // Settings
  getSettings(
    tenantId: string,
    options?: PayrollRequestOptions,
  ): Body<{ settings?: { accounts?: PayrollV2Account[] } }>;
  getTrackingCategories(
    tenantId: string,
    options?: PayrollRequestOptions,
  ): Body<{ trackingCategories?: PayrollV2TrackingCategories }>;

  // Timesheets
  getTimesheets(
    tenantId: string,
    page?: number,
    filter?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    sort?: string,
    options?: PayrollRequestOptions,
  ): Body<{ timesheets?: PayrollV2Timesheet[] }>;
  getTimesheet(
    tenantId: string,
    timesheetID: string,
    options?: PayrollRequestOptions,
  ): Body<{ timesheet?: PayrollV2Timesheet }>;
  createTimesheet(
    tenantId: string,
    timesheet: PayrollV2Timesheet,
    options?: PayrollRequestOptions,
  ): Body<{ timesheet?: PayrollV2Timesheet }>;
  deleteTimesheet(tenantId: string, timesheetID: string, options?: PayrollRequestOptions): Body<unknown>;
  approveTimesheet(
    tenantId: string,
    timesheetID: string,
    options?: PayrollRequestOptions,
  ): Body<{ timesheet?: PayrollV2Timesheet }>;
  revertTimesheet(
    tenantId: string,
    timesheetID: string,
    options?: PayrollRequestOptions,
  ): Body<{ timesheet?: PayrollV2Timesheet }>;
  createTimesheetLine(
    tenantId: string,
    timesheetID: string,
    timesheetLine: PayrollV2TimesheetLine,
    options?: PayrollRequestOptions,
  ): Body<{ timesheetLine?: PayrollV2TimesheetLine }>;
  updateTimesheetLine(
    tenantId: string,
    timesheetID: string,
    timesheetLineID: string,
    timesheetLine: PayrollV2TimesheetLine,
    options?: PayrollRequestOptions,
  ): Body<{ timesheetLine?: PayrollV2TimesheetLine }>;
  deleteTimesheetLine(
    tenantId: string,
    timesheetID: string,
    timesheetLineID: string,
    options?: PayrollRequestOptions,
  ): Body<unknown>;
}
