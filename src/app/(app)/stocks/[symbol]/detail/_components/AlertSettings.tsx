"use client";

import { useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import {
  AlertSettings as AlertSettingsType,
  getErrorMessage,
  updateAlertSettings,
  UnauthorizedError,
} from "@/lib/api";

const EMPTY_ALERT: AlertSettingsType = {
  alertEnabled: false,
  targetPriceAbove: null,
  targetPriceBelow: null,
  changeRateThresholdAbove: null,
  changeRateThresholdBelow: null,
};

function hasCondition(s: AlertSettingsType): boolean {
  return (
    s.targetPriceAbove != null ||
    s.targetPriceBelow != null ||
    s.changeRateThresholdAbove != null ||
    s.changeRateThresholdBelow != null
  );
}

function describeAlert(s: AlertSettingsType): string {
  if (s.targetPriceAbove != null) return `현재가 ${s.targetPriceAbove.toLocaleString("ko-KR")}원 이상 도달 시 알림`;
  if (s.targetPriceBelow != null) return `현재가 ${s.targetPriceBelow.toLocaleString("ko-KR")}원 이하 도달 시 알림`;
  if (s.changeRateThresholdAbove != null) return `등락률 +${s.changeRateThresholdAbove}% 이상 도달 시 알림`;
  if (s.changeRateThresholdBelow != null) return `등락률 -${s.changeRateThresholdBelow}% 이하 도달 시 알림`;
  return "";
}

type Props = {
  symbol: string;
  initialSettings: AlertSettingsType | null;
  initialLoadError: string | null;
};

export function AlertSettings({ symbol, initialSettings, initialLoadError }: Props) {
  useRequireAuth();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AlertSettingsType | null>(initialSettings);

  if (!settings) {
    return <p className="text-sm text-muted">{initialLoadError ?? "관심종목에 먼저 추가해주세요."}</p>;
  }

  const active = hasCondition(settings);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold shrink-0">가격 알림</h2>
          {active && <span className="text-xs text-accent truncate">{describeAlert(settings)}</span>}
        </div>
        <span className="text-muted text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
          {active ? (
            <ActiveAlert symbol={symbol} settings={settings} onDeleted={() => setSettings(EMPTY_ALERT)} />
          ) : (
            <CreateAlertForm symbol={symbol} onSaved={(s) => setSettings(s)} />
          )}
        </div>
      )}
    </div>
  );
}

function ActiveAlert({
  symbol,
  settings,
  onDeleted,
}: {
  symbol: string;
  settings: AlertSettingsType;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await updateAlertSettings(symbol, EMPTY_ALERT);
      onDeleted();
    } catch (err) {
      if (!(err instanceof UnauthorizedError)) setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
        <p className="text-sm">{describeAlert(settings)}</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted hover:text-up transition-colors disabled:opacity-50"
        >
          ✕
        </button>
      </div>
      {error && <p className="text-sm text-up">{error}</p>}
    </>
  );
}

function CreateAlertForm({ symbol, onSaved }: { symbol: string; onSaved: (s: AlertSettingsType) => void }) {
  const [type, setType] = useState<"price" | "rate">("price");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!value) return;
    setError(null);
    setSaving(true);
    const numValue = Number(value);
    const next: AlertSettingsType = {
      alertEnabled: true,
      targetPriceAbove: type === "price" && direction === "above" ? numValue : null,
      targetPriceBelow: type === "price" && direction === "below" ? numValue : null,
      changeRateThresholdAbove: type === "rate" && direction === "above" ? numValue : null,
      changeRateThresholdBelow: type === "rate" && direction === "below" ? numValue : null,
    };
    try {
      await updateAlertSettings(symbol, next);
      onSaved(next);
    } catch (err) {
      if (!(err instanceof UnauthorizedError)) setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="alert-type" checked={type === "price"} onChange={() => setType("price")} />
          가격
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="alert-type" checked={type === "rate"} onChange={() => setType("rate")} />
          등락률
        </label>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="alert-direction"
            checked={direction === "above"}
            onChange={() => setDirection("above")}
          />
          이상
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="alert-direction"
            checked={direction === "below"}
            onChange={() => setDirection("below")}
          />
          이하
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          step={type === "rate" ? "0.1" : "1"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === "price" ? "가격(원)" : "등락률(%)"}
          className="flex-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving || !value}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-50"
        >
          저장
        </button>
      </div>

      {error && <p className="text-sm text-up">{error}</p>}
    </>
  );
}
