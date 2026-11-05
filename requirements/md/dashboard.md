<!-- Generated from requirements/brd/OrangeHRM_BRD_Dashboard.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Dashboard Module (incl. Login and Application Shell)

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Dashboard Module (incl. Login and Application Shell)

__Document ID__

BRD-DSH-001

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

DSH-FR-nnn

Functional requirement

DSH-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

DSH-VAL-nnn

Field-level validation rule

DSH-BR-nn

Business rule

DSH-NFR-nn

Non-functional requirement

DSH-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Dashboard of OrangeHRM 5.x, together with login, logout, password reset and the common application shell (side menu, header, user menu) that every test passes through. It is the baseline for manual test design and for the end-to-end automation suite.

## 1.2 Module overview

The Dashboard is the landing page after login. It shows widgets that summarise information from other modules: Time at Work, My Actions, Quick Launch, Buzz Latest Posts, Employees on Leave Today, Employee Distribution by Sub Unit and Employee Distribution by Location. Widgets and their content depend on the user's role and on which modules are enabled.

Because login and the application shell are used by every test, their requirements are included here.

## 1.3 Scope

__In scope__

- Login, logout, forgot password / reset password, session handling.
- Application shell: side menu and menu search, header, user menu (About, Support, Change Password, Logout).
- All Dashboard widgets and their role-based visibility.

__Out of scope__

- Behaviour of the target pages that widgets link to (covered by their module BRDs).
- Social media and LDAP login (Admin BRD).

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Widget__

A dashboard card showing summary data from one module

__Quick Launch__

Widget of shortcut icons to common actions

__My Actions__

Widget listing pending items that need the user's action

# 2. User Roles and Permissions

Widget visibility by default role. A widget is also hidden when its source module is disabled in Admin > Configuration > Modules.

__Widget / function__

__Admin__

__Supervisor__

__ESS__

__Login / logout / change password__

Yes

Yes

Yes

__Time at Work__

Yes

Yes

Yes

__My Actions__

Yes

Yes

Yes (own items)

__Quick Launch__

All shortcuts

Role shortcuts

Self-service shortcuts

__Buzz Latest Posts__

Yes

Yes

Yes

__Employees on Leave Today__

Yes

Yes

Yes

__Employee Distribution by Sub Unit__

Yes

No

No

__Employee Distribution by Location__

Yes

No

No

__Leave widget configuration (gear)__

Yes

No

No

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

/web/index.php/auth/login

Login

Authenticate

Login > Forgot your password?

Reset Password

Request reset link

Dashboard

Dashboard

Landing page with widgets

User menu (top right) > About

About dialog

Company and version info

User menu > Support

Support page

Help links

User menu > Change Password

Update Password

Change own password

User menu > Logout

-

End session

# 4. Functional Requirements

## 4.1 Login and Session

### DSH-FR-001  Log in with valid credentials

__Description__

User logs in with Username* and Password*.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DSH-FR-001-AC1:__ The login page shows the OrangeHRM logo/login banner, Username and Password fields, a Login button and "Forgot your password?" link.
- __DSH-FR-001-AC2:__ Valid credentials of an enabled user open the Dashboard.
- __DSH-FR-001-AC3:__ The side menu shows only modules permitted to the user's role and enabled in configuration.
- __DSH-FR-001-AC4:__ The header shows the user's name and photo.

### DSH-FR-002  Reject invalid login

__Description__

The system blocks invalid login attempts.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DSH-FR-002-AC1:__ Empty Username or Password shows "Required" under the field.
- __DSH-FR-002-AC2:__ Wrong username or password shows the alert "Invalid credentials" and stays on the login page.
- __DSH-FR-002-AC3:__ A disabled user sees "Account disabled".
- __DSH-FR-002-AC4:__ Password is case-sensitive: the correct password typed in a different case is rejected.

### DSH-FR-003  Log out

__Description__

User logs out from the user menu.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DSH-FR-003-AC1:__ Logout returns to the login page.
- __DSH-FR-003-AC2:__ After logout, browser Back or direct URL to an internal page redirects to the login page.

### DSH-FR-004  Protect pages without a session

__Description__

Unauthenticated access is redirected to login.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DSH-FR-004-AC1:__ Opening any internal URL without a session redirects to the login page.
- __DSH-FR-004-AC2:__ After an expired session, the next action redirects to login.

### DSH-FR-005  Reset forgotten password

__Description__

User requests a reset link with Username*.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __DSH-FR-005-AC1:__ "Forgot your password?" opens Reset Password with Username* and Cancel/Reset Password buttons.
- __DSH-FR-005-AC2:__ Submitting a username shows "Reset Password link sent successfully" and instructions, regardless of whether the user exists (no user enumeration).
- __DSH-FR-005-AC3:__ Cancel returns to the login page.

### DSH-FR-006  Change own password

__Description__

User changes password via User menu > Change Password with Current Password*, Password* and Confirm Password*.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __DSH-FR-006-AC1:__ New password must follow the password policy and match Confirm Password.
- __DSH-FR-006-AC2:__ A wrong current password shows "Current Password is Incorrect".
- __DSH-FR-006-AC3:__ Success shows "Successfully Saved"; the user can log in with the new password and not the old one.

