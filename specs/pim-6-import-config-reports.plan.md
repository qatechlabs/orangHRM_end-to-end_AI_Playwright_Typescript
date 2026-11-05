# PIM Plan 6 of 6: Data Import, Configuration Lists, Reports, Config and Access Control API

## Application Overview

# PIM Plan 6 of 6: Data Import, Configuration Lists, Reports, Configuration API, Access Control API

## Application Overview

Covers PIM-UI-081..088 and PIM-API-018..020 on OrangeHRM OS 5.9 demo (https://opensource-demo.orangehrmlive.com), base path `/web/index.php`. Explored live as Admin with throw-away data prefixed `PlanAuto6`: 3 employees imported from CSV (PlanAuto6One/Two/Three), reporting method `PlanAuto6 Method`, termination reason `PlanAuto6 Reason`, report `PlanAuto6 Report`, ESS user `planauto6.ess` (password `Plan6Auto!x9`). Everything was DELETED at the end and verified: `GET /pim/employees?nameOrId=PlanAuto6&includeEmployees=currentAndPast` total 0, users `planauto6` total 0, reporting methods = Direct, Indirect, Test_Reporting, termination reasons = the 11 original entries, reports = 5 original (ids 5,6,7,8 and a foreign `irCflCUPbA` id 10), optional-field unchanged (all four flags false). Admin session restored by clearCookies + fresh login `Admin / admin123`.

Conventions from plans 1-4 apply: toasts read `Success\n\n<msg>\n\n×` (errors `Error\n\n<msg>\n\n×`, warnings `Warning\n\n<msg>\n\n×`); wait for the toast (`.oxd-toast`, use `.first()`: two toasts can coexist) and for the table row, never a fixed timeout; validation messages (`.oxd-input-field-error-message`) appear asynchronously after Save or blur, so wait for the message (`.first().waitFor()`) before reading, otherwise you read an empty list (I got `[]` twice by reading too early); delete dialog `.oxd-dialog-container-default` with `Are you Sure?` / `The selected record will be permanently deleted. Are you sure you want to continue?` / `No, Cancel` / `Yes, Delete`; tables refresh 1-2 s after the toast (wait for the row to be hidden/detached). The shared demo is volatile (see plan 4): create own data inside each test and tolerate other users' rows (e.g. a foreign report `irCflCUPbA` appeared in the Reports list during my session, so the Reports count was 4 and later 5; never assert exact "(4) Records Found").

IMPORTANT WARNING FOR API TESTS: I probed `POST /pim/reporting-methods` and `POST /pim/reports/defined` with blank/duplicate/over-long names and they were ACCEPTED (200), creating junk rows I had to delete (ids 5,6,7 reporting methods, ids 12,13,14 reports; all deleted by id). Every negative API test that may succeed unexpectedly must register the returned id for cleanup in a `finally`/fixture teardown, and must use names prefixed with the test's own unique name. Never send duplicate-of-seed names ("Direct", "PIM Sample Report") without cleanup.

Screens (all under `/web/index.php/pim/`):
- Data Import: `pimCsvImport` (top bar Configuration menu > Data Import).
- Reporting Methods: list `viewReportingMethods`, add `saveReportingMethod`, edit `saveReportingMethod/<id>`.
- Termination Reasons: list `viewTerminationReasons`, add `saveTerminationReasons`, edit `saveTerminationReasons/<id>`.
- Reports: list `viewDefinedPredefinedReports`, add `definePredefinedReport`, edit `definePredefinedReport/<id>`, run `displayPredefinedReport/<id>` (the app also redirects here after a successful save).
- Top bar tabs for Admin: `Configuration` (drop-down), `Employee List`, `Add Employee`, `Reports`. Page headings are `<p>`/`<h6>` text, not always role `heading`: use `getByText('Edit Reporting Method')` etc. Note: `getByRole('heading', {name:'Edit Reporting Method'})` timed out.

---

## Data Import
**Seed:** tests/seed.spec.ts

Screen `/pim/pimCsvImport`. Content (innerText): `Data Import`, `Note:`, `Column order should not be changed`, `First Name and Last Name are compulsory`, `All date fields should be in YYYY-MM-DD format`, `If gender is specified, value should be either Male or Female`, `Each import file should be configured for 100 records or less`, `Multiple import files may be required`, `Sample CSV file : Download`, then the file field `Select File` / `Browse` / `No file selected` / hint `Accepts up to 1MB`, `* Required`, button `Upload`. The `Download` link is an `<a href="#">` (JS-driven) that triggers a file download `importData.csv` from `GET /web/index.php/pim/sampleCsvDownload`. Capture with `page.waitForEvent('download')` + `getByRole('link',{name:'Download'}).click()`; `download.suggestedFilename()` is `importData.csv`.

#### PIM-UI-081 CSV import creates valid rows, reports the imported count and skips invalid rows
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/web/index.php/pim/pimCsvImport`. Read the note list and verify the `Download` link. Download the sample and compare its header to the `## Sample CSV header` section.
2. Build the CSV in the test (not stored): header row exactly as in `## Sample CSV header`, then 4 data rows with unique names `PlanAuto6<unique>A/B/C/D`:
   - row 2: first_name `PlanAuto6A`, last_name `PlanAuto6One`, gender `Male`, date_of_birth `1990-05-12`, address_street_1 `1 Main St`, city `Austin`, state/province `TX`, zip/postal_code `73301`, country `United States` (other cells empty)
   - row 3: `PlanAuto6B`, last `PlanAuto6Two`, gender `Female`
   - row 4: `PlanAuto6C`, last `PlanAuto6Three`
   - row 5: first_name `PlanAuto6D` and EMPTY last_name (22 comma-separated cells, the invalid row).
   Set it with `page.locator('input[type=file]').setInputFiles({name:'import-planauto6.csv',mimeType:'text/csv',buffer:Buffer.from(csv)})` (in the MCP sandbox `Buffer` was unavailable and I used `DataTransfer` + `change` event; the framework can use a real file path from `test-data/files/` generated in a fixture, or `Buffer`).
3. Click `Upload`. Wait for the dialog `.oxd-dialog-container-default` (or role dialog) and read it.
4. Click `Ok`. Look the employees up: `/pim/viewEmployeeList`, `Employee Name` autocomplete or API `GET /api/v2/pim/employees?nameOrId=PlanAuto6&includeEmployees=currentAndPast&limit=50`.
5. Teardown: `DELETE /api/v2/pim/employees` body `{"ids":[<empNumbers from step 4>]}` (verified 200 `{"data":["1074","1075","1076"]}`).
**Expected:**
- Step 1: the note lines exactly as above; the sample header equals `## Sample CSV header`.
- Step 3: request `POST /api/v2/pim/csv-import` (JSON, NOT multipart; content-type `application/json`) with body `{"attachment":{"name":"import-planauto6.csv","type":"text/csv","size":501,"base64":"<base64 of the file>"}}` -> 200 `{"data":[],"meta":{"total":4,"success":3,"failed":1,"failedRows":[5]},"rels":[]}`. `failedRows` is the 1-based FILE row number (header = row 1, so the 4th data row is `5`).
- Dialog innerText: `×\n\nImport Details\n\n3 Records Successfully Imported\n\n1 Record Failed to Import\n\nFailed Rows\n\n5\n\nOk`. (The case text "Number of Records Imported: 3" does not match; see Discrepancies.) After `Ok` the dialog closes and the page stays on `pimCsvImport` with the file input reset (`No file selected`).
- Step 4: exactly 3 employees (`PlanAuto6A PlanAuto6One`, `PlanAuto6B PlanAuto6Two`, `PlanAuto6C PlanAuto6Three`); `PlanAuto6D` was not created. Imported employees get an EMPTY `employeeId` (`"employeeId":""`) because the CSV `employee_id` cell was empty, so search by last name, not by id. API item shape `{"empNumber":1074,"lastName":"PlanAuto6One","firstName":"PlanAuto6A","middleName":"","employeeId":"","terminationId":null}`.
- Teardown returns 200 and the check in step 4 returns total 0.

#### PIM-UI-082 Data Import rejects non-CSV files and CSV files over 1 MB
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/pim/pimCsvImport`. For each variant set the file and click `Upload`, then read `.oxd-input-field-error-message` and check that NO `POST /pim/csv-import` request was sent and no dialog opened:
   - (a) `test-data/files/not-an-image.pdf` (type `application/pdf`; the case names `employees.xlsx`, any non-csv works)
   - (b) a 1,100,000-byte `large.csv` (type `text/csv`)
   - (c) `test-data/files/attachment-large.bin` or a 1,100,000-byte `.bin` (type `application/octet-stream`)
   - (d) no file at all: click `Upload` on a fresh page.
2. API cross-check: from the page, `POST /api/v2/pim/csv-import` with `{"attachment":{"name":"x.pdf","type":"application/pdf","size":5,"base64":"aGVsbG8="}}` and with `{}`.
**Expected:**
- (a) `File type not allowed` under the file field (observed after clicking Upload; nothing was visible immediately after choosing the file).
- (b) `Attachment Size Exceeded` as soon as the file is chosen, and it stays after clicking `Upload`.
- (c) only `Attachment Size Exceeded` is shown (size check wins; the type message is not shown together with it).
- (d) `Required`.
- No POST to `csv-import`, no dialog, nothing imported in all four variants.
- Step 2: both server calls return 422 `{"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":["attachment"]}}}` (the server also rejects the pdf; the type check is enforced server-side too).

---

## Configuration Lists
**Seed:** tests/seed.spec.ts

Reporting Methods list `/pim/viewReportingMethods`: title `Reporting Methods`, button `Add`, `(n) Records Found`, header (checkbox column), `Name`, `Actions`; rows with checkbox, trash (`.bi-trash`) and pencil (`.bi-pencil-fill`). Seed rows: `Direct`, `Indirect`, `Test_Reporting` (junk from another user; do not use). Termination Reasons list `/pim/viewTerminationReasons`: title `Termination Reasons`, same layout, 11 seed rows (`Contract Not Renewed`, `Deceased`, `Dismissed`, `Laid-off`, `Other`, `Physically Disabled/Compensated`, `Resigned`, `Resigned - Company Requested`, `Resigned - Self Proposed`, `Retired`, `Test_Termination`). Add form (`/pim/saveReportingMethod`, `/pim/saveTerminationReasons`): title `Add Reporting Method` / `Add Termination Reason`, one `Name` text field (no placeholder; `form input`), `* Required`, `Cancel`, `Save`. Save navigates back to the list after the toast `Success` / `Successfully Saved`. Edit form: title `Edit Reporting Method` / `Edit Termination Reason`, URL `/pim/saveReportingMethod/<id>` or `/pim/saveTerminationReasons/<id>`, input pre-filled (wait for non-empty value), toast `Successfully Updated`. Delete: trash -> dialog -> `Yes, Delete` -> toast `Successfully Deleted`.

#### PIM-UI-083 New reporting method is saved, offered on Report-to, then edited and deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: two employees created via API (subject `PlanAuto6<u>Sub`, supervisor `PlanAuto6<u>Sup`; teardown deletes them). Name to use: `AutoRM<unique>` (I used `PlanAuto6 Method`).
2. Open `/pim/viewReportingMethods`, click `Add`, fill `Name`, click `Save`. Wait for the toast and the list.
3. Open `/pim/viewReportToDetails/empNumber/<sub>`, click the first `Add` (Assigned Supervisors), click the `Reporting Method` select (`form .oxd-select-text`), read the options.
4. Choose the new method, type the supervisor name in `Type for hints...`, pick the suggestion, `Save` (optional proof of use).
5. Remove the relation (`DELETE /api/v2/pim/employees/<sub>/supervisors` body `{"ids":[<supEmpNumber>]}`) so the method is no longer in use.
6. Back in the list, click the pencil on the row, change the name (`... Edited`), `Save`.
7. Click the trash on the edited row, `Yes, Delete`.
**Expected:**
- Step 2: toast `Success` / `Successfully Saved`; `POST /api/v2/pim/reporting-methods` body `{"name":"PlanAuto6 Method"}` -> 200 `{"data":{"id":4,"name":"PlanAuto6 Method"},"meta":[],"rels":[]}`; the form used `GET /pim/reporting-methods?limit=0` for the uniqueness check; list refetch `GET /pim/reporting-methods?limit=50&offset=0`; the new row appears (sorted alphabetically: `Direct`, `Indirect`, `PlanAuto6 Method`, `Test_Reporting`; count `(4) Records Found`).
- Step 3: options `-- Select --`, `Direct`, `Indirect`, `PlanAuto6 Method`, `Test_Reporting` (immediately offered).
- Step 4: toast `Successfully Saved`; row `PlanAuto6B PlanAuto6Two\nPlanAuto6 Method` under Assigned Supervisors.
- Step 6: edit page `Edit Reporting Method`, `GET /pim/reporting-methods/<id>` pre-fills `PlanAuto6 Method`; `PUT /api/v2/pim/reporting-methods/4` body `{"name":"PlanAuto6 Method Edited"}` -> 200; toast `Successfully Updated`; list shows the edited name.
- Step 7: dialog text exactly as in the section intro; `DELETE /api/v2/pim/reporting-methods` body `{"ids":[4]}` -> 200 `{"data":[4],...}`; toast `Successfully Deleted`; row gone. The edit/delete of a method that is still in use is blocked (see PIM-UI-085), which is why step 5 comes first.

#### PIM-UI-084 New termination reason is saved, offered in Terminate Employment, then edited and deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee created via API (teardown deletes it). Name `AutoTR<unique>` (I used `PlanAuto6 Reason`).
2. Open `/pim/viewTerminationReasons`, `Add`, fill `Name`, `Save`.
3. Open `/pim/viewJobDetails/empNumber/<n>`, click `getByRole('button',{name:'Terminate Employment'})`, in the dialog click `.oxd-select-text` and read the options; close with `Escape` or `Cancel` (do not save).
4. If you want the in-use state, terminate via API `POST /api/v2/pim/employees/<n>/terminations` body `{"date":"<today ISO>","note":"x","terminationReasonId":<id>}` and later `DELETE /api/v2/pim/employees/<n>/terminations` (no body) before editing/deleting the reason.
5. In the list click the pencil, rename to `... Edited`, `Save`; then trash, `Yes, Delete`.
**Expected:**
- Step 2: toast `Successfully Saved`; `POST /api/v2/pim/termination-reasons` body `{"name":"PlanAuto6 Reason"}` -> 200, response `{"data":{"id":13,"name":"PlanAuto6 Reason"},...}` (id is not 12: ids 12 was consumed by my API probe); row appears.
- Step 3: options `-- Select --`, `Contract Not Renewed`, `Deceased`, `Dismissed`, `Laid-off`, `Other`, `Physically Disabled/Compensated`, `PlanAuto6 Reason`, `Resigned`, `Resigned - Company Requested`, `Resigned - Self Proposed`, `Retired`, `Test_Termination` (new reason offered, alphabetical).
- Step 5: edit page `Edit Termination Reason` at `/pim/saveTerminationReasons/13`; `GET /pim/termination-reasons/13` then `PUT /pim/termination-reasons/13` body `{"name":"PlanAuto6 Reason Edited"}` -> 200, toast `Successfully Updated`; delete -> `DELETE /pim/termination-reasons` body `{"ids":[13]}` -> 200, toast `Successfully Deleted`.

#### PIM-UI-085 Reporting Methods and Termination Reasons reject blank, duplicate and over-long names and block deleting in-use entries
**Seed:** tests/seed.spec.ts
**Steps:**
1. Preconditions via API as Admin: one own reporting method used in a Report-to relation (`POST /pim/employees/<sub>/supervisors {"empNumber":<sup>,"reportingMethodId":<id>}`) and one own termination reason used in a termination (see PIM-UI-084 step 4). Teardown: delete the relation / termination first, then the method / reason, then employees.
2. For each screen open the Add page. (a) click `Save` with empty Name; (b) fill an existing name (`Direct` / `Resigned`); (c) fill 101 characters (`PlanAuto6 ` + 91 x; a 106-char string also works); read the error under Name after it appears.
3. Also fill the lowercase variants `direct` / `resigned`.
4. On each list click the trash of the in-use entry (own entry; for observation only I also clicked the seed `Direct`, which is in use, and cancelled nothing because no dialog appears).
5. API cross-check (see PIM-API-018).
**Expected:**
- (a) `Required` under Name (wait for the message); no POST. (b) `Already exists` (validated client-side while typing, from `GET .../<resource>?limit=0`). (c) `Should not exceed 100 characters`. None saves anything.
- Case sensitivity differs: Termination Reasons `resigned` -> `Already exists` (case-insensitive); Reporting Methods `direct` -> NO error in the UI (case-sensitive), see Discrepancies.
- In-use delete: clicking the trash of an in-use entry does NOT open the confirmation dialog and sends no request; an error toast appears instead: `Error\n\nReporting Method(s) in Use\n\n×` and `Error\n\nTermination Reason(s) in Use\n\n×`. The row remains and the count is unchanged. Selecting the entry's checkbox for bulk delete is also available but I did not verify bulk behaviour.
- API refuses it too: `DELETE /pim/reporting-methods {"ids":[4]}` and `DELETE /pim/termination-reasons {"ids":[13]}` for in-use ids -> 422 `{"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":["ids"]}}}`; the entry and the relation are unchanged.
- When submitting a duplicate through the UI past the validation (double-click on Save) the server answers `POST /pim/termination-reasons` 422 and the UI shows the toast `Error\n\nInvalid Parameter\n\n×`.

---

## Reports
**Seed:** tests/seed.spec.ts

List `/pim/viewDefinedPredefinedReports`: card title `Employee Reports`, filter `Report Name` (autocomplete, placeholder `Type for hints...`), buttons `Reset`, `Search`, then `Add`, `(n) Records Found`, header `Name`, `Actions`; rows sorted by name: `All Employee Sub Unit Hierarchy Report` (id 7), `Employee Contact info report` (id 6), `Employee Job Details` (id 8), `PIM Sample Report` (id 5); a foreign `irCflCUPbA` (id 10) appeared during my run. Each row has trash (`.bi-trash`), pencil (`.bi-pencil-fill`) and a view icon (`.bi-file-text-fill`, opens `displayPredefinedReport/<id>`). Predefined reports also have trash/pencil (never delete them).

Add form `/pim/definePredefinedReport` (title `Add Report`): `Report Name*` (text, placeholder `Type here ...`); section heading `Selection Criteria` with select `Selection Criteria` (`-- Select --`, `Employee Name`, `Pay Grade`, `Education`, `Employment Status`, `Service Period`, `Joined Date`, `Job Title`, `Language`, `Skill`, `Age Group`, `Sub Unit`, `Gender`, `Location`) and a green `+` icon button right of it (no accessible name; locate as the button next to the select), select `Include` (default `Current Employees Only`); section `Display Fields` with selects `Select Display Field Group` (`-- Select --`, `Personal`, `Contact Details`, `Emergency Contacts`, `Dependents`, `Immigration`, `Job`, `Salary`, `Subordinates`, `Supervisors`, `Work Experience`, `Education`, `Skills`, `Languages`, `License`, `Memberships`, `Custom Fields`) and `Select Display Field` (depends on the group) with its own `+` button; `* Required`, `Cancel`, `Save`. Adding a criterion with `+` appends a row: remove button (x), label paragraph `Job Title` and an input for that criterion (for Job Title a select listing all titles, 33 options incl. `-- Select --`). Adding a display field with `+` creates a group block: group title (`Personal`), the field names (`Employee Id`, `Employee Last Name`) each removable, and a switch `Include Header` (`.oxd-switch-input`, default OFF, active class `oxd-switch-input--active`; none exist until a group is added). Fields already added disappear from the field drop-down. Personal fields: `Employee Id`, `Employee Last Name`, `Employee First Name`, `Employee Middle Name`, `Date of Birth`, `Nationality`, `Gender`, `Marital Status`, `Driver's License Number`, `License Expiry Date`, `Other Id`. Job fields: `Contract Start Date`, `Contract End Date`, `Job Title`, `Employment Status`, `Job Category`, `Joined Date`, `Sub Unit`, `Location`, `Termination Date`, `Termination Reason`, `Termination Note`.

