<!-- Generated from requirements/brd/OrangeHRM_BRD_MyInfo.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

My Info Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

My Info Module

__Document ID__

BRD-MYI-001

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

MYI-FR-nnn

Functional requirement

MYI-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

MYI-VAL-nnn

Field-level validation rule

MYI-BR-nn

Business rule

MYI-NFR-nn

Non-functional requirement

MYI-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the My Info module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

My Info is the employee self-service view of the logged-in user's own employee record. It reuses the PIM profile tabs (Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships) but applies self-service permissions: employees maintain their personal information while employment data (job, salary, reporting lines) is read-only.

Field-level rules (lengths, formats, mandatory fields) are identical to PIM and are defined in the PIM BRD (BRD-PIM-001, section 5). This document focuses on what differs for self-service and on the end-to-end flows an employee performs.

## 1.3 Scope

__In scope__

- Access to My Info for every logged-in user.
- Editable self-service tabs and their attachments.
- Read-only tabs (Job, Salary, Report-to) and restricted fields.
- Profile photo change by the employee.
- Consistency of data between My Info and PIM.

__Out of scope__

- Admin maintenance of other employees (PIM BRD).
- Password change (User menu > Change Password), covered under login/user account tests.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__My Info__

Self-service view of the logged-in user's own employee record

__Self-service permission__

Data access an employee has on their own record, defined by the ESS role

# 2. User Roles and Permissions

Every user sees My Info for their own record only. The table shows default ESS self-service permissions.

__Tab / data__

__View__

__Edit (ESS)__

__Notes__

__Personal Details__

Yes

Yes

Employee Id and restricted identifiers read-only

__Contact Details__

Yes

Yes

__Emergency Contacts__

Yes

Yes

Add, edit, delete

__Dependents__

Yes

Yes

Add, edit, delete

__Immigration__

Yes

Yes

Add, edit, delete

__Job__

Yes

No

No Terminate Employment button; job attachments view only

__Salary__

Yes

No

Read-only list, no add/edit/delete

__Report-to__

Yes

No

Read-only

__Qualifications__

Yes

Yes

All five sub-sections

__Memberships__

Yes

Yes

__Attachments on editable tabs__

Yes

Yes

Add, edit, delete own attachments

__Profile photo__

Yes

Yes

- An Admin opening My Info sees their own record with Admin permissions (same as editing themselves in PIM).
- Changing another employee's data by altering the employee number in the URL must be denied for ESS users.

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

My Info

Personal Details (default tab)

Own personal data

My Info > Contact Details

Contact Details

Own address, phones, emails

My Info > Emergency Contacts

Emergency Contacts

Own emergency contacts

My Info > Dependents

Dependents

Own dependents

My Info > Immigration

Immigration

Own passports/visas

My Info > Job

Job

Own job details (read-only)

My Info > Salary

Salary

Own salary (read-only)

My Info > Report-to

Report-to

Own supervisors and subordinates (read-only)

My Info > Qualifications

Qualifications

Own qualifications

My Info > Memberships

Memberships

Own memberships

# 4. Functional Requirements

## 4.1 Access and Navigation

### MYI-FR-001  Open own record

__Description__

Clicking My Info opens the logged-in user's own Personal Details tab.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __MYI-FR-001-AC1:__ The header shows the user's photo and full name.
- __MYI-FR-001-AC2:__ The left tab list shows all tabs from Personal Details to Memberships (plus Tax Exemptions when enabled in PIM Optional Fields).
- __MYI-FR-001-AC3:__ Data shown is the logged-in user's, matching PIM for the same employee.
- __MYI-FR-001-AC4:__ An ESS user changing the employee number in the URL to another employee is denied access.

## 4.2 Self-service Editable Tabs

### MYI-FR-002  Update own personal details

__Description__

Employee updates name, other id, license details, nationality, marital status, date of birth, gender and custom fields.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __MYI-FR-002-AC1:__ Employee Id is shown but disabled for ESS users.
- __MYI-FR-002-AC2:__ Saving valid changes shows "Successfully Updated" and the new values are visible to Admin in PIM.
- __MYI-FR-002-AC3:__ Field validations are the same as PIM Personal Details.
- __MYI-FR-002-AC4:__ Clearing First Name or Last Name shows "Required" and blocks saving.

### MYI-FR-003  Update own contact details

__Description__

