# PIM Plan 2 of 6: Add Employee, Profile Photo, Create Login

## Application Overview

Plan for PIM-UI-015..PIM-UI-033 on OrangeHRM OS 5.9 demo, page /web/index.php/pim/addEmployee. Explored live as Admin. Records created while exploring (PlanAuto* last names, usernames planauto.*) were all deleted at the end (verified: nameOrId=PlanAuto returns 0 and both users gone). Conventions: locators reuse specs/pim-1-employee-list.plan.md. Data helpers: create via POST /web/index.php/api/v2/pim/employees; delete via DELETE /pim/employees {"ids":[n]}. Employee Id is auto-suggested (zero padded, e.g. '0482') and increases with each save; the demo is shared so empNumbers jump (282, 288, 290...). Use unique values for names, ids and usernames. IMPORTANT tooling note: a second browser context created inside MCP run_code kills the MCP backend on the NEXT call (needs planner_setup_page again); ESS sign-in in tests should use the guestSession fixture / fresh context with storageState {cookies:[],origins:[]} (a default newContext inherits the Admin storageState and lands on the dashboard as Admin).

## Locators
- Heading: getByRole('heading',{name:'Add Employee'}) (h6). Tab links 'Employee List', 'Add Employee', 'Reports' in Topbar (href '#'). URL /web/index.php/pim/addEmployee.
- Name inputs: getByPlaceholder('First Name') (name=firstName), getByPlaceholder('Middle Name') (name=middleName), getByPlaceholder('Last Name') (name=lastName). Group label 'Employee Full Name*'.
- Employee Id: no placeholder/name. Use page.locator('.oxd-input-group',{hasText:'Employee Id'}).locator('input') (FormField 'Employee Id'). Pre-filled e.g. '0482'.
- Photo: img[alt='profile picture'].employee-image (default src /web/images/default-photo.png; after pick src is data:image/...); hidden-ish input[type=file].oxd-file-input (use locator('input[type=file]').setInputFiles(path), no file chooser event is needed); the '+' control is an icon button (role none, class employee-image-action, icon .bi-plus). Hint text: 'Accepts jpg, .png, .gif up to 1MB. Recommended dimensions: 200px X 200px'. The input has no accept attribute.
- Create Login Details switch: page.locator('.oxd-switch-input') (a checkbox under paragraph 'Create Login Details'); use click(), not check().
- Login fields (after switch on): Username = page.locator('.oxd-input-group',{hasText:'Username'}).locator('input'); Status radios: page.locator('.oxd-radio-wrapper',{hasText:'Enabled'|'Disabled'}).locator('label') (input[type=radio] values 1=Enabled (default checked), 2=Disabled; radio inputs have no accessible name in snapshot); Password = locator('input[type=password]').nth(0); Confirm Password = .nth(1). Group labels: 'Username', 'Status', 'Password', 'Confirm Password'.
- Strength meter: page.locator('.orangehrm-password-chip') (absent until a password is typed); text 'Very Weak' | 'Weak' | 'Better' | 'Strong' | 'Strongest'.
- Buttons: getByRole('button',{name:'Save'}), getByRole('button',{name:'Cancel'}); hint paragraph '* Required'.
- Field errors: .oxd-input-field-error-message inside the field's .oxd-input-group. For the name row the three messages are in the same 'Employee Full Name' group (+ one per input); scope by group text or use getByPlaceholder(...).locator('xpath=ancestor::div[contains(@class,"oxd-input-group")][1]').
- Toast: page.locator('.oxd-toast') text 'Success\n\nSuccessfully Saved\n\n×' (auto-hides in ~3 s, read it right after the click; waitFor it).
- Profile page (/pim/viewPersonalDetails/empNumber/<n>): name heading h6 inside .orangehrm-edit-employee-name (getByRole('heading',{name:'<First> <Last>'})); header photo img[alt='profile picture'] (second one on page, nth(1); first is the top-bar user picture) with src /web/index.php/pim/viewPhoto/empNumber/<n>, clickable. Tabs (role tab/link): Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships. Personal Details form shows First/Middle/Last Name inputs and Employee Id with saved values; sections Custom Fields and Attachments follow.
- Change Profile Picture (/pim/viewPhotograph/empNumber/<n>): h6 'Change Profile Picture'; form with img.employee-image + '+' icon button + input[type=file], hint text same as Add Employee, only one button 'Save'. Scope the preview image with page.locator('form .employee-image') (the header image has the same class, strict-mode violation otherwise).
- Admin check: /web/index.php/admin/viewSystemUsers, table columns '', 'Username', 'User Role', 'Employee Name', 'Status', 'Actions'. Username filter matches the FULL username only (planauto.one1 finds it, partial 'planauto' returns 0).
- Login page: getByPlaceholder('Username'), getByPlaceholder('Password'), getByRole('button',{name:'Login'}); error alert page.locator('.oxd-alert') (role alert) text 'Account disabled' / 'Invalid credentials'.