Run page `/pim/displayPredefinedReport/<id>`: title `<report name>`, counter `(1) Record Found`, then a REVO-GRID (`<revo-grid>`, not an HTML table): group header cells `.group-rgRow .header-content` (`Personal`, `Job`), column header cells `.header-rgRow.actual-rgRow .header-content` (`Employee Id`, `Employee Last Name`, `Job Title`), rows `.rgRow` with `.rgCell` cells (the first cell is empty for an imported employee with no employee id; `PlanAuto6One`, `Legacy Data Administrator`). Use `getByText` for cell values; there are no `role=row/cell` attributes. Wrapper `.oxd-report-table`, counter `.oxd-report-table-header--pagination`.

#### PIM-UI-086 Reports list shows predefined reports and filters by Report Name
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/pim/viewDefinedPredefinedReports`; wait for `Records Found`; read title, header, rows and row icons.
2. Click `getByPlaceholder('Type for hints...')`, `fill('PIM Sample')`, wait for `getByRole('option',{name:'PIM Sample Report'})`, click it, click `Search`; wait for `(1) Record Found`.
3. Click `Reset`.
4. Type `zzzNone` and read the dropdown.
**Expected:**
- Step 1: title `Employee Reports`, header `Name` / `Actions`, count text `(n) Records Found`, rows include `All Employee Sub Unit Hierarchy Report`, `Employee Contact info report`, `Employee Job Details`, `PIM Sample Report` (4 on a clean demo; other users' reports may add more). Request `GET /api/v2/pim/reports/defined?limit=50&offset=0&sortField=report.name&sortOrder=ASC` -> `{"data":[{"id":7,"name":"All Employee Sub Unit Hierarchy Report"},{"id":6,...},{"id":8,...},{"id":5,"name":"PIM Sample Report"}],"meta":{"total":4}}`.
- Step 2: the autocomplete calls `GET /api/v2/pim/reports/defined?name=PIM+Sample` and offers exactly `PIM Sample Report`. You MUST pick the option: pressing Search with only the typed text shows `Invalid` under Report Name and the list stays unfiltered. After picking: request `GET .../reports/defined?limit=50&offset=0&reportId=5&sortField=report.name&sortOrder=ASC`; table shows only `PIM Sample Report`, `(1) Record Found`.
- Step 3: input cleared, full list restored.
- Step 4: dropdown `No Records Found` (not re-verified for the text; the wait for it did not complete before I aborted the step, treat as unverified).

#### PIM-UI-087 Custom report filtered by Job Title shows only chosen columns and matching employees, then is edited and deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition via API: employee with a job title nobody else has. I used the seed-ish title `Legacy Data Administrator` (id 30) on one employee: `PUT /api/v2/pim/employees/<n>/job-details` body `{"jobTitleId":30}` -> 200. Title ids/names on this demo are volatile (`QA Engineer` 9, `QA Lead` 8, ...): the test should read `GET /admin/job-titles?limit=100` and pick one with no employees (check `GET /pim/employees?jobTitleId=<id>` total 0), or create its own title (Admin > Job Titles) and delete it in teardown.
2. Click `Add` on the list. Read the Selection Criteria and Display Field Group options (listed in the Reports intro).
3. Fill `Report Name` `PlanAuto6 Report`. Select criterion `Job Title`, click its `+`; in the new row pick the title in the select. Display fields: group `Personal` -> `Employee Id` -> `+`; `Employee Last Name` -> `+`; group `Job` -> `Job Title` -> `+`. Turn ON the `Include Header` switch of both groups. Click `Save`.
4. On the run page read the group headers, column headers, rows and counter.
5. Back to the list, click the pencil of the row; read the prefilled form; change the name to `PlanAuto6 Report Edited`, `Save`.
6. Back to the list, trash of the row, `Yes, Delete`.
**Expected:**
- Step 2: criteria list as in the intro (13 entries; the case/BRD say `Age Range` but the app shows `Age Group`); display field groups as in the intro (16 groups; the order differs from the BRD list, e.g. `Salary`, `Subordinates`, `Supervisors` come before `Work Experience`).
- Step 3: after adding the criterion the form shows a row `Job Title` with the title select; after each display field the form shows blocks `Personal` (`Employee Id`, `Employee Last Name`) and `Job` (`Job Title`), each with `Include Header`. Save: toast `Success` / `Successfully Saved`; `POST /api/v2/pim/reports/defined` body `{"name":"PlanAuto6 Report","include":"onlyCurrent","criteria":{"14":{"operator":"eq","x":"30","y":"undefined"}},"fieldGroup":{"1":{"fields":[9,10],"includeHeader":true},"6":{"fields":[77],"includeHeader":true}}}` -> 200 `{"data":{"id":11,"name":"PlanAuto6 Report"},"meta":[],"rels":[]}` (criteria key 14 = Job Title, `y` is the literal string `"undefined"`, field group key 1 = Personal with field ids 9 = Employee Id, 10 = Employee Last Name; group key 6 = Job, field 77 = Job Title). The app then navigates to `/pim/displayPredefinedReport/11`.
- Step 4: `GET /pim/reports?name=pim_defined&reportId=11` -> `{"data":{"headers":[{"name":"Personal","children":[{"name":"Employee Id","prop":"employeeId","size":100,...},{"name":"Employee Last Name","prop":"employeeLastname","size":200,...}]},{"name":"Job","children":[{"name":"Job Title","prop":"empJobTitle","size":200,...}]}],"filters":[]},"meta":{"headers":{"name":"PlanAuto6 Report","columnCount":3,"groupCount":2,"groupedColumnCount":3},"filters":null}}` and `GET /pim/reports/data?limit=50&offset=0&reportId=11&name=pim_defined&_dateFormattingEnabled=true` -> `{"data":[{"empNumber":1074,"employeeId":"","employeeLastname":"PlanAuto6One","empJobTitle":"Legacy Data Administrator"}],"meta":{"total":1}}`. UI: title `PlanAuto6 Report`, `(1) Record Found`, group headers `Personal`, `Job`, column headers `Employee Id`, `Employee Last Name`, `Job Title`, one row: empty id cell, `PlanAuto6One`, `Legacy Data Administrator`. Only the test employee is listed and exactly the 3 chosen columns exist. (Criterion filters do NOT show in the output page.)
- Step 5: URL `/pim/definePredefinedReport/11`, title `Edit Report`; `GET /pim/reports/defined/11` -> `{"data":{"id":11,"name":"PlanAuto6 Report","include":"onlyCurrent","criteria":{"14":{"x":{"id":30,"label":"Legacy Data Administrator"},"y":"undefined","operator":"eq"}},"fieldGroup":{"1":{"fields":[9,10],"includeHeader":true},"6":{"fields":[77],"includeHeader":true}}}}`; the form shows name, criterion row `Job Title` with the title, the two blocks with `Include Header` ON, empty group/field selects. Save: toast `Successfully Updated`, `PUT /pim/reports/defined/11`, then the run page opens again.
- Step 6: delete dialog as in the intro, `DELETE /api/v2/pim/reports/defined` body `{"ids":[11]}` -> 200, toast `Successfully Deleted`; row removed. Teardown must delete the report even if an earlier step fails (`DELETE /pim/reports/defined {"ids":[id]}` -> 200 `{"data":["12","13","14"]}` for several ids).

#### PIM-UI-088 Report requires a unique name and at least one display field
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/pim/definePredefinedReport` (wait ~1 s for `GET /pim/reports/defined?limit=0`, the name list used for the duplicate check). Click `Save` with everything empty.
2. Fill `Report Name` `PlanAuto6 NoFields` (no display fields) and click `Save`.
3. Fill `PIM Sample Report` (then press Tab or click elsewhere to blur) and read the error; then `pim sample report`; then 101 `P` characters.
4. For a complete negative check also add a valid display field with the duplicate name and `Save` (do not expect a POST).
**Expected:**
- Step 1: `Required` under Report Name; no request.
- Step 2: no field error; toast `Warning\n\nAt least one display field should be added\n\n×`; URL stays `/pim/definePredefinedReport`; no POST (the case text "at least one display field required" is a paraphrase).
- Step 3: `Already exists` under Report Name for `PIM Sample Report` (the toast above also shows when Save is pressed without fields). Lower-case `pim sample report` gives NO error (duplicate check is case-sensitive). 101 characters give no error and no maxlength (see Discrepancies).
- Step 4: Save is blocked by the duplicate message (not executed by me, I only observed the inline error).