Employee updates address, telephones and emails.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __MYI-FR-003-AC1:__ Validation rules match PIM Contact Details (phone characters, email format, email uniqueness).
- __MYI-FR-003-AC2:__ Saving shows "Successfully Updated".
- __MYI-FR-003-AC3:__ Updated Work Email and phone are reflected in Directory.

### MYI-FR-004  Maintain own emergency contacts and dependents

__Description__

Employee adds, edits and deletes emergency contacts and dependents.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __MYI-FR-004-AC1:__ Emergency contact requires Name, Relationship and at least one phone number.
- __MYI-FR-004-AC2:__ Dependent requires Name and Relationship ("Please Specify" when Other).
- __MYI-FR-004-AC3:__ Add, edit, single delete and bulk delete work as in PIM and show the standard toasts.

### MYI-FR-005  Maintain own immigration records

__Description__

Employee adds, edits and deletes passport/visa records.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __MYI-FR-005-AC1:__ Number is mandatory; Expiry Date must be after Issued Date.
- __MYI-FR-005-AC2:__ Saved records are visible to Admin in PIM.

### MYI-FR-006  Maintain own qualifications and memberships

__Description__

Employee maintains Work Experience, Education, Skills, Languages, License and Memberships.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __MYI-FR-006-AC1:__ Each sub-section supports add, edit and delete with the same rules as PIM.
- __MYI-FR-006-AC2:__ Skills and Languages added appear in PIM report criteria results for that employee.

### MYI-FR-007  Change own profile photo

__Description__

Employee uploads or replaces their profile photo by clicking the header photo.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __MYI-FR-007-AC1:__ Accepted types jpg, jpeg, png, gif up to 1 MB; others are rejected with the PIM messages.
- __MYI-FR-007-AC2:__ Saving shows "Successfully Updated" and the new photo appears in the header, the top-right user menu and Directory.

### MYI-FR-008  Manage own attachments

__Description__

Employee manages attachments on editable tabs.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __MYI-FR-008-AC1:__ Add, edit description, download and delete work as in PIM with a 1 MB limit.
- __MYI-FR-008-AC2:__ Attachments added by Admin on the same tab are visible to the employee.

## 4.3 Read-only Tabs

### MYI-FR-009  View own job details

__Description__

Employee views Joined Date, Job Title, Job Specification, Job Category, Sub Unit, Location, Employment Status and contract details.

__Priority__

Must

__Roles__

ESS

__Acceptance criteria__

- __MYI-FR-009-AC1:__ All fields are disabled and there is no Save button.
- __MYI-FR-009-AC2:__ The Terminate Employment button is not shown.
- __MYI-FR-009-AC3:__ Job Specification can be downloaded if present.

### MYI-FR-010  View own salary

__Description__

Employee views assigned salary components.

__Priority__

Must

__Roles__

ESS

__Acceptance criteria__

- __MYI-FR-010-AC1:__ The Assigned Salary Components table is shown without Add, edit, delete or checkboxes.
- __MYI-FR-010-AC2:__ Values match those entered by Admin in PIM.

### MYI-FR-011  View own reporting lines

__Description__

Employee views assigned supervisors and subordinates.

__Priority__

Must

__Roles__

ESS

__Acceptance criteria__

- __MYI-FR-011-AC1:__ Assigned Supervisors and Assigned Subordinates are listed with Name and Reporting Method.
- __MYI-FR-011-AC2:__ No Add, edit or delete actions are available.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

MYI-VAL-001

All editable tabs

All fields

As PIM

Identical to PIM validations (BRD-PIM-001 section 5)

As PIM

MYI-VAL-002

Personal Details

Employee Id

-

Read-only for ESS

Field disabled

MYI-VAL-003

Personal Details

First / Last Name

Yes

Not blank; max 30

"Required"; "Should not exceed 30 characters"

MYI-VAL-004

Contact Details

Work Email

No

Valid; unique across employees

"Expected format: admin@example.com"; "Already exists"

MYI-VAL-005

Emergency Contacts

Telephones

At least one

One of three required

"At least one phone number is required"

MYI-VAL-006

Profile photo

File

Yes

jpg/jpeg/png/gif; max 1 MB

"File type not allowed"; "Attachment Size Exceeded"

MYI-VAL-007

Attachments

File

Yes

Max 1 MB

"Attachment Size Exceeded"

# 6. Business Rules

__ID__

__Rule__

