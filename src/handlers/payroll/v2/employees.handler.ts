import {
  payrollRequest,
  payrollV2,
  payrollOptions,
  requireMethod,
} from "../../../clients/payroll-api.js";
import { XeroClientResponse } from "../../../types/tool-response.js";
import {
  PayrollV2Employee,
  PayrollV2EmployeeTax,
  PayrollV2Employment,
  PayrollV2EarningsTemplate,
  PayrollV2LeaveBalance,
  PayrollV2EmployeeLeaveType,
  PayrollV2OpeningBalances,
  PayrollV2PayTemplate,
  PayrollV2PaymentMethod,
  PayrollV2SalaryAndWage,
  PayrollV2WorkingPattern,
} from "../../../types/payroll-v2.js";
import { formatError } from "../../../helpers/format-error.js";

/** Sub-resources `get-payroll-employee` can pull in alongside the employee. */
export const EMPLOYEE_INCLUDES = [
  "tax",
  "payTemplate",
  "salaryAndWages",
  "paymentMethod",
  "openingBalances",
  "leaveBalances",
  "leaveTypes",
  "workingPatterns",
] as const;

export type EmployeeInclude = (typeof EMPLOYEE_INCLUDES)[number];

export interface PayrollEmployeeDetail {
  employee: PayrollV2Employee | null;
  tax?: PayrollV2EmployeeTax;
  payTemplate?: PayrollV2PayTemplate;
  salaryAndWages?: PayrollV2SalaryAndWage[];
  paymentMethod?: PayrollV2PaymentMethod;
  openingBalances?: PayrollV2OpeningBalances | PayrollV2OpeningBalances[];
  leaveBalances?: PayrollV2LeaveBalance[];
  leaveTypes?: PayrollV2EmployeeLeaveType[];
  workingPatterns?: PayrollV2WorkingPattern[];
  /** Sub-resources that could not be loaded, so a partial result stays useful. */
  warnings: string[];
}

export async function listPayrollEmployees(
  filter?: string,
  page?: number,
): Promise<XeroClientResponse<PayrollV2Employee[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getEmployees(
      tenantId,
      filter,
      page,
      payrollOptions(),
    );
    return response.body.employees ?? [];
  });
}

export async function getPayrollEmployee(
  employeeID: string,
  include: EmployeeInclude[] = [],
): Promise<XeroClientResponse<PayrollEmployeeDetail>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();

    const employeeResponse = await api.getEmployee(
      tenantId,
      employeeID,
      payrollOptions(),
    );

    const detail: PayrollEmployeeDetail = {
      employee: employeeResponse.body.employee ?? null,
      warnings: [],
    };

    // Each sub-resource is fetched independently: an employee with no pay
    // template configured yet should still return the rest of their record.
    const load = async (name: string, fetch: () => Promise<void>) => {
      try {
        await fetch();
      } catch (error) {
        detail.warnings.push(`${name}: ${formatError(error)}`);
      }
    };

    const requested = new Set(include);

    if (requested.has("tax")) {
      await load("tax", async () => {
        const { body } = await api.getEmployeeTax(
          tenantId,
          employeeID,
          payrollOptions(),
        );
        detail.tax = body.employeeTax;
      });
    }

    if (requested.has("payTemplate")) {
      await load("payTemplate", async () => {
        // UK names this singular, NZ plural.
        const getPayTemplate =
          api.getEmployeePayTemplate ?? api.getEmployeePayTemplates;
        const { body } = await requireMethod(
          getPayTemplate,
          "Pay template lookup",
          region,
        ).call(api, tenantId, employeeID, payrollOptions());
        detail.payTemplate = body.payTemplate;
      });
    }

    if (requested.has("salaryAndWages")) {
      await load("salaryAndWages", async () => {
        const { body } = await api.getEmployeeSalaryAndWages(
          tenantId,
          employeeID,
          undefined,
          payrollOptions(),
        );
        detail.salaryAndWages = body.salaryAndWages ?? [];
      });
    }

    if (requested.has("paymentMethod")) {
      await load("paymentMethod", async () => {
        const { body } = await api.getEmployeePaymentMethod(
          tenantId,
          employeeID,
          payrollOptions(),
        );
        detail.paymentMethod = body.paymentMethod;
      });
    }

    if (requested.has("openingBalances")) {
      await load("openingBalances", async () => {
        const { body } = await api.getEmployeeOpeningBalances(
          tenantId,
          employeeID,
          payrollOptions(),
        );
        detail.openingBalances = body.openingBalances;
      });
    }

    if (requested.has("leaveBalances")) {
      await load("leaveBalances", async () => {
        const { body } = await api.getEmployeeLeaveBalances(
          tenantId,
          employeeID,
          payrollOptions(),
        );
        detail.leaveBalances = body.leaveBalances ?? [];
      });
    }

    if (requested.has("leaveTypes")) {
      await load("leaveTypes", async () => {
        const { body } = await api.getEmployeeLeaveTypes(
          tenantId,
          employeeID,
          payrollOptions(),
        );
        detail.leaveTypes = body.leaveTypes ?? [];
      });
    }

    if (requested.has("workingPatterns")) {
      await load("workingPatterns", async () => {
        const { body } = await requireMethod(
          api.getEmployeeWorkingPatterns,
          "Working patterns",
          region,
        ).call(api, tenantId, employeeID, payrollOptions());
        detail.workingPatterns = body.payeeWorkingPatterns ?? [];
      });
    }

    return detail;
  });
}