---

## Configuration API
**Seed:** tests/seed.spec.ts

Base `/web/index.php/api/v2`, session-cookie Admin, `content-type: application/json`.

#### PIM-API-018 Reporting methods and termination reasons reject blank, duplicate and 101-character names
**Seed:** tests/seed.spec.ts
**Steps:**
1. For each resource (`/pim/reporting-methods`, `/pim/termination-reasons`) `POST` bodies: `{"name":""}`, `{}`, existing name (`Direct` / `Resigned`), same in lower case (`direct` / `resigned`), 101 characters, and 100 characters (positive boundary with a unique prefix). After each response, read the list `GET .../<resource>?limit=0` and delete anything created.
**Expected (observed, they DIFFER between the two resources):**
- `/pim/termination-reasons`: blank `{"name":""}` -> 422, missing `name` -> 422, `Resigned` -> 422, `resigned` -> 422 (case-insensitive), 101 chars -> 422, all `{"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":["name"]}}}`; a 100-char name (`PlanAuto6 ` + 90 `q`) -> 200 `{"data":{"id":12,"name":"..."}}` (deleted afterwards: `DELETE` body `{"ids":[12]}` -> 200 `{"data":["12"],...}`).
- `/pim/reporting-methods`: missing `name` -> 422 `["name"]`; 101 chars -> 422 `["name"]`; BUT blank `{"name":""}` -> 200 (created id 5 with empty name), exact duplicate `Direct` -> 200 (created id 6), `direct` -> 200 (id 7); 100 chars -> 200. The BRD (PIM-FR-027-AC1, "Already exists", mandatory) is NOT enforced by the reporting-methods API: assert the BRD and mark `test.fail()` with an `issue` annotation for blank and duplicate, and clean up the created rows (I deleted ids 5,6,7 with `DELETE /pim/reporting-methods {"ids":[5,6,7]}` -> 200 `{"data":[5,6,7]}`). Note the DELETE response for reporting methods returns numeric ids, for termination reasons string ids.
- In-use delete (both): 422 `invalidParamKeys:["ids"]`.