## Add Employee
**Seed:** tests/seed.spec.ts

### Add Employee (PIM-FR-005, PIM-VAL-001..004)

#### PIM-UI-015 Add Employee form shows required fields, photo placeholder and a pre-filled editable Employee Id
**Seed:** tests/seed.spec.ts
**Steps:**
1. Click sidebar 'PIM', then the top tab link 'Add Employee' (or open /web/index.php/pim/addEmployee).
2. Read the form: heading, 'Employee Full Name*' label, placeholders, 'Employee Id' value, photo image and hint, '* Required'.
3. Overwrite Employee Id with a unique value (fill).
**Expected:**
- Heading 'Add Employee'; inputs with placeholders 'First Name', 'Middle Name', 'Last Name' under the label 'Employee Full Name*'; label 'Employee Id' with a pre-filled numeric zero-padded value (e.g. '0482'; matches /^\d+$/); default photo img[alt='profile picture'] src '/web/images/default-photo.png' with a '+' button; hint 'Accepts jpg, .png, .gif up to 1MB. Recommended dimensions: 200px X 200px'; text '* Required'; buttons Cancel and Save; switch 'Create Login Details' off.
- The Employee Id accepts the typed value (input value equals it). No message shown for a valid value.

#### PIM-UI-016 Adding an employee with first and last name saves and opens Personal Details, and the employee is searchable
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open /web/index.php/pim/addEmployee.
2. Fill First Name 'Auto', Last Name 'Emp<unique>', Employee Id <unique up to 10 chars>; leave Middle Name empty.
3. Click Save; read the toast immediately.
4. Read URL and header; read the Personal Details form values.
5. Open Employee List (/pim/viewEmployeeList), search by Employee Id and then by Employee Name (free text, see plan 1 locators).
**Expected:**
- Toast title 'Success', message 'Successfully Saved' (.oxd-toast, auto-hides).
- URL becomes /web/index.php/pim/viewPersonalDetails/empNumber/<n> (empNumber integer, e.g. 288/290; not sequential on the shared demo). Header heading shows 'Auto Emp<unique>' (first + last; middle omitted when empty). Personal Details inputs: First Name 'Auto', Middle Name empty, Last Name 'Emp<unique>', Employee Id as entered.
- Employee List: Id search returns '(1) Record Found' with row Id / 'Auto' / 'Emp<unique>'; name search finds it too.
- Request: POST /web/index.php/api/v2/pim/employees body {"firstName":"Auto","middleName":"","lastName":"Emp...","empPicture":null?,"employeeId":"..."} (empPicture present, null without photo) -> 200 {"data":{"empNumber":n,"lastName":..,"firstName":..,"middleName":"","employeeId":"0485","terminationId":null},"meta":[],"rels":[]}. Before it the UI calls GET /api/v2/core/validation/unique?value=<id>&entityName=Employee&attributeName=employeeId.

