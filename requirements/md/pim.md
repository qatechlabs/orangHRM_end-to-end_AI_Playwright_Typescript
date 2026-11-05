<!-- Generated from requirements/brd/OrangeHRM_BRD_PIM.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

PIM (Personnel Information Management) Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

PIM (Personnel Information Management) Module

__Document ID__

BRD-PIM-001

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

PIM-FR-nnn

Functional requirement

PIM-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

PIM-VAL-nnn

Field-level validation rule

PIM-BR-nn

Business rule

PIM-NFR-nn

Non-functional requirement

PIM-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the PIM module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

PIM is the central employee master of OrangeHRM. Administrators create and maintain employee records, and every other module (Leave, Time, Performance, Recruitment, Claim, Directory and so on) reads employee data from PIM.

The module provides an Employee List with search, an Add Employee screen with optional login creation, a tabbed employee profile (Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships), configuration of optional and custom fields, CSV data import, reporting methods, termination reasons, and configurable employee reports.

## 1.3 Scope

__In scope__

- Employee List: search, filter, sort, paginate, view, edit and delete employees (single and bulk).
- Add Employee, including profile photo and creation of login credentials.
- All tabs of the employee profile, including their attachments sections.
- Employment termination and re-activation.
- PIM Configuration: Optional Fields, Custom Fields, Data Import, Reporting Methods, Termination Reasons.
- PIM Reports: create, view, edit, delete employee reports.
- Role-based access to PIM for Admin, Supervisor and ESS users.

__Out of scope__

- Master data maintained in the Admin module (Job Titles, Pay Grades, Employment Status, Job Categories, Sub Units, Locations, Skills, Education, Licenses, Languages, Memberships, Nationalities). These are covered in the Admin BRD and used here as reference data.
- User account maintenance after creation (Admin > User Management).
- Self-service edits by the employee (covered in the My Info BRD), except where PIM behaviour differs.
- Payroll processing, which OrangeHRM Open Source does not provide.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__PIM__

Personnel Information Management

__ESS__

Employee Self Service user role: an ordinary employee

__Employee Id__

Organisation-assigned identifier of an employee, auto-suggested by the system and editable

__Current employee__

Employee without a termination record

__Past employee__

Employee whose employment has been terminated

__Sub Unit__

Organisational unit from Admin > Organization > Structure

__Toast__

Transient notification shown at the bottom-left of the screen after an action

# 2. User Roles and Permissions

Access is governed by user roles defined in Admin > User Management > User Roles. The matrix below shows the default OrangeHRM 5.x behaviour.

__Capability__

__Admin__

__Supervisor__

__ESS__

__See PIM menu__

Yes

Yes (subordinates only)

No

__Search / view employee list__

All employees

Own subordinates

No

__Add employee__

Yes

No

No

__Delete employee__

Yes

No

No

__Edit personal / contact / emergency / dependents / immigration__

Yes

Yes, for subordinates

Own record via My Info

__Edit Job details, terminate / activate__

Yes

View only

View only via My Info

__Edit Salary__

Yes

No

View only via My Info

__Edit Report-to__

Yes

View only

View only via My Info

__PIM Configuration menu__

Yes

No

No

__PIM Reports__

Yes

No

No

- Custom roles can widen or narrow these permissions; tests that depend on role behaviour must use the default Admin and ESS roles unless a custom role is created as test data.
- An ESS user who is also a supervisor (has subordinates) receives the Supervisor capabilities for those subordinates.

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

PIM > Employee List

Employee Information

Search and list employees; entry point for edit, delete, add

PIM > Add Employee

Add Employee

Create a new employee and optional login

PIM > (employee row)

Employee profile

Tabbed profile with Personal Details opened first

PIM > Configuration > Optional Fields

Optional Fields

Show/hide deprecated and country-specific fields

PIM > Configuration > Custom Fields

Custom Fields

Define up to 10 additional fields on profile screens

PIM > Configuration > Data Import

Data Import

Bulk-create employees from a CSV file

PIM > Configuration > Reporting Methods

Reporting Methods

Maintain the list used in Report-to

PIM > Configuration > Termination Reasons

Termination Reasons

Maintain the list used when terminating employment

PIM > Reports

Employee Reports

Define and run employee reports

# 4. Functional Requirements

## 4.1 Employee List and Search

The Employee List is the PIM landing page. It shows a collapsible search panel above a results table.

### PIM-FR-001  Display employee list

__Description__

On opening PIM, the system shows the Employee Information search panel and a table of current employees.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-001-AC1:__ The results table shows columns: checkbox, Id, First (& Middle) Name, Last Name, Job Title, Employment Status, Sub Unit, Supervisor, Actions.
- __PIM-FR-001-AC2:__ A record count is displayed above the table in the form "(N) Records Found".
- __PIM-FR-001-AC3:__ By default only current employees are listed (Include = "Current Employees Only").
- __PIM-FR-001-AC4:__ Each row has a delete (trash) icon and an edit (pencil) icon in Actions; clicking anywhere on the row opens the employee profile.
- __PIM-FR-001-AC5:__ A Supervisor sees only employees who report to them directly or indirectly.

### PIM-FR-002  Search employees by criteria

__Description__

