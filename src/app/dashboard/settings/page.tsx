"use client";

import { useEffect, useState } from "react";

type ConnectionsData = {
  id: string;
  twitchUsername: string;
  tiktokUsername: string;
  minecraftHost: string;
  minecraftPort: number;
  rconPassword: string;
  cryptobotToken: string;
  monobankJarUrl: string;
  tonAddress: string;
  bridgeEnabled: boolean;
};

type PaymentData = {
  id: string;
  uahPaymentUrl: string;
  cryptobotUsdtUrl: string;
  tonPayUrl: string;
  tonReceiverAddress: string;
  tonNetwork: string;
  minAmountUah: number;
  maxAmountUah: number;
  paymentMemoPrefix: string;
  confirmationMode: string;
  usdtToUahFallback: number;
  tonToUahFallback: number;
};

type Metrics = {
  actionsCount: number;
  giftsCount: number;
  checksCount: number;
  donationsCount: number;
  bridgeCount: number;
};

export default function SettingsPage() {
  const [connections, setConnections] = useState<ConnectionsData | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [bridgeToken, setBridgeToken] = useState<string | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    const [setupRes, connRes, settingsRes, bridgeRes] = await Promise.all([
      fetch("/api/setup", { cache: "no-store" }),
      fetch("/api/connections", { cache: "no-store" }),
      fetch("/api/settings", { cache: "no-store" }),
      fetch("/api/bridge/clients", { cache: "no-store" }),
    ]);
    const [setupJson, connJson, settingsJson, bridgeJson] = await Promise.all([
      setupRes.json(),
      connRes.json(),
      settingsRes.json(),
      bridgeRes.json(),
    ]);

    if (connJson.ok) setConnections(connJson.data);
    if (settingsJson.ok) setPayment(settingsJson.data);
    if (setupJson.ok) setMetrics(setupJson.data.metrics);
    if (bridgeJson.ok) setBridgeToken(bridgeJson.data.seededToken ?? null);
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");

    const results = await Promise.all([
      connections
        ? fetch("/api/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(connections),
          })
        : Promise.resolve(null),
      payment
        ? fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payment,
              adminPassword: adminPassword.trim() || undefined,
            }),
          })
        : Promise.resolve(null),
    ]);

    setSaving(false);

    const errors: string[] = [];
    for (const res of results) {
      if (!res) continue;
      const data = await res.json();
      if (!res.ok || !data.ok) errors.push(data.error || "Помилка збереження.");
    }

    if (errors.length > 0) {
      setMessage(errors.join(" "));
    } else {
      setMessage("Всі налаштування збережено.");
      setAdminPassword("");
      await loadAll();
    }
  }

  const loading = !connections || !payment;

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-amber-50/70">
          Інтеграції, платіжні дані, ліміти та доступ. Все в одному місці.
        </p>
      </section>

      {loading ? (
        <section className="dashboard-card p-5">
          <p className="text-sm text-amber-50/70">Завантаження...</p>
        </section>
      ) : (
        <>
          {/* Integrations Block */}
          <section className="dashboard-card p-5">
            <h2 className="mb-4 text-lg font-semibold">Інтеграції</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">TikTok username</span>
                <input
                  value={connections!.tiktokUsername}
                  onChange={(e) => setConnections({ ...connections!, tiktokUsername: e.target.value })}
                  className="input-dark"
                  placeholder="danulo.kruz"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Twitch username</span>
                <input
                  value={connections!.twitchUsername}
                  onChange={(e) => setConnections({ ...connections!, twitchUsername: e.target.value })}
                  className="input-dark"
                  placeholder="danulo_kruz"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Minecraft host</span>
                <input
                  value={connections!.minecraftHost}
                  onChange={(e) => setConnections({ ...connections!, minecraftHost: e.target.value })}
                  className="input-dark"
                  placeholder="127.0.0.1"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">RCON порт</span>
                <input
                  type="number"
                  value={connections!.minecraftPort}
                  onChange={(e) => setConnections({ ...connections!, minecraftPort: Number(e.target.value) || 0 })}
                  className="input-dark"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-amber-50/65">RCON пароль</span>
                <input
                  type="password"
                  value={connections!.rconPassword}
                  onChange={(e) => setConnections({ ...connections!, rconPassword: e.target.value })}
                  className="input-dark"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={connections!.bridgeEnabled}
                  onChange={(e) => setConnections({ ...connections!, bridgeEnabled: e.target.checked })}
                />
                Увімкнути Bridge-клієнт (клавіші, звук, відео, RCON)
              </label>
            </div>
          </section>

          {/* Payment Data Block */}
          <section className="dashboard-card p-5">
            <h2 className="mb-4 text-lg font-semibold">Платіжні дані</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Monobank jar URL</span>
                <input
                  value={connections!.monobankJarUrl}
                  onChange={(e) => setConnections({ ...connections!, monobankJarUrl: e.target.value })}
                  className="input-dark"
                  placeholder="https://send.monobank.ua/jar/..."
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">UAH оплата URL</span>
                <input
                  value={payment!.uahPaymentUrl}
                  onChange={(e) => setPayment({ ...payment!, uahPaymentUrl: e.target.value })}
                  className="input-dark"
                  placeholder="https://send.monobank.ua/jar/..."
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">CryptoBOT token</span>
                <input
                  value={connections!.cryptobotToken}
                  onChange={(e) => setConnections({ ...connections!, cryptobotToken: e.target.value })}
                  className="input-dark"
                  type="password"
                  placeholder="API token від @CryptoBot"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">CryptoBOT URL</span>
                <input
                  value={payment!.cryptobotUsdtUrl}
                  onChange={(e) => setPayment({ ...payment!, cryptobotUsdtUrl: e.target.value })}
                  className="input-dark"
                  placeholder="https://t.me/CryptoBot?start=..."
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">TON адреса кошелька</span>
                <input
                  value={connections!.tonAddress}
                  onChange={(e) => setConnections({ ...connections!, tonAddress: e.target.value })}
                  className="input-dark"
                  placeholder="UQ..."
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">TON мережа</span>
                <select
                  value={payment!.tonNetwork}
                  onChange={(e) => setPayment({ ...payment!, tonNetwork: e.target.value })}
                  className="input-dark"
                >
                  <option value="mainnet">mainnet</option>
                  <option value="testnet">testnet</option>
                </select>
              </label>
            </div>
          </section>

          {/* General Settings Block */}
          <section className="dashboard-card p-5">
            <h2 className="mb-4 text-lg font-semibold">Загальні налаштування</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Префікс коду чеку</span>
                <input
                  value={payment!.paymentMemoPrefix}
                  onChange={(e) => setPayment({ ...payment!, paymentMemoPrefix: e.target.value })}
                  className="input-dark"
                  placeholder="DON"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Мін. сума (грн)</span>
                <input
                  type="number"
                  value={payment!.minAmountUah}
                  onChange={(e) => setPayment({ ...payment!, minAmountUah: Number(e.target.value) || 0 })}
                  className="input-dark"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Макс. сума (грн)</span>
                <input
                  type="number"
                  value={payment!.maxAmountUah}
                  onChange={(e) => setPayment({ ...payment!, maxAmountUah: Number(e.target.value) || 0 })}
                  className="input-dark"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Fallback USDT→UAH</span>
                <input
                  type="number"
                  value={payment!.usdtToUahFallback}
                  onChange={(e) => setPayment({ ...payment!, usdtToUahFallback: Number(e.target.value) || 1 })}
                  className="input-dark"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Fallback TON→UAH</span>
                <input
                  type="number"
                  value={payment!.tonToUahFallback}
                  onChange={(e) => setPayment({ ...payment!, tonToUahFallback: Number(e.target.value) || 1 })}
                  className="input-dark"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/65">Новий пароль (необов&apos;язково)</span>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input-dark"
                  placeholder="Залиш порожнім, щоб не змінювати"
                />
              </label>
            </div>
          </section>

          {/* System Status */}
          <section className="grid gap-4 md:grid-cols-2">
            <article className="dashboard-card p-5">
              <h2 className="mb-3 text-lg font-semibold">Стан системи</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Дій", value: metrics?.actionsCount ?? 0 },
                  { label: "Подарунків", value: metrics?.giftsCount ?? 0 },
                  { label: "Чеків", value: metrics?.checksCount ?? 0 },
                  { label: "Донатів", value: metrics?.donationsCount ?? 0 },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white/10 bg-black/20 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-200">{stat.value}</p>
                    <p className="text-xs text-amber-50/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-card p-5">
              <h2 className="mb-3 text-lg font-semibold">Bridge-клієнт</h2>
              <p className="text-xs text-amber-50/60">
                Токен для bridge-лаунчера (локальні клавіші, звуки, відео).
              </p>
              {bridgeToken ? (
                <p className="mt-3 break-all rounded-lg bg-black/40 px-3 py-2 text-xs text-amber-100">
                  {bridgeToken}
                </p>
              ) : (
                <p className="mt-3 text-xs text-amber-50/60">
                  Token не показується повторно. Використай rotate.
                </p>
              )}
            </article>
          </section>

          {/* Sticky Save Button */}
          <div className="sticky bottom-4 z-20">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0b0a09]/95 px-5 py-3 shadow-2xl backdrop-blur">
              <button
                type="button"
                onClick={saveAll}
                disabled={saving}
                className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300 disabled:opacity-60"
              >
                {saving ? "Збереження..." : "Зберегти все"}
              </button>
              {message && (
                <p className={`text-sm ${message.includes("Помилка") || message.includes("помилка") ? "text-red-300" : "text-emerald-300"}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
