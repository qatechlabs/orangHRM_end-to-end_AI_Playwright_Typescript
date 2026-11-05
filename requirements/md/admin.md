<!-- Generated from requirements/brd/OrangeHRM_BRD_Admin.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Admin Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Admin Module

__Document ID__

BRD-ADM-001

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

ADM-FR-nnn

Functional requirement

ADM-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

ADM-VAL-nnn

Field-level validation rule

ADM-BR-nn

Business rule

ADM-NFR-nn

Non-functional requirement

ADM-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Admin module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

The Admin module holds system-wide configuration and the master data that every other module uses: system users, job titles, pay grades, employment statuses, job categories, work shifts, organisation details, locations, the organisation structure, qualifications, nationalities, corporate branding and system configuration (email, localization, languages, modules, social/OAuth/LDAP authentication).

Because other modules read this master data, Admin tests double as prerequisite setup for the rest of the automation suite.

## 1.3 Scope

__In scope__

- User Management: system users.
- Job: Job Titles, Pay Grades, Employment Status, Job Categories, Work Shifts.
- Organization: General Information, Locations, Structure.
- Qualifications: Skills, Education, Licenses, Languages, Memberships.
- Nationalities and Corporate Branding.
- Configuration: Email Configuration, Email Subscriptions, Localization, Language Packages, Modules, Social Media Authentication, Register OAuth Client, LDAP Configuration.

__Out of scope__

- Custom user role definition beyond the default Admin and ESS roles (not available in Open Source UI).
- Use of the master data inside other modules, which is covered by those modules' BRDs.
- Actual delivery of email by the mail server.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__System user__

A login account linked to an employee, with a user role and status

__User role__

Admin (full access) or ESS (self-service); Supervisor rights are derived from Report-to

__Pay Grade__

A named salary band with per-currency minimum and maximum

__Sub Unit__

A node in the organisation structure tree

__Module toggle__

Switch in Configuration > Modules that shows or hides a module for all users

# 2. User Roles and Permissions

The Admin menu is visible only to users with the Admin role.

__Capability__

__Admin__

__Supervisor__

__ESS__

__See Admin menu__

Yes

No

No

__Manage system users__

Yes

No

No

__Manage Job, Organization, Qualifications, Nationalities__

Yes

No

No

__Corporate Branding__

Yes

No

No

__Configuration (email, localization, modules, auth)__

Yes

No

No

__Direct URL to an Admin page__

Allowed

Blocked

Blocked

- Non-admin users opening an Admin URL directly must be denied (redirect or "Credential Required").

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Admin > User Management > Users

System Users

Search and maintain user accounts

Admin > Job > Job Titles

Job Titles

Maintain job titles

Admin > Job > Pay Grades

Pay Grades

Maintain pay grades and currency ranges

Admin > Job > Employment Status

Employment Status

Maintain statuses

Admin > Job > Job Categories

Job Categories

Maintain categories

Admin > Job > Work Shifts

Work Shifts

Maintain shifts and assigned employees

Admin > Organization > General Information

General Information

Company details

Admin > Organization > Locations

Locations

Maintain locations

Admin > Organization > Structure

Organization Structure

Maintain sub unit tree

Admin > Qualifications > Skills / Education / Licenses / Languages / Memberships

Qualification lists

Maintain qualification master data

Admin > Nationalities

Nationalities

Maintain nationalities

Admin > Corporate Branding

Corporate Branding

Theme colours, logos, banners

Admin > Configuration > *

Configuration pages

Email, subscriptions, localization, languages, modules, social/OAuth/LDAP

# 4. Functional Requirements

## 4.1 User Management

### ADM-FR-001  Search system users

__Description__

Admin filters system users by Username, User Role, Employee Name and Status.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-001-AC1:__ The table shows checkbox, Username, User Role, Employee Name, Status, Actions with a "(N) Records Found" count.
- __ADM-FR-001-AC2:__ Username search is exact-match; User Role offers Admin/ESS; Status offers Enabled/Disabled; Employee Name is an autocomplete.
- __ADM-FR-001-AC3:__ Search returns only users matching all criteria; no match shows "No Records Found".
- __ADM-FR-001-AC4:__ Reset clears filters and shows all users.
- __ADM-FR-001-AC5:__ Columns are sortable ascending/descending.

