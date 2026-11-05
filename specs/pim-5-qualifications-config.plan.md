# PIM Plan 5 of 6: Qualifications, Memberships, Attachments, Custom Fields, Optional Fields

## Application Overview

Covers PIM-UI-068..077, 079, 080 (plus a note on Manual PIM-UI-078) on OrangeHRM OS 5.9 demo, explored live as Admin on throw-away employee empNumber 404 (First `Plan`, Last `PlanAuto5A`). The employee was DELETED at the end (nameOrId=PlanAuto5 returns total 0). The custom field `PlanAuto5 Field` was created and DELETED; optional-field switches were restored to all OFF (verified via GET /pim/optional-field). The app date format is yyyy-dd-mm in every date input and table cell (`fill('2025-01-01')` works; REST uses ISO yyyy-mm-dd). Common timing rules: lists refresh 1-2 s after the toast (wait for the row, not a timeout); on Edit forms wait ~1 s for the pre-fill GET before typing (a fill typed too early is overwritten and the saved row stays unchanged while the toast still says Updated); click a neutral element (e.g. `* Required` hint) after typing a date before Save. Current count of custom fields on the demo: 2 (`Blood Type` Drop Down, `Test_Field` Text or Number, both Personal Details), header `Remaining number of custom fields: 8`, Add button NOT disabled; the disabled-at-10 behaviour was not verified.

# PIM Plan 5 of 6

## Qualifications
**Seed:** tests/seed.spec.ts

URL `/web/index.php/pim/viewQualifications/empNumber/<n>`; page heading h6 `Qualifications`. Tab links (role tab > link): Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships. Five sections, each with an h6 and a `Add` button (order of Add buttons: 0 Work Experience, 1 Education, 2 Skills, 3 Languages, 4 License, 5 Attachments) and a table (header checkbox + columns + `Actions`), empty state `No Records Found`, otherwise `(n) Record Found`:
- Work Experience: Company, Job Title, From, To, Comment, Actions
- Education: Level, Year, GPA/Score, Actions
- Skills: Skill, Years of Experience, Actions
- Languages: Language, Fluency, Competency, Comments, Actions
- License: License Type, Issued Date, Expiry Date, Actions
- Attachments: File Name, Description, Size, Type, Date Added, Added By, Actions

Only one inline form is open at a time (`page.locator('.orangehrm-edit-employee-content form').first()`, for Attachments `.last()` when no other form is open); the form's heading is `Add Work Experience` / `Add Education` / `Add Skill` / `Add Language` / `Add License` (edit: `Edit ...`). All forms have `* Required`, `Cancel`, `Save`. Row action buttons: `button:has(.bi-pencil-fill)`, `button:has(.bi-trash)`. Delete dialog (`.oxd-dialog-container-default`): `Are you Sure?` / `The selected record will be permanently deleted. Are you sure you want to continue?` with `No, Cancel` / `Yes, Delete`; toast `Success` / `Successfully Deleted`.

#### PIM-UI-068 Work experience is added with mandatory fields and To date must be after From date
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee created via `POST /api/v2/pim/employees` `{"firstName":"Plan","middleName":"","lastName":"PlanAuto5<unique>","employeeId":""}` (returns `data.empNumber`). Open `/web/index.php/pim/viewQualifications/empNumber/<n>`, wait for `getByRole('heading',{name:'Work Experience'})`.
2. Click the first `Add` (`getByRole('button',{name:'Add'}).first()`); heading `Add Work Experience`. Form groups: `Company` (text), `Job Title` (text), `From` and `To` (date inputs, placeholder `yyyy-dd-mm`), `Comment` (textarea). Click `Save` on the empty form.
3. `Cancel` is not needed; fill Company `Acme5`, Job Title `Tester`, From `2024-01-01`, To `2023-01-01` (both day 01 month 01 so From = 1 Jan 2024 is after To = 1 Jan 2023); click `* Required` text (neutral blur); click `Save`.
4. Fix: From `2023-01-01`, To `2024-01-01`, Comment `cmt`; blur; `Save`.
5. Wait for the row; click the row pencil (heading `Edit Work Experience`; wait ~1 s for the pre-fill), set Job Title `Lead`, `Save`.
6. Click the row trash, `Yes, Delete`.
**Expected:**
- Step 2: `Required` under Company and under Job Title only (From/To/Comment have no message); no request, no toast.
- Step 3: `To date should be after from date` (lowercase `from`) under To (appears on blur, stays after Save); no POST, no toast.
- Step 4: toast `Success` / `Successfully Saved`; `POST /api/v2/pim/employees/<n>/work-experiences` body `{"company":"Acme5","jobTitle":"Tester","fromDate":"2023-01-01","toDate":"2024-01-01","comment":"cmt"}` -> 200. Row cells: `Acme5`, `Tester`, `2023-01-01`, `2024-01-01`, `cmt` (the table refreshes after ~1-2 s).
- Step 5: pre-filled values `Acme5`, `Tester`, `2023-01-01`, `2024-01-01`, `cmt`; toast `Successfully Updated`; `PUT .../work-experiences/1` body `{"id":1,"company":"Acme5","jobTitle":"Lead","comment":"cmt","fromDate":"2023-01-01","toDate":"2024-01-01"}`; row shows `Lead` after refetch.
- Step 6: dialog as above; `DELETE .../work-experiences` body `{"ids":[1]}`; toast `Successfully Deleted`; `No Records Found` in the section.

