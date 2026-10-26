import "server-only";
import type { Buffer } from "node:buffer";
import writeXlsxFile, {
  type CellObject,
  type Row,
  type Sheet,
} from "write-excel-file/node";
import { minorDigits } from "./money";
import type { Balance, Currency, Expense, GroupView } from "./types";

// Excel workbooks for one group (anyone with the link) and for every group saved to
// an account. Money cells are real numbers with a currency-aware number format, and
// dates are real dates, so totals, filters, and pivot tables work in Excel and Sheets.

type FileContent = Buffer;
const TIME_ZONE = "Asia/Manila";
const SPLIT_LABEL: Record<Expense["splitMode"], string> = {
  equal: "Equally",
  exact: "Exact amounts",
  shares: "By shares",
};

const headerRow = (labels: string[]): Row =>
  labels.map((value) => ({
    value,
    fontWeight: "bold",
    backgroundColor: "#E6F2EF",
    bottomBorderStyle: "thin",
    bottomBorderColor: "#0F766E",
  }));

const titleCell = (value: string): CellObject => ({
  value,
  fontWeight: "bold",
  fontSize: 14,
});
const labelCell = (value: string): CellObject => ({
  value,
  fontWeight: "bold",
});

function money(minor: number, currency: Currency, bold = false): CellObject {
  const digits = minorDigits(currency);
  return {
    value: minor / 10 ** digits,
    type: Number,
    format: digits === 0 ? "#,##0" : `#,##0.${"0".repeat(digits)}`,
    ...(bold ? { fontWeight: "bold" as const } : {}),
  };
}

/** A calendar date (YYYY-MM-DD) as an Excel date. */
function day(isoDate: string): CellObject {
  const [y, m, d] = isoDate.split("-").map(Number);
  return {
    value: new Date(Date.UTC(y, m - 1, d)),
    type: Date,
    format: "mmm d, yyyy",
  };
}

/** Calendar date of a timestamp in the app's time zone. */
const localDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

const status = (net: number) =>
  net > 0 ? "Gets back" : net < 0 ? "Owes" : "Settled";

/** Excel sheet names: max 31 chars, none of []:*?/\ */
const sheetName = (name: string) =>
  name.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);

function paymentTotals(view: GroupView) {
  const sent = new Map<string, number>();
  const received = new Map<string, number>();
  for (const s of view.settlements) {
    sent.set(s.from, (sent.get(s.from) ?? 0) + s.amountMinor);
    received.set(s.to, (received.get(s.to) ?? 0) + s.amountMinor);
  }
  return { sent, received };
}

