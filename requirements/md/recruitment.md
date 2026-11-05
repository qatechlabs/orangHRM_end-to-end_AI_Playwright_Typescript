<!-- Generated from requirements/brd/OrangeHRM_BRD_Recruitment.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Recruitment Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Recruitment Module

__Document ID__

BRD-REC-001

__Version__

1.0

__Date__

25 October 2026

__Prepared for__

Karthik Kodati, OrangeHRM End-to-End Automation project

__Status__

Draft for review

# Document Control

__Version__

__Date__

__Author__

__Change summary__

1.0

25 Oct 2026

Claude (for Karthik Kodati)

Initial baseline derived from OrangeHRM 5.x behaviour

## Requirement ID convention

__Prefix__

__Meaning__

REC-FR-nnn

Functional requirement

REC-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

REC-VAL-nnn

Field-level validation rule

REC-BR-nn

Business rule

REC-NFR-nn

Non-functional requirement

REC-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Recruitment module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Recruitment module manages hiring from vacancy creation to hire. Admins and Hiring Managers publish vacancies, record candidates (manually or through the public application page), and move each candidate through a defined status workflow: shortlisting, interviews, offer and hire. Hiring a candidate creates an employee record in PIM.

## 1.3 Scope

__In scope__

- Vacancies: search, add, edit, delete, attachments, publishing to RSS/web page.
- Candidates: search, add, edit, delete, resume, keywords, consent, history.
- Candidate workflow: Shortlist, Reject, Schedule Interview, Mark Interview Passed/Failed, Offer Job, Decline Offer, Hire.
- Public "Apply" page for online applications.
- Role-specific access for Admin, Hiring Manager and Interviewer.

__Out of scope__

- Email notifications to candidates and interviewers.
- Interview calendar integration.
- Onboarding after hire (covered by PIM).

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Vacancy__

An open position linked to a Job Title and a Hiring Manager

__Hiring Manager__

Employee responsible for a vacancy; can act on its candidates

__Interviewer__

Employee assigned to a scheduled interview; can record its outcome

__Method of Application__

Manual (entered by staff) or Online (submitted via the public page)

__Candidate History__

Chronological log of status changes with notes and performer

# 2. User Roles and Permissions

Default OrangeHRM 5.x permissions. Hiring Manager and Interviewer rights are derived from vacancy and interview assignments.

__Capability__

__Admin__

__Hiring Manager__

__Interviewer__

__ESS__

__See Recruitment menu__

Yes

Yes

Yes

No

__Add / edit / delete vacancies__

Yes

No

No

No

__View vacancies__

All

Own vacancies

No

No

__Add candidates__

Yes

Yes (own vacancies)

No

No

__View candidates__

All

Own vacancies

Own interviews

No

__Shortlist, reject, schedule, offer, hire__

Yes

Yes (own vacancies)

No

No

__Mark interview passed / failed__

Yes

Yes

Own interviews

No

__Delete candidates__

Yes

No

No

No

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Recruitment > Candidates

Candidates

Search and manage candidates

Recruitment > Candidates > + Add

Add Candidate

Create a candidate

Recruitment > Candidates > (view)

Candidate Profile

Details, workflow actions, history

Recruitment > Vacancies

Vacancies

Search and manage vacancies

Recruitment > Vacancies > + Add

Add Vacancy

Create a vacancy

/web/index.php/recruitmentApply/jobs.html

Active Job Vacancies (public)

Public list of published vacancies and Apply form

# 4. Functional Requirements

## 4.1 Vacancies

### REC-FR-001  Search vacancies

__Description__

User filters vacancies by Job Title, Vacancy, Hiring Manager and Status (Active/Closed).

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-001-AC1:__ The table shows checkbox, Vacancy, Job Title, Hiring Manager, Status, Actions with a record count.
- __REC-FR-001-AC2:__ Search returns vacancies matching all criteria; Reset restores the full list.
- __REC-FR-001-AC3:__ Hiring Managers see only vacancies they manage.

### REC-FR-002  Add vacancy

__Description__

Admin creates a vacancy with Vacancy Name*, Job Title*, Description, Hiring Manager*, Number of Positions, Active and Publish in RSS Feed and Web Page.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __REC-FR-002-AC1:__ Vacancy Name is unique ("Already exists") and at most 50 characters.
- __REC-FR-002-AC2:__ Hiring Manager is an employee autocomplete; free text is rejected as "Invalid".
- __REC-FR-002-AC3:__ Number of Positions accepts whole numbers 1–99.
- __REC-FR-002-AC4:__ Active and Publish toggles default to on.
- __REC-FR-002-AC5:__ Saving shows "Successfully Saved" and opens Edit Vacancy with an Attachments section and the RSS Feed URL and Web Page URL.

