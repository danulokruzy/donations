"use client";

import { useEffect, useMemo, useState } from "react";

type MediaAsset = {
  id: string;
  type: "AUDIO" | "VIDEO";
  originalName: string;
  relativePath: string;
};

type Trigger = {
  type: "amount_uah" | "tiktok_gift" | "chat_command" | "like_count" | "subscribe";
  enabled: boolean;
  amountUah?: number;
  giftName?: string;
  giftCoins?: number;
  commandText?: string;
  likeCount?: number;
  requireExactLike?: boolean;
};

type ActionItem = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  actionType: string;
  payload: string;
  fixedDelaySec: number | null;
  randomDelayMinSec: number | null;
  randomDelayMaxSec: number | null;
  cooldownSec: number;
  mediaAssetId: string | null;
  triggers: Array<{
    id: string;
    type: string;
    enabled: boolean;
    amountUah: number | null;
    giftName: string | null;
    giftCoins: number | null;
    commandText: string | null;
    likeCount: number | null;
    requireExactLike: boolean;
  }>;
};

const ACTION_TYPES = [
  { value: "minecraft_command", label: "Minecraft RCON команда" },
  { value: "keypress", label: "Натискання клавіші на ПК" },
  { value: "sound", label: "Програти звук" },
  { value: "video", label: "Програти відео" },
  { value: "webhook", label: "Webhook" },
  { value: "obs_action", label: "OBS дія" },
] as const;

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [gifts, setGifts] = useState<Array<{ giftId: string; name: string; coins: number }>>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState<string>("minecraft_command");
  const [payload, setPayload] = useState("");
  const [fixedDelaySec, setFixedDelaySec] = useState<number | "">("");
  const [randomFrom, setRandomFrom] = useState<number | "">("");
  const [randomTo, setRandomTo] = useState<number | "">("");
  const [mediaAssetId, setMediaAssetId] = useState<string>("");

  const [triggerAmount, setTriggerAmount] = useState(false);
  const [triggerGift, setTriggerGift] = useState(false);
  const [triggerCommand, setTriggerCommand] = useState(false);
  const [triggerLike, setTriggerLike] = useState(false);
  const [triggerSubscribe, setTriggerSubscribe] = useState(false);

  const [amountUah, setAmountUah] = useState<number | "">(50);
  const [giftName, setGiftName] = useState("");
  const [giftCoins, setGiftCoins] = useState<number | "">(1);
  const [commandText, setCommandText] = useState("!totem");
  const [likeCount, setLikeCount] = useState<number | "">(100);
  const [requireExactLike, setRequireExactLike] = useState(false);

  const mediaForType = useMemo(() => {
    if (actionType === "sound") return mediaAssets.filter((item) => item.type === "AUDIO");
    if (actionType === "video") return mediaAssets.filter((item) => item.type === "VIDEO");
    return mediaAssets;
  }, [actionType, mediaAssets]);

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    const [actionsRes, mediaRes, giftsRes] = await Promise.all([
      fetch("/api/actions", { cache: "no-store" }),
      fetch("/api/media", { cache: "no-store" }),
      fetch("/api/gifts/catalog", { cache: "no-store" }),
    ]);
    const [actionsJson, mediaJson, giftsJson] = await Promise.all([
      actionsRes.json(),
      mediaRes.json(),
      giftsRes.json(),
    ]);
    if (actionsJson.ok) setActions(actionsJson.data);
    if (mediaJson.ok) setMediaAssets(mediaJson.data);
    if (giftsJson.ok) setGifts(giftsJson.data);
  }

  async function uploadMedia(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Помилка завантаження.");
      return;
    }
    setMessage("Медіа завантажено.");
    await reload();
  }

  function collectTriggers(): Trigger[] {
    const result: Trigger[] = [];
    if (triggerAmount && amountUah !== "") {
      result.push({
        type: "amount_uah",
        enabled: true,
        amountUah: Number(amountUah),
      });
    }
    if (triggerGift) {
      result.push({
        type: "tiktok_gift",
        enabled: true,
        giftName: giftName.trim() || undefined,
        giftCoins: giftCoins === "" ? undefined : Number(giftCoins),
      });
    }
    if (triggerCommand && commandText.trim()) {
      result.push({
        type: "chat_command",
        enabled: true,
        commandText: commandText.trim(),
      });
    }
    if (triggerLike && likeCount !== "") {
      result.push({
        type: "like_count",
        enabled: true,
        likeCount: Number(likeCount),
        requireExactLike,
      });
    }
    if (triggerSubscribe) {
      result.push({
        type: "subscribe",
        enabled: true,
      });
    }
    return result;
  }

  async function createAction() {
    const triggers = collectTriggers();
    if (!title.trim() || !payload.trim()) {
      setMessage("Назва та payload є обов'язковими.");
      return;
    }
    if (triggers.length === 0) {
      setMessage("Увімкніть хоча б один тригер.");
      return;
    }
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        actionType,
        payload,
        fixedDelaySec: fixedDelaySec === "" ? null : Number(fixedDelaySec),
        randomDelayMinSec: randomFrom === "" ? null : Number(randomFrom),
        randomDelayMaxSec: randomTo === "" ? null : Number(randomTo),
        mediaAssetId: mediaAssetId || null,
        triggers,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося створити дію.");
      return;
    }

    setTitle("");
    setDescription("");
    setPayload("");
    setMediaAssetId("");
    setFixedDelaySec("");
    setRandomFrom("");
    setRandomTo("");
    setTriggerAmount(false);
    setTriggerGift(false);
    setTriggerCommand(false);
    setTriggerLike(false);
    setTriggerSubscribe(false);
    setMessage("Дію створено.");
    await reload();
  }

  async function toggleAction(action: ActionItem) {
    const response = await fetch(`/api/actions/${action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: !action.enabled,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося змінити стан дії.");
      return;
    }
    await reload();
  }

  async function removeAction(actionId: string) {
    const response = await fetch(`/api/actions/${actionId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося видалити дію.");
      return;
    }
    await reload();
  }

  async function deleteMedia(id: string) {
    const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Не вдалося видалити файл.");
      return;
    }
    await reload();
  }

  return (
    <main className="space-y-4">
      <section className="dashboard-card p-5">
        <h1 className="text-2xl font-semibold">Actions</h1>
        <p className="mt-1 text-sm text-amber-50/75">
          Один екран для всіх правил: сума, подарунки, команди, лайки, підписки.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Нова дія</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-amber-50/75">Назва</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-dark" />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-amber-50/75">Опис</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-dark"
                placeholder="Що саме має трапитись"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Тип результату</span>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="input-dark"
              >
                {ACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Payload / команда / URL</span>
              <input
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="input-dark"
                placeholder="say hello / !command / https://..."
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-amber-50/75">Фіксована затримка, сек</span>
              <input
                value={fixedDelaySec}
                onChange={(e) => setFixedDelaySec(e.target.value ? Number(e.target.value) : "")}
                className="input-dark"
                type="number"
                min={0}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">Від, сек</span>
                <input
                  value={randomFrom}
                  onChange={(e) => setRandomFrom(e.target.value ? Number(e.target.value) : "")}
                  className="input-dark"
                  type="number"
                  min={0}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-amber-50/75">До, сек</span>
                <input
                  value={randomTo}
                  onChange={(e) => setRandomTo(e.target.value ? Number(e.target.value) : "")}
                  className="input-dark"
                  type="number"
                  min={0}
                />
              </label>
            </div>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-amber-50/75">Прив&apos;язаний медіа-файл</span>
              <select
                value={mediaAssetId}
                onChange={(event) => setMediaAssetId(event.target.value)}
                className="input-dark"
              >
                <option value="">Без файлу</option>
                {mediaForType.map((media) => (
                  <option key={media.id} value={media.id}>
                    {media.originalName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-amber-200/80">
            Тригери
          </h3>
          <div className="mt-3 space-y-3">
            <label className="trigger-row">
              <input type="checkbox" checked={triggerAmount} onChange={(e) => setTriggerAmount(e.target.checked)} />
              <span>Сума в грн</span>
              <input
                value={amountUah}
                onChange={(e) => setAmountUah(e.target.value ? Number(e.target.value) : "")}
                type="number"
                className="input-dark max-w-[140px]"
                disabled={!triggerAmount}
              />
            </label>

            <label className="trigger-row">
              <input type="checkbox" checked={triggerGift} onChange={(e) => setTriggerGift(e.target.checked)} />
              <span>TikTok gift</span>
              <select
                value={giftName}
                onChange={(e) => {
                  const selected = gifts.find((gift) => gift.name === e.target.value);
                  setGiftName(e.target.value);
                  if (selected) setGiftCoins(selected.coins);
                }}
                className="input-dark max-w-[220px]"
                disabled={!triggerGift}
              >
                <option value="">Обери подарунок</option>
                {gifts.map((gift) => (
                  <option key={gift.giftId} value={gift.name}>
                    {gift.name} ({gift.coins})
                  </option>
                ))}
              </select>
              <input
                value={giftCoins}
                onChange={(e) => setGiftCoins(e.target.value ? Number(e.target.value) : "")}
                type="number"
                className="input-dark max-w-[120px]"
                disabled={!triggerGift}
              />
            </label>

            <label className="trigger-row">
              <input type="checkbox" checked={triggerCommand} onChange={(e) => setTriggerCommand(e.target.checked)} />
              <span>Команда чату</span>
              <input
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                className="input-dark max-w-[200px]"
                disabled={!triggerCommand}
              />
            </label>

            <div className="trigger-row">
              <input type="checkbox" checked={triggerLike} onChange={(e) => setTriggerLike(e.target.checked)} />
              <span>N лайків</span>
              <input
                value={likeCount}
                onChange={(e) => setLikeCount(e.target.value ? Number(e.target.value) : "")}
                type="number"
                className="input-dark max-w-[120px]"
                disabled={!triggerLike}
              />
              <label className="ml-2 flex items-center gap-2 text-xs text-amber-50/75">
                <input
                  type="checkbox"
                  checked={requireExactLike}
                  onChange={(e) => setRequireExactLike(e.target.checked)}
                  disabled={!triggerLike}
                />
                Точно N
              </label>
            </div>

            <label className="trigger-row">
              <input
                type="checkbox"
                checked={triggerSubscribe}
                onChange={(e) => setTriggerSubscribe(e.target.checked)}
              />
              <span>Підписка</span>
            </label>
          </div>

          {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
          <button
            type="button"
            onClick={createAction}
            disabled={saving}
            className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2b1d13] transition hover:bg-amber-300 disabled:opacity-60"
          >
            {saving ? "Створення..." : "Створити дію"}
          </button>
        </article>

        <article className="dashboard-card p-5">
          <h2 className="text-lg font-semibold">Медіа бібліотека</h2>
          <label className="mt-3 block rounded-xl border border-dashed border-white/20 bg-black/25 px-3 py-4 text-sm">
            <span className="text-amber-50/75">Завантажити звук або відео</span>
            <input
              type="file"
              accept="audio/*,video/*"
              className="mt-2 block w-full text-xs"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadMedia(file);
                  event.currentTarget.value = "";
                }
              }}
            />
          </label>

          <div className="mt-3 space-y-2">
            {mediaAssets.length === 0 ? (
              <p className="text-sm text-amber-50/70">Файлів ще немає.</p>
            ) : (
              mediaAssets.map((media) => (
                <div key={media.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-sm">{media.originalName}</p>
                  <p className="text-xs text-amber-50/70">{media.type}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <a
                      href={media.relativePath}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-white/20 px-2 py-1 text-xs"
                    >
                      Переглянути
                    </a>
                    <button
                      type="button"
                      onClick={() => deleteMedia(media.id)}
                      className="rounded border border-red-300/40 px-2 py-1 text-xs text-red-200"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Активні правила</h2>
        <div className="mt-3 space-y-3">
          {actions.length === 0 ? (
            <p className="text-sm text-amber-50/70">Поки немає дій.</p>
          ) : (
            actions.map((action) => (
              <article key={action.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{action.title}</p>
                    <p className="text-xs text-amber-50/70">{action.description || "Без опису"}</p>
                    <p className="mt-1 text-xs text-amber-50/70">
                      {action.actionType} | payload: {action.payload}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAction(action)}
                      className={`rounded-lg px-3 py-1 text-xs ${
                        action.enabled
                          ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                          : "border border-white/20 bg-white/5 text-white"
                      }`}
                    >
                      {action.enabled ? "Увімкнено" : "Вимкнено"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAction(action.id)}
                      className="rounded-lg border border-red-300/40 px-3 py-1 text-xs text-red-200"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs text-amber-100">
                  {action.triggers.map((trigger) => (
                    <li key={trigger.id} className="rounded bg-amber-100/10 px-2 py-1">
                      {trigger.type}
                      {trigger.amountUah != null ? `: ${trigger.amountUah} грн` : ""}
                      {trigger.giftName ? `: ${trigger.giftName}` : ""}
                      {trigger.commandText ? `: ${trigger.commandText}` : ""}
                      {trigger.likeCount != null ? `: ${trigger.likeCount}` : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
