# Production verification checklist

Complete before telling registrar/teachers/students to use Silid.

## Pre-write (gate)

- [ ] User confirmed **production** write on correct **Site URL**
- [ ] **School year** read from school settings — not assumed
- [ ] **Section** and **Subject** are existing master records
- [ ] Student identity verified (correct enrollee, not duplicate)
- [ ] Billing/matriculation gate cleared if school requires it

## Post-write (MCP)

- [ ] **Sectioning** exists: enrollee + school year + section
- [ ] **Class** has subject + teacher (or child row) for same section/year
- [ ] **Teacher List** links to correct User
- [ ] No duplicate Sectioning for same enrollee + year (unless intentional)

## Silid LMS

- [ ] **Silid Setup** configured on site (API keys) if sync required
- [ ] Teacher can open **Apps → Silid LMS** and see class
- [ ] Student can open **Apps → Silid LMS** and see class
- [ ] School year on all records matches enrollment settings

## Registrar comms

- [ ] Enrollee desk link shared if follow-up needed
- [ ] Reminder: portal login may have been SMS’d on applicant accept
- [ ] Password reset path documented if new User created

## Audit trail

Document in reply:

- Records **created** vs **updated** vs **unchanged**
- Who requested the change (profile user)
- Timestamp (conversation date)

## When to escalate to desk only

- Applicant accept with SMS/compliance workflow
- Batch sectioning of full grade level
- Billing disputes or matriculation errors
- Withdrawal / transfer between sections mid-year (policy-dependent)

Do not use MCP to bypass these when desk is the system of record.
