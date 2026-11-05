<!-- Generated from requirements/brd/OrangeHRM_BRD_Time.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Time Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Time Module

__Document ID__

BRD-TIM-001

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

TIM-FR-nnn

Functional requirement

TIM-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

TIM-VAL-nnn

Field-level validation rule

TIM-BR-nn

Business rule

TIM-NFR-nn

Non-functional requirement

TIM-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Time module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Time module records how employees spend their time and when they are at work. It has three areas: weekly Timesheets against customer projects and activities with a submit/approve workflow; Attendance through punch in and punch out; and Project Info (customers, projects, activities) that timesheets are logged against. Reports summarise time by project, by employee and attendance.

## 1.3 Scope

__In scope__

- Timesheet period definition (first-time setup).
- My Timesheets: create, edit, submit; Employee Timesheets: view, approve, reject, edit, reset.
- Attendance: Punch In/Out, My Records, Employee Records, Attendance Configuration.
- Project Info: Customers, Projects, Activities, Project Admins.
- Reports: Project Reports, Employee Reports, Attendance Summary.

__Out of scope__

- Billing and invoicing from timesheets (not provided by OrangeHRM Open Source).
- Work shift definitions (Admin BRD).
- Mobile app punch-in.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Timesheet__

One employee's hours for one timesheet period (a week)

__Timesheet period__

Week length and first day of the week, defined once by Admin

__Project Admin__

Employee assigned as administrator of a project; can view and act on time for that project

__Punch In / Punch Out__

Start and end of an attendance record

__Activity__

A task within a project that time is logged against

# 2. User Roles and Permissions

Default OrangeHRM 5.x permissions. Supervisor rights come from PIM Report-to; Project Admin rights from Project Info.

__Capability__

__Admin__

__Supervisor__

__Project Admin__

__ESS__

__My Timesheets, Punch In/Out, My Records__

Yes

Yes

Yes

Yes

__Employee Timesheets: view / approve / reject__

All

Subordinates

No

No

__Edit others' timesheets__

Yes

Yes (subordinates)

No

No

__Employee attendance records__

All

Subordinates

No

No

__Attendance Configuration__

Yes

No

No

No

__Customers and Projects__

Yes

No

Own projects (view)

No

__Project Reports__

All projects

No

Own projects

No

__Employee Reports, Attendance Summary__

All

Subordinates

No

No

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Time > Timesheets > My Timesheets

My Timesheet

Log and submit own time

Time > Timesheets > Employee Timesheets

Employee Timesheets

Find, approve, reject and edit timesheets

Time > Attendance > My Records

My Attendance Records

View own attendance

Time > Attendance > Punch In/Out

Punch In / Punch Out

Record attendance

Time > Attendance > Employee Records

Employee Attendance Records

View and edit others' attendance

Time > Attendance > Configuration

Attendance Configuration

Attendance permissions

Time > Reports > Project Reports / Employee Reports / Attendance Summary

Reports

Time and attendance reports

Time > Project Info > Customers

Customers

Maintain customers

Time > Project Info > Projects

Projects

Maintain projects, activities and project admins

# 4. Functional Requirements

## 4.1 Timesheet Period

### TIM-FR-001  Define timesheet period

__Description__

On first use, Admin sets First Day of Week*, which defines a weekly timesheet period.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __TIM-FR-001-AC1:__ Until the period is defined, Time pages show the "Define Timesheet Period" form (Admin) or a message that the period is not defined (non-admin).
- __TIM-FR-001-AC2:__ First Day of Week lists Monday to Sunday.
- __TIM-FR-001-AC3:__ After saving, timesheets start on the chosen day and cover seven days.

## 4.2 My Timesheets

### TIM-FR-002  View and navigate own timesheet

__Description__

Employee opens the timesheet for the current week and navigates to other weeks.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __TIM-FR-002-AC1:__ The page shows the Timesheet Period with previous/next arrows and a date picker, and the Status.
- __TIM-FR-002-AC2:__ If no timesheet exists for the week, a "Create Timesheet" button is shown; creating it shows "Successfully Created"/"Successfully Saved" and status "Not Submitted".
- __TIM-FR-002-AC3:__ The grid shows Project, Activity, one column per day with dates, and a Total column; a Total row sums each day.
- __TIM-FR-002-AC4:__ Actions shown depend on status: Edit and Submit (Not Submitted / Rejected); none for Submitted or Approved.
- __TIM-FR-002-AC5:__ An "Actions Performed on the Timesheet" section lists each action with Performed By, Date and Comment.

