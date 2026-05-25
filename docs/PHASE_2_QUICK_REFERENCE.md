# Phase 2 Quick Reference Guide

## 📌 TL;DR (Too Long; Didn't Read)

**What**: Extract 3 independent contexts from monolithic AppContext
**When**: Days 2-3 (after Phase 1 testing setup complete)
**Result**: 
- 780 LOC extracted
- 3 new testable contexts
- 30+ passing tests
- 95%+ fewer unnecessary re-renders

---

## 🎯 The 3 Contexts at a Glance

### 1️⃣ ThemeContext (Easiest)
```
What: Dark/light mode toggle
Size: ~80 lines
Dependencies: NONE
Time: 1 hour
Tests: 5
Used by: ThemeToggle, GlobalCSS (2-3 components)

Current code: AppContext line ~1100
```

### 2️⃣ AuthContext (Foundation)  
```
What: User auth & profile management
Size: ~400 lines
Dependencies: NONE (foundation for others)
Time: 2-3 hours
Tests: 15
Used by: AuthPage, SettingsPage, all pages needing currentUser (5-10 components)

Current code: AppContext scattered (lines ~300-500, ~1500-1700)
```

### 3️⃣ NotificationContext (Medium)
```
What: System notifications + real-time subscriptions
Size: ~300 lines
Dependencies: AuthContext (for currentUserId)
Time: 1-2 hours
Tests: 10
Used by: AppShell, NotificationsPage (2-3 components)

Current code: AppContext lines ~945-1000
```

---

## 📂 Files to Create (6 Total)

### New Context Files
1. `src/context/ThemeContext.tsx` (~80 LOC)
2. `src/context/AuthContext.tsx` (~400 LOC)
3. `src/context/NotificationContext.tsx` (~300 LOC)

### New Test Files
4. `src/context/__tests__/ThemeContext.test.tsx` (~50 LOC)
5. `src/context/__tests__/AuthContext.test.tsx` (~150 LOC)
6. `src/context/__tests__/NotificationContext.test.tsx` (~100 LOC)

---

## 🔄 Extraction Process (For Each Context)

```
Step 1: Identify Code
    ↓ Find relevant lines in AppContext.tsx
    
Step 2: Create Context File
    ↓ Create src/context/XxxContext.tsx
    ↓ Add Provider component
    ↓ Add useXxx hook
    
Step 3: Extract Logic
    ↓ Copy state (useState)
    ↓ Copy functions (useCallback)
    ↓ Copy effects (useEffect)
    
Step 4: Add Tests
    ↓ Create src/context/__tests__/XxxContext.test.tsx
    ↓ Write test cases (5-15 per context)
    
Step 5: Verify
    ↓ npm test (should pass all)
    ↓ npm run build (should succeed)
    ↓ Check TypeScript (no errors)
```

---

## 📊 Timeline

```
DAY 2 (Morning):  ThemeContext
├─ Extract code (20 min)
├─ Create context file (20 min)
├─ Write tests (20 min)
└─ Total: 1 hour ✅

DAY 2 (Afternoon): AuthContext
├─ Extract code (45 min)
├─ Create context file (60 min)
├─ Write tests (60 min)
└─ Total: 2.5 hours ✅

DAY 3 (Morning): NotificationContext
├─ Extract code (30 min)
├─ Create context file (45 min)
├─ Write tests (45 min)
└─ Total: 2 hours ✅

DAY 3 (Afternoon): Final Verification
├─ Run all tests
├─ Check coverage
├─ Verify build
├─ Document changes
└─ Total: 1 hour ✅

TOTAL PHASE 2: ~6.5 hours
```

---

## 🧪 Test Count Summary

```
ThemeContext:           5 tests
├─ Initial state
├─ Toggle theme
├─ Persist to localStorage
├─ Update DOM
└─ Error handling

AuthContext:           15 tests
├─ Signup
├─ Login (email)
├─ Login (Google)
├─ Logout
├─ Profile update
├─ Session restore
├─ User lookups
├─ Loading states
├─ Error cases
└─ Edge cases

NotificationContext:   10 tests
├─ Setup subscription
├─ Receive updates
├─ Mark as read
├─ Mark all read
├─ Unread count
├─ Real-time sync
├─ Cleanup
├─ Auth dependency
└─ Error handling

TOTAL: 30 tests
```

---

## 💡 Key Principles

