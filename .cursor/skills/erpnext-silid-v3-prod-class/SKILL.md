---
name: erpnext-silid-v3-prod-class
description: >-
  Assign real teachers and students to Silid LMS v3 BED classes on live Wela
  school sites via erpnext MCP — admission, enrollees, sectioning, and Class
  List. Use for production enrollment, registrar workflows, live sectioning, or
  assigning staff to classes on a real school ERP (not QA/demo).
---

# Silid V3 — Production class assignment

**Goal:** On a **live school ERP site**, correctly link **real teachers** and **real students** to classes so they appear in **Silid LMS** — following Wela BED enrollment order and registrar controls.

- **Process reference:** skill `erpnext-livro-wela-class`
- **Fetch / verify Silid classes:** skill `erpnext-silid-get-classes`
- **Demo/test sites only:** skill `erpnext-silid-v3-qa-class` — **never** use QA skill on production.

## Hard rules

- **Only** `erpnext` MCP (`get_user_profile`, `get_doctype_schema`, `get_documents`, `get_document`, `create_document`, `update_document`). No shell scripts.
- **`get_user_profile`** first — all writes use signed-in **Site** (`X-ERPNext-URL`).
- **`get_doctype_schema`** with `refresh: true` before any write on a DocType.
- **Production gate (mandatory):** Before any write, show the user and get explicit approval:
  - Full **Site URL**
  - **School year** (must match school settings)
  - **Action summary** (who/what will be created or updated)
  - User confirms this is **production / live** data
- **Real data only** — names, emails, guardian contacts from user or existing ERP records. No `qa-`, `@demo.test`, or placeholder guardians.
- **Prefer link over create** — search existing Enrollees, Teacher, Sectioning, Class before creating.
- **Do not auto-create** master data (Section, Subject, Level, School Year) on production unless user explicitly requests and confirms.
- **Enrollment order** — do not section before enrollee exists; do not skip billing if site requires matriculation (see [workflows.md](workflows.md)).
- **Do not delete or withdraw** enrollees/classes unless user explicitly asks.
- On `PermissionError`, stop — production changes need **Registrar** / **School Admin** / **System Manager**.

## Who does what (typical)

| Step | Role |
| ---- | ---- |
| Accept applicant → Enrollee | Registrar |
| Sectioning / batch sectioning | Registrar |
| Teacher User + Teacher List | School Admin / HR |
| Class List (subject + teacher) | School Admin / Academic coordinator |
| Silid Setup / API | IT / DCMU (one-time per site) |

## Inputs (collect from user or ERP)

| Input | Source |
| ----- | ------ |
| **School year** | School settings (authoritative) — must match all records |
| **Student** | Existing Enrollee name/ID, or applicant to accept |
| **Section** | Existing **Section** record only |
| **Teacher** | Existing **Teacher List** record or User email to onboard |
| **Subject(s)** | Existing **Subject** for level |
| **Class** | Existing homeroom `Class` or new subject row per Silid guide |

## Production checklist

```
Production class assignment:
- [ ] 0. Gate — Site, school year, user approval
- [ ] 1. Preflight — settings, schemas, records exist
- [ ] 2. Student path — Enrollee ready (+ billing if required)
- [ ] 3. Sectioning — enrollee → section (individual or batch)
- [ ] 4. Teacher path — Teacher List ready
- [ ] 5. Class — **Class Schedule** (BED) or **Specialized Subjects Child** (SHS) + teacher links
- [ ] 6. Silid verify — `submit_document` Sectioning + `get_classes` API
- [ ] 7. Handoff — portal/SMS comms
```

### 0. Production gate

State clearly:

```markdown
**Production write preview**
- Site: {url}
- School year: {year} (from settings: {source})
- Student: {name or "new from applicant X"}
- Section: {section}
- Teacher: {teacher} → Subject: {subject}
- Actions: [create Sectioning | update Class | create Teacher | …]

Confirm to proceed on this live site.
```

Stop if user does not confirm.

### 1. Preflight