User filters the list by Employee Name, Employee Id, Employment Status, Include, Supervisor Name, Job Title and Sub Unit.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-002-AC1:__ Employee Name and Supervisor Name are autocomplete fields that suggest matching employees after typing; free text is also accepted for Employee Name and matches partially.
- __PIM-FR-002-AC2:__ Employee Status, Include, Job Title and Sub Unit are drop-downs populated from Admin master data.
- __PIM-FR-002-AC3:__ Clicking Search shows only records that match all entered criteria (AND logic).
- __PIM-FR-002-AC4:__ Selecting a Sub Unit also returns employees in its child sub units.
- __PIM-FR-002-AC5:__ When no record matches, the table is empty, the count shows "No Records Found" and an info toast "No Records Found" appears.
- __PIM-FR-002-AC6:__ Clicking Reset clears all criteria and reloads the default list.
- __PIM-FR-002-AC7:__ Include offers "Current Employees Only", "Current and Past Employees" and "Past Employees Only", and the results honour the selection.

### PIM-FR-003  Sort and paginate list

__Description__

User sorts the result table by column and navigates between pages.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-003-AC1:__ Sortable column headers (Id, First (& Middle) Name, Last Name, Job Title, Employment Status, Sub Unit, Supervisor) offer Ascending and Descending options.
- __PIM-FR-003-AC2:__ After sorting, the rows are ordered by the selected column in the selected direction.
- __PIM-FR-003-AC3:__ The table shows at most 50 records per page; when more exist, pagination controls with page numbers and next/previous arrows appear.
- __PIM-FR-003-AC4:__ Search criteria are retained while moving between pages.

### PIM-FR-004  Delete employee (single and bulk)

__Description__

Admin permanently deletes one or more employee records from the list.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-004-AC1:__ Clicking the trash icon opens a confirmation dialog titled "Are you Sure?" with the text "The selected record will be permanently deleted. Are you sure you want to continue?" and buttons "No, Cancel" and "Yes, Delete".
- __PIM-FR-004-AC2:__ "No, Cancel" closes the dialog and keeps the record.
- __PIM-FR-004-AC3:__ "Yes, Delete" removes the record, shows the toast "Successfully Deleted" and the record no longer appears in any search.
- __PIM-FR-004-AC4:__ Selecting one or more row checkboxes shows a "Delete Selected" button with the selected count; confirming deletes all selected records.
- __PIM-FR-004-AC5:__ The header checkbox selects or clears all rows on the current page.
- __PIM-FR-004-AC6:__ The logged-in Admin cannot select or delete their own employee record.

## 4.2 Add Employee

Reached from PIM > Add Employee or the "+ Add" button on the Employee List.

### PIM-FR-005  Add employee with mandatory details

__Description__

Admin creates an employee by entering First Name and Last Name; Middle Name and Employee Id are optional.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-005-AC1:__ The form shows First Name*, Middle Name, Last Name*, Employee Id and the profile picture placeholder.
- __PIM-FR-005-AC2:__ Employee Id is pre-filled with the next available numeric id and can be overwritten.
- __PIM-FR-005-AC3:__ On Save with valid data, the toast "Successfully Saved" appears and the user is taken to the new employee's Personal Details tab with the entered names shown.
- __PIM-FR-005-AC4:__ The new employee appears in the Employee List and can be found by name and by Employee Id.
- __PIM-FR-005-AC5:__ Cancel returns to the Employee List without creating a record.
- __PIM-FR-005-AC6:__ Leading and trailing spaces are trimmed from names before saving.

### PIM-FR-006  Upload profile photo

__Description__

Admin optionally uploads a photograph while adding an employee or later from the profile.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-006-AC1:__ Accepted types are jpg, jpeg, png and gif; the maximum size is 1 MB; recommended dimensions 200 x 200 px.
- __PIM-FR-006-AC2:__ A valid image is previewed immediately and is shown on the profile after save.
- __PIM-FR-006-AC3:__ A file of another type shows "File type not allowed"; a file over 1 MB shows "Attachment Size Exceeded" and save is blocked.
- __PIM-FR-006-AC4:__ From the profile, clicking the photo opens Change Profile Picture where the photo can be replaced or deleted.

### PIM-FR-007  Create login details with employee

__Description__

Turning on "Create Login Details" lets Admin create an ESS user account for the employee in the same step.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-007-AC1:__ When the toggle is off, login fields are hidden; when on, Username*, Status (Enabled/Disabled, default Enabled), Password* and Confirm Password* appear.
- __PIM-FR-007-AC2:__ On save, a user with role ESS, the chosen status and the given credentials is created and is visible in Admin > User Management.
- __PIM-FR-007-AC3:__ The new user can log in with the given credentials when status is Enabled and cannot when it is Disabled ("Account disabled").
- __PIM-FR-007-AC4:__ Username must be unique across all users; a duplicate shows "Username already exists".
- __PIM-FR-007-AC5:__ A password strength indicator (Very Weak to Strongest) is displayed while typing.

## 4.3 Employee Profile: Personal Details

All profile tabs share a header with the employee photo and full name, and a left tab menu. Each tab has its own Save button and an Attachments section at the bottom.

### PIM-FR-008  Edit personal details

