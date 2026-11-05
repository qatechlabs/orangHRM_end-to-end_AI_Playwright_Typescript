<!-- Generated from requirements/brd/OrangeHRM_BRD_Directory.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Directory Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Directory Module

__Document ID__

BRD-DIR-001

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

DIR-FR-nnn

Functional requirement

DIR-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

DIR-VAL-nnn

Field-level validation rule

DIR-BR-nn

Business rule

DIR-NFR-nn

Non-functional requirement

DIR-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Directory module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Directory is a company phone book available to every user. It shows current employees as cards with photo, name, job title and sub unit, supports filtering by name, job title and location, and shows contact details (work phone, mobile, work email) when a card is selected. Data comes from PIM and is read-only here.

## 1.3 Scope

__In scope__

- Directory search and filters.
- Employee cards and detail panel.
- Lazy loading of results.
- Role access to the Directory.

__Out of scope__

- Editing employee data (PIM / My Info).
- Organisation chart view (not available in Open Source).

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Card__

Tile representing one employee in the Directory

__Detail panel__

Panel shown when a card is clicked, with contact details

# 2. User Roles and Permissions

__Capability__

__Admin__

__Supervisor__

__ESS__

__See Directory menu__

Yes

Yes

Yes

__Search and view all current employees__

Yes

Yes

Yes

__View contact details__

Yes

Yes

Yes

__Edit data from Directory__

No

No

No

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Directory

Directory

Search and browse employees

# 4. Functional Requirements

## 4.1 Directory Search and Display

### DIR-FR-001  Display employee cards

__Description__

Opening Directory shows a card for each current employee.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DIR-FR-001-AC1:__ Each card shows the profile photo (or default avatar), full name, job title and sub unit.
- __DIR-FR-001-AC2:__ A "(N) Records Found" count is displayed.
- __DIR-FR-001-AC3:__ Past (terminated) employees are not shown.
- __DIR-FR-001-AC4:__ Cards load in batches as the user scrolls down (lazy loading) until all records are shown.

### DIR-FR-002  Filter the directory

__Description__

User filters by Employee Name (autocomplete), Job Title and Location.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DIR-FR-002-AC1:__ Employee Name suggests matching current employees after typing; a selection is required for name filtering.
- __DIR-FR-002-AC2:__ Job Title and Location are drop-downs from Admin master data.
- __DIR-FR-002-AC3:__ Search shows only employees matching all selected criteria and updates the count.
- __DIR-FR-002-AC4:__ No match shows "No Records Found".
- __DIR-FR-002-AC5:__ Reset clears all filters and shows all cards.

### DIR-FR-003  Show employee contact details

__Description__

Clicking a card opens a detail panel.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DIR-FR-003-AC1:__ The panel shows larger photo, name, job title, sub unit, location, and contact items for Work Telephone, Mobile and Work Email when present in PIM.
- __DIR-FR-003-AC2:__ Contact items can be copied with a single click (copy icon), and a confirmation is shown.
- __DIR-FR-003-AC3:__ Clicking another card replaces the panel; clicking the close/same card hides it.

### DIR-FR-004  Reflect PIM changes

__Description__

Directory data is always consistent with PIM.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __DIR-FR-004-AC1:__ A new employee appears in the Directory immediately after being added in PIM.
- __DIR-FR-004-AC2:__ Changes to name, photo, job title, sub unit, location, phone or work email in PIM/My Info appear on next load.
- __DIR-FR-004-AC3:__ Terminating an employee removes their card; re-activating restores it.
- __DIR-FR-004-AC4:__ Deleting an employee removes their card.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

DIR-VAL-001

Directory search

Employee Name

No

Must be selected from autocomplete to filter

"Invalid" when typed text is not selected

DIR-VAL-002

Directory search

Job Title / Location

No

Selected from list

-

# 6. Business Rules

__ID__

__Rule__

DIR-BR-01

The Directory shows only current employees.

DIR-BR-02

Directory is read-only.

DIR-BR-03

All authenticated users can view all current employees and their work contact details.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

No match

Info: No Records Found

Toast (info)

Contact copied

Copied!

Tooltip

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

DIR-NFR-01

Performance

First batch of cards renders within 3 seconds; subsequent batches load on scroll within 2 seconds.

DIR-NFR-02

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

DIR-NFR-03

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

DIR-NFR-04

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

DIR-NFR-05

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

DIR-NFR-06

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- Employees with photos, job titles, locations and contact details exist (or are created by the test).
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM and My Info: source of all data.
- Admin: Job Titles, Locations; module toggle for Directory.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Cards are lazy-loaded; scroll the results container until the target card exists, or filter by name first.
- Create a uniquely named employee per test so the autocomplete returns exactly one match.
- Assert the detail panel by text values rather than by layout.

## 10.2 Test data

__Data item__

__Suggested value / source__

Employee

"Dir<ts> Auto" with Job Title, Location, Work Email dir<ts>@example.com, Mobile 9876543210

Past employee

Employee terminated in setup

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

DIR-E2E-01

Find employee and view contacts

1. Create employee with contact details in PIM

2. ESS opens Directory, searches by name

3. One card found; open detail panel

4. Verify job title, email and mobile

DIR-FR-001, DIR-FR-002, DIR-FR-003

Smoke

DIR-E2E-02

Filter by job title and location

1. Filter by Job Title then Location

2. All cards match

3. Reset shows all

DIR-FR-002

Regression

DIR-E2E-03

Terminated employee hidden

1. Terminate employee in PIM

2. Directory search returns No Records Found

3. Activate again, card returns

DIR-FR-004, DIR-FR-001

Regression

DIR-E2E-04

PIM change reflected

1. Change job title and photo in PIM

2. Directory card shows new values

DIR-FR-004

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

DIR-FR-001

Display employee cards

Directory Search and Display

Must

4

DIR-E2E-01, DIR-E2E-03

DIR-FR-002

Filter the directory

Directory Search and Display

Must

5

DIR-E2E-01, DIR-E2E-02

DIR-FR-003

Show employee contact details

Directory Search and Display

Must

3

DIR-E2E-01

DIR-FR-004

Reflect PIM changes

Directory Search and Display

Should

4

DIR-E2E-03, DIR-E2E-04

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

