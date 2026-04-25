"use client";

import { useEffect, useState } from "react";

type SettingsPayload = {
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const response = await fetch("/api/settings", { cache: "no-store" });
    const data = await response.json();
    if (data.ok) {
      setSettings(data.data);
    }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        adminPassword: adminPassword.trim() || undefined,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося оновити налаштування.");
      return;
    }
    setAdminPassword("");
    setMessage("Налаштування збережено.");
    setSettings(data.data);
  }

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-amber-50/75">
          Ліміти, посилання оплати, fallback-курси та пароль адміністратора.
        </p>
      </section>

      <section className="dashboard-card p-5">
        {!settings ? (
          <p className="text-sm text-amber-50/70">Завантаження...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">UAH оплата URL</span>
              <input
                value={settings.uahPaymentUrl}
                onChange={(e) => setSettings({ ...settings, uahPaymentUrl: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">CryptoBOT URL</span>
              <input
                value={settings.cryptobotUsdtUrl}
                onChange={(e) => setSettings({ ...settings, cryptobotUsdtUrl: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">TonPay URL</span>
              <input
                value={settings.tonPayUrl}
                onChange={(e) => setSettings({ ...settings, tonPayUrl: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">TON отримувач</span>
              <input
                value={settings.tonReceiverAddress}
                onChange={(e) => setSettings({ ...settings, tonReceiverAddress: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">TON мережа</span>
              <select
                value={settings.tonNetwork}
                onChange={(e) => setSettings({ ...settings, tonNetwork: e.target.value })}
                className="input-dark"
              >
                <option value="mainnet">mainnet</option>
                <option value="testnet">testnet</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Префікс коду чеку</span>
              <input
                value={settings.paymentMemoPrefix}
                onChange={(e) => setSettings({ ...settings, paymentMemoPrefix: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Мін сума, грн</span>
              <input
                type="number"
                value={settings.minAmountUah}
                onChange={(e) => setSettings({ ...settings, minAmountUah: Number(e.target.value) || 0 })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Макс сума, грн</span>
              <input
                type="number"
                value={settings.maxAmountUah}
                onChange={(e) => setSettings({ ...settings, maxAmountUah: Number(e.target.value) || 0 })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Fallback USDT→UAH</span>
              <input
                type="number"
                value={settings.usdtToUahFallback}
                onChange={(e) =>
                  setSettings({ ...settings, usdtToUahFallback: Number(e.target.value) || 1 })
                }
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Fallback TON→UAH</span>
              <input
                type="number"
                value={settings.tonToUahFallback}
                onChange={(e) => setSettings({ ...settings, tonToUahFallback: Number(e.target.value) || 1 })}
                className="input-dark"
              />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-amber-50/75">Новий пароль dashboard (необов&apos;язково)</span>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-dark"
                placeholder="Залиш порожнім, щоб не змінювати"
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={!settings || saving}
          className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300 disabled:opacity-60"
        >
          {saving ? "Збереження..." : "Зберегти налаштування"}
        </button>
        {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      </section>
    </main>
  );
}