#### PIM-API-019 Optional field settings can be read and updated, and restored afterwards
**Seed:** tests/seed.spec.ts
**Steps:**
1. `GET /pim/optional-field`; keep the body as `orig`.
2. `PUT /pim/optional-field` with `{...orig, "showSSN": !orig.showSSN}`; then `GET`.
3. `PUT` the original body back (in `finally`); `GET` again.
4. Negative: `PUT {"showSSN":"x"}`.
**Expected:**
- Step 1: 200 `{"data":{"pimShowDeprecatedFields":false,"showSIN":false,"showSSN":false,"showTaxExemptions":false},"meta":[],"rels":[]}` (field names are `pimShowDeprecatedFields`, `showSIN`, `showSSN`, `showTaxExemptions`, NOT `showDeprecatedFields`/`showSsn` as in the case).
- Step 2: 200 and the response already reflects the change (`"showSSN":true`); GET returns the same.
- Step 3: 200, GET shows the original values (verified at the end of my session: all four false).
- Step 4: 422 `{"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":["showSSN"]}}}`; state unchanged. (A partial body without the other flags was not probed.) This is a global setting: always restore.

---

## Access Control API
**Seed:** tests/seed.spec.ts

#### PIM-API-020 ESS session cannot list, create or delete employees through the PIM API
**Seed:** tests/seed.spec.ts
**Steps:**
1. As Admin create an employee via API and an ESS login: `POST /admin/users` body `{"username":"planauto6.ess","password":"Plan6Auto!x9","status":true,"userRoleId":2,"empNumber":<n>}` -> 200 (user id 99). Also create a second employee as the delete target.
2. Switch identity: `context.clearCookies()` then log in at `/auth/login` as the ESS user (or in the framework a guest session + `POST` login), wait for `/dashboard/index`. With the ESS session run (inside the page, `fetch` same-origin):
   - `GET /pim/employees?limit=5`
   - `POST /pim/employees` body `{"firstName":"PlanAuto6","middleName":"","lastName":"EssCreated","employeeId":""}`
   - `DELETE /pim/employees` body `{"ids":[<second employee empNumber>]}`
   - optional extras (all denied): `GET /pim/reporting-methods?limit=5`, `POST /pim/reporting-methods`, `GET /pim/optional-field`, `PUT /pim/optional-field`, `GET /pim/reports/defined?limit=5`, `POST /pim/csv-import`, `GET /pim/termination-reasons?limit=5`.
