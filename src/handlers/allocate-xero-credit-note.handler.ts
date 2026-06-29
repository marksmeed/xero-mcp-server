import { xeroClient } from "../clients/xero-client.js";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { Allocation, Allocations } from "xero-node";
import { getClientHeaders } from "../helpers/get-client-headers.js";

async function allocateCreditNote(
  creditNoteId: string,
  invoiceId: string,
  amount: number,
  date: string | undefined,
): Promise<Allocation | undefined> {
  await xeroClient.authenticate();

  const allocations: Allocations = {
    allocations: [
      {
        amount: amount,
        date: date ?? new Date().toISOString().split("T")[0], // Defaults to today
        invoice: {
          invoiceID: invoiceId,
        },
      },
    ],
  };

  const response = await xeroClient.accountingApi.createCreditNoteAllocation(
    xeroClient.tenantId,
    creditNoteId,
    allocations,
    true, // summarizeErrors
    undefined, // idempotencyKey
    getClientHeaders(),
  );

  return response.body.allocations?.[0];
}

/**
 * Allocate an AUTHORISED credit note to an outstanding invoice in Xero
 */
export async function allocateXeroCreditNote(
  creditNoteId: string,
  invoiceId: string,
  amount: number,
  date?: string,
): Promise<XeroClientResponse<Allocation>> {
  try {
    const allocation = await allocateCreditNote(
      creditNoteId,
      invoiceId,
      amount,
      date,
    );

    if (!allocation) {
      throw new Error("Credit note allocation failed.");
    }

    return {
      result: allocation,
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      isError: true,
      error: formatError(error),
    };
  }
}
