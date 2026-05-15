import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

export const SummaryView = ({ text }: { text: string }) => {
  const [speaking, setSpeaking] = useState(false);

  const toggleSpeech = () => {
    const synth = window.speechSynthesis;

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      toast.info("Audio stopped.");
    } else {
      // Cancel everything first
      synth.cancel();

      // Some browsers require voices to be loaded
      if (synth.getVoices().length === 0) {
        toast.info("Loading voices... please try again in a second.");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Voice Selection
      const voices = synth.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                            voices.find(v => v.lang.startsWith('en')) || 
                            voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setSpeaking(true);
        toast.success("Playing audio summary...");
      };

      utterance.onend = () => {
        setSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("SpeechSynthesisUtterance error", event);
        setSpeaking(false);
        if (event.error !== 'interrupted') {
          toast.error("Speech synthesis failed. Your browser might not support this feature.");
        }
      };

      // Workaround for Chrome/Edge bug where speech stops after 15 seconds
      const heartbeat = setInterval(() => {
        if (!synth.speaking) {
          clearInterval(heartbeat);
        } else {
          synth.pause();
          synth.resume();
        }
      }, 10000);

      synth.speak(utterance);
      
      // Extra safety: resume immediately in case it's stuck
      if (synth.paused) {
        synth.resume();
      }
    }
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

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