#### PIM-UI-069 Education and License records are added from master data with optional fields
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Qualifications URL of an API-created employee. Click the second `Add` (Education): heading `Add Education`; groups `Level*` (select), `Institute`, `Major/Specialization`, `Year`, `GPA/Score` (text), `Start Date`, `End Date` (dates). Click `Save` empty.
2. Open the Level select (`.oxd-input-group:has-text("Level") .oxd-select-text`), choose `Bachelor's Degree`, click `Save` (only Level).
3. Click `Add` (second) again: choose `Master's Degree`, Institute `MIT`, Major `CS`, Year `2015`, GPA `3.8`, Start `2011-01-09`, End `2015-30-06`; blur; `Save`.
4. Click the fifth `Add` (License): heading `Add License`; groups `License Type*` (select), `License Number`, `Issued Date`, `Expiry Date`. Click `Save` empty.
5. Select License Type `Certified Digital Marketing Professional (CDMP)` (first real option), License Number `L<unique>`, Issued `2024-01-01`, Expiry `2030-01-01`; blur; `Save`.
**Expected:**
- Step 1: `Required` under Level only.
- Step 2: toast `Success` / `Successfully Saved`; `POST .../educations` body `{"educationId":2,"institute":"","major":"","year":null,"score":"","startDate":"","endDate":""}`; row text `Bachelor's Degree` (Year and GPA cells empty).
- Step 3: `POST .../educations` `{"educationId":3,"institute":"MIT","major":"CS","year":2015,"score":"3.8","startDate":"2011-09-01","endDate":"2015-06-30"}`; row `Master's Degree`, `2015`, `3.8` (Institute/Major/dates are not shown in the table).
- Step 4: `Required` under License Type only.
- Step 5: toast `Successfully Saved`; `POST .../licenses` `{"licenseId":1,"licenseNo":"L5001","issuedDate":"2024-01-01","expiryDate":"2030-01-01"}`; row `Certified Digital Marketing Professional (CDMP)`, `2024-01-01`, `2030-01-01`. (Variation seen: Expiry before Issued shows `Expiry date should be after issued date` under Expiry Date.)
- Select options in use are listed in "Master data used". Select the option through `getByRole('option',{name:...})`.

#### PIM-UI-070 A skill cannot be added twice and Years of Experience must be numeric
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Qualifications; click the third `Add` (Skills): heading `Add Skill`; groups `Skill*` (select), `Years of Experience` (text), `Comments` (textarea). Click `Save` empty.
2. Choose Skill `Content Creation`; fill Years of Experience `abc`; click `* Required` text; click `Save`.
3. Fill Years `5`; blur; `Save`.
4. Click `Add` (third) again and open the Skill select.
**Expected:**
- Step 1: `Required` under Skill only.
- Step 2: `Should be a number` under Years of Experience; `-1` gives the same message; `100` gives `Should be less than 100`; no POST.
- Step 3: toast `Success` / `Successfully Saved`; `POST .../skills` body `{"skillId":3,"yearsOfExperience":5,"comments":""}` -> 200; row `Content Creation`, `5`.
- Step 4: the already-assigned skill is NOT offered in the dropdown (list is `-- Select --`, `Copywriting`, `G Suite`, ... without `Content Creation`); the case accepts "not offered". (Server side: a direct duplicate `POST .../skills {"skillId":3,...}` returned 200 and overwrote the years value, so the protection is UI-only.)

