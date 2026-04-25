"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CheckItem = {
  id: string;
  code: string;
  donorName: string;
  amountLabel: string;
  amountUah: number;
  channel: string;
  status: string;
  expiresAt: string;
  payUrl: string;
};

type DonationItem = {
  id: string;
  donorName: string;
  message: string;
  amountLabel: string;
  amountUah: number;
  channel: string;
  isAnonymous: boolean;
  isFake: boolean;
  createdAt: string;
};

function channelIcon(ch: string) {
  if (ch === "UAH") return "🏦";
  if (ch === "CRYPTOBOT") return "🤖";
  if (ch === "TONPAY") return "💎";
  return "💸";
}

export default function DonationsPage() {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [message, setMessage] = useState("");

  const [manualName, setManualName] = useState("");
  const [manualAmount, setManualAmount] = useState(50);
  const [manualMessage, setManualMessage] = useState("");
  const [manualChannel, setManualChannel] = useState("UAH");
  const [addingManual, setAddingManual] = useState(false);

  const [filter, setFilter] = useState<"all" | "real" | "fake">("all");

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    const res = await fetch("/api/donations", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) {
      setChecks(data.data.checks);
      setDonations(data.data.donations);
    }
  }

  async function cancelCheck(id: string) {
    const response = await fetch(`/api/checks/${id}/cancel`, { method: "POST" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося скасувати чек.");
      return;
    }
    setMessage("Чек скасовано.");
    await reload();
  }

  async function verifyCheck(check: CheckItem, anonymous = false) {
    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkId: check.id,
        channel: check.channel.toLowerCase(),
        paidAmount: check.channel === "UAH" ? check.amountUah : undefined,
        comment: anonymous ? "anonymous-no-code" : check.code,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося підтвердити.");
      return;
    }
    setMessage(anonymous ? "Анонімний платіж записано." : "Оплату підтверджено.");
    await reload();
  }

  async function addManualDonation(e: FormEvent) {
    e.preventDefault();
    if (!manualName.trim()) {
      setMessage("Вкажіть ім'я.");
      return;
    }
    setAddingManual(true);
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorName: manualName.trim(),
        amountUah: manualAmount,
        message: manualMessage.trim(),
        channel: manualChannel,
      }),
    });
    const data = await res.json();
    setAddingManual(false);
    if (!res.ok || !data.ok) {
      setMessage(data.error || "Не вдалося створити донат.");
      return;
    }
    setMessage("Донат створено вручну.");
    setManualMessage("");
    await reload();
  }

  const filteredDonations = useMemo(() => {
    if (filter === "real") return donations.filter((d) => !d.isFake);
    if (filter === "fake") return donations.filter((d) => d.isFake);
    return donations;
  }, [donations, filter]);

  const totalReal = useMemo(() => {
    return donations.filter((d) => !d.isFake).reduce((sum, d) => sum + d.amountUah, 0);
  }, [donations]);

  const top3Real = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of donations.filter((d) => !d.isFake)) {
      map.set(d.donorName, (map.get(d.donorName) ?? 0) + d.amountUah);
    }
    return Array.from(map.entries())
      .map(([donorName, totalUah]) => ({ donorName, totalUah }))
      .sort((a, b) => b.totalUah - a.totalUah)
      .slice(0, 5);
  }, [donations]);

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Donations</h1>
            <p className="mt-1 text-sm text-amber-50/70">
              Єдиний журнал усіх донатів, чеків та платежів.
            </p>
          </div>
          <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-center">
            <p className="text-xl font-bold text-amber-200">{totalReal.toFixed(2)} грн</p>
            <p className="text-xs text-amber-50/60">Всього (реальні)</p>
          </div>
        </div>
      </section>

      {/* Stats + Active Checks Row */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Top Donors */}
        <article className="dashboard-card p-5">
          <h2 className="text-base font-semibold">Топ донатерів</h2>
          <div className="mt-3 space-y-2">
            {top3Real.length === 0 ? (
              <p className="text-sm text-amber-50/60">Ще немає донатів.</p>
            ) : (
              top3Real.map((row, i) => (
                <div key={row.donorName} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-2.5 text-sm">
                  <span>
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-200">
                      {i + 1}
                    </span>
                    {row.donorName}
                  </span>
                  <span className="font-semibold text-amber-200">{row.totalUah.toFixed(0)} грн</span>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Active Checks */}
        <article className="dashboard-card p-5">
          <h2 className="text-base font-semibold">Активні чеки</h2>
          <div className="mt-3 max-h-[300px] space-y-2 overflow-auto pr-1">
            {checks.length === 0 ? (
              <p className="text-sm text-amber-50/60">Немає активних чеків.</p>
            ) : (
              checks.map((check) => (
                <div key={check.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>{channelIcon(check.channel)}</span>
                      <span className="font-mono text-sm font-semibold">{check.code}</span>
                    </div>
                    <span className="text-xs text-amber-50/60">
                      до {new Date(check.expiresAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-amber-50/80">
                    {check.donorName} &mdash; {check.amountLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => verifyCheck(check, false)}
                      className="rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-200 hover:bg-emerald-500/30"
                    >
                      Підтвердити
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyCheck(check, true)}
                      className="rounded-lg bg-amber-500/20 px-2 py-1 text-amber-200 hover:bg-amber-500/30"
                    >
                      Анонімно
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelCheck(check.id)}
                      className="rounded-lg bg-red-500/20 px-2 py-1 text-red-200 hover:bg-red-500/30"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* Manual Donation Creation */}
      <section className="dashboard-card p-5">
        <h2 className="mb-3 text-base font-semibold">Створити донат вручну</h2>
        <form onSubmit={addManualDonation} className="grid gap-3 md:grid-cols-4">
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="input-dark"
            placeholder="Ім'я донатера"
          />
          <input
            type="number"
            min={1}
            value={manualAmount}
            onChange={(e) => setManualAmount(Number(e.target.value) || 0)}
            className="input-dark"
            placeholder="Сума грн"
          />
          <input
            value={manualMessage}
            onChange={(e) => setManualMessage(e.target.value)}
            className="input-dark"
            placeholder="Повідомлення"
          />
          <div className="flex gap-2">
            <select
              value={manualChannel}
              onChange={(e) => setManualChannel(e.target.value)}
              className="input-dark w-24"
            >
              <option value="UAH">UAH</option>
              <option value="CRYPTOBOT">Crypto</option>
              <option value="TONPAY">TON</option>
            </select>
            <button
              type="submit"
              disabled={addingManual}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300 disabled:opacity-60"
            >
              {addingManual ? "..." : "Додати"}
            </button>
          </div>
        </form>
      </section>

      {/* Donations Journal */}
      <section className="dashboard-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Журнал донатів</h2>
          <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
            {(["all", "real", "fake"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-xs transition ${
                  filter === f ? "bg-amber-400/20 text-amber-200" : "text-amber-50/60 hover:text-amber-50/80"
                }`}
              >
                {f === "all" ? "Всі" : f === "real" ? "Реальні" : "Фейк"}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[500px] space-y-2 overflow-auto pr-1">
          {filteredDonations.length === 0 ? (
            <p className="py-8 text-center text-sm text-amber-50/50">Поки що порожньо.</p>
          ) : (
            filteredDonations.map((d) => (
              <div key={d.id} className="flex items-start gap-3 rounded-xl border border-white/8 bg-black/20 p-3">
                <span className="mt-0.5 text-lg">{channelIcon(d.channel)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{d.donorName}</span>
                    {d.isFake && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300">fake</span>
                    )}
                    {d.isAnonymous && (
                      <span className="rounded bg-gray-500/20 px-1.5 py-0.5 text-[10px] text-gray-300">анонім</span>
                    )}
                    <span className="ml-auto font-semibold text-amber-200">{d.amountUah.toFixed(2)} грн</span>
                  </div>
                  <p className="mt-0.5 text-xs text-amber-50/60">{d.message || "Без повідомлення"}</p>
                  <p className="mt-1 text-[10px] text-amber-50/40">
                    {new Date(d.createdAt).toLocaleString()} &middot; {d.amountLabel}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {message && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-white/15 bg-[#1a1412] px-4 py-3 text-sm shadow-xl">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            className="ml-3 text-xs text-amber-50/60 hover:text-amber-50"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
