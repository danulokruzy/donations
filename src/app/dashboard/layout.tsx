"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard/actions", label: "Actions", icon: "⚡", description: "Тригери та дії" },
  { href: "/dashboard/donations", label: "Donations", icon: "💰", description: "Журнал донатів" },
  { href: "/dashboard/fake-donations", label: "Fake Donats", icon: "🎭", description: "Фейк-донати та батл" },
  { href: "/dashboard/widgets", label: "Widgets", icon: "📺", description: "Оверлеї для OBS" },
  { href: "/dashboard/logs", label: "Logs", icon: "📋", description: "Журнал подій" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️", description: "Інтеграції, платежі, доступ" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/dashboard/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#f4ede0]">
      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0b0a09]/95 px-4 py-3 backdrop-blur md:hidden">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300/80">Donatelko</p>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-3 py-4 md:grid-cols-[260px_1fr]">
        <aside className={`dashboard-card space-y-3 p-4 ${menuOpen ? "block" : "hidden"} md:block`}>
          <div className="border-b border-white/10 pb-3">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Donatelko</p>
            <h1 className="mt-1.5 text-lg font-semibold">Панель керування</h1>
          </div>

          <nav className="grid gap-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition ${
                    active
                      ? "border-amber-200/60 bg-amber-100/10 shadow-[0_0_12px_rgba(233,179,90,0.08)]"
                      : "border-transparent hover:border-white/15 hover:bg-white/5"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[10px] leading-tight text-amber-50/50">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 pt-3">
            <Link
              href="/"
              className="mb-2 block rounded-xl border border-white/10 px-3 py-2 text-center text-xs text-amber-50/70 transition hover:bg-white/5"
            >
              Відкрити сайт донатів
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/20"
              disabled={loggingOut}
            >
              {loggingOut ? "Вихід..." : "Вийти"}
            </button>
          </div>
        </aside>
        <section className="space-y-4">{children}</section>
      </div>
    </div>
  );
}
