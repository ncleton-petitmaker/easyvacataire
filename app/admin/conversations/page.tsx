"use client";

import { useState, useEffect, useRef } from "react";
import { useEtablissementId } from "@/lib/hooks/use-etablissement";
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
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
    setLoadingMessages(true);
    fetch(`/api/conversations/${selectedId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages || []);
        setLoadingMessages(false);
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      });
    // Poll toutes les 5s
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

  const getDisplayName = (conv: Conversation) => {
    if (conv.intervenants) {
      return `${conv.intervenants.first_name} ${conv.intervenants.last_name}`;
    }
    return conv.phone;
  };

  const getInitials = (conv: Conversation) => {
    if (conv.intervenants) {
      return `${conv.intervenants.first_name[0]}${conv.intervenants.last_name[0]}`.toUpperCase();
    }
    return conv.phone.slice(-2);
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);

  const filteredConversations = conversations.filter((conv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = getDisplayName(conv).toLowerCase();
    const phone = conv.phone.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Conversations WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground">
          Consultez les échanges WhatsApp avec vos intervenants
        </p>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 200px)" }}>
        {/* Panneau gauche : liste des conversations */}
        <Card className="flex w-80 shrink-0 flex-col overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm">Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>

          <ScrollArea className="flex-1">
            {loading ? (
              /* Skeleton loading */
              <div className="space-y-1 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              /* État vide */
              <div className="flex flex-col items-center justify-center px-4 py-12">
                <MessageSquare className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? "Aucun résultat"
                    : "Aucune conversation"}
                </p>
              </div>
            ) : (
              /* Liste des conversations */
              <div className="space-y-0.5 p-1.5">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
                      selectedId === conv.id && "bg-muted"
                    )}
                  >
                    <Avatar>
                      <AvatarFallback>{getInitials(conv)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {getDisplayName(conv)}
                        </span>
                        <Badge
                          variant={
                            conv.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {conv.status === "active" ? "Actif" : conv.status}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="size-3" />
                        <span className="truncate">{conv.phone}</span>
                        <span className="mx-1">&middot;</span>
                        <span className="shrink-0">
                          {formatDate(conv.updated_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Panneau droit : fil de messages */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          {!selectedId ? (
            /* Aucune conversation sélectionnée */
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                Sélectionnez une conversation
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choisissez une conversation dans la liste pour afficher les
                messages.
              </p>
            </div>
          ) : (
            <>
              {/* En-tête de la conversation */}
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConv ? getInitials(selectedConv) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">
                      {selectedConv ? getDisplayName(selectedConv) : ""}
                    </CardTitle>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="size-3" />
                      {selectedConv?.phone}
                    </p>
                  </div>
                  {selectedConv && (
                    <Badge
                      variant={
                        selectedConv.status === "active"
                          ? "default"
                          : "secondary"
                      }
                      className="ml-auto"
                    >
                      {selectedConv.status === "active"
                        ? "Actif"
                        : selectedConv.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="space-y-3 p-4">
                  {loadingMessages ? (
                    /* Skeleton loading pour les messages */
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex",
                            i % 2 === 0 ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-end gap-2",
                              i % 2 === 0 && "flex-row-reverse"
                            )}
                          >
                            <Skeleton className="size-6 shrink-0 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton
                                className={cn(
                                  "h-12 rounded-2xl",
                                  i % 2 === 0 ? "w-48" : "w-56"
                                )}
                              />
                              <Skeleton
                                className={cn(
                                  "h-3 w-10",
                                  i % 2 === 0 ? "ml-auto" : ""
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <MessageSquare className="mb-2 size-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        Aucun message
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOutbound = msg.direction === "outbound";
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOutbound ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex max-w-[75%] items-end gap-2",
                              isOutbound && "flex-row-reverse"
                            )}
                          >
                            {/* Avatar expéditeur */}
                            <Avatar size="sm">
                              <AvatarFallback>
                                {isOutbound ? (
                                  <Bot className="size-3" />
                                ) : (
                                  <User className="size-3" />
                                )}
                              </AvatarFallback>
                            </Avatar>

                            {/* Bulle du message */}
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5",
                                isOutbound
                                  ? "rounded-br-md bg-primary text-primary-foreground"
                                  : "rounded-bl-md bg-muted"
                              )}
                            >
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {msg.content}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 text-right text-[10px]",
                                  isOutbound
                                    ? "text-primary-foreground/60"
                                    : "text-muted-foreground"
                                )}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
