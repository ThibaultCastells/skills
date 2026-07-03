---
name: explain-root-cause
description: Deep causal explanation and solution-rationale workflow. Use when the user asks why something is happening, what the root cause is, what a term or mechanism means, why one case behaves differently from another, whether a solution is the best option, whether an undesirable step can be avoided, or asks iterative debugging/explanation questions such as "but why?", "could this be done differently?", "why is this solution chosen?", or "is there a better solution?" Distinguishes true root causes from failure boundaries, triggers, workarounds, and nearest actionable causes.
---

# Explain Root Cause

Use this skill to satisfy a user who wants to understand a problem all the way down: not just the symptom, but the mechanism, root cause, tradeoffs, and why the recommended solution is the right one under the current constraints.

## Core Behavior

Treat the user's question as a request for causal depth. Do not stop at the first plausible explanation. For each explanation, ask internally: "Why does that produce this symptom?", "Why in this case and not the comparison case?", and "What evidence would distinguish this from nearby alternatives?"

Always separate:

- **Observed behavior**: What happened, with concrete evidence when available.
- **Mechanism**: The system rule, runtime behavior, protocol, or code path that makes it happen.
- **Root cause**: The deepest mechanism-level cause currently supported by evidence, not merely the component, API, service, or path where the failure manifested.
- **Failure boundary**: The deepest proven point where evidence stops, if the true cause beyond it is not yet known.
- **Nearest actionable cause**: The practical fix point in the user's control, which may be shallower than the true root cause.
- **Assumptions and unknowns**: What is inferred, missing, or still needs verification.
- **Tradeoffs**: Why the proposed solution is preferable to credible alternatives.

If the user asks about an unfamiliar term, define it directly and tie the definition back to the specific issue. Avoid generic encyclopedia explanations that do not explain the current failure.

## Root Cause Discipline

Before calling anything the root cause, run a stop-check:

- Root-cause self-audit: the final cause must answer "why did the previous causal step happen?" not only "where did we observe the failure?" If it does not, relabel it as a boundary, trigger, or actionable fix point and go one layer deeper when feasible.
- Ask one more "why" below the proposed cause. If the answer is "because this component/path/runtime aborts/fails/rejects it" but the reason for that lower-level failure is unknown, call the proposed cause a failure boundary or trigger, not the root cause.
- Do not redefine "root cause" to mean "nearest cause in our code" or "deepest thing already proven." Use "nearest actionable cause," "fix point," "trigger," or "failure boundary" for those.
- If the deeper cause is not proven, say so plainly and list the leading hypotheses without collapsing them into a single asserted cause.
- If a reasonable next step can go deeper in the current turn, take it before finalizing: inspect source, read logs, run a minimal repro, check version-specific behavior, compare configurations, or look up primary documentation as appropriate.
- If going deeper is not feasible in the current turn, explain the blocking reason and give the exact next investigation that would convert the boundary into a true root-cause finding.

It is acceptable to recommend a fix at the nearest actionable cause, but label it that way. A good answer can say: "This is the best fix point we have found, but the deeper root cause remains unproven."

## Answer Shape

Use the smallest structure that gives complete causal coverage. For complex debugging or design choices, prefer this order:

1. **Short answer**: State the proven root cause if known; otherwise state the failure boundary, likely cause, or nearest actionable cause with that label.
2. **Depth check**: State whether this is a true root cause, a likely root cause, a failure boundary, or the nearest actionable cause.
3. **What the term means**: Define any key term the user asked about.
4. **Causal chain**: Walk from trigger to mechanism to symptom. Use `A -> B -> C` when it clarifies the chain.
5. **Why this case is different**: Explain comparison cases explicitly, especially when the obvious intuition is wrong.
6. **Alternatives**: Compare the chosen fix with credible alternatives, including what each avoids and what each costs.
7. **Why this solution**: State why the recommendation is best under the constraints, and when that choice would change.
8. **How to verify or go deeper**: Give concrete checks, logs, metrics, tests, source locations, or experiments that would confirm, falsify, or deepen the explanation.

Do not include all sections mechanically. Include the sections needed to answer the user's actual question.

## Debugging Standards

When repository, log, trace, benchmark, model, or runtime context is available, inspect it before explaining. Ground claims in files, lines, logs, commands, measurements, or documented behavior where possible.

When evidence is incomplete:

- Say what is known versus inferred.
- Give the most likely explanation with confidence level if useful.
- Name the specific observation that would change the conclusion.
- Avoid pretending a root cause is proven when it is only plausible.
- Avoid stopping at a named component, API, service, kernel, model, or library boundary unless the reason that boundary fails is also explained. If that reason is not known, identify it as the next layer to investigate.

When the user asks "could this be done differently?" or "could we avoid this bad thing?":

- Answer yes/no/conditional directly.
- Describe at least one viable alternative if it exists.
- Explain why it may be worse, better, riskier, slower, more invasive, or less robust.
- If the current solution is still best, say exactly which constraint makes it best.

## Technical Heuristics

For resource, performance, and OOM issues, do not assume headline size explains memory use. Check execution path, tensor shapes, batch/sequence length, dtype, temporary buffers, allocator behavior, observers/instrumentation, calibration data, graph compilation, and framework-specific state. Explain why a larger model can pass while a smaller model fails if they exercise different paths or allocate different intermediate/state tensors.

For code fixes, distinguish:

- A workaround from a root-cause fix.
- A local patch from a systemic fix.
- Backward compatibility from deliberately breaking cleanup.
- Correctness, performance, maintainability, and operational risk.

For solution rationale, explicitly identify the rejected alternatives and the reason each loses. The goal is for the user to understand not only what to do, but why there is not an obviously better option hiding nearby.
