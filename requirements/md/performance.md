<!-- Generated from requirements/brd/OrangeHRM_BRD_Performance.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Performance Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Performance Module

__Document ID__

BRD-PRF-001

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

PRF-FR-nnn

Functional requirement

PRF-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

PRF-VAL-nnn

Field-level validation rule

PRF-BR-nn

Business rule

PRF-NFR-nn

Non-functional requirement

PRF-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Performance module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Performance module runs periodic performance reviews and continuous performance tracking. Admins define Key Performance Indicators (KPIs) per job title and create reviews for employees with a supervisor reviewer. Employees complete a self-evaluation, reviewers evaluate and finalise the review with an overall rating. Performance Trackers let reviewers record positive and negative observations about an employee throughout the year.

## 1.3 Scope

__In scope__

- Configure: KPIs, Trackers.
- Manage Reviews: Manage Performance Reviews (Admin), My Reviews (employee), Employee Reviews (reviewer).
- Review lifecycle: Inactive, Activated, In Progress, Completed.
- Self-evaluation, supervisor evaluation and final evaluation.
- My Trackers and Employee Trackers with logs.

__Out of scope__

- Goal management and 360-degree feedback (not in OrangeHRM Open Source).
- Salary changes resulting from reviews.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__KPI__

Key Performance Indicator: a rated criterion attached to a Job Title, with a min and max rating

__Review__

An evaluation of one employee for a review period, with a supervisor reviewer and a due date

__Self-evaluation__

The employee's own ratings and comments for each KPI

__Final evaluation__

Reviewer's Final Comment, Final Rating and Completed Date that close a review

__Tracker__

Ongoing log of performance observations for one employee, maintained by named reviewers

# 2. User Roles and Permissions

Default OrangeHRM 5.x permissions. Reviewer rights come from being the Supervisor Reviewer on a review or a reviewer on a tracker.

__Capability__

__Admin__

__Reviewer / Supervisor__

__ESS__

__Configure KPIs and Trackers__

Yes

No

No

__Create, activate, edit, delete reviews__

Yes

No

No

__Manage Performance Reviews list__

All

No

No

__Employee Reviews (evaluate as reviewer)__

Yes

Own reviewees

No

__My Reviews (self-evaluation)__

Yes

Yes

Yes

__Employee Trackers (add logs)__

All

Assigned trackers

No

__My Trackers (view own)__

Yes

Yes

Yes

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Performance > Configure > KPIs

Key Performance Indicators

Maintain KPIs per job title

Performance > Configure > Trackers

Performance Trackers

Maintain trackers

Performance > Manage Reviews > Manage Performance Reviews

Manage Performance Reviews

Admin list and creation of reviews

Performance > Manage Reviews > My Reviews

My Reviews

Employee's own reviews

Performance > Manage Reviews > Employee Reviews

Employee Reviews

Reviews where user is reviewer

Performance > My Trackers

My Performance Trackers

Employee's own trackers

Performance > Employee Trackers

Employee Performance Trackers

Trackers where user is reviewer

# 4. Functional Requirements

## 4.1 KPI Configuration

### PRF-FR-001  Add and edit KPIs

__Description__

Admin defines a KPI with Key Performance Indicator*, Job Title*, Minimum Rating*, Maximum Rating* and Make Default Scale.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PRF-FR-001-AC1:__ Minimum Rating defaults to 1 and Maximum Rating to 100 (or to the default scale if one has been set).
- __PRF-FR-001-AC2:__ Ratings must be whole numbers from 0 to 100, with Minimum lower than Maximum.
- __PRF-FR-001-AC3:__ Turning on "Make Default Scale" makes this min/max the default for new KPIs.
- __PRF-FR-001-AC4:__ Saving shows "Successfully Saved" and the KPI appears in the list with Key Performance Indicator, Job Title, Min Rate, Max Rate, Is Default.
- __PRF-FR-001-AC5:__ Editing a KPI does not change ratings already entered in completed reviews.

### PRF-FR-002  Search and delete KPIs

__Description__