### ADM-FR-002  Add system user

__Description__

Admin creates a user with User Role*, Employee Name*, Status*, Username*, Password* and Confirm Password*.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-002-AC1:__ Employee Name must be chosen from the autocomplete; free text shows "Invalid".
- __ADM-FR-002-AC2:__ Username must be at least 5 characters and unique ("Username already exists").
- __ADM-FR-002-AC3:__ Password must meet the password policy; a strength meter is shown; Confirm Password must match ("Passwords do not match").
- __ADM-FR-002-AC4:__ Saving shows "Successfully Saved" and returns to the user list where the new user appears.
- __ADM-FR-002-AC5:__ The new user can log in when Enabled and receives the selected role's menus; a Disabled user gets "Account disabled".

### ADM-FR-003  Edit system user

__Description__

Admin changes role, employee, status or username, and optionally the password.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-003-AC1:__ The edit form is pre-filled; the password fields are hidden until "Change Password ?" is ticked.
- __ADM-FR-003-AC2:__ Saving shows "Successfully Updated".
- __ADM-FR-003-AC3:__ Changing role from ESS to Admin grants the Admin menu at the user's next login; Admin to ESS removes it.
- __ADM-FR-003-AC4:__ An Admin cannot change their own status to Disabled.

### ADM-FR-004  Delete system user

__Description__

Admin deletes one or more users.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-004-AC1:__ Delete asks for confirmation; "Yes, Delete" shows "Successfully Deleted" and the user can no longer log in.
- __ADM-FR-004-AC2:__ Bulk delete via checkboxes is available.
- __ADM-FR-004-AC3:__ The logged-in user cannot delete their own account (the delete action is disabled or shows "Cannot be deleted").
- __ADM-FR-004-AC4:__ Deleting a user does not delete the linked employee record.

## 4.2 Job

### ADM-FR-005  Maintain job titles

__Description__

Admin adds, edits and deletes job titles with Job Title*, Job Description, Job Specification (file) and Note.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-005-AC1:__ Job Title is mandatory, max 100 characters and unique ("Already exists").
- __ADM-FR-005-AC2:__ Job Description and Note accept up to 400 characters each.
- __ADM-FR-005-AC3:__ Job Specification accepts one file up to 1 MB; on edit it can be kept, replaced or deleted.
- __ADM-FR-005-AC4:__ Saved titles appear in PIM Job, Recruitment vacancies and Leave report filters.
- __ADM-FR-005-AC5:__ Delete asks for confirmation; employees with a deleted title show it as "(Deleted)".

### ADM-FR-006  Maintain pay grades and currencies

__Description__

Admin creates a pay grade with Name*, then adds currencies with Minimum and Maximum Salary.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-006-AC1:__ After saving the name, a Currencies section appears with "+ Add".
- __ADM-FR-006-AC2:__ Currency* is chosen from the ISO currency list; each currency can be added once per pay grade.
- __ADM-FR-006-AC3:__ Maximum Salary must be greater than or equal to Minimum Salary ("Should be higher than Minimum Salary").
- __ADM-FR-006-AC4:__ The list shows Pay Grade and the currencies attached.
- __ADM-FR-006-AC5:__ Ranges are enforced on PIM > Salary for employees on that pay grade.

### ADM-FR-007  Maintain employment statuses

__Description__

Admin adds, edits and deletes employment statuses under Admin > Job > Employment Status.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-007-AC1:__ The list shows the employment statuses with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-007-AC2:__ Name* is mandatory, at most 50 characters and unique ("Already exists").
- __ADM-FR-007-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".
- __ADM-FR-007-AC4:__ New statuses appear in PIM Job and PIM search filter.

### ADM-FR-008  Maintain job categories

__Description__

Admin adds, edits and deletes job categories under Admin > Job > Job Categories.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-008-AC1:__ The list shows the job categories with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-008-AC2:__ Name* is mandatory, at most 50 characters and unique ("Already exists").
- __ADM-FR-008-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".
- __ADM-FR-008-AC4:__ New categories appear in PIM Job.

### ADM-FR-009  Maintain work shifts

__Description__