### TIM-FR-003  Enter time on a timesheet

__Description__

Employee edits the timesheet by adding rows (Project*, Activity*) and hours per day.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __TIM-FR-003-AC1:__ Project is an autocomplete of "Customer - Project" names; Activity lists activities of the selected project only.
- __TIM-FR-003-AC2:__ Hours accept decimal (e.g. 7.5) or hh:mm (e.g. 07:30) format.
- __TIM-FR-003-AC3:__ Each cell must be between 0 and 24, and each day's total across rows must not exceed 24 hours.
- __TIM-FR-003-AC4:__ The same Project and Activity combination cannot appear on two rows ("Duplicate Record").
- __TIM-FR-003-AC5:__ "Add Row" adds a blank row; the row trash icon removes it; "Reset" reverts unsaved changes; Cancel discards.
- __TIM-FR-003-AC6:__ Save shows "Successfully Saved" and totals are recalculated.

### TIM-FR-004  Submit timesheet

__Description__

Employee submits the timesheet for approval.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __TIM-FR-004-AC1:__ Submit changes Status to "Submitted" and shows "Timesheet Submitted".
- __TIM-FR-004-AC2:__ A submitted timesheet cannot be edited by the employee.
- __TIM-FR-004-AC3:__ The action log records "Submitted" with the employee's name and date.
- __TIM-FR-004-AC4:__ The timesheet appears in the approver's "Timesheets Pending Action" list.

## 4.3 Employee Timesheets

### TIM-FR-005  Find employee timesheets

__Description__

Approver searches by Employee Name* and sees a list of timesheets pending action.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __TIM-FR-005-AC1:__ "Timesheets Pending Action" lists Employee Name, Timesheet Period and a View action for submitted timesheets within scope.
- __TIM-FR-005-AC2:__ Selecting an employee and clicking View opens that employee's timesheet for the current period.
- __TIM-FR-005-AC3:__ Supervisors can search and view only subordinates.

### TIM-FR-006  Approve or reject timesheet

__Description__

Approver approves or rejects a submitted timesheet with an optional comment.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __TIM-FR-006-AC1:__ A Comment box (max 255) with Approve and Reject buttons is shown for submitted timesheets.
- __TIM-FR-006-AC2:__ Approve sets Status "Approved" and shows "Timesheet Approved".
- __TIM-FR-006-AC3:__ Reject sets Status "Rejected" and shows "Timesheet Rejected"; the employee can edit and resubmit.
- __TIM-FR-006-AC4:__ The action and comment are recorded in the action log.

### TIM-FR-007  Edit and reset others' timesheets

__Description__

Approver can edit an employee's timesheet, and Admin can reset an approved timesheet.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __TIM-FR-007-AC1:__ Approver can Edit a Not Submitted or Rejected timesheet of a subordinate with the same rules as My Timesheets.
- __TIM-FR-007-AC2:__ Admin sees "Reset" on approved timesheets; resetting returns the status to "Not Submitted" and logs the action.

## 4.4 Attendance

### TIM-FR-008  Punch in

__Description__

Employee records the start of work with Date*, Time* and an optional Note.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __TIM-FR-008-AC1:__ Date and Time default to the current date and time; they are editable only if Configuration allows changing current time.
- __TIM-FR-008-AC2:__ On "In", "Successfully Saved" appears and the page switches to Punch Out showing the Punched In time.
- __TIM-FR-008-AC3:__ A punch in that overlaps an existing record is rejected with "Overlapping Records Found".

### TIM-FR-009  Punch out

__Description__

Employee records the end of work.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __TIM-FR-009-AC1:__ The Punch Out page shows "Punched In Time" and Note, and Date*, Time*, Note for punch out.
- __TIM-FR-009-AC2:__ Punch out must be later than punch in ("Punch out Time should be later than punch in time").
- __TIM-FR-009-AC3:__ On "Out", the record is completed and the page returns to Punch In.
- __TIM-FR-009-AC4:__ Duration (hours) is calculated as punch out minus punch in, including time zone offsets.

### TIM-FR-010  View my attendance records

__Description__

Employee views attendance for a selected Date*.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __TIM-FR-010-AC1:__ Records list Punch In, Punch In Note, Punch Out, Punch Out Note, Duration (Hours) and the total duration.
- __TIM-FR-010-AC2:__ Edit and Delete actions are shown only if Configuration allows employees to edit/delete their own records.
- __TIM-FR-010-AC3:__ No records shows "No Records Found".