#### PIM-UI-071 Language requires Language, Fluency and Competency
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Qualifications; click the fourth `Add` (Languages): heading `Add Language`; groups `Language*`, `Fluency*`, `Competency*` (all oxd-select), `Comments` (textarea). Click `Save` empty.
2. Choose Language `English` (exact), Fluency `Speaking`, Competency `Good`, Comments `lang cmt`; `Save`.
**Expected:**
- Step 1: `Required` under Language, Fluency and Competency (three messages); no POST.
- Step 2: toast `Success` / `Successfully Saved`; `POST .../languages` body `{"languageId":3,"fluencyId":2,"competencyId":3,"comment":"lang cmt"}` -> 200; row `English`, `Speaking`, `Good`, `lang cmt`. Selecting the three selects each needs its own open + `getByRole('option')` click.

---

## Memberships
**Seed:** tests/seed.spec.ts

URL `/web/index.php/pim/viewMemberships/empNumber/<n>`. Sections: `Assigned Memberships` (h6, `Add`, table columns Membership, Subscription Paid By, Subscription Amount, Currency, Subscription Commence Date, Subscription Renewal Date, Actions) and `Attachments`. Form heading `Add Membership`; groups `Membership*` (select), `Subscription Paid By` (select), `Subscription Amount` (text), `Currency` (select), `Subscription Commence Date`, `Subscription Renewal Date` (dates).

#### PIM-UI-072 Membership is saved with subscription details and renewal date must follow commence date
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open the Memberships URL of an API-created employee; click the first `Add`. Click `Save` empty.
2. Select Membership `ACCA`, Paid By `Company`, Amount `100`, Currency `United States Dollar`, Commence `2025-01-01`, Renewal `2024-01-01`; click `* Required`; read messages; click `Save`.
3. Fix Renewal to `2026-01-01`; blur; `Save`.
**Expected:**
- Step 1: `Required` under Membership only.
- Step 2: `Renewal date should be after the commencing date` under Subscription Renewal Date; no POST.
- Step 3: toast `Success` / `Successfully Saved`; `POST .../memberships` body `{"subscriptionFee":"100","subscriptionCommenceDate":"2025-01-01","subscriptionRenewalDate":"2026-01-01","membershipId":4,"subscriptionPaidBy":"Company","currencyTypeId":"USD"}` -> 200; row cells `ACCA`, `Company`, `100.00` (amount is shown with 2 decimals), `United States Dollar`, `2025-01-01`, `2026-01-01`.

---

## Attachments
**Seed:** tests/seed.spec.ts

Attachments block exists at the bottom of Personal Details (`/pim/viewPersonalDetails/empNumber/<n>`, after the `Custom Fields` form), Contact Details, Qualifications, Memberships etc. Screen key in the API for Personal Details is `personal`. Scope: use `getByRole('button',{name:'Add'}).last()` and `page.locator('.orangehrm-edit-employee-content form').last()` on Personal Details (the Attachments form is the last form). Form heading `Add Attachment`: `Select File*` with a `Browse` button and text `No file selected` (hidden `input[type=file]`), hint `Accepts up to 1MB`, `Comment` (textarea, placeholder `Type comment here`), `* Required`, `Cancel`, `Save`. Row action buttons order: pencil (`.bi-pencil-fill`), trash (`.bi-trash`), download (`.bi-download`).

#### PIM-UI-073 Attachment is uploaded with comment, listed with metadata, downloaded identical and deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Personal Details of an API-created employee; wait for the `Custom Fields` heading; click the last `Add` (Attachments).
2. Read the form. Set the file input with `/Users/karthikkodati/Downloads/orangehrm-e2e-ai-playwright/test-data/files/attachment-small.txt` (660 bytes; `browser_file_upload` or `setInputFiles` on `input[type=file]`), Comment `auto attachment`; `Save`.
3. Wait for the row; click the download icon (`button:has(.bi-download)`) while listening for a `download` event.
4. Click the trash, `Yes, Delete`.
**Expected:**
- Form shows `Select File`, `Browse`, `No file selected`, `Accepts up to 1MB`, `Comment`. After choosing a file the name replaces `No file selected`.
- Save: toast `Success` / `Successfully Saved`; `POST /api/v2/pim/employees/<n>/screen/personal/attachments` with `Content-Type: application/json` (NOT multipart), body `{"attachment":{"name":"attachment-small.txt","type":"text/plain","size":660,"base64":"<base64>"},"description":"auto attachment"}` -> 200. List `GET .../screen/personal/attachments?limit=50&offset=0` -> `{"data":[{"id":1,"description":"auto attachment","filename":"attachment-small.txt","size":660,"fileType":"text/plain","attachedBy":1,"attachedByName":"Admin","attachedTime":"21:48","attachedDate":"2026-10-25"}],"meta":{"empNumber":n,"screen":"personal","total":1},"rels":[]}`. Row cells: `attachment-small.txt`, `auto attachment`, `660.00 B`, `text/plain`, `2026-25-10` (today in yyyy-dd-mm), `Admin`.
- Download: the click triggers a browser download (Playwright `download` event) with `suggestedFilename()` = `attachment-small.txt`, `download.url()` = `/web/index.php/pim/viewAttachment/empNumber/<n>/attachId/1`, stream length 660 bytes, content starts `OrangeHRM e2e attachment fixture\nOrangeHRM e2e attachment fixture...` (identical to the fixture; compare bytes with `fs.readFileSync` in the test runner, not inside the MCP sandbox). No separate fetch/XHR is visible in the response log (navigation download).
- Delete: dialog text as above; `DELETE .../screen/personal/attachments` body `{"ids":[1]}`; toast `Successfully Deleted`; `No Records Found`.

