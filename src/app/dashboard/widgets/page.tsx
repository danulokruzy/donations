"use client";

import { useCallback, useEffect, useState } from "react";

type Preset = {
  id: string;
  slug: string;
  name: string;
  settingsJson: string;
  isActive: boolean;
};

function defaultsFor(slug: string) {
  if (slug === "last-donations") return { limit: 20, compact: false, showChannel: true, animation: "fade" };
  if (slug === "top-donors") return { limit: 3, period: "all", animation: "slide" };
  if (slug === "alerts-feed") return { limit: 30, includeFake: true, displayMs: 7000, animation: "pop" };
  return { limit: 20, showTop3: true, animation: "ticker" };
}

export default function WidgetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selected, setSelected] = useState("last-donations");
  const [settingsText, setSettingsText] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");

  const reload = useCallback(async () => {
    const response = await fetch("/api/widgets/presets", { cache: "no-store" });
    const result = await response.json();
    if (!result.ok) return;
    const list: Preset[] = result.data;
    setPresets(list);
    if (list.length > 0) {
      const current = list.find((item) => item.slug === selected) || list[0];
      setSelected(current.slug);
      setName(current.name);
      setActive(current.isActive);
      setSettingsText(current.settingsJson);
    }
  }, [selected]);

  useEffect(() => {
    setOrigin(window.location.origin);
    void reload();
  }, [reload]);

  function choosePreset(slug: string) {
    setSelected(slug);
    const item = presets.find((preset) => preset.slug === slug);
    if (item) {
      setName(item.name);
      setActive(item.isActive);
      setSettingsText(item.settingsJson);
      return;
    }
    setName(slug);
    setActive(true);
    setSettingsText(JSON.stringify(defaultsFor(slug), null, 2));
  }

  async function savePreset() {
    setMessage("");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(settingsText || "{}");
    } catch {
      setMessage("JSON налаштувань містить помилку.");
      return;
    }

    const response = await fetch("/api/widgets/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: selected,
        name: name.trim() || selected,
        settings: parsed,
        isActive: active,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setMessage(result.error || "Не вдалося зберегти пресет.");
      return;
    }
    setMessage("Пресет віджета збережено.");
    await reload();
  }

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <h1 className="text-2xl font-semibold">Widgets</h1>
        <p className="mt-1 text-sm text-amber-50/75">
          Віджети для OBS: стрічка алертів, останні донати, топ 3 і fake battle.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <article className="dashboard-card p-4">
          <h2 className="text-sm uppercase tracking-[0.15em] text-amber-200/80">Слоти віджетів</h2>
          <div className="mt-3 grid gap-2">
            {["last-donations", "top-donors", "alerts-feed", "fake-battle"].map((slug) => {
              const item = presets.find((preset) => preset.slug === slug);
              const selectedNow = slug === selected;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => choosePreset(slug)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    selectedNow
                      ? "border-amber-200/80 bg-amber-100/10"
                      : "border-white/10 bg-black/20 hover:border-white/30"
                  }`}
                >
                  <p className="text-sm font-semibold">{item?.name || slug}</p>
                  <p className="text-xs text-amber-50/70">{slug}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-amber-50/75">
            <p>OBS URL:</p>
            <p className="mt-1 break-all text-amber-100">{`${origin}/widget/${selected}`}</p>
          </div>
        </article>

        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Налаштування: {selected}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Назва в dashboard</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-dark" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Віджет активний
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-amber-50/75">
                JSON налаштування (шрифти, кольори, анімація, відступи, фільтри)
              </span>
              <textarea
                value={settingsText}
                onChange={(e) => setSettingsText(e.target.value)}
                className="h-56 w-full rounded-xl border border-white/15 bg-black/30 p-3 font-mono text-xs outline-none focus:border-amber-300/70"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={savePreset}
            className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300"
          >
            Зберегти пресет
          </button>
          {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}

          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-sm font-semibold">Preview endpoint</p>
            <a
              href={`/api/widgets/${selected}/feed`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-xs text-amber-100 underline underline-offset-2"
            >
              /api/widgets/{selected}/feed
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
