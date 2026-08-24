# Xero MCP Server

This is a Model Context Protocol (MCP) server implementation for Xero. It provides a bridge between the MCP protocol and Xero's API, allowing for standardized access to Xero's accounting and business features.

## Features

- Xero OAuth2 authentication with custom connections
- Contact management
- Chart of Accounts management
- Invoice creation and management
- Full Payroll coverage for the UK, NZ and AU - employees, leave, timesheets, pay runs, payslips, pay items and settings
- MCP protocol compliance

## Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A Xero developer account with API credentials

## Docs and Links

- [Xero Public API Documentation](https://developer.xero.com/documentation/api/)
- [Xero API Explorer](https://api-explorer.xero.com/)
- [Xero OpenAPI Specs](https://github.com/XeroAPI/Xero-OpenAPI)
- [Xero-Node Public API SDK Docs](https://xeroapi.github.io/xero-node/accounting)
- [Developer Documentation](https://developer.xero.com/)

## Setup

### Create a Xero Account

If you don't already have a Xero account and organisation already, can create one by signing up [here](https://www.xero.com/au/signup/) using the free trial.

We recommend using a Demo Company to start with because it comes with some pre-loaded sample data. Once you are logged in, switch to it by using the top left-hand dropdown and selecting "Demo Company". You can reset the data on a Demo Company, or change the country, at any time by using the top left-hand dropdown and navigating to [My Xero](https://my.xero.com).

NOTE: Payroll tools require an organisation on a region with a Xero Payroll product - AU, NZ or UK. See [Payroll](#payroll) below.

### Authentication

There are 2 modes of authentication supported in the Xero MCP server:

#### 1. Custom Connections

This is a better choice for testing and development which allows you to specify client id and secrets for a specific organisation.
It is also the recommended approach if you are integrating this into 3rd party MCP clients such as Claude Desktop.

##### Configuring your Xero Developer account

Set up a Custom Connection following these instructions: https://developer.xero.com/documentation/guides/oauth2/custom-connections/

##### Required Scopes

Custom connections require different scopes depending on when they were created. **All scopes in the relevant list must be added to your custom connection:**

| Custom Connection Created | Required Scopes |
|---------------------------|-----------------|
| Before Apr 29, 2026 | [SCOPES_V1](src/clients/xero-client.ts#L130-L140) (bundled permissions) |
| From Apr 29, 2026 | [SCOPES_V2](src/clients/xero-client.ts#L143-L159) (granular permissions) |

> **Note:** The MCP server automatically tries V1 scopes first and falls back to V2 if needed.
> 
> You can override these by setting the `XERO_SCOPES` environment variable to a space-separated list of scopes.

##### Integrating the MCP server with Claude Desktop

To add the MCP server to Claude go to Settings > Developer > Edit config and add the following to your claude_desktop_config.json file:

```json
{
  "mcpServers": {
    "xero": {
      "command": "npx",
      "args": ["-y", "@xeroapi/xero-mcp-server@latest"],
      "env": {
        "XERO_CLIENT_ID": "your_client_id_here",
        "XERO_CLIENT_SECRET": "your_client_secret_here",
        "XERO_SCOPES": "accounting.invoices accounting.contacts accounting.settings"
      }
    }
  }
}
```

The `XERO_SCOPES` variable is optional. If omitted, the default scopes listed above will be used.

NOTE: If you are using [Node Version Manager](https://github.com/nvm-sh/nvm) `"command": "npx"` section change it to be the full path to the executable, ie: `your_home_directory/.nvm/versions/node/v22.14.0/bin/npx` on Mac / Linux or `"your_home_directory\\.nvm\\versions\\node\\v22.14.0\\bin\\npx"` on Windows

#### 2. Bearer Token

This is a better choice if you are to support multiple Xero accounts at runtime and allow the MCP client to execute an auth flow (such as PKCE) as required.
In this case, use the following configuration:

```json
{
  "mcpServers": {
    "xero": {
      "command": "npx",
      "args": ["-y", "@xeroapi/xero-mcp-server@latest"],
      "env": {
        "XERO_CLIENT_BEARER_TOKEN": "your_bearer_token"
      }
    }
  }
}
```

NOTE: The `XERO_CLIENT_BEARER_TOKEN` will take precedence over the `XERO_CLIENT_ID` if defined.

##### Required Scopes for Bearer Token

When obtaining a bearer token, you must request the appropriate scopes. The scopes you request should be:

> **Note:** Some scopes are being deprecated in favour of more granular scopes. See the [Xero OAuth 2.0 Scopes documentation](https://developer.xero.com/documentation/guides/oauth2/scopes/) for details on deprecation timelines.

```
accounting.transactions (Deprecated)
accounting.transactions.read (Deprecated)
accounting.invoices
accounting.invoices.read
accounting.payments
accounting.payments.read
accounting.banktransactions
accounting.banktransactions.read
accounting.manualjournals
accounting.manualjournals.read
accounting.reports.read (Deprecated)
accounting.reports.aged.read
accounting.reports.balancesheet.read
accounting.reports.profitandloss.read
accounting.reports.trialbalance.read
accounting.contacts 
accounting.settings 
payroll.settings
payroll.employees
payroll.timesheets
payroll.payruns
payroll.payslip
```

Read-only variants (`payroll.employees.read`, `payroll.payruns.read`, `payroll.payslip.read`, `payroll.settings.read`, `payroll.timesheets.read`) are enough for the payroll `list-` and `get-` tools, but the payroll write tools need the full scopes above.


### Available MCP Commands

#### Accounting

- `list-accounts`: Retrieve a list of accounts
- `list-contacts`: Retrieve a list of contacts from Xero
- `list-credit-notes`: Retrieve a list of credit notes
- `list-invoices`: Retrieve a list of invoices
- `list-items`: Retrieve a list of items
- `list-manual-journals`: Retrieve a list of manual journals
- `list-organisation-details`: Retrieve details about an organisation
- `list-profit-and-loss`: Retrieve a profit and loss report
- `list-quotes`: Retrieve a list of quotes
- `list-tax-rates`: Retrieve a list of tax rates
- `list-payments`: Retrieve a list of payments
- `list-trial-balance`: Retrieve a trial balance report
- `list-bank-transactions`: Retrieve a list of bank account transactions
- `list-report-balance-sheet`: Retrieve a balance sheet report
- `list-aged-receivables-by-contact`: Retrieves aged receivables for a contact
- `list-aged-payables-by-contact`: Retrieves aged payables for a contact
- `list-contact-groups`: Retrieve a list of contact groups
- `list-tracking-categories`: Retrieve a list of tracking categories
- `create-bank-transaction`: Create a new bank transaction
- `create-contact`: Create a new contact
- `create-credit-note`: Create a new credit note (DRAFT or AUTHORISED)
- `allocate-credit-note`: Allocate an AUTHORISED credit note to an outstanding invoice
- `create-invoice`: Create a new invoice
- `create-item`: Create a new item
- `create-manual-journal`: Create a new manual journal
- `create-payment`: Create a new payment
- `create-quote`: Create a new quote
- `create-tracking-category`: Create a new tracking category
- `create-tracking-options`: Create new tracking options
- `update-bank-transaction`: Update an existing bank transaction
- `update-contact`: Update an existing contact
- `update-invoice`: Update an existing draft invoice
- `update-item`: Update an existing item
- `update-manual-journal`: Update an existing manual journal
- `update-quote`: Update an existing draft quote
- `update-credit-note`: Update an existing draft credit note
- `update-tracking-category`: Update an existing tracking category
- `update-tracking-options`: Update tracking options

#### Payroll

Xero runs a different Payroll API per region: AU is on Payroll v1, while NZ and UK are on Payroll v2. The server detects the connected organisation's region at startup and registers **only that region's payroll tools**, so tool names are shared wherever the concept exists and the model never sees a tool that would fail against your organisation.

Organisations on an edition without a Xero Payroll product (for example GLOBAL or US) get no payroll tools; the accounting tools are unaffected. The same applies if the connection is missing payroll scopes - a warning is written to stderr and startup continues.

Set `XERO_PAYROLL_REGION` to `AU`, `NZ` or `UK` to skip detection and force a region. This is useful when the connection cannot read organisation details, or to avoid the extra API call at startup.

| Tool | Regions | Description |
|------|---------|-------------|
| `list-payroll-employees` | UK, NZ, AU | List payroll employees in Xero. |
| `get-payroll-employee` | UK, NZ, AU | Retrieve a single payroll employee, optionally with their payroll configuration. |
| `create-payroll-employee` | UK, NZ, AU | Create a payroll employee in Xero. |
| `update-payroll-employee` | UK, NZ, AU | Update an existing payroll employee's personal details in Xero. |
| `create-payroll-employment` | UK, NZ | Set an employee's employment details in Xero Payroll - the payroll calendar they are paid on and their start date. |
| `list-payroll-employee-salary-and-wages` | UK, NZ | List an employee's salary and wages records in Xero Payroll. |
| `create-payroll-employee-salary-and-wage` | UK, NZ | Add a salary and wages record to an employee in Xero Payroll, setting what they are paid and from when. |
| `update-payroll-employee-salary-and-wage` | UK, NZ | Update an existing salary and wages record for an employee in Xero Payroll. |
| `delete-payroll-employee-salary-and-wage` | UK, NZ | Delete a salary and wages record from an employee in Xero Payroll. |
| `create-payroll-employee-earnings-template` | UK, NZ | Add an earnings line to an employee's pay template in Xero Payroll, so it is included automatically in every pay run. |
| `update-payroll-employee-earnings-template` | UK, NZ | Update an earnings line on an employee's pay template in Xero Payroll. |
| `delete-payroll-employee-earnings-template` | UK, NZ | Remove an earnings line from an employee's pay template in Xero Payroll. |
| `create-payroll-employee-payment-method` | UK, NZ | Set how an employee is paid in Xero Payroll - electronic transfer to one or more bank accounts, or cheque. |
| `set-payroll-employee-opening-balances` | UK, NZ | Record an employee's payroll opening balances in Xero - what they were already paid this tax year before joining Xero Payroll. |
| `list-payroll-employee-leave` | UK, NZ | List all leave records for a specific employee in Xero. This shows all leave transactions including approved, pending, and processed time off. Provide an employee ID to see their leave history. |
| `create-payroll-employee-leave` | UK, NZ | Record a leave request for an employee in Xero Payroll. |
| `update-payroll-employee-leave` | UK, NZ | Update an existing leave record for an employee in Xero Payroll. |
| `delete-payroll-employee-leave` | UK, NZ | Delete a leave record from an employee in Xero Payroll. Leave that has already been paid cannot be deleted. |
| `list-payroll-employee-leave-balances` | UK, NZ | List all leave balances for a specific employee in Xero. This shows current leave balances for all leave types available to the employee, including annual, sick, and other leave types. |
| `list-payroll-employee-leave-types` | UK, NZ | List all leave types available for a specific employee in Xero. This shows detailed information about the types of leave an employee can take, including schedule of accrual, leave type name, and entitlement. |
| `create-payroll-employee-leave-type` | UK, NZ | Give an employee an entitlement to a leave type in Xero Payroll, including how it accrues. |
| `list-payroll-leave-periods` | UK, NZ | List all leave periods for a specific employee in Xero. This shows detailed time off periods including start and end dates, period status, payment dates, and leave types. Provide an employee ID to see their leave periods. |
| `list-payroll-leave-types` | UK, NZ | Lists all available leave types in Xero Payroll. This provides information about all the leave categories configured in your Xero system, including statutory and organization-specific leave types. |
| `create-payroll-leave-type` | UK, NZ | Create an organisation-wide leave type in Xero Payroll that employees can then be entitled to. |
| `list-payroll-statutory-leave` | UK | List an employee's statutory leave in Xero Payroll UK - sick, maternity, paternity, adoption and shared parental leave. |
| `get-payroll-statutory-sick-leave` | UK | Retrieve a statutory sick leave record in Xero Payroll UK, including whether the employee was found entitled and why not if they were not. |
| `create-payroll-statutory-sick-leave` | UK | Record statutory sick leave for an employee in Xero Payroll UK. |
| `list-payroll-pay-runs` | UK, NZ, AU | List pay runs in Xero Payroll, with their period, payment date, status and totals. |
| `get-payroll-pay-run` | UK, NZ, AU | Retrieve a single pay run in Xero Payroll, including a summary of every payslip it contains. |
| `list-payroll-payslips` | UK, NZ | List the payslips in a pay run in Xero Payroll, with each employee's earnings, deductions, tax and net pay. |
| `get-payroll-payslip` | UK, NZ, AU | Retrieve a single payslip in Xero Payroll with its full line detail - earnings, leave, timesheet, deduction, reimbursement, tax and accrual lines. |
| `list-payroll-calendars` | UK, NZ, AU | List the payroll calendars in Xero Payroll - the pay cycles employees are assigned to, with their period dates and payment dates. |
| `get-payroll-calendar` | UK, NZ, AU | Retrieve a single payroll calendar in Xero Payroll. |
| `create-payroll-calendar` | UK, NZ, AU | Create a payroll calendar in Xero Payroll, defining a pay cycle employees can be assigned to. |
| `list-payroll-settings` | UK, NZ, AU | List the Xero Payroll settings for the organisation - the general ledger accounts payroll posts to, and the tracking categories used for employee groups and timesheets. |
| `list-payroll-pay-items` | UK, NZ, AU | List the pay item library in Xero Payroll - earnings rates, deductions, reimbursements, leave types and, depending on region, benefits, superannuations, statutory deductions and earnings orders. |
| `create-payroll-earnings-rate` | UK, NZ | Create an earnings rate in Xero Payroll - the pay item that ordinary time, overtime, allowances or bonuses are recorded against. |
| `create-payroll-deduction` | UK, NZ | Create a deduction pay item in Xero Payroll, such as a pension contribution, union fee or salary sacrifice. |
| `create-payroll-reimbursement` | UK, NZ | Create a reimbursement pay item in Xero Payroll for non-taxable payments such as expenses or mileage. |
| `create-payroll-benefit` | UK | Create a benefit pay item in Xero Payroll UK, such as a pension scheme or other employer-funded benefit. |
| `list-timesheets` | UK, NZ, AU | List all payroll timesheets in Xero. |
| `get-timesheet` | UK, NZ, AU | Retrieve a single payroll timesheet from Xero by its ID. |
| `create-timesheet` | UK, NZ, AU | Create a new payroll timesheet in Xero. |
| `delete-timesheet` | UK, NZ | Delete an existing payroll timesheet in Xero by its ID. |
| `approve-timesheet` | UK, NZ | Approve a payroll timesheet in Xero by its ID. |
| `revert-timesheet` | UK, NZ | Revert a payroll timesheet to draft in Xero by its ID. |
| `add-timesheet-line` | UK, NZ | Add a new timesheet line to an existing payroll timesheet in Xero. |
| `update-timesheet-line` | UK, NZ | Update an existing timesheet line in a payroll timesheet in Xero. |
| `delete-timesheet-line` | UK, NZ | Delete a line from an existing payroll timesheet in Xero. |
| `update-payroll-employee-tax` | NZ | Update an employee's tax settings in Xero Payroll NZ - IRD number, tax code, KiwiSaver and student loan settings. |
| `list-payroll-employee-working-patterns` | NZ | List an employee's working patterns in Xero Payroll NZ - the hours they work on each day of the week, and when each pattern took effect. |
| `create-payroll-employee-working-pattern` | NZ | Create a working pattern for an employee in Xero Payroll NZ, describing the units worked on each day of the week. |
| `delete-payroll-employee-working-pattern` | NZ | Delete a working pattern from an employee in Xero Payroll NZ. |
| `create-payroll-employee-leave-setup` | NZ | Configure an employee's initial leave setup in Xero Payroll NZ - holiday pay, annual leave and sick leave opening balances and accrual settings. |
| `create-payroll-pay-run` | NZ, AU | Create a draft pay run in Xero Payroll NZ for a payroll calendar's next period. |
| `update-payroll-payslip` | NZ, AU | Adjust the line items on a draft payslip in Xero Payroll NZ. |
| `create-payroll-superannuation` | NZ | Create a superannuation pay item in Xero Payroll NZ, such as a KiwiSaver or complying fund contribution. |
| `list-payroll-leave-applications` | AU | List leave applications in Xero Payroll AU, with their leave type, dates and pay period breakdown. |
| `get-payroll-leave-application` | AU | Retrieve a single leave application from Xero Payroll AU. |
| `create-payroll-leave-application` | AU | Create a leave application for an employee in Xero Payroll AU. |
| `update-payroll-leave-application` | AU | Update an existing leave application in Xero Payroll AU. |
| `decide-payroll-leave-application` | AU | Approve or reject a requested leave application in Xero Payroll AU. |
| `update-payroll-pay-run` | AU | Update a draft pay run in Xero Payroll AU. |
| `create-payroll-pay-item` | AU | Create pay items in Xero Payroll AU. One call can create earnings rates, deduction types, leave types and reimbursement types together - supply only the collections you want to add. |
| `list-payroll-superfunds` | AU | List the superannuation funds set up in Xero Payroll AU, with their ABN, USI and payment details. |
| `get-payroll-superfund` | AU | Retrieve a single superannuation fund from Xero Payroll AU. |
| `create-payroll-superfund` | AU | Add a superannuation fund to Xero Payroll AU so employees can be given a membership of it. |
| `update-payroll-superfund` | AU | Update a superannuation fund in Xero Payroll AU. |
| `list-payroll-superfund-products` | AU | Look up regulated superannuation fund products in Xero Payroll AU by ABN or USI, to find the details needed to add the fund. |
| `update-timesheet` | AU | Update a payroll timesheet in Xero Payroll AU. |

> **Care with write tools:** `update-payroll-pay-run` posts an AU pay run when `payRunStatus` is set to `POSTED`, and `decide-payroll-leave-application` commits leave to an employee's balance. Neither can be undone through the API - confirm with the user before calling them.

For detailed API documentation, please refer to the [MCP Protocol Specification](https://modelcontextprotocol.io/).

## For Developers

### Installation

```bash
# Using npm
npm install

# Using pnpm
pnpm install
```

### Run a build

```bash
# Using npm
npm run build

# Using pnpm
pnpm build
```

### Integrating with Claude Desktop

To link your Xero MCP server in development to Claude Desktop go to Settings > Developer > Edit config and add the following to your `claude_desktop_config.json` file:

NOTE: For Windows ensure the `args` path escapes the `\` between folders ie. `"C:\\projects\xero-mcp-server\\dist\\index.js"`

```json
{
  "mcpServers": {
    "xero": {
      "command": "node",
      "args": ["insert-your-file-path-here/xero-mcp-server/dist/index.js"],
      "env": {
        "XERO_CLIENT_ID": "your_client_id_here",
        "XERO_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

## License

MIT

## Security

Please do not commit your `.env` file or any sensitive credentials to version control (it is included in `.gitignore` as a safe default.)
