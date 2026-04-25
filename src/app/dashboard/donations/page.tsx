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

type FakeItem = {
  id: string;
  donorName: string;
  amountUah: number;
  message: string;
  createdAt: string;
};

export default function DonationsPage() {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [fakeDonations, setFakeDonations] = useState<FakeItem[]>([]);
  const [topFake, setTopFake] = useState<Array<{ donorName: string; totalUah: number }>>([]);
  const [message, setMessage] = useState("");
  const [fakeName, setFakeName] = useState("Настя");
  const [fakeAmount, setFakeAmount] = useState(50);
  const [fakeMessage, setFakeMessage] = useState("Донат батл!");

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    const [donationsRes, fakeRes] = await Promise.all([
      fetch("/api/donations", { cache: "no-store" }),
      fetch("/api/fake-donations", { cache: "no-store" }),
    ]);
    const [donationsJson, fakeJson] = await Promise.all([donationsRes.json(), fakeRes.json()]);
    if (donationsJson.ok) {
      setChecks(donationsJson.data.checks);
      setDonations(donationsJson.data.donations);
      setFakeDonations(donationsJson.data.fakeDonations);
    }
    if (fakeJson.ok) {
      setTopFake(fakeJson.data.top3 || []);
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
      setMessage(data.error || "Не вдалося підтвердити оплату.");
      return;
    }
    setMessage(
      anonymous
        ? "Платіж записано як анонімний (без тригерів)."
        : "Оплату підтверджено, тригери запущено."
    );
    await reload();
  }

  async function addFake(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/fake-donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorName: fakeName,
        amountUah: fakeAmount,
        message: fakeMessage,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося додати фейк-донат.");
      return;
    }
    await reload();
  }

  async function deleteFake(id: string) {
    const response = await fetch(`/api/fake-donations/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося видалити фейк-донат.");
      return;
    }
    await reload();
  }

  async function generateBattle() {
    const players = ["Настя", "Влад"];
    for (let i = 0; i < 8; i += 1) {
      const donorName = players[i % 2];
      const amountUah = 20 + Math.floor(Math.random() * 200);
      await fetch("/api/fake-donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName,
          amountUah,
          message: `Battle #${i + 1}`,
          battleTag: "nastya-vs-vlad",
        }),
      });
    }
    setMessage("Батл згенеровано.");
    await reload();
  }

  const top3Real = useMemo(() => {
    const map = new Map<string, number>();
    for (const donation of donations) {
      map.set(donation.donorName, (map.get(donation.donorName) ?? 0) + donation.amountUah);
    }
    return Array.from(map.entries())
      .map(([donorName, totalUah]) => ({ donorName, totalUah }))
      .sort((a, b) => b.totalUah - a.totalUah)
      .slice(0, 3);
  }, [donations]);

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <h1 className="text-2xl font-semibold">Donations</h1>
        <p className="mt-1 text-sm text-amber-50/75">
          Керування активними чеками, підтвердженнями оплат та фейк-батлами.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Активні чеки</h2>
          <div className="mt-3 space-y-3">
            {checks.length === 0 ? (
              <p className="text-sm text-amber-50/70">Активних чеків немає.</p>
            ) : (
              checks.map((check) => (
                <div key={check.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{check.code}</p>
                    <p className="text-xs text-amber-50/70">
                      до {new Date(check.expiresAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="mt-1 text-sm">
                    {check.donorName} • {check.amountLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <a
                      href={check.payUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-white/20 px-2 py-1 hover:bg-white/10"
                    >
                      Відкрити оплату
                    </a>
                    <button
                      type="button"
                      onClick={() => verifyCheck(check, false)}
                      className="rounded border border-emerald-300/40 px-2 py-1 text-emerald-200"
                    >
                      Підтвердити (з кодом)
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyCheck(check, true)}
                      className="rounded border border-amber-300/40 px-2 py-1 text-amber-200"
                    >
                      Анонімно без коду
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelCheck(check.id)}
                      className="rounded border border-red-300/40 px-2 py-1 text-red-200"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Top 3</h2>
          <p className="mt-2 text-sm text-amber-50/70">Реальні донати</p>
          <div className="mt-2 space-y-2">
            {top3Real.length === 0 ? (
              <p className="text-sm text-amber-50/70">Ще немає донатів.</p>
            ) : (
              top3Real.map((row, index) => (
                <div key={row.donorName} className="rounded-lg border border-white/10 bg-black/25 p-2 text-sm">
                  {index + 1}. {row.donorName} — {row.totalUah.toFixed(2)} грн
                </div>
              ))
            )}
          </div>
          <p className="mt-3 text-sm text-amber-50/70">Фейк батл</p>
          <div className="mt-2 space-y-2">
            {topFake.length === 0 ? (
              <p className="text-sm text-amber-50/70">Ще немає батлу.</p>
            ) : (
              topFake.map((row, index) => (
                <div key={row.donorName} className="rounded-lg border border-white/10 bg-black/25 p-2 text-sm">
                  {index + 1}. {row.donorName} — {row.totalUah.toFixed(2)} грн
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Останні донати</h2>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
            {donations.length === 0 ? (
              <p className="text-sm text-amber-50/70">Поки що порожньо.</p>
            ) : (
              donations.map((donation) => (
                <div key={donation.id} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      {donation.donorName}
                      {donation.isAnonymous ? " (анонім)" : ""}
                      {donation.isFake ? " (fake)" : ""}
                    </p>
                    <p>{donation.amountUah.toFixed(2)} грн</p>
                  </div>
                  <p className="mt-1 text-xs text-amber-50/70">{donation.message || "Без повідомлення"}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Фейк-донати та батл</h2>
          <form onSubmit={addFake} className="mt-3 space-y-2">
            <input value={fakeName} onChange={(e) => setFakeName(e.target.value)} className="input-dark" placeholder="Ім'я" />
            <input
              value={fakeAmount}
              onChange={(e) => setFakeAmount(Number(e.target.value) || 0)}
              className="input-dark"
              type="number"
              placeholder="Сума"
            />
            <input
              value={fakeMessage}
              onChange={(e) => setFakeMessage(e.target.value)}
              className="input-dark"
              placeholder="Повідомлення"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300"
              >
                Додати
              </button>
              <button
                type="button"
                onClick={generateBattle}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
              >
                Генерувати battle
              </button>
            </div>
          </form>

          <div className="mt-3 max-h-[250px] space-y-2 overflow-auto pr-1">
            {fakeDonations.slice(0, 20).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-2 text-sm">
                <p>
                  {item.donorName} — {item.amountUah.toFixed(2)} грн
                </p>
                <p className="text-xs text-amber-50/70">{item.message}</p>
                <button
                  type="button"
                  onClick={() => deleteFake(item.id)}
                  className="mt-1 rounded border border-red-300/40 px-2 py-1 text-xs text-red-200"
                >
                  Видалити
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
    </main>
  );
}
