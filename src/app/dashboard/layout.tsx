"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard/setup", label: "Setup", description: "Початкові інтеграції та профілі" },
  { href: "/dashboard/actions", label: "Actions", description: "Тригери, затримки та дії" },
  { href: "/dashboard/donations", label: "Donations", description: "Чеки, донати, батли" },
  { href: "/dashboard/widgets", label: "Widgets", description: "Оверлеї та стилі" },
  { href: "/dashboard/connections", label: "Connections", description: "TikTok, Minecraft, Mono" },
  { href: "/dashboard/logs", label: "Logs", description: "Журнал системи" },
  { href: "/dashboard/settings", label: "Settings", description: "Платежі, курс, доступ" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/dashboard/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#f4ede0]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-3 py-4 md:grid-cols-[280px_1fr]">
        <aside className="dashboard-card p-4">
          <div className="mb-4 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Donatelko</p>
            <h1 className="mt-2 text-xl font-semibold">Панель стрімера</h1>
            <p className="mt-1 text-xs text-amber-50/70">Один центр для оплат, тригерів та віджетів.</p>
          </div>

          <nav className="grid gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href === "/dashboard/setup" && pathname === "/dashboard");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl border px-3 py-2 transition ${
                    active
                      ? "border-amber-200/80 bg-amber-100/10"
                      : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-[11px] text-amber-50/65">{item.description}</p>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100 transition hover:bg-red-500/25"
            disabled={loggingOut}
          >
            {loggingOut ? "Вихід..." : "Вийти з панелі"}
          </button>
        </aside>
        <section className="space-y-4">{children}</section>
      </div>
    </div>
  );
}