Admin filters KPIs by Job Title and deletes KPIs.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PRF-FR-002-AC1:__ Job Title filter shows only KPIs of that title; Reset shows all.
- __PRF-FR-002-AC2:__ Delete (single or bulk) asks for confirmation and shows "Successfully Deleted".
- __PRF-FR-002-AC3:__ Deleted KPIs are not added to new reviews; existing reviews keep their KPI snapshot.

## 4.2 Tracker Configuration

### PRF-FR-003  Maintain performance trackers

__Description__

Admin creates trackers with Tracker Name*, Employee Name* and Reviewers*.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PRF-FR-003-AC1:__ Employee Name and Reviewers are employee autocompletes; multiple reviewers can be added.
- __PRF-FR-003-AC2:__ The employee cannot be one of their own reviewers.
- __PRF-FR-003-AC3:__ The list shows Tracker, Employee Name, Date Added, Modified Date and can be filtered by Employee Name.
- __PRF-FR-003-AC4:__ Edit and delete are available; a tracker with logs asks for confirmation before deletion.

## 4.3 Review Administration

### PRF-FR-004  Create a performance review

__Description__

Admin creates a review with Employee Name*, Supervisor Reviewer*, Review Period Start Date*, End Date* and Due Date*.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PRF-FR-004-AC1:__ Supervisor Reviewer autocomplete offers the employee's supervisors (from Report-to) and other employees.
- __PRF-FR-004-AC2:__ End Date must be after Start Date and Due Date must be on or after Start Date.
- __PRF-FR-004-AC3:__ "Save" creates the review with status "Inactive"; "Activate" creates it with status "Activated" and makes it visible to employee and reviewer.
- __PRF-FR-004-AC4:__ Activation fails if the employee's Job Title has no KPIs, with an explanatory message.
- __PRF-FR-004-AC5:__ The review takes a snapshot of the KPIs of the employee's job title at activation.

### PRF-FR-005  Search and manage reviews

__Description__

Admin filters reviews by Employee Name, Job Title, Sub Unit, Include (current/past), Review Status, From Date and To Date.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PRF-FR-005-AC1:__ Columns: Employee, Job Title, Sub Unit, Review Period, Due Date, Reviewer, Review Status, Actions.
- __PRF-FR-005-AC2:__ Inactive reviews can be edited and deleted; activated and later reviews can be viewed but not deleted by default.
- __PRF-FR-005-AC3:__ Review Status filter offers Inactive, Activated, In Progress, Completed.

## 4.4 Evaluation

### PRF-FR-006  Employee self-evaluation

__Description__

Employee opens their review from My Reviews and rates each KPI with comments.

__Priority__

Must

__Roles__

ESS

__Acceptance criteria__

- __PRF-FR-006-AC1:__ My Reviews lists Job Title, Sub Unit, Review Period, Due Date, Self Evaluation Status, Review Status and Actions.
- __PRF-FR-006-AC2:__ The evaluation shows each KPI with Min/Max, a Rating input and a Comment, plus a General Comment.
- __PRF-FR-006-AC3:__ Ratings outside the KPI's min/max are rejected ("Should be within Min and Max").
- __PRF-FR-006-AC4:__ "Save" stores a draft and moves the review status to "In Progress"; "Complete" asks for confirmation and locks the self-evaluation.
- __PRF-FR-006-AC5:__ After completion, the employee can view but not change their ratings.
- __PRF-FR-006-AC6:__ The employee cannot see the supervisor's ratings until the review is completed.

### PRF-FR-007  Reviewer evaluation

__Description__

Reviewer opens the review from Employee Reviews and rates each KPI.

__Priority__

Must

__Roles__

Reviewer, Admin

__Acceptance criteria__

- __PRF-FR-007-AC1:__ Employee Reviews lists reviews where the user is reviewer, filterable by Employee Name, Job Title, Sub Unit, Review Status and dates.
- __PRF-FR-007-AC2:__ The reviewer sees the employee's self-evaluation (once completed) alongside their own rating inputs.
- __PRF-FR-007-AC3:__ Ratings must be within each KPI's min/max.
- __PRF-FR-007-AC4:__ "Save" keeps the review In Progress.