__Description__

User maintains Employee Full Name, Employee Id, Other Id, Driver's License Number, License Expiry Date, Nationality, Marital Status, Date of Birth and Gender.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-008-AC1:__ Fields are pre-populated with saved values when the tab opens.
- __PIM-FR-008-AC2:__ Nationality lists values from Admin > Nationalities; Marital Status offers Single, Married, Other; Gender offers Male and Female radio buttons.
- __PIM-FR-008-AC3:__ Date fields accept the format configured in Admin > Localization (default yyyy-dd-mm) and offer a calendar picker.
- __PIM-FR-008-AC4:__ Saving valid changes shows "Successfully Updated" and the values persist after page reload.
- __PIM-FR-008-AC5:__ Changes to the name are reflected in the profile header and in the Employee List.
- __PIM-FR-008-AC6:__ When enabled in Optional Fields, Nickname, Military Service, Smoker, SSN Number and SIN Number are shown.

### PIM-FR-009  Custom fields on profile screens

__Description__

Custom fields defined for a screen appear in a "Custom Fields" section on that tab.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-009-AC1:__ Custom fields of type Text or Number render as text inputs; type Drop Down renders a select with the configured options.
- __PIM-FR-009-AC2:__ Custom field values are saved independently with their own Save button and show "Successfully Updated".
- __PIM-FR-009-AC3:__ Deleting a custom field definition removes it from the profile screen.

### PIM-FR-010  Manage tab attachments

__Description__

Each profile tab allows files to be attached with an optional comment.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-010-AC1:__ Clicking "+ Add" in Attachments shows Select File* and Comment, with the hint "Accepts up to 1MB".
- __PIM-FR-010-AC2:__ A saved attachment appears in the table with File Name, Description, Size, Type, Date Added, Added By and Actions (edit, delete, download).
- __PIM-FR-010-AC3:__ Files above 1 MB show "Attachment Size Exceeded" and are not saved.
- __PIM-FR-010-AC4:__ Download returns the same file that was uploaded; delete asks for confirmation and removes the row.
- __PIM-FR-010-AC5:__ Attachments can be bulk-deleted using row checkboxes.

## 4.4 Employee Profile: Contact, Emergency Contacts and Dependents

### PIM-FR-011  Edit contact details

__Description__

User maintains address (Street 1, Street 2, City, State/Province, Zip/Postal Code, Country), telephones (Home, Mobile, Work) and emails (Work Email, Other Email).

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-011-AC1:__ Country is a drop-down; for United States, State/Province becomes a drop-down of states.
- __PIM-FR-011-AC2:__ Telephone fields accept digits and the characters + - / ( ) and reject other characters.
- __PIM-FR-011-AC3:__ Email fields require a valid email format.
- __PIM-FR-011-AC4:__ Work Email and Other Email must be unique across employees and must differ from each other.
- __PIM-FR-011-AC5:__ Saving valid data shows "Successfully Updated".

### PIM-FR-012  Maintain emergency contacts

__Description__

User adds, edits and deletes emergency contacts with Name*, Relationship*, Home Telephone, Mobile and Work Telephone.

__Priority__

Must

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-012-AC1:__ At least one of the three telephone numbers is mandatory.
- __PIM-FR-012-AC2:__ Saved contacts are listed in the Assigned Emergency Contacts table with Name, Relationship, Home Telephone, Mobile, Work Telephone.
- __PIM-FR-012-AC3:__ Edit pre-fills the form; delete removes the record after confirmation, singly or in bulk.

### PIM-FR-013  Maintain dependents

__Description__

User adds, edits and deletes dependents with Name*, Relationship* and Date of Birth.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-013-AC1:__ Relationship offers "Child" and "Other"; choosing "Other" shows a mandatory "Please Specify" field.
- __PIM-FR-013-AC2:__ Saved dependents are listed with Name, Relationship and Date of Birth.
- __PIM-FR-013-AC3:__ Edit and delete (single and bulk) behave as for emergency contacts.

## 4.5 Employee Profile: Immigration

### PIM-FR-014  Maintain immigration records

__Description__

User records passports and visas: Document (Passport/Visa)*, Number*, Issued Date, Expiry Date, Eligible Status, Issued By, Eligible Review Date, Comments.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-014-AC1:__ Document defaults to Passport and is selected with radio buttons.
- __PIM-FR-014-AC2:__ Issued By lists countries.
- __PIM-FR-014-AC3:__ Expiry Date earlier than Issued Date is rejected with a validation message.
- __PIM-FR-014-AC4:__ Saved records appear with Document, Number, Issued By, Issued Date, Expiry Date and can be edited or deleted.

## 4.6 Employee Profile: Job and Employment Lifecycle

### PIM-FR-015  Edit job details

__Description__

Admin maintains Joined Date, Job Title, Job Category, Sub Unit, Location and Employment Status.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-015-AC1:__ All drop-downs are populated from the corresponding Admin master data.
- __PIM-FR-015-AC2:__ Selecting a Job Title that has a specification shows the Job Specification file name as a download link.
- __PIM-FR-015-AC3:__ Saving shows "Successfully Updated" and the Job Title, Employment Status and Sub Unit appear in the Employee List row.
- __PIM-FR-015-AC4:__ Supervisor and ESS see the Job tab read-only.

