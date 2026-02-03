# Changelog

All notable changes to Viralio are documented in this file.

### How to update this file

- **When you release a new version:** Add a new section at the top:  
  `## [X.Y.Z] - YYYY-MM-DD`  
  Use the app version (e.g. from `package.json`) and the release date.
- **Group changes** by area (Home, Profile, Sidebar, etc.) or by type (Added, Changed, Fixed).
- **Write for users:** Short, clear sentences. Say what changed and what the user gets (e.g. “You can now…” or “The page no longer…”).
- **Link the version** at the bottom:  
  `[X.Y.Z]: https://github.com/your-org/viralio/releases/tag/vX.Y.Z`

---

## [0.1.0] - 2026-02-02

### Home (Početna)

- **Personalized welcome** — The welcome message now shows your name after "Zdravo" (e.g. "Zdravo, Marko") when you have a business name set in your profile.
- **Smoother loading** — A small, minimal loader appears while your profile and permissions load. You no longer see a full-screen loader or content that appears in steps (name and Admin tab no longer pop in after the page).
- **Stable on refresh** — Refreshing the home page no longer briefly shows the page without your name or Admin access. The loader stays until everything is ready, then the full page appears at once.

### Settings & Payments

- **Podešavanja (Settings)** — `/settings` — Main page to edit your business name, target audience, tone, monthly goals, and social links.
- **Plaćanje (Payments)** — `/payments` — Main page to view your current plan, subscription status, payment history, and cancel subscription.
- Visiting **/profile** redirects to **/settings** for backward compatibility.

### Sidebar & account menu

- **Avatar** — Your avatar in the sidebar shows the first letter of your name (no profile image). It uses your business name from settings.
- **Odjavite se (Log out)** — The "Odjavite se" item in the user dropdown signs you out, shows a short success message, and sends you to the login page.
- **Links** — "Podešavanja" goes to **/settings**, and "Plaćanje" goes to **/payments**. The main account entry in the sidebar opens **/settings** and is highlighted when you’re on **/settings** or **/payments**.

---

[0.1.0]: https://github.com/your-org/viralio/compare/v0.1.0...HEAD