### PRF-FR-008  Finalise review

__Description__

Reviewer completes the review with Final Comment, Final Rating* and Completed Date*.

__Priority__

Must

__Roles__

Reviewer, Admin

__Acceptance criteria__

- __PRF-FR-008-AC1:__ Final Rating accepts a number within the rating scale; Completed Date is mandatory.
- __PRF-FR-008-AC2:__ "Complete" asks for confirmation, sets Review Status "Completed" and locks all evaluations.
- __PRF-FR-008-AC3:__ The completed review shows both evaluations and the final evaluation to the employee in My Reviews.
- __PRF-FR-008-AC4:__ A review cannot be completed without a Final Rating ("Required").

## 4.5 Performance Trackers

### PRF-FR-009  Add tracker logs

__Description__

In Employee Trackers, a reviewer opens a tracker and adds logs with Log*, Comment* and achievement (Positive / Negative).

__Priority__

Should

__Roles__

Reviewer, Admin

__Acceptance criteria__

- __PRF-FR-009-AC1:__ Employee Trackers lists trackers where the user is reviewer, filterable by Employee Name.
- __PRF-FR-009-AC2:__ Each log appears with the reviewer name, date, log text, comment and a thumbs-up/down icon.
- __PRF-FR-009-AC3:__ The tracker header shows counts of positive and negative logs.
- __PRF-FR-009-AC4:__ A reviewer can edit and delete only logs they created.

### PRF-FR-010  View my trackers

__Description__

Employee views trackers where they are the subject.

__Priority__

Should

__Roles__

ESS

__Acceptance criteria__

- __PRF-FR-010-AC1:__ My Trackers lists the employee's trackers with Tracker, Added Date and Modified Date.
- __PRF-FR-010-AC2:__ Opening a tracker shows all logs in read-only mode with positive/negative counts.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

PRF-VAL-001

KPI

Key Performance Indicator

Yes

Max 100 characters

"Required"; "Should not exceed 100 characters"

PRF-VAL-002

KPI

Job Title

Yes

Selected

"Required"

PRF-VAL-003

KPI

Minimum / Maximum Rating

Yes

Integer 0–100; Min < Max

"Required"; "Should be a number between 0-100"; "Minimum Rating should be less than Maximum Rating"

PRF-VAL-004

Tracker

Tracker Name

Yes

Max 200 characters

"Required"

PRF-VAL-005

Tracker

Employee Name / Reviewers

Yes

Valid employees; employee not a reviewer

"Required"; "Invalid"

PRF-VAL-006

Add Review

Employee Name / Supervisor Reviewer

Yes

Valid employees; different persons

"Required"; "Invalid"

PRF-VAL-007

Add Review

Start / End Date

Yes

End after Start

"Required"; "End date should be after start date"

PRF-VAL-008

Add Review

Due Date

Yes

On or after Start Date

"Required"; "Due date should be after review period start date"

PRF-VAL-009

Evaluation

KPI Rating

No (draft) / per KPI

Within KPI min–max

"Should be within Min and Max"

PRF-VAL-010

Evaluation

Comments

No

Max 1000 characters

"Should not exceed 1000 characters"

PRF-VAL-011

Final Evaluation

Final Rating

Yes

Number within scale

"Required"; "Should be a number"

PRF-VAL-012

Final Evaluation

Completed Date

Yes

Valid date

"Required"

PRF-VAL-013

Tracker Log

Log / Comment

Yes

Max 150 / 3000 characters

"Required"; "Should not exceed ... characters"

# 6. Business Rules

__ID__

__Rule__

PRF-BR-01

KPIs are defined per Job Title; a review uses the KPIs of the employee's Job Title at activation.

PRF-BR-02

Review status flow: Inactive → Activated → In Progress → Completed. Only Inactive reviews can be edited or deleted.

PRF-BR-03

An employee cannot review themselves; the Supervisor Reviewer must be a different employee.

PRF-BR-04

Ratings must lie within each KPI's min and max.

PRF-BR-05

Completing a self-evaluation locks it; completing the review locks everything.

PRF-BR-06

The employee sees the reviewer's ratings only after the review is Completed.

