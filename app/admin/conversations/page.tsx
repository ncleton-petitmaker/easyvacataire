"use client";

import { useState, useEffect, useRef } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";

interface Conversation {
  id: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
  intervenants?: {
    first_name: string;
    last_name: string;
  };
}

interface Message {
  id: string;
  direction: string;
  content: string;
  created_at: string;
}

export default function ConversationsPage() {
  const [etablissementId] = useEtablissementId();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!etablissementId) return;
    fetch(`/api/conversations?etablissement_id=${etablissementId}`)
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [etablissementId]);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/conversations/${selectedId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages || []);
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      });
    // Poll every 5s
    const interval = setInterval(() => {
      fetch(`/api/conversations/${selectedId}/messages`)
        .then((r) => r.json())
        .then((data) => setMessages(data.messages || []));
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Conversations WhatsApp
      </h1>

      <div className="flex gap-4" style={{ height: "calc(100vh - 200px)" }}>
        {/* Conversation list */}
        <div className="w-80 shrink-0 overflow-y-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          {loading ? (
            <div className="p-4 text-center text-zinc-500">Chargement...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">
              Aucune conversation
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full border-b border-zinc-100 p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700 ${
                  selectedId === conv.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {conv.intervenants
                      ? `${conv.intervenants.first_name} ${conv.intervenants.last_name}`
                      : conv.phone}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      conv.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {conv.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {conv.phone} - {formatDate(conv.updated_at)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Messages panel */}
        <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center text-zinc-400">
              Sélectionnez une conversation
            </div>
          ) : (
            <>
              <div className="border-b border-zinc-200 p-4 dark:border-zinc-700">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {conversations.find((c) => c.id === selectedId)
                    ?.intervenants
                    ? `${conversations.find((c) => c.id === selectedId)!.intervenants!.first_name} ${conversations.find((c) => c.id === selectedId)!.intervenants!.last_name}`
                    : conversations.find((c) => c.id === selectedId)?.phone}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        msg.direction === "outbound"
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">
                        {msg.content}
                      </p>
                      <p
                        className={`mt-1 text-right text-xs ${
                          msg.direction === "outbound"
                            ? "text-indigo-200"
                            : "text-zinc-400"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
