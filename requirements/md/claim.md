<!-- Generated from requirements/brd/OrangeHRM_BRD_Claim.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Claim Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Claim Module

__Document ID__

BRD-CLM-001

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

CLM-FR-nnn

Functional requirement

CLM-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

CLM-VAL-nnn

Field-level validation rule

CLM-BR-nn

Business rule

CLM-NFR-nn

Non-functional requirement

CLM-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Claim module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Claim module handles employee expense reimbursement. Admins configure claim Events (e.g. Travel, Medical) and Expense Types. Employees create a claim request for an event, add expense lines and attachments, and submit it. Supervisors or Admins approve or reject submitted claims, and approved claims are marked as Paid. Admins and supervisors can also assign a claim on behalf of an employee.

## 1.3 Scope

__In scope__

- Configuration: Events and Expense Types.
- Submit Claim, My Claims, Employee Claims, Assign Claim.
- Expenses and attachments on a claim.
- Claim status lifecycle: Initiated, Submitted, Approved, Rejected, Cancelled, Paid.

__Out of scope__

- Actual payment processing and accounting integration.
- Currency conversion.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Claim request__

A request for reimbursement for one event and one currency, with a Reference Id

__Event__

The business reason for the claim (e.g. Travel Allowance)

__Expense__

One line item in a claim: type, date, amount, note

__Reference Id__

System-generated unique id of a claim request

# 2. User Roles and Permissions

__Capability__

__Admin__

__Supervisor__

__ESS__

__Submit Claim / My Claims__

Yes

Yes

Yes

__Employee Claims (view others)__

All

Subordinates

No

__Approve / reject__

All

Subordinates

No

__Mark as Paid__

Yes

No

No

__Assign Claim__

All

Subordinates

No

__Configuration (Events, Expense Types)__

Yes

No

No

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Claim > Configuration > Events

Events

Maintain claim events

Claim > Configuration > Expense Types

Expense Types

Maintain expense types

Claim > Submit Claim

Create Claim Request

Employee creates a claim

Claim > My Claims

My Claims

Employee's own claims

Claim > Employee Claims

Employee Claims

Review others' claims

Claim > Assign Claim

Create Claim Request (assign)

Create a claim on behalf of an employee

# 4. Functional Requirements

## 4.1 Configuration

### CLM-FR-001  Maintain claim events

__Description__

Admin adds, edits and deletes events with Event Name*, Description and Active.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __CLM-FR-001-AC1:__ Event Name is unique ("Already exists") and at most 100 characters; Description at most 1000.
- __CLM-FR-001-AC2:__ Active defaults to on; inactive events are not offered in Submit/Assign Claim.
- __CLM-FR-001-AC3:__ The list shows Event Name, Status (Active/Inactive) and actions, searchable by Event Name and Status.
- __CLM-FR-001-AC4:__ Saving shows "Successfully Saved"; delete asks for confirmation.

### CLM-FR-002  Maintain expense types

__Description__

Admin adds, edits and deletes expense types with Name*, Description and Active.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __CLM-FR-002-AC1:__ Name is unique and at most 100 characters; Description at most 1000.
- __CLM-FR-002-AC2:__ Inactive types are not offered when adding expenses.
- __CLM-FR-002-AC3:__ The list is searchable by Name and Status.

## 4.2 Submitting Claims

### CLM-FR-003  Create claim request

__Description__

Employee selects Event*, Currency* and optional Remarks and clicks Create.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __CLM-FR-003-AC1:__ Event lists active events; Currency lists ISO currencies.
- __CLM-FR-003-AC2:__ Create shows "Successfully Saved" and opens the claim with a Reference Id, Status "Initiated" and the employee's name.
- __CLM-FR-003-AC3:__ Event and Currency are read-only after creation.

### CLM-FR-004  Add expenses to a claim

__Description__

Employee adds expense lines with Expense Type*, Date*, Amount* and Note.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __CLM-FR-004-AC1:__ Expense Type lists active expense types.
- __CLM-FR-004-AC2:__ Amount accepts positive numbers with up to two decimals.
- __CLM-FR-004-AC3:__ Each expense appears in the Expenses table with Expense Type, Date, Note, Amount and actions; edit and delete are available while the claim is Initiated.
- __CLM-FR-004-AC4:__ The Total Amount equals the sum of expense amounts and updates after each change.

