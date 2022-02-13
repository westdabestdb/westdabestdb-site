import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { getAllFilesFrontMatter } from '@/lib/mdx'
import formatDate from '@/lib/utils/formatDate'

import NewsletterForm from '@/components/NewsletterForm'
import Hello from '@/components/Hello'

const MAX_DISPLAY = 5

export async function getStaticProps() {
  const posts = await getAllFilesFrontMatter('blog')

  return { props: { posts } }
}

export default function Home({ posts }) {
  return (
    <>
      <PageSEO title={siteMetadata.title} description={siteMetadata.description} />
      <div className="">
        <Hello />
        <ul className="border-transparent">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((frontMatter) => {
            const { slug, date, title, summary, tags, readingTime } = frontMatter
            return (
              <li key={slug} className="py-6">
                <article>
                  <div className="space-y-2 xl:space-y-0 xl:items-baseline">
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-3">
                        <div className="flex justify-between align-center">
                          <h2 className="text-2xl font-bold leading-8 tracking-tight">
                            <Link
                              href={`/blog/${slug}`}
                              className="text-gray-900 hover:text-red-500 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap items-center">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose text-gray-500 max-w-none dark:text-gray-400 line-clamp-3 font-medium bitter text-lg">
                          {summary}
                        </div>
                        <div className="flex gap-2">
                          <div className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                            <time dateTime={date}>{formatDate(date)}</time>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">·</span>
                          <div className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                            <span>{readingTime.text}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="all posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
      {siteMetadata.newsletter.provider !== '' && (
        <div className="flex items-center justify-center pt-4">
          <NewsletterForm />
        </div>
      )}
    </>
  )
}