#### PIM-UI-017 Cancel on Add Employee returns to the list without creating a record
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; fill First Name 'Plan', Last Name 'Cancel<unique>'.
2. Click getByRole('button',{name:'Cancel'}).
3. Search the Employee List by that last name (Employee Name free text) or GET /api/v2/pim/employees?nameOrId=Cancel<unique>.
**Expected:**
- No confirmation dialog; URL becomes /web/index.php/pim/viewEmployeeList (observed after about 1 s) with heading 'Employee Information'.
- Search shows 'No Records Found' (API meta.total 0). No POST /pim/employees was sent.

#### PIM-UI-018 Leading and trailing spaces in names are trimmed on save
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; fill First Name '  Trim  ' and Last Name '  Space<unique>  '; click Save.
2. On Personal Details read the First Name and Last Name input values (inputValue) and the header text.
3. GET /api/v2/pim/employees?nameOrId=Space<unique>&model=detailed (or read the list row).
**Expected (as observed, contradicts the case, see Discrepancies 1):**
- Save succeeds ('Successfully Saved') and the profile opens.
- Header text appears trimmed ('Trim PlanAutoSpace1') only because HTML collapses whitespace, but the input values are '  Trim  ' / '  PlanAutoSpace1  ' and the API returns firstName '  Trim  ', lastName '  PlanAutoSpace1  ', i.e. NOT trimmed. A test asserting trimmed values (PIM-FR-005-AC6) must be marked test.fail() with an issue annotation.

#### PIM-UI-019 Saving Add Employee with blank First and Last Name shows Required on both
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee (wait for networkidle); click Save without input.
2. Read the error messages.
**Expected:**
- 'Required' shown under First Name and under Last Name (two .oxd-input-field-error-message in the 'Employee Full Name' group plus one per input element); Middle Name has no error. URL stays /pim/addEmployee, no POST /pim/employees sent.

#### PIM-UI-020 Name fields accept 30 characters and reject 31 with Should not exceed 30 characters
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; for each of First, Middle, Last Name fill 31 letters, then blur.
2. Read the message under the field.
3. Fill 30 letters in the same field; read messages.
**Expected:**
- 31 characters: 'Should not exceed 30 characters' under the field (value is kept at 31, no truncation); the message appears on blur/input without clicking Save.
- 30 characters: no message. Verified for all three fields.

#### PIM-UI-021 Employee Id that already exists (current or past employee) is rejected
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition via API: create employee A (current) and employee B (create, then POST /pim/employees/<n>/terminations {"date":"yyyy-mm-dd","terminationReasonId":1}); note their employeeIds.
2. Open Add Employee; fill First/Last Name and set Employee Id to A's id (variant 1) and to B's id (variant 2); wait ~1.5 s or blur.
3. Read the message; click Save.
**Expected:**
- 'Employee Id already exists' under Employee Id (verified for existing id '0485' and '55555'; after typing, request GET /api/v2/core/validation/unique?value=<id>&entityName=Employee&attributeName=employeeId decides it). Save does not send POST /pim/employees and the URL stays /pim/addEmployee.
- The past-employee variant was NOT explored live (assumed same endpoint; mark unverified).

#### PIM-UI-022 Employee Id longer than 10 characters is rejected
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; fill Employee Id with '12345678901' (11 chars), blur; read the message.
2. Fill First/Last Name and click Save.
**Expected:**
- 'Should not exceed 10 characters' under Employee Id (value not truncated); after Save the message remains, URL stays /pim/addEmployee and no POST is sent. 10 characters ('1234567890') shows no message. Allow ~1 s after blur: in one run the message was not yet rendered immediately after the fill, use an auto-waiting expect.

#### PIM-UI-023 Names with unicode, apostrophes and script-like text are stored and rendered literally
**Seed:** tests/seed.spec.ts
**Steps:**
1. Variant 1: First 'José-Ñuño', Last "O'Brien<unique>". Variant 2: First '<script>alert(1)</script>', Last 'Xss<unique>'. Register page.on('dialog') to detect any alert.
2. Save each; read the toast, header heading, Personal Details input values and the API/list row.
**Expected:**
- Toast 'Success' / 'Successfully Saved' for both. Header heading text is exactly "José-Ñuño O'Brien<unique>" and '<script>alert(1)</script> Xss<unique>'; input values identical; API returns the same strings; no dialog event fired. (List row rendering not opened separately; same API data.)