3. Log Admin back in (`clearCookies`, `Admin`/`admin123`), check the second employee still exists and no `EssCreated` employee exists; teardown: `DELETE /admin/users {"ids":[99]}` then `DELETE /pim/employees {"ids":[...]}`.
**Expected:**
- `GET /pim/employees` -> 200 `{"data":[],"meta":{"total":0},"rels":[]}` (empty data, as the case allows; an ESS user sees no other employees).
- `POST /pim/employees` -> 403 `{"error":{"status":403,"message":"Unauthorized"}}` (note: `status` is a NUMBER here, a string `"422"` in validation errors); `DELETE /pim/employees` -> 403 same body.
- Extras: every listed config/report/import endpoint -> 403 `{"error":{"status":403,"message":"Unauthorized"}}`.
- No data change (the target employee is intact).

---

## Observed API calls
(base `/web/index.php/api/v2`; JSON; session cookie)
- Import: `POST /pim/csv-import` JSON body `{"attachment":{"name","type","size","base64"}}` -> 200 `{"data":[],"meta":{"total":4,"success":3,"failed":1,"failedRows":[5]},"rels":[]}`; 422 `invalidParamKeys:["attachment"]` for a non-csv type or missing attachment. Sample: `GET /web/index.php/pim/sampleCsvDownload` (not under api/v2) -> file `importData.csv`.
- Reporting methods: `GET /pim/reporting-methods?limit=50&offset=0` (list; UI also `?limit=0` for uniqueness), `GET /pim/reporting-methods/<id>`, `POST` `{"name"}` -> `{"data":{"id","name"}}`, `PUT /pim/reporting-methods/<id>` `{"name"}`, `DELETE /pim/reporting-methods` `{"ids":[<numbers>]}` -> `{"data":[<numbers>]}`. Seed ids: Direct 1, Indirect 2, Test_Reporting 3; own id was 4. The list response has no in-use flag (meta only `{"total":n}`), yet the UI shows `Reporting Method(s) in Use` without sending a request (mechanism not identified).
- Termination reasons: same shape; `POST` -> 200 or 422; `PUT /pim/termination-reasons/<id>`; `DELETE` body `{"ids":[13]}` -> `{"data":["13"]}`; in-use -> 422 `["ids"]`; UI toast `Termination Reason(s) in Use`. Seed ids: Other 1, Retired 2, Contract Not Renewed 3, Resigned - Company Requested 4, Resigned - Self Proposed 5, Resigned 6, Deceased 7, Physically Disabled/Compensated 8, Laid-off 9, Dismissed 10, Test_Termination 11.
- Optional field: `GET|PUT /pim/optional-field`, body `{"pimShowDeprecatedFields","showSIN","showSSN","showTaxExemptions"}` (booleans).
- Reports: resource is `/pim/reports/defined` (NOT `/pim/reports`): `GET /pim/reports/defined?limit=50&offset=0&sortField=report.name&sortOrder=ASC` (also `&name=<text>` for the autocomplete, `&reportId=<id>` for the filtered list, `?limit=0` for the whole list), `GET /pim/reports/defined/<id>` (definition), `POST /pim/reports/defined`, `PUT /pim/reports/defined/<id>`, `DELETE /pim/reports/defined` `{"ids":[..]}` -> `{"data":["12","13","14"]}`. Run: `GET /pim/reports?name=pim_defined&reportId=<id>` (headers/groups) and `GET /pim/reports/data?limit=50&offset=0&reportId=<id>&name=pim_defined&_dateFormattingEnabled=true` (rows). Predefined ids: 5 PIM Sample Report, 6 Employee Contact info report, 7 All Employee Sub Unit Hierarchy Report, 8 Employee Job Details. API accepts blank-free duplicate names, no display fields and 101-char names (200), blank name -> 422 `["name"]`.
- Helpers used: `GET /admin/job-titles?limit=100`, `PUT /pim/employees/<n>/job-details` `{"jobTitleId":30}`, `POST|DELETE /pim/employees/<n>/terminations`, `POST|DELETE /pim/employees/<n>/supervisors`, `POST /admin/users` (ESS, `userRoleId` 2), `DELETE /admin/users`, `DELETE /pim/employees`.
- ESS (planauto6.ess): `GET /pim/employees` 200 empty; everything else tried 403 `{"error":{"status":403,"message":"Unauthorized"}}`.