#### PIM-UI-074 Attachment over 1 MB, missing file or comment over 200 characters is rejected
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Personal Details; click the last `Add`. Variant A: click `Save` with no file.
2. Variant B: set the file `attachment-large.bin` (1.1 MB); read the message; click `Save`.
3. Variant C: set `attachment-small.txt`, fill Comment with 201 `x`; click `* Required` text; click `Save`; then reduce to 200 `x`.
**Expected:**
- A: `Required` under Select File; no POST, no toast.
- B: `Attachment Size Exceeded` under Select File appears immediately when the file is chosen (before Save) and stays after Save; file name shown `attachment-large.bin`; no POST, no toast.
- C: `Should not exceed 200 characters` under Comment (on blur); no POST on Save. At 200 characters the message disappears.

#### PIM-UI-075 Multiple attachments can be bulk-deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: two attachments uploaded (UI as in PIM-UI-073: `attachment-small.txt` with a comment, `photo-valid.png` without; or `POST .../screen/personal/attachments` with the JSON body above).
2. Click the Attachments table header checkbox (`.oxd-table-header .oxd-checkbox-wrapper`, last on the page); read the bar.
3. Click `getByRole('button',{name:'Delete Selected'})`, then `Yes, Delete`.
**Expected:**
- Text `(2) Records Selected` and the red `Delete Selected` button.
- Same dialog; one request `DELETE .../screen/personal/attachments` body `{"ids":[1,2]}` (numbers) -> 200; toast `Success` / `Successfully Deleted`; table empty (`No Records Found`). Second upload body for the PNG: `{"attachment":{"name":"photo-valid.png","type":"image/png","size":...,"base64":"..."},"description":""}`.

---

## Custom Fields
**Seed:** tests/seed.spec.ts

List: `/web/index.php/pim/listCustomFields`, h6 `Custom Fields`, paragraph `Remaining number of custom fields: 8` (with 2 fields), `Add` button (enabled), `(2) Records Found`, columns checkbox, `Custom Field Name`, `Screen`, `Field Type`, `Actions` (trash first, pencil second). Add form URL is `/web/index.php/pim/saveCustomFields` (plural; edit: `/pim/saveCustomFields/<id>`), h6 `Add Custom Field`, groups `Field Name*` (text), `Screen*` (select), `Type*` (select), and after choosing Drop Down `Select Options*` (text input, hint `Enter allowed options separated by commas`), `* Required`, `Cancel`, `Save`.

