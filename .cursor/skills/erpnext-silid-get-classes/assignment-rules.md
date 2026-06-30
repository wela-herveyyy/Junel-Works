# Silid get_classes — assignment rules (from server queries)

Authoritative basis for **who appears in Silid**. Assignment skills must satisfy these joins.

**Active school year:** all tracks filter `Class.school_year == SchoolYearRepository.current_school_year()` (and Sectioning year must match for students).

---

## DocType constants (FRAPPE_*)

| Constant | DocType |
| -------- | ------- |
| FRAPPE_CLASS_SCHEDULE | Class Schedule (child of Class) |
| FRAPPE_CLASS | Class |
| FRAPPE_SUBJECT | Subject |
| FRAPPE_SECTIONING | Sectioning |
| FRAPPE_SECTION | Section |
| FRAPPE_ENROLLEES | Enrollees |
| FRAPPE_STUDENT | Student |
| FRAPPE_USER | User |
| FRAPPE_TEACHER | Teacher |
| FRAPPE_SPECIALIZED_SUBJECTS_CHILD | Specialized Subjects Child |
| FRAPPE_SPECIALIZED_SUBJECTS | Specialized Subject |
| FRAPPE_COLLEGE_CLASSES | College Classes |
| FRAPPE_COLLEGE_CLASS_STUDENT | College Class Student |
| FRAPPE_COLLEGE_SECTIONING | College Sectioning |
| FRAPPE_COLLEGE_SUBJECT | College Subject |
| FRAPPE_COLLEGE_SUBJECT_CODE | College Subject Code |
| FRAPPE_COLLEGE_FACULTY | College Faculty |
| FRAPPE_COLLEGE_DEPARTMENT_WC | College Department WC |

---

## BED — student (`get_classes_bed`, role=student)

```
Class Schedule
  → Subject (schedule.subject)
  → Class (schedule.parent)
  → Sectioning (Sectioning.section == Class.section)
  → Section
  → Enrollees (Sectioning.enrollee)
  → Student (Enrollees.id_number == Student.name)
  → User (Student.user == User.name OR Student.name == User.username)
```

**Filters:**
- `Class.school_year == current_school_year()`
- `Sectioning.school_year == Class.school_year`
- `User.name == email`
- **`Sectioning.docstatus == 1`** ← must be **submitted**
- `GROUP BY Subject.name`

**Assign student:** Sectioning (submitted) + Class Schedule rows on Class for that section.

---

## BED — teacher (`get_classes_bed`, role=teacher)

```
Class Schedule
  → Subject
  → Class (schedule.parent)
  → Section
  → Teacher (ClassSchedule.teacher == Teacher.name)
```

**Filters:**
- `Class.school_year == current_school_year()`
- `Teacher.user == email`
- `GROUP BY Subject.name`

**Assign teacher:** **Class Schedule** child row with `teacher` = Teacher doc name; Teacher.user = email.

---

## SHS — student (`get_classes_shs`)

Same Sectioning/User chain as BED, but subjects from:

```
Specialized Subjects Child (parent = Class.name)
  → Specialized Subject
  → Class → Sectioning → … → User
```

**Filters:** same as BED student including **`Sectioning.docstatus == 1`**.

**Assign student:** submitted Sectioning + **Specialized Subjects Child** rows on Class (with `teacher` on child).

---

## SHS — teacher (`get_classes_shs`)

```
Specialized Subjects Child
  → Specialized Subject
  → Class
  → Section
  → Teacher (child.teacher == Teacher.name)
```

**Filters:**
- `Class.school_year == current_school_year()`
- `Teacher.user == email`

**Assign teacher:** set `teacher` on **Specialized Subjects Child** row linked to Teacher record.

---

## College — student (`get_classes_college`)

Primary query:

```
College Classes
  → College Class Student (parent = class)
  → College Sectioning (CollegeClasses.section)
  → College Subject, College Subject Code, College Department WC
  → Student (CollegeClassStudent.student_id_number)
  → User
```

**Fallback if empty:** `get_student_classes_from_matriculation(email, school_year, semester)`.

---

## College — teacher (`get_classes_college`)

```
College Classes
  → College Sectioning
  → College Subject / Subject Code / Department
  → College Faculty (CollegeClasses.adviser == CollegeFaculty.name)
```

**Filters:**
- `CollegeClasses.school_year == current_school_year()`
- `CollegeFaculty.user == email`

**Fallback:** `get_teacher_classes_from_matriculation`.

**Assign college teacher:** **College Classes**.`adviser` → **College Faculty** with matching User.

---

## Subject details APIs

### `get_classes_subject_details_bed`

- Filter `Class.name == className`
- Optional `Subject.name == subjectCode` (note: filters Subject **name**, not code string)
- Sectioning year match; **docstatus filter commented out** in code but student list still requires docstatus 1 in `get_classes`

### `get_classes_specialized_subject_details_shs`

- Same pattern on Specialized Subjects Child

### `get_classes_subject_details_college`

- `CollegeClasses.title == className`
- `CollegeSubjectCode.subject_code == subjectCode`

---

## Assignment checklist by track

### BED student
- [ ] Enrollee + Student + User (email)
- [ ] Sectioning: section, school year, **submitted (docstatus 1)**
- [ ] Class for section + school year
- [ ] Class Schedule rows (subject + teacher)

### BED teacher
- [ ] Teacher record, `user` = email
- [ ] Class Schedule on Class: `teacher` field points to Teacher.name

### SHS student
- [ ] Same as BED student (Sectioning submitted)
- [ ] Specialized Subjects Child on Class

### SHS teacher
- [ ] Teacher record linked to User
- [ ] Specialized Subjects Child.teacher = Teacher.name

### College student
- [ ] College Class Student row OR matriculation enrollment

### College teacher
- [ ] College Faculty.user = email, College Classes.adviser = faculty OR matriculation

---

## Common prod mistakes (empty Silid but desk looks OK)

| Mistake | Why Silid empty |
| ------- | ---------------- |
| Sectioning saved but not **submitted** | Student BED/SHS query requires docstatus 1 |
| Teacher on Class form only, no **Class Schedule** row | BED teacher/student queries join Class Schedule |
| SHS class using Schedule instead of **Specialized Subjects Child** | SHS path ignored |
| Wrong school year on Sectioning vs Class | Year mismatch filter |
| Student.user not set; only Enrollee exists | User join fails |
| Teacher.user email ≠ login email | Teacher filter fails |
