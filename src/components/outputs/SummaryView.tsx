import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

export const SummaryView = ({ text }: { text: string }) => {
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
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
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                          voices.find(v => v.lang.startsWith('en')) || 
                          voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
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
        toast.error("Audio playback failed. Please try again.");
      }
    };

    synth.speak(utterance);
    
    // Force resume
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

      // Split text into manageable chunks (sentences or max length)
      // This prevents the 15-second cutoff bug in Chrome/Edge
      const rawChunks = text.split(/[.!?]+\s+/);
      chunksRef.current = rawChunks.filter(c => c.trim().length > 0);
      currentChunkRef.current = 0;

      if (chunksRef.current.length === 0) return;

      if (synth.getVoices().length === 0) {
        // Try once more after a tiny delay if voices aren't loaded
        setTimeout(() => {
          if (synth.getVoices().length > 0) {
            setSpeaking(true);
            speakNextChunk();
          } else {
            toast.error("Speech voices not loaded yet. Please try again in 2 seconds.");
          }
        }, 100);
      } else {
        setSpeaking(true);
        toast.success("Starting audio narration...");
        speakNextChunk();
      }
    }
  };

  return (
    <div className="glass-strong p-6 rounded-xl animate-fade-up border border-primary/10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h3 className="font-display text-lg font-semibold text-gradient">Detailed Summary</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSpeech}
          className={`h-9 px-4 gap-2 transition-all duration-300 rounded-full ${speaking ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)] text-foreground" : "glass-hover text-muted-foreground hover:text-primary"}`}
        >
          {speaking ? (
            <>
              <VolumeX className="h-4 w-4 animate-pulse" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              <span>Listen to Summary</span>
            </>
          )}
        </Button>
      </div>
      <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
};