Admin defines work shifts with Shift Name*, Working Hours From* and To*, and Assigned Employees.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-009-AC1:__ Hours Per Day is calculated automatically from From and To.
- __ADM-FR-009-AC2:__ To must be after From ("To time should be after from time").
- __ADM-FR-009-AC3:__ Default working hours are 09:00 to 17:00 (8.00 hours).
- __ADM-FR-009-AC4:__ Employees are added through an autocomplete and listed as chips; the list shows Name, From, To, Hours Per Day.
- __ADM-FR-009-AC5:__ Shift Name is unique and at most 50 characters.

## 4.3 Organization

### ADM-FR-010  Maintain general information

__Description__

Admin views and edits organisation details.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-010-AC1:__ Fields are read-only until the Edit toggle is on.
- __ADM-FR-010-AC2:__ Fields: Organization Name*, Registration Number, Tax ID, Number of Employees (read-only count), Phone, Fax, Email, Address Street 1/2, City, State/Province, Zip/Postal Code, Country, Notes.
- __ADM-FR-010-AC3:__ Organization Name is mandatory (max 100); Email must be valid; Phone/Fax accept digits and + - / ( ).
- __ADM-FR-010-AC4:__ Number of Employees equals the number of current employees in PIM.
- __ADM-FR-010-AC5:__ Saving shows "Successfully Updated".

### ADM-FR-011  Maintain locations

__Description__

Admin searches, adds, edits and deletes locations.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-011-AC1:__ Search filters by Name, City and Country; table shows Name, City, Country, Phone, Number of Employees.
- __ADM-FR-011-AC2:__ Add requires Name* (max 100, unique) and Country*; City, State/Province, Zip, Phone, Fax, Address, Notes are optional.
- __ADM-FR-011-AC3:__ Saved locations appear in PIM Job and Leave filters.

### ADM-FR-012  Maintain organisation structure

__Description__

Admin builds a tree of sub units under the organisation root.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-012-AC1:__ The tree is read-only until the Edit toggle is on; then "+" (add child), edit and delete icons appear on each node.
- __ADM-FR-012-AC2:__ Add Organization Unit requires Name* (max 100) with optional Unit Id and Description (max 400).
- __ADM-FR-012-AC3:__ Two sub units with the same name under the same parent are not allowed ("Already exists").
- __ADM-FR-012-AC4:__ Deleting a unit asks for confirmation and also deletes its child units.
- __ADM-FR-012-AC5:__ Nodes can be expanded/collapsed; new units appear immediately in PIM Sub Unit drop-downs.

## 4.4 Qualifications and Nationalities

### ADM-FR-013  Maintain skills

__Description__

Admin adds, edits and deletes skills under Admin > Qualifications > Skills.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-013-AC1:__ The list shows the skills with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-013-AC2:__ Name* is mandatory, at most 120 characters and unique ("Already exists").
- __ADM-FR-013-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".
- __ADM-FR-013-AC4:__ Description is optional, max 400 characters.
- __ADM-FR-013-AC5:__ Skills appear in PIM Qualifications and PIM report criteria.

### ADM-FR-014  Maintain education levels

__Description__

Admin adds, edits and deletes education levels under Admin > Qualifications > Education.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-014-AC1:__ The list shows the education levels with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-014-AC2:__ Name* is mandatory, at most 100 characters and unique ("Already exists").
- __ADM-FR-014-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".
- __ADM-FR-014-AC4:__ Levels appear in PIM Qualifications > Education.

### ADM-FR-015  Maintain licenses

__Description__

Admin adds, edits and deletes licenses under Admin > Qualifications > Licenses.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-015-AC1:__ The list shows the licenses with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-015-AC2:__ Name* is mandatory, at most 100 characters and unique ("Already exists").
- __ADM-FR-015-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".

### ADM-FR-016  Maintain languages

__Description__

Admin adds, edits and deletes languages under Admin > Qualifications > Languages.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-016-AC1:__ The list shows the languages with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-016-AC2:__ Name* is mandatory, at most 120 characters and unique ("Already exists").
- __ADM-FR-016-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".

### ADM-FR-017  Maintain memberships

__Description__

Admin adds, edits and deletes memberships under Admin > Qualifications > Memberships.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-017-AC1:__ The list shows the memberships with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-017-AC2:__ Name* is mandatory, at most 100 characters and unique ("Already exists").
- __ADM-FR-017-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".

### ADM-FR-018  Maintain nationalities

__Description__

