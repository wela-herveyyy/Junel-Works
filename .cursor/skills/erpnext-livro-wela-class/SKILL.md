---
name: erpnext-livro-wela-class
description: >-
  Explain and trace Wela/Silid BED class setup — teacher and student assignment,
  Sectioning, Class List, prerequisites, and DocType flow. Query Livro eLibrary
  manuals via MCP. Use when the user asks about class lists, sectioning, how
  teachers or students get assigned to classes, Silid LMS class setup, or Livro
  eLibrary enrollment guides.
---

# Wela / Silid BED — Class assignment

Answer questions about **how teachers and students land on a class list** in Livro Wela (Frappe V15) and Silid LMS v3. Ground answers in MCP results and official **Livro eLibrary** guides — do not invent field names or workflows.

## Terminology

| Term | Meaning |
| ---- | ------- |
| **Livro eLibrary** | Internal **documentation** DocType on Livro ERP (`Livro eLibrary`). Manuals/PRDs — not the roster itself. |
| **Class List** | Admin UI for creating **subject classes** (title, school year, subject, teacher). |
| **`Class` DocType** | Wela homeroom record, e.g. `SY2026-2027 @ Grade 1 - Faith Cypress` — keyed by school year + section + level. |
| **Sectioning** | Links an **Enrollee** to a **Section** for a school year — primary path for **students** into a class. |
| **Teacher List** | Master teacher record linked to a **User** — prerequisite for assigning teachers on Class List / schedules. |

## DocType chain (BED enrollment)

```
Pre Enrollees → Enrollees → Sectioning → Class
```

Supporting setup: **School Year**, **Level**, **Section**, **Subject**, **Room**, **User**, **Teacher**.

College uses parallel names (`College Enrollees`, `College Sectioning`, `College Classes`) — see [elibrary.md](elibrary.md).

## Prerequisites (Silid V3 class setup)

Before **Class List** setup, all of the following must exist:

1. **Teacher account** — User (+ Teacher role) → **Teacher List** record
2. **Student account** — **Enrollees** record (+ linked User)
3. **Sectioning** — student assigned to a **Section** for the active **School Year**
4. **School Year** on class/sectioning must match **school settings**

Optional but common: **Silid Setup** + API keys, **Subject**, **Room**, **Class Scheduler** app.

## How teachers get assigned

Teachers are **not** auto-added from Sectioning. Assignment is explicit:

| Mechanism | Where | Basis |
| --------- | ----- | ----- |
| **Class List** | Admin → Class List | Pick **Teacher** per **Subject** on the class |
| **Class Schedule** | Class record → Class Schedule table | Per row: Subject, Teacher, Day, Period, Schedule |
| **Class Scheduler app** | Apps → Class Scheduler → BED | Auto-generate or drag slots; assigns teacher + subject + room + time |
| **Class.teacher** | `Class` DocType field | Homeroom **adviser** (optional; separate from subject teachers) |

**Basis:** teacher must exist in **Teacher List**, which requires a **User** created first with appropriate roles.

## How students get assigned

Students enter classes **indirectly** via sectioning — not by adding rows on Class List in the Silid guide.

| Step | DocType / UI | Required fields |
| ---- | ------------ | --------------- |
| 1 | **Enrollees** (or accept **Pre Enrollees**) | Incoming level, student + guardian details |
| 2 | **Sectioning** (individual) or **Batch Sectioning** | School Year, Enrollee, **Section** |
| 3 | **Class** | Matches **School Year + Section** (+ level); students inherit via section membership |

**Batch Sectioning:** filter by Level + School Year, then assign each enrollee to a section.

## Recommended setup order

1. Master data: School Department, Level, Section, Subject, Room  
2. Users → **Teacher List**  
3. **Enrollees**  
4. **Batch Sectioning** / **Sectioning**  
5. **Class List** and/or **Class Scheduler**  
6. Validate: log in as teacher/student → Apps → **Silid LMS**

## MCP workflow

1. **`get_user_profile`** — confirm Site URL and user (Junel sends `X-ERPNext-URL` per session).
2. **Process / “how do I…” questions** → query **`Livro eLibrary`** on Livro ERP:
   - `get_documents` with `filters: { title: ["like", "%class%"] }` or known IDs from [elibrary.md](elibrary.md)
   - `get_document` on `Livro eLibrary` / `{id}` for full guide HTML in `description`
3. **Live school data** → query the **signed-in school site** (not Livro central unless that is the Site):
   - `get_doctype_schema` for `Class`, `Sectioning`, `Enrollees`, `Teacher` (refresh if empty)
   - `get_documents` / `get_document` on those DocTypes
4. **Links:**
   - eLibrary articles: `https://erp.livro.systems/app/livro-elibrary/{id}` (documentation host)
   - School desk records: `{Site}/app/{doctype-slug}/{name}` from agent context **Site**

## Common intents

| User asks | Approach |
| --------- | -------- |
| Prerequisites for class setup | Cite Silid V3 class guide chain; link eLibrary IDs in [elibrary.md](elibrary.md) |
| How to section students | **Sectioning** / **Batch Sectioning**; school year must match settings |
| Why teacher/student can't see Silid class | Check Teacher List, Sectioning, Class List subjects, Silid Setup |
| Difference eLibrary vs Class | eLibrary = docs; Class / Sectioning = operational data |
| `/app/class/SY…` URL | Wela **`Class`** homeroom record (school year @ section) |

## Boundaries

- Do not confuse **Livro eLibrary** (docs) with **Elibrary** (digital books product) — different modules.
- Do not hardcode `erp.livro.systems` for **school** desk links; use signed-in Site.
- eLibrary **article** links always live on `erp.livro.systems`.
- If school DocType queries fail with `PermissionError`, say which role/site is needed — do not guess roster contents.

## Key eLibrary articles

See [elibrary.md](elibrary.md) for IDs, titles, and deep links.

## Related automation skills

| Skill | Use |
| ----- | --- |
| `erpnext-silid-v3-prod-class` | Live school — real enrollees, sectioning, Class List via MCP |
| `erpnext-silid-v3-qa-class` | QA/demo sites only — fake `qa-*` test data |
| `erpnext-silid-get-classes` | Fetch classes via `get_classes` API; debug empty Silid lists |
