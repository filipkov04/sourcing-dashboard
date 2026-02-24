# Messages UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the /messages page to a polished iMessage/WhatsApp-style chat with full features: reactions, editing, threads, voice messages, search, and conversation settings.

**Architecture:** Port proven logic from `.worktrees/slack-messaging/` into main branch. Schema migration first (new fields + MessageReaction model), then API routes, then hooks, then UI components restyled with bubble-chat aesthetics.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7, Tailwind CSS 4, Supabase (storage + realtime), lucide-react icons.

**Source reference:** All worktree code lives in `.worktrees/slack-messaging/` — copy logic, adapt styling.

---

### Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add fields to ConversationParticipant**

In `prisma/schema.prisma`, find the `ConversationParticipant` model and add after the `muted` field:

```prisma
  pinned          Boolean  @default(false)
  notifyReplies   Boolean  @default(true)
  notifyMentions  Boolean  @default(true)
```

**Step 2: Add threading + soft-delete fields to Message model**

In the `Message` model, add after the `requestAction` field:

```prisma
  // Threading
  parentId        String?
  parent          Message?  @relation("MessageThread", fields: [parentId], references: [id], onDelete: SetNull)
  replies         Message[] @relation("MessageThread")
  threadCount     Int       @default(0)

  // Soft delete
  deletedAt       DateTime?
```

And add `reactions MessageReaction[]` after the `readBy` field.

Add a new index: `@@index([parentId])` in the Message model.

**Step 3: Add MessageReaction model**

After the `Message` model, add:

```prisma
model MessageReaction {
  id        String   @id @default(cuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  emoji     String

  createdAt DateTime @default(now())

  @@unique([messageId, userId, emoji])
  @@index([messageId])
}
```

**Step 4: Push schema to database**

Run: `npx prisma db push`
Run: `npx prisma generate`

Expected: Both succeed with no errors.

**Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add schema for reactions, threading, soft-delete, and conversation settings

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Realtime Infrastructure

**Files:**
- Create: `lib/realtime.ts` (copy from `.worktrees/slack-messaging/lib/realtime.ts`)
- Create: `lib/supabase-client.ts` (copy from `.worktrees/slack-messaging/lib/supabase-client.ts`)

**Step 1: Create `lib/supabase-client.ts`**

Copy the file exactly from `.worktrees/slack-messaging/lib/supabase-client.ts`. This provides `getSupabaseClient()` and `isRealtimeAvailable()` for client-side Supabase realtime.

**Step 2: Create `lib/realtime.ts`**

Copy the file exactly from `.worktrees/slack-messaging/lib/realtime.ts`. This provides:
- `subscribeToConversation()` — client-side realtime subscription
- `useConversationRealtime()` — React hook for conversation events
- `useRealtimePresence()` — React hook for presence
- `serverBroadcast()` — server-side broadcast helper for API routes

**Step 3: Commit**

```bash
git add lib/realtime.ts lib/supabase-client.ts
git commit -m "feat: add realtime infrastructure for chat

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: API Routes — Message Edit/Delete + Reactions

**Files:**
- Create: `app/api/conversations/[id]/messages/[messageId]/route.ts`
- Create: `app/api/conversations/[id]/messages/[messageId]/reactions/route.ts`

**Step 1: Create message edit/delete route**

Copy from `.worktrees/slack-messaging/app/api/conversations/[id]/messages/[messageId]/route.ts`.

Provides:
- `PATCH` — edit own message (validates ownership, TEXT type only, max 5000 chars, sets `editedAt`)
- `DELETE` — soft-delete own message (sets `deletedAt`, replaces content with "This message was deleted")

Both broadcast via `serverBroadcast()`.

**Step 2: Create reactions route**

Copy from `.worktrees/slack-messaging/app/api/conversations/[id]/messages/[messageId]/reactions/route.ts`.

Provides:
- `POST` — toggle emoji reaction (if exists → remove, if not → create). Validates participant access, emoji length (max 8 chars).

**Step 3: Verify routes load**

Visit `http://localhost:3000/api/conversations/test/messages/test` — should return 401 (unauthorized). This confirms the route is loaded.