Admin adds, edits and deletes nationalities under Admin > Nationalities.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-018-AC1:__ The list shows the nationalities with a "(N) Records Found" count, edit and delete actions, and bulk delete via checkboxes.
- __ADM-FR-018-AC2:__ Name* is mandatory, at most 100 characters and unique ("Already exists").
- __ADM-FR-018-AC3:__ Saving a new record shows "Successfully Saved"; editing shows "Successfully Updated"; deleting asks for confirmation and shows "Successfully Deleted".
- __ADM-FR-018-AC4:__ The list is paginated (50 per page) and nationalities appear in PIM Personal Details.

## 4.5 Corporate Branding

### ADM-FR-019  Customise theme and images

__Description__

Admin sets Primary Color, Secondary Color, Primary Font Color, Secondary Font Color, Primary Gradient Color 1 and 2, Client Logo, Client Banner, Login Banner and Social Media Images visibility.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-019-AC1:__ Colours are chosen with a colour picker or hex input; invalid hex values are rejected.
- __ADM-FR-019-AC2:__ Client Logo (recommended 50x50), Client Banner (182x50) and Login Banner (340x65) accept jpg, png, gif and svg up to 1 MB.
- __ADM-FR-019-AC3:__ "Preview" applies changes to the current session only; "Publish" saves for all users and shows "Successfully Updated".
- __ADM-FR-019-AC4:__ "Reset to Default" restores the default OrangeHRM theme after confirmation.
- __ADM-FR-019-AC5:__ Font colour combinations with insufficient contrast show a warning.

## 4.6 Configuration

### ADM-FR-020  Configure email

__Description__

Admin sets Mail Sent As*, Sending Method (SMTP or Sendmail), and for SMTP: Host*, Port*, User Authentication (None/Yes with Username, Password), Secure Connection (None, SSL, TLS).

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-020-AC1:__ SMTP fields appear only when SMTP is selected.
- __ADM-FR-020-AC2:__ Mail Sent As must be a valid email; Port must be numeric.
- __ADM-FR-020-AC3:__ "Send Test Mail" toggle reveals Test Email Address*; saving sends a test email and reports success or failure.
- __ADM-FR-020-AC4:__ Saving shows "Successfully Saved".

### ADM-FR-021  Manage email subscriptions

__Description__

Admin enables notification types (Leave Applications, Leave Assignments, Leave Approvals, Leave Cancellations, Leave Rejections) and adds subscribers.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-021-AC1:__ Each notification type has an on/off toggle and an action to add subscribers.
- __ADM-FR-021-AC2:__ Subscriber requires Name* and Email* (valid, unique within the notification type).
- __ADM-FR-021-AC3:__ Subscribers are listed and can be edited or deleted.

### ADM-FR-022  Configure localization

__Description__

Admin chooses the Language and Date Format used across the application.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-022-AC1:__ Language lists installed language packages; Date Format offers formats such as yyyy-mm-dd, dd-mm-yyyy, mm-dd-yyyy, yyyy-dd-mm and named-month formats.
- __ADM-FR-022-AC2:__ After saving ("Successfully Updated"), all date fields and displayed dates use the new format and the UI uses the selected language.

### ADM-FR-023  Manage language packages

__Description__

Admin adds language packages, translates strings and imports/exports XLIFF.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-023-AC1:__ Add Language Package lets Admin pick a language; it is added to the list.
- __ADM-FR-023-AC2:__ Translate shows source and target strings with a filter for untranslated text; saved translations are used in the UI.
- __ADM-FR-023-AC3:__ Export downloads an XLIFF file; Import accepts an XLIFF file up to 1 MB.

### ADM-FR-024  Enable or disable modules

__Description__

Admin toggles Leave, Time, Recruitment, Performance, Maintenance, Mobile, Directory, Claim and Buzz; Admin and PIM are always on.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-024-AC1:__ Admin and PIM toggles are disabled (cannot be turned off).
- __ADM-FR-024-AC2:__ Turning a module off and saving removes it from the side menu for all users and blocks its URLs.
- __ADM-FR-024-AC3:__ Turning it back on restores the menu and data.
- __ADM-FR-024-AC4:__ Saving shows "Successfully Saved".

### ADM-FR-025  Configure social media authentication

__Description__