### TIM-FR-011  View and edit employee attendance records

__Description__

Approver views attendance by Employee Name and Date*.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __TIM-FR-011-AC1:__ Without an employee name, a summary lists each employee in scope with Total Duration for the date.
- __TIM-FR-011-AC2:__ View opens individual records with Punch In/Out, notes and Duration.
- __TIM-FR-011-AC3:__ Admin (and Supervisor if configured) can edit and delete records; edits respect overlap and order validations.

### TIM-FR-012  Configure attendance permissions

__Description__

Admin toggles: Employee can change current time when punching in/out; Employee can edit/delete own attendance records; Supervisor can add/edit/delete attendance records of subordinates.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __TIM-FR-012-AC1:__ Saving shows "Successfully Saved".
- __TIM-FR-012-AC2:__ Each toggle immediately changes the corresponding behaviour in Punch In/Out, My Records and Employee Records.

## 4.5 Project Info

### TIM-FR-013  Maintain customers

__Description__

Admin adds, edits and deletes customers with Name* and Description.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __TIM-FR-013-AC1:__ Name is mandatory, max 50 characters, unique ("Already exists"); Description max 255.
- __TIM-FR-013-AC2:__ The list shows Name and Description with edit/delete and bulk delete.
- __TIM-FR-013-AC3:__ A customer whose projects have logged time cannot be deleted; the user is informed.

### TIM-FR-014  Maintain projects

__Description__

Admin adds projects with Name*, Customer Name*, Description and Project Admin(s).

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __TIM-FR-014-AC1:__ Customer Name is an autocomplete; "+ Add Customer" allows creating a customer inline.
- __TIM-FR-014-AC2:__ Project Name is mandatory, max 50 characters, and unique within the customer.
- __TIM-FR-014-AC3:__ Multiple Project Admins can be added via employee autocomplete.
- __TIM-FR-014-AC4:__ After saving, the Activities section appears on the edit page.
- __TIM-FR-014-AC5:__ The list can be searched by Customer Name, Project and Project Admin, and shows Customer Name, Project, Project Admins.
- __TIM-FR-014-AC6:__ Projects with logged time cannot be deleted.

### TIM-FR-015  Maintain project activities

__Description__

Admin adds, edits and deletes activities of a project and can copy activities from another project.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __TIM-FR-015-AC1:__ Activity Name* is mandatory, max 100 characters, unique within the project.
- __TIM-FR-015-AC2:__ "Copy From" lets Admin pick a project and select its activities to copy; duplicates are skipped.
- __TIM-FR-015-AC3:__ Activities appear in the Activity drop-down of timesheets for that project.
- __TIM-FR-015-AC4:__ Activities with logged time cannot be deleted.

## 4.6 Time Reports

### TIM-FR-016  Project report

__Description__

Report time by Project Name*, Project Date Range and "Only Include Approved Timesheets".

__Priority__

Should

__Roles__

Admin, Project Admin

__Acceptance criteria__

- __TIM-FR-016-AC1:__ Output lists Activity Name and Time (Hours) with a total for the project.
- __TIM-FR-016-AC2:__ Clicking an activity shows time per employee for that activity.
- __TIM-FR-016-AC3:__ With the approved-only toggle on, hours from non-approved timesheets are excluded.
- __TIM-FR-016-AC4:__ Project Admins can choose only projects they administer.

### TIM-FR-017  Employee report

__Description__

Report time by Employee Name*, Project Name, Activity Name, date range and approved-only toggle.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __TIM-FR-017-AC1:__ Output lists Project Name, Activity Name and Time (Hours) with a total.
- __TIM-FR-017-AC2:__ Totals reconcile with the employee's timesheets for the range.

### TIM-FR-018  Attendance summary

__Description__

Report attendance by Employee Name, Job Title, Sub Unit, Employment Status and date range.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __TIM-FR-018-AC1:__ Output lists Employee Name and Total Duration (hours).
- __TIM-FR-018-AC2:__ Totals equal the sum of the employee's attendance records in the range.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

TIM-VAL-001

Timesheet Period

First Day of Week

Yes

Selected

"Required"

TIM-VAL-002

Timesheet

Project

Yes (per row)

Chosen from autocomplete

"Required"; "Invalid"

TIM-VAL-003

Timesheet

Activity

Yes (per row)

Activity of the selected project

"Required"

TIM-VAL-004

