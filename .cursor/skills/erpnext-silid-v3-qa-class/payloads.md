# MCP payload templates (Silid V3 QA)

Replace placeholders after `get_doctype_schema` confirms field names. Use `verbose: true` on creates when debugging.

## Discover active school year

```json
{
  "doctype": "School Year",
  "fields": ["name", "year", "is_current"],
  "limit": 5
}
```

If no `is_current`, use the value from **School Settings** / **General Settings** enrollment tab (site-specific DocType — schema first).

## Section (create if missing)

```json
{
  "doctype": "Section",
  "data": {
    "section_name": "Grade 1 - QA Demo",
    "level": "Grade 1"
  }
}
```

## Subject (create if missing)

```json
{
  "doctype": "Subject",
  "data": {
    "subject_code": "QA-MATH",
    "subject_name": "QA Mathematics",
    "level": "Grade 1"
  }
}
```

Add boolean/flag fields required by site (e.g. show in report, include in averaging) per schema sample.

## User — demo teacher

```json
{
  "doctype": "User",
  "data": {
    "email": "qa-teacher-demo@test.local",
    "first_name": "QA",
    "last_name": "Teacher",
    "send_welcome_email": 0,
    "roles": [{ "role": "Teacher" }]
  }
}
```

Add other roles the site requires (e.g. `Wela Teacher`, `Student` must **not** be on teacher user).

## Teacher List

```json
{
  "doctype": "Teacher",
  "data": {
    "user": "qa-teacher-demo@test.local",
    "first_name": "QA",
    "last_name": "Teacher",
    "school_year": "SY2026-2027"
  }
}
```

Use link **`name`** returned from create (or `user` field value) in Class payload.

## Enrollees — demo student

Minimum set from Silid guide; extend per schema:

```json
{
  "doctype": "Enrollees",
  "data": {
    "incoming_level": "Grade 1",
    "first_name": "QA",
    "last_name": "Student",
    "birthdate": "2018-01-15",
    "guardian_first_name": "QA",
    "guardian_last_name": "Guardian",
    "guardians_phone_number": "09000000000",
    "in_case_of_emergency": "Guardian"
  }
}
```

## Sectioning

```json
{
  "doctype": "Sectioning",
  "data": {
    "school_year": "SY2026-2027",
    "enrollee": "<enrollee_document_name>",
    "section": "Grade 1 - QA Demo"
  }
}
```

## Class List (subject class)

Homeroom-style naming:

```json
{
  "doctype": "Class",
  "data": {
    "title": "SY2026-2027 @ Grade 1 - QA Demo",
    "school_year": "SY2026-2027",
    "section": "Grade 1 - QA Demo",
    "level": "Grade 1",
    "subject": "QA Mathematics",
    "teacher": "<teacher_document_name>"
  }
}
```

If schema uses a **child table** for subjects instead of top-level `subject`/`teacher`, build rows from sample document:

```json
{
  "doctype": "Class",
  "data": {
    "title": "SY2026-2027 @ Grade 1 - QA Demo",
    "school_year": "SY2026-2027",
    "section": "Grade 1 - QA Demo",
    "level": "Grade 1",
    "subjects": [
      {
        "subject": "QA Mathematics",
        "teacher": "<teacher_document_name>"
      }
    ]
  }
}
```

Child table key (`subjects`, `class_subjects`, etc.) **must** match schema — never invent.

## Class Schedule row (optional)

Append to existing Class via `update_document`:

```json
{
  "doctype": "Class",
  "name": "<class_name>",
  "data": {
    "class_schedule": [
      {
        "schedule": "8:00 AM - 9:00 AM",
        "period": "1",
        "subject": "QA Mathematics",
        "teacher": "<teacher_document_name>",
        "day": "Monday"
      }
    ]
  }
}
```

Table field name varies — confirm on schema.

## Idempotent reuse queries

Before create, search:

```json
{
  "doctype": "Enrollees",
  "fields": ["name", "first_name", "last_name"],
  "filters": { "last_name": "Student", "first_name": "QA" },
  "limit": 5
}
```

```json
{
  "doctype": "Teacher",
  "fields": ["name", "user"],
  "filters": { "user": "qa-teacher-demo@test.local" },
  "limit": 1
}
```

```json
{
  "doctype": "Class",
  "fields": ["name", "title", "school_year", "section"],
  "filters": {
    "school_year": "SY2026-2027",
    "section": "Grade 1 - QA Demo"
  },
  "limit": 5
}
```

Reuse existing QA records when re-running demo setup.
