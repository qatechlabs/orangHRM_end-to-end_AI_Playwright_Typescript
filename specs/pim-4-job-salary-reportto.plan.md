# PIM Plan 4 of 6: Job Details, Termination, Salary, Report-to, Access Control

## Application Overview

Covers PIM-UI-052..067 and PIM-UI-089..090 on OrangeHRM OS 5.9 demo (https://opensource-demo.orangehrmlive.com). Explored live as Admin on throw-away employees (last name prefix PlanAuto4: Sup = supervisor, Sub = subordinate, Job = job/termination/salary subject) plus two ESS logins (`planauto4.sup`, `planauto4.ess`, password `Plan4Auto!x9`). All employees and users were DELETED at the end (verified `nameOrId=PlanAuto4&includeEmployees=currentAndPast` total 0 and both usernames total 0). Conventions of plans 1-3 apply: UI dates are `yyyy-dd-mm` (`fill()` works, blur by clicking a neutral label before Save), REST dates are ISO `yyyy-mm-dd`, toasts read as `Success\n\n<msg>\n\n×`, list tables refresh 1-2 s after the toast (wait for the row, not a timeout), dialogs `.oxd-dialog-container-default`.

IMPORTANT environment finding: the shared demo was RESET about 3 minutes into the session (all my employees vanished, empNumbers restarted at 178, and master data changed: job title `QmvlMYRbFi` with a specification attachment, pay grades `Grade swarmm3`/`Liaison`/`QA swarmm0 grade`/`QIbOO`, employment statuses `apprenticeship`/`dgrYJaAMkY`, locations `iAQvPaeWrd`, termination reason lists etc. disappeared). Tests must therefore create their own data in the test itself, never depend on empNumbers or on master data that is not part of the stable OrangeHRM seed (see Master data used), and must tolerate a 401 (re-login) mid-run.

Session note: the MCP backend has no tab tool, so I switched identities in the single tab with `context.clearCookies()` + a fresh login (Admin -> planauto4.ess -> planauto4.sup -> Admin). In the framework use `guestSession`/a fresh context per ESS user, never touching the Admin storage state.

Profile URLs (empNumber n, base `/web/index.php`): Job `/pim/viewJobDetails/empNumber/n`, Salary `/pim/viewSalaryList/empNumber/n`, Report-to `/pim/viewReportToDetails/empNumber/n`. Tab links (role tab > link): Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships. Header `.orangehrm-edit-employee-name h6` shows `Plan PlanAuto4Job` and, once terminated, `Plan PlanAuto4Job` followed by `(Past Employee)`.

Test data set-up (API, as Admin, `fetch` inside the page or ApiClient): `POST /api/v2/pim/employees` body `{"firstName":"Plan","middleName":"","lastName":"PlanAuto4Sup","employeeId":"P4S1"}`; ESS login `POST /api/v2/admin/users` body `{"username":"planauto4.sup","password":"Plan4Auto!x9","status":true,"userRoleId":2,"empNumber":<n>}` -> 200 (userRoleId 2 = ESS). Cleanup: `DELETE /api/v2/admin/users {"ids":[..]}` then `DELETE /api/v2/pim/employees {"ids":[..]}` (user rows disappeared together with the employee in my run, but delete users first to be safe).

---

## Job Details
**Seed:** tests/seed.spec.ts

Heading `Job Details`; form (scope `.orangehrm-edit-employee-content form` first). Groups in order: `Joined Date` (date input, placeholder `yyyy-dd-mm`), `Job Title` (oxd-select), `Job Specification` (read-only: `Not Defined` as `<p>` when the title has none; with a spec: `<p class="input-container-filename">easyinfo.txt</p>` plus an icon button `.bi-download`, not an anchor), `Job Category`, `Sub Unit`, `Location`, `Employment Status` (all oxd-select, default `-- Select --`), then a switch row `Include Employment Contract Details` (click `.oxd-switch-input`; clicking the label text does NOT toggle it) and one `Save`. When the switch is on: `Contract Start Date`, `Contract End Date` (dates, `yyyy-dd-mm`) and `Contract Details` (file input `input[type=file]`, text `Browse`, `No file selected`, hint `Accepts up to 1MB`). Below the form: h6 `Employee Termination / Activiation` (sic, typo is in the app) with button `Terminate Employment`, then the `Attachments` section (`Add`, columns File Name, Description, Size, Type, Date Added, Added By, Actions).
Option lists (stable seed values): Job Title = 28 entries on the reset demo (39 before the reset), Job Category (e.g. `Professionals`, `Officials and Managers`, `Technicians`), Sub Unit (`Administration`, `Engineering`, `Development`, `Quality Assurance`, `TechOps`, `Sales & Marketing`, `Sales`, `Marketing`, `Client Services`, `Technical Support`, `Finance`, ...), Location (`HQ - CA, USA`, `New York Sales Office`, `Texas R&D`, `Canadian Regional HQ`), Employment Status (`Freelance`, `Full-Time Contract`, `Full-Time Permanent`, `Full-Time Probation`, `Part-Time Contract`, `Part-Time Internship`). Options come from the Admin master data (same names as under Admin > Job).

#### PIM-UI-052 Job details saved from master data appear in the Employee List row
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee created via API (`employeeId` `P4J1`, last name `PlanAuto4Job`). Open `/web/index.php/pim/viewJobDetails/empNumber/<n>`; wait for `getByRole('heading',{name:'Job Details'})` and for the GET calls (`job-details`, `employment-contract`) to settle.
2. For each of Job Title, Job Category, Sub Unit, Location, Employment Status: click `.oxd-input-group:has-text('<label>') .oxd-select-text`, read `getByRole('option')` (first option `-- Select --`), then pick e.g. Job Category `Professionals`, Sub Unit `Engineering`, Location `Texas R&D`, Employment Status `Full-Time Permanent`, Job Title any seed title (e.g. `QA Engineer`).
3. Fill `Joined Date` with today in `yyyy-dd-mm` (e.g. `2026-25-10` for 25 Oct 2026), click the label `Job Title`, click `Save`.
4. Open `/web/index.php/pim/viewEmployeeList`, fill the `Employee Id` group input with `P4J1`, click `Search`, wait for `(1) Record Found` and the card containing the last name.
**Expected:**
- Option lists match the master data lists above.
- Toast `Success` / `Successfully Updated`. Requests: `PUT /api/v2/pim/employees/<n>/job-details` body `{"joinedDate":"2026-10-25","jobTitleId":9,"empStatusId":3,"jobCategoryId":2,"subunitId":3,"locationId":5}` -> 200, response `{"data":{"empNumber":n,"joinedDate":"2026-10-25","jobTitle":{"id":9,"title":"QA Engineer","isDeleted":false},"jobSpecificationAttachment":{"id":null,"filename":null},"empStatus":{"id":3,"name":"Full-Time Permanent"},"jobCategory":{"id":2,"name":"Professionals"},"subunit":{"id":3,"name":"Engineering","unitId":""},"location":{"id":5,"name":"Texas R&D"},"employeeTerminationRecord":{"id":null,"date":null}},"meta":[],"rels":[]}`. When the contract switch is off only job-details is PUT (the `employment-contract` PUT is sent only when the switch is on).
- Employee List table header: `Id`, `First (& Middle) Name`, `Last Name`, `Job Title`, `Employment Status`, `Sub Unit`, `Supervisor`, `Actions`. Row text (observed with my first employee): `P4J1\nPlan\nPlanAuto4Job\nQmvlMYRbFi\nFull-Time Permanent\nEngineering` (columns: id, first, last, title, status, sub unit, supervisor blank).
- Wait for the filtered card (`.oxd-table-card` has text `PlanAuto4Job`): immediately after clicking Search the table still shows the previous unfiltered rows for ~1 s.

#### PIM-UI-053 Job Title with a specification shows the specification file as a download link
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: a Job Title with a specification attachment. None exists on the reset demo; the case allows creating it in Admin as test data (Admin > Job > Job Titles, upload spec; delete in teardown). I observed the behaviour with a pre-reset title `QmvlMYRbFi` (spec `easyinfo.txt`, text/plain, 500 bytes, spec id 1).
2. Open the Job tab of an API-created employee. Before choosing a title, `Job Specification` shows `Not Defined`.
3. Open the Job Title select and pick the title with a specification. Wait for `GET /api/v2/admin/job-titles/<id>/specification` -> 200.
4. Click the download icon button in the `Job Specification` group (`.oxd-input-group:has-text('Job Specification') button`) with `page.waitForEvent('download')`.
**Expected:**
- `Job Specification` changes from `Not Defined` to the file name (`easyinfo.txt`, `<p title='easyinfo.txt'>`) plus a download icon. It is NOT an `<a>` link (the case calls it a link); assert via the group text and the button.
- Clicking the icon downloads a file whose `suggestedFilename()` equals the spec file name (verified: `easyinfo.txt`).
- Title selection alone does not persist anything until `Save`.

#### PIM-UI-054 Employment contract end date before start date is rejected
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Job tab of an API-created employee. Click `.oxd-switch-input` (the row `Include Employment Contract Details`); wait for `Contract Start Date`.
2. Fill `Contract Start Date` `2025-10-10`, `Contract End Date` `2025-01-01`, click the label `Contract Details`, click `Save`.
3. Read `.oxd-input-field-error-message`; check network and toasts.
**Expected:**
- Exactly one message `End date should be after Start date` under Contract End Date (note the capital S in `Start`; the case text says `start`). It appears on Save; no toast; no PUT to job-details or employment-contract is sent.

#### PIM-UI-055 Contract file within 1 MB is saved and can be replaced or deleted; larger files are rejected
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Job tab; turn on the contract switch; fill `Contract Start Date` `2026-25-10` and `Contract End Date` `2027-25-10`.
2. Upload a small file: with a real file path use `page.locator('input[type=file]').setInputFiles('<path>/contract.pdf')` (in my MCP sandbox `Buffer` is undefined, so I built the file with `DataTransfer` in the page; the framework can simply use a file fixture). Click label `Contract Details`, click `Save`.
3. Reload the page (switch is on automatically when a contract exists); read the `Contract Details` group.
4. Replace: choose radio `Replace Current` (`.oxd-radio-wrapper:has-text('Replace Current') label`), set a file larger than 1 MB (1,300,000 bytes `large.pdf`); read the error; then set a small file `contract2.pdf` and `Save`.
5. Delete: choose radio `Delete Current`, click `Save`.
**Expected:**
- Step 2: toast `Success` / `Successfully Updated`. Requests: `PUT .../job-details` (as above) then `PUT /api/v2/pim/employees/<n>/employment-contract` body `{"startDate":"2026-10-25","endDate":"2027-10-25","contractAttachment":{"name":"contract.pdf","type":"application/pdf","size":500,"base64":"<..>"}}` -> 200 `{"data":{"startDate","endDate","contractAttachment":{"id":1,"filename":"contract.pdf","size":500,"fileType":"application/pdf","attachedBy":1,"attachedByName":"Admin","attachedTime":"21:27","attachedDate":"2026-10-25"}},"meta":{"empNumber":n},"rels":[]}`.
- After save the `Contract Details` group shows the file name (`contract.pdf`) and the radios `Keep Current` (default), `Delete Current`, `Replace Current`; the Browse input is hidden until `Replace Current` is picked. Dates persist (`2026-25-10`, `2027-25-10`).
- Oversize file: message `Attachment Size Exceeded` under Contract Details as soon as the file is chosen (and again after `Save`); no toast, no PUT. Hint text before choosing: `Accepts up to 1MB`.
- Replace with a valid file: toast `Successfully Updated`; PUT body `{"startDate","endDate","currentContractAttachment":"replaceCurrent","contractAttachment":{...}}`; group shows `contract2.pdf`.
- Delete Current: toast `Successfully Updated`; PUT body `{"startDate":"2026-10-25","endDate":"2027-10-25","currentContractAttachment":"deleteCurrent"}`; the group returns to `Browse` / `No file selected` / `Accepts up to 1MB`; dates are kept.

---

## Termination
**Seed:** tests/seed.spec.ts

Section h6 `Employee Termination / Activiation` on the Job tab. Active employee: button `Terminate Employment`. Dialog (`.oxd-dialog-container-default`, title `Terminate Employment`): `Termination Date` (date, placeholder `yyyy-dd-mm`, EMPTY by default, required), `Termination Reason` (oxd-select, required: `-- Select --`, `Contract Not Renewed`, `Deceased`, `Dismissed`, `Laid-off`, `Other`, `Physically Disabled/Compensated`, `Resigned`, `Resigned - Company Requested`, `Resigned - Self Proposed`, `Retired`, `Test_Termination`), `Note` (textarea), `* Required`, buttons `Cancel`, `Save`, close `×`. After a successful termination the page RELOADS by itself (about 1-2 s after the toast), the section shows text `Terminated on: 2026-25-10` and the single button `Activate Employment`, and the profile header gets `(Past Employee)`. The Job form stays editable and keeps its values.

#### PIM-UI-056 Terminate Employment records the termination and Activate Employment reverses it
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Job tab of an API-created employee; click `getByRole('button',{name:'Terminate Employment'})`; wait for the dialog.
2. Read the dialog fields. Fill `Termination Date` with today (`2026-25-10`), pick reason `Resigned`, Note `auto note`, click the label `Termination Reason` (blur), click the dialog's `Save`.
3. Wait for the toast and then for the page reload (`getByText('Terminated on')`). Read the header and the button.
4. Click `getByRole('button',{name:'Activate Employment'})`.
**Expected:**
- Dialog contains Termination Date*, Termination Reason*, Note and buttons Cancel / Save (asterisks are CSS; innerText shows `Termination Date`, `Termination Reason`, `Note`).
- Save: toast `Success` / `Successfully Updated`; `POST /api/v2/pim/employees/<n>/terminations` body `{"date":"2026-10-25","note":"auto note","terminationReasonId":6}` -> 200 `{"data":{"id":3,"note":"auto note","date":"2026-10-25","terminationReason":{"id":6,"name":"Resigned"}},"meta":{"empNumber":n},"rels":[]}` (Resigned = 6 in the seed data). After the reload: `Terminated on: 2026-25-10` (date shown in `yyyy-dd-mm`), button `Activate Employment` (no `Terminate Employment`), header `Plan PlanAuto4Job (Past Employee)`.
- Activate: toast `Success` / `Successfully Updated`; `DELETE /api/v2/pim/employees/<n>/terminations` (NO request body) -> 200 returning the removed termination record `{"data":{"id":4,"note":"api","date":"2026-10-25","terminationReason":{"id":6,"name":"Resigned"}},...}`; page reloads, `Terminated on` is gone and `Terminate Employment` is back.

#### PIM-UI-057 Terminated employee is labelled Past Employee in lists and autocompletes
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee created via API and terminated via `POST /api/v2/pim/employees/<n>/terminations {"date":"<today ISO>","note":"api","terminationReasonId":6}`.
2. Open `/web/index.php/pim/viewEmployeeList`. With the default Include = `Current Employees Only`, type `PlanAuto4Job` into `getByPlaceholder('Type for hints...').first()`.
3. Open the `Include` select (options `Current Employees Only`, `Current and Past Employees`, `Past Employees Only`), choose `Current and Past Employees`, clear and retype the name; read the suggestions (`getByRole('option',{name:/PlanAuto4Job/})`), pick the suggestion and click `Search`.
4. Choose `Past Employees Only`, `Search` again; open the row's profile.
**Expected:**
- With `Current Employees Only` the autocomplete shows only `No Records Found` (request `GET /api/v2/pim/employees?nameOrId=PlanAuto4Job&includeEmployees=onlyCurrent`). The label only appears when Include permits past employees (the case does not mention this precondition; see Discrepancies).
- With `Current and Past Employees` the suggestion text is `Plan PlanAuto4Job\n(Past Employee)` (`includeEmployees=currentAndPast`).
- The result row text is `P4J1\nPlan\nPlanAuto4Job (Past Employee)\n...` (last name cell carries ` (Past Employee)`). With `Past Employees Only` the row is listed too.
- The profile still shows the Job data that was saved before termination (Job tab fields retained, header `(Past Employee)`).

#### PIM-UI-058 Terminate dialog requires Termination Date and Reason
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Job tab; click `Terminate Employment`; do not fill anything (the date is already empty by default, so "clear the date" is a no-op).
2. Click the dialog's `Save`; read `.oxd-input-group` texts inside the dialog; check network.
**Expected:**
- `Termination Date` group -> `Required`; `Termination Reason` group -> `-- Select --` + `Required`; `Note` has no message. Dialog stays open, no toast, no POST.

---

## Salary
**Seed:** tests/seed.spec.ts

Heading h6 `Assigned Salary Components` with `Add`. For an employee with no components the card shows NO table and NO `No Records Found` in this section (the text only appears under Attachments); when rows exist the table header is `Salary Component`, `Amount`, `Currency`, `Pay Frequency`, `Direct Deposit Amount`, `Actions`. A row (`.oxd-table-card`) text: `RangeComp\n50000\nUnited States Dollar\nMonthly` (Direct Deposit Amount cell is empty without deposit; `500.00` with deposit) and buttons trash `button:has(.bi-trash)` and pencil `button:has(.bi-pencil-fill)`. `Add` opens inline form h6 `Add Salary Component` (edit: `Edit Salary Component`), fields: `Salary Component*` (text, max 100), `Pay Grade` (oxd-select: `-- Select --`, `Grade 1` .. `Grade 5`), `Pay Frequency` (select, see list below), `Currency*` (select, 160 entries incl. `-- Select --`, e.g. `United States Dollar`), `Amount*` (text), `Comments` (textarea, max 250), switch `Include Direct Deposit Details` (`.oxd-switch-input`) revealing `Account Number*`, `Account Type*` (`-- Select --`, `Savings`, `Checking`, `Other`), `Routing Number*`, `Amount*` (second group labelled Amount; locate with `.oxd-input-group` filter `hasText:'Amount'` `.last()`), `* Required`, `Cancel`, `Save`. Pay Frequency options: `-- Select --`, `Bi Weekly`, `Hourly`, `Monthly`, `Monthly on first pay of month.` (WITH trailing period), `Semi Monthly`, `Weekly` (ids: Monthly = 4). Delete dialog: `Are you Sure?` / `The selected record will be permanently deleted. Are you sure you want to continue?` with `No, Cancel`, `Yes, Delete`; toast `Successfully Deleted`.

#### PIM-UI-059 Salary component without pay grade is saved and listed in Assigned Salary Components
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/web/index.php/pim/viewSalaryList/empNumber/<n>` (wait for heading `Assigned Salary Components`); click the first `Add`; wait for heading `Add Salary Component`.
2. Open `Pay Frequency` and read the options.
3. Fill `Salary Component` `Base<unique>`, Pay Frequency `Monthly`, Currency `United States Dollar`, Amount `3000` (leave Pay Grade empty); click `Comments` (blur); click `Save`.
4. Click the pencil in the row, change Amount to `3500`, `Save`.
5. Click the trash in the row, `Yes, Delete`.
**Expected:**
- Pay Frequency options as listed above (case lists `Monthly on first pay of month` without the period; app shows the period).
- Save: toast `Success` / `Successfully Saved`; `POST /api/v2/pim/employees/<n>/salary-components` body `{"salaryComponent":"DDComp","salaryAmount":"3000","currencyId":"USD","payFrequencyId":"4","comment":null,"addDirectDeposit":false}` (no `payGradeId` key when no pay grade) -> 200; list `GET .../salary-components?limit=50&offset=0`. Row cells: component, `3000`, `United States Dollar`, `Monthly`, (deposit cell empty).
- Edit: heading `Edit Salary Component`, fields pre-filled (`GET .../salary-components/<id>`); toast `Success` / `Successfully Updated`; `PUT .../salary-components/<id>` (body as POST); row shows `3500`.
- Delete: dialog as above; `DELETE .../salary-components` body `{"ids":[<id>]}` -> 200; toast `Success` / `Successfully Deleted`; row removed (table briefly shows 0 rows while refetching; wait for the row to be hidden).

#### PIM-UI-060 Amount outside the pay grade range is rejected and a value inside it is accepted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Add Salary Component form. Select `Pay Grade` = `Grade 1` (seed pay grade, USD 50000-60000; see Master data used) and wait ~1 s for `GET /api/v2/admin/pay-grades/1/currencies?limit=0`.
2. Open `Currency`: only `-- Select --` and `United States Dollar` are listed; pick USD. Read the Amount group.
3. Fill Salary Component `RangeComp`, Pay Frequency `Monthly`. For amounts `49999` and `60001` fill Amount, click `Comments`, click `Save`; read the Amount error.
4. Fill `50000` and click `Save`; then add a second component with `60000` (API or UI).
**Expected:**
- Currency list restricted to the grade's currency; Amount group shows hint `Min: 50000 - Max: 60000` (appears under the field once grade and currency are chosen).
- Out of range (49999 and 60001): `Should be within Min/Max values` under Amount (the case text says `Should be within Min and Max range`); no POST, no toast.
- 50000 (min) and 60000 (max) are accepted: toast `Success` / `Successfully Saved`; POST body includes `"payGradeId":1,"currencyId":"USD"`; row `RangeComp 50000 United States Dollar Monthly`. API verified: 60000 -> 200.
- Boundaries are inclusive. The case's data (USD 1000-5000, pay grade created in Admin) can instead use `Grade 1` with 49999 / 60001 / 50000 / 60000, avoiding master-data creation.

#### PIM-UI-061 Salary component requires component name, currency and a numeric amount
**Seed:** tests/seed.spec.ts
**Steps:**
1. Click `Add`; click `Save` with the empty form.
2. Fill Amount `abc`, Salary Component 101 chars (`x`.repeat(101)), click `Comments`.
3. Extras: Amount `12345678901`, `-5`, `1234.56`, `1e5`; Comments 251 chars.
**Expected:**
- Step 1: `Required` under `Salary Component`, `Currency` and `Amount` (three groups; Pay Grade/Pay Frequency/Comments have no message); no POST.
- Step 2: `Should be a number` under Amount; `Should not exceed 100 characters` under Salary Component (101 chars; 100 is accepted).
- Extras: `12345678901` -> `Should be less than 1,000,000,000`; `-5` and `1e5` -> `Should be a number`; `1234.56` accepted (no message); Comments 251 chars -> `Should not exceed 250 characters`.

#### PIM-UI-062 Direct deposit fields become mandatory and numeric when the toggle is on
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Salary Component; click `form .oxd-switch-input` (`Include Direct Deposit Details`); read the new labels.
2. Fill Salary Component `DDComp`, Pay Frequency `Monthly`, Currency `United States Dollar`, Amount `3000` (first Amount group), click `Save` with the deposit fields empty.
3. Fill Routing Number `abc` and the deposit Amount `xyz`; click `Salary Component`.
4. Fill Account Number `ACC123`, Account Type `Savings`, Routing Number `123456789`, deposit Amount `500`; `Save`.
**Expected:**
- New fields: `Account Number`, `Account Type` (`-- Select --`, `Savings`, `Checking`, `Other`), `Routing Number`, `Amount`.
- Step 2: `Required` under Account Number, Account Type, Routing Number and the deposit Amount; no POST.
- Step 3: `Should be a number` under Routing Number and under the deposit Amount (Account Type keeps `Required`). A 51-char Account Number showed no message (limit not found).
- Step 4: toast `Success` / `Successfully Saved`; `POST .../salary-components` body `{"salaryComponent":"DDComp","salaryAmount":"3000","currencyId":"USD","payFrequencyId":"4","comment":null,"addDirectDeposit":true,"directDepositAccount":"ACC123","directDepositAccountType":"SAVINGS","directDepositAmount":"500","directDepositRoutingNumber":"123456789"}`; row `DDComp 3000 United States Dollar Monthly 500.00` (Direct Deposit Amount cell formatted with two decimals). Edit form shows deposit toggle on with the values (Amount `500.00`).

---

## Report-to
**Seed:** tests/seed.spec.ts

Heading `Report to`; three cards: `Assigned Supervisors` (`Add`), `Assigned Subordinates` (`Add`), `Attachments` (`Add`). Each of the first two shows `(n) Record Found` or `No Records Found`, and a table with columns `Name`, `Reporting Method`, `Actions`; row `Plan PlanAuto4Sup\nDirect` with trash and pencil buttons. The 1st `Add` (`getByRole('button',{name:'Add'}).first()`) opens h6 `Add Supervisor`, the 2nd (`.nth(1)`) opens h6 `Add Subordinate`. The inline form has `Name*` (autocomplete input, placeholder `Type for hints...`), `Reporting Method*` (select: `-- Select --`, `Direct`, `Indirect`, `Test_Reporting`; the third is non-seed junk, use `Direct`/`Indirect` with `getByRole('option',{name:'Direct',exact:true})` because `Direct` also matches `Indirect`), `* Required`, `Cancel`, `Save`. The autocomplete calls `GET /api/v2/pim/employees/<n>/report-to/allowed?nameOrId=<text>` (returns only employees that are allowed: not the employee, not already linked); suggestions are `div[role=option]` inside `.oxd-autocomplete-dropdown` with text `Plan PlanAuto4Sup`. While a save/refetch is in flight `.oxd-form-loader` overlays the form: wait for it before clicking the select again. On success the form closes and the row appears after the toast.

#### PIM-UI-063 Assigning a supervisor shows the relation on both employees and in the Supervisor column
**Seed:** tests/seed.spec.ts
**Steps:**
1. Preconditions: supervisor `PlanAuto4Sup` (Employee Id `P4S1`) and subordinate `PlanAuto4Sub` (`P4B1`) created via API.
2. Open `/web/index.php/pim/viewReportToDetails/empNumber/<sub>`; click the first `Add`; read heading, `Name` and `Reporting Method` options.
3. Type `PlanAuto4Su` in Name, click the suggestion `Plan PlanAuto4Sup`, choose method `Direct`, click `Save`.
4. Open `/web/index.php/pim/viewReportToDetails/empNumber/<sup>`.
5. Open `/web/index.php/pim/viewEmployeeList`, fill `Employee Id` `P4B1`, `Search`.
**Expected:**
- Heading `Add Supervisor`; Name placeholder `Type for hints...`; methods `Direct`, `Indirect` (+ `Test_Reporting` junk).
- Toast `Success` / `Successfully Saved` (toast text read from the subordinate-side add, same component). `POST /api/v2/pim/employees/<sub>/supervisors` body `{"empNumber":<supEmpNumber>,"reportingMethodId":1}` (Direct = 1, Indirect = 2) -> 200; list `GET .../supervisors?limit=50&offset=0` -> `{"data":[{"supervisor":{"empNumber","firstName":"Plan","lastName":"PlanAuto4Sup","middleName":"","terminationId":null},"reportingMethod":{"id":1,"name":"Direct"}}],"meta":{"empNumber":<sub>,"total":1},"rels":[]}`. The card shows `(1) Record Found` and row `Plan PlanAuto4Sup\nDirect`.
- Supervisor's Report-to tab: `Assigned Subordinates` shows `(1) Record Found` and row `Plan PlanAuto4Sub\nDirect` (`GET .../subordinates?limit=50&offset=0` -> `{"data":[{"subordinate":{...},"reportingMethod":{...}}],"meta":{"empNumber","total":1}}`).
- Employee List row for `P4B1`: `P4B1\nPlan\nPlanAuto4Sub\n...\nPlan PlanAuto4Sup` (Supervisor is the last column before Actions). Adding from the supervisor side works the same: `POST .../<sup>/subordinates` body `{"empNumber":<subEmpNumber>,"reportingMethodId":1}` -> 200 (toast `Successfully Saved`).

#### PIM-UI-064 An employee cannot be assigned as their own supervisor or subordinate
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Report-to tab of `PlanAuto4Sub`; first `Add`; type `PlanAuto4Sub` (own name) in Name; wait ~2 s; read the dropdown.
2. Choose method `Direct` and click `Save`; read the Name group.
3. On the same tab (or the supervisor's) click the second `Add` (Assigned Subordinates) and repeat with the employee's own name.
**Expected:**
- The employee is not offered: dropdown shows `No Records Found` (`.../report-to/allowed?nameOrId=PlanAuto4Sub` excludes self); the typed text stays free text.
- `Save` shows `Invalid` under Name (Reporting Method keeps `Direct`, no `Required`); no POST, no toast. Same in `Assigned Subordinates`: own name -> `No Records Found`, then `Invalid`.
- NOTE server side: the API itself does not enforce this (`POST /pim/employees/179/supervisors {"empNumber":179,"reportingMethodId":1}` -> 200 created a self relation; I removed it). Only the UI blocks self-assignment; do not use the API for the negative test.

#### PIM-UI-065 The same supervisor cannot be assigned twice to one employee
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: relation created via `POST /api/v2/pim/employees/<sub>/supervisors {"empNumber":<sup>,"reportingMethodId":1}` (200).
2. Open the subordinate's Report-to tab, click the first `Add`, type `PlanAuto4Su` and `PlanAuto4Sup`; wait ~2 s; read the dropdown.
**Expected:**
- The supervisor is no longer offered: dropdown `No Records Found` for both queries; the card still has exactly one row. The UI prevents the duplicate; saving cannot be reached.
- Server side is weaker: `POST .../supervisors` with the same supervisor and a different method (`reportingMethodId:2`) returned 200 and created a second row (`Plan PlanAuto4Sup / Indirect`); the same supervisor with the same method returns 500 `{"error":{"status":"500","message":"Unexpected Error Occurred"}}`. Deleting via UI/API (`DELETE .../supervisors {"ids":[<supEmpNumber>]}` -> 200 `{"data":["<sup>"],...}`) removes all methods for that supervisor at once. Do not assert uniqueness through the API (BRD item PIM-FR-021-AC3 only holds in the UI).

#### PIM-UI-066 Report-to requires an employee picked from autocomplete and a reporting method
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open any employee's Report-to tab, first `Add`, click `Save` with an empty form.
2. Type `zzzNoSuchPerson` in Name (do not pick anything; dropdown shows `No Records Found`), click the label `Reporting Method`, leave the method empty, click `Save`.
**Expected:**
- Step 1: `Required` under Name and `Required` under Reporting Method.
- Step 2: `Invalid` under Name (free text), `Required` under Reporting Method; no POST, no toast.

#### PIM-UI-067 Supervisor sees only subordinates in PIM, and loses visibility when the relation is removed
**Seed:** tests/seed.spec.ts
**Steps:**
1. Preconditions: supervisor with ESS login (`userRoleId` 2) and a subordinate with relation Direct, created via API.
2. In a guest context log in at `/web/index.php/auth/login` with `planauto4.sup` and wait for the dashboard. Read the side menu and click `PIM`.
3. Read the top bar and the list.
4. As Admin: `DELETE /api/v2/pim/employees/<sub>/supervisors {"ids":[<supEmpNumber>]}` -> 200. In the supervisor context (fresh login; I did not test an in-place reload of the old session) open the dashboard side menu and `/web/index.php/pim/viewEmployeeList`.
**Expected:**
- Side menu for the supervisor, in order: `PIM` (first), `Leave`, `Time`, `My Info`, `Performance`, `Dashboard`, `Directory`, `Claim`, `Buzz` (no Admin, Recruitment, Maintenance). `PIM` href `/web/index.php/pim/viewPimModule` lands on `/pim/viewEmployeeList`.
- Top bar has only the tab `Employee List` (no Configuration, Add Employee, Reports). The filter bar reads `Employee Name`, `Employee Id`, `Employment Status`, `Include` (`Current Employees Only`), `Supervisor Name`, `Job Title`, `Sub Unit`. Result `(1) Record Found`: `P4B1\nPlan\nPlanAuto4Sub\nQA Engineer\nFull-Time Permanent\nEngineering\nPlan PlanAuto4Sup` (only the subordinate, Supervisor column shows the supervisor).
- After the relation is removed: the side menu has NO `PIM` item (`Leave, Time, My Info, Performance, Dashboard, Directory, Claim, Buzz`); `/pim/viewEmployeeList` returns HTTP 403 and shows `Credential Required`; the former subordinate's `/pim/viewPersonalDetails/empNumber/<sub>` shows `No Records Found`.

---

## Access Control
**Seed:** tests/seed.spec.ts

ESS user = role ESS with no subordinates (`planauto4.ess`, employee `PlanAuto4Job`); Supervisor = ESS with at least one subordinate. For an ESS user the page body renders inside the normal layout: top bar title `PIM`, text `Credential Required` (HTTP 403) when the module page is denied; for another employee's data pages the layout loads with `No Records Found` (HTTP 200).

#### PIM-UI-089 ESS user has no PIM menu and is denied direct PIM URLs
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: ESS user without subordinates created via API. In a guest context log in with `planauto4.ess` / `Plan4Auto!x9`; wait for `/dashboard/index` and the side menu.
2. Read all side-menu links (`.oxd-sidepanel-body a`).
3. Navigate directly (with `waitUntil: 'load'`, capturing the main-frame response status) to `/web/index.php/pim/viewEmployeeList`, `/pim/addEmployee`, `/pim/viewOptionalFields`, `/pim/viewDefinedPredefinedReports`, `/pim/viewPimModule`, `/pim/configurePim`, `/pim/viewPersonalDetails/empNumber/<otherEmp>`, `/pim/viewJobDetails/empNumber/<otherEmp>`, `/pim/viewSalaryList/empNumber/<otherEmp>`, `/pim/viewReportToDetails/empNumber/<otherEmp>`.
**Expected:**
- Side menu: `Leave`, `Time`, `My Info` (`/web/index.php/pim/viewMyDetails`), `Performance`, `Dashboard`, `Directory`, `Claim`, `Buzz`. No `PIM`, `Admin`, `Recruitment`, `Maintenance`.
- `/pim/viewEmployeeList`, `/pim/addEmployee`, `/pim/viewDefinedPredefinedReports`, `/pim/configurePim`: HTTP 403, URL unchanged, content `Credential Required` (body also shows the layout with the sidebar; no PIM data, no table).
- `/pim/viewOptionalFields`: HTTP 404 (Chrome error page `HTTP ERROR 404`, `page.goto` rejects with ERR_HTTP_RESPONSE_CODE_FAILURE). This URL listed in the case does not exist in OrangeHRM 5.9; the real page is `/pim/configurePim` (403 for ESS). Use `/pim/configurePim` for the assertion.
- `/pim/viewPimModule` redirects (200) to the user's own `/pim/viewPersonalDetails/empNumber/<ownEmpNumber>` (same as My Info), and `/pim/viewMyDetails` too.
- Another employee's profile URLs (`viewPersonalDetails`, `viewJobDetails`, `viewSalaryList`, `viewReportToDetails` with `<otherEmp>`) return HTTP 200 but only `No Records Found` (no tabs, no employee data); the underlying API returns `422 {"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":["empNumber"]}}}` for `GET /api/v2/pim/employees/<other>/personal-details|job-details|salary-components`, and `GET /api/v2/pim/employees` -> `{"data":[],"meta":{"total":0}}`.
- An ESS user can read their OWN salary components via the API (`GET /pim/employees/<own>/salary-components` -> 200); not part of the case, noted for the security review.

#### PIM-UI-090 Supervisor sees subordinate Job and Report-to read-only and cannot edit Salary
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: supervisor with ESS login and a Direct subordinate (job details set via `PUT /pim/employees/<sub>/job-details` and one salary component via `POST .../salary-components`). Log in as `planauto4.sup` in a guest context.
2. Open `/web/index.php/pim/viewJobDetails/empNumber/<sub>`; read tabs, buttons and inputs.
3. Open `/pim/viewSalaryList/empNumber/<sub>`.
4. Open `/pim/viewReportToDetails/empNumber/<sub>`.
5. Open `/pim/viewPersonalDetails/empNumber/<sub>`.
6. Open `/pim/addEmployee` and the profile of an unrelated employee.
**Expected:**
- Tab list for the supervisor on the subordinate: Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Report-to, Qualifications, Memberships (there is NO `Salary` tab).
- Job tab: heading `Job Details`; values shown (Job Title `QA Engineer`, Job Specification `Not Defined`, Job Category `Professionals`, Sub Unit `Engineering`, Location `Texas R&D`, Employment Status `Full-Time Permanent`); fields disabled; zero buttons inside `.orangehrm-edit-employee-content` (no `Save`, no `Terminate Employment`, no attachment `Add`); the `Include Employment Contract Details` switch is disabled.
- Salary URL: HTTP 403, content `Credential Required` (no `Add`, no table).
- Report-to tab: shows `Assigned Supervisors (1) Record Found` with `Plan PlanAuto4Sup / Direct` and `Assigned Subordinates No Records Found`; zero `Add` buttons, zero trash/pencil icons.
- Personal Details: editable, 12 input/textarea elements, two `Save` buttons (main form and Custom Fields) and an Attachments `Add` button; saving personal data is allowed (not saved in the exploration; a save with `PUT /pim/employees/<sub>/personal-details` as supervisor was not run).
- `/pim/addEmployee` -> 403 `Credential Required`; an unrelated employee's profile -> `No Records Found`.

---

## Observed API calls
(base `/web/index.php/api/v2`; JSON; session cookie)
- Job: `GET /pim/employees/<n>/job-details`, `PUT /pim/employees/<n>/job-details` body `{"joinedDate":"yyyy-mm-dd"|null,"jobTitleId","empStatusId","jobCategoryId","subunitId","locationId"}` -> 200 (shape in PIM-UI-052). `GET /pim/employees/<n>/employment-contract`; `PUT /pim/employees/<n>/employment-contract` body `{"startDate","endDate","contractAttachment":{"name","type","size","base64"}}`, add `"currentContractAttachment":"replaceCurrent"|"deleteCurrent"` (omit for keep); response `{"data":{"startDate","endDate","contractAttachment":{"id","filename","size","fileType","attachedBy","attachedByName","attachedTime","attachedDate"}},"meta":{"empNumber":n}}`. `GET /admin/job-titles/<id>/specification` (spec download). Screen helpers on page load: `GET /pim/employees/<n>`, `/pim/employees/<n>/custom-fields?screen=job|salary|...`, `/pim/employees/<n>/screen/job|salary|.../attachments?limit=50&offset=0`, `/leave/workweek`, `/leave/holidays`.
- Termination: `POST /pim/employees/<n>/terminations` body `{"date":"yyyy-mm-dd","note":"..","terminationReasonId":6}` -> 200 `{"data":{"id","note","date","terminationReason":{"id","name"}},"meta":{"empNumber":n}}`; `DELETE /pim/employees/<n>/terminations` (no body) -> 200 with the removed record. `GET /pim/termination-reasons?limit=100` feeds the dialog select (Resigned = 6). Employee list filters: `GET /pim/employees?nameOrId=<t>&includeEmployees=onlyCurrent|currentAndPast|onlyPast`.
- Salary: `GET|POST /pim/employees/<n>/salary-components` (`?limit=50&offset=0`), `GET|PUT .../salary-components/<id>`, `DELETE .../salary-components` body `{"ids":[..]}` -> 200 `{"data":["<id>"]}`. POST body `{"salaryComponent","salaryAmount":"3000","payGradeId":1 (omit/null if none),"currencyId":"USD","payFrequencyId":"4","comment":null,"addDirectDeposit":false}` plus when true `"directDepositAccount","directDepositAccountType":"SAVINGS|CHECKING|OTHER","directDepositRoutingNumber","directDepositAmount"`. Response/list item `{"id","amount":"50000","salaryName","comment","payPeriod":{"id":"4","name":"Monthly"},"payGrade":{"id":1,"name":"Grade 1"}|{"id":null,"name":null},"currencyType":{"id":"USD","name":"United States Dollar"},"directDebit":{"id","routingNumber","account","amount":"500.00","accountType"}}`. Pay frequency ids seen: Monthly 4.
- Salary error shapes: out of range (49999 / 60001 with pay grade 1/USD) -> **400** `{"error":{"status":"400","message":"Salary should be within min and max"}}` (not 422); currency not defined in the grade (`INR` with Grade 1) -> same 400; empty `salaryComponent` -> 422 `{"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":["salaryComponent"]}}}`; `salaryAmount:"abc"` -> 422 `["salaryAmount"]`; `addDirectDeposit:true` without deposit fields -> 422 `["directDepositAccount","directDepositAccountType","directDepositRoutingNumber","directDepositAmount"]` (all keys listed); 60000 (max) -> 200; no pay grade -> 200 with `payGrade` nulls.
- Pay grades (read-only): `GET /admin/pay-grades?limit=100&offset=0` -> `{"data":[{"id":1,"name":"Grade 1","currencies":[{"name":"United States Dollar","id":"USD"}]},...]}`; `GET /admin/pay-grades/<id>/currencies` (the UI calls it with `?limit=0`) -> `{"data":[{"minSalary":50000,"maxSalary":60000,"currencyType":{"id":"USD","name":"United States Dollar"}}],"meta":{"payGradeId":1,"total":1}}`.
- Report-to: `GET|POST /pim/employees/<n>/supervisors`, `GET|POST /pim/employees/<n>/subordinates` (`?limit=50&offset=0`), body `{"empNumber":<other>,"reportingMethodId":1|2}`; response `{"data":{"supervisor"|"subordinate":{"empNumber","firstName","lastName","middleName","terminationId"},"reportingMethod":{"id","name"}}}`; `DELETE .../supervisors` and `.../subordinates` body `{"ids":[<otherEmpNumber>]}` (removes all methods for that person). Autocomplete: `GET /pim/employees/<n>/report-to/allowed?nameOrId=<t>`. Errors: missing `reportingMethodId` -> 422 `["reportingMethodId"]`; unknown method id or unknown empNumber -> 500 `{"error":{"status":"500","message":"Unexpected Error Occurred"}}`; same supervisor+method twice -> 500; self assignment, A-supervises-B-and-B-supervises-A, and the same supervisor with another method are all accepted (200). There is no 422 for self-assignment or duplicates (so PIM-API-014/017 should assert: UI blocks, API does not; mark as `test.fail()` with an issue annotation if the API case expects 422).
- Admin helpers: `POST /admin/users` (ESS login), `DELETE /admin/users {"ids":[..]}`, `GET /admin/job-titles?limit=100` (items carry `jobSpecification:{id,filename,fileType,fileSize}`), `GET /admin/employment-statuses`, `/admin/job-categories`, `/admin/locations`, `/admin/subunits?mode=list`.
- Cleanup: `DELETE /pim/employees {"ids":[178,179,180]}` -> 200 `{"data":["178","179","180"]}`.

## Locators
- Tabs/header: `getByRole('tab')` > `getByRole('link',{name:'Job'|'Salary'|'Report-to'})`; content scope `.orangehrm-edit-employee-content`; form scope `.orangehrm-edit-employee-content form` (`.first()` is the Add/edit form; on Report-to there is one form at a time).
- Group helper: `page.locator('.oxd-input-group',{hasText:'<Label>'}).first()`; select `.oxd-select-text`; input `input`; textarea `textarea`; error `.oxd-input-field-error-message`. Caution on Salary: `hasText:'Amount'` matches both Amount groups (salary amount is `.first()`, deposit amount is `.last()` when the deposit switch is on); `hasText:'Account'`, `'Routing Number'` are unique. On Job: `hasText:'Job Title'` also matches `Job Specification`? (`Job Title` vs `Job Specification` are distinct) but `hasText:'Job'` is not unique.
- Switches: `form .oxd-switch-input` (Job contract toggle, Salary direct deposit); contract file input `input[type=file]`; contract radios `.oxd-radio-wrapper:has-text('Keep Current'|'Delete Current'|'Replace Current') label`.
- Job spec download: `.oxd-input-group:has-text('Job Specification') button` (download icon) with `page.waitForEvent('download')`.
- Termination: `getByRole('button',{name:'Terminate Employment'})`, dialog `.oxd-dialog-container-default` (date `dialog.locator('input').first()`, reason `dialog.locator('.oxd-select-text')`, note `dialog.locator('textarea')`, `dialog.getByRole('button',{name:'Save'})`), `getByText('Terminated on')`, `getByRole('button',{name:'Activate Employment'})`, header `(Past Employee)` text. After save/activate the page reloads (wait for the heading `Job Details` again).
- Tables: `.oxd-table-card`, header `.oxd-table-header`, row buttons `button:has(.bi-trash)` / `button:has(.bi-pencil-fill)`, delete dialog buttons `getByRole('button',{name:'Yes, Delete'})`, `No, Cancel`; toast `.oxd-toast` (`waitFor()` right after clicking). Record counters `getByText('(1) Record Found')`.
- Report-to: `Add` buttons by index (`first()` supervisors, `nth(1)` subordinates, `nth(2)` attachments), name input `form.getByPlaceholder('Type for hints...')`, suggestions `.oxd-autocomplete-dropdown` / `getByRole('option',{name:'Plan PlanAuto4Sup'})`, method `form.locator('.oxd-select-text')`; wait for `.oxd-form-loader` to disappear after saving before reopening a select.
- Employee list: `Employee Id` group input, `getByRole('button',{name:'Search'})`, `Include` group select (`Current Employees Only`, `Current and Past Employees`, `Past Employees Only`), name autocomplete `getByPlaceholder('Type for hints...').first()`.
- Login (guest): `getByPlaceholder('Username')`, `getByPlaceholder('Password')`, `getByRole('button',{name:'Login'})`; side menu `.oxd-sidepanel-body a`; denial text `getByText('Credential Required')`.

## Master data used
- Job Title: `QA Engineer` (id 9, no specification) for PIM-UI-052 and the supervisor view; any seed title works. Job Category `Professionals` (2), Sub Unit `Engineering` (3), Location `Texas R&D` (5), Employment Status `Full-Time Permanent` (3). All are stable OrangeHRM seed values and were present both before and after the demo reset.
- Job title with a specification: NONE after the reset. During the first 3 minutes the demo had title `QmvlMYRbFi` (id 42, spec `easyinfo.txt`, text/plain, 500 bytes), which belongs to another user and disappeared. PIM-UI-053 needs the test to create (and delete) its own title with a spec via Admin > Job > Job Titles (the case allows it); I did not create it (no master-data writes during exploration), and the exact REST call for uploading the spec was not recorded.
- Pay grade for PIM-UI-060 and PIM-API-016: `Grade 1` (id 1) USD min 50000 / max 60000 (also `Grade 2` 40000-50000, `Grade 3` 30000-40000, `Grade 4` 20000-30000, `Grade 5` 10000-20000, all USD). Pre-reset extra grade `QIbOO` (INR 14138-807819) is not stable. Pay grade `Grade 1` through `Grade 5` were present before and after the reset.
- Termination reason: `Resigned` (id 6). Reporting methods: `Direct` (1), `Indirect` (2); `Test_Reporting` is junk data from another user, avoid it.
- Currency `United States Dollar` (`USD`); pay frequency `Monthly` (id 4).
- Nothing in master data was created, edited or deleted.

## Discrepancies
1. PIM-UI-054: message is `End date should be after Start date` (capital S); case text says `End date should be after start date`.
2. PIM-UI-053: Job Specification is a file-name paragraph with a download icon button, not a hyperlink; the case wording "shown as a link" is not literal. No job title with a spec exists on the (reset) demo, so the test must create one (needs the Admin job-title spec upload call, not recorded). Download itself works (file name preserved).
3. PIM-UI-055: the Replace/Delete options are radios `Keep Current` / `Delete Current` / `Replace Current` shown on the Job tab itself (no separate edit mode). The oversize message `Attachment Size Exceeded` matches. In this sandbox `setInputFiles` with a Buffer failed (`Buffer is not defined` in run_code); I used DataTransfer. The 1 MB limit boundary (exactly 1,048,576 bytes) was not probed; 500 and 300 bytes accepted, 1,300,000 rejected.
4. PIM-UI-056/058: `Termination Date` is empty by default (not prefilled with today), so "clear the date" is a no-op; the section heading has a typo (`Employee Termination / Activiation`); the page reloads automatically after terminate/activate (the Job form values were retained in both states).
5. PIM-UI-057: the `(Past Employee)` label appears in the Employee Name autocomplete only when Include is `Current and Past Employees` (or Past); with the default Include the autocomplete returns `No Records Found`. The case steps ("Type the employee name in the Employee Name autocomplete -> Suggestion shows (Past Employee)") fail with the default filter. Also the employee list row shows the label in the Last Name cell (`PlanAuto4Job (Past Employee)`).
6. PIM-UI-059: Pay Frequency option text is `Monthly on first pay of month.` (with trailing period); the case lists it without. Salary list has no `No Records Found` text when empty (only Attachments has it). Create-toast `Successfully Saved`, update `Successfully Updated`.
7. PIM-UI-060: out-of-range message is `Should be within Min/Max values`, not `Should be within Min and Max range`; the hint reads `Min: 50000 - Max: 60000` (not `USD 1000-5000`). Case precondition (pay grade created in Admin) can be replaced by `Grade 1`. API returns 400 `Salary should be within min and max` (not 422) for out-of-range.
8. PIM-UI-061: besides the case messages, `Should be less than 1,000,000,000` appears for very large amounts and negative / exponent values give `Should be a number` (decimals are accepted).
9. PIM-UI-062: Account Type options are `Savings`, `Checking`, `Other` (case lists none); Account Number maximum length not found (51 chars accepted without message); Routing Number `abc` -> `Should be a number` verified, deposit Amount `xyz` -> `Should be a number` verified. The saved row shows `500.00`.
10. PIM-UI-064/065 (and PIM-API-014/017): the self-assignment and duplicate prevention exists only in the UI (autocomplete filters, `Invalid` on free text). The REST API accepted a self relation, a cyclic relation (A supervises B and B supervises A) and the same supervisor with a second reporting method (200); same supervisor + same method gives an unhandled 500, bad ids give 500. If PIM-API-014/017 expect 422 for these they will fail; record as defects (`test.fail()` with an issue annotation). I created and removed such rows on throw-away employees only.
11. PIM-UI-067: after the relation is deleted the PIM menu disappears entirely (fresh login) and `/pim/viewEmployeeList` gives HTTP 403 `Credential Required`; the case allows "No Records Found or PIM menu absent". Whether an already-open supervisor session shows the change on reload without re-login was not verified (I re-logged in).
12. PIM-UI-089: `/pim/viewOptionalFields` does not exist in 5.9 (HTTP 404 browser error, not "Credential Required"); `/pim/configurePim` is the real route (403). Access denial is HTTP 403 with the visible text `Credential Required` for list/add/reports/config; `/pim/viewPimModule` redirects an ESS user to their own profile; other employees' profile URLs return 200 with `No Records Found`, not `Credential Required`.
13. PIM-UI-090: the supervisor does not get a read-only Salary tab; the Salary tab is absent and the direct URL returns 403 `Credential Required`. Job and Report-to are read-only (no buttons at all); Personal Details is editable (Save buttons present); the actual personal-data save by a supervisor was not run.
14. Not verified: the Report-to toast text for adding a supervisor from the subordinate side (I read it only for the subordinate add: `Successfully Saved`; same component), Employee List Supervisor-filter behaviours, a supervisor's own Salary tab, supervisor/subordinate chains deeper than one level, Direct/Indirect row ordering, the maximum Account Number length, attachments on these tabs (Add buttons exist, uploads not exercised), and the Admin job-title spec upload endpoint.
15. Demo volatility (see overview): the demo reset mid-run wiped data; a 401 from `/api/v2/...` appears when the session is invalidated. Record `empNumber` from the create response, never hard-code it, and recreate preconditions inside each test.
16. Deviation from the brief: I created the ESS logins with `POST /api/v2/admin/users` instead of the Add Employee wizard, and switched identities in a single tab by clearing cookies (no tab tool available) rather than a NEW TAB; the Admin session was restored by logging in again.


## Test Scenarios
