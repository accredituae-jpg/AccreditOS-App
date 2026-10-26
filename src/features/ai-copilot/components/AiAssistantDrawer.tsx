import { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  Send,
  X,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  Zap,
  ChevronUp,
  ChevronDown,
  Search,
  DollarSign,
  Building2,
  Users,
  MessageCircle,
  ArrowRight,
  Activity,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/authStore";
import { apiSendAiChatMessage, type AiChatMessage } from "@/lib/api/aiApi";
import { cn } from "@/lib/utils";

interface MacroCategory {
  name: string;
  icon: string;
  badge: string;
  items: string[];
}

const MACRO_CATEGORIES: MacroCategory[] = [
  {
    name: "Receivables",
    icon: "💰",
    badge: "AR",
    items: [
      "Who owes us money right now?",
      "Which clients have balance overdue past payment terms?",
      "How much has Seven Days paid us so far?",
      "What is the settlement percentage of Emirates Recruitment?",
      "Draft a WhatsApp payment reminder for our highest debtor",
    ],
  },
  {
    name: "Suppliers & AP",
    icon: "🏢",
    badge: "AP",
    items: [
      "Which supplier do we have to pay the most?",
      "How much do we need to pay to Tatweer?",
      "Show unbilled certificates owed to awarding bodies",
      "Do we have any pending bills for ICRQ or Arbrit?",
    ],
  },
  {
    name: "Payroll & HR",
    icon: "👥",
    badge: "HR",
    items: [
      "Is employee salary paid for last month?",
      "Any unreimbursed employee out-of-pocket expenses?",
      "Check payroll status for this month",
    ],
  },
  {
    name: "Cashflow & Reports",
    icon: "📊",
    badge: "BI",
    items: [
      "What is last month payment report?",
      "Summarize our monthly financial performance",
      "What is our current petty cash balance?",
    ],
  },
];

const QUICK_CHIPS = [
  "Who owes us money right now?",
  "How much to pay to Tatweer?",
  "Which supplier do we have to pay the most?",
  "Show unbilled certificates owed to awarding bodies",
  "Is employee salary paid for last month?",
  "Last month payment report",
];

// Helper to format assistant messages with bold text, bullets, and highlighted currency
function FormattedAiMessage({ content }: { content?: string }) {
  const safeContent =
    typeof content === "string" ? content : content ? String(content) : "";
  const lines = safeContent.split("\n");

  return (
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading: ### or ##
        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={idx}
              className="font-bold text-foreground text-xs uppercase tracking-wider mt-3 mb-1 text-primary/90 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {trimmed.replace(/^###\s+/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          return (
            <h3
              key={idx}
              className="font-bold text-foreground text-sm mt-3 mb-1 text-primary flex items-center gap-2"
            >
              <Activity className="w-3.5 h-3.5 text-primary" />
              {trimmed.replace(/^#+\s+/, "")}
            </h3>
          );
        }

        // Bullet point: - or * or •
        if (
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ") ||
          trimmed.startsWith("• ")
        ) {
          const bulletText = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0 ring-2 ring-violet-500/20" />
              <span
                className="flex-1 text-foreground/90 leading-normal"
                dangerouslySetInnerHTML={{
                  __html: formatInlineMarkdown(bulletText),
                }}
              />
            </div>
          );
        }

        // Numbered list: 1.
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 ml-1 font-medium text-foreground/90"
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: formatInlineMarkdown(trimmed),
                }}
              />
            </div>
          );
        }

        // Standard line
        return (
          <p
            key={idx}
            className="text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
          />
        );
      })}
    </div>
  );
}

