"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Smartphone, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        const msg = data.error || "Erreur";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (data.test) {
        // Test mode: skip code step, verify directly
        const verifyRes = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: "000000" }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          const msg = verifyData.error || "Erreur";
          setError(msg);
          toast.error(msg);
          return;
        }
        const supabase = createSupabaseBrowser();
        await supabase.auth.setSession({
          access_token: verifyData.access_token,
          refresh_token: verifyData.refresh_token,
        });
        if (verifyData.role === "super_admin") {
          window.location.href = "/super-admin";
        } else if (verifyData.role === "admin") {
          window.location.href = "/admin/creneaux";
        } else {
          window.location.href = "/mes/creneaux";
        }
        return;
      }
      toast.success("Code envoyé sur WhatsApp");
      setStep("code");
    } catch {
      const msg = "Erreur de connexion";
      setError(msg);
      toast.error(msg);
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
        const msg = data.error || "Erreur";
        setError(msg);
        toast.error(msg);
        return;
      }

      // Set session in browser
      const supabase = createSupabaseBrowser();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Redirect based on role
      if (data.role === "super_admin") {
        window.location.href = "/super-admin";
      } else if (data.role === "admin") {
        window.location.href = "/admin/creneaux";
      } else {
        window.location.href = "/mes/creneaux";
      }
    } catch {
      const msg = "Erreur de connexion";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src="/logo.svg" alt="EasyVacataire" className="mb-2 h-8" />
          <CardTitle className="text-lg">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous avec votre numéro WhatsApp
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Smartphone className="inline-block size-4 mr-1.5 -mt-0.5" />
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33612345678"
                />
              </div>
              <Button
                onClick={requestOtp}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  "Recevoir un code sur WhatsApp"
                )}
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Un code à 6 chiffres a été envoyé sur WhatsApp au{" "}
                <strong className="text-foreground">{phone}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="code">
                  <KeyRound className="inline-block size-4 mr-1.5 -mt-0.5" />
                  Code de vérification
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              <Button
                onClick={verifyOtp}
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Vérification...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError("");
                }}
                className="w-full"
              >
                <ArrowLeft className="size-4 mr-2" />
                Changer de numéro
              </Button>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