Admin adds OpenID providers with Name*, Provider URL*, Client ID* and Client Secret*.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-025-AC1:__ Each saved provider appears as a sign-in button on the login page when Social Media Images is enabled.
- __ADM-FR-025-AC2:__ Provider URL must be a valid URL.
- __ADM-FR-025-AC3:__ Providers can be edited or deleted.

### ADM-FR-026  Register OAuth clients

__Description__

Admin registers API clients with Name*, Redirect URI* and Enable Client.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-026-AC1:__ Saved clients are listed with Name, Redirect URI and Status, and the generated Client Id is shown.
- __ADM-FR-026-AC2:__ Disabled clients cannot obtain tokens.

### ADM-FR-027  Configure LDAP

__Description__

Admin configures LDAP server, bind settings, user lookup and data mapping, and tests the connection.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __ADM-FR-027-AC1:__ Enable toggle reveals Host*, Port*, Encryption, LDAP Implementation, Bind Anonymously, Distinguished Name, Password, Base Distinguished Name*, Search Scope, User Name Attribute*, data mapping (First Name, Last Name, etc.) and Sync Interval.
- __ADM-FR-027-AC2:__ "Test Connection" reports success or the specific failure.
- __ADM-FR-027-AC3:__ Saving shows "Successfully Saved".

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

ADM-VAL-001

Add/Edit User

User Role / Status

Yes

Selected

"Required"

ADM-VAL-002

Add/Edit User

Employee Name

Yes

Selected from autocomplete

"Required"; "Invalid"

ADM-VAL-003

Add/Edit User

Username

Yes

Min 5, max 40; unique

"Should be at least 5 characters"; "Should not exceed 40 characters"; "Username already exists"

ADM-VAL-004

Add/Edit User

Password

Yes (add / change)

Min 7, max 64; at least 1 number and 1 lower-case letter (default policy)

"Should have at least 7 characters"; "Your password must contain minimum 1 number"; "Your password must contain minimum 1 lower-case letter"

ADM-VAL-005

Add/Edit User

Confirm Password

Yes (add / change)

Equals Password

"Passwords do not match"

ADM-VAL-006

Job Titles

Job Title

Yes

Max 100; unique

"Required"; "Should not exceed 100 characters"; "Already exists"

ADM-VAL-007

Job Titles

Job Description / Note

No

Max 400

"Should not exceed 400 characters"

ADM-VAL-008

Job Titles

Job Specification

No

Max 1 MB

"Attachment Size Exceeded"

ADM-VAL-009

Pay Grades

Name

Yes

Max 50; unique

"Required"; "Already exists"

ADM-VAL-010

Pay Grades > Currency

Currency

Yes

Not already on this pay grade

"Required"

ADM-VAL-011

Pay Grades > Currency

Minimum / Maximum Salary

No

Numeric; Max ≥ Min; max 1,000,000,000

"Should be a number"; "Should be higher than Minimum Salary"

ADM-VAL-012

Employment Status / Job Categories

Name

Yes

Max 50; unique

"Required"; "Should not exceed 50 characters"; "Already exists"

ADM-VAL-013

Work Shifts

Shift Name

Yes

Max 50; unique

"Required"; "Already exists"

ADM-VAL-014

Work Shifts

From / To

Yes

To after From

"To time should be after from time"

ADM-VAL-015

General Information

Organization Name

Yes

Max 100

"Required"

ADM-VAL-016

General Information

Email

No

Valid email

"Expected format: admin@example.com"

ADM-VAL-017

General Information / Locations

Phone / Fax

No

Digits and + - / ( ) only; max 30

"Allows numbers and only + - / ( )"

ADM-VAL-018

Locations

Name

Yes

Max 100; unique

"Required"; "Already exists"

ADM-VAL-019

Locations

Country

Yes

Selected

"Required"

ADM-VAL-020

Structure

Name

Yes

Max 100; unique under same parent

"Required"; "Already exists"

ADM-VAL-021

Structure

Description

No

Max 400

"Should not exceed 400 characters"

ADM-VAL-022

Skills / Languages

Name

Yes

Max 120; unique

"Required"; "Already exists"

ADM-VAL-023

Education / Licenses / Memberships / Nationalities

Name

Yes

Max 100; unique

"Required"; "Already exists"

ADM-VAL-024

Corporate Branding

Images

No

jpg, png, gif, svg; max 1 MB