// Convert **bold**, `code`, and highlight AED amounts
function formatInlineMarkdown(text: string): string {
  return text
    .replace(
      /\b(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\s*AED)\b/g,
      '<span class="inline-flex items-center px-1.5 py-0.5 rounded font-mono font-bold text-[11px] bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 mx-0.5">$1</span>',
    )
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong class='font-bold text-foreground'>$1</strong>",
    )
    .replace(
      /`([^`]+)`/g,
      "<code class='px-1.5 py-0.5 rounded bg-muted/70 font-mono text-[11px] text-foreground font-semibold border border-border/40'>$1</code>",
    );
}

export function AiAssistantDrawer() {
  const { activeRole, userEmail } = useAuthStore();

  // STRICT DEVELOPER ONLY ACCESS
  const isDeveloper =
    activeRole === "super_admin" ||
    (userEmail && userEmail.toLowerCase().includes("dev"));

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedWhatsAppIndex, setCopiedWhatsAppIndex] = useState<number | null>(
    null,
  );

  const [showMacros, setShowMacros] = useState(false);
  const [macroSearch, setMacroSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const allMacros = useMemo(
    () =>
      MACRO_CATEGORIES.flatMap((c) =>
        c.items.map((prompt) => ({
          category: c.name,
          icon: c.icon,
          badge: c.badge,
          prompt,
        })),
      ),
    [],
  );

  const filteredMacros = useMemo(() => {
    let list = allMacros;
    if (selectedCategory !== "All") {
      list = list.filter((m) => m.category === selectedCategory);
    }
    if (macroSearch.trim()) {
      const q = macroSearch.toLowerCase();
      list = list.filter((m) => m.prompt.toLowerCase().includes(q));
    }
    return list;
  }, [allMacros, selectedCategory, macroSearch]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isDeveloper) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: AiChatMessage = { role: "user", content: text };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiSendAiChatMessage(newHistory);
      const reply =
        response.data?.reply ||
        (response as any).reply ||
        "No response received from AI assistant.";
      setMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch (err: any) {
      let errorMsg =
        err.message ||
        "Failed to fetch response. Please ensure GEMINI_API_KEY is configured on the backend.";
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {}

      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: `⚠️ **AI Copilot Notice**: ${errorMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyWhatsApp = (text: string, index: number) => {
    // Strip markdown formatting symbols for clean WhatsApp delivery
    const cleanText = text
      .replace(/###\s+/g, "")
      .replace(/##\s+/g, "")
      .replace(/\*\*/g, "*") // Convert markdown bold to WhatsApp bold
      .trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedWhatsAppIndex(index);
    setTimeout(() => setCopiedWhatsAppIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* 1. Floating Sparkle Button (Developer Only) */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "relative flex items-center gap-2.5 px-3 py-3 rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-r from-violet-600 via-indigo-600 to-primary text-white",
            "hover:scale-105 hover:shadow-primary/30 active:scale-95",
            "border border-white/20 backdrop-blur-md cursor-pointer",
          )}
          title="AccreditOS AI Assistant (Developer Only)"
        >
          {/* Subtle glowing ring aura */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur-xs opacity-75 group-hover:opacity-100 transition duration-300" />

          <div className="relative flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            </div>
            <span className="hidden sm:block text-xs font-bold tracking-tight text-white drop-shadow-xs">
              AI Copilot
            </span>
            {/* <Badge
              variant="secondary"
              className="text-[9px] font-bold bg-white/20 hover:bg-white/30 text-white px-1.5 py-0 border-none uppercase tracking-wider backdrop-blur-xs"
            >
              Dev
            </Badge> */}
          </div>
        </button>
      </div>

      {/* 2. Slide-over Sheet Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className={cn(
            "p-0 flex flex-col justify-between border-l border-border/80 bg-background/98 backdrop-blur-xl transition-all duration-300 [&>button]:hidden shadow-2xl",
            isExpanded
              ? "w-full sm:max-w-3xl"
              : "w-full sm:max-w-lg md:max-w-xl",
          )}
        >
          {/* Header */}
          <SheetHeader className="p-3 sm:p-3.5 px-3.5 sm:px-4 border-b border-border/60 bg-muted/30 backdrop-blur-md flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-primary text-white flex items-center justify-center shadow-md border border-white/20">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                {/* Live Surveillance Indicator Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-background" />
                </span>
              </div>

              <div className="min-w-0">
                <SheetTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground tracking-tight whitespace-nowrap">
                  <span>AccreditOS Copilot</span>
                  <Badge
                    variant="outline"
                    className="hidden sm:inline-flex text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-1.5 py-0 whitespace-nowrap"
                  >
                    Live DB Surveillance
                  </Badge>
                </SheetTitle>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
                  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span className="hidden sm:inline">Google Gemini AI</span>
                  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span className="hidden sm:inline font-mono text-muted-foreground">Prisma Live</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="hidden sm:flex h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title={isExpanded ? "Standard width" : "Expand drawer"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Chat Messages Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="py-6 px-1 space-y-5 animate-in fade-in duration-300">
                {/* Welcome Card */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-violet-500/10 via-primary/5 to-emerald-500/10 p-4 sm:p-5 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                        Financial & Payroll Executive Copilot
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Message here...
                      </p>
                    </div>
                  </div>

                  {/* 3 Interactive Quick Surveillance Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage("Who owes us money right now?")
                      }
                      className="text-left p-2.5 rounded-xl border border-border/60 bg-background/60 hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-primary mb-1">
                        <DollarSign className="w-4 h-4" />
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="font-bold text-xs text-foreground">
                        Receivables
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        Top debtors & overdue terms
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          "How much do we need to pay to Tatweer?",
                        )
                      }
                      className="text-left p-2.5 rounded-xl border border-border/60 bg-background/60 hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-violet-600 dark:text-violet-400 mb-1">
                        <Building2 className="w-4 h-4" />
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="font-bold text-xs text-foreground">
                        Suppliers & AP
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        Tatweer & unbilled stamps
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          "Is employee salary paid for last month?",
                        )
                      }
                      className="text-left p-2.5 rounded-xl border border-border/60 bg-background/60 hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                        <Users className="w-4 h-4" />
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="font-bold text-xs text-foreground">
                        Payroll & HR
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        Salary status & expenses
                      </div>
                    </button>
                  </div>
                </div>

                {/* Suggested Starters */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
                    <HelpCircle className="w-3.5 h-3.5 text-primary" />
                    Recommended Surveillance Queries:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUICK_CHIPS.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left text-xs p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/60 hover:border-primary/40 text-foreground transition-all duration-150 flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                          <span className="truncate font-medium">{prompt}</span>
                        </div>
                        <Send className="w-3 h-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-opacity shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isPaymentDraft =
                  !isUser &&
                  (msg.content.includes("WhatsApp") ||
                    msg.content.includes("Dear ") ||
                    msg.content.includes("reminder") ||
                    msg.content.includes("TRN:"));

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2.5 items-start animate-in fade-in slide-in-from-bottom-1 duration-200",
                      isUser ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl p-3.5 max-w-[88%] relative group shadow-sm transition-all",
                        isUser
                          ? "bg-gradient-to-r from-violet-600 to-primary text-primary-foreground rounded-tr-none font-medium text-xs sm:text-[13px] shadow-primary/10"
                          : "bg-card/90 dark:bg-card/50 border border-border/70 rounded-tl-none text-foreground backdrop-blur-xs",
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div>
                          <FormattedAiMessage content={msg.content} />

                          {/* Footer Action Bar */}
                          <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-semibold text-primary/80 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              AccreditOS Live
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Dedicated WhatsApp Quick Copy if draft is detected */}
                              {isPaymentDraft && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyWhatsApp(msg.content, index)
                                  }
                                  className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 transition-colors border border-emerald-500/30 cursor-pointer"
                                  title="Copy clean WhatsApp reminder text"
                                >
                                  {copiedWhatsAppIndex === index ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span>Copied WhatsApp</span>
                                    </>
                                  ) : (
                                    <>
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp Copy</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Standard Copy */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyMessage(msg.content, index)
                                }
                                className="px-1.5 py-0.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Copy response text"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Premium Shimmering Loading State */}
            {isLoading && (
              <div className="flex gap-2.5 items-start justify-start animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none p-3.5 bg-card/90 border border-border/70 text-muted-foreground flex items-center gap-3 text-xs shadow-xs">
                  <div className="flex gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-violet-600 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="font-semibold text-foreground tracking-tight">
                    Querying AccreditOS live financial records...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input & Permanent Macros Bar */}
          <div className="p-3 border-t border-border/60 bg-muted/20 backdrop-blur-md space-y-2">
            {/* Pop-up Macro Selector (shown when showMacros is true) */}
            {showMacros && (
              <div className="rounded-2xl border border-border/80 bg-card/98 backdrop-blur-xl p-3 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Financial Surveillance Macros</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 font-mono font-bold"
                    >
                      {filteredMacros.length}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMacros(false)}
                    className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground text-xs cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick 1-tap chips inside macro palette */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-0.5">
                    Quick:
                  </span>
                  {QUICK_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setShowMacros(false);
                        handleSendMessage(chip);
                      }}
                      className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/50 text-foreground transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Macro Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={macroSearch}
                    onChange={(e) => setMacroSearch(e.target.value)}
                    placeholder="Search financial questions..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border/60 bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Category filter pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {["All", ...MACRO_CATEGORIES.map((c) => c.name)].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer",
                          selectedCategory === cat
                            ? "bg-primary text-primary-foreground shadow-xs scale-102"
                            : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {cat}
                      </button>
                    ),
                  )}
                </div>

                {/* Scrollable Macro questions list */}
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {filteredMacros.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No matching macro questions found.
                    </div>
                  ) : (
                    filteredMacros.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          setShowMacros(false);
                          handleSendMessage(item.prompt);
                        }}
                        className="w-full text-left text-xs p-2 rounded-xl border border-border/40 bg-muted/20 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{item.icon}</span>
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {item.prompt}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 h-4 font-mono font-semibold"
                          >
                            {item.badge}
                          </Badge>
                          <Send className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Unified Modern Executive Input Dock */}
            <div className="relative rounded-2xl border border-border/80 bg-card/95 dark:bg-card/70 backdrop-blur-md shadow-md transition-all focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20 p-1.5 flex items-end gap-1.5 sm:gap-2">
              {/* Left Side: Macros Button */}
              <button
                type="button"
                onClick={() => setShowMacros(!showMacros)}
                className={cn(
                  "h-9 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border select-none mb-0.5",
                  showMacros
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/70 hover:bg-muted text-foreground border-border/70 hover:border-primary/50 active:scale-95",
                )}
                title="Browse categorized question macros"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                {/* <span className="hidden xs:inline sm:inline text-[11px] font-bold">
                  Macros
                </span> */}
                {/* <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/60 font-mono font-bold">
                  {allMacros.length}
                </span> */}
                {showMacros ? (
                  <ChevronDown className="w-3 h-3 opacity-70" />
                ) : (
                  <ChevronUp className="w-3 h-3 opacity-70" />
                )}
              </button>

              {/* Center: Clean Textarea */}
              <Textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask here..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none text-xs sm:text-[13px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[38px] max-h-[110px] py-2 px-1.5 sm:px-2 text-foreground placeholder:text-muted-foreground/70 leading-relaxed"
              />

              {/* Right Side: Clean Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md mb-0.5",
                  inputMessage.trim() && !isLoading
                    ? "bg-gradient-to-tr from-violet-600 via-indigo-600 to-primary text-white hover:scale-105 active:scale-95 shadow-primary/25"
                    : "bg-muted/40 text-muted-foreground/40 border border-border/40 cursor-not-allowed opacity-50",
                )}
                title="Send question (Enter ↵)"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Financial Intelligence
              </span>
              <span>Press Enter ↵ to send</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default AiAssistantDrawer;