#### PIM-UI-076 Drop Down custom field for Personal Details appears on profile, saves a value and disappears when deleted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee via API; fewer than 10 custom fields exist (currently 2).
2. Open `/web/index.php/pim/listCustomFields`; click `Add` (URL becomes `/pim/saveCustomFields`). Open the Screen select, read options, pick `Personal Details`; open the Type select, read options, pick `Drop Down`.
3. Fill Field Name `AutoCF<unique>` and Select Options `Red,Green,Blue`; blur; `Save`.
4. Open `/pim/viewPersonalDetails/empNumber/<n>`; wait for `Custom Fields` heading; read the second form.
5. In the new field's select (`.oxd-input-group:has-text("AutoCF<unique>") .oxd-select-text`) choose `Green`; click the Custom Fields form's `Save` (second `Save`, `.orangehrm-edit-employee-content form` nth(1)); reload and read.
6. Remove the value (select `-- Select --` and Save, or `PUT /api/v2/pim/employees/<n>/custom-fields {"custom<id>":null}`), reload `/pim/listCustomFields`, click the trash of the field (first button in its row), `Yes, Delete`. Reopen the profile.
**Expected:**
- Screen options (11 incl. placeholder): `-- Select --`, `Personal Details`, `Contact Details`, `Emergency Contacts`, `Dependents`, `Immigration`, `Job`, `Salary`, `Tax Exemptions`, `Report-to`, `Qualifications`, `Memberships` (that is 11 real screens, the case says 10). Type options: `-- Select --`, `Text or Number`, `Drop Down`. Selecting Drop Down reveals `Select Options` with hint `Enter allowed options separated by commas`.
- Step 3: toast `Success` / `Successfully Saved`; `POST /api/v2/pim/custom-fields` body `{"fieldName":"PlanAuto5 Field","screen":"personal","fieldType":1,"extraData":"A,B"}` -> 200 `{"data":{"id":3,"fieldName":"PlanAuto5 Field","fieldType":1,"extraData":"A,B","screen":"personal"},...}` (fieldType 0 = Text or Number, 1 = Drop Down); redirects to the list; list shows the new row `PlanAuto5 Field | Personal Details | Drop Down`, remaining count drops 8 -> 7.
- Step 4: Personal Details second form (`Custom Fields`) contains the groups `Blood Type` (select), `PlanAuto5 Field` (oxd-select with `-- Select --` plus the options, here `A`, `B`) and `Test_Field` (text) with ONE `Save` button at the bottom of that form (after Test_Field).
- Step 5: toast `Success` / `Successfully Saved` (the case says `Successfully Updated`, see Discrepancies); `PUT /api/v2/pim/employees/<n>/custom-fields` body `{"custom1":null,"custom3":"B","custom2":null}`; after reload the select shows `B` (the key is `custom<id>`).
- Step 6: while any employee has a value stored for the field, the trash shows an error toast `Error` / `Custom field(s) in use` and no dialog opens (the list must be reloaded after clearing the value). With the value cleared: dialog as in Qualifications, `DELETE /api/v2/pim/custom-fields` body `{"ids":[3]}`, toast `Successfully Deleted`; `GET /pim/employees/<n>/custom-fields?screen=personal` no longer lists it; the profile shows only Blood Type and Test_Field. Deleting the employee (which removes the values) also lets the field be deleted.

#### PIM-UI-077 Custom field requires a unique name and options for Drop Down type
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/pim/listCustomFields`, click `Add`, click `Save` on the empty form.
2. Select Screen `Personal Details`, Type `Drop Down`, leave Select Options empty, click `Save`.
3. Fill Field Name with an existing name (e.g. `Blood Type`, or the name of the field created as precondition) and options `A,B`; click the `* Required` text; read the message; click `Save`. Optionally repeat with `blood type`.
**Expected:**
- Step 1: `Required` under Field Name, Screen and Type (three messages); no POST.
- Step 2: `Required` under Select Options (plus `Required` under Field Name if still empty); no POST.
- Step 3: `Already exists` under Field Name (appears on blur after ~1 s, validated client-side; Save sends nothing). The check is case-sensitive: `blood type` is accepted. Nothing is saved while the message shows. Note the server API does NOT enforce these rules (a direct POST with a duplicate name and a Drop Down without options both returned 200), so only UI behaviour should be asserted.

#### PIM-UI-078 Custom fields are capped at 10 (Manual)
Not automated (Manual in the case). Current state: 2 custom fields exist (`Blood Type`, `Test_Field`), `Remaining number of custom fields: 8`, `Add` enabled. Disabled state at 0 remaining was not exercised.

---

## Optional Fields
**Seed:** tests/seed.spec.ts

URL `/web/index.php/pim/configurePim`; h6 `Optional Fields`; section h6 `Show Deprecated Fields` with switch `Show Nick Name, Smoker and Military Service in Personal Details`; section h6 `Country Specific Information` with switches `Show SSN field in Personal Details`, `Show SIN field in Personal Details`, `Show US Tax Exemptions menu`; one `Save` button. The page took >15 s for the heading role query once; wait on `.oxd-switch-input` instead. Switch order (nth of `.oxd-switch-wrapper`): 0 deprecated, 1 SSN, 2 SIN, 3 Tax Exemptions. Click `.oxd-switch-input` inside the wrapper (clicking the wrapper itself did not toggle the first switch). Original state on the demo: all four OFF (`GET /api/v2/pim/optional-field` -> `{"data":{"pimShowDeprecatedFields":false,"showSIN":false,"showSSN":false,"showTaxExemptions":false}}`). Capture it in the test and restore via `PUT /api/v2/pim/optional-field` (or the UI) in teardown. This setting is global: do not run these two cases in parallel with other workers that read Personal Details.

#### PIM-UI-079 Toggling deprecated and SSN/SIN optional fields shows and hides them without losing data
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: employee via API; capture the optional-field settings.
2. Open `/pim/configurePim`; turn ON `Show Nick Name, Smoker and Military Service in Personal Details`, `Show SSN field in Personal Details`, `Show SIN field in Personal Details`; click `Save`.
3. Open `/pim/viewPersonalDetails/empNumber/<n>`; wait for the `Custom Fields` heading; fill Nickname `Nick5`, SSN Number `SSN5555`, SIN Number `SIN5555`, Military Service `Army`, tick Smoker (`Yes` checkbox: `.oxd-input-group:has-text("Smoker") .oxd-checkbox-input`); click the first `Save`.
4. Back on configurePim turn the switches OFF, Save; open Personal Details. Turn them ON, Save; open Personal Details again.
**Expected:**
- Step 2: toast `Success` / `Successfully Saved`; `PUT /api/v2/pim/optional-field` body `{"pimShowDeprecatedFields":true,"showSIN":true,"showSSN":true,"showTaxExemptions":false}` -> 200.
- Step 3 form groups in order: Employee Full Name, `Nickname`, `Employee Id`, `Other Id`, `Driver's License Number`, `License Expiry Date`, `SSN Number`, `SIN Number`, `Nationality`, `Marital Status`, `Date of Birth`, `Gender`, `Military Service`, `Smoker` (checkbox labelled `Yes`). Toast `Successfully Updated`; `PUT .../personal-details` body includes `"ssnNumber":"SSN5555","sinNumber":"SIN5555","nickname":"Nick5","smoker":true,"militaryService":"Army"`.
- Step 4 OFF: the form lacks Nickname, SSN Number, SIN Number, Military Service, Smoker. ON again: all five visible with the saved values (`Nick5`, `SSN5555`, `SIN5555`, `Army`, smoker checked) - data is kept. Each switch saves with the full four-key body.

