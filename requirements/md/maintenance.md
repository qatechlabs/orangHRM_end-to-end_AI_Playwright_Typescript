<!-- Generated from requirements/brd/OrangeHRM_BRD_Maintenance.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Maintenance Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Maintenance Module

__Document ID__

BRD-MNT-001

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

MNT-FR-nnn

Functional requirement

MNT-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

MNT-VAL-nnn

Field-level validation rule

MNT-BR-nn

Business rule

MNT-NFR-nn

Non-functional requirement

MNT-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Maintenance module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Maintenance module supports data-protection obligations (such as GDPR). Administrators can permanently purge personal data of past employees and of candidates, and can download all personal data held about an employee (access request). Because these operations are irreversible or sensitive, the module requires the administrator to re-enter their password before access.

## 1.3 Scope

__In scope__

- Administrator re-authentication on entry.
- Purge Records: Employee Records and Candidate Records.
- Access Records: download of an employee's personal data.

__Out of scope__

- Database backup/restore and system upgrades.
- Automatic data-retention schedules.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Purge__

Irreversible removal of personal data so that it cannot be recovered

__Access Records__

Export of all personal data stored about an employee

__Past employee__

Employee whose employment has been terminated

# 2. User Roles and Permissions

__Capability__

__Admin__

__Supervisor__

__ESS__

__See Maintenance menu__

Yes

No

No

__Purge employee / candidate records__

Yes

No

No

__Download access records__

Yes

No

No

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Maintenance

Administrator Access

Password confirmation before entry

Maintenance > Purge Records > Employee Records

Purge Employee Records

Purge a past employee

Maintenance > Purge Records > Candidate Records

Purge Candidate Records

Purge candidates of a vacancy

Maintenance > Access Records

Download Personal Data

Export an employee's personal data

# 4. Functional Requirements

## 4.1 Administrator Access

### MNT-FR-001  Re-authenticate before entering Maintenance

__Description__

On opening Maintenance, the Admin must confirm their password.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __MNT-FR-001-AC1:__ The "Administrator Access" page shows the Username (pre-filled, disabled) and Password*, with Cancel and Confirm.
- __MNT-FR-001-AC2:__ Correct password opens Purge Employee Records.
- __MNT-FR-001-AC3:__ Wrong password shows "Invalid credentials" and stays on the page.
- __MNT-FR-001-AC4:__ Cancel returns to the previous page (Dashboard).
- __MNT-FR-001-AC5:__ Re-authentication is required again after leaving Maintenance and returning in a new session or after a timeout.

## 4.2 Purge Records

### MNT-FR-002  Purge a past employee

__Description__

Admin selects a Past Employee* and purges all their data.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __MNT-FR-002-AC1:__ The Past Employee autocomplete lists only terminated employees; current employees are not offered.
- __MNT-FR-002-AC2:__ Search shows the selected employee's details (name, Employee Id, job title, etc.) and a Purge button.
- __MNT-FR-002-AC3:__ Purge asks for confirmation ("You will not be able to undo this action").
- __MNT-FR-002-AC4:__ Confirming shows "Successfully Purged"; the employee no longer exists in PIM (including Past Employees), Directory or reports, and their user account is removed.

### MNT-FR-003  Purge candidates of a vacancy

__Description__

Admin selects a Vacancy* and purges its candidates.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __MNT-FR-003-AC1:__ Vacancy autocomplete lists vacancies (active and closed).
- __MNT-FR-003-AC2:__ Search lists candidates of the vacancy with Vacancy, Candidate, Date of Application, Status.
- __MNT-FR-003-AC3:__ "Purge All" asks for confirmation; confirming shows "Successfully Purged" and the candidates no longer exist in Recruitment.
- __MNT-FR-003-AC4:__ Candidates of other vacancies are not affected.

## 4.3 Access Records

### MNT-FR-004  Download employee personal data

__Description__

Admin selects an Employee Name* (current or past) and downloads their personal data.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __MNT-FR-004-AC1:__ The autocomplete includes current and past employees.
- __MNT-FR-004-AC2:__ Search shows the employee and a Download button.
- __MNT-FR-004-AC3:__ Download produces a file containing the employee's personal, contact, job, salary, qualification and other stored data.
- __MNT-FR-004-AC4:__ The downloaded data matches what is stored in PIM for that employee.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

MNT-VAL-001

Administrator Access

Password

Yes

Must match the logged-in admin's password

"Required"; "Invalid credentials"

MNT-VAL-002

Purge Employee

Past Employee

Yes

Terminated employee selected from autocomplete

"Required"; "Invalid"

MNT-VAL-003

Purge Candidates

Vacancy

Yes

Vacancy selected from autocomplete

"Required"; "Invalid"

MNT-VAL-004

Access Records

Employee Name

Yes

Employee selected from autocomplete

"Required"; "Invalid"

# 6. Business Rules

__ID__

__Rule__

MNT-BR-01

Only Admin users can access Maintenance, and only after password re-confirmation.

MNT-BR-02

Only past (terminated) employees can be purged.

MNT-BR-03

Purging is irreversible and removes the employee or candidate from every module.

MNT-BR-04

Every purge requires an explicit confirmation.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Wrong admin password

Invalid credentials

Alert

Purge completed

Success: Successfully Purged

Toast (success)

Purge clicked

Purge Employee? / You will not be able to undo this action

Modal dialog

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

MNT-NFR-01

Security

Maintenance URLs opened directly by non-admin users are denied.

MNT-NFR-02

Compliance

Purged data is not recoverable from the UI or API.

MNT-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

MNT-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

MNT-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

MNT-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

MNT-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- Test data for purge is created and terminated by the test itself; never purge shared fixtures.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: termination status.
- Recruitment: vacancies and candidates.

## 9.3 Constraints

- Purge tests are destructive; run them only against a disposable test environment, never the shared public demo data owned by others.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Handle the Administrator Access step in a helper invoked whenever a Maintenance URL is opened.
- Verify purge via API: GET the employee/candidate by id should return 404 or not be listed.
- Validate the downloaded access-records file by reading its contents in the test.

## 10.2 Test data

__Data item__

__Suggested value / source__

Past employee

Employee "Purge<ts>" created and terminated in setup

Vacancy with candidates

"Purge Vacancy <ts>" with two candidates

Admin password

Correct and wrong values

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

MNT-E2E-01

Admin re-authentication

1. Open Maintenance

2. Wrong password rejected

3. Correct password opens Purge Employee Records

MNT-FR-001

Smoke

MNT-E2E-02

Purge a past employee

1. Create and terminate employee

2. Verify current employees not offered

3. Purge and confirm

4. Employee absent from PIM past employees

MNT-FR-002

Regression

MNT-E2E-03

Purge candidates of vacancy

1. Create vacancy with 2 candidates and another vacancy with 1

2. Purge All on first vacancy

3. Only the other vacancy's candidate remains

MNT-FR-003

Regression

MNT-E2E-04

Download personal data

1. Select employee, Download

2. Verify file contains employee name and Employee Id

MNT-FR-004

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

MNT-FR-001

Re-authenticate before entering Maintenance

Administrator Access

Must

5

MNT-E2E-01

MNT-FR-002

Purge a past employee

Purge Records

Must

4

MNT-E2E-02

MNT-FR-003

Purge candidates of a vacancy

Purge Records

Must

4

MNT-E2E-03

MNT-FR-004

Download employee personal data

Access Records

Should

4

MNT-E2E-04

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