"File type not allowed"; "Attachment Size Exceeded"

ADM-VAL-025

Corporate Branding

Colours

Yes

Valid hex colour

"Invalid color code"

ADM-VAL-026

Email Configuration

Mail Sent As / Test Email

Yes

Valid email

"Required"; "Expected format: admin@example.com"

ADM-VAL-027

Email Configuration

SMTP Port

Yes (SMTP)

Numeric

"Should be a number"

ADM-VAL-028

Email Subscriptions

Name / Email

Yes

Valid email; unique per notification

"Required"; "Already exists"

ADM-VAL-029

Social Media Auth

Provider URL

Yes

Valid URL

"Invalid URL"

# 6. Business Rules

__ID__

__Rule__

ADM-BR-01

Only users with the Admin role can access the Admin module.

ADM-BR-02

Every system user must be linked to exactly one existing employee.

ADM-BR-03

Usernames are unique across all users.

ADM-BR-04

A user cannot delete or disable their own account.

ADM-BR-05

Master data names are unique within their list (case-insensitive).

ADM-BR-06

Deleting master data in use does not delete employees; the reference is cleared or shown as "(Deleted)".

ADM-BR-07

Pay grade salary ranges constrain PIM salary amounts for that pay grade and currency.

ADM-BR-08

The Admin and PIM modules cannot be disabled.

ADM-BR-09

Disabling a module hides its menu and blocks its pages for every user, including Admin.

ADM-BR-10

Localization date format applies to all date input and display system-wide.

ADM-BR-11

Branding changes are visible to all users only after Publish.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Record created

Success: Successfully Saved

Toast (success)

Record updated

Success: Successfully Updated

Toast (success)

Record deleted

Success: Successfully Deleted

Toast (success)

Search without results

Info: No Records Found

Toast (info)

Delete clicked

Are you Sure? ... Yes, Delete / No, Cancel

Modal dialog

Disabled user logs in

Account disabled

Login page alert

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

ADM-NFR-01

Security

Passwords are never displayed in clear text and are stored hashed.

ADM-NFR-02

Consistency

Master data changes are reflected in dependent drop-downs without re-login.

ADM-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

ADM-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

ADM-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

ADM-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

ADM-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- Tests run with the default Admin account and do not modify or delete it.
- Global settings (Localization, Modules, Branding, Email) are restored to defaults after each test that changes them, because they affect every other test.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: employees are needed to create users and assign work shifts.
- All other modules consume Admin master data and module toggles.

## 9.3 Constraints

- Tests that change global configuration must run serially, not in parallel with other suites.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Use unique names with a timestamp suffix for every master-data record and delete them in teardown.
- Admin master-data CRUD pages share one layout (list + "+ Add" + Name form); build one reusable page object parameterised by URL and field set.
- The organisation structure tree renders nodes dynamically; locate nodes by their text and expand parents before asserting.
- Run Localization, Modules and Branding tests in an isolated serial project, and always reset in an after-hook even when the test fails.
- Prefer the REST API (/web/index.php/api/v2/admin/...) to create prerequisites quickly.

## 10.2 Test data

__Data item__

__Suggested value / source__

Admin account

Admin / admin123 (demo) or dedicated admin

Employee for user

Employee created via PIM API per test

Username

"auto.user<ts>" (≥ 5 chars), plus "abcd" for negative

Password

"Test@1234"; negatives "abc12" (short), "abcdefg" (no number)

Master data names

"Auto <Entity> <ts>"; 101-char string for boundary

Pay grade

USD Min 1000, Max 5000; negative Max 500

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

ADM-E2E-01

Create ESS user and log in

1. Create employee

2. Admin > Users > Add ESS user, Enabled

3. Search user by username

4. Log in as new user, verify Admin menu absent

ADM-FR-002, ADM-FR-001

Smoke

ADM-E2E-02

Disable and re-enable user

1. Set user Disabled

2. Login attempt shows "Account disabled"

3. Enable user, login succeeds

ADM-FR-003

Regression

ADM-E2E-03

Promote ESS to Admin

1. Change role to Admin

2. Log in as user, verify Admin menu visible

ADM-FR-003

Regression

ADM-E2E-04

User validations and self-protection

1. Duplicate username, short username, password mismatch

2. Verify own account cannot be deleted

ADM-FR-002, ADM-FR-004