#### PIM-UI-080 Enabling US Tax Exemptions adds a Tax Exemptions tab to the profile
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open `/pim/configurePim`; turn ON `Show US Tax Exemptions menu`; click `Save`.
2. Open `/pim/viewPersonalDetails/empNumber/<n>`; read all tabs (`getByRole('tab')`).
3. Open `/web/index.php/pim/viewUsTaxExemptions/empNumber/<n>` directly.
4. Restore the switch to OFF.
**Expected:**
- Step 1: toast `Successfully Saved`; body `showTaxExemptions:true`.
- Step 2: tabs remain the ten standard ones (`Personal Details`, `Contact Details`, `Emergency Contacts`, `Dependents`, `Immigration`, `Job`, `Salary`, `Report-to`, `Qualifications`, `Memberships`): NO `Tax Exemptions` tab is rendered in the demo (case expectation not met; see Discrepancies). The same tab list is shown on Contact, Memberships and the tax page itself (checked after 3.5 s).
- Step 3: the page exists (heading `Tax Exemptions`, sections `Federal Income Tax` with `Status` select and `Exemptions`, `State Income Tax` with `State`, `Status`...) even with the switch OFF, so the switch does not gate the route.

---

## Observed API calls
(base `/web/index.php/api/v2`; JSON; session cookie; 200 on success)
- Work experience: `GET|POST /pim/employees/<n>/work-experiences` (`?limit=50&offset=0`), `GET|PUT .../work-experiences/<id>`, `DELETE .../work-experiences` `{"ids":[1]}`. Body `company, jobTitle, fromDate, toDate, comment` (PUT adds `id` number).
- Education: `POST .../educations` `{"educationId":2|3,"institute","major","year":null|2015,"score","startDate","endDate"}`; empty strings sent for blank text/dates. Ids: Bachelor's Degree = 2, Master's Degree = 3.
- Skills: `POST .../skills` `{"skillId":3,"yearsOfExperience":5,"comments":""}` (Content Creation = 3); keyed by skill (re-POST overwrites; list item has no id: `{"yearsOfExperience","comments","skill":{"id","name","description"}}`).
- Languages: `POST .../languages` `{"languageId":3,"fluencyId":2,"competencyId":3,"comment":"..."}` (English = 3; Speaking = 2; Good = 3).
- Licenses: `POST .../licenses` `{"licenseId":1,"licenseNo","issuedDate","expiryDate"}` (CDMP = 1).
- Memberships: `POST .../memberships` `{"subscriptionFee":"100","subscriptionCommenceDate","subscriptionRenewalDate","membershipId":4,"subscriptionPaidBy":"Company","currencyTypeId":"USD"}` (ACCA = 4).
- Attachments: `GET|POST /pim/employees/<n>/screen/<screen>/attachments`, `DELETE ... {"ids":[1,2]}`. POST is JSON `{"attachment":{"name","type","size","base64"},"description":"..."}`. Download navigates to `/web/index.php/pim/viewAttachment/empNumber/<n>/attachId/<id>`.
- Custom fields: `GET /pim/custom-fields?limit=50&offset=0` (the `screen` param must be omitted or valid, `screen=` -> 422 invalidParamKeys ["screen"]); `POST /pim/custom-fields` `{"fieldName","screen":"personal","fieldType":0|1,"extraData":"A,B"}`; `DELETE /pim/custom-fields` `{"ids":[3]}`; employee values `GET|PUT /pim/employees/<n>/custom-fields[?screen=personal]` body `{"custom1":null,"custom3":"B","custom2":null}` (response meta.fields lists the definitions).
- Optional fields: `GET|PUT /pim/optional-field` `{"pimShowDeprecatedFields","showSIN","showSSN","showTaxExemptions"}`.
- Personal details with optional fields: `PUT /pim/employees/<n>/personal-details` adds `ssnNumber, sinNumber, nickname, smoker, militaryService`.
- 422 shape `{"error":{"status":"422","message":"Invalid Parameter","data":{"invalidParamKeys":[...]}}}`: work-experiences with empty company and toDate before fromDate -> `["company","toDate"]`; languages without fluency/competency -> `["fluencyId","competencyId","comment"]`; memberships with renewal before commence -> `["subscriptionRenewalDate"]`. The API accepts duplicate custom field names and Drop Down without options (200) and duplicate skills (upsert).
- Employee create/delete: `POST /pim/employees`, `DELETE /pim/employees` `{"ids":[<n>]}` -> `{"data":["<n>"]}`.