### REC-FR-003  Edit, close and delete vacancy

__Description__

Admin updates vacancy details, closes it by turning Active off, or deletes it.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __REC-FR-003-AC1:__ Edits save with "Successfully Updated".
- __REC-FR-003-AC2:__ A closed vacancy shows Status "Closed", is not listed on the public page and is not offered when adding candidates.
- __REC-FR-003-AC3:__ Delete (single or bulk) asks for confirmation; candidates of a deleted vacancy remain but lose the vacancy link.
- __REC-FR-003-AC4:__ Vacancy attachments can be added (max 1 MB), edited, downloaded and deleted.

### REC-FR-004  Publish vacancy to public page

__Description__

Active vacancies with Publish on are listed on the public Active Job Vacancies page.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __REC-FR-004-AC1:__ The public page lists each published vacancy with its name, description and an Apply button, without requiring login.
- __REC-FR-004-AC2:__ Turning Publish or Active off removes the vacancy from the page.
- __REC-FR-004-AC3:__ The RSS feed contains the same vacancies.

## 4.2 Candidates

### REC-FR-005  Search candidates

__Description__

User filters candidates by Job Title, Vacancy, Hiring Manager, Status, Candidate Name, Keywords, Date of Application range and Method of Application.

__Priority__

Must

__Roles__

Admin, Hiring Manager, Interviewer

__Acceptance criteria__

- __REC-FR-005-AC1:__ The table shows checkbox, Vacancy, Candidate, Hiring Manager, Date of Application, Status, Actions (view, delete, download resume).
- __REC-FR-005-AC2:__ Status filter lists all workflow statuses.
- __REC-FR-005-AC3:__ Keywords search matches the candidate's comma-separated keywords.
- __REC-FR-005-AC4:__ Results are sorted by Date of Application, newest first, and are sortable by column.
- __REC-FR-005-AC5:__ Users see only candidates within their role scope.

### REC-FR-006  Add candidate

__Description__

User adds a candidate with First Name*, Middle Name, Last Name*, Vacancy, Email*, Contact Number, Resume, Keywords, Date of Application, Notes and Consent to keep data.

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-006-AC1:__ Vacancy lists active vacancies only and is optional.
- __REC-FR-006-AC2:__ Resume accepts .docx, .doc, .odt, .pdf, .rtf, .txt up to 1 MB.
- __REC-FR-006-AC3:__ Date of Application defaults to today.
- __REC-FR-006-AC4:__ Saving shows "Successfully Saved" and opens the candidate profile; with a vacancy the status is "Application Initiated", otherwise no status and no workflow actions.
- __REC-FR-006-AC5:__ Method of Application is recorded as Manual.

### REC-FR-007  Edit candidate profile

__Description__

User edits candidate details from the profile using the Edit toggle.

__Priority__

Should

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-007-AC1:__ Fields are read-only until Edit is on.
- __REC-FR-007-AC2:__ The resume can be kept, replaced or deleted.
- __REC-FR-007-AC3:__ Saving shows "Successfully Updated".

### REC-FR-008  Delete candidate

__Description__

Admin deletes one or more candidates.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __REC-FR-008-AC1:__ Delete asks for confirmation and shows "Successfully Deleted".
- __REC-FR-008-AC2:__ Bulk delete via checkboxes is available.
- __REC-FR-008-AC3:__ Deleting a hired candidate does not delete the created employee.

### REC-FR-009  View candidate history

__Description__

The profile shows a History table of all actions.

__Priority__

Should

__Roles__

Admin, Hiring Manager, Interviewer

__Acceptance criteria__

- __REC-FR-009-AC1:__ Each entry shows Performed Date, Description (e.g. "Admin shortlisted ... for vacancy ...") and a view action with the notes entered.
- __REC-FR-009-AC2:__ Entries appear in chronological order and are not editable.

### REC-FR-010  Apply online via public page

__Description__

A job seeker applies for a published vacancy with First Name*, Middle Name, Last Name*, Email*, Contact Number, Resume*, Keywords, Notes and Consent.

__Priority__

Should

__Roles__

Public (no login)

__Acceptance criteria__

- __REC-FR-010-AC1:__ Resume is mandatory on the public form and follows the same type and size rules.
- __REC-FR-010-AC2:__ Submitting shows a confirmation "Application Received" and the candidate appears in Candidates with status "Application Initiated" and Method of Application "Online".