## 4.2 Application Shell

### DSH-FR-007  Side menu and search

__Description__

The left side menu lists modules and supports search and collapse.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DSH-FR-007-AC1:__ Admin default menu: Admin, PIM, Leave, Time, Recruitment, My Info, Performance, Dashboard, Directory, Maintenance, Claim, Buzz.
- __DSH-FR-007-AC2:__ ESS default menu excludes Admin, PIM and Maintenance (and Recruitment unless a hiring manager/interviewer).
- __DSH-FR-007-AC3:__ Typing in the menu Search filters menu items by name (case-insensitive).
- __DSH-FR-007-AC4:__ The collapse arrow toggles between full and icon-only menu.
- __DSH-FR-007-AC5:__ The active module is highlighted.

### DSH-FR-008  About and Support

__Description__

User menu shows About and Support.

__Priority__

Could

__Roles__

All

__Acceptance criteria__

- __DSH-FR-008-AC1:__ About opens a dialog with Company Name, Version, Active Employees and Employees Terminated.
- __DSH-FR-008-AC2:__ Support opens the support page with links to help resources.
- __DSH-FR-008-AC3:__ The header "?" icon opens context help.

## 4.3 Dashboard Widgets

### DSH-FR-009  Time at Work widget

__Description__

Shows the user's attendance status and this week's worked hours.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __DSH-FR-009-AC1:__ Displays "Punched In" with time or "Punched Out" with the last punch time.
- __DSH-FR-009-AC2:__ Shows today's total hours and a bar chart of hours per day for the current week.
- __DSH-FR-009-AC3:__ Clicking the punch icon opens Time > Attendance > Punch In/Out.
- __DSH-FR-009-AC4:__ After punching in/out, the widget reflects the new status on refresh.

### DSH-FR-010  My Actions widget

__Description__

Lists pending items requiring the user's action with counts.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __DSH-FR-010-AC1:__ Possible items: "(n) Leave Requests to Approve", "(n) Timesheets to Approve", "(n) Pending Self Review", "(n) Candidates to Interview", "(n) Reviews to Complete".
- __DSH-FR-010-AC2:__ Counts equal the number of corresponding pending items in the target module.
- __DSH-FR-010-AC3:__ Clicking an item opens the related list filtered to the pending items.
- __DSH-FR-010-AC4:__ When nothing is pending, the widget shows "No Pending Actions to Perform" with an illustration.

### DSH-FR-011  Quick Launch widget

__Description__

Shows shortcut icons.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __DSH-FR-011-AC1:__ Admin sees Assign Leave, Leave List, Timesheets, Apply Leave, My Leave and My Timesheet.
- __DSH-FR-011-AC2:__ ESS sees only shortcuts they are permitted to use.
- __DSH-FR-011-AC3:__ Each shortcut opens its target page.

### DSH-FR-012  Buzz Latest Posts widget

__Description__

Shows the most recent Buzz posts.

__Priority__

Could

__Roles__

All

__Acceptance criteria__

- __DSH-FR-012-AC1:__ Shows up to 5 latest posts with author photo, name, time and text preview.
- __DSH-FR-012-AC2:__ A post created in Buzz appears in the widget after refresh.
- __DSH-FR-012-AC3:__ Clicking a post opens Buzz.

### DSH-FR-013  Employees on Leave Today widget

__Description__

Lists employees with scheduled or taken leave on today's date.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __DSH-FR-013-AC1:__ Each entry shows employee photo, name and leave type.
- __DSH-FR-013-AC2:__ When nobody is on leave, the widget shows "No Employees are on Leave Today".
- __DSH-FR-013-AC3:__ Admin can open the gear icon to toggle "Show only accessible employees on leave today"; when on, users see only employees within their data scope.

### DSH-FR-014  Employee distribution charts

__Description__

Pie charts of current employees by Sub Unit and by Location.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __DSH-FR-014-AC1:__ Each slice represents a sub unit (or location) with its employee count, plus "Unassigned".
- __DSH-FR-014-AC2:__ Hovering a slice shows the name and percentage.
- __DSH-FR-014-AC3:__ Clicking a legend item toggles that slice.
- __DSH-FR-014-AC4:__ Totals equal the number of current employees in PIM.

### DSH-FR-015  Widgets respect module configuration

__Description__

Widgets for disabled modules are hidden.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __DSH-FR-015-AC1:__ Disabling Time hides Time at Work; disabling Leave hides Employees on Leave Today and leave shortcuts; disabling Buzz hides Buzz Latest Posts.
- __DSH-FR-015-AC2:__ Re-enabling the module restores the widget.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

DSH-VAL-001

Login

Username

Yes

Not blank

"Required"

DSH-VAL-002

Login

Password

Yes

Not blank

"Required"

DSH-VAL-003

Login

Credentials

-

Must match an enabled user

"Invalid credentials"; "Account disabled"

DSH-VAL-004

Reset Password

Username

Yes

Not blank

"Required"

DSH-VAL-005

Change Password

Current Password

Yes

Must match current

"Required"; "Current Password is Incorrect"

