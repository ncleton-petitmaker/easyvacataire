"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Step = "phone" | "code" | "done";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+33");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setStep("code");
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }

      // Set session in browser
      const supabase = createSupabaseBrowser();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Redirect based on role
      if (data.role === "admin") {
        window.location.href = "/admin/creneaux";
      } else {
        window.location.href = "/mes/creneaux";
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div className="mb-2">
          <img src="/logo.svg" alt="EasyVacataire" className="h-7" />
        </div>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          Connectez-vous avec votre numéro WhatsApp
        </p>

        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Numéro de téléphone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33612345678"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button
              onClick={requestOtp}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Recevoir un code sur WhatsApp"}
            </button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Un code à 6 chiffres a été envoyé sur WhatsApp au{" "}
              <strong>{phone}</strong>
            </p>
            <div>
              <label
                htmlFor="code"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Code de vérification
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-2xl font-mono tracking-widest text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button
              onClick={verifyOtp}
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Se connecter"}
            </button>
            <button
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Changer de numéro
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
