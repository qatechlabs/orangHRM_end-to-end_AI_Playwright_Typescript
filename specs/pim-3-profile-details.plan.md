# PIM Plan 3 of 6: Profile tabs (Personal, Contact, Emergency, Dependents, Immigration)

## Application Overview

# PIM Plan 3 of 6: Profile tabs Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration

Covers PIM-UI-034..051 on OrangeHRM OS 5.9 demo. Explored live as Admin on employee empNumber 296 (Plan PlanAutoP3A, Employee Id 0497) plus a second employee 297 (PlanAutoP3B, id P3B77, work email planautop3b@example.com). Both were DELETED at the end (verified nameOrId=PlanAutoP3 returns total 0). Date format of the app is **yyyy-dd-mm** (day before month) in every date input and every table cell; the REST API uses ISO yyyy-mm-dd. Profile URLs (empNumber n): Personal `/web/index.php/pim/viewPersonalDetails/empNumber/n`, Contact `/pim/contactDetails/empNumber/n`, Emergency `/pim/viewEmergencyContacts/empNumber/n`, Dependents `/pim/viewDependents/empNumber/n`, Immigration `/pim/viewImmigration/empNumber/n`. Side-menu tab links (role tab > link, in order): Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships. Data setup in tests: POST /api/v2/pim/employees (see plan 2) and the tab endpoints below. Message and toast timings: field messages after blur may need ~1 s (async validation calls), use auto-waiting `expect(...).toBeVisible()`/`toHaveText`; table lists refresh ~1-2 s after a toast, wait for the row, not a timeout. Toasts auto-hide in ~3-5 s; `locator('.oxd-toast').waitFor()` right after the click.

---

## Personal Details
**Seed:** tests/seed.spec.ts

Form 1 (main, first `Save`): First/Middle/Last Name (placeholders `First Name`, `Middle Name`, `Last Name`, group label `Employee Full Name*`), `Employee Id` (text, no placeholder), `Other Id` (text), `Driver's License Number` (text), `License Expiry Date` (date picker, placeholder `yyyy-dd-mm`), `Nationality` (oxd-select, 194 options + `-- Select --`, e.g. `Indian`), `Marital Status` (oxd-select: `-- Select --`, `Single`, `Married`, `Other`), `Date of Birth` (date picker), `Gender` (radios `Male`, `Female`; none selected by default). Buttons: `Save` (first) and hint `* Required`. Form 2 `Custom Fields` (second `Save`): `Blood Type` (oxd-select: -- Select --, A+, A-, B+, B-, O+, O-, AB+, AB-) and `Test_Field` (text). Then an `Attachments` section (`Add` button, table with `No Records Found`). Toast main form: `Success` / `Successfully Updated`. Toast Custom Fields: `Success` / `Successfully Saved` (note: Saved, not Updated).

#### PIM-UI-034 Personal details are saved with Successfully Updated and persist after reload
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee created via API. Open `/web/index.php/pim/viewPersonalDetails/empNumber/<n>`; wait for `getByRole('heading',{name:'Personal Details'})` and for the Custom Fields section (data loads async; Employee Id input is non-empty).
2. Click the Nationality select (`.oxd-input-group:has-text("Nationality") .oxd-select-text`): options listbox (role listbox, role option) lists nationalities starting `-- Select --`, `Afghan`, `Albanian` ... ending `Zimbabwean` (194 options incl. placeholder, contains `Indian`). Pick `getByRole('option',{name:'Indian'})`. Open Marital Status: options `-- Select --`, `Single`, `Married`, `Other`; pick `Married`. Check the Gender radios `Male` / `Female`.
3. Fill Other Id `OT<unique>`, Driver's License Number `DL<unique>`; License Expiry Date type `yyyy-dd-mm` e.g. `2028-25-10` (= 25 Oct 2028, "+2 years"); Date of Birth type `1990-15-06` (day 15, month 06); press Escape after each date; click label of Female (`.oxd-radio-wrapper:has-text("Female") label`).
4. Click the first `Save`; read the toast immediately.
5. Reload the URL; wait for data; read every field.
**Expected:**
- Toast text `Success\n\nSuccessfully Updated\n\n×`; no error messages.
- Request `PUT /web/index.php/api/v2/pim/employees/<n>/personal-details` -> 200, body `{"lastName","firstName","middleName":"","employeeId":"0497","otherId":"OT..","drivingLicenseNo":"DL..","drivingLicenseExpiredDate":"2028-10-25","gender":"2","maritalStatus":"Married","birthday":"1990-06-15","nationalityId":82}` (Indian = 82; Female = "2", Male = "1"; empty dates are sent as null, empty nationality omitted/null, gender null when unset).
- After reload: Other Id, License, `License Expiry Date` shows `2028-25-10`, Nationality `Indian`, Marital `Married`, `Date of Birth` shows `1990-15-06`, Female radio checked (verified live).
- The Custom Fields form is a separate save (`PUT /pim/employees/<n>/custom-fields` body `{"custom1":"A+","custom2":"tf1"}` -> toast `Successfully Saved`). Not part of the case; do not click the main Save expecting custom fields to be stored.
- Typing `yyyy-dd-mm` works with fill(); the calendar popup (title `October 2026`, weekday headers, buttons `Today`, `Clear`, `Close`) does not need to be used. Press Escape or click another field before Save (see Locators).