Timesheet

Hours cell

No

Decimal or hh:mm; 0–24

"Should be a valid time"; "Should be less than 24"

TIM-VAL-005

Timesheet

Daily total

-

≤ 24 hours per day across rows

"Total should be less than 24 hours"

TIM-VAL-006

Timesheet

Project + Activity

-

Unique per timesheet

"Duplicate Record"

TIM-VAL-007

Approve/Reject

Comment

No

Max 255 characters

"Should not exceed 255 characters"

TIM-VAL-008

Punch In/Out

Date / Time

Yes

Valid date and time

"Required"; "Should be a valid date"

TIM-VAL-009

Punch In/Out

Note

No

Max 250 characters

"Should not exceed 250 characters"

TIM-VAL-010

Punch Out

Time

Yes

Later than punch in

"Punch out Time should be later than punch in time"

TIM-VAL-011

Punch In / Edit record

Date / Time

-

No overlap with other records

"Overlapping Records Found"

TIM-VAL-012

Employee Records

Date

Yes

Valid date

"Required"

TIM-VAL-013

Customers

Name

Yes

Max 50; unique

"Required"; "Should not exceed 50 characters"; "Already exists"

TIM-VAL-014

Customers / Projects

Description

No

Max 255

"Should not exceed 255 characters"

TIM-VAL-015

Projects

Name

Yes

Max 50; unique per customer

"Required"; "Already exists"

TIM-VAL-016

Projects

Customer Name

Yes

Chosen from autocomplete

"Required"; "Invalid"

TIM-VAL-017

Projects

Project Admin

No

Valid employee

"Invalid"

TIM-VAL-018

Activities

Name

Yes

Max 100; unique per project

"Required"; "Already exists"

TIM-VAL-019

Reports

Project Name / Employee Name

Yes

Chosen from autocomplete

"Required"; "Invalid"

TIM-VAL-020

Reports

To date

No

After From date

"To date should be after from date"

# 6. Business Rules

__ID__

__Rule__

TIM-BR-01

A timesheet period must be defined before timesheets can be used; it applies to all employees.

TIM-BR-02

One timesheet exists per employee per period.

TIM-BR-03

Timesheet status flow: Not Submitted → Submitted → Approved or Rejected; Rejected → (edit) → Submitted; Approved → Not Submitted only by Admin Reset.

TIM-BR-04

Only Not Submitted and Rejected timesheets are editable.

TIM-BR-05

An employee cannot approve their own timesheet.

TIM-BR-06

No day may exceed 24 hours in total.

TIM-BR-07

An employee can have only one open (punched-in, not punched-out) attendance record at a time, and records cannot overlap.

TIM-BR-08

Customer, project and activity names are unique in their scope; items with logged time cannot be deleted.

TIM-BR-09

Project Admins see report data only for projects they administer.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Timesheet created / saved

Success: Successfully Saved

Toast (success)

Timesheet submitted

Success: Timesheet Submitted

Toast (success)

Timesheet approved / rejected

Success: Timesheet Approved / Timesheet Rejected

Toast (success)

Punch in / out

Success: Successfully Saved

Toast (success)

Overlapping attendance

Overlapping Records Found

Inline / toast (error)

No data

Info: No Records Found

Toast (info)

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

TIM-NFR-01

Accuracy

Durations are computed to two decimals and reports match the sum of underlying records.

TIM-NFR-02

Time zone

Attendance records store the user's time zone offset and display durations correctly across offsets.

TIM-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

TIM-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

TIM-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

TIM-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

TIM-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- The timesheet period is already defined in the test environment (Monday start).
- At least one customer, project and activity exist, or are created in test setup.
- Attendance configuration toggles are at their defaults unless a test changes and restores them.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: employees and Report-to for approvers.
- Admin: Modules toggle (Time enabled), Localization date format.
- Dashboard "Time at Work" widget reads attendance data.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Each employee can only punch in once until they punch out; always punch out (or delete the record via API) in teardown, otherwise later runs fail.
- Timesheet tests should target a specific past or future week via the date picker to avoid conflicts with other tests on the current week.
- Timesheet grid inputs are positional; locate cells by row index and day column header.
- Create customers/projects/activities via API (/web/index.php/api/v2/time/...) in setup.
- Approval flows require two browser contexts (employee and supervisor).

## 10.2 Test data

__Data item__

__Suggested value / source__

Customer

"Auto Customer <ts>"

Project

"Auto Project <ts>" with activities "Development", "Testing"