## Profile Photo
**Seed:** tests/seed.spec.ts

### Profile Photo (PIM-FR-006, PIM-VAL-005)

#### PIM-UI-024 Valid profile photo is previewed on Add Employee and shown on the profile after save
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; note the photo src '/web/images/default-photo.png'.
2. page.locator('input[type=file]').setInputFiles('test-data/files/valid.png') (the '+' button only opens the OS chooser, not needed).
3. Read the preview src; fill First/Last Name; click Save.
4. On the profile read header img[alt='profile picture'] nth(1) src and naturalWidth.
**Expected:**
- No error; preview img src becomes 'data:image/png;base64,...' immediately (the default placeholder is replaced).
- POST /api/v2/pim/employees is a JSON body (not multipart): {"firstName":"..","middleName":"","lastName":"..","empPicture":{"name":"<file name>","type":"image/png","size":<bytes>,"base64":"<data>"},"employeeId":"<id>"}; 200.
- Profile URL /pim/viewPersonalDetails/empNumber/<n>; header photo src '/web/index.php/pim/viewPhoto/empNumber/<n>' with naturalWidth > 0 and not the default placeholder (observed 1280 for a 1280px test image).

#### PIM-UI-025 Photo with a disallowed type or over 1 MB is rejected and save is blocked
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; fill First and Last Name.
2. Variant 1: setInputFiles with invalid.pdf (any non-image; verified live with a .json file). Read the message and preview src.
3. Click Save.
4. Variant 2: setInputFiles with large.jpg (>1 MB); read the message; click Save.
5. Then set a valid image; the message should clear.
**Expected:**
- Variant 1: 'File type not allowed' shown under the photo (.oxd-input-field-error-message), preview stays on the default placeholder. VERIFIED.
- Save click: URL stays /pim/addEmployee, no POST /pim/employees sent (verified); message persists. Replacing with a valid image removes the message (verified).
- Variant 2: 'Attachment Size Exceeded' - UNVERIFIED live (no >1 MB image available to the planner and Buffer/File injection by script did not trigger the component); text taken from the BRD. Note: synthetic File injection via DataTransfer + dispatchEvent('change') did NOT update the component and a following Save created the employee without a photo; use setInputFiles with real files.

#### PIM-UI-026 Profile photo can be replaced and deleted from Change Profile Picture
**Seed:** tests/seed.spec.ts
**Steps:**
1. Precondition: create an employee via API (optionally with a photo); open /pim/viewPersonalDetails/empNumber/<n>.
2. Click the header photo (img[alt='profile picture'] nth(1)).
3. Read the page; setInputFiles on input[type=file] with another valid image; click Save.
4. Look for any delete/remove control.
**Expected:**
- Step 2: URL /web/index.php/pim/viewPhotograph/empNumber/<n>, h6 'Change Profile Picture', preview (shows default-photo.png even though the employee has a photo), '+' button, the hint text, button 'Save' only.
- Step 3: preview becomes data:image/png; Save -> toast 'Success' / 'Successfully Updated'; PUT /api/v2/pim/employees/<n>/picture body {"empPicture":{"name":"tiny-picture.png","type":"image/png","size":110,"base64":"..."}} -> 200 {"data":{"empNumber":288,"filename":"tiny-picture.png","fileType":"image/png","size":"110","width":"10","height":"10"},"meta":[],"rels":[]}; URL stays viewPhotograph; the header image refreshes.
- Delete: there is NO delete/remove control on this page (buttons: '+' and Save). The case step 'Delete the photo and confirm' cannot be automated; see Discrepancies 2.

## Create Login
**Seed:** tests/seed.spec.ts

### Create Login Details (PIM-FR-007, PIM-VAL-006..008)