#### PIM-UI-035 Renaming an employee updates the profile header and the Employee List
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Personal Details of an API-created employee (First `Plan`, Last `PlanAuto<unique>`).
2. `getByPlaceholder('First Name').fill('Renamed')`; click the first `Save`; read the toast.
3. Read the header `.orangehrm-edit-employee-name h6` without reloading, then reload the page and read it again.
4. Open `/web/index.php/pim/viewEmployeeList`, search Employee Id (see plan 1 locators) or `GET /api/v2/pim/employees?nameOrId=<lastName>`.
**Expected:**
- Toast `Success` / `Successfully Updated` (PUT personal-details 200).
- The header does NOT refresh in place: it still showed `Plan PlanAutoP3A` 6 s after the save; after reloading it shows `Renamed PlanAutoP3A` (see Discrepancies 3).
- The list/API shows firstName `Renamed` for that employee (API `GET /pim/employees?nameOrId=PlanAutoP3` returned the updated record; list row not opened in UI).

#### PIM-UI-036 Invalid date formats in Date of Birth and License Expiry Date are rejected
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Personal Details. Variant A: `License Expiry Date` (first `getByRole('textbox',{name:'yyyy-dd-mm'})`) fill `abcd`; Date of Birth (second) fill `31-02-2020`. Click the first `Save`.
2. Variant B (from the case): Date of Birth `15/06/1990`, License Expiry Date `2026-31-02`. Click `Save`.
3. Read `.oxd-input-field-error-message` in each group; check the network log.
**Expected:**
- Under both `License Expiry Date` and `Date of Birth`: `Should be a valid date in yyyy-dd-mm format` (verified for `abcd`, `31-02-2020`, `15/06/1990`, `2026-31-02` (day 31, month 02 is invalid)).
- No `PUT .../personal-details` is sent; no toast. The message references the localization format `yyyy-dd-mm` (so assert via that exact string for the default config).

#### PIM-UI-037 Other Id and Driver License accept 30 characters, reject 31, and edited Employee Id stays unique
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: two API-created employees A and B (B has Employee Id e.g. `P3B77`).
2. On A open Personal Details; fill `Other Id` with 31 chars and `Driver's License Number` with 31 chars; click `Save`. Read messages. Then fill 30 chars and confirm messages disappear.
3. Fill `Employee Id` of A with B's id (`P3B77`) and click `Save`; wait ~2 s.
**Expected:**
- 31 chars: `Should not exceed 30 characters` under Other Id and under Driver's License Number (shown on Save, no PUT sent). 30 chars: no message.
- Duplicate Employee Id: **NOT rejected**. No `Employee Id already exists` message, no `core/validation/unique` call fires on this page, and `PUT .../personal-details` returned 200 with `employeeId: "P3B77"` (two employees then share the id). The case expectation fails; mark `test.fail()` with an issue annotation and restore the original id in teardown (see Discrepancies 1). Employee Id max length error was not probed here.

