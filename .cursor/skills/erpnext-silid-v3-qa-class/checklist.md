# QA verification checklist

Run after MCP provisioning. All checks should pass before handing off to QA testers.

## Data integrity (MCP)

- [ ] **School year** identical on Sectioning, Class, Teacher (if year-scoped), and school settings
- [ ] **Section** on Sectioning matches Class `section` / title
- [ ] **Teacher** on Class (or subject child row) links to existing Teacher List record
- [ ] **Enrollee** on Sectioning exists and status allows enrollment (not withdrawn)
- [ ] No duplicate Sectioning for same enrollee + school year (unless site allows)

## Desk links (use Site from context)

Replace `{site}` and encode names for URLs.

- [ ] Enrollee: `{site}/app/enrollees/{name}`
- [ ] Sectioning: `{site}/app/sectioning/{name}`
- [ ] Class: `{site}/app/class/{name}`
- [ ] Teacher: `{site}/app/teacher/{name}`

## Silid v3 (manual)

- [ ] **Silid Setup** DocType filled (school code, API keys) if LMS sync required on site
- [ ] Demo teacher User has password set
- [ ] Demo student User has password set
- [ ] Teacher login → Apps → **Silid LMS** → sees target class/subject
- [ ] Student login → Apps → **Silid LMS** → sees same class
- [ ] Optional: create a test **post** or **material** activity in Silid to confirm write path

## Failure triage

| Fail step | Likely fix |
| --------- | ---------- |
| MCP create fails | Schema refresh; missing mandatory field; wrong role |
| Sectioning OK, Silid empty | Class List missing subject+teacher; Silid API |
| Teacher sees class, student not | Sectioning not saved or wrong section vs class |
| Neither sees class | Wrong school year; Silid Setup; wrong Site URL in Junel |

## Cleanup (only when user asks)

Do not delete unless explicitly requested. Prefer disabling demo users or marking enrollee withdrawn per site process.
