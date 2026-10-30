# rohith — portfolio

A static site with no build step: an ASCII ocean (fish schools and hammerhead sharks) behind a scrolling panel with about, work, projects, proof, skills, recognition and contact.

- `index.html`: all the content. Edit the text here.
- `style.css`: design tokens, with light and dark themes.
- `ocean.js`: the background simulation. Fish flock and flee; sharks hunt; click open water to splash.
- `main.js`: section navigation, theme and pause toggles, and the GitHub sync. Project cards show live stars, language and last-updated dates from the public GitHub API (cached for an hour, with the values in `index.html` as the fallback).
- `proof.js`: the proof section.
  - **fit check:** paste a job description and every requirement is mapped to shipped work, partial experience or an honest gap, with links to the code. Runs entirely in the browser.
  - **live audit:** a browser-sized port of [BugZero](https://github.com/rohith2157/BUGZERO)'s checks that tests the page you're reading: headings, accessible names, contrast, tap targets, keyboard, links, Core Web Vitals, and a self-healing selector demo.
- `assets/Maheshwaram_Rohith_Resume.pdf`: the résumé the site links to.

Run it locally:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

Deploy: the `rohith2157.github.io` repository serves `main` with GitHub Pages. After changing a CSS or JS file, bump the `?v=` number on its `<link>` or `<script>` tag in `index.html` so visitors don't get a cached copy.
