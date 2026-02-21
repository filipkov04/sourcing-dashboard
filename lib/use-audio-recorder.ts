"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  analyserNode: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<File>;
  cancelRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const resolveStopRef = useRef<((file: File) => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    audioContextRef.current = null;
    mediaRecorderRef.current = null;
    setAnalyserNode(null);
    setDuration(0);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (mediaRecorderRef.current) return; // already recording
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // Set up AudioContext + AnalyserNode for live waveform
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    setAnalyserNode(analyser);

    // Determine preferred MIME type
    const mimeType = ["audio/webm", "audio/ogg", "audio/mp4"].find((t) =>
      MediaRecorder.isTypeSupported(t)
    );

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const actualMime = recorder.mimeType || "audio/webm";
      const ext = actualMime.includes("ogg")
        ? "ogg"
        : actualMime.includes("mp4")
          ? "m4a"
          : "webm";
      const blob = new Blob(chunksRef.current, { type: actualMime });
      const file = new File(
        [blob],
        `voice-message-${Date.now()}.${ext}`,
        { type: actualMime }
      );
      resolveStopRef.current?.(file);
      resolveStopRef.current = null;
    };

    recorder.start(100); // collect in 100ms chunks
    startTimeRef.current = Date.now();
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setDuration((Date.now() - startTimeRef.current) / 1000);
    }, 100);
  }, []);

  const stopRecording = useCallback((): Promise<File> => {
    return new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === "inactive"
      ) {
        // Nothing to stop — return empty file
        resolve(
          new File([], `voice-message-${Date.now()}.webm`, {
            type: "audio/webm",
          })
        );
        cleanup();
        return;
      }
      resolveStopRef.current = (file) => {
        cleanup();
        resolve(file);
      };
      mediaRecorderRef.current.stop();
    });
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    resolveStopRef.current = null;
    cleanup();
  }, [cleanup]);

  return {
    isRecording,
    duration,
    analyserNode,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
