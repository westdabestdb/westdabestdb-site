# westdabestdb.com

Görkem Erol's personal site: home, work, writing, and CV.

## Stack

Next.js 16 (App Router, TypeScript strict), React 19, Tailwind 4. Content is
MDX posts and Markdown projects loaded with `gray-matter` and rendered with
`next-mdx-remote` (RSC) plus `rehype-pretty-code` for code blocks. Fonts via
`next/font/google` (Funnel Sans, JetBrains Mono). Deployed on Vercel.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000

npm run lint
npm run typecheck
npm run build
npm start
```

## Content

All copy lives under `content/` (see [`content/README.md`](./content/README.md)
for the full schema):

```
content/
  posts/*.mdx      blog posts (frontmatter: title, date, tags, summary)
  projects/*.md    work and side projects
  cv.json          data behind /cv
  site.ts          name, bio, social links, /work intro
```

Frontmatter is validated with zod at load time; a bad file fails the build.

## Design

The design spec and rules (tokens, type, spacing, routes, content schema) are
in [`DESIGN.md`](./DESIGN.md).

## License

MIT, see [`LICENSE`](./LICENSE).
