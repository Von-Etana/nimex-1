# Referral Approval And Advisory Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move referral commission approval and payout marking to Firebase Functions while documenting safe dependency advisory handling.

**Architecture:** Client signup writes only pending referral requests. Admin UI calls callable backend functions to approve, reject, or mark commission payments, and those functions enforce admin authorization and update Firestore in transactions. Dependency advisory handling is documented as compatibility policy with scripts for repeatable audits.

**Tech Stack:** Firebase Functions, Firestore Admin SDK, React/Vite admin UI, Expo mobile package metadata.

---

### Task 1: Backend Referral Functions

**Files:**
- Create: `functions/src/referrals.ts`
- Modify: `functions/src/index.ts`

- [x] Add admin-gated callable functions for approving, rejecting, and marking referral commissions as paid.
- [x] Compute commission amounts from active `commission_settings` on the server.
- [x] Update referral, vendor, marketer, and payment records in Firestore transactions.

### Task 2: Admin UI Integration

**Files:**
- Create: `src/services/referralAdminService.ts`
- Modify: `src/screens/admin/AdminCommissionsScreen.tsx`

- [x] Replace direct client writes for commission payment status with callable backend calls.
- [x] Show pending referral approvals and approved unpaid commissions in the same admin workflow.
- [x] Add approve, reject, and mark-paid actions.

### Task 3: Advisory Strategy

**Files:**
- Modify: `package.json`
- Modify: `functions/package.json`
- Modify: `../nimex-mobile/package.json`
- Create: `PRODUCTION_DEPENDENCY_ADVISORY_STRATEGY.md`

- [x] Add audit scripts for production/full dependency checks.
- [x] Document why Firebase Admin v14 and Expo 57 require planned upgrade work instead of forced audit fixes.

### Task 4: Verification

**Commands:**
- [ ] `npm run type-check`
- [ ] `npm run test:run`
- [ ] `npm run build`
- [ ] `cd functions; npm run build`
- [ ] `cd ../nimex-mobile; npm run type-check`
- [ ] Audit scripts where network access is available.
