<!-- Generated from requirements/brd/OrangeHRM_BRD_Buzz.docx by scripts/brd-to-md.ts. Do not edit. -->

__OrangeHRM 5.x__

__Business Requirements Document__

Buzz Module

__Application__

OrangeHRM Open Source 5.x (reference: opensource-demo.orangehrmlive.com)

__Module__

Buzz Module

__Document ID__

BRD-BUZ-001

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

BUZ-FR-nnn

Functional requirement

BUZ-FR-nnn-ACn

Acceptance criterion of a functional requirement (one testable check each)

BUZ-VAL-nnn

Field-level validation rule

BUZ-BR-nn

Business rule

BUZ-NFR-nn

Non-functional requirement

BUZ-E2E-nn

Recommended end-to-end automation scenario

Priority uses MoSCoW: __Must__ (core, smoke/regression), __Should__ (regression), __Could__ (extended regression).

# Table of Contents

# 1. Introduction

## 1.1 Purpose

This document defines the business requirements of the Buzz module of OrangeHRM 5.x. It is the baseline for manual test design and for the end-to-end automation suite, so every requirement carries a unique ID and testable acceptance criteria.

## 1.2 Module overview

Buzz is OrangeHRM's internal social newsfeed. All users can publish text posts, photos and videos, like, comment and share posts, and see upcoming work anniversaries. The latest posts also appear on the Dashboard.

## 1.3 Scope

__In scope__

- Newsfeed display and sorting.
- Create text, photo and video posts; edit and delete posts.
- Likes, comments (with likes, edit, delete) and shares.
- Upcoming Anniversaries panel.

__Out of scope__

- Notifications by email.
- Moderation workflows beyond delete.

## 1.4 Definitions and abbreviations

__Term__

__Definition__

__Post__

An entry in the newsfeed: text, photos or a video link

__Share__

Re-posting another user's post with optional text

__Anniversary__

Work anniversary based on the employee's Joined Date in PIM

# 2. User Roles and Permissions

__Capability__

__Admin__

__Supervisor__

__ESS__

__View newsfeed__

Yes

Yes

Yes

__Create, like, comment, share__

Yes

Yes

Yes

__Edit / delete own posts and comments__

Yes

Yes

Yes

__Delete others' posts and comments__

Yes

No

No

# 3. Navigation and Screens

__Menu path__

__Screen__

__Purpose__

Buzz

Buzz Newsfeed

Social feed with post composer and anniversaries

# 4. Functional Requirements

## 4.1 Newsfeed

### BUZ-FR-001  Display newsfeed

__Description__

Buzz shows posts from all employees.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-001-AC1:__ Each post shows author photo and name, date/time, content, like/comment/share icons and counts.
- __BUZ-FR-001-AC2:__ Default sort is Most Recent Posts; tabs offer Most Liked Posts and Most Commented Posts and reorder the feed accordingly.
- __BUZ-FR-001-AC3:__ More posts load as the user scrolls (infinite scroll).
- __BUZ-FR-001-AC4:__ Long text is truncated with "Read More" that expands the full text.

### BUZ-FR-002  Upcoming anniversaries

__Description__

A side panel lists employees with work anniversaries in the coming days.

__Priority__

Could

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-002-AC1:__ Each entry shows photo, name, job title, years of service and anniversary date.
- __BUZ-FR-002-AC2:__ Employees appear based on PIM Joined Date; past employees are excluded.
- __BUZ-FR-002-AC3:__ When none, the panel shows "No Upcoming Anniversaries".

## 4.2 Posting

### BUZ-FR-003  Create text post

__Description__

User types in "What's on your mind?" and clicks Post.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-003-AC1:__ The Post button is disabled (or the post is rejected) when the text is empty or whitespace.
- __BUZ-FR-003-AC2:__ A successful post shows "Successfully Saved" and appears at the top of Most Recent Posts with the user's name.
- __BUZ-FR-003-AC3:__ Line breaks and special characters are preserved; HTML/script content is displayed as text, not executed.

### BUZ-FR-004  Share photos

__Description__

User clicks "Share Photos", adds text and images, and posts.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-004-AC1:__ Up to 5 images can be added per post; each must be jpg, jpeg, png or gif and within the size limit (2 MB).
- __BUZ-FR-004-AC2:__ Selected images show as thumbnails that can be removed before posting.
- __BUZ-FR-004-AC3:__ Posted images display in the feed and open in a viewer when clicked.
- __BUZ-FR-004-AC4:__ Unsupported type or oversized files show an error and are not attached.

