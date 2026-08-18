---
type: Playbook
title: Publish an OKF Update
description: How to update the bundle and regenerate the public export.
visibility: internal
status: approved
owner: antonio
confidence: high
tags: [playbook, okf]
timestamp: 2026-06-25T12:00:00Z
---

# Steps

1. Edit or add the affected concept file; bump its `timestamp`.
2. If facts changed, update any concept that cites them.
3. Add a line to the nearest `log.md` (newest first).
4. Re-run the conformance lint.
5. Regenerate the public export (all `visibility: public` concepts) and redeploy `/okf/`.

# Related

* [Design doc](/index.md)
