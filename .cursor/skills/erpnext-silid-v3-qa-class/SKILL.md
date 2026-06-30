---
name: erpnext-silid-v3-qa-class
description: >-
  Provision Silid LMS v3 BED QA demo data — create teacher and student accounts,
  section enrollees, and Class List records via erpnext MCP. Use when the user
  asks to set up, seed, or auto-assign teachers and students to a class for QA,
  demo, UAT, or testing on a Wela school site.
---

# Silid V3 — QA class demo setup

**Goal:** On a **school ERP site** (signed-in Site from Junel context), create the minimum Wela records so a **demo teacher** and **demo student** appear in **Silid LMS** for the target class/section.

For *why* assignment works (not automation), use skill **`erpnext-livro-wela-class`**.

**Automation:** QA/demo → `erpnext-silid-v3-qa-class`. Production/live → `erpnext-silid-v3-prod-class`.

## Hard rules

- **Only** the `erpnext` MCP server (`create_document`, `update_document`, `get_documents`, `get_doctype_schema`, `get_document`).
- **`get_user_profile`** first — confirm **Site URL**; all writes go to that site via `X-ERPNext-URL`.
- **`get_doctype_schema`** with `refresh: true` before first write on each DocType — do not guess field names.
- **QA-only:** prefix demo identities with `qa-` (emails, names, section suffix). Never overwrite production enrollees/teachers without explicit user approval.
- **Confirm once** before creating: list Site, school year, section, subject, teacher email, student email.
- **Do not** run Class Scheduler or Silid API sync unless user asks — Class List + Sectioning is enough for most Silid v3 QA.
- On `PermissionError`, stop and tell user which role is needed (Registrar / School Admin).

## Inputs to collect (minimal)

Ask only if not inferable from MCP:

| Input | Default discovery |
| ----- | ----------------- |
| **School year** | Match active year in school settings or latest `School Year` record |
| **Section** | Existing section name, or create `Grade N - QA Demo` |
| **Level** | From section / incoming level |
| **Subject** | First subject for that level, or user picks |
| **Teacher email** | `qa-teacher-{slug}@demo.test` |
| **Student email** | `qa-student-{slug}@demo.test` |

Optional: homeroom **`Class`** name pattern `{school_year} @ {section}`.

## Execution checklist

Copy and track:

```
QA class demo progress:
- [ ] 0. Preflight — Site, schemas, active school year
- [ ] 1. Master data — Section, Subject (if missing)
- [ ] 2. Teacher — User + Teacher List
- [ ] 3. Student — Enrollees (+ User if not auto-created)
- [ ] 4. Sectioning — enrollee → section
- [ ] 5. Class List — subject + teacher (+ optional schedule)
- [ ] 6. Validate — MCP read-back + Silid login steps
```

### 0. Preflight

1. `get_user_profile` — note Site URL.
2. `get_doctype_schema` (`refresh: true`) for: `Enrollees`, `Sectioning`, `Teacher`, `Class`, `Subject`, `Section`.
3. Resolve **active school year** — query school settings DocType if present, else `get_documents` on `School Year` (latest / user value).
4. `get_documents` — check section and subject exist; reuse before creating duplicates.

### 1. Master data (skip if exists)

Create only when missing. Payload patterns: [payloads.md](payloads.md).

- **Section** — name like `Grade 1 - QA Demo`, linked level
- **Subject** — code + name + level; enable report/averaging flags per site schema

### 2. Demo teacher

Order matters: **User → Teacher List**.

1. `create_document` **User** — email, first/last name, roles include **Teacher** (and desk access roles the site requires).
2. `create_document` **Teacher** — link `user`, names, contact, **school year** if required by schema.
3. Note teacher **`name`** (link target for Class List).

Tell user to set password via desk **User → Settings → Change Password** if MCP cannot set it.

### 3. Demo student

1. `create_document` **Enrollees** — incoming level, student + guardian fields per schema (use QA placeholder guardian phone/email).
2. If Enrollee does not auto-create User, create **User** with **Student** role linked per site convention (`get_document` on a sample enrollee if unsure).

### 4. Sectioning (student → class roster basis)

Students reach Class List **via section**, not by adding them on the class form.

**Individual:**

```json
{
  "doctype": "Sectioning",
  "data": {
    "school_year": "<active_school_year>",
    "enrollee": "<enrollee_name>",
    "section": "<section_name>"
  }
}
```

**Batch:** create/open **Batch Sectioning** for level + school year, assign section to the QA enrollee (desk or MCP per schema).

Verify with `get_documents` filtering `Sectioning` by enrollee.

**Submit Sectioning** (`submit_document`) so student Silid queries see `docstatus == 1`.

### 5. Class + Class Schedule (Silid BED path)

Silid **`get_classes`** reads **Class Schedule** child rows — see `erpnext-silid-get-classes`.

```json
{
  "doctype": "Class",
  "data": {
    "title": "<class_title>",
    "school_year": "<active_school_year>",
    "section": "<section_name>",
    "level": "<level>",
    "class_schedule": [
      {
        "subject": "<Subject.name>",
        "teacher": "<Teacher.name>",
        "schedule": "8:00 AM - 9:00 AM",
        "period": "1",
        "day": "Monday"
      }
    ]
  }
}
```

Child table key from `get_doctype_schema`.

### 6. Validate

**Silid API** — `call_method` `get_classes` for teacher and student emails ([api.md](../erpnext-silid-get-classes/api.md)).

**MCP read-back:**

- `get_document` on Sectioning, Class, Teacher, Enrollees
- Confirm school year matches across all four

**Manual Silid QA (report to user):**

1. Log in as demo **teacher** → User menu → **Apps** → **Silid LMS** — class/subject visible
2. Log in as demo **student** → same path — class visible
3. If missing: check **Silid Setup** + API key ([uje1lpjq6e](https://erp.livro.systems/app/livro-elibrary/uje1lpjq6e)), sectioning saved, Class List subject row saved

## Response template

After run, reply with:

```markdown
## QA demo ready

**Site:** {site}
**School year:** {year} · **Section:** {section}

| Role | Email | ERP record |
| ---- | ----- | ---------- |
| Teacher | … | Teacher … |
| Student | … | Enrollee … |

**Class:** [{title}]({site}/app/class/{encoded_name})
**Sectioning:** {sectioning_name}

### Test
1. Set passwords on both Users (if not done).
2. Teacher + Student → Apps → Silid LMS.
3. …

### Created / updated
- …
```

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| Student not in Silid | Sectioning **submitted** (docstatus 1)? Class Schedule rows? |
| Teacher not in Silid | Class Schedule.teacher → Teacher.user = email? |
| Empty Class List | Subject field on Class vs child table — read schema |
| PermissionError | User needs Registrar / System Manager on school site |
| Wrong site data | Junel `X-ERPNext-URL` must be the QA school, not Livro central |

## References

- Payload templates: [payloads.md](payloads.md)
- Verification script: [checklist.md](checklist.md)
- Process docs: skill `erpnext-livro-wela-class` / [elibrary.md](../erpnext-livro-wela-class/elibrary.md)
- Fetch classes API: skill `erpnext-silid-get-classes`