#### PIM-UI-038 Saving Personal Details does not change data on other profile tabs
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee created via API with contact details (`PUT /api/v2/pim/employee/<n>/contact-details` e.g. `{"street1":"1 Main St","city":"Austin"}`) and job title set (job tab not explored in this chunk; use plan 4).
2. On Personal Details select Marital Status `Married` and click the first `Save` -> toast.
3. Open Contact Details tab (`getByRole('link',{name:'Contact Details'})`) and Job tab.
**Expected:**
- Toast `Success` / `Successfully Updated`. The personal-details PUT body only contains personal fields (see PIM-UI-034), so Contact Details still shows the values saved earlier (verified that Contact Details persists across a reload; the explicit cross-tab check after a Personal save was not run live because the endpoints are disjoint). Job tab not verified in this chunk.

---

## Contact Details
**Seed:** tests/seed.spec.ts

Heading `Contact Details`; sub-headings `Address`, `Telephone`, `Email`. Groups (all plain text inputs without placeholder unless noted): `Street 1`, `Street 2`, `City`, `State/Province`, `Zip/Postal Code`, `Country` (oxd-select, 240 options incl. `-- Select --`, e.g. `United States`), `Home`, `Mobile`, `Work`, `Work Email`, `Other Email`. One `Save` button, hint `* Required` (no field is mandatory). Attachments section below (Add, empty table `No Records Found`). Toast: `Success` / `Successfully Updated`.

#### PIM-UI-039 Contact details with a US address use the state drop-down and persist after save
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/web/index.php/pim/contactDetails/empNumber/<n>`; wait until the data GET finished.
2. Click `.oxd-input-group:has-text("Country") .oxd-select-text`, choose `getByRole('option',{name:'United States',exact:true})`.
3. Inspect the `State/Province` control (wait ~1.5 s).
4. Fill Street 1 `1 Main St`, City `Austin`, State/Province `Texas`, Zip `73301`, Mobile `+1 (512) 555-0100`, Work Email `auto<unique>@example.com`; click `Save`.
5. Reload; read all values.
**Expected:**
- After choosing United States the State/Province stays a plain text input (no drop-down, no extra request such as a states list). The case expectation "State/Province becomes a drop-down of states" is not met in OrangeHRM 5.9 (Discrepancies 2). Type `Texas` into the text input.
- Before the PUT the UI calls `GET /api/v2/pim/employees/<n>/contact-details/validation/work-emails?workEmail=<email>` -> `{"data":{"valid":true},"meta":[],"rels":[]}`; then `PUT /api/v2/pim/employee/<n>/contact-details` (note singular `employee`) body `{"street1":"1 Main St","street2":"","city":"Austin","province":"Texas","countryCode":"US","zipCode":"73301","homeTelephone":null,"workTelephone":null,"mobile":"+1 (512) 555-0100","workEmail":"..","otherEmail":null}` -> 200. Toast `Success` / `Successfully Updated`.
- After reload all values are retained: Country `United States`, State/Province `Texas`.

#### PIM-UI-040 Telephone fields reject letters and symbols other than + - / ( )
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Contact Details. Fill `Home` with `12ab34`, `Mobile` with `555#123`, `Work` with `+1 (212) 555-01/22`; blur each (Tab).
2. Read the message in each group.
**Expected:**
- Home and Mobile: `Allows numbers and only + - / ( )` (appears on blur/input, no Save needed). Work valid variant: no message (and saves).
- Same text under the Emergency Contacts telephone fields (`abc` in Home Telephone).

#### PIM-UI-041 Invalid email formats are rejected with Expected format admin@example.com
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Contact Details. For each of `plainaddress`, `a@b`, `a@@example.com`, `a b@example.com` fill `Work Email`, blur, read the message, click `Save`.
2. Control: `a@b.co` (and `a@b.c`) then Save.
**Expected:**
- Message `Expected format: admin@example.com` under Work Email for all four (visible on blur already; remains after Save); no toast, no PUT.
- `a@b.co` / `a@b.c` are accepted (toast `Successfully Updated`) - the validator only needs `x@y.z`. Other Email uses the same rule (length check observed; format not probed).

#### PIM-UI-042 Work Email already used by another employee, or equal to Other Email, is rejected
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee B with Work Email set via `PUT /api/v2/pim/employee/<B>/contact-details {"workEmail":"<bEmail>"}` (200).
2. On A: fill `Work Email` with B's email; blur; click `Save`.
3. Fill Work Email and Other Email both `same<unique>@example.com`; blur; click `Save`.
**Expected:**
- Variant 1: `Already exists` under Work Email (shown on blur via `GET .../contact-details/validation/work-emails?workEmail=..`, stays after Save); no PUT, no toast.
- Variant 2: `Work Email and Other Email cannot be the same` shown under BOTH Work Email and Other Email (after blur, uses `.../validation/other-emails?otherEmail=..`); Save blocked.

