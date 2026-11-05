# PIM Plan 1 of 6: Employee List and Delete Employee

## Application Overview

Plan for PIM-UI-001..PIM-UI-014 on OrangeHRM OS 5.9 demo (https://opensource-demo.orangehrmlive.com), page /web/index.php/pim/viewEmployeeList. Explored live as Admin (John Mike Doe, Employee Id 55555, empNumber 7). Test data used while exploring: PlanAuto1..3 and PlanAutoBulk x3, all deleted at the end. Common helper facts: every test creates its own employee via POST /web/index.php/api/v2/pim/employees {firstName, middleName:"", lastName, empPicture:null, employeeId} (returns data.empNumber); set job fields via PUT /pim/employees/{empNumber}/job-details {jobTitleId, empStatusId, subunitId}; terminate via POST /pim/employees/{n}/terminations {date:"yyyy-mm-dd", terminationReasonId:1} (do NOT send note:"" -> 422 invalidParamKeys [note]); re-activate via DELETE /pim/employees/{n}/terminations. Delete in teardown with DELETE /pim/employees {"ids":[...]}. Shared demo: total record count changes constantly (166 at first load), never assert an absolute total, only compare to the value read before. Toast structure: .oxd-toast with title (Success/Info) + message + x.

## Locators (stable choices)
- Heading: getByRole('heading',{name:'Employee Information'}) (h5). Sidebar link getByRole('link',{name:'PIM'}) href /web/index.php/pim/viewPimModule lands on viewEmployeeList. Top tabs: link 'Employee List', 'Add Employee', 'Reports'.
- Labels in search panel (exact): Employee Name, Employee Id, Employment Status, Include, Supervisor Name, Job Title, Sub Unit. Buttons: getByRole('button',{name:'Reset'}), getByRole('button',{name:'Search'}).
- Employee Name / Supervisor Name: getByPlaceholder('Type for hints...').first() / .nth(1) (both share the placeholder). Type with pressSequentially (fill does not reliably fire the suggestion request). Option list: role=listbox (css .oxd-autocomplete-dropdown) with role=option items; first option text is transient 'Searching....' so wait for getByRole('option',{name:/<first name>/}) before clicking. Option text format 'First Last' (e.g. 'PlanFirst1 PlanAuto1'); input value after pick is 'PlanFirst1  PlanAuto1' (double space when no middle name).
- Employee Id: no placeholder; use the oxd input group: page.locator('.oxd-input-group',{hasText:'Employee Id'}).locator('input') (fallback of FormField 'Employee Id').
- oxd-select drop-downs (Employment Status, Include, Job Title, Sub Unit): not native select. Open with page.locator('.oxd-input-group',{hasText:'<Label>'}).locator('.oxd-select-text').click() then getByRole('option',{name:'<text>',exact:true}).click(). The selected text is shown in .oxd-select-text-input (innerText). Options exposed as role=option (list in .oxd-select-dropdown); Escape closes.
- Record count: page.locator('.orangehrm-horizontal-padding') text (span). Values: '(166) Records Found', '(1) Record Found' (singular!), 'No Records Found', and when rows are selected '(N) Records Selected' plus the Delete Selected button inside the same container.
- Table: getByRole('table') / .oxd-table; header cells role=columnheader; body rows .oxd-table-body .oxd-table-card (role=row); cells role=cell. Row cell indices: 0 checkbox, 1 Id, 2 First (& Middle) Name, 3 Last Name, 4 Job Title, 5 Employment Status, 6 Sub Unit, 7 Supervisor, 8 Actions.
- Row actions are icon-only buttons without accessible names: edit = row.locator('button:has(.bi-pencil-fill)'), delete = row.locator('button:has(.bi-trash)'). In DOM order pencil comes first, then trash.
- Row checkbox: input[type=checkbox] inside .oxd-checkbox-wrapper; the input is covered by a styled span, click the label (row.locator('.oxd-checkbox-wrapper label')) or use .check({force}) is NOT allowed by project rules so use label click. Header checkbox: page.locator('.oxd-table-header .oxd-checkbox-wrapper label').
- Sort: hover/click the sort icon in the header cell: headerCell = page.locator('.oxd-table-header-cell').filter({hasText:'Last Name'}); headerCell.locator('.oxd-table-header-sort').click(); then headerCell.locator('.oxd-table-header-sort-dropdown li').filter({hasText:'Ascending'|'Descending'}).click(). IMPORTANT: scope the li to the header cell, otherwise 7 matches (strict-mode violation). Sortable: Id, First (& Middle) Name, Last Name, Job Title, Employment Status, Sub Unit, Supervisor. Not sortable: checkbox, Actions.
- Pagination: getByRole('navigation',{name:'Pagination Navigation'}); page buttons by name '1','2',...; next/previous arrows are icon buttons (last/first button in the nav, icon .bi-chevron-right / .bi-chevron-left). Selected page has class oxd-pagination-page-item--page-selected.
- Delete dialog: getByRole('dialog'); contains no heading role (title is a p.oxd-text); buttons getByRole('button',{name:'No, Cancel'}), getByRole('button',{name:'Yes, Delete'}) (accessible name has leading icon space, prefer regex /Yes, Delete/), close x button.
- Delete Selected: getByRole('button',{name:/Delete Selected/}).
- Toast: page.locator('.oxd-toast') (text 'Success\n\nSuccessfully Deleted\n\n×' or 'Info\n\nNo Records Found\n\n×').

## Employee List
**Seed:** tests/seed.spec.ts

### Employee List (PIM-FR-001 to PIM-FR-003)

#### PIM-UI-001 Employee List opens with search panel, expected columns, record count and current employees only
**Seed:** tests/seed.spec.ts
**Steps:**
1. From the Dashboard click the sidebar link 'PIM' (href /web/index.php/pim/viewPimModule).
2. Wait for URL /web/index.php/pim/viewEmployeeList and heading 'Employee Information'.
3. Read the labels of the search panel.
4. Read the table header cells (role columnheader).
5. Read the text in .orangehrm-horizontal-padding above the table.
6. Read the selected value of the Include drop-down.
**Expected:**
- Search panel labels: Employee Name, Employee Id, Employment Status, Include, Supervisor Name, Job Title, Sub Unit; buttons Reset and Search; Add button above the table.
- Columns (innerText): '' (checkbox), 'Id', 'First (& Middle) Name', 'Last Name', 'Job Title', 'Employment Status', 'Sub Unit', 'Supervisor', 'Actions'.
- Count text matches /^\(\d+\) Records? Found$/ with N > 0 (166 at time of exploration).
- Include shows 'Current Employees Only'; initial request has includeEmployees=onlyCurrent, limit=50, offset=0, sortField=employee.firstName, sortOrder=ASC.

#### PIM-UI-002 Row action icons and row click open the expected employee
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create an employee via API (e.g. firstName PlanFirst1, lastName PlanAuto1, employeeId PA901); note empNumber.
2. Open /web/index.php/pim/viewEmployeeList, type PA901 into Employee Id, click Search; wait for '(1) Record Found'.
3. Verify the row Actions cell contains a button with .bi-pencil-fill and one with .bi-trash.
4. Click the pencil button.
5. Go back (browser back) to the list, repeat the search for PA901, then click the Last Name cell text 'PlanAuto1' (not an icon).
**Expected:**
- Pencil click navigates to /web/index.php/pim/viewPersonalDetails/empNumber/<empNumber> (e.g. .../empNumber/257).
- After going back the list is reset to the default (search criteria are NOT retained), so the search must be repeated.
- Row click navigates to the same URL /pim/viewPersonalDetails/empNumber/<empNumber>.

#### PIM-UI-003 Search by Employee Id or by name returns only the matching employee
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create an employee via API (PlanFirst1 PlanAuto1, id PA901).
2. Variant 'Employee Id': fill Employee Id = PA901, click Search.
3. Variant 'Employee Name (autocomplete pick)': click Reset, type 'PlanFirst1' slowly in Employee Name (first 'Type for hints...' textbox), wait for option 'PlanFirst1 PlanAuto1', click it, click Search.
4. Variant 'partial free text': click Reset, fill Employee Name with 'PlanFirst1' (or a partial such as 'PlanFirst' only if the prefix is unique) without picking a suggestion, click Search.
**Expected:**
- Each variant: exactly one row 'PA901 / PlanFirst1 / PlanAuto1', count '(1) Record Found'.
- Id variant request: GET /api/v2/pim/employees?limit=50&offset=0&model=detailed&employeeId=PA901&includeEmployees=onlyCurrent&sortField=employee.firstName&sortOrder=ASC.
- Autocomplete suggestions request: GET /api/v2/pim/employees?nameOrId=PlanFirst1&includeEmployees=onlyCurrent; picking an option searches with empNumber=<n> (e.g. empNumber=257).
- Free text searches with nameOrId=<text> (partial match works: 'PlanFirst2' returned PlanFirst2 PlanAuto2).

#### PIM-UI-004 Combined drop-down filters apply AND logic across Employment Status, Job Title and Sub Unit
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create employee via API, then PUT /pim/employees/<n>/job-details {jobTitleId:9 (QA Engineer), empStatusId:1 (Freelance), subunitId:4 (Development)}. Ids come from GET /admin/job-titles?limit=0, /admin/employment-statuses?limit=0, /admin/subunits; in the test resolve them by name rather than hard-coding.
2. Open Employment Status, Job Title and Sub Unit drop-downs one by one and read the options.
3. Fill Employee Id with the employee's id; select Employment Status 'Freelance', Job Title 'QA Engineer', Sub Unit 'Development'; click Search.
4. Change Employment Status to 'Full-Time Contract' and click Search.
**Expected:**
- Options observed: Employment Status: '-- Select --', apprenticeship, Freelance, Full-Time Contract, Full-Time Permanent, Full-Time Probation, Part-Time Contract, Part-Time Internship. Job Title list has ~35 entries (includes 'QA Engineer'). Sub Unit: '-- Select --', OrangeHRM, Administration, Engineering, Development, Quality Assurance, TechOps, Sales & Marketing, Sales, Marketing, Client Services, Technical Support, Finance, Human Resources, ... (options come from Admin data; compare against API rather than hard-coding).
- Step 3 returns one row: 'PA901 PlanFirst1 PlanAuto1 QA Engineer Freelance Development', request has employeeId=..&empStatusId=1&jobTitleId=9&subunitId=4.
- Step 4: 'No Records Found' (count text and info toast), request empStatusId=2.

#### PIM-UI-005 Searching by a parent Sub Unit also returns employees of its child sub units
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create employee and PUT job-details with subunitId of 'Development' (id 4, child of 'Engineering' id 3).
2. Fill Employee Name or Id for that employee, choose Sub Unit 'Engineering' (parent), click Search.
**Expected:**
- Request has subunitId=3; the row for the child-unit employee is returned with Sub Unit column 'Development'; count '(1) Record Found'.
- The hierarchy is only visible via the Admin API (/admin/subunits); option text in the list has no indentation in textContent.

#### PIM-UI-006 Search with no matching record shows No Records Found in count and info toast
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Employee List.
2. Fill Employee Id with a random never-used value (e.g. 'ZZ' + 8 random chars).
3. Click Search.
**Expected:**
- Table body has zero rows (.oxd-table-body still exists), count element text is exactly 'No Records Found'.
- Toast with class oxd-toast--info shows title 'Info' and message 'No Records Found'.

#### PIM-UI-007 Reset clears every search criterion and reloads the default list
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Employee List and record the default count.
2. Fill Employee Name (free text), Employee Id, select Employment Status (e.g. 'Freelance') and Include 'Past Employees Only'; click Search.
3. Click Reset.
**Expected:**
- Step 2 gives a filtered result (the combination used while exploring gave 'No Records Found' plus info toast; request had employeeId=..&empStatusId=1&includeEmployees=onlyPast).
- After Reset: Employee Name and Employee Id empty, Employment Status '-- Select --', Include 'Current Employees Only', default list reloaded (count equals the default, e.g. '(169) Records Found' in the session), a new default request (includeEmployees=onlyCurrent, no filters) is sent.
- Reset does not reset the column sort that was last chosen (sortField persisted in requests) - see Discrepancies/notes.

#### PIM-UI-008 Include filter separates current and past employees after termination and re-activation
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create an employee via API (PA903).
2. Terminate via POST /api/v2/pim/employees/<n>/terminations {"date":"yyyy-mm-dd","terminationReasonId":1} (omit note). Reasons from GET /pim/termination-reasons (id 1 = Other).
3. Search by Employee Id with Include 'Current Employees Only'.
4. Search with Include 'Past Employees Only', then with 'Current and Past Employees'.
5. Open /web/index.php/pim/viewJobDetails/empNumber/<n>, click button 'Activate Employment'. Then repeat the search with Current Employees Only.
**Expected:**
- Step 3: 'No Records Found' count + info toast.
- Step 4: both searches return '(1) Record Found' with Last Name cell 'PlanAuto3 (Past Employee)' (the suffix ' (Past Employee)' is appended in the Last Name cell). Requests use includeEmployees=onlyPast and includeEmployees=currentAndPast.
- Step 5: Job page shows section 'Employee Termination / Activiation' (sic, typo in app) with 'Terminated on: <date>' and button 'Activate Employment'; click shows toast 'Success' / 'Successfully Updated'; request DELETE /api/v2/pim/employees/<n>/terminations -> 200. The employee is listed again under Current Employees Only with plain last name.

#### PIM-UI-009 Sorting a column ascending and descending orders the rows accordingly
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the list (best: create 3 employees with common last name and filter by it, so the comparison is deterministic; the full list contains mixed-case, numeric and blank values).
2. Click the sort icon in the 'Last Name' header cell; read the menu.
3. Choose 'Ascending'; read the Last Name cells.
4. Open the menu again; choose 'Descending'; read the cells.
5. Repeat for 'Id'.
**Expected:**
- Menu shows exactly 'Ascending' and 'Descending'.
- Requests: sortField=employee.lastName&sortOrder=ASC / DESC; sortField=employee.employeeId&sortOrder=ASC / DESC (default sort is employee.firstName ASC).
- Observed on the full list: Last Name ASC starts '010Z','444444','5TlV','90jsnd','<b>x</b> swarmm1','Akunuri'; DESC starts 'zguczzwxfazguczzwxfa','yaTQBtZgLf','Verma'. Id ASC starts with blank ids, then '0001','0007','0034'; Id DESC starts 'PS_4837','PA903','PA902','PA901','kkt'. Ordering is case-insensitive (MySQL collation) so assert with a case-insensitive comparator on own data only.

#### PIM-UI-010 Pagination shows at most 50 rows per page and keeps search criteria between pages
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the list, choose Include 'Current and Past Employees', click Search.
2. Count rows on page 1 and read the pagination buttons.
3. Click the next arrow (last button of the Pagination Navigation).
4. Read rows, count text, Include value and selected page.
**Expected:**
- Page 1: 50 rows, count '(166) Records Found' (value varies), pagination buttons '1','2','3','4' plus chevron-left and chevron-right icon buttons.
- Request page 1: limit=50&offset=0&...includeEmployees=currentAndPast; page 2: offset=50 with the same includeEmployees.
- Page 2: 50 rows, class ...--page-selected on button '2', Include still 'Current and Past Employees', count unchanged. Precondition (more than 50 records) holds on the demo; if not, skip with explicit precondition check by API.

## Delete Employee

#### PIM-UI-011 Delete confirmation dialog shows the warning and No, Cancel keeps the record
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create an employee via API; search by Employee Id.
2. Click the trash button of the row.
3. Read the dialog.
4. Click 'No, Cancel'.
**Expected:**
- Dialog (role=dialog) text: 'Are you Sure?' / 'The selected record will be permanently deleted. Are you sure you want to continue?'; buttons: close '×', 'No, Cancel', 'Yes, Delete'.
- After cancel the dialog closes, row is still listed ((1) Record Found), no DELETE request is sent.

#### PIM-UI-012 Deleting a single employee shows Successfully Deleted and removes them from every search
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create an employee via API; search by Employee Id.
2. Click trash then 'Yes, Delete'.
3. Search again by Employee Id with Include 'Current and Past Employees'.
**Expected:**
- Toast title 'Success', message 'Successfully Deleted'; request DELETE /api/v2/pim/employees body {"ids":[<empNumber>]} -> 200 response {"data":["<empNumber>"],"meta":[],"rels":[]}.
- The table refreshes automatically: after delete the list showed 'No Records Found' for the filter.
- Step 3: 'No Records Found' (count + info toast).

#### PIM-UI-013 Bulk delete removes all selected employees and header checkbox toggles the page selection
**Seed:** tests/seed.spec.ts
**Steps:**
1. Create 3 employees via API with the same unique last name (e.g. PlanAutoBulk + suffix).
2. Type the last name in Employee Name (free text) and click Search; expect '(3) Records Found'.
3. Click the header checkbox, check all rows, click it again, check none.
4. Tick the checkbox of two rows.
5. Click 'Delete Selected', confirm 'Yes, Delete'.
**Expected:**
- Step 3: all 3 row checkboxes checked and count text becomes '(3) Records Selected' followed by 'Delete Selected'; after untick, back to '(3) Records Found'.
- Step 4: text becomes '(2) Records Selected'; the button label is only 'Delete Selected' (the count is NOT inside the button, see Discrepancies).
- Step 5: same dialog as PIM-UI-011; toast 'Success' / 'Successfully Deleted'; request DELETE /pim/employees body {"ids":[a,b]}; one row remains and count '(1) Record Found'.

#### PIM-UI-014 Logged-in Admin cannot select or delete their own employee record
**Seed:** tests/seed.spec.ts
**Steps:**
1. Read the logged-in user name from the user dropdown (shows 'John Doe'; the employee is John Mike Doe, Employee Id 55555, empNumber 7; resolve it via GET /admin/users?username=Admin -> data[0].employee).
2. Search Employee Id 55555 (or the id obtained from the API).
3. Inspect the row Actions cell and checkbox cell.
**Expected:**
- One row: '55555 / John Mike / Doe / HR Manager / Full-Time Permanent / Human Resources'.
- Actions cell has only the pencil (edit) button; there is no trash button (count of .bi-trash = 0). This part matches the case.
- A checkbox element IS rendered and visible in the row; clicking its label toggles it visually (isChecked true) but the count text stays '(1) Record Found' and no 'Delete Selected' button appears, i.e. the row cannot actually be selected. The test case wording 'No selectable checkbox' therefore needs to be asserted as: no 'Delete Selected' button after attempting to tick, no trash icon.

## Observed API calls
- Default load: GET /web/index.php/api/v2/pim/employees?limit=50&offset=0&model=detailed&includeEmployees=onlyCurrent&sortField=employee.firstName&sortOrder=ASC (200). Also on load: GET /api/v2/admin/employment-statuses?limit=0, /api/v2/admin/job-titles?limit=0, /api/v2/admin/subunits.
- Search by Employee Id: same URL with &employeeId=PA901 (parameter order: limit, offset, model, employeeId, empStatusId, includeEmployees, jobTitleId, subunitId, sortField, sortOrder; also nameOrId / empNumber when name used).
- Name typing (autocomplete): GET /api/v2/pim/employees?nameOrId=<text>&includeEmployees=onlyCurrent. Free text search: ...&nameOrId=<text>... ; picked suggestion: ...&empNumber=<n>...
- Filters: empStatusId=<id>, jobTitleId=<id>, subunitId=<id> (parent unit id returns children), includeEmployees=onlyCurrent | onlyPast | currentAndPast; supervisorName param exists on the page for Supervisor Name (not exercised).
- Sort: sortField=employee.firstName|employee.lastName|employee.employeeId (others not exercised) & sortOrder=ASC|DESC. Sort choice persists across later Searches in the same page session.
- Pagination: offset=50 for page 2, limit=50 always.
- Delete: DELETE /api/v2/pim/employees, body {"ids":[257]} (bulk: {"ids":[265,267]}), response {"data":["257"],"meta":[],"rels":[]}, status 200.
- Setup helpers verified: POST /pim/employees (200, returns empNumber), PUT /pim/employees/{n}/job-details (200), POST /pim/employees/{n}/terminations (200; 422 with invalidParamKeys [note] if note is empty string), DELETE /pim/employees/{n}/terminations (200, re-activate), GET /pim/termination-reasons.

## Discrepancies
1. PIM-UI-013 / PIM-FR-004-AC4: test case expects the 'Delete Selected' button to show '(2)'. Live app: button label is only 'Delete Selected'; the selected count is in a separate text '(2) Records Selected' that replaces '(N) Records Found' next to the button.
2. PIM-UI-014 / PIM-FR-004-AC6: case expects no selectable checkbox for the Admin's own row. Live app: row has no trash icon (OK) but still renders a visible, toggleable checkbox; ticking it does not register a selection (count stays '(1) Record Found', no Delete Selected button).
3. PIM-UI-001 / PIM-FR-001-AC2 and PIM-UI-003: count text is singular '(1) Record Found' for one row (case text for UI-003 matches; BRD wording '(N) Records Found' only applies for N != 1).
4. PIM-UI-006: info toast has title 'Info' and message 'No Records Found' (matches); count element text is 'No Records Found' without parentheses.
5. PIM-UI-002: after browser Back the list is not restored to the previous search; the search must be repeated.
6. PIM-UI-007: Reset restores default criteria but the previously chosen sort order is kept (sortField/sortOrder in subsequent requests unchanged). Reset itself fires the default request.
7. PIM-UI-008: past employees appear with ' (Past Employee)' appended to the Last Name cell (not in case/BRD). Job page termination block title has typo 'Employee Termination / Activiation' and displays the date as 'Terminated on: 2026-20-10' for a termination dated 2026-10-20 (day/month swapped in display), outside scope but noticed. Re-activation toast is 'Successfully Updated'.
8. PIM-UI-010: precondition holds (166 records, 4 pages); record total is volatile on the shared demo (166 at first load, 169 after adding 3 employees, later 166 for Current and Past) so assert relative values only.
9. PIM-UI-014: the logged-in user's displayed name is 'John Doe' but the employee record is 'John Mike Doe' (First (& Middle) Name column shows 'John Mike'); search by Employee Id (55555) or via the Admin users API, not by the dropdown text alone.
10. PIM-UI-003 free-text variant: a partial text matches by nameOrId over first/middle/last name and id; use a unique string to avoid matching shared demo data.
11. Locators: Delete confirmation dialog has no heading role; sort dropdown li items are present in the DOM for every header, so locators must be scoped to the header cell.

## Test Scenarios

### 1. Employee List and Delete Employee

**Seed:** `tests/seed.spec.ts`

#### 1.1. PIM-UI-001 to PIM-UI-014 (see headings in plan body)

**File:** `tests/ui/pim/employee-list.spec.ts`

**Steps:**
  1. See the detailed per-TC sections in the saved plan.
    - expect: All 14 TCs covered; see Discrepancies