## Locators
- Upload: `getByRole('link',{name:'Download'})`, file `page.locator('input[type=file]')` (hidden input; use `setInputFiles`), button `getByRole('button',{name:'Upload'})`, errors `.oxd-input-field-error-message`, result dialog `.oxd-dialog-container-default` with `getByRole('button',{name:'Ok'})`.
- Lists: `getByRole('button',{name:'Add'})`, rows `.oxd-table-card` filtered by `hasText`, trash `button:has(.bi-trash)`, pencil `button:has(.bi-pencil-fill)`, report view `button:has(.bi-file-text-fill)` (or link), count `getByText(/Record(s)? Found/)`, delete dialog `getByRole('button',{name:'Yes, Delete'})` / `No, Cancel`, toast `.oxd-toast` (`.first()`).
- Config add/edit: `form input` (Name), `getByRole('button',{name:'Save'})`, `getByRole('button',{name:'Cancel'})`.
- Report-to option check: `getByRole('button',{name:'Add'}).first()`, `form .oxd-select-text`, `getByRole('option')`.
- Terminate dialog: `getByRole('button',{name:'Terminate Employment'})`, `.oxd-dialog-container-default .oxd-select-text`.
- Reports list: `getByPlaceholder('Type for hints...')`, `getByRole('option',{name:'PIM Sample Report'})`, `getByRole('button',{name:'Search'|'Reset'})`.
- Report form: `getByPlaceholder('Type here ...')` (name), select by group: `page.locator('.oxd-input-group',{hasText:'Selection Criteria'}).locator('.oxd-select-text').first()`, `Select Display Field Group`, `Select Display Field` (last group with that text), `getByRole('option',{name:'Job Title',exact:true})` (use exact: `Job` also matches `Job Title`), the `+` button: `page.locator('button').filter({has: page.locator('.bi-plus')})` (`.last()` for display fields; the criteria `+` is the first one), criterion value select `.oxd-select-text` index 2 after the criterion row is added (re-query rather than index), switches `.oxd-switch-input` (`--active` class `oxd-switch-input--active`).
- Report output: `.oxd-report-table`, `.oxd-report-table-header--pagination` (counter), `.group-rgRow .header-content`, `.header-rgRow.actual-rgRow .header-content`, `.rgRow .rgCell`.
- Login switch: `getByPlaceholder('Username')`, `getByPlaceholder('Password')`, `getByRole('button',{name:'Login'})`.