#### PIM-UI-043 Contact field length limits: address 70, zip 10, phone 25, email 50
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Contact Details. For each field fill max+1 characters and blur: Street 1 (71), Street 2 (71), City (71), State/Province (71), Zip/Postal Code (11 digits), Home / Mobile / Work (26 digits), Work Email / Other Email (51 chars, e.g. 39 `a` + `@example.com`).
2. Read the message; then fill max characters (70, 70, 70, 70, 10, 25, 50) and read again.
**Expected:**
- Over the limit: `Should not exceed 70 characters` (Street 1/2, City, State), `Should not exceed 10 characters` (Zip), `Should not exceed 25 characters` (Home/Mobile/Work), `Should not exceed 50 characters` (emails). At max length the message disappears (email check is asynchronous: allow ~1 s, use auto-waiting `toBeHidden`; in a 0.5 s fixed wait the stale message was still shown).

---

## Emergency Contacts
**Seed:** tests/seed.spec.ts

Page has section `Assigned Emergency Contacts` (h6) with `Add` button (`getByRole('button',{name:'Add'}).first()`; a second `Add` belongs to the `Attachments` section), a table (header checkbox, `Name`, `Relationship`, `Home Telephone`, `Mobile`, `Work Telephone`, `Actions`) and `No Records Found` when empty. `Add` opens an inline form above the table, h6 `Save Emergency Contact` (for edit: `Edit Emergency Contact`), fields `Name*`, `Relationship*`, `Home Telephone`, `Mobile`, `Work Telephone` (all text), `* Required`, buttons `Cancel`, `Save`. Rows (`.oxd-table-card`) have a header-style checkbox, and action buttons trash (`.bi-trash`) and pencil (`.bi-pencil-fill`) (no accessible name). Delete dialog (`.oxd-dialog-container-default`): `Are you Sure?` / `The selected record will be permanently deleted. Are you sure you want to continue?` with buttons `No, Cancel`, `Yes, Delete`; toast `Success` / `Successfully Deleted`. After selecting a row (or the header checkbox, `.oxd-table-header .oxd-checkbox-wrapper`) a text `(n) Records Selected` and a red `Delete Selected` button appear above the table.

#### PIM-UI-044 Emergency contact can be added, edited and deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/web/index.php/pim/viewEmergencyContacts/empNumber/<n>`; click `Add`.
2. Fill Name `Jane Doe`, Relationship `Sister`, Mobile `0771234567`; click `Save` (inside the form).
3. In the new row click the pencil; read the form; set Relationship `Brother`; `Save`.
4. Click the trash in the row, `Yes, Delete`.
**Expected:**
- Add: toast `Success` / `Successfully Saved`; `POST /api/v2/pim/employees/<n>/emergency-contacts` body `{"name":"Jane Doe","relationship":"Sister","homePhone":"","officePhone":"","mobilePhone":"0771234567"}` -> 200; the list `GET .../emergency-contacts?limit=50&offset=0` returns `{"data":[{"id":"1","name":..,"relationship":..,"homePhone":"","officePhone":"","mobilePhone":".."}],"meta":{"empNumber":n,"total":1},"rels":[]}`. Row text cells: `Jane Doe`, `Sister`, (Home empty), `0771234567`, (Work empty). The row appears ~1-2 s after the toast.
- Edit: heading `Edit Emergency Contact`; form pre-filled (Name=Jane Doe, Relationship=Sister, Mobile=0771234567; `GET .../emergency-contacts/1`); after Save toast `Success` / `Successfully Updated` (`PUT .../emergency-contacts/1` body adds `"id":"1"`); row shows `Brother` after the list refetch (wait for the text).
- Delete: dialog as above; `DELETE .../emergency-contacts` body `{"ids":["1"]}` -> 200; toast `Successfully Deleted`; row gone and `No Records Found` returns. Note the table briefly shows zero rows while it reloads.

