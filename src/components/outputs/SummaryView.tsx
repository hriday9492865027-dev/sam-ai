import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

export const SummaryView = ({ text }: { text: string }) => {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);

  useEffect(() => {
    const synth = window.speechSynthesis;
    synthRef.current = synth;

    const updateVoices = () => {
      const availableVoices = synth.getVoices().filter(v => v.lang.startsWith('en'));
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoiceURI) {
        // Default to a Google voice or the first one
        const defaultVoice = availableVoices.find(v => v.name.includes('Google')) || availableVoices[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    updateVoices();
    synth.onvoiceschanged = updateVoices;

    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const speakNextChunk = () => {
    const synth = synthRef.current;
    if (!synth || currentChunkRef.current >= chunksRef.current.length) {
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunksRef.current[currentChunkRef.current]);
    
    // Voice Selection
    const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (voice) utterance.voice = voice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      currentChunkRef.current++;
      speakNextChunk();
    };

    utterance.onerror = (event) => {
      console.error("Speech Error:", event);
      setSpeaking(false);
      if (event.error !== 'interrupted') {
        toast.error("Audio playback failed.");
      }
    };

    synth.speak(utterance);
    if (synth.paused) synth.resume();
  };

  const toggleSpeech = () => {
    const synth = synthRef.current;
    if (!synth) return;

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      toast.info("Audio stopped.");
    } else {
      synth.cancel();
      const rawChunks = text.split(/[.!?]+\s+/);
      chunksRef.current = rawChunks.filter(c => c.trim().length > 0);
      currentChunkRef.current = 0;

      if (chunksRef.current.length === 0) return;

      if (voices.length === 0) {
        toast.error("Speech voices not loaded yet.");
        return;
      }

      setSpeaking(true);
      toast.success("Starting audio narration...");
      speakNextChunk();
    }
  };

  return (
    <div className="glass-strong p-6 rounded-xl animate-fade-up border border-primary/10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="font-display text-lg font-semibold text-gradient">Detailed Summary</h3>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Voice Selector */}
          <div className="relative group flex-grow md:flex-grow-0">
            <select
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="appearance-none glass bg-black/40 border border-white/10 rounded-full px-4 py-2 pr-10 text-xs font-medium focus:outline-none focus:border-primary/50 transition-all w-full cursor-pointer"
            >
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI} className="bg-slate-900">
                  {voice.name.replace('Microsoft', '').replace('Google', '').trim()} ({voice.lang})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSpeech}
            className={`h-10 px-5 gap-2 transition-all duration-300 rounded-full ${speaking ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)] text-foreground" : "glass-hover text-muted-foreground hover:text-primary"}`}
          >
            {speaking ? (
              <>
                <VolumeX className="h-4 w-4 animate-pulse" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Listen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
};
