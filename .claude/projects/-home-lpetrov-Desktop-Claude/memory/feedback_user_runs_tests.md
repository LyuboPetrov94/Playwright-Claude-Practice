---
name: User runs tests themselves
description: User prefers to inspect and run tests on their own rather than having Claude execute them
type: feedback
---

Do not run tests automatically after implementation — let the user inspect and run them.

**Why:** User explicitly rejected the test run command, stating "I will inspect the tests and run them myself."

**How to apply:** After writing POM + spec files, summarize what was created and let the user handle test execution. Only run tests if explicitly asked.
