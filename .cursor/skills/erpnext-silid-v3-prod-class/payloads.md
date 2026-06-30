# Production MCP payloads

Always run `get_doctype_schema` (`refresh: true`) on the **school Site** first. Field names below are typical BED V15 — replace with schema truth.

## Resolve school year (authoritative)

Query enrollment/school settings DocType for current year field, then cross-check:

```json
{
  "doctype": "School Year",
  "fields": ["name"],
  "filters": { "name": "<from_settings>" },
  "limit": 1
}
```

## Find existing enrollee (prefer over create)

```json
{
  "doctype": "Enrollees",
  "fields": ["name", "first_name", "last_name", "incoming_level", "school_year"],
  "filters": {
    "last_name": "<last>",
    "first_name": "<first>"
  },
  "limit": 10
}
```

Add `school_year` filter when field exists on Enrollees.

## Find existing sectioning

```json
{
  "doctype": "Sectioning",
  "fields": ["name", "enrollee", "section", "school_year"],
  "filters": {
    "enrollee": "<enrollee_name>",
    "school_year": "<active_school_year>"
  },
  "limit": 1
}
```

## Create sectioning (individual)

Only when no row exists and user approved:

```json
{
  "doctype": "Sectioning",
  "data": {
    "school_year": "<active_school_year>",
    "enrollee": "<enrollee_name>",
    "section": "<existing_section_name>"
  }
}
```

## Update sectioning (move section)

Only when user confirmed move:

```json
{
  "doctype": "Sectioning",
  "name": "<sectioning_name>",
  "data": {
    "section": "<new_section_name>"
  }
}
```

## Find teacher

```json
{
  "doctype": "Teacher",
  "fields": ["name", "user", "first_name", "last_name"],
  "filters": { "user": "<teacher_email>" },
  "limit": 1
}
```

## Create teacher (new hire — user approved)

**User** first:

```json
{
  "doctype": "User",
  "data": {
    "email": "<real_work_email>",
    "first_name": "<first>",
    "last_name": "<last>",
    "send_welcome_email": 0,
    "roles": [{ "role": "Teacher" }]
  }
}
```

Add site-specific roles from a sample teacher User (`get_document` on existing Teacher's user).

**Teacher List:**

```json
{
  "doctype": "Teacher",
  "data": {
    "user": "<real_work_email>",
    "first_name": "<first>",
    "last_name": "<last>",
    "contact_number": "<phone>",
    "school_year": "<active_school_year>"
  }
}
```

## Find class for section

```json
{
  "doctype": "Class",
  "fields": ["name", "title", "section", "school_year", "level"],
  "filters": {
    "school_year": "<active_school_year>",
    "section": "<section_name>"
  },
  "limit": 5
}
```

## Update class — assign subject + teacher

Schema may use top-level fields or child table. Example top-level:

```json
{
  "doctype": "Class",
  "name": "<class_name>",
  "data": {
    "subject": "<subject_name>",
    "teacher": "<teacher_document_name>"
  }
}
```

Example child table (confirm table name from schema):

```json
{
  "doctype": "Class",
  "name": "<class_name>",
  "data": {
    "subjects": [
      {
        "subject": "<subject_name>",
        "teacher": "<teacher_document_name>"
      }
    ]
  }
}
```

Use `verbose: true` on first production write per DocType to verify structure.

## Create enrollee (manual — real data only)

All values from user/registrar — no placeholders:

```json
{
  "doctype": "Enrollees",
  "data": {
    "incoming_level": "<level>",
    "first_name": "<first>",
    "last_name": "<last>",
    "birthdate": "<YYYY-MM-DD>",
    "guardian_first_name": "<g_first>",
    "guardian_last_name": "<g_last>",
    "guardians_phone_number": "<real_phone>",
    "in_case_of_emergency": "Guardian"
  }
}
```

Include every mandatory field from schema sample.

## Class schedule row (optional)

```json
{
  "doctype": "Class",
  "name": "<class_name>",
  "data": {
    "class_schedule": [
      {
        "schedule": "8:00 AM - 9:00 AM",
        "period": "1",
        "subject": "<subject>",
        "teacher": "<teacher_name>",
        "day": "Monday"
      }
    ]
  }
}
```

Table field name from schema.
