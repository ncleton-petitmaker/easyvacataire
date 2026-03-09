"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Smartphone, KeyRound, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
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

const WHATSAPP_NUMBER = "33768912695";

type Step = "phone" | "code";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+33");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function sendCodeViaWhatsApp() {
    setError("");
    if (!phone || !/^\+\d{8,15}$/.test(phone)) {
      setError("Numéro de téléphone invalide");
      return;
    }
    // Ouvre WhatsApp avec "Code" pré-rempli — le webhook répond automatiquement avec l'OTP
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Code")}`;
    window.open(waLink, "_blank");
    // Affiche directement le champ de saisie du code
    setStep("code");
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
                onClick={sendCodeViaWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="size-4 mr-2" />
                Recevoir un code sur WhatsApp
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-center space-y-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Envoyez <strong>&laquo; Code &raquo;</strong> dans la conversation WhatsApp qui vient de s&apos;ouvrir
                </p>
                <p className="text-xs text-muted-foreground">
                  Vous recevrez votre code de connexion en retour
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
                onClick={sendCodeViaWhatsApp}
                className="w-full text-green-700"
              >
                <MessageCircle className="size-4 mr-2" />
                Renvoyer un code
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