## Master data used
- Reporting methods: `Direct` (1), `Indirect` (2) seed; `Test_Reporting` (3) foreign junk, avoid. Own: `PlanAuto6 Method` (created/edited/deleted).
- Termination reasons: all 11 seed entries untouched; own `PlanAuto6 Reason` (id 13, created/edited/deleted). `Resigned` (6) used only as an existing-name sample.
- Job title: `Legacy Data Administrator` (id 30) used on one throw-away employee as the report filter; it is not a stable OrangeHRM seed title (exists on this demo state only). Recommended: the test creates its own job title or selects a title with zero employees. No master data was created or changed by me in Admin.
- Reports: predefined ids 5-8 untouched; own `PlanAuto6 Report` (id 11).
- ESS role id 2; Include value `onlyCurrent` (other values not probed).
- Files: no file was written to disk (no file-writing tool): `/Users/karthikkodati/Downloads/orangehrm-e2e-ai-playwright/test-data/files/import-planauto6.csv` still has to be generated by the engineer (or built in memory) from the header and rows in PIM-UI-081. Existing files `not-an-image.pdf` and `attachment-large.bin` were referenced but not read; I simulated the same types/sizes with in-page `File` objects (pdf, 1.1 MB csv, 1.1 MB bin).

## Sample CSV header
Exact content of the downloaded `importData.csv` (a single header line, no data rows; 22 columns in this order):