#### PIM-UI-045 Emergency contact requires Name, Relationship and at least one telephone
**Seed:** tests/seed.spec.ts
**Steps:**
1. Click `Add`, then `Save` on the empty form.
2. Fill Name `Jane Doe` and Relationship `Sister` only; click `Save`.
**Expected:**
- Empty form: `Required` under Name, `Required` under Relationship, and `At least one phone number is required` shown under `Home Telephone` only (three messages total); no POST, no toast.
- After Name + Relationship only: the phone message remains (under Home Telephone); not saved. The message clears once any phone field has a value (not asserted).

#### PIM-UI-046 Multiple emergency contacts can be bulk-deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: two contacts via `POST /api/v2/pim/employees/<n>/emergency-contacts` (e.g. `{"name":"John Roe","relationship":"Friend","homePhone":"0112223334","officePhone":"","mobilePhone":""}`); open the tab.
2. Click the header checkbox (`.oxd-table-header .oxd-checkbox-wrapper`); read the strip above the table.
3. Click `getByRole('button',{name:'Delete Selected'})`, then `Yes, Delete`.
**Expected:**
- Text `(2) Records Selected` and button `Delete Selected` appear (also with a single row ticked: `(1) Records Selected`).
- Same dialog as single delete. One request `DELETE .../emergency-contacts` body `{"ids":["a","b"]}` -> 200; toast `Success` / `Successfully Deleted`; table shows `No Records Found`.

#### PIM-UI-047 Emergency contact Name and Relationship reject 101 characters
**Seed:** tests/seed.spec.ts
**Steps:**
1. Click `Add`; fill Name with 101 chars and Relationship with 101 chars; blur.
2. Reduce both to 100 chars.
**Expected:**
- `Should not exceed 100 characters` under Name and under Relationship; at 100 chars the messages disappear (the phone-required message remains until a phone is entered). Phone fields in this form allow up to 30 chars (31 -> `Should not exceed 30 characters`), not 25 (Discrepancies 5).

---

## Dependents
**Seed:** tests/seed.spec.ts

Section `Assigned Dependents` with `Add`, table columns header checkbox, `Name`, `Relationship`, `Date of Birth`, `Actions`; same row/trash/pencil/dialog/bulk-delete controls as Emergency Contacts. The `Add` form (h6 `Add Dependent`, edit: `Edit Dependent`) has `Name*` (text), `Relationship*` (oxd-select: `-- Select --`, `Child`, `Other`), `Please Specify*` (text, appears only when Relationship = Other), `Date of Birth` (date picker, placeholder `yyyy-dd-mm`), `Cancel`, `Save`.

#### PIM-UI-048 Dependent with Relationship Other requires Please Specify and can be edited and deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/web/index.php/pim/viewDependents/empNumber/<n>`; click `Add`.
2. Name `Kid One`; open Relationship select, choose `Other` -> a `Please Specify*` input appears between Relationship and Date of Birth.
3. Click `Save` without Please Specify; read errors.
4. Fill Please Specify `Nephew`, Date of Birth `2015-10-03` (= 10 March 2015 in yyyy-dd-mm); click elsewhere (e.g. the Name label) then `Save`.
5. Click the pencil on the row; change Relationship to `Child`; `Save`.
6. Click the trash, `Yes, Delete`.
**Expected:**
- Step 3: `Required` under `Please Specify` only (no toast, no POST). 101 chars in Please Specify or Name: `Should not exceed 100 characters`.
- Step 4: toast `Success` / `Successfully Saved`; `POST .../dependents` body `{"name":"Kid One","relationshipType":"other","relationship":"Nephew","dateOfBirth":"2015-03-10"}` -> 200; row cells: `Kid One`, `Nephew` (the Relationship column shows the specified text for Other), `2015-10-03`. WARNING: the first `Save` click right after typing the date and pressing Escape did nothing (no request); a second click saved. Click a neutral element first (see Locators).
- Step 5: heading `Edit Dependent`, form pre-filled (Relationship `Other`, Please Specify `Nephew`, DOB `2015-10-03`); changing to `Child` hides Please Specify; toast `Successfully Updated`; `PUT .../dependents/1` body `{"name":"Kid One","relationshipType":"child","relationship":"Nephew","dateOfBirth":"2015-03-10","id":"1"}` (stale relationship text is still sent); the row shows `Child`.
- Step 6: dialog text as in Emergency Contacts; `DELETE .../dependents` `{"ids":["1"]}`; toast `Successfully Deleted`; `No Records Found`.