### PIM-FR-016  Record employment contract

__Description__

Turning on "Include Employment Contract Details" captures Contract Start Date, Contract End Date and a Contract Details file.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-016-AC1:__ Contract End Date must be after Contract Start Date.
- __PIM-FR-016-AC2:__ The contract file obeys the 1 MB limit and can be replaced, kept or deleted on later edits.

### PIM-FR-017  Terminate employment

__Description__

Admin ends an employee's employment from the Job tab.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-017-AC1:__ "Terminate Employment" opens a dialog with Termination Date*, Termination Reason* (from Configuration > Termination Reasons) and Note.
- __PIM-FR-017-AC2:__ After saving, the Job tab shows "Terminated on: <date>" and the button changes to "Activate Employment".
- __PIM-FR-017-AC3:__ The employee no longer appears with Include = "Current Employees Only" and appears with "Past Employees Only".
- __PIM-FR-017-AC4:__ The terminated employee is shown as "(Past Employee)" wherever their name is displayed in lists and autocompletes.

### PIM-FR-018  Re-activate employment

__Description__

Admin reverses a termination.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-018-AC1:__ Clicking "Activate Employment" removes the termination record without further input and shows "Successfully Updated".
- __PIM-FR-018-AC2:__ The employee appears again in "Current Employees Only".

## 4.7 Employee Profile: Salary

### PIM-FR-019  Maintain salary components

__Description__

Admin adds, edits and deletes salary components: Salary Component*, Pay Grade, Pay Frequency, Currency*, Amount*, Comments.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-019-AC1:__ When a Pay Grade is chosen, Currency lists only currencies of that pay grade and the allowed Min/Max are applied to Amount.
- __PIM-FR-019-AC2:__ Amount outside the pay grade range shows "Should be within Min and Max range".
- __PIM-FR-019-AC3:__ Pay Frequency offers Bi Weekly, Hourly, Monthly, Monthly on first pay of month, Semi Monthly, Weekly.
- __PIM-FR-019-AC4:__ Saved components appear in Assigned Salary Components with Salary Component, Amount, Currency, Pay Frequency, Direct Deposit Amount.
- __PIM-FR-019-AC5:__ The Salary tab is not editable by Supervisor and is read-only for the employee in My Info.

### PIM-FR-020  Record direct deposit

__Description__

Turning on "Include Direct Deposit Details" captures Account Number*, Account Type* (Savings, Checking, Other with specify), Routing Number* and Amount*.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-020-AC1:__ All direct-deposit fields become mandatory when the toggle is on.
- __PIM-FR-020-AC2:__ Routing Number and Amount accept numeric values only.

## 4.8 Employee Profile: Report-to

### PIM-FR-021  Assign supervisors and subordinates

__Description__

Admin assigns supervisors and subordinates with a Reporting Method.

__Priority__

Must

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-021-AC1:__ Add Supervisor and Add Subordinate each show Name* (employee autocomplete) and Reporting Method* (Direct, Indirect and any configured methods).
- __PIM-FR-021-AC2:__ An employee cannot be assigned as their own supervisor or subordinate.
- __PIM-FR-021-AC3:__ The same supervisor/subordinate pair cannot be added twice.
- __PIM-FR-021-AC4:__ Saved relations appear in Assigned Supervisors / Assigned Subordinates and also on the counterpart employee's Report-to tab.
- __PIM-FR-021-AC5:__ After assignment, the supervisor's name appears in the Supervisor column of the Employee List and the supervisor can see the employee in PIM.

## 4.9 Employee Profile: Qualifications and Memberships

### PIM-FR-022  Maintain qualifications

__Description__

The Qualifications tab holds five sub-sections: Work Experience, Education, Skills, Languages and License.

__Priority__

Should

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-022-AC1:__ Work Experience: Company* and Job Title* are mandatory; From/To dates are optional and To must be after From.
- __PIM-FR-022-AC2:__ Education: Level* from Admin > Education; Institute, Major/Specialization, Year, GPA/Score, Start Date, End Date optional.
- __PIM-FR-022-AC3:__ Skills: Skill* from Admin > Skills; Years of Experience numeric; a skill cannot be added twice for the same employee.
- __PIM-FR-022-AC4:__ Languages: Language*, Fluency* (Writing, Speaking, Reading) and Competency* (Poor, Basic, Good, Mother Tongue) are mandatory.
- __PIM-FR-022-AC5:__ License: License Type* from Admin > Licenses; License Number, Issued Date, Expiry Date optional.
- __PIM-FR-022-AC6:__ Each sub-section lists saved records and supports edit and delete.

### PIM-FR-023  Maintain memberships

__Description__

User records memberships: Membership*, Subscription Paid By (Company/Individual), Subscription Amount, Currency, Subscription Commence Date, Subscription Renewal Date.

__Priority__

Could

__Roles__

Admin, Supervisor

__Acceptance criteria__

- __PIM-FR-023-AC1:__ Membership lists values from Admin > Qualifications > Memberships.
- __PIM-FR-023-AC2:__ Renewal Date must be after Commence Date.
- __PIM-FR-023-AC3:__ Saved records appear with Membership, Subscription Paid By, Amount, Currency, Commence Date, Renewal Date.

