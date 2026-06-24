---
name: fix-finding
description: Fix ONE review finding handed down by the `reviewer` merge gate — surgically, without scope creep. Run by a fix agent spawned on a FAIL verdict. Use when a single, quoted finding must be patched and re-verified. Triggers "fix this finding", "apply review fix", "/fix-finding".
---

# fix-finding

You were given exactly one finding from the `reviewer` gate:
`path:line: BLOCK <lens>: <problem>. <fix>.`
Patch that one thing. Nothing else.

## Steps
1. **Read** `path` around `line`. Confirm the problem is real and still present.
   - Not real / already fixed → report that, change nothing.
2. **Apply the smallest diff** that resolves the finding and matches surrounding style.
   - Correctness fix → make output correct, add the missing case.
   - Maintainability fix → delete the speculative/duplicated code, use the stdlib/native
     or `schema.ts` helper named in the finding. Less code, not more.
   - Runtime-cost fix → hoist/memoize the repeated work, drop the redundant pass.
     Don't trade correctness for speed.
3. **Verify** `npx tsc --noEmit`. If it touches layout, render a still
   (`npx remotion still Short out/x.png --frame=N`) and Read the PNG. Never a full render.
4. **Report** back to the gate: file:line changed, one line on what + why, verify result.

## Rules
- One finding, one focused diff. See another problem? Name it in the report; don't fix it.
- No new files, no new deps, no refactor beyond the finding (ponytail).
- Match the existing code's idiom, naming, comment density.
- Leave the verify green. If you can't make it pass, say why — don't paper over it.