## Locators
- Section Add buttons: `page.getByRole('button',{name:'Add'}).nth(i)` (Qualifications: 0 Work Experience, 1 Education, 2 Skills, 3 Languages, 4 License, 5 Attachments; Memberships: 0 membership, 1 attachments; Personal Details: last). Section headings are `getByRole('heading',{name:'Work Experience'})`, etc.
- Form: `page.locator('.orangehrm-edit-employee-content form').first()` (Attachments on Personal Details: `.last()`; Custom Fields on Personal Details: `.nth(1)`). Group: `form.locator('.oxd-input-group',{hasText:'<Label>'})` (use `.first()`; `hasText:'Year'` also matches nothing else in Education, `hasText:'Name'`-style ambiguity avoided). Input = `.locator('input')`, textarea = `.locator('textarea')`, select = `.locator('.oxd-select-text')`, error = `.locator('.oxd-input-field-error-message')`. Dates `form.getByRole('textbox',{name:'yyyy-dd-mm'})` nth(0)/nth(1).
- Selects: click the group's `.oxd-select-text` then `getByRole('option',{name:'<text>',exact:true})`. Language form selects by index: `form.locator('.oxd-select-text').nth(0|1|2)`.
- Neutral blur: `form.getByText('* Required').click()`.
- Table: `.oxd-table-card` (all tables on the page; scope by section if needed), header checkbox `.oxd-table-header .oxd-checkbox-wrapper`, bulk bar `getByText(/\(\d+\) Records? Selected/)` + `getByRole('button',{name:'Delete Selected'})`, row buttons `card.locator('button:has(.bi-pencil-fill)')`, `button:has(.bi-trash)`, `button:has(.bi-download)`.
- File input: `form.locator('input[type=file]')` (use `setInputFiles` or `browser_file_upload`); file name shown in the group text.
- Toast `page.locator('.oxd-toast')` = `Success\n\nSuccessfully Saved\n\n×` (Error variant: `Error\n\nCustom field(s) in use\n\n×`); dialog `.oxd-dialog-container-default` with `Yes, Delete` / `No, Cancel`.
- Custom Fields list: `.oxd-table-card` filtered by `hasText`; delete = `card.locator('button').first()`, edit = `.nth(1)`; remaining text `getByText(/Remaining number of custom fields: \d+/)`.
- Optional switches: `page.locator('.oxd-switch-wrapper')` nth(0..3), toggle by clicking `.oxd-switch-input` inside; state `.oxd-switch-wrapper input` `.checked`. Save: `getByRole('button',{name:'Save'})`.

