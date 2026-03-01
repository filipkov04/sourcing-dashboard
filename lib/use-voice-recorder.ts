"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type RecorderState = "idle" | "recording" | "cancelled";

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  duration: number;
  /** Rolling waveform bars (0-1 amplitude), newest at end */
  waveformData: number[];
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  audioBlob: Blob | null;
}

/**
 * Creates a File object from a recorded audio Blob with a timestamped name.
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

const MAX_BARS = 48;

/**
 * Hook for recording voice messages with live waveform data.
 *
 * Uses MediaRecorder + AudioContext AnalyserNode with frequency data
 * for a scrolling waveform visualisation.
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
  const barsRef = useRef<number[]>([]);
  const lastBarTimeRef = useRef(0);

  stateRef.current = state;

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

  /** Read frequency data, push a new bar every ~60ms for a scrolling waveform */
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || stateRef.current !== "recording") return;

    const now = performance.now();
    // Add a new bar roughly every 60ms
    if (now - lastBarTimeRef.current > 60) {
      lastBarTimeRef.current = now;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Average the low-mid frequencies (voice range ~85-1000Hz)
      // With fftSize=256 and sampleRate=48000, each bin ≈ 187Hz
      // Bins 0-5 cover roughly 0-1000Hz
      const voiceBins = Math.min(8, bufferLength);
      let sum = 0;
      for (let i = 0; i < voiceBins; i++) {
        sum += dataArray[i];
      }
      const avg = sum / voiceBins / 255; // 0-1

      // Boost so quiet speech is still visible
      const boosted = Math.min(1, avg * 2.5);

      barsRef.current.push(boosted);
      if (barsRef.current.length > MAX_BARS) {
        barsRef.current = barsRef.current.slice(-MAX_BARS);
      }

      setWaveformData([...barsRef.current]);
    }

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startRecording = useCallback(async () => {
    setAudioBlob(null);
    setDuration(0);
    setWaveformData([]);
    barsRef.current = [];
    lastBarTimeRef.current = 0;
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // AudioContext + Analyser for live waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
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
        if (stateRef.current !== "cancelled") {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);
        }
        chunksRef.current = [];
        cleanup();
        setState("idle");
      };

      mediaRecorder.start();
      setState("recording");

      // Duration counter
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Start waveform loop
      lastBarTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (err) {
      cleanup();
      setState("idle");
      throw err;
    }
  }, [cleanup, updateWaveform]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    setState("cancelled");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
      setState("idle");
    }

    setAudioBlob(null);
    setDuration(0);
    setWaveformData([]);
    barsRef.current = [];
  }, [cleanup]);

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
