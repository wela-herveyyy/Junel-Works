# Production BED workflows

Official order from Wela BED enrollment module (`erpnext-livro-wela-class`):

```
Pre Enrollees → Enrollees → Sectioning → Class
```

Teachers: `User → Teacher List → Class List (subject + teacher)`

---

## A. Assign existing enrollee to section

Use when student is already in **Enrollees** for the active school year.

1. `get_documents` **Enrollees** — filter by name or ID + school year.
2. Confirm **incoming level** matches target **Section**.
3. Check billing/matriculation if school requires it before sectioning.
4. Query **Sectioning** for `(enrollee, school_year)`:
   - **None** → `create_document` Sectioning
   - **Exists, wrong section** → `update_document` only if user confirmed move
5. Verify **Class** exists for `{school_year} @ {section}` or will be created in step C.

---

## B. New student — from applicant (registrar)

From [Accepting the Student Applicant](https://erp.livro.systems/app/livro-elibrary/fv3m98qqf6):

1. `get_documents` **Pre Enrollees** — find applicant.
2. Accept via desk is preferred for production (triggers SMS credentials). If MCP-only:
   - Use `call_method` only for whitelisted accept APIs if exposed on site — otherwise **stop** and tell registrar to accept in desk.
3. After accept → **Enrollees** record exists — continue workflow A step 4.

**Do not** fabricate Pre Enrollee accept if desk workflow is required for SMS/compliance.

---

## C. New student — manual enrollee (registrar)

From [How to create BED student account for Silid V3](https://erp.livro.systems/app/livro-elibrary/i4r2phnr4e):

1. Collect real **Enrollment Details** + **Student Details** + guardian fields from user.
2. `create_document` **Enrollees** — all mandatory schema fields.
3. User/password: desk **Change Password** on linked User.
4. Continue workflow A step 4 (sectioning).

---

## D. Assign teacher to class (subject)

From [How to setup BED class for Silid V3](https://erp.livro.systems/app/livro-elibrary/tdishn5bug):

1. Confirm **Teacher List** record for the user (`get_documents` by `user` email).
2. Find **Class** for section + school year:
   ```json
   {
     "doctype": "Class",
     "filters": { "school_year": "<year>", "section": "<section>" },
     "fields": ["name", "title", "section", "school_year"],
     "limit": 5
   }
   ```
3. **Update** class with subject + teacher (schema-driven child table or fields).
4. If no class row exists and user approved create — `create_document` **Class** then assign.

Prerequisites already on site: teacher account, student sectioned, school year in settings.

---

## E. Batch sectioning (start of term)

From [How to section BED students in Frappe V15](https://erp.livro.systems/app/livro-elibrary/dmjmok7us6):

1. **Batch Sectioning List** — level + school year (must match settings).
2. For each enrollee at that level, assign **Section**.
3. Save batch.
4. Then run workflow D per section/subject as needed.

For large batches, prefer desk UI; MCP for targeted fixes or single enrollee moves.

---

## F. Billing gate (site-dependent)

Some schools block sectioning until matriculation/billing is complete.

Before sectioning:

1. Check site docs or ask user if billing is required.
2. Query enrollee matriculation / ledger DocTypes if schema exists (`Student Matriculation`, etc.).
3. If unpaid / no ledger and school policy requires it — **stop** and list registrar next step.

Do not bypass billing gates on production.

---

## G. Class schedule (optional)

From [Class Schedule](https://erp.livro.systems/app/livro-elibrary/kjgse4fu2l):

After Class List has subject + teacher, append **Class Schedule** rows (time, period, day, teacher, subject) via `update_document`.

Or use **Class Scheduler** app for bulk scheduling — only when user requests; not required for basic Silid visibility.

---

## College (different DocTypes)

Use college names from [elibrary.md](../erpnext-livro-wela-class/elibrary.md):

- College Applicant → College Enrollees → College Sectioning → College Classes

Same production gate and real-data rules; refresh schemas for `College *` DocTypes.