### BUZ-FR-005  Share video

__Description__

User clicks "Share Video", pastes a video URL and posts.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-005-AC1:__ A valid YouTube URL shows an embedded preview before posting.
- __BUZ-FR-005-AC2:__ An invalid URL shows "Invalid URL" and Share is blocked.
- __BUZ-FR-005-AC3:__ The posted video plays inline in the feed.

### BUZ-FR-006  Edit and delete posts

__Description__

User edits or deletes their own posts via the three-dot menu; Admin can delete any post.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-006-AC1:__ The three-dot menu on own posts offers Edit Post and Delete Post.
- __BUZ-FR-006-AC2:__ Edit opens the post in a dialog; saving updates the text and shows "Successfully Updated".
- __BUZ-FR-006-AC3:__ Delete asks for confirmation and removes the post, its comments and likes.
- __BUZ-FR-006-AC4:__ Users other than the author and Admin do not see Edit/Delete.

## 4.3 Interactions

### BUZ-FR-007  Like and unlike posts

__Description__

User clicks the heart icon to like or unlike a post.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-007-AC1:__ Liking fills the heart and increases the like count by 1; clicking again unlikes and decreases it.
- __BUZ-FR-007-AC2:__ A user can like a post only once.
- __BUZ-FR-007-AC3:__ Clicking the like count shows the list of users who liked.

### BUZ-FR-008  Comment on posts

__Description__

User writes a comment and presses Enter.

__Priority__

Must

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-008-AC1:__ The comment appears under the post with the author's name and time, and the comment count increases.
- __BUZ-FR-008-AC2:__ Empty comments are not submitted.
- __BUZ-FR-008-AC3:__ Comments can be liked; authors can edit and delete their own comments; Admin can delete any comment.
- __BUZ-FR-008-AC4:__ Older comments are collapsed behind "Show all comments".

### BUZ-FR-009  Share a post

__Description__

User clicks the share icon, optionally adds text, and shares.

__Priority__

Should

__Roles__

All

__Acceptance criteria__

- __BUZ-FR-009-AC1:__ The share dialog shows the original post and a text box.
- __BUZ-FR-009-AC2:__ The shared post appears at the top of the feed showing the sharer and the embedded original.
- __BUZ-FR-009-AC3:__ The original post's share count increases by 1.

# 5. Field Validations

Each row is an independent negative/boundary test candidate. Messages are those shown by OrangeHRM 5.x beneath the field unless stated otherwise.

__ID__

__Screen__

__Field__

__Mand.__

__Rule__

__Expected message / behaviour__

BUZ-VAL-001

Post

Text

Yes (text-only post)

Not blank; long text allowed (max 65,530 characters)

Post button disabled or "Required"

BUZ-VAL-002

Share Photos

Images

Yes (photo post)

Max 5; jpg/jpeg/png/gif; max 2 MB each

"File type not allowed"; "Attachment Size Exceeded"

BUZ-VAL-003

Share Video

Video URL

Yes

Valid YouTube URL

"Invalid URL"

BUZ-VAL-004

Comment

Text

Yes

Not blank

Comment not submitted

# 6. Business Rules

__ID__

__Rule__

BUZ-BR-01

All authenticated users can view and interact with all posts.

BUZ-BR-02

Only the author can edit a post or comment; the author and Admin can delete.

BUZ-BR-03

A user can like a post or comment at most once.

BUZ-BR-04

Deleting a post deletes its comments and likes; posts that shared it no longer show the original content.

BUZ-BR-05

Anniversaries are derived from current employees' Joined Date.

BUZ-BR-06

Disabling the Buzz module hides the menu and the Dashboard Buzz widget.

# 7. System Messages and Notifications

__Trigger__

__Message__

__Type__

Post created / shared

Success: Successfully Saved

Toast (success)

Post edited

Success: Successfully Updated

Toast (success)

Post deleted

Success: Successfully Deleted

Toast (success)

Invalid video URL

Invalid URL

Inline

# 8. Non-Functional Requirements

__ID__

__Category__

__Requirement__

BUZ-NFR-01

Security

User content is sanitised to prevent cross-site scripting.

BUZ-NFR-02

Performance

Feed loads the first page of posts within 3 seconds; images are lazy-loaded.

