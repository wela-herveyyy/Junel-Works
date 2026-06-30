---
name: erpnext-silid-get-classes
description: >-
  Fetch Silid LMS v3 classes via get_classes and get_classes_subject_details
  whitelisted APIs through erpnext MCP call_method. Explains BED/SHS/College query
  logic and what Sectioning, Class Schedule, and Teacher records must exist for
  students and teachers to appear. Use when fetching a user's classes, debugging
  empty Silid class lists, or assigning teachers/students to match Silid queries.
---

# Silid LMS — fetch classes & assignment basis

Silid resolves **which classes a user sees** in ERP via whitelisted Python APIs (not raw Class List alone). Use **`call_method`** on the signed-in **school Site**.

Related skills:
- **Assign (prod):** `erpnext-silid-v3-prod-class`
- **Assign (QA):** `erpnext-silid-v3-qa-class`
- **Process docs:** `erpnext-livro-wela-class`

## Hard rules

- **Only** `erpnext` MCP — primarily `call_method`, plus `get_user_profile`, `get_document`, `submit_document` when fixing data.
- **`get_user_profile`** first — use `profile.erpnextUser` or `profile.workEmail` as `email` arg (Frappe **User.name** is typically email).
- **`role`** must be exactly `"student"` or `"teacher"` (lowercase) for `get_classes`.
- Derive role from Frappe User roles on the school site (see **Role mapping** below).
- Resolve **method dotted path** on the site before calling — see [api.md](api.md).
- Ground answers in **API response** `{ success, message, data, error? }` — do not invent class rows.
- **School year** in queries comes from `SchoolYearRepository.current_school_year()` — assignment must match that year.

## API overview

| Method | Args | Returns |
| ------ | ---- | ------- |
| `get_classes` | `email`, `role` | List of class rows for user (current school year) |
| `get_classes_subject_details` | `className`, `subjectCode?` | Rows for one class (+ optional subject filter) |

### Response row shape

```json
{
  "subjectName": "Mathematics 7",
  "subjectCode": "MATH7",
  "department": "Junior High School",
  "level": "Grade 7",
  "teacher": "EMP-2024-001",
  "className": "CLS-2024-00042",
  "sectionName": "St. Francis"
}
```

Deduped by `subjectCode` in API.

## Role mapping (Wela / SMS sites)

Frappe User roles on school sites use these names (case-insensitive exact match):

| Frappe role | `get_classes` `role` |
| ----------- | -------------------- |
| Student K12 | `"student"` |
| Student | `"student"` |
| College Teacher | `"teacher"` |
| Faculty | `"teacher"` |
| College Faculty | `"teacher"` |

**How to determine:**

1. Load roles via `get_user_profile` / session `erpnext.roles` / `frappe.core.doctype.user.user.get_roles`.
2. If any **student** row in table → `role: "student"`.
3. Else if any **teacher** row → `role: "teacher"`.
4. Else check **Teacher** / **Student** DocType linked to User email.
5. If still unknown, ask the user — do not guess.

Junel code: `classifySchoolRole()` / `silidClassesRole()` in `lib/erpnext/branding.ts`.

**Note:** `Student K12` / `Student` → BED/SHS queries first, then college fallback inside `get_classes`. `College Teacher` / `College Faculty` → college teacher path when BED/SHS empty.

## Fetch workflow

```
1. get_user_profile → email, Site URL
2. call_method get_classes(email, role)
3. If data[] empty → diagnose with assignment-rules.md (BED → SHS → College order)
4. Optional: get_classes_subject_details(className, subjectCode) for one class
5. Report success/message + table of data; link Class records on Site
```

### Example `call_method`

Replace `<dotted_path>` after discovery in [api.md](api.md):

```json
{
  "method": "<dotted_path>.get_classes",
  "args": {
    "email": "teacher@school.edu",
    "role": "teacher"
  },
  "http_method": "POST"
}
```

```json
{
  "method": "<dotted_path>.get_classes_subject_details",
  "args": {
    "className": "SY2026-2027 @ Grade 1 - Faith Cypress",
    "subjectCode": "MATH7"
  },
  "http_method": "POST"
}
```

