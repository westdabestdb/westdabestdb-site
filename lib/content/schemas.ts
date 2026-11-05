import { z } from 'zod'

/* ------------------------------------------------------------------ *
 * site.ts
 * ------------------------------------------------------------------ */

/** One run of the bio sentence. `href` turns it into a link. */
export type BioSegment = { text: string; href?: string }

export const bioSegmentSchema = z
  .union([
    z.string(),
    z.object({
      text: z.string(),
      href: z.string().optional(),
    }),
  ])
  .transform((value): BioSegment => (typeof value === 'string' ? { text: value } : value))

export const socialLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
})

export const siteSchema = z.object({
  name: z.string(),
  title: z.string(),
  location: z.string(),
  email: z.email(),
  github: z.url(),
  linkedin: z.url(),
  siteUrl: z.url(),
  /** "owner/name" on GitHub, for the git-log line and the source link. */
  repo: z.string(),
  bio: z.array(bioSegmentSchema),
  social: z.array(socialLinkSchema),
  /** The "Stack" line on /work. */
  stack: z.array(z.string()).default([]),
  /** The sentence under the /work heading. */
  workIntro: z.string(),
})

export type SocialLink = z.infer<typeof socialLinkSchema>
export type Site = z.infer<typeof siteSchema>
/** The shape `content/site.ts` is written in (bio runs may be plain strings). */
export type SiteInput = z.input<typeof siteSchema>

/* ------------------------------------------------------------------ *
 * posts/*.mdx
 * ------------------------------------------------------------------ */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'accent must be #rrggbb')

export const postFrontmatterSchema = z.object({
  title: z.string(),
  date: isoDate,
  tags: z.array(z.string()).default([]),
  summary: z.string(),
  draft: z.boolean().default(false),
  accent: hexColor.optional(),
})

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>

export type ReadingTime = {
  text: string
  minutes: number
  words: number
}

export type Post = PostFrontmatter & {
  slug: string
  /** `/blog/<slug>` */
  url: string
  /** Raw MDX body, without frontmatter. */
  body: string
  /** 1-based position in the date-ascending list. Rendered zero-padded to 3. */
  number: number
  readingTime: ReadingTime
}

/* ------------------------------------------------------------------ *
 * projects/*.md
 * ------------------------------------------------------------------ */

export const projectStatusSchema = z.enum(['live', 'archived', 'store'])

/** "2019", "2025–" or "2021–2023". The separator is an en dash (U+2013). */
const projectYear = z
  .string()
  .regex(/^\d{4}(\u2013(\d{4})?)?$/, 'year must be "2019", "2025\u2013" or "2021\u20132023"')

export const projectFrontmatterSchema = z.object({
  name: z.string(),
  /** 45 characters or fewer, or the desktop row clips it. */
  description: z.string().max(45, 'description must be 45 characters or fewer'),
  year: projectYear,
  role: z.string(),
  stack: z.array(z.string()).default([]),
  proof: z.string().optional(),
  /** Optional: a project with no live page renders as a plain row. */
  link: z.string().optional(),
  /** 640×400 webp under `public/static/images/previews/`, shown on row hover. */
  preview: z.string().optional(),
  own: z.boolean(),
  status: projectStatusSchema,
  featured: z.boolean().default(false),
  lab: z.boolean().default(false),
  order: z.number().optional(),
})

export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>

export type Project = ProjectFrontmatter & {
  slug: string
  /** Optional longer paragraph under the frontmatter. */
  body: string
}

/* ------------------------------------------------------------------ *
 * cv.json
 * ------------------------------------------------------------------ */

const cvMonth = z.string().regex(/^\d{4}-\d{2}$/, 'must be YYYY-MM')

export const cvRoleSchema = z.object({
  company: z.string(),
  role: z.string(),
  start: cvMonth,
  /** `null` while the role is current. */
  end: cvMonth.nullable(),
  location: z.string(),
  /** The résumé's "Stack:" line, rendered grey above the bullets. */
  stack: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
})

/** An ordered group, so /cv can print the résumé's own order and labels. */
export const cvSkillGroupSchema = z.object({
  label: z.string(),
  items: z.array(z.string()).default([]),
})

export const cvSideProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
})

export const cvEducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  /** Free text: "2017–2019 (2 years completed)". */
  years: z.string(),
})

export const cvSchema = z.object({
  name: z.string(),
  title: z.string(),
  location: z.string(),
  email: z.email(),
  links: z.object({
    github: z.url(),
    linkedin: z.url(),
    site: z.url(),
  }),
  /** The résumé's PROFILE paragraph, verbatim. */
  summary: z.string(),
  experience: z.array(cvRoleSchema),
  skills: z.array(cvSkillGroupSchema).default([]),
  sideProjects: z.array(cvSideProjectSchema).default([]),
  education: z.array(cvEducationSchema).default([]),
})

export type CvRole = z.infer<typeof cvRoleSchema>
export type CvSkillGroup = z.infer<typeof cvSkillGroupSchema>
export type CvSideProject = z.infer<typeof cvSideProjectSchema>
export type CvEducation = z.infer<typeof cvEducationSchema>
export type Cv = z.infer<typeof cvSchema>

/* ------------------------------------------------------------------ *
 * lamps/<page>.<lang>.mdx
 * ------------------------------------------------------------------ */

/** `support` → /lamps, `privacy` → /lamps/privacy. */
export const lampsPageNameSchema = z.enum(['support', 'privacy'])

/** Every Lamps page carries both languages, rendered in this order. */
export const lampsLangSchema = z.enum(['tr', 'en'])

export const lampsDocFrontmatterSchema = z.object({
  /** This language's page title: the h1 (first language) or the line under
      it, and one half of the `<title>`. */
  title: z.string(),
  /** One half of the meta description. */
  description: z.string(),
  /** The language's own name — "Türkçe", "English" — for the in-page switch
      and the grey label above its half of the page. */
  language: z.string(),
  /** When this text last changed. On the privacy policy it is the effective
      date, which the body prints with `<DocDate />`. */
  date: isoDate,
})

export type LampsPageName = z.infer<typeof lampsPageNameSchema>
export type LampsLang = z.infer<typeof lampsLangSchema>
export type LampsDocFrontmatter = z.infer<typeof lampsDocFrontmatterSchema>

export type LampsDoc = LampsDocFrontmatter & {
  page: LampsPageName
  lang: LampsLang
  /** `/lamps` or `/lamps/privacy`; both languages share it. */
  url: string
  /** Raw MDX body, without frontmatter. */
  body: string
}