## 4.3 Candidate Workflow

Status flow: Application Initiated → Shortlisted → Interview Scheduled → Interview Passed / Interview Failed → Job Offered → Hired or Offer Declined. "Reject" is available from every non-final status and leads to Rejected.

### REC-FR-011  Shortlist

__Description__

From status "Application Initiated", the user performs "Shortlist", moving the candidate to "Shortlisted".

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-011-AC1:__ The "Shortlist" button is shown on the candidate profile only when the status is Application Initiated.
- __REC-FR-011-AC2:__ Clicking it opens an action page showing Candidate Name, Vacancy, Hiring Manager, Current Status and a Notes field.
- __REC-FR-011-AC3:__ Saving shows "Successfully Updated", sets the status to "Shortlisted" and adds an entry to the candidate History.

### REC-FR-012  Reject

__Description__

From status "Application Initiated, Shortlisted, Interview Scheduled, Interview Passed, Interview Failed or Job Offered", the user performs "Reject", moving the candidate to "Rejected".

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-012-AC1:__ The "Reject" button is shown on the candidate profile only when the status is Application Initiated, Shortlisted, Interview Scheduled, Interview Passed, Interview Failed or Job Offered.
- __REC-FR-012-AC2:__ Clicking it opens an action page showing Candidate Name, Vacancy, Hiring Manager, Current Status and a Notes field.
- __REC-FR-012-AC3:__ Saving shows "Successfully Updated", sets the status to "Rejected" and adds an entry to the candidate History.
- __REC-FR-012-AC4:__ No further workflow actions are shown for a Rejected candidate.

### REC-FR-013  Schedule interview

__Description__

From Shortlisted or Interview Passed, the user schedules an interview.

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-013-AC1:__ The form shows Interview Title*, Interviewer* (employee autocomplete, "+ Add Another" for more), Date*, Time and Notes.
- __REC-FR-013-AC2:__ Saving shows "Successfully Saved", sets status "Interview Scheduled" and records the interview in History.
- __REC-FR-013-AC3:__ Each interviewer can see the candidate in their Candidates list.

### REC-FR-014  Mark Interview Passed

__Description__

From status "Interview Scheduled", the user performs "Mark Interview Passed", moving the candidate to "Interview Passed".

__Priority__

Must

__Roles__

Admin, Hiring Manager, Interviewer

__Acceptance criteria__

- __REC-FR-014-AC1:__ The "Mark Interview Passed" button is shown on the candidate profile only when the status is Interview Scheduled.
- __REC-FR-014-AC2:__ Clicking it opens an action page showing Candidate Name, Vacancy, Hiring Manager, Current Status and a Notes field.
- __REC-FR-014-AC3:__ Saving shows "Successfully Updated", sets the status to "Interview Passed" and adds an entry to the candidate History.
- __REC-FR-014-AC4:__ An Interviewer can perform this action for interviews assigned to them.

### REC-FR-015  Mark Interview Failed

__Description__

From status "Interview Scheduled", the user performs "Mark Interview Failed", moving the candidate to "Interview Failed".

__Priority__

Must

__Roles__

Admin, Hiring Manager, Interviewer

__Acceptance criteria__

- __REC-FR-015-AC1:__ The "Mark Interview Failed" button is shown on the candidate profile only when the status is Interview Scheduled.
- __REC-FR-015-AC2:__ Clicking it opens an action page showing Candidate Name, Vacancy, Hiring Manager, Current Status and a Notes field.
- __REC-FR-015-AC3:__ Saving shows "Successfully Updated", sets the status to "Interview Failed" and adds an entry to the candidate History.
- __REC-FR-015-AC4:__ After failure, only Reject is available.

### REC-FR-016  Offer Job

__Description__

From status "Interview Passed", the user performs "Offer Job", moving the candidate to "Job Offered".

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-016-AC1:__ The "Offer Job" button is shown on the candidate profile only when the status is Interview Passed.
- __REC-FR-016-AC2:__ Clicking it opens an action page showing Candidate Name, Vacancy, Hiring Manager, Current Status and a Notes field.
- __REC-FR-016-AC3:__ Saving shows "Successfully Updated", sets the status to "Job Offered" and adds an entry to the candidate History.

### REC-FR-017  Offer Declined

__Description__

From status "Job Offered", the user performs "Offer Declined", moving the candidate to "Offer Declined".

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-017-AC1:__ The "Offer Declined" button is shown on the candidate profile only when the status is Job Offered.
- __REC-FR-017-AC2:__ Clicking it opens an action page showing Candidate Name, Vacancy, Hiring Manager, Current Status and a Notes field.
- __REC-FR-017-AC3:__ Saving shows "Successfully Updated", sets the status to "Offer Declined" and adds an entry to the candidate History.