MYI-BR-01

A user can only ever see and edit their own record through My Info.

MYI-BR-02

Employment data (Job, Salary, Report-to) is maintained only by Admin (and Supervisor where allowed) in PIM.

MYI-BR-03

Changes made in My Info are immediately visible in PIM, Directory and anywhere the data is displayed.

MYI-BR-04

Self-service permissions follow the ESS user role; changing the role permissions changes My Info behaviour.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Save on any tab

Success: Successfully Updated

Toast (success)

New record (contact, dependent, etc.)

Success: Successfully Saved

Toast (success)

Delete record

Success: Successfully Deleted

Toast (success)

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

MYI-NFR-01

Security

API endpoints used by My Info reject requests for another employee's data from an ESS session (HTTP 403/422).

MYI-NFR-02

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

MYI-NFR-03

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

MYI-NFR-04

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

MYI-NFR-05

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

MYI-NFR-06

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- A dedicated ESS employee with login exists for My Info tests and has a supervisor, salary and job details set by Admin.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: same screens and validation rules; data created by Admin.
- Admin: ESS role definition and Optional Fields configuration.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Reuse the PIM page objects; parameterise them by entry point (PIM vs My Info) and role, and add assertions for disabled fields and missing buttons.
- For security checks, call the PIM API with another employee's empNumber using the ESS session cookie and assert the request is refused.
- Restore personal data after edit tests so the shared ESS user stays stable.

## 10.2 Test data

__Data item__

__Suggested value / source__

ESS user

Dedicated employee with ESS login, supervisor, salary component and job title

Second employee

Any other employee id for URL tampering test

Photo

valid.png (~100 KB), large.jpg (>1 MB)

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

MYI-E2E-01

ESS updates personal and contact details

1. Log in as ESS

2. Open My Info, update Nationality and Marital Status, save

3. Update Mobile and Work Email, save

4. Admin verifies values in PIM

MYI-FR-001, MYI-FR-002, MYI-FR-003

Smoke

MYI-E2E-02

Read-only tabs for ESS

1. Open Job: fields disabled, no Save, no Terminate

2. Open Salary: no Add/edit/delete

3. Open Report-to: no actions

4. Personal Details: Employee Id disabled

MYI-FR-009, MYI-FR-010, MYI-FR-011, MYI-FR-002

Smoke

MYI-E2E-03

Emergency contact and dependent lifecycle

1. Add emergency contact without phone, verify error

2. Add valid contact and dependent

3. Edit and delete both

MYI-FR-004

Regression

MYI-E2E-04

Profile photo change

1. Upload valid photo, verify header and Directory

2. Upload >1 MB, verify rejection

MYI-FR-007

Regression

MYI-E2E-05

Cannot access another employee

1. As ESS, open /pim/viewPersonalDetails/empNumber/<other>

2. Verify access denied

3. API call for other employee refused

MYI-FR-001

Regression

MYI-E2E-06

Qualifications and attachments

1. Add skill, language, education and immigration record

2. Add attachment to Personal Details

3. Admin sees them in PIM

MYI-FR-006, MYI-FR-008, MYI-FR-005

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

MYI-FR-001

Open own record

Access and Navigation

Must

4

MYI-E2E-01, MYI-E2E-05

MYI-FR-002

Update own personal details

Self-service Editable Tabs

Must

4

MYI-E2E-01, MYI-E2E-02

MYI-FR-003

Update own contact details

Self-service Editable Tabs

Must

3

MYI-E2E-01

MYI-FR-004

Maintain own emergency contacts and dependents

Self-service Editable Tabs

Must

3

MYI-E2E-03

MYI-FR-005

Maintain own immigration records

Self-service Editable Tabs

Should

2

MYI-E2E-06

MYI-FR-006

Maintain own qualifications and memberships

Self-service Editable Tabs

Should

2

MYI-E2E-06

MYI-FR-007

Change own profile photo

Self-service Editable Tabs

Should

2

MYI-E2E-04

MYI-FR-008

Manage own attachments

Self-service Editable Tabs

Should

2

MYI-E2E-06

MYI-FR-009

View own job details

Read-only Tabs

Must

3

MYI-E2E-02

MYI-FR-010

View own salary

Read-only Tabs

Must

2

MYI-E2E-02

MYI-FR-011

View own reporting lines

Read-only Tabs

Must

2

MYI-E2E-02

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