## 4.10 PIM Configuration

### PIM-FR-024  Configure optional fields

__Description__

Admin chooses whether deprecated fields (Nick Name, Smoker, Military Service) and country-specific fields (SSN, SIN, US Tax Exemptions) are shown.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-024-AC1:__ Each option is a toggle; saving shows "Successfully Saved".
- __PIM-FR-024-AC2:__ Turning a toggle on makes the corresponding field(s) visible in Personal Details; turning it off hides them without deleting stored data.
- __PIM-FR-024-AC3:__ Enabling "Show US Tax Exemptions menu" adds a Tax Exemptions tab to the employee profile.

### PIM-FR-025  Define custom fields

__Description__

Admin creates, edits and deletes custom fields with Field Name*, Screen* and Type*.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-025-AC1:__ Screen offers Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships.
- __PIM-FR-025-AC2:__ Type offers Text or Number and Drop Down; Drop Down requires Select Options* as comma-separated values.
- __PIM-FR-025-AC3:__ A maximum of 10 custom fields can be defined; the screen shows how many remain and the Add button is disabled at 10.
- __PIM-FR-025-AC4:__ Field Name must be unique.

### PIM-FR-026  Import employees from CSV

__Description__

Admin bulk-creates employees by uploading a CSV file in the documented format.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-026-AC1:__ The page provides a downloadable sample CSV and lists the rules: column order must not change, first_name and last_name are mandatory, dates in YYYY-MM-DD, gender Male/Female, and so on.
- __PIM-FR-026-AC2:__ Only .csv files up to 1 MB are accepted.
- __PIM-FR-026-AC3:__ After upload, a dialog reports the number of records imported, and created employees appear in the Employee List.
- __PIM-FR-026-AC4:__ Rows with invalid data are skipped and reported as failed without blocking valid rows.

### PIM-FR-027  Maintain reporting methods

__Description__

Admin adds, edits and deletes reporting methods used in Report-to.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-027-AC1:__ Name* is mandatory, max 100 characters, and must be unique ("Already exists").
- __PIM-FR-027-AC2:__ New methods immediately appear in the Reporting Method drop-down on Report-to.
- __PIM-FR-027-AC3:__ A reporting method in use cannot be deleted.

### PIM-FR-028  Maintain termination reasons

__Description__

Admin adds, edits and deletes termination reasons used when terminating employment.

__Priority__

Could

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-028-AC1:__ Name* is mandatory, max 100 characters, and must be unique ("Already exists").
- __PIM-FR-028-AC2:__ New reasons immediately appear in the Terminate Employment dialog.
- __PIM-FR-028-AC3:__ A termination reason in use cannot be deleted.

## 4.11 PIM Reports

### PIM-FR-029  List and search reports

__Description__

PIM > Reports lists saved employee reports and allows searching by Report Name.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-029-AC1:__ The list shows Name and Actions (delete, edit, view) with a record count.
- __PIM-FR-029-AC2:__ Report Name is an autocomplete; Search filters the list and Reset restores it.
- __PIM-FR-029-AC3:__ Predefined reports (for example "Employee Contact info report", "Employee Job Details", "PIM Sample Report", "All Employee Sub Unit Hierarchy Report") are listed out of the box.

### PIM-FR-030  Create and run a report

__Description__

Admin defines a report with Report Name*, Selection Criteria, Include filter and Display Fields.

__Priority__

Should

__Roles__

Admin

__Acceptance criteria__

- __PIM-FR-030-AC1:__ Selection Criteria offers Employee Name, Pay Grade, Education, Employment Status, Service Period, Joined Date, Job Title, Language, Skill, Age Range, Sub Unit, Gender, Location; each added criterion shows its own input.
- __PIM-FR-030-AC2:__ Display Field Groups (Personal, Contact Details, Emergency Contacts, Dependents, Memberships, Work Experience, Education, Skills, Languages, License, Supervisors, Subordinates, Salary, Job, Immigration, Custom Fields) each list fields that can be added; an "Include Header" toggle per group is available.
- __PIM-FR-030-AC3:__ At least one display field is required to save.
- __PIM-FR-030-AC4:__ On save the report runs and displays a table with only the selected columns and only employees matching the criteria.
- __PIM-FR-030-AC5:__ Report Name must be unique ("Already exists").
- __PIM-FR-030-AC6:__ Edit pre-fills the definition; delete removes the report after confirmation.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

PIM-VAL-001

Add Employee

First Name

Yes

Not blank; max 30 characters

"Required"; "Should not exceed 30 characters"

PIM-VAL-002

Add Employee

Middle Name

No

Max 30 characters

"Should not exceed 30 characters"

PIM-VAL-003

Add Employee

Last Name

Yes

Not blank; max 30 characters

"Required"; "Should not exceed 30 characters"

PIM-VAL-004

Add Employee / Personal

Employee Id

No

Max 10 characters; unique

"Should not exceed 10 characters"; "Employee Id already exists"

PIM-VAL-005

Add Employee

Profile photo

No

jpg, jpeg, png, gif; max 1 MB