### REC-FR-018  Hire

__Description__

From status "Job Offered", the user performs "Hire", moving the candidate to "Hired".

__Priority__

Must

__Roles__

Admin, Hiring Manager

__Acceptance criteria__

- __REC-FR-018-AC1:__ The "Hire" button is shown on the candidate profile only when the status is Job Offered.
- __REC-FR-018-AC2:__ Clicking it opens an action page showing Candidate Name, Vacancy, Hiring Manager, Current Status and a Notes field.
- __REC-FR-018-AC3:__ Saving shows "Successfully Updated", sets the status to "Hired" and adds an entry to the candidate History.
- __REC-FR-018-AC4:__ Hiring creates a new employee in PIM with the candidate's first, middle and last name and the vacancy's Job Title.
- __REC-FR-018-AC5:__ If the vacancy's Number of Positions is filled by this hire, the vacancy is closed automatically.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

REC-VAL-001

Add Vacancy

Vacancy Name

Yes

Max 50; unique

"Required"; "Should not exceed 50 characters"; "Already exists"

REC-VAL-002

Add Vacancy

Job Title

Yes

Selected

"Required"

REC-VAL-003

Add Vacancy

Hiring Manager

Yes

Employee from autocomplete

"Required"; "Invalid"

REC-VAL-004

Add Vacancy

Number of Positions

No

Integer 1–99

"Should be a positive number"; "Should be less than 100"

REC-VAL-005

Vacancy Attachments

File

Yes

Max 1 MB

"Attachment Size Exceeded"

REC-VAL-006

Add Candidate

First Name / Last Name

Yes

Max 30

"Required"; "Should not exceed 30 characters"

REC-VAL-007

Add Candidate

Middle Name

No

Max 30

"Should not exceed 30 characters"

REC-VAL-008

Add Candidate

Email

Yes

Valid email; max 50

"Required"; "Expected format: admin@example.com"

REC-VAL-009

Add Candidate

Contact Number

No

Digits and + - / ( ) only

"Allows numbers and only + - / ( )"

REC-VAL-010

Add Candidate

Resume

No (Yes on public form)

.docx .doc .odt .pdf .rtf .txt; max 1 MB

"File type not allowed"; "Attachment Size Exceeded"

REC-VAL-011

Add Candidate

Keywords

No

Max 250; comma-separated

"Should not exceed 250 characters"

REC-VAL-012

Add Candidate

Date of Application

No

Valid date

"Should be a valid date in yyyy-dd-mm format"

REC-VAL-013

Schedule Interview

Interview Title

Yes

Max 100

"Required"

REC-VAL-014

Schedule Interview

Interviewer

Yes

Employee from autocomplete

"Required"; "Invalid"

REC-VAL-015

Schedule Interview

Date

Yes

Valid date

"Required"

REC-VAL-016

Workflow actions

Notes

No

Max 2000

"Should not exceed 2000 characters"

# 6. Business Rules

__ID__

__Rule__

REC-BR-01

A candidate can be linked to at most one vacancy at a time.

REC-BR-02

Workflow actions are available only for candidates linked to a vacancy.

REC-BR-03

Only the transitions listed in section 4.3 are permitted; the UI shows only valid next actions for the current status.

REC-BR-04

Rejected, Hired and Offer Declined are final statuses.

REC-BR-05

Hiring a candidate creates exactly one PIM employee.

REC-BR-06

Hiring Managers act only on candidates of vacancies they manage; Interviewers only on interviews they are assigned to.

REC-BR-07

Closed vacancies are not shown on the public page and cannot receive new candidates.

REC-BR-08

Every status change is recorded in History with performer, date and notes.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Vacancy / candidate / interview created

Success: Successfully Saved

Toast (success)

Workflow action or edit

Success: Successfully Updated

Toast (success)

Deletion

Success: Successfully Deleted

Toast (success)

Public application submitted

Application Received / Your application has been submitted

Dialog

No results

Info: No Records Found

Toast (info)

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

REC-NFR-01

Privacy

Candidate personal data is only visible to users within role scope; consent is recorded.

REC-NFR-02

Public page

The public vacancies page is accessible without authentication and exposes no internal data beyond the vacancy name and description.

REC-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

REC-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

REC-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

REC-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