DSH-VAL-006

Change Password

Password

Yes

Password policy (min 7, 1 number, 1 lower-case, max 64)

"Should have at least 7 characters"; policy messages

DSH-VAL-007

Change Password

Confirm Password

Yes

Equals Password

"Passwords do not match"

DSH-VAL-008

Menu search

Search

No

Free text filter

Matching items only; none shown when nothing matches

# 6. Business Rules

__ID__

__Rule__

DSH-BR-01

Every page except login, reset password and the public recruitment page requires an authenticated session.

DSH-BR-02

Menu items and widgets are shown according to role permissions and enabled modules.

DSH-BR-03

Dashboard figures are read-only summaries and must equal the source module data.

DSH-BR-04

Password reset responses must not reveal whether a username exists.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Invalid login

Invalid credentials

Alert on login page

Disabled account

Account disabled

Alert on login page

Reset requested

Reset Password link sent successfully

Page

Password changed

Success: Successfully Saved

Toast (success)

No pending actions

No Pending Actions to Perform

Widget empty state

No one on leave

No Employees are on Leave Today

Widget empty state

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

DSH-NFR-01

Performance

Dashboard with all widgets loads within 5 seconds on the reference environment.

DSH-NFR-02

Security

Login is protected against CSRF; session cookie is HttpOnly.

DSH-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

DSH-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

DSH-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

DSH-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

DSH-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- Default module configuration (all modules enabled).
- Leave, Time and Recruitment data used to check widgets is created by the test.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- Leave, Time, Performance, Recruitment, Buzz and PIM supply widget data.
- Admin: users, roles, module configuration.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Log in once per worker and reuse the authenticated storage state; keep explicit login tests separate.
- Widget data is global and shared with other tests; assert relative changes (count increased by 1) rather than absolute numbers.
- Charts are canvas-based; assert legend text and counts via API rather than pixel content.
- Use a dedicated user for Change Password tests and restore the password in teardown.

## 10.2 Test data

__Data item__

__Suggested value / source__

Admin

Admin / admin123 (demo)

ESS user

Dedicated ESS login

Invalid credentials

Admin / wrongpass; unknown / admin123; blank fields

Leave today

Leave assigned for today to a test employee

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

DSH-E2E-01

Login and logout

1. Log in as Admin, Dashboard visible

2. Logout

3. Back button / direct URL redirect to login

DSH-FR-001, DSH-FR-003, DSH-FR-004

Smoke

DSH-E2E-02

Invalid login

1. Blank fields show Required

2. Wrong password shows Invalid credentials

3. Disabled user shows Account disabled

DSH-FR-002

Smoke

DSH-E2E-03

Role-based menu

1. Admin sees full menu

2. ESS sees reduced menu

3. Menu search "lea" shows Leave only

DSH-FR-007, DSH-FR-001

Regression

DSH-E2E-04

My Actions reflects pending leave

1. Note supervisor's leave-to-approve count

2. Subordinate applies leave

3. Count increases by 1 and link opens Leave List

DSH-FR-010

Regression

DSH-E2E-05

Employees on leave today

1. Assign leave for today to an employee

2. Widget lists the employee and leave type

DSH-FR-013

Regression

DSH-E2E-06

Change password

1. Wrong current password rejected

2. Change to new password

3. Login with new password works, old fails

4. Restore

DSH-FR-006

Regression

DSH-E2E-07

Widgets follow module toggles

1. Disable Buzz

2. Buzz widget hidden

3. Re-enable

DSH-FR-015, DSH-FR-012

Regression

DSH-E2E-08

Forgot password

1. Request reset for existing and non-existing user

2. Both show same success message

DSH-FR-005

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

DSH-FR-001

Log in with valid credentials

Login and Session

Must

4

DSH-E2E-01, DSH-E2E-03

DSH-FR-002

Reject invalid login

Login and Session

Must

4

DSH-E2E-02

DSH-FR-003

Log out

Login and Session

Must

2

DSH-E2E-01

DSH-FR-004

Protect pages without a session

Login and Session

Must

2

DSH-E2E-01

DSH-FR-005

Reset forgotten password

Login and Session

Should

3

DSH-E2E-08

DSH-FR-006

Change own password

Login and Session

Should

3

DSH-E2E-06

DSH-FR-007

Side menu and search

Application Shell

Must

5

DSH-E2E-03

DSH-FR-008

About and Support

Application Shell

Could

3

Functional test

DSH-FR-009

Time at Work widget

Dashboard Widgets

Should

4

Functional test

DSH-FR-010

My Actions widget

Dashboard Widgets

Must

4

DSH-E2E-04

DSH-FR-011

Quick Launch widget

Dashboard Widgets

Should

3

Functional test

DSH-FR-012

Buzz Latest Posts widget

Dashboard Widgets

Could

3

DSH-E2E-07

DSH-FR-013

Employees on Leave Today widget

Dashboard Widgets

Should

3

DSH-E2E-05

DSH-FR-014

Employee distribution charts

Dashboard Widgets

Should

4

Functional test

DSH-FR-015

Widgets respect module configuration

Dashboard Widgets

Should

2

DSH-E2E-07

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