export async function createPayrollEmployee(
  employee: PayrollV2Employee,
): Promise<XeroClientResponse<PayrollV2Employee | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEmployee(
      tenantId,
      employee,
      payrollOptions(),
    );
    return response.body.employee ?? null;
  });
}

export async function updatePayrollEmployee(
  employeeID: string,
  employee: PayrollV2Employee,
): Promise<XeroClientResponse<PayrollV2Employee | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.updateEmployee(
      tenantId,
      employeeID,
      employee,
      payrollOptions(),
    );
    return response.body.employee ?? null;
  });
}

export async function createPayrollEmployment(
  employeeID: string,
  employment: PayrollV2Employment,
): Promise<XeroClientResponse<PayrollV2Employment | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEmployment(
      tenantId,
      employeeID,
      employment,
      payrollOptions(),
    );
    return response.body.employment ?? null;
  });
}

export async function updatePayrollEmployeeTax(
  employeeID: string,
  employeeTax: PayrollV2EmployeeTax,
): Promise<XeroClientResponse<PayrollV2EmployeeTax | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const update = requireMethod(
      api.updateEmployeeTax,
      "update-payroll-employee-tax",
      region,
    );
    const response = await update.call(
      api,
      tenantId,
      employeeID,
      employeeTax,
      payrollOptions(),
    );
    return response.body.employeeTax ?? null;
  });
}

export async function listPayrollEmployeeSalaryAndWages(
  employeeID: string,
  page?: number,
): Promise<XeroClientResponse<PayrollV2SalaryAndWage[]>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.getEmployeeSalaryAndWages(
      tenantId,
      employeeID,
      page,
      payrollOptions(),
    );
    return response.body.salaryAndWages ?? [];
  });
}

export async function createPayrollEmployeeSalaryAndWage(
  employeeID: string,
  salaryAndWage: PayrollV2SalaryAndWage,
): Promise<XeroClientResponse<PayrollV2SalaryAndWage | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEmployeeSalaryAndWage(
      tenantId,
      employeeID,
      salaryAndWage,
      payrollOptions(),
    );
    return response.body.salaryAndWage ?? null;
  });
}

export async function updatePayrollEmployeeSalaryAndWage(
  employeeID: string,
  salaryAndWagesID: string,
  salaryAndWage: PayrollV2SalaryAndWage,
): Promise<XeroClientResponse<PayrollV2SalaryAndWage | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.updateEmployeeSalaryAndWage(
      tenantId,
      employeeID,
      salaryAndWagesID,
      salaryAndWage,
      payrollOptions(),
    );
    return response.body.salaryAndWage ?? null;
  });
}

export async function deletePayrollEmployeeSalaryAndWage(
  employeeID: string,
  salaryAndWagesID: string,
): Promise<XeroClientResponse<string>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    await api.deleteEmployeeSalaryAndWage(
      tenantId,
      employeeID,
      salaryAndWagesID,
      payrollOptions(),
    );
    return salaryAndWagesID;
  });
}

