<!-- Generated from requirements/brd/OrangeHRM_BRD_Leave.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Leave Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Leave Module

__Document ID__

BRD-LV-001

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

LV-FR-nnn

Functional requirement

LV-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

LV-VAL-nnn

Field-level validation rule

LV-BR-nn

Business rule

LV-NFR-nn

Non-functional requirement

LV-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Leave module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Leave module manages the full leave lifecycle: configuring the leave period, leave types, work week and holidays; granting entitlements; employees applying for leave; supervisors and administrators approving, rejecting or cancelling requests; and reporting on entitlement and usage.

Leave balances are calculated from entitlements minus leave that is pending approval, scheduled or taken, and only working days (per Work Week and Holidays) are counted.

## 1.3 Scope

__In scope__

- Configure: Leave Period, Leave Types, Work Week, Holidays.
- Entitlements: Add Entitlements (individual and bulk), Employee Entitlements, My Entitlements.
- Apply leave (ESS), Assign Leave (Admin/Supervisor), including partial days and durations.
- My Leave and Leave List: search, view details, comment, approve, reject, cancel (whole request and per day).
- Leave Entitlements and Usage Report and My Leave Entitlements and Usage Report.
- Leave status lifecycle and balance calculation.

__Out of scope__

- Employee creation and Report-to setup (PIM BRD), which this module depends on.
- Email notification delivery (Admin > Email Configuration / Subscriptions); only the in-app behaviour is covered here.
- Leave accrual and carry-forward rules, which OrangeHRM Open Source does not automate.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Leave Period__

The 12-month cycle (for example 01 Jan to 31 Dec) to which entitlements and usage belong

__Entitlement__

Number of days of a leave type granted to an employee for a leave period

__Leave Balance__

Entitlement minus days Pending Approval, Scheduled and Taken

__Pending Approval__

Leave applied by an employee and awaiting action

__Scheduled__

Leave approved (or assigned) for a future date

__Taken__

Scheduled leave whose date has passed

__Rejected / Cancelled__

Leave that will not be taken and does not consume balance

__Situational leave type__

A leave type flagged "Is Entitlement Situational", e.g. for life events; shown separately

# 2. User Roles and Permissions

Default OrangeHRM 5.x permissions. A Supervisor is any employee with subordinates through PIM Report-to.

__Capability__

__Admin__

__Supervisor__

__ESS__

__Apply leave for self__

Yes

Yes

Yes

__My Leave / My Entitlements / My report__

Yes

Yes

Yes