### CLM-FR-005  Attach supporting documents

__Description__

Employee attaches receipts to the claim.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __CLM-FR-005-AC1:__ Attachments accept files up to 1 MB with an optional comment.
- __CLM-FR-005-AC2:__ Attachments list File Name, Description, Size, Type, Date Added, Added By with download and delete.

### CLM-FR-006  Submit or cancel claim

__Description__

Employee submits the claim for approval or cancels it.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __CLM-FR-006-AC1:__ Submit changes status to "Submitted" and shows "Successfully Submitted"; expenses can no longer be edited.
- __CLM-FR-006-AC2:__ Cancel changes status to "Cancelled" and no further actions are available.
- __CLM-FR-006-AC3:__ A claim cannot be submitted without at least one expense (or the system warns).

### CLM-FR-007  View my claims

__Description__

Employee lists own claims filtered by Reference Id, Event Name, Status, From Date and To Date.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __CLM-FR-007-AC1:__ Columns: Reference Id, Event Name, Description, Currency, Submitted Date, Status, Amount, Actions (View Details).
- __CLM-FR-007-AC2:__ View Details opens the claim with its expenses, attachments and status-specific buttons.
- __CLM-FR-007-AC3:__ No match shows "No Records Found".

## 4.3 Processing Claims

### CLM-FR-008  Search employee claims

__Description__

Approver lists claims filtered by Employee Name, Reference Id, Event Name, Status, Include (current/past), From Date and To Date.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __CLM-FR-008-AC1:__ Columns: Reference Id, Employee Name, Event Name, Description, Currency, Submitted Date, Status, Amount, Actions.
- __CLM-FR-008-AC2:__ Supervisors see only subordinates' claims.
- __CLM-FR-008-AC3:__ Initiated (not submitted) claims of others are not shown to approvers.

### CLM-FR-009  Approve or reject claim

__Description__

Approver opens a submitted claim and approves or rejects it.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __CLM-FR-009-AC1:__ Approve and Reject buttons are shown only for Submitted claims.
- __CLM-FR-009-AC2:__ Approve sets status "Approved"; Reject sets status "Rejected"; each shows a success toast.
- __CLM-FR-009-AC3:__ The employee sees the new status in My Claims.
- __CLM-FR-009-AC4:__ An approver cannot approve their own claim.

### CLM-FR-010  Mark claim as paid

__Description__

Admin marks an approved claim as paid.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __CLM-FR-010-AC1:__ A Pay button is shown only for Approved claims.
- __CLM-FR-010-AC2:__ Pay sets status "Paid", which is final.

### CLM-FR-011  Assign claim on behalf of an employee

__Description__

Approver creates a claim for an employee with Employee Name*, Event*, Currency* and Remarks.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __CLM-FR-011-AC1:__ Employee Name offers all employees (Admin) or subordinates (Supervisor).
- __CLM-FR-011-AC2:__ After Create, the approver adds expenses and attachments, then Submits.
- __CLM-FR-011-AC3:__ The claim appears in the employee's My Claims with the correct status.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

CLM-VAL-001

Events

Event Name

Yes

Max 100; unique

"Required"; "Should not exceed 100 characters"; "Already exists"

CLM-VAL-002

Events / Expense Types

Description

No

Max 1000

"Should not exceed 1000 characters"

CLM-VAL-003

Expense Types

Name

Yes

Max 100; unique

"Required"; "Already exists"

CLM-VAL-004

Create Claim

Event / Currency

Yes

Selected

"Required"

CLM-VAL-005

Create Claim

Remarks

No

Max 1000

"Should not exceed 1000 characters"

CLM-VAL-006

Assign Claim

Employee Name

Yes

Selected from autocomplete

"Required"; "Invalid"

CLM-VAL-007

Add Expense

Expense Type

Yes

Selected

"Required"

CLM-VAL-008

Add Expense

Date

Yes

Valid date

"Required"; "Should be a valid date in yyyy-dd-mm format"

CLM-VAL-009

Add Expense

Amount

Yes

Positive number, max 2 decimals, max 10 digits

"Required"; "Should be a number"; "Should be a valid number (xxx.xx)"

CLM-VAL-010

Add Expense

Note

No

Max 1000

"Should not exceed 1000 characters"

CLM-VAL-011

Attachments

File

Yes

Max 1 MB

"Attachment Size Exceeded"

CLM-VAL-012

