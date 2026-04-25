"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Channel = "uah" | "cryptobot" | "tonpay";

const CHANNELS: Array<{ id: Channel; label: string; hint: string }> = [
  { id: "uah", label: "UAH", hint: "Monobank jar" },
  { id: "cryptobot", label: "CryptoBOT", hint: "USDT чек" },
  { id: "tonpay", label: "TonPay", hint: "TON чек" },
];

export default function HomePage() {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("uah");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [recording, setRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const startedAtRef = useRef<number>(0);

  const amountLabel = useMemo(() => {
    if (channel === "uah") return "грн";
    if (channel === "cryptobot") return "USDT";
    return "TON";
  }, [channel]);

  async function startRecord() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.onstop = () => {
        setVoiceSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Немає доступу до мікрофона.");
    }
  }

  function stopRecord() {
    if (!recorderRef.current || !recording) return;
    recorderRef.current.stop();
    setRecording(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Вкажіть ім'я.");
      return;
    }
    if (!accepted) {
      setError("Підтвердіть правила донатів.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Вкажіть коректну суму.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorName: name.trim(),
        message: message.trim(),
        youtubeUrl: youtubeUrl.trim() || undefined,
        voiceUrl: voiceSeconds > 0 ? `voice:${voiceSeconds}s` : undefined,
        amount,
        channel,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.error || "Не вдалося створити чек.");
      return;
    }
    router.push(`/check/${data.data.id}`);
  }

  return (
    <main className="coffee-bg min-h-screen text-[#f4ede0]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-4 sm:px-4">
        <header className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/coffee_icon.png" alt="logo" className="h-7 w-7" width={28} height={28} />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">Donatelko</span>
          </Link>
          <Link
            href="/dashboard/login"
            className="rounded-xl border border-white/20 px-3 py-1 text-xs text-amber-50/85 hover:bg-white/10"
          >
            Dashboard
          </Link>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="dashboard-card p-5">
            <h1 className="text-2xl font-semibold">Підтримати стрім</h1>
            <p className="mt-1 text-sm text-amber-50/75">
              Обери тип донату, введи суму і після кнопки отримаєш чек на 10 хвилин.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {CHANNELS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setChannel(item.id)}
                  className={`rounded-xl border px-2 py-2 text-left transition ${
                    channel === item.id
                      ? "border-amber-200/80 bg-amber-100/10"
                      : "border-white/10 bg-black/20 hover:border-white/30"
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-[11px] text-amber-50/70">{item.hint}</p>
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-amber-50/75">Ім&apos;я</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-dark" />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-amber-50/75">Сума</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="input-dark"
                  />
                  <div className="inline-flex min-w-[84px] items-center justify-center rounded-xl border border-white/15 bg-black/20 px-3 text-sm">
                    {amountLabel}
                  </div>
                </div>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[20, 50, 100, 200].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick)}
                    className="rounded-lg border border-white/20 bg-black/20 px-2 py-1 text-sm hover:bg-white/10"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-amber-50/75">Повідомлення</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-24 w-full rounded-xl border border-white/15 bg-black/25 p-3 outline-none focus:border-amber-300/70"
                  maxLength={500}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-amber-50/75">YouTube посилання (опц.)</span>
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="input-dark"
                  placeholder="https://youtube.com/..."
                />
              </label>

              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-sm">Запис голосу</p>
                <div className="mt-2 flex items-center gap-2">
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecord}
                      className="rounded-lg border border-amber-300/45 px-3 py-1 text-xs text-amber-100"
                    >
                      Почати
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecord}
                      className="rounded-lg border border-red-300/45 px-3 py-1 text-xs text-red-100"
                    >
                      Зупинити
                    </button>
                  )}
                  {voiceSeconds > 0 ? (
                    <span className="text-xs text-amber-50/75">Запис: {voiceSeconds} сек.</span>
                  ) : (
                    <span className="text-xs text-amber-50/65">Можна додати до чека</span>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-amber-50/75">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                Я приймаю правила і розумію, що чек дійсний 10 хвилин.
              </label>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-amber-400 px-4 text-base font-semibold text-[#2d1d13] transition hover:bg-amber-300 disabled:opacity-60"
              >
                {loading ? "Створення чека..." : "Надіслати"}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <article className="dashboard-card p-5">
              <h2 className="text-lg font-semibold">Як це працює</h2>
              <ol className="mt-3 space-y-2 text-sm text-amber-50/80">
                <li>1. Заповнюєш форму та обираєш тип оплати.</li>
                <li>2. Отримуєш чек з таймером на 10 хвилин.</li>
                <li>3. Оплачуєш і підтверджуєш оплату на сторінці чека.</li>
                <li>4. Якщо сума підходить під дію, вона виконається автоматично.</li>
              </ol>
            </article>
            <article className="dashboard-card p-5">
              <h2 className="text-lg font-semibold">Підказка</h2>
              <p className="mt-2 text-sm text-amber-50/75">
                Для UAH краще лишати коментар із кодом чека. Якщо коментару немає, донат все одно
                запишеться, але може пройти як анонімний без тригеру.
              </p>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