1. Resolve **current school year** from enrollment/school settings (not guessed from latest `School Year` row alone).
2. Refresh schemas: `Enrollees`, `Pre Enrollees`, `Sectioning`, `Batch Sectioning`, `Teacher`, `Class`, `Subject`, `Section`.
3. Verify **Section** and **Subject** exist — if missing, tell user to create via desk first (link eLibrary sectioning guide).
4. Verify **Silid Setup** if student/teacher cannot see LMS after assignment ([uje1lpjq6e](https://erp.livro.systems/app/livro-elibrary/uje1lpjq6e)).

### 2. Student path (production)

Pick one path — details in [workflows.md](workflows.md):

| Case | Flow |
| ---- | ---- |
| **Continuing student** | Find **Enrollees** for active school year → proceed to sectioning |
| **New from portal** | **Pre Enrollees** → accept → **Enrollees** ([fv3m98qqf6](https://erp.livro.systems/app/livro-elibrary/fv3m98qqf6)) |
| **New manual** | Create **Enrollees** with complete real guardian data ([i4r2phnr4e](https://erp.livro.systems/app/livro-elibrary/i4r2phnr4e)) |

Before sectioning:

- Confirm enrollee **incoming level** matches target section level.
- If site uses **Student Matriculation** / billing gates, confirm enrollment ledger or payment status per school policy — do not section if registrar says billing must come first.

### 3. Sectioning (student → class roster)

Students join classes **through sectioning**, not by editing Class List roster directly.

**Individual** — [dmjmok7us6](https://erp.livro.systems/app/livro-elibrary/dmjmok7us6):

- `school_year`, `enrollee`, `section` — all must match settings.

**Batch** — for multiple students same level:

- Open/create **Batch Sectioning** for level + school year, assign each enrollee to section, save.

**Idempotent:** query existing Sectioning for `(enrollee, school_year)` — update section only if user asks to move.

**Silid requirement:** **`submit_document` on Sectioning** after save — student `get_classes` queries require `Sectioning.docstatus == 1` (see skill `erpnext-silid-get-classes`).

Payload patterns: [payloads.md](payloads.md).

### 4. Teacher path (production)

1. If teacher already has **User** + **Teacher List** — reuse; skip create.
2. If new hire: **User** (real email, Teacher role + site roles) → **Teacher List** ([mr30rhrtfq](https://erp.livro.systems/app/livro-elibrary/mr30rhrtfq)).
3. Password: user sets via desk or school onboarding — do not share passwords in chat.

Teachers are **not** assigned via sectioning.

### 5. Class + schedule (what Silid actually queries)

Silid **`get_classes`** joins **Class Schedule** (BED) or **Specialized Subjects Child** (SHS) — not desk Class List labels alone.

Per [tdishn5bug](https://erp.livro.systems/app/livro-elibrary/tdishn5bug) + [assignment-rules in erpnext-silid-get-classes](../erpnext-silid-get-classes/assignment-rules.md):

- **Class** for `{school_year} @ {section}` — school year, section, level.
- **BED:** **Class Schedule** child rows: `subject`, `teacher` (= Teacher.name), schedule fields.
- **SHS:** **Specialized Subjects Child** on Class: `specialized_subject`, `teacher`.
- **College:** **College Classes** + **College Faculty**.adviser — separate path.

Use `update_document` when class exists; `create_document` only when confirmed.

### 6. Validate & handoff

**Silid API (required):**

1. `call_method` **`get_classes`** for student email, `role: "student"` — expect rows.
2. `call_method` **`get_classes`** for teacher email, `role: "teacher"` — expect rows.
3. If empty → skill **`erpnext-silid-get-classes`** diagnosis checklist.

**MCP read-back:**

- Enrollee, Sectioning, Teacher, Class — same `school_year` and `section`.

**Production handoff (tell user):**

- Portal credentials may be SMS’d to guardian on accept ([fv3m98qqf6](https://erp.livro.systems/app/livro-elibrary/fv3m98qqf6)).
- Teacher/student: **Apps → Silid LMS** after passwords active.
- Desk links for all touched records (Site from context).

See [checklist.md](checklist.md).

## Response template

```markdown
## Production assignment complete

**Site:** {site} · **School year:** {year}

### Student
- Enrollee: [{name}]({link})
- Sectioning: {section} → [{doc}]({link})

### Teacher
- Teacher: [{name}]({link}) · Subject: {subject}
- Class: [{title}]({link})

### Actions taken
- Created: …
- Updated: …
- Skipped (already correct): …

### Registrar follow-up
- …
```

## Troubleshooting

| Symptom | Production check |
| ------- | ---------------- |
| Student not in Silid | Sectioning **submitted**? Class Schedule + year match? |
| Teacher not in Silid | Class Schedule.teacher link? Teacher.user = email? |
| Empty get_classes | Skill `erpnext-silid-get-classes` assignment-rules |
| Cannot section | Billing/matriculation incomplete? Wrong school year in settings? |
| Duplicate enrollee | Search by name + year before create; use continuing-student link |
| Wrong school | Junel Site URL must be the live school site |

## References

- BED workflows: [workflows.md](workflows.md)
- MCP payloads: [payloads.md](payloads.md)
- Post-run checks: [checklist.md](checklist.md)
- eLibrary index: [../erpnext-livro-wela-class/elibrary.md](../erpnext-livro-wela-class/elibrary.md)
- Silid fetch API: [../erpnext-silid-get-classes/SKILL.md](../erpnext-silid-get-classes/SKILL.md)
