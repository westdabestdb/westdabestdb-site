import Link from 'next/link'
import kebabCase from '@/lib/utils/kebabCase'

const Tag = ({ text }) => {
  return (
    <Link href={`/tags/${kebabCase(text)}`}>
      <a className="mr-3 text-sm font-semibold uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
        {text}
      </a>
    </Link>
  )
}

export default Tag