Regression

ADM-E2E-05

Job title used in PIM

1. Add job title with spec file

2. Assign it to employee in PIM Job

3. Delete job title, verify employee shows "(Deleted)" or blank

ADM-FR-005

Regression

ADM-E2E-06

Pay grade constrains salary

1. Create pay grade with USD 1000–5000

2. Max < Min rejected

3. In PIM Salary, amount 6000 rejected

ADM-FR-006

Regression

ADM-E2E-07

Organisation structure CRUD

1. Add parent and child unit

2. Duplicate name under same parent rejected

3. Verify unit in PIM Sub Unit filter

4. Delete parent removes child

ADM-FR-012

Regression

ADM-E2E-08

Master data CRUD (data-driven)

1. For each list: add, duplicate check, edit, search in list, delete

ADM-FR-007, ADM-FR-008, ADM-FR-013, ADM-FR-014, ADM-FR-015, ADM-FR-016, ADM-FR-017, ADM-FR-018

Regression

ADM-E2E-09

Location and work shift

1. Add location with mandatory fields

2. Add shift 09:00–17:00 and assign employee

3. Verify Hours Per Day 8.00

ADM-FR-011, ADM-FR-009

Regression

ADM-E2E-10

Disable a module

1. Turn off Buzz, verify menu removed

2. Turn on Buzz, verify restored

3. Verify Admin/PIM toggles disabled

ADM-FR-024

Regression

ADM-E2E-11

Change date format

1. Set dd-mm-yyyy

2. Verify date placeholder in Leave Apply

3. Restore default

ADM-FR-022

Regression

ADM-E2E-12

Branding preview, publish and reset

1. Change primary colour, Preview

2. Publish and verify header colour

3. Reset to Default

ADM-FR-019

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

ADM-FR-001

Search system users

User Management

Must

5

ADM-E2E-01

ADM-FR-002

Add system user

User Management

Must

5

ADM-E2E-01, ADM-E2E-04

ADM-FR-003

Edit system user

User Management

Must

4

ADM-E2E-02, ADM-E2E-03

ADM-FR-004

Delete system user

User Management

Must

4

ADM-E2E-04

ADM-FR-005

Maintain job titles

Job

Must

5

ADM-E2E-05

ADM-FR-006

Maintain pay grades and currencies

Job

Must

5

ADM-E2E-06

ADM-FR-007

Maintain employment statuses

Job

Must

4

ADM-E2E-08

ADM-FR-008

Maintain job categories

Job

Should

4

ADM-E2E-08

ADM-FR-009

Maintain work shifts

Job

Should

5

ADM-E2E-09

ADM-FR-010

Maintain general information

Organization

Should

5

Functional test

ADM-FR-011

Maintain locations

Organization

Should

3

ADM-E2E-09

ADM-FR-012

Maintain organisation structure

Organization

Must

5

ADM-E2E-07

ADM-FR-013

Maintain skills

Qualifications and Nationalities

Should

5

ADM-E2E-08

ADM-FR-014

Maintain education levels

Qualifications and Nationalities

Should

4

ADM-E2E-08

ADM-FR-015

Maintain licenses

Qualifications and Nationalities

Should

3

ADM-E2E-08

ADM-FR-016

Maintain languages

Qualifications and Nationalities

Should

3

ADM-E2E-08

ADM-FR-017

Maintain memberships

Qualifications and Nationalities

Should

3

ADM-E2E-08

ADM-FR-018

Maintain nationalities

Qualifications and Nationalities

Should

4

ADM-E2E-08

ADM-FR-019

Customise theme and images

Corporate Branding

Could

5

ADM-E2E-12

ADM-FR-020

Configure email

Configuration

Should

4

Functional test

ADM-FR-021

Manage email subscriptions

Configuration

Could

3

Functional test

ADM-FR-022

Configure localization

Configuration

Should

2

ADM-E2E-11

ADM-FR-023

Manage language packages

Configuration

Could

3

Functional test

ADM-FR-024

Enable or disable modules

Configuration

Must

4

ADM-E2E-10

ADM-FR-025

Configure social media authentication

Configuration

Could

3

Functional test

ADM-FR-026

Register OAuth clients

Configuration

Could

2

Functional test

ADM-FR-027

Configure LDAP

Configuration

Could

3

Functional test

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