#### PIM-UI-049 Dependent Name and Relationship are mandatory
**Seed:** tests/seed.spec.ts
**Steps:**
1. Click `Add`, click `Save` with an empty form.
**Expected:**
- `Required` under Name and `Required` under Relationship (no message for Date of Birth); no POST, no toast. Invalid DOB text (`abcd`) shows `Should be a valid date in yyyy-dd-mm format` (extra). API note: the server accepted `POST .../dependents` with `name:""` (200) so the rule is client-side only; a 101-char name returns 422.

---

## Immigration
**Seed:** tests/seed.spec.ts

Form (h6 `Add Immigration`, edit: `Edit Immigration`) above the table `Assigned Immigration Records` (columns header checkbox, `Document`, `Number`, `Issued By`, `Issued Date`, `Expiry Date`, `Actions`). Fields: `Document` radios `Passport` (checked by default, API type 1) and `Visa` (type 2); `Number*` (text); `Issued Date`, `Expiry Date` (date pickers); `Eligible Status` (text); `Issued By` (oxd-select with 240 countries incl. `-- Select --`, e.g. `India`); `Eligible Review Date` (date picker); `Comments` (textarea, placeholder `Type Comments here`); `Cancel`, `Save`. Edit/delete/bulk controls as in Emergency Contacts.

