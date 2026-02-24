# Voice Messages Design

**Date:** 2026-02-24

## UX Flow

1. Normal state: composer shows `[ textarea | 🎤 ]`. Typing text morphs mic → send arrow.
2. Tap mic → recording starts. Composer transforms to: `[ 🗑️ | 🔴 0:03 ████ waveform | ➤ send ]`
3. Tap send → stops recording, sends voice file as attachment
4. Tap delete → cancels recording, returns to normal state
5. Voice messages render as playback widget: play/pause + waveform + duration

## Components

- `lib/use-audio-recorder.ts` — MediaRecorder hook (from worktree)
- `components/messages/audio-waveform-player.tsx` — Playback widget (from worktree)
- `components/messages/messages-thread.tsx` — Add mic/recording UI to composer

## Backend

No new API routes. Voice files sent as attachments via existing `sendMessage()` FormData path.
