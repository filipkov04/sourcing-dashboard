"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type RecorderState = "idle" | "recording" | "cancelled";

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  duration: number;
  waveformData: number[];
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  audioBlob: Blob | null;
}

/**
 * Creates a File object from a recorded audio Blob with a timestamped name.
 *
 * @param blob - The audio Blob from the recorder
 * @returns A File with name like "voice-20260301-143025.webm"
 */
export function createVoiceFile(blob: Blob): File {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
  const name = `voice-${timestamp}.webm`;
  return new File([blob], name, { type: blob.type || "audio/webm" });
}

/**
 * Hook for recording voice messages with live waveform data.
 *
 * Uses the MediaRecorder API with opus codec and AudioContext analyser
 * for real-time waveform visualisation at ~60fps.
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stateRef = useRef<RecorderState>("idle");

  // Keep stateRef in sync so callbacks can read the latest value
  stateRef.current = state;

  /** Stop all media tracks, close AudioContext, cancel animation frame */
  const cleanup = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (durationIntervalRef.current !== null) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
  }, []);

  /** Continuously read waveform data from the analyser node */
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Downsample to ~32 bars for visualisation
    const bars = 32;
    const step = Math.floor(bufferLength / bars);
    const normalized: number[] = [];

    for (let i = 0; i < bars; i++) {
      const index = i * step;
      // Convert from 0-255 (128 = silence) to 0-1 amplitude
      const value = Math.abs((dataArray[index] - 128) / 128);
      normalized.push(value);
    }

    setWaveformData(normalized);

    if (stateRef.current === "recording") {
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  }, []);

  const startRecording = useCallback(async () => {
    // Reset previous recording state
    setAudioBlob(null);
    setDuration(0);
    setWaveformData([]);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up AudioContext + Analyser for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Only create a blob if we weren't cancelled
        if (stateRef.current !== "cancelled") {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);
        }
        chunksRef.current = [];
        cleanup();
        setState("idle");
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setState("recording");

      // Start duration counter
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Start waveform animation loop
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (error) {
      cleanup();
      setState("idle");
      throw error;
    }
  }, [cleanup, updateWaveform]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      // State stays as "recording" until onstop fires, which sets it to "idle"
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    setState("cancelled");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // onstop will see "cancelled" and skip blob creation
    } else {
      cleanup();
      setState("idle");
    }

    setAudioBlob(null);
    setDuration(0);
    setWaveformData([]);
  }, [cleanup]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording: state === "recording",
    duration,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
  };
}