#### PIM-UI-027 Create Login Details toggle reveals login fields with Enabled default and a password strength meter
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; check that Username, Status, Password, Confirm Password are not in the DOM (input[type=password] count 0).
2. Click .oxd-switch-input.
3. Read labels, radios, and the strength meter (none yet).
4. Type 'ab1' in Password, read .orangehrm-password-chip; then 'Valid123!' and read again (also 'Aa1'+61 x, 'Valid1234').
5. Click the switch again.
**Expected:**
- Off: fields hidden. On: groups 'Username', 'Status' (radios 'Enabled' checked by default value 1, 'Disabled' value 2), 'Password', 'Confirm Password'; both password inputs type=password.
- Strength chip is absent until typing. Observed texts: 'ab1' / 'abcdefgh' -> 'Very Weak'; 'Valid123', 'Abcde12', 'ABCDEF12', 'Valid1234', 'Abcd12' -> 'Weak'; 'Valid 123' and 'Aa1'+'x'*61 -> 'Better'; 'Valid123!' -> 'Strong'. 'Strongest' not reproduced (needs a longer/more varied password; do not assert exact mapping for borderline inputs, assert 'Very Weak' for 'ab1' and 'Strong' or 'Strongest' for a long mixed-symbol password). Each keystroke calls POST /api/v2/auth/public/validation/password {"password":"..."} -> {"data":{"messages":[]},"meta":{"strength":n},"rels":[]}.
- Toggle off hides all login fields again (password inputs count 0).

#### PIM-UI-028 Employee created with enabled login gets an ESS user who can log in without PIM menu
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; fill First 'PlanFirst', Last 'PlanAuto<unique>'; click the switch; Username 'auto.emp<unique>' (5-40 chars); leave Status Enabled; Password and Confirm Password a policy-compliant value (e.g. 'Valid1234').
2. Click Save; read the toast.
3. Admin: GET /api/v2/admin/users?username=<exact username> or open /admin/viewSystemUsers and filter Username with the FULL username.
4. In a separate clean context (storageState {cookies:[],origins:[]}), open /web/index.php/auth/login, log in with the new credentials.
5. Read the sidebar links and dashboard; open /web/index.php/pim/viewEmployeeList in that context.
**Expected:**
- Toast 'Success' / 'Successfully Saved'; URL /pim/viewPersonalDetails/empNumber/<n>. Requests: POST /api/v2/pim/employees (200) then POST /api/v2/admin/users with body {"username":"planauto.one1","password":"Valid1234","status":true,"userRoleId":2,"empNumber":288} -> 200 {"data":{"id":99,"userName":"planauto.one1","deleted":false,"status":true,"employee":{"empNumber":288,"employeeId":"0485","firstName":"PlanFirst","middleName":"","lastName":"PlanAutoPhoto1","terminationId":null},"userRole":{"id":2,"name":"ESS","displayName":"ESS"}},...}.
- Admin users table row text: 'planauto.one1 / ESS / PlanFirst PlanAutoPhoto1 / Enabled'.
- ESS login lands on /web/index.php/dashboard/index; user dropdown name 'PlanFirst PlanAutoPhoto1' (first + last); sidebar links: Leave, Time, My Info, Performance, Dashboard, Directory, Claim, Buzz. NOT present: Admin, PIM, Recruitment, Maintenance. Dashboard widgets: Time at Work, My Actions, Quick Launch, Buzz Latest Posts, Employees on Leave Today (no distribution charts).
- Direct navigation to /pim/viewEmployeeList stays on that URL but renders only 'Credential Required' (no list).
- Teardown: delete the employee (the linked ESS user is removed too, verified users total 0 afterwards).

#### PIM-UI-029 Employee created with a Disabled login cannot sign in and sees Account disabled
**Seed:** tests/seed.spec.ts
**Steps:**
1. Add Employee with login on; Username 'auto.dis<unique>'; click the 'Disabled' radio label; passwords valid; Save.
2. In a clean context open /auth/login, enter the username and password, click Login.
**Expected:**
- POST /api/v2/admin/users body has "status":false ("userRoleId":2); toast 'Success' / 'Successfully Saved'; admin users API shows status false.
- Login stays on /web/index.php/auth/login and shows .oxd-alert (role alert, class oxd-alert--error) with text exactly 'Account disabled'. For contrast a wrong password shows 'Invalid credentials'.