Employee/Supervisor

ESS employee with supervisor (both with logins)

Hours

8, 7.5, 07:30; negatives 25, -1, "abc", two rows summing 25

Attendance

Punch in 09:00, punch out 17:30 (8.50 h); negative punch out 08:00

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

TIM-E2E-01

Timesheet submit and approve

1. Employee creates timesheet for a target week

2. Adds row Project/Activity with 8 h Mon–Fri, saves

3. Submits

4. Supervisor finds it in pending list and approves

5. Employee sees Approved

TIM-FR-002, TIM-FR-003, TIM-FR-004, TIM-FR-005, TIM-FR-006

Smoke

TIM-E2E-02

Reject and resubmit

1. Supervisor rejects with comment

2. Employee edits hours and resubmits

3. Action log shows Submitted, Rejected, Submitted

TIM-FR-006, TIM-FR-003, TIM-FR-004

Regression

TIM-E2E-03

Timesheet validations

1. Enter 25 h, verify error

2. Add duplicate Project/Activity row, verify "Duplicate Record"

3. Two rows totalling >24 h on a day, verify error

TIM-FR-003

Regression

TIM-E2E-04

Admin reset approved timesheet

1. Approved timesheet

2. Admin clicks Reset

3. Status Not Submitted and employee can edit

TIM-FR-007

Regression

TIM-E2E-05

Punch in and punch out

1. Punch in with note

2. Punch out later the same day

3. My Records shows record with correct duration

TIM-FR-008, TIM-FR-009, TIM-FR-010

Smoke

TIM-E2E-06

Attendance validations

1. Punch out earlier than punch in, verify error

2. Punch in overlapping an existing record, verify "Overlapping Records Found"

TIM-FR-009, TIM-FR-008

Regression

TIM-E2E-07

Attendance configuration effects

1. Disable "employee can change current time", verify date/time read-only

2. Enable edit/delete own records, verify actions appear

3. Restore defaults

TIM-FR-012, TIM-FR-010, TIM-FR-011

Regression

TIM-E2E-08

Customer, project and activities

1. Create customer, project with Project Admin, two activities

2. Copy activities into another project

3. Verify project selectable in timesheet

TIM-FR-013, TIM-FR-014, TIM-FR-015

Regression

TIM-E2E-09

Reports reconcile

1. After E2E-01 and E2E-05 data

2. Project report shows 40 h

3. Employee report shows 40 h

4. Attendance summary shows record duration

TIM-FR-016, TIM-FR-017, TIM-FR-018

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

TIM-FR-001

Define timesheet period

Timesheet Period

Must

3

Functional test

TIM-FR-002

View and navigate own timesheet

My Timesheets

Must

5

TIM-E2E-01

TIM-FR-003

Enter time on a timesheet

My Timesheets

Must

6

TIM-E2E-01, TIM-E2E-02, TIM-E2E-03

TIM-FR-004

Submit timesheet

My Timesheets

Must

4

TIM-E2E-01, TIM-E2E-02

TIM-FR-005

Find employee timesheets

Employee Timesheets

Must

3

TIM-E2E-01

TIM-FR-006

Approve or reject timesheet

Employee Timesheets

Must

4

TIM-E2E-01, TIM-E2E-02

TIM-FR-007

Edit and reset others' timesheets

Employee Timesheets

Should

2

TIM-E2E-04

TIM-FR-008

Punch in

Attendance

Must

3

TIM-E2E-05, TIM-E2E-06

TIM-FR-009

Punch out

Attendance

Must

4

TIM-E2E-05, TIM-E2E-06

TIM-FR-010

View my attendance records

Attendance

Must

3

TIM-E2E-05, TIM-E2E-07

TIM-FR-011

View and edit employee attendance records

Attendance

Should

3

TIM-E2E-07

TIM-FR-012

Configure attendance permissions

Attendance

Should

2

TIM-E2E-07

TIM-FR-013

Maintain customers

Project Info

Must

3

TIM-E2E-08

TIM-FR-014

Maintain projects

Project Info

Must

6

TIM-E2E-08

TIM-FR-015

Maintain project activities

Project Info

Must

4

TIM-E2E-08

TIM-FR-016

Project report

Time Reports

Should

4

TIM-E2E-09

TIM-FR-017

Employee report

Time Reports

Should

2

TIM-E2E-09

TIM-FR-018

Attendance summary

Time Reports

Should

2

TIM-E2E-09

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