**Step 4: Commit**

```bash
git add app/api/conversations/\[id\]/messages/\[messageId\]/
git commit -m "feat: add message edit, delete, and reactions API routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: API Routes — Thread Replies + Search + Settings

**Files:**
- Create: `app/api/conversations/[id]/messages/[messageId]/replies/route.ts`
- Create: `app/api/conversations/[id]/messages/search/route.ts`
- Create: `app/api/conversations/[id]/settings/route.ts`
- Create: `app/api/conversations/[id]/quick-reply/route.ts`
- Create: `app/api/messages/search/route.ts`

**Step 1: Create thread replies route**

Copy from `.worktrees/slack-messaging/app/api/conversations/[id]/messages/[messageId]/replies/route.ts`.

Provides:
- `GET` — fetch all replies for a parent message
- `POST` — send reply (text or multipart with files), increments `threadCount` on parent, updates `lastMessageAt`, increments unread

**Step 2: Create message search route (within conversation)**

Copy from `.worktrees/slack-messaging/app/api/conversations/[id]/messages/search/route.ts`.

Provides `GET` — search messages by content (case-insensitive, min 2 chars, max 50 results).

**Step 3: Create conversation settings route**

Copy from `.worktrees/slack-messaging/app/api/conversations/[id]/settings/route.ts`.

Provides:
- `GET` — fetch user's settings (muted, pinned, notifyReplies, notifyMentions)
- `PATCH` — update settings (validates boolean fields only)

**Step 4: Create quick-reply route**

Copy from `.worktrees/slack-messaging/app/api/conversations/[id]/quick-reply/route.ts`.

Provides `POST` — support category selection with auto-bot-reply.

**Step 5: Create global message search route**

Copy from `.worktrees/slack-messaging/app/api/messages/search/route.ts`.

Provides `GET` — search across all user's conversations.

**Step 6: Create presence routes (if not already existing)**

Check if `/api/presence/heartbeat/route.ts` and `/api/presence/route.ts` exist. If not, copy from worktree.

**Step 7: Commit**

```bash
git add app/api/conversations/ app/api/messages/ app/api/presence/
git commit -m "feat: add thread replies, search, settings, and presence API routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Update Hooks — use-conversations.ts + use-audio-recorder.ts

**Files:**
- Replace: `lib/use-conversations.ts` (with worktree version)
- Create: `lib/use-audio-recorder.ts` (copy from worktree)

**Step 1: Replace `lib/use-conversations.ts`**

Replace with the worktree version from `.worktrees/slack-messaging/lib/use-conversations.ts`.

Key additions over current:
- Types: `MessageReaction`, `ConversationDetail` with `pinned` field
- Hooks: `useThreadReplies()`
- Functions: `editMessage()`, `deleteMessage()`, `toggleReaction()`, `searchConversationMessages()`, `searchAllMessages()`, `sendReply()`, `getConversationSettings()`, `updateConversationSettings()`
- Realtime integration: `useConversationDetail()` uses `useConversationRealtime()` with polling fallback

**Step 2: Create `lib/use-audio-recorder.ts`**

Copy from `.worktrees/slack-messaging/lib/use-audio-recorder.ts`.

Provides `useAudioRecorder()` hook: `isRecording`, `duration`, `analyserNode`, `startRecording()`, `stopRecording()`, `cancelRecording()`.

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

Fix any import errors (ensure `lib/realtime.ts` and `lib/supabase-client.ts` are created from Task 2).

**Step 4: Commit**