#### PIM-UI-030 Username that already exists is rejected with Username already exists
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; fill First/Last Name; click the switch; Username 'Admin'; valid Password and Confirm Password (wait for strength validation).
2. Blur/wait ~1.5 s; read messages; click Save.
3. Repeat with 'ADMIN'.
**Expected:**
- 'Username already exists' under Username (via GET /api/v2/core/validation/unique?value=Admin&entityName=User&attributeName=userName&matchByField=deleted&matchByValue=false); also for 'ADMIN' (case-insensitive). Save does not POST /pim/employees (only POST /auth/public/validation/password fires) and the URL stays /pim/addEmployee, so no employee is created.

#### PIM-UI-031 Username length boundaries: 4 and 41 characters rejected, 5 and 40 accepted
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; click the switch.
2. Fill Username with lengths 4 ('abcd'), 41 ('p' x 41), 5 ('abcde'), 40 ('p' x 40) one at a time; blur and wait ~1.5 s each; read the Username group's error.
**Expected:**
- 4: 'Should be at least 5 characters'; 41: 'Should not exceed 40 characters'; 5 and 40: no message (verified, usernames were unused).

#### PIM-UI-032 Password policy violations and confirm mismatch show the specific messages
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; click the switch; Username 'planauto.<unique>'.
2. Type each password in the Password input, blur, wait ~1.5 s (async POST /auth/public/validation/password) and read the message under Password: 'ab1', 'abcdefgh', 'ABCDEF12', 'Valid123', 'Aa1'+'x'*61 (64), 'Aa1'+'x'*62 (65), 'Valid 123'.
3. Password 'Valid123', Confirm Password 'Valid124'; read Confirm message.
**Expected:**
- 'ab1' -> 'Should have at least 7 characters'; 'abcdefgh' -> 'Your password must contain minimum 1 number'; 'ABCDEF12' -> 'Your password must contain minimum 1 lower-case letter'; 'Valid123' (8) and 'Abcde12' (7) -> no message; 'Abcd12' (6) -> 'Should have at least 7 characters'; 64 chars -> none; 65 chars -> 'Should not exceed 64 characters'; 'Valid 123' -> 'Your password should not contain spaces'.
- Mismatch -> 'Passwords do not match' under Confirm Password; matching clears it. In every case Save is blocked (no POST /pim/employees). The no-uppercase message was not probed ('abcdefg1'); not covered by this case.

#### PIM-UI-033 Login fields become mandatory only when Create Login Details is on
**Seed:** tests/seed.spec.ts
**Steps:**
1. Open Add Employee; fill First and Last Name; click the switch; leave Username, Password, Confirm Password empty; click Save.
2. Read messages under each login field.
3. Click the switch off; click Save.
**Expected:**
- Step 2 (observed): 'Required' under Username and under Password, but under Confirm Password the message is 'Passwords do not match', NOT 'Required' (see Discrepancies 3). Save blocked (URL stays /pim/addEmployee).
- Step 3: login-field errors disappear (password inputs removed from the DOM), employee is saved with only POST /api/v2/pim/employees (no POST /admin/users) - verified with Username typed then toggled off: toast 'Success' / 'Successfully Saved', profile opens. Typed login values are ignored.

