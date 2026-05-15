import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Eye, EyeOff, Check } from "lucide-react";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/ai";
import { toast } from "sonner";

interface Props {
  onSave?: (key: string) => void;
  serverName?: string;
}

export const ApiKeyBar = ({ onSave, serverName }: Props = {}) => {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const k = getApiKey();
      if (k) {
        setKey(k);
        setSaved(true);
      }
    };
    handleStorage();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const save = () => {
    if (!key.startsWith("sk-or-v1-") && !key.startsWith("sk-")) {
      toast.error("That doesn't look like a valid OpenRouter key (usually starts with sk-or-v1-).");
      return;
    }
    setApiKey(key);
    setSaved(true);
    toast.success(`${serverName || 'API'} key saved locally.`);
    if (onSave) onSave(key);
  };

  const clear = () => {
    clearApiKey();
    setKey("");
    setSaved(false);
    toast.info("API key cleared.");
  };

  return (
    <div className="glass p-4 md:p-5 animate-fade-up">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium shrink-0">
          <Key className="h-4 w-4 text-primary" />
          <span>{serverName ? `${serverName} API Key` : 'OpenRouter API Key'}</span>
        </div>
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="sk-..."
            className="bg-input/60 border-border/60 backdrop-blur pr-10 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide key" : "Show key"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} variant="default" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-90">
            {saved ? <><Check className="h-4 w-4 mr-1" /> Saved</> : "Save"}
          </Button>
          {saved && (
            <Button onClick={clear} variant="ghost" className="text-muted-foreground">Clear</Button>
          )}
        </div>
      </div>
      <p className="relative z-10 text-xs text-muted-foreground mt-2">
        ⚠️ Stored only in your browser (localStorage). Frontend keys are visible to anyone using this device — for personal use only.
      </p>
    </div>
  );
};