__Leave List (others' leave)__

All employees

Subordinates

No

__Approve / reject / cancel others' leave__

All employees

Subordinates

No

__Assign Leave__

All employees

Subordinates

No

__Add / edit / delete entitlements__

Yes

No

No

__View Employee Entitlements__

All employees

Subordinates

No

__Leave Entitlements and Usage Report__

All employees

Subordinates

No

__Configure (Period, Types, Work Week, Holidays)__

Yes

No

No

- An ESS user can cancel their own leave while it is Pending Approval or Scheduled, but cannot approve or reject it.

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Leave > Apply

Apply Leave

Employee applies for leave

Leave > My Leave

My Leave List

Employee views and cancels own leave

Leave > Entitlements > Add Entitlements

Add Entitlement

Grant entitlement to one or many employees

Leave > Entitlements > Employee Entitlements

Leave Entitlements

View/edit/delete an employee's entitlements

Leave > Entitlements > My Entitlements

My Leave Entitlements

Employee views own entitlements

Leave > Reports > Leave Entitlements and Usage Report

Usage report

Report by leave type or by employee

Leave > Reports > My Leave Entitlements and Usage Report

My usage report

Employee's own report

Leave > Configure > Leave Period

Leave Period

Define start of leave year

Leave > Configure > Leave Types

Leave Types

Maintain leave types

Leave > Configure > Work Week

Work Week

Define working, half and non-working days

Leave > Configure > Holidays

Holidays

Maintain holidays

Leave > Leave List

Leave List

Admin/Supervisor review and action of leave

Leave > Assign Leave

Assign Leave

Admin/Supervisor records leave on behalf of an employee

# 4. Functional Requirements

## 4.1 Leave Configuration

Configuration must exist before leave can be applied. On a fresh installation the Leave menu prompts the Admin to define the Leave Period first.

### LV-FR-001  Define leave period

__Description__

Admin sets Start Month* and Start Date*; the End Date is derived as the day before the same date one year later.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __LV-FR-001-AC1:__ Start Month lists January to December; Start Date lists valid days for the chosen month.
- __LV-FR-001-AC2:__ End Date is displayed read-only and updates when start values change.
- __LV-FR-001-AC3:__ The "Current Leave Period" is displayed, e.g. "2026-01-01 - 2026-12-31".
- __LV-FR-001-AC4:__ Saving shows "Successfully Saved", after which all Leave menu items become available.
- __LV-FR-001-AC5:__ Until a leave period is defined, other Leave pages redirect to the Leave Period page.

### LV-FR-002  Maintain leave types

__Description__

Admin adds, edits and deletes leave types with Name* and "Is Entitlement Situational" (Yes/No, default No).

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __LV-FR-002-AC1:__ The list shows Leave Types with a record count and edit/delete actions, and supports bulk delete.
- __LV-FR-002-AC2:__ Name must be unique among active leave types ("Already exists") and at most 50 characters.
- __LV-FR-002-AC3:__ A new leave type is immediately available in Add Entitlements, Apply, Assign Leave and report filters.
- __LV-FR-002-AC4:__ Deleting asks for confirmation; deleted types no longer appear for new entitlements or applications, while historical leave remains visible.

### LV-FR-003  Configure work week

__Description__

Admin sets each weekday (Monday to Sunday) to Full Day, Half Day or Non-working Day.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __LV-FR-003-AC1:__ Default is Monday–Friday Full Day, Saturday and Sunday Non-working Day.
- __LV-FR-003-AC2:__ Saving shows "Successfully Saved".
- __LV-FR-003-AC3:__ Non-working days are excluded and Half Days count as 0.5 when calculating the length of a leave request.
- __LV-FR-003-AC4:__ At least one day must remain a working day.

### LV-FR-004  Maintain holidays

__Description__

Admin adds, edits and deletes holidays with Name*, Date*, Full Day/Half Day* and Repeats Annually (Yes/No).

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __LV-FR-004-AC1:__ The Holidays list is filtered by From Date and To Date (defaulting to the current leave period) and shows Name, Date, Full Day/Half Day, Repeats Annually.
- __LV-FR-004-AC2:__ Only one holiday may exist per date ("Already exists").
- __LV-FR-004-AC3:__ A repeating holiday appears in every subsequent year on the same date.
- __LV-FR-004-AC4:__ Full-day holidays are excluded from leave length; half-day holidays count as 0.5 day.

## 4.2 Leave Entitlements

### LV-FR-005  Add entitlement to an individual employee

__Description__

Admin grants days of a leave type to one employee for a leave period.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __LV-FR-005-AC1:__ Form fields: Add to (Individual Employee / Multiple Employees), Employee Name*, Leave Type*, Leave Period* (defaults to current), Entitlement*.
- __LV-FR-005-AC2:__ Entitlement accepts numbers with up to two decimals, greater than 0 and below 10,000.
- __LV-FR-005-AC3:__ If the employee has no entitlement for that type and period, saving shows "Successfully Saved" and opens Employee Entitlements filtered to that employee.
- __LV-FR-005-AC4:__ If an entitlement already exists, a dialog "Updating Entitlement" states the existing value will be updated to existing + new; Confirm adds the days, Cancel aborts.
- __LV-FR-005-AC5:__ Employee Name accepts only employees chosen from the autocomplete; past employees are not offered.

### LV-FR-006  Add entitlement to multiple employees

__Description__

Admin grants the same entitlement to all employees matching Location and/or Sub Unit.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __LV-FR-006-AC1:__ Choosing "Multiple Employees" replaces Employee Name with Location and Sub Unit filters.
- __LV-FR-006-AC2:__ Before saving, a dialog shows the number of matching employees; Confirm applies the entitlement to each.
- __LV-FR-006-AC3:__ Each matching employee's entitlement increases by the given value.

### LV-FR-007  View, edit and delete employee entitlements

__Description__

Employee Entitlements lists entitlements for Employee Name*, Leave Type and Leave Period.

__Priority__

Must

__Roles__

Admin, Supervisor (view)

__Acceptance criteria__

- __LV-FR-007-AC1:__ The table shows Leave Type, Entitlement Type, Valid From, Valid To, Days and a "Total N Day(s)" summary.
- __LV-FR-007-AC2:__ Edit allows changing Entitlement (days); the new value cannot be less than the days already used ("Used amount exceeds the current amount").
- __LV-FR-007-AC3:__ Delete asks for confirmation and removes the entitlement; supports bulk delete.
- __LV-FR-007-AC4:__ "+ Add" opens Add Entitlement pre-filled with the employee.

### LV-FR-008  View my entitlements

__Description__

Every user sees their own entitlements filtered by Leave Type and Leave Period.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __LV-FR-008-AC1:__ The table matches Employee Entitlements but without edit/delete actions.
- __LV-FR-008-AC2:__ The total days shown equal the sum of rows.

## 4.3 Apply Leave

### LV-FR-009  Apply leave for a full-day range

__Description__

An employee requests leave by choosing Leave Type*, From Date*, To Date* and optional Comments.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __LV-FR-009-AC1:__ Leave Type lists only leave types for which the employee has an entitlement in the period.
- __LV-FR-009-AC2:__ After a leave type is selected, Leave Balance is shown in days with a link that opens the balance breakdown (Entitlement, Pending Approval, Scheduled, Taken, Balance).
- __LV-FR-009-AC3:__ To Date defaults to From Date when From Date is chosen.
- __LV-FR-009-AC4:__ On Apply with valid data, "Successfully Saved" appears and the request is listed in My Leave as "Pending Approval (n.00)".
- __LV-FR-009-AC5:__ Leave Balance is reduced by the requested working days immediately.
- __LV-FR-009-AC6:__ If the employee has no entitlements at all, the page shows "No Leave Types with Leave Balance".

### LV-FR-010  Apply partial-day leave

__Description__

Employees request half days or specific hours.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __LV-FR-010-AC1:__ For a single day, Duration offers Full Day, Half Day - Morning, Half Day - Afternoon and Specify Time.
- __LV-FR-010-AC2:__ Specify Time shows From* and To* times and the calculated duration in hours; To must be after From.
- __LV-FR-010-AC3:__ For a multi-day range, Partial Days offers None, All Days, Start Day Only, End Day Only, Start and End Day, each with its own Duration selector.
- __LV-FR-010-AC4:__ Half days count as 0.5 day; specified time counts as hours / 8 by default.

### LV-FR-011  Reject invalid leave applications

__Description__

The system prevents applications that break leave rules.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __LV-FR-011-AC1:__ To Date before From Date shows "To date should be after from date".
- __LV-FR-011-AC2:__ A request whose dates fall only on non-working days or holidays is rejected with "Failed to Submit: No Working Days Selected".
- __LV-FR-011-AC3:__ A request overlapping existing Pending Approval or Scheduled leave is rejected and an "Overlapping Leave Request(s) Found" table lists the conflicting leave.
- __LV-FR-011-AC4:__ A request exceeding the balance is rejected for ESS with "Balance not sufficient".
- __LV-FR-011-AC5:__ A request spanning two leave periods is rejected unless both periods exist.

## 4.4 My Leave

### LV-FR-012  View and filter my leave

__Description__

Employee lists own leave by From Date, To Date, Show Leave with Status and Leave Type.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __LV-FR-012-AC1:__ Default filter is the current leave period with statuses Rejected, Cancelled, Pending Approval, Scheduled and Taken all selected.
- __LV-FR-012-AC2:__ Columns: Date, Employee Name, Leave Type, Leave Balance (Days), Number of Days, Status, Comments, Actions.
- __LV-FR-012-AC3:__ Status shows the status and days, e.g. "Scheduled (2.00)"; multi-status requests show each part.
- __LV-FR-012-AC4:__ Removing all statuses and searching shows "At least one status should be selected".

### LV-FR-013  Cancel my leave

__Description__

Employee cancels own leave that is Pending Approval or Scheduled.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __LV-FR-013-AC1:__ The Cancel button is shown only for Pending Approval or Scheduled leave.
- __LV-FR-013-AC2:__ Cancelling shows "Successfully Updated", sets status to Cancelled and restores the balance.
- __LV-FR-013-AC3:__ Individual days can be cancelled from View Leave Details.

### LV-FR-014  Comment on leave and view details

__Description__

Users add comments to a leave request and view its day-by-day breakdown.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __LV-FR-014-AC1:__ The three-dot menu offers Add Comment and View Leave Details.
- __LV-FR-014-AC2:__ Add Comment opens a dialog listing previous comments with author and date; Save adds the new comment and shows "Successfully Saved".
- __LV-FR-014-AC3:__ View Leave Details lists each day with Date, Leave Type, Duration, Status and Comments and actions per day.

## 4.5 Leave List and Approval

### LV-FR-015  Search leave list

__Description__

Admin and Supervisor search leave by From Date*, To Date*, Show Leave with Status*, Leave Type, Employee Name, Sub Unit and Include Past Employees.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-015-AC1:__ Default status filter is "Pending Approval" for the current leave period.
- __LV-FR-015-AC2:__ Supervisors see only their subordinates' leave; Admin sees all.
- __LV-FR-015-AC3:__ Columns: checkbox, Date, Employee Name, Leave Type, Leave Balance (Days), Number of Days, Status, Comments, Actions.
- __LV-FR-015-AC4:__ Reset restores defaults; no match shows "No Records Found".
- __LV-FR-015-AC5:__ Past employees' leave is shown only when Include Past Employees is on.

### LV-FR-016  Approve leave

__Description__

Approver approves a Pending Approval request.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-016-AC1:__ Approve changes status to Scheduled (or Taken if the date is in the past) and shows "Successfully Updated".
- __LV-FR-016-AC2:__ The employee sees the new status in My Leave.
- __LV-FR-016-AC3:__ The employee's balance is unchanged by approval (pending days become scheduled days).

### LV-FR-017  Reject leave

__Description__

Approver rejects a Pending Approval request.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-017-AC1:__ Reject changes status to Rejected and shows "Successfully Updated".
- __LV-FR-017-AC2:__ The rejected days are returned to the employee's balance.

### LV-FR-018  Bulk approve or reject

__Description__

Approver selects multiple pending requests and acts on them together.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-018-AC1:__ Selecting checkboxes shows "Approve Selected" and "Reject Selected" with the count.
- __LV-FR-018-AC2:__ All selected requests change status and a single success toast appears.

### LV-FR-019  Cancel scheduled leave of others

__Description__

Approver cancels leave that is Scheduled or Pending Approval, as a whole or per day.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-019-AC1:__ Cancel is available for Scheduled leave in the Leave List and per day in View Leave Details.
- __LV-FR-019-AC2:__ Cancelled days return to balance; partially cancelled requests show mixed status, e.g. "Scheduled (1.00), Cancelled (1.00)".

## 4.6 Assign Leave

### LV-FR-020  Assign leave to an employee

__Description__

Admin or Supervisor records leave for an employee with Employee Name*, Leave Type*, From Date*, To Date*, partial-day options and Comments.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-020-AC1:__ Employee Name autocomplete offers all employees (Admin) or subordinates only (Supervisor).
- __LV-FR-020-AC2:__ After selecting employee and leave type, the employee's Leave Balance is displayed.
- __LV-FR-020-AC3:__ Assigned leave is created directly as Scheduled (future) or Taken (past) and "Successfully Saved" appears.
- __LV-FR-020-AC4:__ If the balance is insufficient, a dialog "Insufficient Leave Balance" lists the shortfall; Ok assigns anyway, Cancel aborts.
- __LV-FR-020-AC5:__ Overlap, no-working-days and date-order validations from Apply also apply here.

## 4.7 Leave Reports

### LV-FR-021  Usage report by leave type

__Description__

Generate For "Leave Type" with Leave Type*, Leave Period*, Location, Sub Unit, Job Title and Include Past Employees.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-021-AC1:__ The report lists each employee with Leave Entitlements (Days), Leave Pending Approval (Days), Leave Scheduled (Days), Leave Taken (Days) and Leave Balance (Days).
- __LV-FR-021-AC2:__ Values reconcile with Employee Entitlements and Leave List for the same employee.
- __LV-FR-021-AC3:__ Clicking a value drills down to the underlying entitlement or leave list.

### LV-FR-022  Usage report by employee

__Description__

Generate For "Employee" with Employee Name* and Leave Period*.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __LV-FR-022-AC1:__ The report lists each leave type with the same five measures.
- __LV-FR-022-AC2:__ Balance = Entitlements − Pending Approval − Scheduled − Taken for each row.

### LV-FR-023  My usage report

__Description__

Employee generates own report for a Leave Period*.

__Priority__

Could

__Roles__

All

__Acceptance criteria__

- __LV-FR-023-AC1:__ Shows the same measures per leave type for the logged-in employee only.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

LV-VAL-001

Leave Period

Start Month / Start Date

Yes

Selected from list

"Required"

LV-VAL-002

Leave Types

Name

Yes

Max 50 characters; unique among active types

"Required"; "Should not exceed 50 characters"; "Already exists"

LV-VAL-003

Holidays

Name

Yes

Max 200 characters

"Required"; "Should not exceed 200 characters"

LV-VAL-004

Holidays

Date

Yes

Valid date; unique

"Required"; "Should be a valid date in yyyy-dd-mm format"; "Already exists"

LV-VAL-005

Holidays

Full Day/Half Day

Yes

Selected

"Required"

LV-VAL-006

Holidays list

To Date

Yes

Must be after From Date

"To date should be after from date"

LV-VAL-007

Add Entitlement

Employee Name

Yes

Chosen from autocomplete

"Required"; "Invalid"

LV-VAL-008

Add Entitlement

Leave Type / Leave Period

Yes

Selected

"Required"

LV-VAL-009

Add Entitlement

Entitlement

Yes

Number > 0, max 2 decimals, < 10,000

"Required"; "Should be a valid number (xxx.xx)"; "Should be less than 10000"

LV-VAL-010

Edit Entitlement

Entitlement

Yes

Not less than days already used

"Used amount exceeds the current amount"

LV-VAL-011

Apply / Assign

Leave Type

Yes

Selected

"Required"

LV-VAL-012

Apply / Assign

From Date / To Date

Yes

Valid dates; To ≥ From

"Required"; "Should be a valid date in yyyy-dd-mm format"; "To date should be after from date"

LV-VAL-013

Apply / Assign

Specify Time From / To

Yes (Specify Time)

To after From

"From time should be before to time"

LV-VAL-014

Apply / Assign

Comments

No

Max 250 characters

"Should not exceed 250 characters"

LV-VAL-015

Apply

Balance

-

Requested days ≤ balance (ESS)

"Balance not sufficient" (request blocked)

LV-VAL-016

Assign Leave

Balance

-

Requested days > balance

"Insufficient Leave Balance" confirmation dialog

LV-VAL-017

Apply / Assign

Dates

-

At least one working day in range

"Failed to Submit: No Working Days Selected"

LV-VAL-018

Apply / Assign

Dates

-

No overlap with pending/scheduled/taken leave

"Overlapping Leave Request(s) Found" panel

LV-VAL-019

My Leave / Leave List

Show Leave with Status

Yes

At least one status

"At least one status should be selected"

LV-VAL-020

Add Comment

Comment

Yes

Max 255 characters

"Required"; "Should not exceed 255 characters"

LV-VAL-021

Usage Report

Leave Type / Employee / Leave Period

Yes

Selected

"Required"

# 6. Business Rules

__ID__

__Rule__

LV-BR-01

A leave period must be defined before any other leave function is used.

LV-BR-02

Leave Balance = Entitlement − (Pending Approval + Scheduled + Taken). Rejected and Cancelled leave does not consume balance.

LV-BR-03

Only working days count toward leave length: non-working days per Work Week and full-day holidays are skipped; half working days and half-day holidays count as 0.5.

LV-BR-04

An employee cannot have two non-cancelled, non-rejected leave requests covering the same time.

LV-BR-05

ESS users cannot apply for more than their available balance; Admin and Supervisor may assign beyond balance after confirmation.

LV-BR-06

Applied leave starts as Pending Approval; assigned leave starts as Scheduled (or Taken for past dates).

LV-BR-07

Scheduled leave automatically becomes Taken once its date has passed.

LV-BR-08

Only the employee's supervisor(s) or an Admin can approve or reject; employees cannot approve their own leave.

LV-BR-09

Entitlement additions for an existing type and period are cumulative (added to the existing value).

LV-BR-10

An entitlement cannot be reduced below the days already used.

LV-BR-11

Leave types marked situational are listed separately in Apply and do not require a fixed annual allocation.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Leave applied / assigned / entitlement saved

Success: Successfully Saved

Toast (success)

Approve, reject, cancel

Success: Successfully Updated

Toast (success)

Delete leave type / holiday / entitlement

Success: Successfully Deleted

Toast (success)

No matching leave

Info: No Records Found

Toast (info)

Apply with no entitlements

No Leave Types with Leave Balance

Inline page message

Overlapping request

Overlapping Leave Request(s) Found

Inline table

Assign beyond balance

Insufficient Leave Balance

Modal dialog

Existing entitlement updated

Updating Entitlement - Existing Entitlement value X will be updated to Y

Modal dialog

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

LV-NFR-01

Accuracy

Balance figures shown in Apply, My Entitlements, Leave List and reports are identical for the same employee, type and period.

LV-NFR-02

Auditability

Every status change and comment is stored with the acting user and timestamp and is visible in View Leave Details.

LV-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

LV-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

LV-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

LV-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

LV-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- A leave period, at least two leave types (e.g. CAN - Personal, CAN - Vacation), the default work week and a small holiday set exist in the test environment.
- Test employees and supervisor relations are created through PIM (or its API) before Leave tests run.
- Tests are not run across a leave-period boundary unless the test explicitly targets that case.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: employees, Report-to (approvers), termination status.
- Admin: user accounts and roles; Localization date format; Email Configuration for notifications.
- Dashboard "My Actions" and "Employees on Leave Today" widgets read Leave data.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Choose leave dates relative to "today" and skip weekends and configured holidays, otherwise tests fail on certain days of the week. Prefer dates at least 7 days in the future to avoid Taken status.
- Create entitlements through the API (/web/index.php/api/v2/leave/leave-entitlements) in setup, and cancel or delete created leave in teardown so balances stay predictable.
- Approval tests need two sessions (employee and supervisor/admin); use separate browser contexts rather than logging out and in.
- Date inputs accept typed text; clear the field before typing and verify the format against Admin > Localization.
- Status text includes the day count, e.g. "Pending Approval (1.00)"; assert with "contains" or parse both parts.
- Partial-day duration selects appear dynamically after dates are set; wait for them before selecting.

## 10.2 Test data

__Data item__

__Suggested value / source__

Leave period

Calendar year (Start Month January, Start Date 01)

Leave types

"Auto Annual <ts>" (non-situational), existing "CAN - Personal"

Entitlement

10.00 days of the test type for the test employee

Employees

Employee with ESS login; Supervisor with ESS login assigned as Direct supervisor

Dates

Next Monday + 7 days (single day); Mon–Wed range; a Saturday/Sunday only range for negative test

Holiday

"Auto Holiday <ts>" on a working day in the future, Full Day

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

LV-E2E-01

Apply and approve leave

1. Setup: employee, supervisor, entitlement 10 days

2. Employee applies 2 working days

3. Verify Pending Approval (2.00) and balance 8.00

4. Supervisor approves from Leave List

5. Employee sees Scheduled (2.00)

LV-FR-009, LV-FR-015, LV-FR-016, LV-FR-012

Smoke

LV-E2E-02

Reject leave restores balance

1. Employee applies 1 day

2. Supervisor rejects

3. Verify Rejected status and balance back to 10.00

LV-FR-009, LV-FR-017

Regression

LV-E2E-03

Employee cancels own leave

1. Employee applies leave

2. Cancel from My Leave

3. Verify Cancelled status and restored balance

LV-FR-013, LV-FR-012

Regression

LV-E2E-04

Assign leave beyond balance

1. Admin assigns 12 days against 10-day entitlement

2. Verify Insufficient Leave Balance dialog

3. Confirm and verify Scheduled status

LV-FR-020

Regression

LV-E2E-05

Overlapping and no-working-day validation

1. Apply leave on a date

2. Apply again on same date, verify overlap panel

3. Apply for Saturday–Sunday only, verify no working days error

LV-FR-011

Regression

LV-E2E-06

Half day and specify time

1. Apply single day Half Day - Morning, verify 0.50 days

2. Apply Specify Time 09:00–13:00, verify duration 4.00 hours / 0.50 day

LV-FR-010

Regression

LV-E2E-07

Holiday excluded from leave length

1. Admin adds Full Day holiday on a future Tuesday

2. Employee applies Monday–Wednesday

3. Verify Number of Days = 2.00

LV-FR-004, LV-FR-009

Regression

LV-E2E-08

Entitlement add, accumulate and edit

1. Add 5 days

2. Add 3 more days, confirm Updating Entitlement dialog shows 5 → 8

3. Edit to below used days, verify error

4. Delete entitlement

LV-FR-005, LV-FR-007

Regression

LV-E2E-09

Bulk approve

1. Create 3 pending requests

2. Select all, Approve Selected

3. Verify all Scheduled

LV-FR-018, LV-FR-015

Regression

LV-E2E-10

Leave type lifecycle

1. Add leave type, verify duplicate rejected

2. Verify it appears in Add Entitlement

3. Delete it and verify it is not offered

LV-FR-002

Regression

LV-E2E-11

Usage report reconciles

1. After E2E-01 data, run report by employee

2. Verify Entitlement 10, Scheduled 2, Balance 8

LV-FR-021, LV-FR-022

Regression

LV-E2E-12

Supervisor scope and ESS restrictions

1. Login as supervisor: Leave List shows only subordinates; Assign Leave autocomplete offers only subordinates

2. Login as ESS without subordinates: Leave List and Assign Leave are not in the menu

LV-FR-015, LV-FR-020

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

LV-FR-001

Define leave period

Leave Configuration

Must

5

Functional test

LV-FR-002

Maintain leave types

Leave Configuration

Must

4

LV-E2E-10

LV-FR-003

Configure work week

Leave Configuration

Must

4

Functional test

LV-FR-004

Maintain holidays

Leave Configuration

Must

4

LV-E2E-07

LV-FR-005

Add entitlement to an individual employee

Leave Entitlements

Must

5

LV-E2E-08

LV-FR-006

Add entitlement to multiple employees

Leave Entitlements

Should

3

Functional test

LV-FR-007

View, edit and delete employee entitlements

Leave Entitlements

Must

4

LV-E2E-08

LV-FR-008

View my entitlements

Leave Entitlements

Should

2

Functional test

LV-FR-009

Apply leave for a full-day range

Apply Leave

Must

6

LV-E2E-01, LV-E2E-02, LV-E2E-07

LV-FR-010

Apply partial-day leave

Apply Leave

Should

4

LV-E2E-06

LV-FR-011

Reject invalid leave applications

Apply Leave

Must

5

LV-E2E-05

LV-FR-012

View and filter my leave

My Leave

Must

4

LV-E2E-01, LV-E2E-03

LV-FR-013

Cancel my leave

My Leave

Must

3

LV-E2E-03

LV-FR-014

Comment on leave and view details

My Leave

Should

3

Functional test

LV-FR-015

Search leave list

Leave List and Approval

Must

5

LV-E2E-01, LV-E2E-09, LV-E2E-12

LV-FR-016

Approve leave

Leave List and Approval

Must

3

LV-E2E-01

LV-FR-017

Reject leave

Leave List and Approval

Must

2

LV-E2E-02

LV-FR-018

Bulk approve or reject

Leave List and Approval

Should

2

LV-E2E-09

LV-FR-019

Cancel scheduled leave of others

Leave List and Approval

Should

2

Functional test

LV-FR-020

Assign leave to an employee

Assign Leave

Must

5

LV-E2E-04, LV-E2E-12

LV-FR-021

Usage report by leave type

Leave Reports

Should

3

LV-E2E-11

LV-FR-022

Usage report by employee

Leave Reports

Should

2

LV-E2E-11

LV-FR-023

My usage report

Leave Reports

Could

1

Functional test

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

