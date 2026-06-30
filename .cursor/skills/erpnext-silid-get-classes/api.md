# Silid get_classes — MCP API calls

## Resolve method path

Whitelisted functions: `get_classes`, `get_classes_subject_details`.

The dotted path depends on the site's `silid_lms` app layout. Try in order (POST):

1. `silid_lms.api.class.get_classes`
2. `silid_lms.silid_lms.api.class.get_classes`
3. `silid_lms.api.classes.get_classes`
4. Ask site admin or search app repo for `@frappe.whitelist` on `get_classes`

First success locks the prefix for both methods.

## get_classes

**Args:**

| Arg | Type | Values |
| --- | ---- | ------ |
| `email` | string | Frappe User.name (usually login email) |
| `role` | string | `"student"` or `"teacher"` |

```json
{
  "method": "silid_lms.api.class.get_classes",
  "args": {
    "email": "worldcupteacher@gmail.com",
    "role": "teacher"
  },
  "http_method": "POST"
}
```

**Success:**

```json
{
  "success": true,
  "message": "Classes retrieved successfully",
  "data": [ { "subjectName": "…", "subjectCode": "…", "department": "…", "level": "…", "teacher": "…", "className": "…", "sectionName": "…" } ]
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error retrieving classes",
  "error": "…",
  "data": []
}
```

## get_classes_subject_details

**Args:**

| Arg | Type | Required |
| --- | ---- | -------- |
| `className` | string | Class.name (BED) or CollegeClasses.title (college) |
| `subjectCode` | string | Optional; BED filters Subject.name, college filters CollegeSubjectCode.subject_code |

```json
{
  "method": "silid_lms.api.class.get_classes_subject_details",
  "args": {
    "className": "SY2026-2027 @ Grade 1 - Faith Cypress",
    "subjectCode": "MATH7"
  },
  "http_method": "POST"
}
```

## Direct HTTP (outside MCP)

If debugging in browser (session cookie):

```
POST {Site}/api/method/{dotted_path}.get_classes
Content-Type: application/json

{"email": "…", "role": "student"}
```

Junel agents should use MCP `call_method` with Site from `X-ERPNext-URL`.

## After assignment — verify loop

1. `call_method` `get_classes` for student email, role `student`
2. `call_method` `get_classes` for teacher email, role `teacher`
3. If still empty → [assignment-rules.md](assignment-rules.md) checklist
4. Fix via `erpnext-silid-v3-prod-class` (submit Sectioning, update Class Schedule, etc.)
5. Repeat step 1–2

## submit_document — Sectioning (students)

Student BED/SHS queries require `Sectioning.docstatus == 1`:

```json
{
  "doctype": "Sectioning",
  "name": "<sectioning_name>"
}
```

Use MCP `submit_document` after Sectioning is complete (prod skill gate applies).

## update_document — Class Schedule (BED)

Confirm child table field name via `get_doctype_schema` on **Class** (`refresh: true`):

```json
{
  "doctype": "Class",
  "name": "<class_name>",
  "data": {
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

Field names (`class_schedule`, `day`, etc.) must match site schema.