/** Workbook for one group: Summary (balances + suggested payments), Expenses, Payments. */
export function groupWorkbook(
  view: GroupView,
  exportedAt: Date,
): Sheet<FileContent>[] {
  const { currency } = view;
  const name = new Map(view.members.map((m) => [m.id, m.name]));
  const who = (id: string) => name.get(id) ?? "Unknown";
  const { sent, received } = paymentTotals(view);

  const summary: Row[] = [
    [titleCell(view.name)],
    [labelCell("Currency"), currency],
    [labelCell("Total spent"), money(view.totalSpentMinor, currency, true)],
    [labelCell("Expenses"), view.expenses.length],
    [labelCell("Exported"), day(localDate(exportedAt.toISOString()))],
    [],
    headerRow([
      "Person",
      "Paid",
      "Share of expenses",
      "Payments sent",
      "Payments received",
      "Balance",
      "Status",
    ]),
    ...view.balances.map((b: Balance) => [
      who(b.memberId),
      money(b.paidMinor, currency),
      money(b.owedMinor, currency),
      money(sent.get(b.memberId) ?? 0, currency),
      money(received.get(b.memberId) ?? 0, currency),
      money(b.netMinor, currency, true),
      status(b.netMinor),
    ]),
    [],
    headerRow(["Suggested payment: from", "To", "Amount"]),
    ...(view.transfers.length > 0
      ? view.transfers.map((t) => [
          who(t.from),
          who(t.to),
          money(t.amountMinor, currency, true),
        ])
      : [["Everyone is settled up"]]),
  ];

  const expenseRows: Row[] = [
    headerRow([
      "Date",
      "Description",
      "Paid by",
      "Amount",
      "Split",
      ...view.members.map((m) => `${m.name}'s share`),
    ]),
    ...view.expenses.map((e) => {
      const shares = new Map(e.shares.map((s) => [s.memberId, s.amountMinor]));
      return [
        day(e.spentOn),
        e.description,
        who(e.paidBy),
        money(e.amountMinor, currency),
        SPLIT_LABEL[e.splitMode],
        ...view.members.map((m) => money(shares.get(m.id) ?? 0, currency)),
      ];
    }),
    [
      labelCell("Total"),
      null,
      null,
      money(view.totalSpentMinor, currency, true),
      null,
      ...view.balances.map((b) => money(b.owedMinor, currency, true)),
    ],
  ];

  const paymentRows: Row[] = [
    headerRow(["Date", "From", "To", "Amount"]),
    ...view.settlements.map((s) => [
      day(localDate(s.createdAt)),
      who(s.from),
      who(s.to),
      money(s.amountMinor, currency),
    ]),
  ];

  return [
    {
      sheet: "Summary",
      data: summary,
      columns: [
        { width: 26 },
        { width: 14 },
        { width: 18 },
        { width: 15 },
        { width: 18 },
        { width: 14 },
        { width: 11 },
      ],
    },
    {
      sheet: "Expenses",
      data: expenseRows,
      stickyRowsCount: 1,
      columns: [
        { width: 14 },
        { width: 32 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        ...view.members.map(() => ({ width: 14 })),
      ],
    },
    {
      sheet: "Payments",
      data: paymentRows,
      stickyRowsCount: 1,
      columns: [{ width: 14 }, { width: 18 }, { width: 18 }, { width: 14 }],
    },
  ];
}

export type AccountGroup = { view: GroupView; myMemberId: string | null };

/** Workbook for every group on an account: My groups, Expenses, Payments, Balances (one row per group). */
export function accountWorkbook(
  items: AccountGroup[],
  origin: string,
): Sheet<FileContent>[] {
  const overview: Row[] = [
    headerRow([
      "Group",
      "Currency",
      "Members",
      "Expenses",
      "Total spent",
      "I am",
      "My balance",
      "Status",
      "Last activity",
      "Link",
    ]),
  ];
  const expenseRows: Row[] = [
    headerRow([
      "Group",
      "Currency",
      "Date",
      "Description",
      "Paid by",
      "Amount",
      "Split",
      "My share",
    ]),
  ];
  const paymentRows: Row[] = [
    headerRow(["Group", "Currency", "Date", "From", "To", "Amount"]),
  ];
  const balanceRows: Row[] = [
    headerRow([
      "Group",
      "Currency",
      "Person",
      "Paid",
      "Share",
      "Balance",
      "Status",
    ]),
  ];

  for (const { view, myMemberId } of items) {
    const { currency } = view;
    const name = new Map(view.members.map((m) => [m.id, m.name]));
    const who = (id: string) => name.get(id) ?? "Unknown";
    const myNet = myMemberId
      ? view.balances.find((b) => b.memberId === myMemberId)?.netMinor
      : undefined;
    const lastActivity = [...view.expenses, ...view.settlements]
      .map((i) => i.createdAt)
      .sort()
      .at(-1);

    overview.push([
      view.name,
      currency,
      view.members.length,
      view.expenses.length,
      money(view.totalSpentMinor, currency),
      myMemberId ? who(myMemberId) : "Not linked",
      myNet === undefined ? null : money(myNet, currency, true),
      myNet === undefined ? null : status(myNet),
      lastActivity ? day(localDate(lastActivity)) : null,
      `${origin}/g/${view.id}`,
    ]);
    for (const e of view.expenses) {
      const mine = myMemberId
        ? e.shares.find((s) => s.memberId === myMemberId)?.amountMinor
        : undefined;
      expenseRows.push([
        view.name,
        currency,
        day(e.spentOn),
        e.description,
        who(e.paidBy),
        money(e.amountMinor, currency),
        SPLIT_LABEL[e.splitMode],
        myMemberId ? money(mine ?? 0, currency) : null,
      ]);
    }
    for (const s of view.settlements) {
      paymentRows.push([
        view.name,
        currency,
        day(localDate(s.createdAt)),
        who(s.from),
        who(s.to),
        money(s.amountMinor, currency),
      ]);
    }
    for (const b of view.balances) {
      balanceRows.push([
        view.name,
        currency,
        who(b.memberId),
        money(b.paidMinor, currency),
        money(b.owedMinor, currency),
        money(b.netMinor, currency, true),
        status(b.netMinor),
      ]);
    }
  }

  const sticky = { stickyRowsCount: 1 } as const;
  return [
    {
      sheet: "My groups",
      data: overview,
      ...sticky,
      columns: [
        { width: 28 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 14 },
        { width: 16 },
        { width: 14 },
        { width: 11 },
        { width: 14 },
        { width: 44 },
      ],
    },
    {
      sheet: "Expenses",
      data: expenseRows,
      ...sticky,
      columns: [
        { width: 28 },
        { width: 10 },
        { width: 14 },
        { width: 32 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
      ],
    },
    {
      sheet: "Payments",
      data: paymentRows,
      ...sticky,
      columns: [
        { width: 28 },
        { width: 10 },
        { width: 14 },
        { width: 18 },
        { width: 18 },
        { width: 14 },
      ],
    },
    {
      sheet: "Balances",
      data: balanceRows,
      ...sticky,
      columns: [
        { width: 28 },
        { width: 10 },
        { width: 18 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 11 },
      ],
    },
  ];
}

/** Renders sheets to an .xlsx download response. */
export async function xlsxResponse(
  sheets: Sheet<FileContent>[],
  fileName: string,
): Promise<Response> {
  const named = sheets.map((s) => ({
    ...s,
    sheet: sheetName(s.sheet ?? "Sheet"),
  }));
  const buffer = await writeXlsxFile(named, {
    fontFamily: "Calibri",
    fontSize: 11,
  }).toBuffer();
  const ascii =
    fileName.replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") ||
    "Hatian.xlsx";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** "Hatian - Siargao Trip - 2026-10-26.xlsx" */
export function exportFileName(title: string, at: Date): string {
  const clean = title
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return `Hatian - ${clean} - ${localDate(at.toISOString())}.xlsx`;
}
