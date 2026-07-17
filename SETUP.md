# Setup guide

This site has two parts:
- `index.html` — your public portfolio
- `admin.html` — your private project manager (not linked anywhere public, but not truly secret either — see "Note on admin.html" below)

Both are backed by Firebase (free Spark plan — no card needed for this).

---

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com and click **Add project**.
2. Name it anything (e.g. `itmetatech-portfolio`). Google Analytics is optional — you can turn it off.
3. Once created, click the **</> (Web)** icon on the project overview page to register a web app.
4. Give it a nickname (e.g. `portfolio`). You do **not** need Firebase Hosting here since you're using GitHub Pages.
5. Firebase will show you a `firebaseConfig` object like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "itmetatech-portfolio.firebaseapp.com",
  projectId: "itmetatech-portfolio",
  storageBucket: "itmetatech-portfolio.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

6. Copy those values into `js/firebase-config.js` in this project, replacing the placeholders.

---

## 2. Turn on Authentication

1. In the Firebase console sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab and click **Add user**. Use your own email and a strong password — this is your admin login for `admin.html`.

---

## 3. Turn on Firestore

1. In the sidebar: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (not test mode), pick a location close to your audience, and create it.
3. Go to the **Rules** tab and replace the contents with what's in `firestore.rules` in this project, then click **Publish**.
   - This makes projects publicly readable (so your site can show them) but only writable by a signed-in user (you).

---

## 4. Upload the site to GitHub

1. Replace the contents of your existing `Portfolio` repo with everything in this folder (keep it in the repo root, same as before).
2. Commit and push. GitHub Pages will redeploy automatically at your existing URL.

---

## 5. Add your first projects

1. Visit `yoursite.com/admin.html` and sign in with the email/password you created in step 2.
2. Click **Import starter projects** — this loads your original 36 projects into Firestore in one click, so you're not starting from zero.
3. From there, use the form to add new projects, click **Edit** on any row to change one, **Delete** to remove one, and the up/down arrows to reorder.
4. To add a new project's image: upload the image file to `assets/img/portfolio/` in your GitHub repo first, then type that exact filename into the "Image filename" field in the admin form.

Changes save instantly to Firestore — refresh `index.html` and they're live. No git push needed for project changes.

---

## Note on admin.html

`admin.html` isn't linked from your public site, but its URL isn't secret — it's just a page like any other. That's fine: the actual protection is the Firebase Auth login screen and the Firestore rule that only allows writes from your signed-in account. Anyone who finds the URL still can't do anything without your password.

## Costs

Everything here runs on Firebase's free **Spark** plan: Firestore (50k reads/20k writes per day free), Auth (free), all well beyond what a portfolio site needs. No credit card required. The one thing to avoid is Firebase **Storage** for images (it now requires the paid Blaze plan) — that's why images stay as regular files in your GitHub repo instead.
