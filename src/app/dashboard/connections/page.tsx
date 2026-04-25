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

export default function ConnectionsPage() {
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    const response = await fetch("/api/connections", { cache: "no-store" });
    const result = await response.json();
    if (result.ok) setData(result.data);
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok || !result.ok) {
      setMessage(result.error || "Не вдалося зберегти.");
      return;
    }
    setMessage("Підключення оновлено.");
  }

  async function testRcon() {
    if (!data) return;
    if (!data.minecraftHost || !data.rconPassword) {
      setMessage("Для тесту RCON вкажіть host та пароль.");
      return;
    }
    setMessage(
      "RCON тест у v1 працює через Bridge-клієнт. Після підключення bridge він автоматично виконає тест-команду."
    );
  }

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <h1 className="text-2xl font-semibold">Connections</h1>
        <p className="mt-1 text-sm text-amber-50/75">
          Збереження ключів/URL для інтеграцій. Тут же вказується jar, токени та сервер Minecraft.
        </p>
      </section>

      <section className="dashboard-card p-5">
        {!data ? (
          <p className="text-sm text-amber-50/70">Завантаження...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">TikTok username</span>
              <input
                value={data.tiktokUsername}
                onChange={(e) => setData({ ...data, tiktokUsername: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Twitch username</span>
              <input
                value={data.twitchUsername}
                onChange={(e) => setData({ ...data, twitchUsername: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Minecraft host</span>
              <input
                value={data.minecraftHost}
                onChange={(e) => setData({ ...data, minecraftHost: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">RCON порт</span>
              <input
                type="number"
                value={data.minecraftPort}
                onChange={(e) => setData({ ...data, minecraftPort: Number(e.target.value) || 0 })}
                className="input-dark"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-amber-50/75">RCON пароль</span>
              <input
                type="password"
                value={data.rconPassword}
                onChange={(e) => setData({ ...data, rconPassword: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-amber-50/75">Monobank jar URL</span>
              <input
                value={data.monobankJarUrl}
                onChange={(e) => setData({ ...data, monobankJarUrl: e.target.value })}
                className="input-dark"
                placeholder="https://send.monobank.ua/jar/..."
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">CryptoBOT token</span>
              <input
                value={data.cryptobotToken}
                onChange={(e) => setData({ ...data, cryptobotToken: e.target.value })}
                className="input-dark"
                type="password"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">TON адреса</span>
              <input
                value={data.tonAddress}
                onChange={(e) => setData({ ...data, tonAddress: e.target.value })}
                className="input-dark"
              />
            </label>

            <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={data.bridgeEnabled}
                onChange={(e) => setData({ ...data, bridgeEnabled: e.target.checked })}
              />
              Увімкнути локальний Bridge-клієнт для клавіш, звуку, відео та RCON.
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!data || saving}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300 disabled:opacity-60"
          >
            {saving ? "Збереження..." : "Зберегти"}
          </button>
          <button
            type="button"
            onClick={testRcon}
            disabled={!data}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
          >
            Тест RCON
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      </section>
    </main>
  );
}