export async function createPayrollEmployeeEarningsTemplate(
  employeeID: string,
  earningsTemplate: PayrollV2EarningsTemplate,
): Promise<XeroClientResponse<PayrollV2EarningsTemplate | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEmployeeEarningsTemplate(
      tenantId,
      employeeID,
      earningsTemplate,
      payrollOptions(),
    );
    return response.body.earningTemplate ?? null;
  });
}

export async function updatePayrollEmployeeEarningsTemplate(
  employeeID: string,
  payTemplateEarningID: string,
  earningsTemplate: PayrollV2EarningsTemplate,
): Promise<XeroClientResponse<PayrollV2EarningsTemplate | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.updateEmployeeEarningsTemplate(
      tenantId,
      employeeID,
      payTemplateEarningID,
      earningsTemplate,
      payrollOptions(),
    );
    return response.body.earningTemplate ?? null;
  });
}

export async function deletePayrollEmployeeEarningsTemplate(
  employeeID: string,
  payTemplateEarningID: string,
): Promise<XeroClientResponse<string>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    await api.deleteEmployeeEarningsTemplate(
      tenantId,
      employeeID,
      payTemplateEarningID,
      payrollOptions(),
    );
    return payTemplateEarningID;
  });
}

export async function createPayrollEmployeePaymentMethod(
  employeeID: string,
  paymentMethod: PayrollV2PaymentMethod,
): Promise<XeroClientResponse<PayrollV2PaymentMethod | null>> {
  return payrollRequest(async () => {
    const { api, tenantId } = await payrollV2();
    const response = await api.createEmployeePaymentMethod(
      tenantId,
      employeeID,
      paymentMethod,
      payrollOptions(),
    );
    return response.body.paymentMethod ?? null;
  });
}

export async function setPayrollEmployeeOpeningBalances(
  employeeID: string,
  openingBalances: PayrollV2OpeningBalances[],
): Promise<
  XeroClientResponse<PayrollV2OpeningBalances | PayrollV2OpeningBalances[] | null>
> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();

    // NZ models opening balances as one entry per pay period; UK as a single
    // record of statutory payment totals.
    const payload: PayrollV2OpeningBalances | PayrollV2OpeningBalances[] =
      region === "NZ" ? openingBalances : (openingBalances[0] ?? {});

    const response = await api.createEmployeeOpeningBalances(
      tenantId,
      employeeID,
      payload,
      payrollOptions(),
    );
    return response.body.openingBalances ?? null;
  });
}

export async function listPayrollEmployeeWorkingPatterns(
  employeeID: string,
): Promise<XeroClientResponse<PayrollV2WorkingPattern[]>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const get = requireMethod(
      api.getEmployeeWorkingPatterns,
      "list-payroll-employee-working-patterns",
      region,
    );
    const response = await get.call(
      api,
      tenantId,
      employeeID,
      payrollOptions(),
    );
    return response.body.payeeWorkingPatterns ?? [];
  });
}

export async function createPayrollEmployeeWorkingPattern(
  employeeID: string,
  workingPattern: PayrollV2WorkingPattern,
): Promise<XeroClientResponse<PayrollV2WorkingPattern | null>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const create = requireMethod(
      api.createEmployeeWorkingPattern,
      "create-payroll-employee-working-pattern",
      region,
    );
    const response = await create.call(
      api,
      tenantId,
      employeeID,
      workingPattern,
      payrollOptions(),
    );
    return response.body.payeeWorkingPattern ?? null;
  });
}

export async function deletePayrollEmployeeWorkingPattern(
  employeeID: string,
  employeeWorkingPatternID: string,
): Promise<XeroClientResponse<string>> {
  return payrollRequest(async () => {
    const { api, region, tenantId } = await payrollV2();
    const remove = requireMethod(
      api.deleteEmployeeWorkingPattern,
      "delete-payroll-employee-working-pattern",
      region,
    );
    await remove.call(
      api,
      tenantId,
      employeeID,
      employeeWorkingPatternID,
      payrollOptions(),
    );
    return employeeWorkingPatternID;
  });
}
