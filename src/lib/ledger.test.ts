import { describe, expect, it } from "vitest";
import {
  computeBalances,
  splitByShares,
  splitEqual,
  suggestTransfers,
} from "./ledger";
import { formatMoney, parseMoney } from "./money";
import type { Balance, Member, Transfer } from "./types";

const sum = (values: Iterable<number>) =>
  [...values].reduce((a, b) => a + b, 0);

describe("splitEqual", () => {
  it("gives leftover centavos to the first people and never loses one", () => {
    expect([...splitEqual(1000, ["a", "b", "c"])]).toEqual([
      ["a", 334],
      ["b", 333],
      ["c", 333],
    ]);
  });

  it("handles totals smaller than the head count", () => {
    expect([...splitEqual(2, ["a", "b", "c"]).values()]).toEqual([1, 1, 0]);
  });
});

describe("splitByShares", () => {
  it("splits proportionally with largest remainders and sums exactly", () => {
    const split = splitByShares(1000, [
      { memberId: "a", weight: 1 },
      { memberId: "b", weight: 1 },
      { memberId: "c", weight: 1 },
      { memberId: "d", weight: 0 },
    ]);
    expect(Object.fromEntries(split)).toEqual({ a: 334, b: 333, c: 333 });
  });

  it("gives the leftover to the largest fractional part, not the first entry", () => {
    // 100 * 1/6 = 16.67, 100 * 2/6 = 33.33, 100 * 3/6 = 50
    expect(
      Object.fromEntries(
        splitByShares(100, [
          { memberId: "a", weight: 2 },
          { memberId: "b", weight: 1 },
          { memberId: "c", weight: 3 },
        ]),
      ),
    ).toEqual({ a: 33, b: 17, c: 50 });
  });
});

const members: Member[] = ["ana", "ben", "cai", "dan"].map((id) => ({
  id,
  name: id,
}));

function applyTransfers(balances: Balance[], transfers: Transfer[]) {
  const net = new Map(balances.map((b) => [b.memberId, b.netMinor]));
  for (const t of transfers) {
    net.set(t.from, (net.get(t.from) ?? 0) + t.amountMinor);
    net.set(t.to, (net.get(t.to) ?? 0) - t.amountMinor);
  }
  return net;
}

describe("computeBalances + suggestTransfers", () => {
  it("nets expenses and recorded repayments", () => {
    const balances = computeBalances(
      members.slice(0, 3),
      [
        {
          amountMinor: 3000,
          paidBy: "ana",
          shares: [
            { memberId: "ana", amountMinor: 1000 },
            { memberId: "ben", amountMinor: 1000 },
            { memberId: "cai", amountMinor: 1000 },
          ],
        },
      ],
      [{ from: "ben", to: "ana", amountMinor: 1000 }],
    );
    expect(
      balances.map((b) => [b.memberId, b.paidMinor, b.owedMinor, b.netMinor]),
    ).toEqual([
      ["ana", 3000, 1000, 1000],
      ["ben", 0, 1000, 0],
      ["cai", 0, 1000, -1000],
    ]);
    expect(suggestTransfers(balances)).toEqual([
      { from: "cai", to: "ana", amountMinor: 1000 },
    ]);
  });

  it("pairs exactly matching debts first to save a payment", () => {
    const balances: Balance[] = [
      { memberId: "ana", paidMinor: 0, owedMinor: 0, netMinor: 700 },
      { memberId: "ben", paidMinor: 0, owedMinor: 0, netMinor: 300 },
      { memberId: "cai", paidMinor: 0, owedMinor: 0, netMinor: -300 },
      { memberId: "dan", paidMinor: 0, owedMinor: 0, netMinor: -700 },
    ];
    expect(suggestTransfers(balances)).toEqual([
      { from: "dan", to: "ana", amountMinor: 700 },
      { from: "cai", to: "ben", amountMinor: 300 },
    ]);
  });

  it("always settles everyone to zero in at most n-1 payments (randomized)", () => {
    let seed = 42;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % n;
    };
    for (let round = 0; round < 500; round++) {
      const people = members.slice(0, 2 + rand(3));
      const ids = people.map((m) => m.id);
      const expenses = Array.from({ length: 1 + rand(6) }, () => {
        const amountMinor = 1 + rand(500_000);
        const split = splitEqual(
          amountMinor,
          ids.slice(0, 1 + rand(ids.length)),
        );
        return {
          amountMinor,
          paidBy: ids[rand(ids.length)],
          shares: [...split].map(([memberId, minor]) => ({
            memberId,
            amountMinor: minor,
          })),
        };
      });
      const balances = computeBalances(people, expenses, []);
      expect(sum(balances.map((b) => b.netMinor))).toBe(0);

      const transfers = suggestTransfers(balances);
      expect(transfers.length).toBeLessThanOrEqual(
        Math.max(0, people.length - 1),
      );
      expect(transfers.every((t) => t.amountMinor > 0 && t.from !== t.to)).toBe(
        true,
      );
      expect(
        [...applyTransfers(balances, transfers).values()].every((v) => v === 0),
      ).toBe(true);
    }
  });
});

describe("parseMoney", () => {
  it.each([
    ["1,234.5", "PHP", 123450],
    ["0.07", "PHP", 7],
    [".5", "PHP", 50],
    ["1500", "JPY", 1500],
    ["12.", "USD", 1200],
  ])("parses %s %s", (input, currency, expected) => {
    expect(parseMoney(input, currency)).toBe(expected);
  });

  it.each([
    ["1.234", "PHP"],
    ["-5", "PHP"],
    ["1e3", "PHP"],
    ["10.5", "JPY"],
    ["", "PHP"],
  ])("rejects %s %s", (input, currency) => {
    expect(parseMoney(input, currency)).toBeNull();
  });

  it("round-trips through formatMoney with the currency's minor digits", () => {
    expect(formatMoney(123450, "PHP")).toBe("₱1,234.50");
    expect(formatMoney(1500, "JPY")).toBe("¥1,500");
  });
});