"File type not allowed"; "Attachment Size Exceeded"

PIM-VAL-006

Add Employee

Username

Yes (login on)

Min 5, max 40 characters; unique

"Should be at least 5 characters"; "Should not exceed 40 characters"; "Username already exists"

PIM-VAL-007

Add Employee

Password

Yes (login on)

Min 7 characters; max 64; must contain at least one number and one lower-case letter (default policy)

"Should have at least 7 characters"; "Your password must contain minimum 1 number"; "Your password must contain minimum 1 lower-case letter"

PIM-VAL-008

Add Employee

Confirm Password

Yes (login on)

Must equal Password

"Passwords do not match"

PIM-VAL-009

Personal Details

Other Id / Driver's License Number

No

Max 30 characters

"Should not exceed 30 characters"

PIM-VAL-010

Personal Details

Date of Birth / License Expiry Date

No

Valid date in configured format

"Should be a valid date in yyyy-dd-mm format"

PIM-VAL-011

Contact Details

Street 1 / Street 2 / City / State

No

Max 70 characters

"Should not exceed 70 characters"

PIM-VAL-012

Contact Details

Zip/Postal Code

No

Max 10 characters

"Should not exceed 10 characters"

PIM-VAL-013

Contact Details

Home / Mobile / Work telephone

No

Digits and + - / ( ) only; max 25

"Allows numbers and only + - / ( )"; "Should not exceed 25 characters"

PIM-VAL-014

Contact Details

Work Email / Other Email

No

Valid email; max 50; unique; the two must differ

"Expected format: admin@example.com"; "Already exists"

PIM-VAL-015

Emergency Contacts

Name / Relationship

Yes

Not blank; max 100

"Required"; "Should not exceed 100 characters"

PIM-VAL-016

Emergency Contacts

Telephones

At least one

One of Home / Mobile / Work required

"At least one phone number is required"

PIM-VAL-017

Dependents

Name / Relationship

Yes

Not blank; Please Specify required when Other

"Required"

PIM-VAL-018

Immigration

Number

Yes

Not blank; max 30

"Required"; "Should not exceed 30 characters"

PIM-VAL-019

Immigration

Expiry Date

No

Must be after Issued Date

"Expiry date should be after issued date"

PIM-VAL-020

Job

Contract End Date

No

Must be after Contract Start Date

"End date should be after start date"

PIM-VAL-021

Job > Terminate

Termination Date / Reason

Yes

Not blank

"Required"

PIM-VAL-022

Salary

Salary Component

Yes

Not blank; max 100

"Required"; "Should not exceed 100 characters"

PIM-VAL-023

Salary

Amount

Yes

Numeric; within pay grade min/max when a pay grade is selected

"Should be a number"; "Should be within Min and Max range"

PIM-VAL-024

Salary

Currency

Yes

Selected from list

"Required"

PIM-VAL-025

Salary > Direct Deposit

Account Number / Type / Routing / Amount

Yes (toggle on)

Routing and Amount numeric

"Required"; "Should be a number"

PIM-VAL-026

Report-to

Name

Yes

Must be a valid existing employee chosen from autocomplete

"Invalid"

PIM-VAL-027

Report-to

Reporting Method

Yes

Selected from list

"Required"

PIM-VAL-028

Qualifications > Work Experience

Company / Job Title

Yes

Max 100 characters; To after From

"Required"; "To date should be after From date"

PIM-VAL-029

Qualifications > Skills

Years of Experience

No

Numeric 0–99

"Should be a number"

PIM-VAL-030

Qualifications > Languages

Language / Fluency / Competency

Yes

Selected from lists

"Required"

PIM-VAL-031

Attachments (all tabs)

Select File

Yes

Max 1 MB

"Required"; "Attachment Size Exceeded"

PIM-VAL-032

Attachments (all tabs)

Comment

No

Max 200 characters

"Should not exceed 200 characters"

PIM-VAL-033

Custom Fields

Field Name

Yes

Max 250 characters; unique

"Required"; "Already exists"

PIM-VAL-034

Custom Fields

Select Options

Yes (Drop Down)

Comma-separated values

"Required"

PIM-VAL-035

Data Import

Select File

Yes

.csv only; max 1 MB

"File type not allowed"; "Attachment Size Exceeded"

PIM-VAL-036

Reporting Methods / Termination Reasons

Name

Yes

Max 100 characters; unique

"Required"; "Already exists"

PIM-VAL-037

Reports

Report Name

Yes

Max 250 characters; unique

"Required"; "Already exists"

# 6. Business Rules

__ID__

__Rule__

PIM-BR-01

Every employee must have a First Name and a Last Name; all other data is optional.

PIM-BR-02

Employee Id is unique across current and past employees.

PIM-BR-03

An employee may have at most one user account created through Add Employee; additional accounts are managed in Admin.

PIM-BR-04

Deleting an employee is permanent and also removes their records in other modules (leave, time, etc.) and any linked user account; terminate instead when history must be kept.

PIM-BR-05

A terminated employee keeps all data, is excluded from current-employee lists by default and cannot apply for leave or be assigned new work.

PIM-BR-06

A user cannot delete their own employee record.

PIM-BR-07

