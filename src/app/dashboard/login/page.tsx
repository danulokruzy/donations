"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.error || "Не вдалося увійти.");
      setLoading(false);
      return;
    }
    router.replace("/dashboard/setup");
    router.refresh();
  }

  return (
    <main className="coffee-bg flex min-h-screen items-center justify-center px-4 py-10 text-[#f4ede0]">
      <form onSubmit={onSubmit} className="dashboard-card w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold">Вхід у Dashboard</h1>
        <p className="mt-2 text-sm text-amber-50/75">
          Введіть пароль адміністратора для керування платформою.
        </p>

        <label className="mt-5 block text-sm">
          <span className="mb-1 block text-amber-50/75">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 outline-none focus:border-amber-300/70"
            placeholder="••••••••"
          />
        </label>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 h-11 w-full rounded-xl bg-amber-400/90 text-[#24160d] font-semibold transition hover:bg-amber-300 disabled:opacity-60"
        >
          {loading ? "Перевірка..." : "Увійти"}
        </button>
      </form>
    </main>
  );
}