```
first_name,middle_name,last_name,employee_id,other_id,driver's_license_no,license_expiry_date,gender,marital_status,nationality,date_of_birth,address_street_1,address_street_2,city,state/province,zip/postal_code,country,home_telephone,mobile,work_telephone,work_email,other_email
```

Example data lines used (22 cells each):
```
PlanAuto6A,,PlanAuto6One,,,,,Male,,,1990-05-12,1 Main St,,Austin,TX,73301,United States,,,,,
PlanAuto6B,,PlanAuto6Two,,,,,Female,,,,,,,,,,,,,,
PlanAuto6C,,PlanAuto6Three,,,,,,,,,,,,,,,,,,,
PlanAuto6D,,,,,,,,,,,,,,,,,,,,,
```
(The last row has no last_name and is the single failed row, reported as row 5.) The file ends with a trailing newline; size was 501 bytes.

## Discrepancies
1. PIM-UI-081: the result dialog reads `3 Records Successfully Imported` / `1 Record Failed to Import` / `Failed Rows` / `5`, not "Number of Records Imported: 3". Failed row numbers are file line numbers including the header. Imported employees have an empty Employee Id when `employee_id` is blank (so search by name). The import is JSON/base64 to `/pim/csv-import`, not multipart. The case's "Search the list for the imported last names" works via last name/`nameOrId`.
2. PIM-UI-082: `File type not allowed` is shown only after clicking `Upload` (not on selection), `Attachment Size Exceeded` on selection; with a large non-csv file only the size message shows. Server also rejects non-csv with 422 `attachment`. The sample download link is `<a href="#">`, not a normal href.
3. PIM-UI-083/084: the case wording "Configuration > ... > + Add" opens a separate page (`saveReportingMethod`, `saveTerminationReasons`), not an inline form. Edit/delete of an in-use method is blocked, so remove the relation before delete.
4. PIM-UI-085 / PIM-API-018: (a) reporting-methods API accepts blank, duplicate and case-variant names (200), while termination-reasons API rejects them (422): BRD PIM-FR-027-AC1 not met server-side. (b) UI duplicate check for reporting methods is case-sensitive (`direct` saves), termination reasons are case-insensitive. (c) In-use deletion is refused with an error TOAST `Reporting Method(s) in Use` / `Termination Reason(s) in Use`, there is no confirmation dialog and no network request in the reporting-method case; the case says "Deletion is refused" (matches), but the exact message is not in the case. (d) Reading validation messages immediately after clicking Save yields none: wait for them.
5. PIM-UI-086: the Report Name filter requires picking an autocomplete option; Search with typed-only text shows `Invalid`. The case step ("pick the suggestion") is consistent. Row count varies because other users create reports (foreign `irCflCUPbA` id 10 seen).
6. PIM-UI-087: the BRD criterion `Age Range` is `Age Group` in the app; BRD criteria `Service Period`, `Joined Date`, `Language`, `Skill`, `Employee Name`, `Pay Grade`, `Education`, `Employment Status`, `Sub Unit`, `Gender`, `Location` are all present (13 total). Display group order differs from the BRD (`Immigration`, `Job`, `Salary`, `Subordinates`, `Supervisors` come before `Work Experience`); all 16 BRD groups exist. `Include Header` is a per-group switch, default OFF, visible only after a field of that group is added. After Save the app opens the run page (the case says "Report runs", consistent). The report output is a `revo-grid` (not a `<table>`). Criteria are not echoed in the output. The edited report's criterion `y` is the string `"undefined"` (app quirk). Employee Id is empty for CSV-imported employees. I did not exercise every criterion type's input, nor the `Include` drop-down options, nor selecting a field twice.
7. PIM-UI-088: duplicate message `Already exists` appears on blur/typing and is case-sensitive (`pim sample report` accepted). No-display-field condition is a WARNING toast `At least one display field should be added`, not an inline message. Report Name max length: 101 characters accepted by UI and API (no limit found). The API accepts duplicates and no-field reports (200) and a blank name returns 422: UI-only validation for uniqueness and display fields. Expect the engineer to keep UI assertions and mark any API assertion of these rules `test.fail()` with an `issue` annotation.
8. PIM-API-019: key names are `pimShowDeprecatedFields`, `showSIN`, `showSSN`, `showTaxExemptions` (case lists `showDeprecatedFields`, `showSsn`, `showSin`). PUT returns the updated object.
9. PIM-API-020: ESS `GET /pim/employees` returns 200 with empty data (not 403), POST and DELETE return 403 `{"error":{"status":403,"message":"Unauthorized"}}` (numeric status). All other PIM config/report/import endpoints are 403 for ESS.
10. Not verified: bulk delete via checkbox on the config lists, the `Include` options on the report form, criteria inputs other than Job Title, reports containing the same field twice, pagination of the report output (`limit=50`), whether `Report Name` Search with a typed non-matching name shows `No Records Found` (text not captured), the exact boundary of the 1 MB limit (1,100,000 bytes rejected; the 1,048,576 boundary untested), the 100-record import limit, and the mechanism that makes the UI know an entry is in use without a request.
11. Cleanup confirmation (end of session): reporting method `PlanAuto6 Method` deleted (list = Direct, Indirect, Test_Reporting); termination reason `PlanAuto6 Reason` deleted (11 original entries); report `PlanAuto6 Report` deleted (list = ids 5,6,7,8,10); imported employees 1074-1076 deleted (search total 0); ESS user `planauto6.ess` (id 99) deleted; accidental API junk (reporting methods 5,6,7; reports 12,13,14; termination reason 12) deleted; optional-field restored; Admin session restored.
12. Deviation from the brief: `import-planauto6.csv` was NOT written to `test-data/files/` (no file-writing tool; the upload used an in-page `File` built with `DataTransfer`), so the engineer must generate it from the header/rows above.


## Test Scenarios