REC-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- At least one Job Title exists in Admin and at least one employee exists to act as Hiring Manager / Interviewer.
- Hiring Manager and Interviewer test users have ESS logins.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- Admin: Job Titles, users.
- PIM: employees as hiring managers/interviewers; Hire creates PIM employees.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- The workflow is long; create candidates via API (/web/index.php/api/v2/recruitment/candidates) at the needed status where possible, and keep one full UI happy-path test.
- Each action page has a Save button; after Save, assert both the toast and the "Status:" label on the profile.
- Use unique candidate emails per run, and delete hired employees in teardown to keep PIM clean.
- The public Apply page runs without login; use a fresh browser context.

## 10.2 Test data

__Data item__

__Suggested value / source__

Vacancy

"Auto QA Vacancy <ts>", Job Title "QA Engineer", Hiring Manager = test employee, Positions 1

Candidate

"Cand<ts> Auto", cand<ts>@example.com, resume.pdf (~100 KB)

Negative files

resume.exe, resume_2mb.pdf

Interview

"Technical Round 1", interviewer = test employee, date = today + 3

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

REC-E2E-01

Hire a candidate end to end

1. Create vacancy

2. Add candidate with resume for vacancy

3. Shortlist, schedule interview, mark passed, offer job, hire

4. Verify status Hired and employee exists in PIM

REC-FR-002, REC-FR-006, REC-FR-011, REC-FR-013, REC-FR-014, REC-FR-016, REC-FR-018

Smoke

REC-E2E-02

Reject at shortlist

1. Candidate Application Initiated

2. Reject with notes

3. Verify Rejected, no actions, History entry

REC-FR-012, REC-FR-009

Regression

REC-E2E-03

Interview failed path

1. Candidate Interview Scheduled

2. Mark failed

3. Only Reject available

REC-FR-015, REC-FR-012

Regression

REC-E2E-04

Offer declined

1. Candidate Job Offered

2. Offer Declined

3. Verify final status

REC-FR-017

Regression

REC-E2E-05

Interviewer permissions

1. Schedule interview with ESS interviewer

2. Log in as interviewer, see candidate

3. Mark Interview Passed

4. Verify no Offer/Hire buttons for interviewer

REC-FR-014, REC-FR-005

Regression

REC-E2E-06

Online application

1. Publish vacancy

2. Open public page without login, apply with resume

3. Admin sees candidate with Method Online

REC-FR-004, REC-FR-010

Regression

REC-E2E-07

Vacancy close hides it

1. Set vacancy inactive

2. Verify Closed status, not on public page, not in Add Candidate list

REC-FR-003, REC-FR-004

Regression

REC-E2E-08

Candidate validations

1. Empty required fields

2. Invalid email

3. Resume >1 MB and wrong type

REC-FR-006

Regression

REC-E2E-09

Search and delete candidates

1. Search by vacancy, status, keywords, date range

2. Bulk delete two candidates

REC-FR-005, REC-FR-008

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

REC-FR-001

Search vacancies

Vacancies

Must

3

Functional test

REC-FR-002

Add vacancy

Vacancies

Must

5

REC-E2E-01

REC-FR-003

Edit, close and delete vacancy

Vacancies

Must

4

REC-E2E-07

REC-FR-004

Publish vacancy to public page

Vacancies

Should

3

REC-E2E-06, REC-E2E-07

REC-FR-005

Search candidates

Candidates

Must

5

REC-E2E-05, REC-E2E-09

REC-FR-006

Add candidate

Candidates

Must

5

REC-E2E-01, REC-E2E-08

REC-FR-007

Edit candidate profile

Candidates

Should

3

Functional test

REC-FR-008

Delete candidate

Candidates

Should

3

REC-E2E-09

REC-FR-009

View candidate history

Candidates

Should

2

REC-E2E-02

REC-FR-010

Apply online via public page

Candidates

Should

2

REC-E2E-06

REC-FR-011

Shortlist

Candidate Workflow

Must

3

REC-E2E-01

REC-FR-012

Reject

Candidate Workflow

Must

4

REC-E2E-02, REC-E2E-03

REC-FR-013

Schedule interview

Candidate Workflow

Must

3

REC-E2E-01

REC-FR-014

Mark Interview Passed

Candidate Workflow

Must

4

REC-E2E-01, REC-E2E-05

REC-FR-015

Mark Interview Failed

Candidate Workflow

Must

4

REC-E2E-03

REC-FR-016

Offer Job

Candidate Workflow

Must

3

REC-E2E-01

REC-FR-017

Offer Declined

Candidate Workflow

Must

3

REC-E2E-04

REC-FR-018

Hire

Candidate Workflow

Must

5

REC-E2E-01

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