## Master data used
- Education levels (Level select): `Bachelor's Degree` (id 2), `College Undergraduate`, `High School Diploma`, `Master's Degree` (id 3).
- Skills (21): Content Creation (id 3), Copywriting, G Suite, Google Analytics, Java, JavaScript, JIRA, Office Suite, Perl, Photoshop, PHP, Python, React Native, Ruby, Search Engine Optimization (SEO), Seleniumwebdriver, SQL, Swift, Trello, UI/UX Design, Wireframing.
- Languages: Arabic, Chinese, English (id 3), French, Russian, Spanish. Fluency: Writing, Speaking (id 2), Reading. Competency: Poor, Basic, Good (id 3), Mother Tongue.
- License types: Certified Digital Marketing Professional (CDMP) (id 1), Certified Information Security Manager (CISM), Cisco Certified Network Associate (CCNA), Cisco Certified Network Professional (CCNP), Microsoft Certified Systems Engineer (MCSE), PMI Agile Certified Practitioner (PMI-ACP).
- Memberships: ACCA (id 4), British Computer Society (BCS), Chartered Institute of Marketing (CIM), CIMA. Paid By: Company, Individual. Currency: 159 options incl. `United States Dollar` (USD).
- Custom fields existing: `Blood Type` (id 1, Drop Down A+,A-,B+,B-,O+,O-,AB+,AB-), `Test_Field` (id 2, Text or Number). Custom field id of a newly created field: next free number (3 in this run).
- Upload fixtures (`/Users/karthikkodati/Downloads/orangehrm-e2e-ai-playwright/test-data/files/`): `attachment-small.txt` (660 B), `attachment-large.bin` (1.1 MB), `photo-valid.png`. Note the case data names `sample.txt` / `large.bin`; the real fixture names are these.
- Master data may change; read the options from the dropdown in the test (pick the first real option) rather than hard-coding where the case says `<existing>`.

## Discrepancies
1. PIM-UI-068: message is `To date should be after from date` (lowercase `from`), not an exact-case match for "To date should be after From date". Cell values fine. Equal dates and edit prefill timing: Edit form needs ~1 s to prefill; an early fill is lost silently while the toast says Updated.
2. PIM-UI-070: duplicate skill is prevented by removing it from the dropdown (the case accepts this); the API accepts the duplicate (upsert, no error).
3. PIM-UI-073: Save toast is `Successfully Saved` (matches). Download is a navigation download; its content equals the 660-byte fixture (verified by head text and length, not byte comparison). The file in the case (`test-data/files/sample.txt`) does not exist; use `attachment-small.txt`. Upload request is JSON base64, not multipart.
4. PIM-UI-074: size error `Attachment Size Exceeded` appears on file selection, before Save (the case says after Save: still true afterwards). Missing file: `Required`. Comment: `Should not exceed 200 characters`.
5. PIM-UI-076: (a) Screen select has 11 real screens (case says 10); (b) the save toast of the Custom Fields form on Personal Details is `Successfully Saved`, not `Successfully Updated`; (c) deleting a custom field that has a stored value is blocked with error toast `Custom field(s) in use`, so "delete the field, reopen the profile" requires clearing the value (or deleting the employee) first; (d) the Add URL is `/pim/saveCustomFields` (plural), not `/pim/saveCustomField`.
6. PIM-UI-077: `Already exists` is shown for exact-case duplicates only and the API does not enforce uniqueness or Drop Down options (probe records created through the API were removed via the UI). Exact messages match the case: `Required`, `Already exists`.
7. PIM-UI-078 (Manual): 2 fields now, Add enabled; the disabled-at-limit state was not checked.
8. PIM-UI-079: matches (Nickname, SSN, SIN, Military Service, Smoker appear; data persists across toggling). Success toast on the Optional Fields page is `Successfully Saved`.
9. PIM-UI-080: with `showTaxExemptions: true` no `Tax Exemptions` tab appears in the profile tab list on OrangeHRM OS 5.9 (checked on Personal, Contact, Memberships and the tax page after waits). The route `/pim/viewUsTaxExemptions/empNumber/<n>` is reachable regardless of the switch. The case expectation fails; mark `test.fail()` with an issue annotation or assert the setting round-trips (GET/PUT) plus the direct route. The Tax Exemptions form fields were not exercised.
10. Not verified: Tax Exemptions data save, the 10-field cap, `Skill`/`Language` comment max length, Years of Experience boundary at 99.99, License date order message exact wording in other forms (observed `Expiry date should be after issued date`), pencil/edit of attachments (pencil button exists), Memberships edit/delete, and whether the Custom Fields list sorts duplicates stably.
11. Cleanup confirmation: employee 404 deleted (search returns total 0), custom field `PlanAuto5 Field` deleted, two accidental API-probe fields (`Blood Type` duplicate, `ZZ`) deleted via the UI, custom fields back to `Blood Type` and `Test_Field` (total 2, remaining 8), optional-field switches all OFF as originally.

## Test Scenarios

### 1. PIM Qualifications, Memberships, Attachments, Custom Fields, Optional Fields

**Seed:** `tests/seed.spec.ts`
