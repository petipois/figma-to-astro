# Figma to Astro

This project is a web application that converts Figma designs to Astro components.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   ├── images/
│   │   └── logo.png
│   └── ...
├── src/
│   ├── assets/
│   │   ├── astro.svg
│   │   └── background.svg
│   ├── components/
│   │   ├── Figstro.vue
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── LoginForm.astro
│   │   ├── RegisterForm.astro
│   │   ├── ResetButton.vue
│   │   ├── Section.astro
│   │   └── starwind/
│   │       └── ...
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   ├── appwrite.ts
│   │   ├── consts.ts
│   │   └── figmaFrames.json
│   ├── pages/
│   │   ├── api/
│   │   │   ├── convert.ts
│   │   │   ├── generate.ts
│   │   │   └── reset.ts
│   │   ├── demo.astro
│   │   ├── index.astro
│   │   ├── login.astro
│   │   ├── profile.astro
│   │   └── register.astro
│   └── styles/
│       └── starwind.css
├── astro.config.mjs
├── package.json
└── README.md
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
=======
## convert
Convert breaks down the figma file and makes it readable
## generate
Generates Astro Componennts and displays it to the user
>>>>>>> 44d3a51b043e680077549f3c010694224c1a0784
