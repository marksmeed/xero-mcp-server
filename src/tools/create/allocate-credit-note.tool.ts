import { z } from "zod";
import { allocateXeroCreditNote } from "../../handlers/allocate-xero-credit-note.handler.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";

const AllocateCreditNoteTool = CreateXeroTool(
  "allocate-credit-note",
  "Allocate an AUTHORISED credit note to an outstanding invoice for the same contact. \
 The credit note must already be AUTHORISED (not DRAFT) and the invoice must belong to the same contact. \
 Use after create-credit-note (with status AUTHORISED) to apply the credit and reduce the invoice's amount due.",
  {
    creditNoteId: z.string().describe("The ID of the AUTHORISED credit note to allocate."),
    invoiceId: z.string().describe("The ID of the invoice to apply the credit note to."),
    amount: z
      .number()
      .positive()
      .describe("The amount of the credit note to apply to the invoice. Must be greater than 0."),
    date: z
      .string()
      .optional()
      .describe("The date of the allocation in YYYY-MM-DD format. Defaults to today."),
  },
  async ({ creditNoteId, invoiceId, amount, date }) => {
    const result = await allocateXeroCreditNote(
      creditNoteId,
      invoiceId,
      amount,
      date,
    );

    if (result.isError) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error allocating credit note: ${result.error}`,
          },
        ],
      };
    }

    const allocation = result.result;

    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Credit note allocated successfully:",
            `Credit note: ${creditNoteId}`,
            `Invoice: ${invoiceId}`,
            `Amount applied: ${allocation?.amount}`,
            `Date: ${allocation?.date}`,
          ].join("\n"),
        },
      ],
    };
  },
);

export default AllocateCreditNoteTool;