Supervisors gain visibility of subordinates through Report-to; removing the relation immediately removes visibility.

PIM-BR-08

Report-to relations cannot be circular to self (an employee cannot supervise themselves).

PIM-BR-09

Salary Amount must respect the min/max of the selected Pay Grade and Currency.

PIM-BR-10

Reference values (Job Title, Employment Status, etc.) that are deleted in Admin are cleared from employee records; deleted Job Titles may appear as "(Deleted)".

PIM-BR-11

All attachments and photos are limited to 1 MB per file.

PIM-BR-12

Optional-field toggles only control visibility; hiding a field never deletes stored data.

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

Search with no results

Info: No Records Found

Toast (info)

Mandatory field empty

Required

Inline (red, below field)

Delete clicked

Are you Sure? / The selected record will be permanently deleted. Are you sure you want to continue?

Modal dialog

Data import completed

Number of Records Imported: N

Modal dialog

Unexpected error

Error: ... (server message)

Toast (error)

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

PIM-NFR-01

Data integrity

Saving one profile tab never changes data on other tabs.

PIM-NFR-02

Privacy

SSN/SIN values are displayed only to roles with permission and are hidden unless enabled in Optional Fields.

PIM-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

PIM-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

PIM-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

PIM-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

PIM-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- The Admin module master data (Job Titles, Employment Status, Pay Grades, Sub Units, Locations, Nationalities, Skills, Languages, Education, Licenses, Memberships) is configured before PIM tests run.
- Tests run against a dedicated, resettable OrangeHRM instance; the public demo resets periodically and is shared, so it is suitable only for exploratory checks.
- Default user roles (Admin, ESS) have not been modified.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- Admin module: master data and user accounts.
- Leave, Time, Performance, Claim, Recruitment and Directory modules consume PIM employee data; PIM changes must be regression-tested in those modules (for example, a terminated employee must not be able to apply for leave).

# 10. Test Automation Considerations

## 10.1 Notes for automation

- OrangeHRM 5.x is a Vue single-page application; wait for the loading spinner (".oxd-loading-spinner") to disappear and for the toast to appear rather than using fixed sleeps.
- Autocomplete fields require typing, waiting for the suggestion list (".oxd-autocomplete-dropdown") and clicking an option; typed text without selection fails validation with "Invalid".
- Drop-downs are custom components (".oxd-select-text"), not native <select>; select options by visible text from ".oxd-select-dropdown".
- Form fields have no stable ids; locate inputs relative to their label text (for example the input inside the ".oxd-input-group" whose label is "Employee Id").
- Generate unique names and Employee Ids per run (for example a timestamp suffix) so tests can run in parallel and be re-run.
- Create prerequisite data through the REST API (/web/index.php/api/v2/pim/employees) where possible to keep UI tests short, and clean up created employees after each test.
- Toast assertions should check both the title (Success/Info/Error) and the message text.

## 10.2 Test data

__Data item__

__Suggested value / source__

Admin login

Admin / admin123 on the public demo; a dedicated admin on the test instance

New employee

First Name "Auto", Last Name "Emp<timestamp>", Employee Id = last 6 digits of timestamp

Login for new employee

Username "auto.emp<timestamp>", Password "Test@1234"

Boundary names

30 and 31 character strings for First/Middle/Last Name

Photo files

valid.png (~100 KB), large.jpg (>1 MB), invalid.pdf

CSV import

Sample file from Data Import page with 3 valid rows and 1 row missing last_name

Supervisor pair

Two employees created per test: one supervisor (with ESS login), one subordinate

Pay grade

Admin-created Pay Grade with USD range 1,000–5,000

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

PIM-E2E-01

Add employee and find in list

1. Log in as Admin

2. PIM > Add Employee, enter First/Last Name, Save

3. Verify "Successfully Saved" and Personal Details page

4. Search by Employee Id in Employee List

5. Verify one matching row

PIM-FR-005, PIM-FR-001, PIM-FR-002

Smoke

PIM-E2E-02

Add employee with login and log in as ESS

1. Add employee with Create Login Details on

2. Log out

3. Log in with the new credentials

4. Verify dashboard loads and PIM menu is absent

PIM-FR-005, PIM-FR-007

Smoke

PIM-E2E-03

Mandatory and boundary validation on Add Employee

1. Save empty form, verify "Required" on First and Last Name

2. Enter 31-char name, verify length message

3. Enter existing Employee Id, verify "Employee Id already exists"

4. Enter 4-char username and mismatched passwords, verify messages

PIM-FR-005, PIM-FR-007

Regression

PIM-E2E-04

Complete employee profile end to end

1. Create employee via API

2. Update Personal, Contact, Emergency Contact, Dependent, Job and Salary tabs

3. Reload each tab

4. Verify values persisted and list row shows Job Title / Status / Sub Unit

PIM-FR-008, PIM-FR-011, PIM-FR-012, PIM-FR-013, PIM-FR-015, PIM-FR-019

Regression

PIM-E2E-05

Supervisor visibility through Report-to

1. Create supervisor (with ESS login) and subordinate

2. Assign supervisor as Direct on subordinate's Report-to

3. Log in as supervisor

4. Verify PIM lists only the subordinate

