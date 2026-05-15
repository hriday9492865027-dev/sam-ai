import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { callAI, SYSTEM_PROMPT } from "@/lib/ai";
import { toast } from "sonner";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface ChatBotProps {
  lessonText: string;
  topic: string;
}

export const ChatBot = ({ lessonText, topic }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: `Hi! I'm your AI study tutor. I've analyzed your lesson on **"${topic}"**. Ask me any questions or ask for clarifications!` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await callAI<string>({
        system: `${SYSTEM_PROMPT}\nYou are a friendly and encouraging AI Study Tutor. 
        Your goal is to help the student understand the lesson content provided below.
        Be concise but thorough. Use formatting like bold text or bullet points where helpful.
        
        --- LESSON CONTENT (Source of Truth) ---
        ${lessonText.slice(0, 12000)}`,
        user: `Current Topic: ${topic}\n\nStudent Question: ${userMsg}`,
      });

      setMessages(prev => [...prev, { role: "bot", content: response }]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to get response from AI");
      setMessages(prev => [...prev, { role: "bot", content: "I encountered an error. Please ensure your API key (Server) is connected and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] no-print flex flex-col items-end">
      {isOpen && (
        <div className="glass-strong mb-4 w-[90vw] sm:w-[400px] h-[500px] rounded-2xl flex flex-col shadow-2xl animate-fade-up border-primary/30 overflow-hidden">
          {/* Header */}
          <div className="bg-primary/10 p-4 border-b border-primary/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Lesson Tutor</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Active context: {topic.slice(0, 20)}...</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-primary/20">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                    {m.role === 'user' ? <User className="h-3 w-3 text-primary-foreground" /> : <Bot className="h-3 w-3 text-foreground" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-primary/20 text-foreground rounded-tr-none' 
                    : 'glass bg-secondary/30 text-foreground rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 items-center text-muted-foreground italic text-xs ml-8">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary/10 bg-black/20">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-white/5 border border-primary/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="rounded-xl bg-primary hover:bg-primary-glow text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-secondary hover:bg-secondary-foreground rotate-90 scale-90' : 'bg-primary hover:bg-primary-glow hover:scale-110'
        } group`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6 text-primary-foreground group-hover:hidden" />
            <Sparkles className="h-6 w-6 text-primary-foreground hidden group-hover:block animate-pulse" />
          </>
        )}
      </Button>
    </div>
  );
};
