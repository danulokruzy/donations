"use client";

import { useEffect, useState } from "react";

type SetupState = {
  connections: {
    id: string;
    twitchUsername: string;
    tiktokUsername: string;
    minecraftHost: string;
    minecraftPort: number;
    rconPassword: string;
    monobankJarUrl: string;
    tonAddress: string;
    bridgeEnabled: boolean;
  } | null;
  metrics: {
    actionsCount: number;
    giftsCount: number;
    checksCount: number;
    donationsCount: number;
    bridgeCount: number;
  } | null;
  bridgeClients: Array<{ id: string; machineName: string; lastSeenAt: string | null }>;
  seededToken: string | null;
};

export default function SetupPage() {
  const [state, setState] = useState<SetupState>({
    connections: null,
    metrics: null,
    bridgeClients: [],
    seededToken: null,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [bridgeToken, setBridgeToken] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [setupRes, bridgeRes] = await Promise.all([
      fetch("/api/setup", { cache: "no-store" }),
      fetch("/api/bridge/clients", { cache: "no-store" }),
    ]);
    const [setupJson, bridgeJson] = await Promise.all([setupRes.json(), bridgeRes.json()]);

    if (setupJson.ok) {
      setState((prev) => ({
        ...prev,
        connections: setupJson.data.connections,
        metrics: setupJson.data.metrics,
        bridgeClients: setupJson.data.bridgeClients ?? [],
      }));
    }
    if (bridgeJson.ok) {
      setBridgeToken(bridgeJson.data.seededToken ?? null);
      if (bridgeJson.data.clients) {
        setState((prev) => ({ ...prev, bridgeClients: bridgeJson.data.clients }));
      }
    }
  }

  async function saveConnections() {
    if (!state.connections) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.connections),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Помилка збереження.");
      return;
    }
    setMessage("Підключення збережено.");
  }

  async function rotateToken(clientId: string) {
    const response = await fetch("/api/bridge/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    const data = await response.json();
    if (data.ok) {
      setBridgeToken(data.data.token ?? null);
      await load();
    }
  }

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <h1 className="text-2xl font-semibold">Setup</h1>
        <p className="mt-1 text-sm text-amber-50/75">
          Базові підключення для TikTok, Minecraft, Monobank та локального Bridge-клієнта.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Основні інтеграції</h2>
          {state.connections ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">TikTok username</span>
                <input
                  value={state.connections.tiktokUsername}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      connections: prev.connections
                        ? { ...prev.connections, tiktokUsername: event.target.value }
                        : prev.connections,
                    }))
                  }
                  className="input-dark"
                  placeholder="danulo.kruz"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">Twitch username</span>
                <input
                  value={state.connections.twitchUsername}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      connections: prev.connections
                        ? { ...prev.connections, twitchUsername: event.target.value }
                        : prev.connections,
                    }))
                  }
                  className="input-dark"
                  placeholder="danulo_kruz"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">Minecraft host</span>
                <input
                  value={state.connections.minecraftHost}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      connections: prev.connections
                        ? { ...prev.connections, minecraftHost: event.target.value }
                        : prev.connections,
                    }))
                  }
                  className="input-dark"
                  placeholder="127.0.0.1"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">RCON порт</span>
                <input
                  value={state.connections.minecraftPort}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      connections: prev.connections
                        ? {
                            ...prev.connections,
                            minecraftPort: Number(event.target.value) || 0,
                          }
                        : prev.connections,
                    }))
                  }
                  className="input-dark"
                  type="number"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-amber-50/75">RCON пароль</span>
                <input
                  value={state.connections.rconPassword}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      connections: prev.connections
                        ? { ...prev.connections, rconPassword: event.target.value }
                        : prev.connections,
                    }))
                  }
                  className="input-dark"
                  type="password"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">Monobank jar URL</span>
                <input
                  value={state.connections.monobankJarUrl}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      connections: prev.connections
                        ? { ...prev.connections, monobankJarUrl: event.target.value }
                        : prev.connections,
                    }))
                  }
                  className="input-dark"
                  placeholder="https://send.monobank.ua/jar/..."
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">TON адреса</span>
                <input
                  value={state.connections.tonAddress}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      connections: prev.connections
                        ? { ...prev.connections, tonAddress: event.target.value }
                        : prev.connections,
                    }))
                  }
                  className="input-dark"
                  placeholder="UQ..."
                />
              </label>
            </div>
          ) : (
            <p className="mt-3 text-sm text-amber-50/70">Завантаження...</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveConnections}
              disabled={saving || !state.connections}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300 disabled:opacity-60"
            >
              {saving ? "Збереження..." : "Зберегти Setup"}
            </button>
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          </div>
        </article>

        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Стан системи</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>Дій: {state.metrics?.actionsCount ?? 0}</p>
            <p>Подарунків у каталозі: {state.metrics?.giftsCount ?? 0}</p>
            <p>Активних чеків: {state.metrics?.checksCount ?? 0}</p>
            <p>Донатів: {state.metrics?.donationsCount ?? 0}</p>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
            <p className="font-medium">Bridge-клієнт</p>
            <p className="mt-1 text-xs text-amber-50/70">
              Для локальних клавіш/звуків/відео використовуй token нижче у bridge-лаунчері.
            </p>
            {bridgeToken ? (
              <p className="mt-2 break-all rounded-lg bg-black/45 px-2 py-1 text-xs text-amber-100">
                {bridgeToken}
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-50/70">
                Token не показується повторно. Натисни rotate для нового.
              </p>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {state.bridgeClients.map((client) => (
              <div key={client.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                <p className="text-sm">{client.machineName}</p>
                <p className="text-xs text-amber-50/65">
                  Last seen:{" "}
                  {client.lastSeenAt ? new Date(client.lastSeenAt).toLocaleString() : "ще не підключався"}
                </p>
                <button
                  type="button"
                  onClick={() => rotateToken(client.id)}
                  className="mt-2 rounded-lg border border-amber-300/40 px-3 py-1 text-xs text-amber-100 hover:bg-amber-100/10"
                >
                  Rotate token
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
