/* eslint-disable @next/next/no-img-element */
import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'
import { Image } from '@/components/Image'

export default function Hello() {
  return (
    <div>
      <div className="py-8 min-w-screen">
        <div className="flex flex-col col-span-2 items-start justify-center w-full h-full mb-10 xl:mb-0">
          <div className="flex justify-start items-center">
            <span>
              <img
                className="w-24 h-24 mr-4 rounded-full hover:blur bg-gradient-to-r from-green-200 via-green-300 to-blue-500"
                src={'/static/images/gorkem.jpg'}
                alt="Görkem"
              />
            </span>
            <h2 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
              {siteMetadata.title}{' '}
              <span role="img" aria-label="waving hand" className="wave">
                👋🏻
              </span>
            </h2>
          </div>

          <p className="mt-4 text-lg">
            Co-founder, developer, tech-lead and maker of production-ready apps.
          </p>

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Topics: Coding, programming languages, frameworks, building businesses, building apps,
            freelancing, productivity, and some other cool things.
          </p>

          <a
            className="mt-4 font-semibold text-primary-500 underline decoration-primary-500 decoration-wavy underline-offset-4"
            aria-label="Email to westdabestdb@gmail.com"
            title="Email to westdabestdb@gmail.com"
            href="mailto:westdabestdb@gmail.com"
          >
            Get in touch →
          </a>
        </div>
      </div>
    </div>
  )
}
