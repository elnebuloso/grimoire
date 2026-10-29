---
id: TASK-40
title: Check the search weights against real documentation
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29 23:08'
labels:
  - search
milestone: m-0
dependencies: []
priority: low
type: spike
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`query` ranks with `bm25(snippets_fts, 10, 1, 0.25)` in `app/src/lib/server/search/query.ts`: title path 10, text 1, code 0.25. These are starting values, never checked against a real documentation set.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Typical agent questions against a real documentation set are run and their top hits judged
- [x] #2 The weights are kept or changed based on that, with the reason recorded in the task
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evaluated 2026-10-29 on the Kubernetes documentation as indexed for TASK-39 (1722 pages, 13160 snippets), with the query.ts search (OR of the words, bm25 over title_path, text, code). 20 typical agent questions, each with the page(s) that answer it; rank of the first right hit in the top 10:
questions: cpu and memory limits; roll back a deployment; liveness and readiness probe; secret from a file with kubectl; configmap as a volume; network policy deny all ingress; autoscale pods on cpu; persistent volume claim with a storage class; drain a node; kubectl port-forward; rbac role binding for a service account; taints and tolerations NoSchedule; init containers; cronjob schedule syntax; ingress with tls; pod disruption budget; debug CrashLoopBackOff; upgrade a kubeadm cluster; environment variables for a container; expose a deployment with a LoadBalancer service.
MRR / right hit first / in the top 3:
- 10/1/0.25 (current): 0.712 / 12 / 16
- 20/1/0.25: 0.703 / 12 / 15; 5/1/0.25: 0.689 / 11 / 16; 3/1/0.25: 0.694 / 11 / 16; 2/1/0.25: 0.681 / 10 / 16
- 1/1/1: 0.577 / 8 / 14
- 10/1/1: 0.717 / 12 / 16; 5/1/0.5: 0.675; 3/1/0.5: 0.683; 3/1/0: 0.690
Judged by hand: where the expected page was not first, the first hit was mostly a right answer from another page (rolling back in update-deployment-rolling.md, the LoadBalancer in create-external-load-balancer.md); real misses were 'autoscale' (HPA page 5th: no stemming, 'autoscale' does not match 'autoscaling') and 'drain a node' (safely-drain-node.md 6th, behind 'Drain the node' steps of upgrade guides).
Decision: weights kept at 10/1/0.25. Weighting the title clearly helps (1/1/1 is far behind); everything from 3 to 20 for the title is within the noise of 20 questions, and 10/1/1 is not meaningfully better than 10/1/0.25. The comment in query.ts now says so.
Side finding, not changed: an FTS5 table with tokenize = 'porter unicode61' raises the current weighting from MRR 0.712 to 0.773 (13 first, 17 top 3) on the same questions; the order of the weightings stays the same. Porter stems English only; worth its own task, weighed against German documentation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The search weights 10/1/0.25 (title path, text, code) stay. Checked with 20 typical agent questions against the Kubernetes documentation (1722 pages): the current weighting ranks the right section first for 12 and in the top 3 for 16 questions (MRR 0.712); equal weights are clearly worse (0.577), and other title weights from 3 to 20 are within the noise. The reasoning is in the comment in query.ts. Stemming (porter tokenizer) would help more than any weighting (MRR 0.773); not changed here.
<!-- SECTION:FINAL_SUMMARY:END -->