PIM-FR-021, PIM-FR-001

Regression

PIM-E2E-06

Terminate and re-activate employee

1. Terminate employee with date and reason

2. Verify absent from Current Employees Only and present in Past Employees Only

3. Activate Employment

4. Verify present in current list again

PIM-FR-017, PIM-FR-018, PIM-FR-002

Regression

PIM-E2E-07

Delete single and bulk employees

1. Create 3 employees

2. Delete one with trash icon and confirm

3. Select two and Delete Selected

4. Verify "Successfully Deleted" and none found by search

5. Verify Cancel keeps record

PIM-FR-004

Regression

PIM-E2E-08

Attachments size and lifecycle

1. Upload valid attachment and photo

2. Upload >1 MB file, verify "Attachment Size Exceeded"

3. Download attachment and compare

4. Delete attachment

PIM-FR-010, PIM-FR-006

Regression

PIM-E2E-09

Custom field appears on profile

1. Create Drop Down custom field for Personal Details

2. Open an employee, set the custom value, save

3. Reload and verify value

4. Delete the custom field and verify it disappears

PIM-FR-025, PIM-FR-009

Regression

PIM-E2E-10

CSV import creates employees

1. Upload CSV with valid and invalid rows

2. Verify imported count

3. Search imported employees in list

PIM-FR-026

Regression

PIM-E2E-11

Create and run employee report

1. Create report filtered by Job Title with Personal and Job display fields

2. Verify report output columns and rows

3. Search report by name, edit, then delete

PIM-FR-030, PIM-FR-029

Regression

PIM-E2E-12

Salary within pay grade range

1. Add salary component with Pay Grade and Amount above max

2. Verify range message

3. Correct amount and save

4. Verify row in Assigned Salary Components

PIM-FR-019

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

PIM-FR-001

Display employee list

Employee List and Search

Must

5

PIM-E2E-01, PIM-E2E-05

PIM-FR-002

Search employees by criteria

Employee List and Search

Must

7

PIM-E2E-01, PIM-E2E-06

PIM-FR-003

Sort and paginate list

Employee List and Search

Should

4

Functional test

PIM-FR-004

Delete employee (single and bulk)

Employee List and Search

Must

6

PIM-E2E-07

PIM-FR-005

Add employee with mandatory details

Add Employee

Must

6

PIM-E2E-01, PIM-E2E-02, PIM-E2E-03

PIM-FR-006

Upload profile photo

Add Employee

Should

4

PIM-E2E-08

PIM-FR-007

Create login details with employee

Add Employee

Must

5

PIM-E2E-02, PIM-E2E-03

PIM-FR-008

Edit personal details

Employee Profile: Personal Details

Must

6

PIM-E2E-04

PIM-FR-009

Custom fields on profile screens

Employee Profile: Personal Details

Should

3

PIM-E2E-09

PIM-FR-010

Manage tab attachments

Employee Profile: Personal Details

Should

5

PIM-E2E-08

PIM-FR-011

Edit contact details

Employee Profile: Contact, Emergency Contacts and Dependents

Must

5

PIM-E2E-04

PIM-FR-012

Maintain emergency contacts

Employee Profile: Contact, Emergency Contacts and Dependents

Must

3

PIM-E2E-04

PIM-FR-013

Maintain dependents

Employee Profile: Contact, Emergency Contacts and Dependents

Should

3

PIM-E2E-04

PIM-FR-014

Maintain immigration records

Employee Profile: Immigration

Should

4

Functional test

PIM-FR-015

Edit job details

Employee Profile: Job and Employment Lifecycle

Must

4

PIM-E2E-04

PIM-FR-016

Record employment contract

Employee Profile: Job and Employment Lifecycle

Could

2

Functional test

PIM-FR-017

Terminate employment

Employee Profile: Job and Employment Lifecycle

Must

4

PIM-E2E-06

PIM-FR-018

Re-activate employment

Employee Profile: Job and Employment Lifecycle

Should

2

PIM-E2E-06

PIM-FR-019

Maintain salary components

Employee Profile: Salary

Must

5

PIM-E2E-04, PIM-E2E-12

PIM-FR-020

Record direct deposit

Employee Profile: Salary

Could

2

Functional test

PIM-FR-021

Assign supervisors and subordinates

Employee Profile: Report-to

Must

5

PIM-E2E-05

PIM-FR-022

Maintain qualifications

Employee Profile: Qualifications and Memberships

Should

6

Functional test

PIM-FR-023

Maintain memberships

Employee Profile: Qualifications and Memberships

Could

3

Functional test

PIM-FR-024

Configure optional fields

PIM Configuration

Should

3

Functional test

PIM-FR-025

Define custom fields

PIM Configuration

Should

4

PIM-E2E-09

PIM-FR-026

Import employees from CSV

PIM Configuration

Should

4

PIM-E2E-10

PIM-FR-027

Maintain reporting methods

PIM Configuration

Could

3

Functional test

PIM-FR-028

Maintain termination reasons

PIM Configuration

Could

3

Functional test

PIM-FR-029

List and search reports

PIM Reports

Should

3

PIM-E2E-11

PIM-FR-030

Create and run a report

PIM Reports

Should

6

PIM-E2E-11

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