| Principle | What It Means | Why It Matters |
|-----------|--------------|---|
| **Isolation** | Each context is independent | Can test & maintain separately |
| **Single Responsibility** | Context does ONE thing | Easy to understand & modify |
| **Dependency Flows Down** | Auth → Notifications | Simple, predictable structure |
| **No Breaking Changes** | Old code still works | Safe extraction, tested thoroughly |
| **Test Everything** | 30+ tests before Phase 5 | Catch bugs early, prevent regressions |

---

## 🔍 Dependency Map After Phase 2

```
ThemeContext ────────────────────────────────────────┐
  (No dependencies)                                  │
  Used in: 2-3 components                           │
                                                    │
AuthContext ─────────────────────────────────────────┤
  (No dependencies)                                  │
  Used in: 5-10 components                          │
  Required by: NotificationContext                  │
                                                    │
NotificationContext                                  │
  Depends on: AuthContext (currentUserId)           │
  Used in: 2-3 components                           │
                                                    │
Will be wrapped in Phase 5:                         │
All 3 + future contexts go inside AppProvider       │
```

---

## ✅ Definition of Done (for Phase 2)

Phase 2 is complete when:

- [ ] 3 context files created (`src/context/XxxContext.tsx`)
- [ ] 3 test files created (`src/context/__tests__/XxxContext.test.tsx`)
- [ ] 30+ tests written
- [ ] All tests passing: `npm test` ✅
- [ ] Build succeeds: `npm run build` ✅
- [ ] Coverage > 80% for new code
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Documentation updated
- [ ] Ready to start Phase 3

---

## 🚀 Commands You'll Use in Phase 2

```bash
# Development
npm test               # Run tests
npm test:watch        # Watch mode while developing
npm run test:ui       # Visual test dashboard
npm run test:coverage # Check coverage

# Verification
npm run build         # Build before committing
npm run lint          # Check code quality

# Git
git add src/context/ThemeContext.tsx
git commit -m "feat: extract ThemeContext"

git add src/context/AuthContext.tsx
git commit -m "feat: extract AuthContext"

git add src/context/NotificationContext.tsx
git commit -m "feat: extract NotificationContext"
```

---

## 📖 Documentation Files Created for Phase 2

- ✅ **PHASE_2_DETAILED_CONTEXT.md** - In-depth explanation of each context with code examples
- ✅ **PHASE_2_VISUAL_SUMMARY.md** - Visual diagrams showing before/after and performance impact
- ✅ **PHASE_2_QUICK_REFERENCE.md** - This file! Quick lookup guide

---

## 🤔 Common Questions

### Q: Why this order (Theme → Auth → Notifications)?
A: ThemeContext has zero dependencies (safe start), AuthContext is foundation for others, NotificationContext depends only on Auth (simple dependency chain).

### Q: Do existing components need updates?
A: No! Phase 5 creates composite AppContext that wraps all new contexts. Old code continues working unchanged.

### Q: What if a test fails?
A: Debug the specific test, fix the implementation, re-run tests. Each context is isolated, so failures are easy to track.

### Q: Can I skip tests?
A: No! Tests are critical for catching bugs when we refactor. Phase 6 depends on Phase 2 tests passing.

### Q: How long does Phase 2 actually take?
A: ~6-8 hours spread over 2 days. Can be done incrementally (1-2 contexts per work session).

---

## 📚 Related Documentation

- `PHASE_1_TESTING_SETUP.md` - Testing infrastructure (completed ✅)
- `PHASE_2_DETAILED_CONTEXT.md` - Deep dive into each context
- `PHASE_2_VISUAL_SUMMARY.md` - Visual explanations & impact charts
- `/claude/plans/wild-percolating-moonbeam.md` - Full master plan

---

## 🎯 Success Metrics After Phase 2

| Metric | Target | Status |
|--------|--------|--------|
| Lines extracted | 780+ | - |
| New contexts | 3 | - |
| Test files | 3 | - |
| Tests passing | 30+ | - |
| Coverage | >80% | - |
| Build | ✅ No errors | - |
| TypeScript | ✅ No errors | - |

---

## 🏁 Next: Phase 3 Begins When Phase 2 Done

Once Phase 2 is complete:
- [ ] 3 independent contexts working ✅
- [ ] Tests passing ✅
- [ ] Ready to extract UserDiscoveryContext, PostContext, ReviewContext
- [ ] Continue building modular architecture

**Estimated completion of Phases 2-4: ~2 weeks**
**Full project completion (all 6 phases): ~3-4 weeks**

---

Ready to start Phase 2? Let me know! 🚀