```bash
git add lib/use-conversations.ts lib/use-audio-recorder.ts
git commit -m "feat: enhanced conversation hooks with reactions, threads, search, voice recording

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: UI Components — MessageItem + MessageActions + EmojiPicker

**Files:**
- Create: `components/messages/message-item.tsx` (from worktree, restyle)
- Create: `components/messages/message-actions.tsx` (from worktree)
- Create: `components/messages/emoji-picker.tsx` (from worktree)

**Step 1: Create `message-item.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/message-item.tsx`.

This is the core message rendering component. Keep the iMessage styling already present (orange gradient for own, light gray for received). Key features: hover actions, reactions display, thread count, edit mode, deleted state, read receipts.

**Step 2: Create `message-actions.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/message-actions.tsx`.

Floating hover toolbar: quick reactions (👍 ❤️ 😂), emoji picker button, reply button, more menu (edit/delete for own messages).

**Step 3: Create `emoji-picker.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/emoji-picker.tsx`.

Grid popup with 4 groups (Frequent, Smileys, Gestures, Objects), click-outside-to-close.

**Step 4: Verify components render**

Check imports resolve correctly. The MessageItem depends on MessageActions, EmojiPicker, SourcyAvatar, MessageAttachments — all should be available.

**Step 5: Commit**

```bash
git add components/messages/message-item.tsx components/messages/message-actions.tsx components/messages/emoji-picker.tsx
git commit -m "feat: add message item, hover actions, and emoji picker components

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: UI Components — MessageComposer + AudioWaveformPlayer

**Files:**
- Create: `components/messages/message-composer.tsx` (from worktree)
- Create: `components/messages/audio-waveform-player.tsx` (from worktree)

**Step 1: Create `message-composer.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/message-composer.tsx`.

Rich input: attach button (Paperclip), textarea, emoji picker button, mic/send toggle. Recording mode: cancel button, red pulsing dot, live waveform, timer, send button.

**Step 2: Create `audio-waveform-player.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/audio-waveform-player.tsx`.

Playback widget: extracts 40-bar waveform from audio, play/pause, click-to-seek, progress tracking.

**Step 3: Commit**

```bash
git add components/messages/message-composer.tsx components/messages/audio-waveform-player.tsx
git commit -m "feat: add rich message composer with voice recording and audio player

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: UI Components — ThreadPanel + MessageSearch + ConversationSettings

**Files:**
- Create: `components/messages/thread-panel.tsx` (from worktree)
- Create: `components/messages/message-search.tsx` (from worktree)
- Create: `components/messages/conversation-settings-dialog.tsx` (from worktree)

**Step 1: Create `thread-panel.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/thread-panel.tsx`.

400px right panel: parent message at top, replies list, composer at bottom, auto-scroll, close button.

**Step 2: Create `message-search.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/message-search.tsx`.

Search overlay: debounced input (300ms), highlights matches in orange, conversation context for global results, jump-to-message.

**Step 3: Create `conversation-settings-dialog.tsx`**

Copy from `.worktrees/slack-messaging/components/messages/conversation-settings-dialog.tsx`.

Modal with toggle switches: pin, mute, thread notifications, mention notifications. Participants list.

**Step 4: Commit**

```bash
git add components/messages/thread-panel.tsx components/messages/message-search.tsx components/messages/conversation-settings-dialog.tsx
git commit -m "feat: add thread panel, message search, and conversation settings

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Rewire MessagesThread + MessagesSidebar + Page

**Files:**
- Modify: `components/messages/messages-thread.tsx` (slim down, use new components)
- Modify: `components/messages/messages-sidebar.tsx` (add pinned sections)
- Modify: `app/(dashboard)/messages/page.tsx` (add thread panel state)

**Step 1: Replace `messages-thread.tsx`**

Replace with the worktree version from `.worktrees/slack-messaging/components/messages/messages-thread.tsx`.

Key changes from current:
- Delegates message rendering to `MessageItem` (with `showAvatar`/`showSenderName` based on `shouldShowHeader()`)
- Delegates input to `MessageComposer`
- Header: Search + Settings icons (not disabled Call/Profile)
- `MessageSearch` overlay replaces messages when active
- `ConversationSettingsDialog` modal
- Props: `onOpenThread` + `activeThreadId` for thread panel integration

**Step 2: Replace `messages-sidebar.tsx`**

Replace with the worktree version from `.worktrees/slack-messaging/components/messages/messages-sidebar.tsx`.

Key changes:
- Pinned/unpinned conversation sections
- Pin icon next to pinned conversation names
- Uses `border-r` instead of rounded card (for flat panel look within the page container)

**Step 3: Update `app/(dashboard)/messages/page.tsx`**

