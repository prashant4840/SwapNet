# Real-time Chat Testing Checklist

## Quick Start Testing

### ✅ Test 1: Single Tab Messaging
1. Open `/messages` in one browser tab
2. Click on a conversation
3. Open DevTools > Console
4. Look for log: `[Chat] ✓ Realtime connected: swap-...` or `[Chat] ✓ Realtime connected: connection-...`
5. Type and send a message
6. ✅ **Expected**: Message appears instantly in the chat

---

### ✅ Test 2: Multi-Tab Real-time Sync
1. Open `/messages` in **TWO browser tabs** (logged in as same user)
2. In **Tab A**: Click on a conversation
3. In **Tab B**: Click on the **SAME conversation**
4. In **Tab A**: Type and send a message
5. ✅ **Expected**: Message appears instantly in **Tab B** (no refresh needed!)

---

### ✅ Test 3: Multi-User Real-time (Hard to test solo)
1. Have two users log in on different computers
2. User A: Send a message in a swap conversation
3. User B: Watching the same conversation on their screen
4. ✅ **Expected**: User B sees message appear instantly

---

### ✅ Test 4: Connection Status Logging
1. Open DevTools > Console
2. Go to `/messages` and open a conversation
3. Look for logs like:
   ```
   [Chat] ✓ Realtime connected: swap-abc123...
   ```
4. Close the conversation or navigate away
5. Look for logs like:
   ```
   [Chat] Unsubscribed from thread: swap-abc123...
   ```
6. ✅ **Expected**: Logs show connection lifecycle

---

### ✅ Test 5: Message Ordering Under Load
1. Open DevTools > Console
2. Go to chat conversation
3. Rapidly send 5 messages (click send repeatedly)
4. ✅ **Expected**: All messages appear in chronological order (not jumbled)

---

### ✅ Test 6: Error Handling
1. Open DevTools > Console
2. Go to chat
3. Send a message successfully
4. Disable internet connection: DevTools > Network > Offline
5. Try to send another message
6. Re-enable internet: DevTools > Network > Online
7. ✅ **Expected**: 
   - Message send may fail initially (acceptable)
   - After reconnecting, connection re-established
   - Next message sends successfully

---

### ✅ Test 7: Browser DevTools - Network Tab
1. Open DevTools > Network > WS (WebSocket filter)
2. Go to `/messages` and open a conversation
3. ✅ **Expected**: You should see a WebSocket connection to `*.supabase.co`
4. Send a message
5. ✅ **Expected**: No visible WebSocket message (uses postgres_changes, transparent to you)

---

## What to Look For (Console Logs)

### ✅ Good Signs (Realtime Working)
```
[Chat] ✓ Realtime connected: swap-550e8400-e29b-41d4-a716-446655440000
[Chat] ✓ Realtime connected: connection-550e8400-e29b-41d4-a716-446655440001
```

### ⚠️ Warnings (May Be OK)
```
[Chat] Failed to process new message: Error...
[Chat] Unsubscribed from thread: swap-550e8400-e29b-41d4-a716-446655440000
```

### ❌ Errors (Something Wrong)
```
[Chat] Failed to setup subscription: Error...
```

---

## Performance Checks

### Message Delivery Speed
- **Good**: 100-300ms (expected latency)
- **Acceptable**: 300-1000ms (network dependent)
- **Poor**: >2000ms (possible issue)

### Memory Usage
- Open DevTools > Memory > Take Heap Snapshot
- Open multiple conversations, send messages
- Heap size should not grow beyond 50MB more
- If growing infinitely, there may be a memory leak

### CPU Usage
- Activity Monitor (Mac) / Task Manager (Windows)
- Open chat, send message
- CPU spike should be <5%
- Should return to baseline within 1 second

---

## Regression Testing

### Make sure these still work:
- ✅ Sending messages (old way still works)
- ✅ Loading chat history
- ✅ Rendering messages correctly
- ✅ Thread list updates
- ✅ Scrolling to latest message
- ✅ Quick templates
- ✅ Video call links
- ✅ Message formatting (bold, links, etc.)

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome/Brave | ✅ Full Support | Primary target |
| Firefox | ✅ Full Support | Tested |
| Safari | ✅ Full Support | Tested |
| Edge | ✅ Full Support | Uses Chromium |
| Mobile Safari | ✅ Full Support | iOS |
| Chrome Mobile | ✅ Full Support | Android |
| IE 11 | ❌ Not Supported | Ancient browser |

---

## Troubleshooting

### Issue: No `[Chat]` logs appearing
**Solution**: 
1. Hard refresh page (Cmd+Shift+R or Ctrl+Shift+R)
2. Check DevTools > Console tab is open
3. Verify you're in production build (not demo mode)

### Issue: Messages not appearing in real-time
**Solution**:
1. Check DevTools > Console for errors
2. Verify WebSocket connection in Network tab
3. Try hard refresh
4. Check if Supabase status is up: https://status.supabase.com

### Issue: Only seeing "Unsubscribed" logs
**Solution**:
1. Check if navigation happens too quickly
2. Verify thread ID is correct (not empty)
3. Check browser's WebSocket support

---

## Success Criteria ✅

All tests pass if:
- [ ] Messages appear instantly (≤500ms)
- [ ] Multi-tab sync works
- [ ] Console shows connection logs
- [ ] No JavaScript errors
- [ ] Old messages still load
- [ ] All existing features still work
- [ ] Memory doesn't leak over time

---

## Running Tests Locally

```bash
# Start dev server
npm run dev

# Open http://localhost:5173

# Open DevTools (F12 or Cmd+Option+I)

# Navigate to /messages

# Test!
```

---

**If all tests pass, Real-time Chat is working! 🎉**
