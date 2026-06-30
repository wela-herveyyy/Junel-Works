# Livro eLibrary — class / sectioning guides

Base URL for all articles: `https://erp.livro.systems/app/livro-elibrary/{id}`

## Silid V3 BED (primary)

| ID | Title | Use |
| -- | ----- | --- |
| `tdishn5bug` | How to setup BED class for Silid V3 | **Class List** prerequisites + teacher per subject |
| `mr30rhrtfq` | How to create BED teacher account for Silid V3 | User → roles → **Teacher List** |
| `i4r2phnr4e` | How to create BED student account for Silid V3 | **Enrollees** + user password |
| `dmjmok7us6` | How to section BED students in Frappe V15 | **Sectioning** + **Batch Sectioning** |
| `kjgse4fu2l` | Class Schedule | **Class Schedule** child table on Class List |
| `uje1lpjq6e` | Silid v3: Setup for schools | SILID API key, **Silid Setup** DocType |
| `pu9h7mgehn` | Introduction to Silid LMS v3 | Product overview |

## Class scheduling (BED)

| ID | Title |
| -- | ----- |
| `dtp379lnd1` | Wela Class Auto Scheduling Guide (Basic Education SetUp) |
| `uefojptc9a` | Class Scheduler App Guide (BED) |
| `a14b1tklrp` | SHS Auto Class Scheduling App Guide |
| `lomobru8tp` | SHS Setup for Class Scheduling Guide |

## Enrollment (upstream of sectioning)

| ID | Title |
| -- | ----- |
| `fv3m98qqf6` | Accepting the Student Applicant |
| `14lapqpbbh` | Online Portal Enrollment |
| `bm4l7ae6e0` | WITHDRAWING STUDENT ENROLLMENT |

## Architecture reference

| ID | Title |
| -- | ----- |
| `rlv2uebd0j` | Module Reference: V2 to V3 Naming Updates |
| `fkeuvhssqj` | Wela Bed V15 - DocType Dependency & Data-Flow Map |
| `45psp8n0o7` | Wela College V15 - DocType Dependency & Data-Flow Map |

## MCP examples

List class-related guides:

```json
{
  "doctype": "Livro eLibrary",
  "fields": ["name", "title", "module", "type"],
  "filters": { "title": ["like", "%section%"] },
  "limit": 20
}
```

Read full guide body (HTML in `description`):

```json
{
  "doctype": "Livro eLibrary",
  "name": "tdishn5bug"
}
```

## V2 → V3 BED enrollment DocTypes

From `rlv2uebd0j`:

- Pre Enrollees → Pre Enrollees  
- Enrollees → Enrollees  
- Sectioning → Sectioning  
- Class → Class  

College parallel: Student Applicant WC → College Applicant; Enrollee WC → College Enrollees; Sectioning WC → College Sectioning; Class WC → College Classes.