## Observed API calls
- Add save: POST /web/index.php/api/v2/pim/employees, JSON {"firstName","middleName","lastName","empPicture":null | {"name","type","size","base64"},"employeeId"} -> 200 {"data":{"empNumber","lastName","firstName","middleName","employeeId","terminationId":null},"meta":[],"rels":[]}. The photo field name is empPicture (JSON, base64 inside; not multipart).
- Login created right after: POST /web/index.php/api/v2/admin/users {"username","password","status":true|false,"userRoleId":2,"empNumber":<n>} -> 200 (data.userRole {id:2,name:ESS}). Sent only when the switch is on.
- Validation calls (GET): /api/v2/core/validation/unique?value=<id>&entityName=Employee&attributeName=employeeId and /api/v2/core/validation/unique?value=<name>&entityName=User&attributeName=userName&matchByField=deleted&matchByValue=false; POST /api/v2/auth/public/validation/password {"password"} -> {"data":{"messages":[]},"meta":{"strength":n}}.
- Photo replace: PUT /api/v2/pim/employees/<n>/picture {"empPicture":{...}} -> 200. Header image: GET /web/index.php/pim/viewPhoto/empNumber/<n>.
- Profile load GETs: /api/v2/pim/employees/<n>/personal-details, /pim/employees/<n>, /pim/employees/<n>/custom-fields?screen=personal, /pim/employees/<n>/screen/personal/attachments?limit=50&offset=0.
- Cleanup: DELETE /api/v2/pim/employees {"ids":[...]} -> 200; linked ESS users are removed.
- Admin users lookup: GET /api/v2/admin/users?username=<exact> (partial username returns no rows).

## Discrepancies
1. PIM-UI-018 / PIM-FR-005-AC6: names are NOT trimmed on save. '  Trim  ' / '  PlanAutoSpace1  ' persisted with spaces (input values and API); only visual HTML rendering looks trimmed.
2. PIM-UI-026 / PIM-FR-006-AC4: Change Profile Picture offers only '+' (replace) and Save; there is no delete/remove photo control, so the 'Delete the photo and confirm / Default placeholder shown' step cannot be performed in the UI. The preview on that page also shows the default image instead of the current photo. Replacing works with toast 'Successfully Updated'.
3. PIM-UI-033: with Username, Password and Confirm Password all blank, Confirm Password shows 'Passwords do not match' rather than 'Required' (case expects Required under each of the three). Username and Password show 'Required'.
4. PIM-UI-025: 'Attachment Size Exceeded' (> 1 MB) could not be verified live (no suitable >1 MB image was reachable; scripted File injection did not drive the component). 'File type not allowed' is verified. Also recorded: the input has no accept attribute.
5. PIM-UI-021 past-employee variant not exercised live (current-employee variant verified).
6. PIM-UI-027: strength label 'Strongest' was not reproduced; 'Strong' appeared for 'Valid123!'. Labels observed: Very Weak, Weak, Better, Strong. BRD policy text min 7 / max 64 confirmed (7 accepted, 6 rejected, 64 accepted, 65 rejected).
7. PIM-UI-016: Employee Id is zero padded (e.g. '0485'), not a plain integer; BRD says 'next available numeric id' (consistent, just padded). Employee numbers (empNumber) are not contiguous on the shared demo.
8. PIM-UI-028: Admin > User Management username filter is exact (not contains), so look up by full username. ESS sidebar has 8 links (Leave, Time, My Info, Performance, Dashboard, Directory, Claim, Buzz); the case only requires no PIM, Admin or Maintenance (Recruitment is also absent).
9. PIM-UI-022 / 020 validation timing: messages for name length appear on blur/input; Employee Id and username messages rely on async requests (~1 s), use auto-waiting expects, no waitForTimeout.
10. Tooling: creating an extra browser.newContext() from MCP run_code makes the MCP backend report 'MCP backend is not initialized' on the next call; and a default newContext inherits the Admin session. In specs use the guestSession fixture instead.

## Test Scenarios

### 1. Add Employee, Profile Photo and Create Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. PIM-UI-015 to PIM-UI-033 (see headings in plan body)

**File:** `tests/ui/pim/add-employee.spec.ts`

**Steps:**
  1. See the detailed per-TC sections above.
    - expect: All 19 TCs covered; see Discrepancies

## Test Scenarios

### 1. Add Employee, Profile Photo, Create Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. PIM-UI-015..PIM-UI-033

**File:** `tests/ui/pim/add-employee.spec.ts`

**Steps:**
  1. See per-TC sections in the plan body
    - expect: All 19 TCs covered; see Discrepancies
