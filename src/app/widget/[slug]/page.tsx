"use client";

import { useEffect, useState } from "react";

type Params = { slug: string };

export default function WidgetPage({ params }: { params: Params }) {
  const [items, setItems] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      const response = await fetch(`/api/widgets/${params.slug}/feed`, { cache: "no-store" });
      const data = await response.json();
      if (mounted && data.ok) {
        setItems(data.data);
      }
    }

    void poll();
    const timer = window.setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [params.slug]);

  if (params.slug === "top-donors") {
    const rows: Array<{ donorName: string; totalUah: number }> = Array.isArray(items) ? items : [];
    return (
      <main className="widget-shell p-4">
        <h1 className="widget-title">Топ 3 донатерів</h1>
        <div className="mt-3 space-y-2">
          {rows.map((row, index) => (
            <div key={row.donorName} className="widget-item">
              {index + 1}. {row.donorName} — {row.totalUah.toFixed(2)} грн
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (params.slug === "fake-battle") {
    const battle = items?.top3 ? items : { top3: [], entries: [] };
    return (
      <main className="widget-shell p-4">
        <h1 className="widget-title">Fake battle</h1>
        <div className="mt-3 space-y-2">
          {battle.top3.map((row: { donorName: string; totalUah: number }, index: number) => (
            <div key={row.donorName} className="widget-item">
              {index + 1}. {row.donorName} — {row.totalUah.toFixed(2)} грн
            </div>
          ))}
        </div>
      </main>
    );
  }

  const rows: Array<{ id: string; donorName: string; amountUah: number; message: string }> = Array.isArray(items)
    ? items
    : [];

  return (
    <main className="widget-shell p-4">
      <h1 className="widget-title">
        {params.slug === "alerts-feed" ? "Стрічка алертів" : "Останні донати"}
      </h1>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="widget-item">
            <p className="font-semibold">
              {row.donorName} — {Number(row.amountUah).toFixed(2)} грн
            </p>
            <p className="text-xs text-amber-100/80">{row.message || "Без повідомлення"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
