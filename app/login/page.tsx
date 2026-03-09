"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mail, KeyRound, Loader2, ArrowLeft } from "lucide-react";
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

type Step = "email" | "code";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Adresse email invalide");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setStep("code");
      toast.success("Code envoyé par email");
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
        body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }

      const supabase = createSupabaseBrowser();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (data.role === "super_admin") {
        window.location.href = "/super-admin";
      } else if (data.role === "admin") {
        window.location.href = "/admin/creneaux";
      } else {
        window.location.href = "/vacataire/suivi";
      }
    } catch {
      setError("Erreur de connexion");
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
            Recevez un code de connexion par email
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline-block size-4 mr-1.5 -mt-0.5" />
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.fr"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && requestCode()}
                />
              </div>
              <Button
                onClick={requestCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="size-4 mr-2" />
                    Recevoir un code
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Un code a été envoyé à <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Vérifiez vos spams si vous ne le trouvez pas
                </p>
              </div>
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
                  autoFocus
                  onKeyDown={(e) =>
                    e.key === "Enter" && code.length === 6 && verifyOtp()
                  }
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
                  setLoading(false);
                  requestCode();
                }}
                disabled={loading}
                className="w-full"
              >
                <Mail className="size-4 mr-2" />
                Renvoyer un code
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="w-full"
              >
                <ArrowLeft className="size-4 mr-2" />
                Changer d&apos;adresse
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
