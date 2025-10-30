# 🧠 InsightLens Code Reviewer

_Inline AI code help for developers and learners — built with Plasmo + Chrome Built-in AI_

---

## 🚀 Overview

**InsightLens Code Reviewer** brings AI-powered explanations, reviews, and refactors directly inside your browser — no copy-pasting code into chat tools or IDEs.  
Just open any website with code snippets (like GitHub, Stack Overflow, or documentation), and get instant insight **inline**.

This project is designed for the **Google Chrome Built-in AI Challenge 2025**.

---

## ✨ Features

- 🧩 **Inline Code Detection** — On Select code the Quick Review UI will appear or use Ctrl + Shift + E 
- ⚙️ **Quick Review Panel** — Opens with `Ctrl + Shift + E` or by selecting a code block
- 💬 **Explain / Review / Security / Ask AI ** options
- 🧠 **Explain Mode** — Short or detailed explanations for faster learning
- 🔐 **Security Mode** — Detects vulnerabilities and suggests fixes
- 🔁 **Rewrite Mode** — Generates optimized and cleaner code versions with inline diffs
- 💾 **Local Save & History** — Stores snippets privately in IndexedDB
- 🧰 **Configurable Settings** — Toggle notifications, switch between short/detailed responses
- 🔒 **Privacy First** — Runs locally using Chrome’s built-in **Gemini Nano**, cloud use is optional

---

## 🧑‍💻 For Beginners

InsightLens helps beginners **learn code faster** by:

- Explaining real-world code directly on GitHub or Stack Overflow
- Highlighting security flaws with human-readable guidance
- Giving quick, practical examples of how to test and improve code

No extra tabs, no distractions — learn where you read.

---

## 🧩 Built With

- [Plasmo Framework](https://docs.plasmo.com/)
- React + TypeScript
- Chrome Built-in **Gemini Nano (Prompt API + Rewriter)**
- Local storage via IndexedDB

---

## Env

**PLASMO_PUBLIC_GEMINI_KEY=[ key_ ]**

---

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

---

## Demo Video

[Youtube](https://youtu.be/dHn66NkZ0u4?si=3LlMmWnPausEv8GZ)

---

## Credits

Created by **Nur Araf Shishir** 🇧🇩
for **Google Chrome Built-in AI Challenge 2025**