Add state for thread panel:
- `activeThreadMessageId` state
- Pass `onOpenThread` to `MessagesThread`
- Conditionally render `ThreadPanel` when a thread is active
- Find the parent message from conversation detail to pass to thread panel

Reference: The worktree page at `.worktrees/slack-messaging/app/(dashboard)/messages/page.tsx` (read if it exists, otherwise build from the patterns).

**Step 4: Verify the page renders**

Visit `http://localhost:3000/messages` — should show sidebar + empty state. Create/select a conversation — should show the new thread with message grouping, hover actions, and rich composer.

**Step 5: Commit**

```bash
git add components/messages/messages-thread.tsx components/messages/messages-sidebar.tsx app/\(dashboard\)/messages/page.tsx
git commit -m "feat: rewire messages page with modular components and thread support

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Update existing conversation detail API to include new fields

**Files:**
- Modify: `app/api/conversations/[id]/route.ts`

**Step 1: Update the GET handler**

The conversation detail endpoint needs to include the new fields in its Prisma query:
- Add `reactions` include on messages: `reactions: { orderBy: { createdAt: "asc" } }`
- Add `parentId`, `threadCount`, `deletedAt` to message select (these come automatically with `include`)
- Ensure `readBy` is included

Check the existing query and add missing includes.

**Step 2: Update conversation list API if needed**

Check `app/api/conversations/route.ts` — the list endpoint should return `pinned` from the participant. Verify it's included in the query.

**Step 3: Commit**

```bash
git add app/api/conversations/
git commit -m "feat: include reactions, threading, and settings in conversation API responses

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Visual Polish Pass

**Files:**
- Modify: Various component files for animation and polish

**Step 1: Review all components in browser**

Open `http://localhost:3000/messages` and test:
- [ ] Sidebar loads with conversations
- [ ] Clicking a conversation shows messages
- [ ] Message grouping works (consecutive same-sender = collapsed)
- [ ] Hover shows action toolbar
- [ ] Emoji reactions work (click quick react or open picker)
- [ ] Edit/delete work on own messages
- [ ] Composer: typing shows send, empty shows mic
- [ ] Voice recording: start/cancel/send
- [ ] Thread panel opens and shows replies
- [ ] Search overlay finds messages
- [ ] Settings dialog toggles work
- [ ] Dark mode looks correct
- [ ] Mobile responsive (sidebar/thread toggle)

**Step 2: Fix any visual issues**

Adjust spacing, colors, transitions as needed. Ensure:
- Orange accent `#EB5D2E` is consistent
- Dark mode uses `zinc-800/900` cards, `zinc-700` borders
- Bubble tails: `rounded-br-md` for own, `rounded-bl-md` for received

**Step 3: Commit**

```bash
git add -A
git commit -m "fix: visual polish and dark mode adjustments for messages UI

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Add presence routes + update middleware

**Files:**
- Create (if missing): `app/api/presence/heartbeat/route.ts`
- Create (if missing): `app/api/presence/route.ts`
- Modify: `middleware.ts` (add new API routes to public routes if needed)

**Step 1: Check if presence routes exist**

If not, copy from worktree.

**Step 2: Update middleware**

Ensure new API routes don't require auth middleware if they handle auth internally (they all use `auth()` checks internally, so they should be fine behind middleware).

**Step 3: Commit if changes were made**

```bash
git add app/api/presence/ middleware.ts
git commit -m "feat: add presence heartbeat and status routes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Execution Order

Tasks 1-2 must be sequential (schema first, then realtime infra).
Tasks 3-4 can run in parallel (independent API routes).
Task 5 depends on Task 2 (hooks import from realtime).
Tasks 6-8 can run in parallel (independent UI components).
Task 9 depends on Tasks 5-8 (rewires page to use new components).
Task 10 can run after Task 1 (updates existing API).
Task 11 depends on Task 9 (visual review).
Task 12 can run anytime after Task 1.

```
1 → 2 → 5 ─┐
    ├→ 3 ───┤
    ├→ 4 ───┤→ 9 → 11
    ├→ 6 ───┤
    ├→ 7 ───┤
    ├→ 8 ───┘
    ├→ 10
    └→ 12
```
