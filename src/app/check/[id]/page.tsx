"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type CheckData = {
  id: string;
  code: string;
  channel: "UAH" | "CRYPTOBOT" | "TONPAY";
  donorName: string;
  message: string;
  youtubeUrl: string | null;
  voiceUrl: string | null;
  amountOriginal: number;
  amountLabel: string;
  amountUah: number;
  payUrl: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
  expiresAt: string;
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function channelLabel(channel: CheckData["channel"]) {
  if (channel === "UAH") return "UAH";
  if (channel === "CRYPTOBOT") return "CryptoBOT";
  return "TonPay";
}

type VerifyResponse = {
  ok: boolean;
  status: "paid" | "pending" | "anonymous" | "already_processed" | "not_found";
};

export default function CheckPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [check, setCheck] = useState<CheckData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [infoMessage, setInfoMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const loadCheck = useCallback(async () => {
    const response = await fetch(`/api/checks/${params.id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setIsError(true);
      setInfoMessage(data.error || "Чек не знайдено.");
      return;
    }
    setCheck(data.data);
  }, [params.id]);

  useEffect(() => {
    void loadCheck();
  }, [loadCheck]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!check) return "00:00";
    return formatRemaining(new Date(check.expiresAt).getTime() - now);
  }, [check, now]);

  const showButtons = check?.status === "PENDING";

  async function verifyCheck(options?: { allowAnonymousOnFail?: boolean }) {
    if (!check) return;
    setProcessing(true);
    setIsError(false);
    setInfoMessage("");

    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkId: check.id,
        channel: check.channel.toLowerCase(),
        allowAnonymousOnFail: Boolean(options?.allowAnonymousOnFail),
        verifyOnly: !options?.allowAnonymousOnFail,
      }),
    });

    const data = await response.json();
    setProcessing(false);

    if (!response.ok || !data.ok) {
      setIsError(true);
      setInfoMessage(data.error || "Не вдалося перевірити оплату.");
      return;
    }

    const result = data.data as VerifyResponse;
    if (result.status === "paid" || result.status === "already_processed") {
      setIsError(false);
      setInfoMessage("Оплату підтверджено.");
    } else if (result.status === "anonymous") {
      setIsError(false);
      setInfoMessage("Донат зараховано як анонімний.");
    } else {
      setIsError(false);
      setInfoMessage("Оплату ще не знайдено. Спробуйте трохи пізніше.");
    }

    await loadCheck();
  }

  async function cancelCheckAndBack() {
    if (!check) return;
    if (check.status !== "PENDING") {
      router.push("/");
      return;
    }

    setProcessing(true);
    const response = await fetch(`/api/checks/${check.id}/cancel`, { method: "POST" });
    const data = await response.json();
    setProcessing(false);

    if (!response.ok || !data.ok) {
      setIsError(true);
      setInfoMessage(data.error || "Не вдалося скасувати чек.");
      return;
    }

    router.push("/");
  }

  return (
    <main className="coffee-bg min-h-screen px-3 py-4 text-[#f4ede0] sm:px-4">
      <div className="mx-auto max-w-3xl">
        <div className="dashboard-card p-5">
          <h1 className="text-2xl font-semibold">Очікування оплати</h1>
          <p className="mt-1 text-sm text-amber-50/75">
            Чек діє 10 хвилин. Після оплати натисни «Перевірити».
          </p>
        </div>

        <section className="dashboard-card mt-4 p-5">
          {!check ? (
            <p className="text-sm text-amber-50/75">{infoMessage || "Завантаження..."}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs text-amber-50/70">Ім&apos;я</p>
                  <p className="mt-1">{check.donorName}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs text-amber-50/70">Код чека</p>
                  <p className="mt-1">{check.code}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs text-amber-50/70">Канал</p>
                  <p className="mt-1">{channelLabel(check.channel)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs text-amber-50/70">Сума</p>
                  <p className="mt-1">{check.amountLabel}</p>
                  {check.channel !== "UAH" ? (
                    <p className="text-xs text-amber-50/70">≈ {check.amountUah.toFixed(2)} грн</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-amber-50/70">Повідомлення</p>
                <p className="mt-1">{check.message || "Без повідомлення"}</p>
                {check.youtubeUrl ? (
                  <p className="mt-2 text-xs text-amber-50/80">YouTube: {check.youtubeUrl}</p>
                ) : null}
                {check.voiceUrl ? (
                  <p className="mt-1 text-xs text-amber-50/80">Голос: {check.voiceUrl}</p>
                ) : null}
              </div>

              <div className="mt-4 rounded-xl border border-amber-200/30 bg-amber-100/10 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">Час на оплату</p>
                <p className="mt-2 text-5xl font-bold">{remaining}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={showButtons ? check.payUrl : "#"}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    if (!showButtons) event.preventDefault();
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm ${
                    showButtons
                      ? "border-white/20 hover:bg-white/10"
                      : "pointer-events-none border-white/10 opacity-60"
                  }`}
                >
                  Оплатити
                </a>
                <button
                  type="button"
                  onClick={() => verifyCheck()}
                  disabled={processing || !showButtons}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Перевірити
                </button>
                {check.channel === "UAH" ? (
                  <button
                    type="button"
                    onClick={() => verifyCheck({ allowAnonymousOnFail: true })}
                    disabled={processing || !showButtons}
                    className="rounded-xl border border-amber-300/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-100/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Відправити анонімно
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={cancelCheckAndBack}
                  disabled={processing}
                  className="rounded-xl border border-red-300/40 px-4 py-2 text-sm text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Скасувати чек (назад)
                </button>
              </div>

              <p className="mt-3 text-sm text-amber-50/75">Статус: {check.status}</p>
              {infoMessage ? (
                <p className={`mt-2 text-sm ${isError ? "text-red-300" : "text-emerald-300"}`}>
                  {infoMessage}
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
