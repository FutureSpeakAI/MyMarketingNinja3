import { useState, useRef, useCallback } from 'react';

interface SimpleAudioConfig {
  voiceId?: string;
  playbackRate?: number;
}

export function useSimpleAudio(config: SimpleAudioConfig = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const playText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    console.log('🎵 Generating audio for:', text.substring(0, 50) + '...');
    setIsGenerating(true);

    try {
      // Stop any existing audio
      stopAudio();

      // Generate TTS
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: config.voiceId || 'XB0fDUnXU5powFXDhCwa'
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      console.log('🎵 Audio received, size:', audioBlob.size);

      // Create and configure audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = config.playbackRate || 1.33;
      
      audioRef.current = audio;

      // Set up event handlers
      audio.onended = () => {
        console.log('🎵 Audio finished');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (error) => {
        console.error('🎵 Audio error:', error);
        setIsPlaying(false);
        setIsGenerating(false);
        URL.revokeObjectURL(audioUrl);
      };

      // Start playback immediately when ready
      audio.oncanplaythrough = async () => {
        try {
          console.log('🎵 Starting playback');
          setIsGenerating(false);
          setIsPlaying(true);
          await audio.play();
          console.log('🎵 Playback started successfully');
        } catch (playError) {
          console.error('🎵 Playback failed:', playError);
          setIsPlaying(false);
          setIsGenerating(false);
        }
      };

      // Load the audio
      audio.load();

    } catch (error) {
      console.error('🎵 TTS generation failed:', error);
      setIsGenerating(false);
    }
  }, [config.voiceId, config.playbackRate, stopAudio]);

  return {
    isPlaying,
    isGenerating,
    playText,
    stopAudio
  };
}