## Resolution order (matches server code)

`get_classes` tries in order:

| Step | Track | When |
| ---- | ----- | ---- |
| 1 | **BED** | `get_classes_bed` |
| 2 | **SHS** | `get_classes_shs` (appended) |
| 3 | **College** | `get_classes_college` only if BED+SHS empty |

Same pattern for `get_classes_subject_details`: BED → SHS specialized → College.

## Assign teacher / student (must satisfy queries)

Full join diagrams: [assignment-rules.md](assignment-rules.md).

### Student sees a BED class when ALL true

| Requirement | DocType / field |
| ----------- | --------------- |
| Current school year | `Class.school_year` == `Sectioning.school_year` == active year |
| **Submitted sectioning** | `Sectioning.docstatus == 1` |
| Same section | `Sectioning.section == Class.section` |
| Enrollee linked | `Sectioning.enrollee` → **Enrollees** |
| Student linked | `Enrollees.id_number` → **Student** |
| User linked | `Student.user` or `Student.name` == **User.name** == `email` |
| Schedule row exists | **Class Schedule** child on **Class**: `subject`, `teacher` |
| Subject metadata | **Subject** joined on schedule |

**Prod fix checklist:** Sectioning → **Submit**; Class Schedule row; verify with `get_classes`.

### Teacher sees a BED class when ALL true

| Requirement | DocType / field |
| ----------- | --------------- |
| Current school year | `Class.school_year` == active year |
| Schedule assignment | **Class Schedule**.`teacher` → **Teacher**.`name` |
| User linked | **Teacher**.`user` == `email` |
| Class + section | Schedule parent **Class**; **Section** for dept/level |

**Prod fix:** Add/update **Class Schedule** row with correct **Teacher** link (not just Class List top-level teacher field if Silid reads schedule table).

### SHS (specialized subjects)

Uses **Specialized Subjects Child** on **Class** (not Class Schedule):

- **Student:** same Sectioning rules (`docstatus == 1`) + child row on class
- **Teacher:** `SpecializedSubjectsChild.teacher` → **Teacher** where `Teacher.user == email`

### College

Separate DocTypes: **College Classes**, **College Class Student**, **College Sectioning**, **College Faculty**, etc.

- **Student:** enrolled via **College Class Student** on class, or fallback **matriculation** API
- **Teacher:** `CollegeClasses.adviser` → **College Faculty** where `CollegeFaculty.user == email`, or matriculation fallback

## Diagnose empty `data[]`

| role | Check |
| ---- | ----- |
| student | Sectioning **submitted**? Same section as Class? Student→User email match? |
| student | BED: Class Schedule rows exist? SHS: Specialized Subjects Child rows? |
| teacher | Class Schedule (BED) or Specialized Subjects Child (SHS) has **Teacher** link? |
| teacher | `Teacher.user` == email (not just User exists)? |
| both | Active **school year** in settings matches Class/Sectioning |
| college | Try matriculation path; semester/year from `get_college_term` |

After data fixes, re-run `get_classes` to confirm.

## MCP data fixes (production)

Use skill **`erpnext-silid-v3-prod-class`** for writes. Critical Silid-specific steps:

1. **Sectioning** — create then **`submit_document`** on Sectioning (student BED/SHS requires `docstatus == 1`)
2. **Class Schedule** — `update_document` on **Class** with child table from schema (BED teachers/students)
3. **Specialized Subjects Child** — for SHS tracks
4. Re-fetch with `get_classes`

## Response template

```markdown
## Classes for {email} ({role})

**Site:** {site} · **API:** {success}

| Subject | Code | Section | Class | Teacher |
| ------- | ---- | ------- | ----- | ------- |
| … | … | … | … | … |

**Count:** {n} (deduped by subject code)

### If empty
- … (specific missing join from assignment-rules.md)

### Desk links
- Class: {site}/app/class/{name}
```

## References

- Method paths & HTTP: [api.md](api.md)
- Join logic & DocType constants: [assignment-rules.md](assignment-rules.md)
