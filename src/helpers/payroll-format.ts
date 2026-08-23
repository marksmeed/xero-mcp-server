import { XeroClientResponse } from "../types/tool-response.js";

type Line = string | number | false | null | undefined;

export const textBlock = (text: string) => ({
  type: "text" as const,
  text,
});

/** Join the lines that have a value, dropping the ones that do not apply. */
export const lines = (...items: Line[]): string =>
  items.filter((item) => item !== null && item !== undefined && item !== false)
    .join("\n");

/**
 * `Label: value`, or nothing at all when the value is absent. Booleans are kept
 * - `Paid Leave: false` is information, not an empty field.
 */
export const field = (
  label: string,
  value: string | number | boolean | null | undefined,
): string | null =>
  value === null || value === undefined || value === ""
    ? null
    : `${label}: ${value}`;

export const errorResponse = (action: string, error: string | null) => ({
  content: [textBlock(`Error ${action}: ${error}`)],
});

export const messageResponse = (text: string) => ({
  content: [textBlock(text)],
});

/**
 * Render a collection as a count followed by one block per record, matching the
 * shape the existing Xero tools return.
 */
export const listResponse = <T>(
  label: string,
  items: T[] | null,
  format: (item: T) => string,
) => {
  const list = items ?? [];
  return {
    content: [
      textBlock(`Found ${list.length} ${label}:`),
      ...list.map((item) => textBlock(format(item))),
    ],
  };
};

/**
 * Collapse the two branches every payroll tool shares: surface the error, or
 * hand the result to the formatter.
 */
export const handleResponse = <T>(
  action: string,
  response: XeroClientResponse<T>,
  format: (result: T) => { content: { type: "text"; text: string }[] },
) =>
  response.isError
    ? errorResponse(action, response.error)
    : format(response.result);

/** Warnings collected while assembling a partial result. */
export const warningLines = (warnings: string[]): string | null =>
  warnings.length === 0
    ? null
    : `Could not load: ${warnings.join("; ")}`;