My/Employee Claims

To Date

No

After From Date

"To date should be after from date"

# 6. Business Rules

__ID__

__Rule__

CLM-BR-01

Claim status flow: Initiated → Submitted → Approved → Paid; Submitted → Rejected; Initiated → Cancelled.

CLM-BR-02

Expenses and attachments can be changed only while a claim is Initiated.

CLM-BR-03

Rejected, Cancelled and Paid are final statuses.

CLM-BR-04

A claim has exactly one event and one currency.

CLM-BR-05

Only supervisors of the employee and Admins can approve or reject; only Admin can mark Paid.

CLM-BR-06

Inactive events and expense types cannot be used on new claims but remain on existing ones.

CLM-BR-07

Total Amount always equals the sum of expense amounts.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Claim created / expense added

Success: Successfully Saved

Toast (success)

Claim submitted

Success: Successfully Submitted

Toast (success)

Approve / reject / pay / cancel

Success: Successfully Updated

Toast (success)

Delete

Success: Successfully Deleted

Toast (success)

No results

Info: No Records Found

Toast (info)

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

CLM-NFR-01

Accuracy

Amounts are stored and displayed with two decimals without rounding errors.

CLM-NFR-02

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

CLM-NFR-03

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

CLM-NFR-04

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

CLM-NFR-05

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

CLM-NFR-06

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- At least one active event and expense type exist; test employee has a supervisor with login.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: employees and Report-to.
- Admin: module toggle for Claim.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Capture the generated Reference Id after Create and use it to locate the claim in lists.
- Use separate browser contexts for employee and approver.
- Create events/expense types via API in setup and deactivate or delete them in teardown.

## 10.2 Test data

__Data item__

__Suggested value / source__

Event

"Auto Travel <ts>" (active)

Expense types

"Auto Taxi <ts>", "Auto Hotel <ts>"

Expenses

Taxi 25.50 + Hotel 120.00 = 145.50 USD

Negative amounts

-5, 12.345, "abc"

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

CLM-E2E-01

Submit, approve and pay a claim

1. Employee creates claim, adds two expenses, verifies total 145.50

2. Submits

3. Supervisor approves

4. Admin pays

5. Employee sees Paid

CLM-FR-003, CLM-FR-004, CLM-FR-006, CLM-FR-008, CLM-FR-009, CLM-FR-010

Smoke

CLM-E2E-02

Reject claim

1. Submitted claim rejected by supervisor

2. Employee sees Rejected, no actions

CLM-FR-009, CLM-FR-007

Regression

CLM-E2E-03

Cancel initiated claim

1. Create claim and cancel

2. Status Cancelled

CLM-FR-006

Regression

CLM-E2E-04

Expense validations and attachments

1. Invalid amounts rejected

2. Attach receipt, oversized file rejected

CLM-FR-004, CLM-FR-005

Regression

CLM-E2E-05

Assign claim

1. Admin assigns claim to employee, adds expense, submits

2. Employee sees it in My Claims

CLM-FR-011

Regression

CLM-E2E-06

Inactive event not offered

1. Create event, deactivate

2. Not listed in Submit Claim

CLM-FR-001, CLM-FR-002

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

CLM-FR-001

Maintain claim events

Configuration

Must

4

CLM-E2E-06

CLM-FR-002

Maintain expense types

Configuration

Must

3

CLM-E2E-06

CLM-FR-003

Create claim request

Submitting Claims

Must

3

CLM-E2E-01

CLM-FR-004

Add expenses to a claim

Submitting Claims

Must

4

CLM-E2E-01, CLM-E2E-04

CLM-FR-005

Attach supporting documents

Submitting Claims

Should

2

CLM-E2E-04

CLM-FR-006

Submit or cancel claim

Submitting Claims

Must

3

CLM-E2E-01, CLM-E2E-03

CLM-FR-007

View my claims

Submitting Claims

Must

3

CLM-E2E-02

CLM-FR-008

Search employee claims

Processing Claims

Must

3

CLM-E2E-01

CLM-FR-009

Approve or reject claim

Processing Claims

Must

4

CLM-E2E-01, CLM-E2E-02

CLM-FR-010

Mark claim as paid

Processing Claims

Should

2

CLM-E2E-01

CLM-FR-011

Assign claim on behalf of an employee

Processing Claims

Should

3

CLM-E2E-05

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

