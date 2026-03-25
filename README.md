# Family Housekeeping Planner

A responsive, browser-based weekly housekeeping planner for a family of four:

- Mum
- Dad
- Daughter
- Son

## Features

- Create housekeeping tasks with:
  - Task name
  - Assigned person
  - Assigned day of week
  - Status (`To do`, `Doing`, `Done`)
- Distinct color coding per family member
- Weekly calendar view (Monday to Sunday)
- Move tasks between days with drag-and-drop
- Quick in-card editing:
  - change status
  - reassign person
  - change day
  - rename task
  - delete task
- Remove all completed tasks in one click
- Fully responsive UI for desktop and mobile
- Instant updates without page reload
- Local persistence using `localStorage`

## Tech stack

- HTML
- CSS
- Vanilla JavaScript

No backend services are used. This is Netlify static-hosting compatible.

## Local usage

Open `index.html` in any modern browser.

If you want a local static server:

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080`

## Deploy on Netlify

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site** -> **Import an existing project**.
3. Select this repo.
4. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `.`
5. Deploy.

Because the app is static, no Node.js backend is required.