BUZ-NFR-03

Usability

All mandatory fields are marked with an asterisk (*) and the message "* Required" is shown on forms with mandatory fields.

BUZ-NFR-04

Feedback

Every create, update and delete shows a toast message that disappears automatically after a few seconds.

BUZ-NFR-05

Security

Screens of this module are reachable only by an authenticated user whose role grants access; direct URL access without permission redirects to the login page or shows a "Credential Required"/access-denied state.

BUZ-NFR-06

Compatibility

Module works on the latest stable Chrome, Firefox, Edge and Safari at desktop resolution 1366x768 and above; the layout collapses the side menu at narrow widths.

BUZ-NFR-07

Performance

List and search pages return results within 3 seconds for up to 5,000 records on the reference environment.

# 9. Assumptions, Dependencies and Constraints

## 9.1 Assumptions

- The feed is shared by all tests; tests identify their own posts by unique text.
- Requirements describe the standard behaviour of OrangeHRM Open Source 5.x. Exact message wording and limits should be re-confirmed against the build under test, since minor releases occasionally change them.

## 9.2 Dependencies

- PIM: names, photos and joined dates.
- Dashboard: Buzz Latest Posts widget.
- Admin: module toggle.

# 10. Test Automation Considerations

## 10.1 Notes for automation

- Include a unique token (timestamp) in every post text and locate the post card by that text.
- Delete created posts in teardown to keep the feed small.
- Video preview depends on external YouTube access; mock or skip in restricted networks.
- Use a second user context to verify likes/comments from another user and author-only actions.

## 10.2 Test data

__Data item__

__Suggested value / source__

Text post

"Auto buzz <ts>"

XSS check

"<script>alert(1)</script> <ts>"

Images

3 small png files; 1 file > 2 MB; 1 .pdf

Video URL

Valid https://www.youtube.com/watch?v=... ; invalid "https://example.com/video"

## 10.3 Recommended end-to-end scenarios

__ID__

__Scenario__

__Key steps__

__Covers__

__Suite__

BUZ-E2E-01

Post, like and comment

1. Create text post

2. Second user likes and comments

3. Author sees counts 1 and 1

BUZ-FR-003, BUZ-FR-007, BUZ-FR-008, BUZ-FR-001

Smoke

BUZ-E2E-02

Photo post

1. Share 3 images with text

2. Verify thumbnails in feed

3. Oversized and wrong type rejected

BUZ-FR-004

Regression

BUZ-E2E-03

Video post

1. Invalid URL rejected

2. Valid URL shows preview and posts

BUZ-FR-005

Regression

BUZ-E2E-04

Edit and delete own post; permissions

1. Author edits text

2. Other ESS user sees no Edit/Delete

3. Admin deletes the post

BUZ-FR-006

Regression

BUZ-E2E-05

Share a post

1. Share another user's post with text

2. Shared post at top; share count incremented

BUZ-FR-009

Regression

BUZ-E2E-06

Sorting tabs

1. Create posts with different like counts

2. Most Liked Posts orders by likes

BUZ-FR-001

Regression

BUZ-E2E-07

Content is sanitised

1. Post script text

2. Displayed as plain text, no dialog executed

BUZ-FR-003

Regression

# 11. Requirements Traceability Matrix

__Req ID__

__Requirement__

__Feature__

__Priority__

__ACs__

__E2E coverage__

BUZ-FR-001

Display newsfeed

Newsfeed

Must

4

BUZ-E2E-01, BUZ-E2E-06

BUZ-FR-002

Upcoming anniversaries

Newsfeed

Could

3

Functional test

BUZ-FR-003

Create text post

Posting

Must

3

BUZ-E2E-01, BUZ-E2E-07

BUZ-FR-004

Share photos

Posting

Should

4

BUZ-E2E-02

BUZ-FR-005

Share video

Posting

Should

3

BUZ-E2E-03

BUZ-FR-006

Edit and delete posts

Posting

Must

4

BUZ-E2E-04

BUZ-FR-007

Like and unlike posts

Interactions

Must

3

BUZ-E2E-01

BUZ-FR-008

Comment on posts

Interactions

Must

4

BUZ-E2E-01

BUZ-FR-009

Share a post

Interactions

Should

3

BUZ-E2E-05

# 12. Sign-off

__Role__

__Name__

__Signature__

__Date__

Business Owner

QA Lead

Automation Lead