#### PIM-UI-050 Passport record is added with default document type and listed with its details
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/web/index.php/pim/viewImmigration/empNumber/<n>`; click `Add`.
2. Check radio `Passport` is checked and open the Issued By select.
3. Fill Number `P<unique>`, Issued Date = today-1y (e.g. `2025-25-10` for 25 Oct 2025), Expiry Date = today+9y (e.g. `2035-25-10`), Issued By `India`; click a neutral label; click `Save`.
4. Click the pencil, set Number to another value, `Save`.
5. Click the trash, `Yes, Delete`.
**Expected:**
- Passport radio is checked (Visa not); Issued By lists 240 entries (`Afghanistan`, `Albania`, ... `India`).
- Add: toast `Success` / `Successfully Saved`; `POST .../immigrations` body `{"number":"P3A12345","issuedDate":"2025-10-25","expiryDate":"2035-10-25","type":1,"status":"","reviewDate":"","countryCode":"IN","comment":""}` -> 200; list `GET .../immigrations?limit=50&offset=0` -> `{"data":[{"id":"1","number":..,"issuedDate":..,"expiryDate":..,"type":1,"status":null,"reviewDate":null,"country":{"code":"IN","name":"India"},"comment":null}],"meta":{"empNumber":n,"total":1},"rels":[]}`. Row text: `Passport`, `P3A12345`, `India`, `2025-25-10`, `2035-25-10`.
- Edit: heading `Edit Immigration`, form pre-filled (Passport selected, dates in yyyy-dd-mm, Issued By India); toast `Success` / `Successfully Updated` (`PUT .../immigrations/1`); row shows the new Number.
- Delete: same dialog; `DELETE .../immigrations` `{"ids":["1"]}`; toast `Successfully Deleted`; `No Records Found`.

#### PIM-UI-051 Immigration record rejects missing Number and Expiry Date before Issued Date
**Seed:** tests/seed.spec.ts
**Steps:**
1. Click `Add`; click `Save` with Number empty.
2. Fill Number `P3A12345`, Issued Date `2025-01-01`, Expiry Date `2024-01-01` (both are 1 Jan; typed in yyyy-dd-mm), click a neutral element; read messages; click `Save`.
**Expected:**
- Step 1: `Required` under Number; no POST, no toast.
- Step 2: `Expiry date should be after issued date` under Expiry Date (appears on blur, remains after Save; no POST). Equal dates also show it. Extras: `abcd` -> `Should be a valid date in yyyy-dd-mm format`; Number 101 chars -> `Should not exceed 30 characters`; Eligible Status 31+ chars -> `Should not exceed 30 characters`; Comments 251 chars -> `Should not exceed 250 characters`.

---

## Observed API calls
(base `/web/index.php/api/v2`; all JSON; session cookie)
- Profile load: `GET /pim/employees/<n>/personal-details`, `GET /pim/employees/<n>`, `GET /pim/employees/<n>/custom-fields?screen=personal|contact|emergency|dependents|immigration`, `GET /pim/employees/<n>/screen/<screen>/attachments?limit=50&offset=0`.
- Personal save: `PUT /pim/employees/<n>/personal-details` body `{"lastName","firstName","middleName","employeeId","otherId","drivingLicenseNo","drivingLicenseExpiredDate":"yyyy-mm-dd"|null,"gender":"1"|"2"|null,"maritalStatus":"Single|Married|Other|''","birthday":"yyyy-mm-dd"|null,"nationalityId":82}` -> 200 `{"data":{"empNumber","lastName","firstName","middleName","employeeId","otherId","drivingLicenseNo","drivingLicenseExpiredDate","gender":2,"maritalStatus","birthday","terminationId":null,"nationality":{"id":82,"name":"Indian"}},"meta":[],"rels":[]}`. No uniqueness check of employeeId.
- Custom fields save: `PUT /pim/employees/<n>/custom-fields` `{"custom1":"A+","custom2":"tf1"}` -> 200.
- Contact: `GET /pim/employee/<n>/contact-details` (singular employee; the plural path `/pim/employees/<n>/contact-details` returns 404 for GET/PUT); response `{"data":{"street1","street2","city","province","zipCode","countryCode","homeTelephone","workTelephone","mobile","workEmail","otherEmail"},...}`. Save `PUT /pim/employee/<n>/contact-details` (partial bodies accepted, e.g. `{"workEmail":".."}`) -> 200. Validation GETs: `GET /pim/employees/<n>/contact-details/validation/work-emails?workEmail=<enc>` and `.../validation/other-emails?otherEmail=<enc>` -> `{"data":{"valid":true|false},"meta":[],"rels":[]}`.
- Emergency: `GET|POST /pim/employees/<n>/emergency-contacts` (`?limit=50&offset=0`), `GET|PUT /pim/employees/<n>/emergency-contacts/<id>`, `DELETE /pim/employees/<n>/emergency-contacts` `{"ids":["1","2"]}`. Body fields: `name, relationship, homePhone, officePhone, mobilePhone`.
- Dependents: `GET|POST /pim/employees/<n>/dependents`, `GET|PUT .../dependents/<id>`, `DELETE .../dependents` `{"ids":[..]}`. Body: `name, relationshipType ("child"|"other"), relationship (specify text), dateOfBirth`.
- Immigration: `GET|POST /pim/employees/<n>/immigrations`, `GET|PUT .../immigrations/<id>`, `DELETE .../immigrations` `{"ids":[..]}`. Body: `number, issuedDate, expiryDate, type (1 passport, 2 visa), status, reviewDate, countryCode, comment`.
- 422 shape: `{"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":["workEmail"]}}}` (only the first invalid key is reported; seen for contact-details workEmail 'bad', personal-details empty firstName, emergency-contacts empty name, dependents 101-char name, immigrations empty number). The server does NOT validate everything the UI does (dependents with empty name returned 200).
- Cleanup: `DELETE /pim/employees` `{"ids":[296,297]}` -> `{"data":["296","297"],"meta":[],"rels":[]}`; child records go with the employee.

## Locators
- Tab links: `getByRole('tab')` wraps `getByRole('link',{name:'Personal Details'|'Contact Details'|'Emergency Contacts'|'Dependents'|'Immigration'})`. Header name: `.orangehrm-edit-employee-name h6` (not live-updated).
- Main content scope: `.orangehrm-edit-employee-content`. Form scope on record tabs: `page.locator('.orangehrm-edit-employee-content form').first()`; table cards: `page.locator('.oxd-table-card')`; header checkbox: `.oxd-table-header .oxd-checkbox-wrapper`; Add (records): `getByRole('button',{name:'Add'}).first()` (second Add is for Attachments).
- Group helper (FormField style): `page.locator('.oxd-input-group',{hasText:'<Label>'}).first()`; input = `.locator('input')`, textarea = `.locator('textarea')`, select = `.locator('.oxd-select-text')`; error = `.locator('.oxd-input-field-error-message')`. Caution: `hasText:'Name'` also matches 'Employee Full Name'/'Please Specify' groups, use `.first()` carefully or scope to the form; `hasText:'Number'` fine on Immigration; `hasText:'Employee Id'` is unique on Personal Details.
- Personal Details: First/Middle/Last by `getByPlaceholder('First Name'|'Middle Name'|'Last Name')`; Employee Id `locator('.oxd-input-group:has-text("Employee Id") input').first()`; dates `getByRole('textbox',{name:'yyyy-dd-mm'})` nth(0)=License Expiry, nth(1)=Date of Birth; Gender label `.oxd-radio-wrapper:has-text("Female") label` (radio roles `Male`/`Female` have accessible names but need the label click); Save buttons `getByRole('button',{name:'Save'}).first()` (main) / `.nth(1)` (Custom Fields); Blood Type `.oxd-input-group:has-text("Blood Type") .oxd-select-text`.
- Select options: click the `.oxd-select-text`, then `getByRole('option',{name:'<text>',exact:true})` (listbox `.oxd-select-dropdown`). `exact:true` needed for `United States` (also `United States Minor Outlying Islands`) and `India`.
- Dates: `fill('yyyy-dd-mm')` works; the value is parsed on blur. Pressing Escape closes the calendar (`.oxd-date-input-calendar`, buttons `Today`, `Clear`, `Close`, icon `.oxd-date-input-icon`). In the Dependents form the first `Save` click right after fill+Escape was swallowed; after a date, click a neutral element or blur first and use an auto-waiting expect on the toast. For deterministic dates compute `yyyy-dd-mm` from a Date.
- Radio (Immigration Document): `getByRole('radio',{name:'Passport'})` is checked by default; to select Visa click `.oxd-radio-wrapper:has-text("Visa") label`.
- Toast: `page.locator('.oxd-toast')` text `Success\n\n<message>\n\n×`; dialog `.oxd-dialog-container-default`, buttons `getByRole('button',{name:'Yes, Delete'})`, `getByRole('button',{name:'No, Cancel'})`. Bulk bar: text `(n) Records Selected`, `getByRole('button',{name:'Delete Selected'})`.
- Row action buttons: `card.locator('button:has(.bi-trash)')`, `card.locator('button:has(.bi-pencil-fill)')`. Empty state: `getByText('No Records Found')` (an Attachments table below also shows it; scope by section when asserting).

## Discrepancies
1. PIM-UI-037 / PIM-VAL-004: editing Employee Id on Personal Details to another employee's id (`P3B77`) was accepted (PUT 200, no `Employee Id already exists`, no validation call). The case expects the message. 31-char Other Id / License message verified (`Should not exceed 30 characters`).
2. PIM-UI-039 / PIM-FR-011-AC5: with Country `United States` the State/Province field remains a free-text input; no state drop-down appears (OrangeHRM 5.9). Persistence and toast fine.
3. PIM-UI-035: header name and the PIM tab header are not refreshed after saving a rename until the page is reloaded (checked 6 s). List/API show the new name. Assert the header after a reload.
4. PIM-UI-036: the app date format is yyyy-dd-mm (case data mentions "yyyy-dd-mm" itself, consistent). `15/06/1990` and `2026-31-02` both rejected with the expected message.
5. PIM-UI-043 / PIM-VAL-013: phone max is 25 in Contact Details (verified) but 30 in Emergency Contacts telephone fields (31 rejected, 26 accepted); the BRD value was not re-read per field. Case only requires Mobile 26 on Contact Details (ok).
6. PIM-UI-045: `At least one phone number is required` is shown only under Home Telephone (not under all three); acceptable for the case.
7. PIM-UI-048/049: server-side validation is weaker than UI (POST dependents with empty name returned 200); not asserted by the cases. Relationship column shows the specified text (`Nephew`) for Other, not `Other`.
8. PIM-UI-051: Number max 30, Eligible Status max 30, Comments max 250 observed (BRD limits not cross-checked); equal Issued/Expiry dates are also rejected.
9. PIM-UI-038: cross-tab isolation was not exercised end-to-end after a Personal save, and the Job tab was not opened (out of chunk). Case 042's "second employee" requires setting the work email via `PUT /pim/employee/<n>/contact-details`; the plural path 404s.
10. PIM-UI-047/043 timing: validation messages for emails rely on async requests and disappear later than a 0.5 s wait; list refresh after save takes 1-2 s.
11. Not verified: `Visa` document flow, Work Email max on Other Email format validation, Immigration `Eligible Review Date` validation, Custom Fields validation, attachments, employee list row UI for the rename.


## Test Scenarios
