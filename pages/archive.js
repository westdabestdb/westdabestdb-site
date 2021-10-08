import { getAllFilesFrontMatter } from '@/lib/mdx'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayout'
import { PageSEO } from '@/components/SEO'
import ArchiveListLayout from '@/layouts/ArchiveListLayout'

export async function getStaticProps() {
  let posts = await getAllFilesFrontMatter('blog')
  // posts = posts.sort((a, b) => b.date + a.date)
  const initialDisplayPosts = posts
  const pagination = {
    currentPage: 1,
    totalPages: 1,
  }

  return { props: { initialDisplayPosts, posts, pagination } }
}

export default function Archive({ posts, initialDisplayPosts, pagination }) {
  return (
    <>
      <PageSEO title={`Archive - ${siteMetadata.author}`} description={siteMetadata.description} />
      <ArchiveListLayout
        posts={posts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title="Archive"
      />
    </>
  )
}
