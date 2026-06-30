"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { applyErpnextSession } from "@/lib/erpnext/mcp-config";
import { DEFAULT_ERPNEXT_URL } from "@/lib/erpnext/constants";
import { loadErpUrlHistory, normalizeErpUrlInput, pickInitialErpUrl, rememberErpUrl } from "@/lib/erpnext/url-history";
import type { JunelStorage, SdkMcpServerConfig } from "@/lib/junel/storage/types";

type ErpnextLoginFormProps = {
  erpUrl?: string;
  email?: string;
  store: Pick<JunelStorage, "mcp" | "profile" | "erpnext">;
  onSuccess: (patch: ReturnType<typeof applyErpnextSession>) => void;
  compact?: boolean;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  user?: string;
  url?: string;
  sid?: string;
  csrfToken?: string;
  roles?: string[];
  mcpEntry?: SdkMcpServerConfig;
  verificationRequired?: boolean;
  tmpId?: string;
  verification?: { prompt?: string; method?: string; setup?: boolean };
};

const fieldClass = "nb-input font-body-md";

export function ErpnextLoginForm({ erpUrl, email, store, onSuccess, compact }: ErpnextLoginFormProps) {
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [userEmail, setUserEmail] = useState(email || "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tmpId, setTmpId] = useState<string>();
  const [verificationPrompt, setVerificationPrompt] = useState<string>();
  const [verificationMethod, setVerificationMethod] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const history = loadErpUrlHistory();
    setUrlHistory(history);
    const initial = pickInitialErpUrl(erpUrl, history) || DEFAULT_ERPNEXT_URL;
    setUrl(initial);
  }, [erpUrl]);

  const awaitingOtp = Boolean(tmpId);
  const normalizedUrl = normalizeErpUrlInput(url);
  const historySelectValue = urlHistory.includes(normalizedUrl) ? normalizedUrl : "";

  function resetVerification() {
    setTmpId(undefined);
    setOtp("");
    setVerificationPrompt(undefined);
    setVerificationMethod(undefined);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);

    try {
      const payload = awaitingOtp
        ? { url, email: userEmail, tmpId, otp }
        : { url, email: userEmail, password };

      const res = await fetch("/api/erpnext/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ApiResponse;

      if (data.verificationRequired && data.tmpId) {
        setTmpId(data.tmpId);
        setVerificationPrompt(data.verification?.prompt);
        setVerificationMethod(data.verification?.method);
        setOtp("");
        return;
      }

      if (!res.ok || !data.ok || !data.url || !data.user || !data.sid || !data.mcpEntry) {
        throw new Error(data.error || "Login failed");
      }

      onSuccess(
        applyErpnextSession(
          store,
          {
            url: data.url,
            email: userEmail,
            user: data.user,
            sid: data.sid,
            csrfToken: data.csrfToken,
            roles: data.roles,
          },
          data.mcpEntry,
        ),
      );
      setUrlHistory(rememberErpUrl(data.url));
      setPassword("");
      resetVerification();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const loginPage = `${url.replace(/\/$/, "")}/login`;
  const otpHint =
    verificationMethod === "OTP App"
      ? "Enter the 6-digit code from your authenticator app."
      : verificationMethod === "SMS"
        ? "Enter the code sent to your phone."
        : "Enter the verification code sent to your email.";

  return (
    <form onSubmit={handleSubmit} className={`flex w-full min-w-0 flex-col gap-md ${compact ? "" : "p-lg"}`}>
      {!compact ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Sign in to your Frappe site to start chatting.
          </p>
          <a
            href={loginPage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-xs text-secondary font-label-bold hover:underline shrink-0"
          >
            <Icon name="open_in_new" size={16} />
            Open ERP login
          </a>
        </div>
      ) : null}

      {!awaitingOtp ? (
        <>
          <label className="flex w-full min-w-0 flex-col gap-xs font-body-sm text-on-surface-variant">
            ERP URL
            {urlHistory.length > 0 ? (
              <select
                value={historySelectValue}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next) setUrl(next);
                }}
                className={fieldClass}
                aria-label="Recent ERP sites"
              >
                <option value="">Recent sites — pick one or type below</option>
                {urlHistory.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={fieldClass}
              placeholder="https://erp.example.com"
              list={urlHistory.length ? "junel-erp-url-list" : undefined}
              required
            />
            {urlHistory.length ? (
              <datalist id="junel-erp-url-list">
                {urlHistory.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            ) : null}
          </label>

          <label className="flex w-full min-w-0 flex-col gap-xs font-body-sm text-on-surface-variant">
            Email
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className={fieldClass}
              autoComplete="username"
              required
            />
          </label>
          <label className="flex w-full min-w-0 flex-col gap-xs font-body-sm text-on-surface-variant">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              autoComplete="current-password"
              required
            />
          </label>
        </>
      ) : (
        <div className="rounded-lg nb-border bg-primary-container/30 p-md flex flex-col gap-md nb-shadow-sm">
          <p className="font-body-sm text-body-sm text-on-surface">
            {verificationPrompt || "Verification code required."}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{otpHint}</p>
          <label className="flex flex-col gap-xs font-body-sm text-on-surface-variant">
            Verification code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
              className={fieldClass}
              placeholder="123456"
              required
              autoFocus
            />
          </label>
          <Button type="button" variant="ghost" className="self-start h-auto p-0 text-on-surface-variant" onClick={resetVerification}>
            ← Back to password
          </Button>
        </div>
      )}

      {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Signing in…" : awaitingOtp ? "Verify" : "Sign in"}
      </Button>
    </form>
  );
}
