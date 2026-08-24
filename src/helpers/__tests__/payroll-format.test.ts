import { describe, it, expect } from "vitest";

import {
  field,
  handleResponse,
  lines,
  listResponse,
  warningLines,
} from "../payroll-format.js";
import { XeroClientResponse } from "../../types/tool-response.js";

describe("field", () => {
  it("renders a labelled value", () => {
    expect(field("Email", "jane@example.com")).toBe("Email: jane@example.com");
  });

  it("keeps zero and false, which are real payroll values", () => {
    expect(field("Balance", 0)).toBe("Balance: 0");
    expect(field("Paid Leave", false)).toBe("Paid Leave: false");
  });

  it("drops values Xero omitted", () => {
    expect(field("Phone", undefined)).toBeNull();
    expect(field("Phone", null)).toBeNull();
    expect(field("Phone", "")).toBeNull();
  });
});

describe("lines", () => {
  it("joins only the lines that apply", () => {
    expect(
      lines("Employee: 1", field("Email", undefined), field("Phone", "123")),
    ).toBe("Employee: 1\nPhone: 123");
  });

  it("drops short-circuited entries", () => {
    const missing: string[] | undefined = undefined;
    expect(lines("Header", missing && "Detail")).toBe("Header");
  });
});

describe("listResponse", () => {
  it("leads with the count and adds one block per record", () => {
    const response = listResponse(
      "payroll employees",
      [{ id: "a" }, { id: "b" }],
      (employee) => `Employee: ${employee.id}`,
    );

    expect(response.content).toEqual([
      { type: "text", text: "Found 2 payroll employees:" },
      { type: "text", text: "Employee: a" },
      { type: "text", text: "Employee: b" },
    ]);
  });

  it("reports an empty result rather than nothing", () => {
    expect(listResponse("timesheets", null, String).content).toEqual([
      { type: "text", text: "Found 0 timesheets:" },
    ]);
  });
});

describe("handleResponse", () => {
  it("formats the result when the call succeeded", () => {
    const response: XeroClientResponse<string> = {
      result: "ok",
      isError: false,
      error: null,
    };

    expect(
      handleResponse("listing pay runs", response, (result) => ({
        content: [{ type: "text" as const, text: result }],
      })),
    ).toEqual({ content: [{ type: "text", text: "ok" }] });
  });

  it("surfaces the error without calling the formatter", () => {
    const response: XeroClientResponse<string> = {
      result: null,
      isError: true,
      error: "The requested resource was not found in Xero.",
    };

    const result = handleResponse("listing pay runs", response, () => {
      throw new Error("formatter should not run for an error response");
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error listing pay runs: The requested resource was not found in Xero.",
        },
      ],
    });
  });
});

describe("warningLines", () => {
  it("stays silent when everything loaded", () => {
    expect(warningLines([])).toBeNull();
  });

  it("names the sub-resources that did not load", () => {
    expect(warningLines(["tax: 404", "payTemplate: 403"])).toBe(
      "Could not load: tax: 404; payTemplate: 403",
    );
  });
});