PRF-BR-07

Only the reviewers named on a tracker (and Admin) can add logs to it.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

KPI / tracker / review saved

Success: Successfully Saved

Toast (success)

Evaluation saved or completed

Success: Successfully Updated / Successfully Saved

Toast (success)

Delete

Success: Successfully Deleted

Toast (success)

Complete clicked

Review will be completed... confirmation

Modal dialog

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

PRF-NFR-01

Data integrity

Changing KPIs or job titles after activation does not alter existing reviews.

PRF-NFR-02

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

PRF-NFR-03

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

PRF-NFR-04

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

PRF-NFR-05

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

PRF-NFR-06

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- A test job title with at least two KPIs exists, and the test employee has that job title and a supervisor.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: employees, job titles, Report-to.
- Admin: Job Titles.
- Dashboard "My Actions" shows pending reviews.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- The full review flow needs three sessions (Admin, employee, reviewer); use separate browser contexts.
- Create KPIs, review and tracker via API (/web/index.php/api/v2/performance/...) for focused tests; keep one UI end-to-end flow.
- Completed reviews cannot be deleted from the UI; use a fresh employee per run or clean up via database/API.

## 10.2 Test data

__Data item__

__Suggested value / source__

Job title

"Auto Perf Title <ts>"

KPIs

"Code Quality" 1–5, "Delivery" 1–5

Employees

Employee (ESS login) with job title; Reviewer (ESS login) as supervisor

Review period

First to last day of current month; due date = last day + 7

Ratings

Valid 4; invalid 0 and 6 for a 1–5 KPI

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

PRF-E2E-01

Full review cycle

1. Admin creates KPIs for job title

2. Admin creates and activates review

3. Employee completes self-evaluation

4. Reviewer evaluates and completes with Final Rating

5. Employee sees Completed review with ratings

PRF-FR-001, PRF-FR-004, PRF-FR-006, PRF-FR-007, PRF-FR-008

Smoke

PRF-E2E-02

Rating range validation

1. Enter rating outside KPI range, verify error

2. KPI with Min ≥ Max rejected

PRF-FR-006, PRF-FR-001

Regression

PRF-E2E-03

Inactive review edit and delete

1. Save review as Inactive

2. Edit dates

3. Delete review

4. Verify not in list

PRF-FR-004, PRF-FR-005

Regression

PRF-E2E-04

Activation without KPIs fails

1. Employee with job title lacking KPIs

2. Try Activate, verify message

PRF-FR-004

Regression

PRF-E2E-05

Tracker logs

1. Admin creates tracker with reviewer

2. Reviewer adds positive and negative log

3. Employee views logs read-only with counts

PRF-FR-003, PRF-FR-009, PRF-FR-010

Regression

PRF-E2E-06

Role visibility

1. ESS without reviews: no Configure, no Manage Performance Reviews

2. Reviewer sees only own reviewees in Employee Reviews

PRF-FR-005, PRF-FR-007

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

PRF-FR-001

Add and edit KPIs

KPI Configuration

Must

5

PRF-E2E-01, PRF-E2E-02

PRF-FR-002

Search and delete KPIs

KPI Configuration

Should

3

Functional test

PRF-FR-003

Maintain performance trackers

Tracker Configuration

Should

4

PRF-E2E-05

PRF-FR-004

Create a performance review

Review Administration

Must

5

PRF-E2E-01, PRF-E2E-03, PRF-E2E-04

PRF-FR-005

Search and manage reviews

Review Administration

Must

3

PRF-E2E-03, PRF-E2E-06

PRF-FR-006

Employee self-evaluation

Evaluation

Must

6

PRF-E2E-01, PRF-E2E-02

PRF-FR-007

Reviewer evaluation

Evaluation

Must

4

PRF-E2E-01, PRF-E2E-06

PRF-FR-008

Finalise review

Evaluation

Must

4

PRF-E2E-01

PRF-FR-009

Add tracker logs

Performance Trackers

Should

4

PRF-E2E-05

PRF-FR-010

View my trackers

Performance Trackers

Should

2

PRF-E2E-05

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

