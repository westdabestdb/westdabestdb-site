import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import SectionContainer from './SectionContainer'
import Footer from './Footer'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SocialIcon from './social-icons/index'

const LayoutWrapper = ({ children }) => {
  return (
    <SectionContainer>
      <header className="flex items-center justify-between py-8 mx-8">
        <div>
          <Link href="/" aria-label={siteMetadata.username}>
            <div className="flex items-center justify-between">
              {typeof siteMetadata.headerTitle === 'string' ? (
                <div className="text-3xl text-primary-500 bebas">{siteMetadata.username}</div>
              ) : (
                siteMetadata.username
              )}
            </div>
          </Link>
        </div>
        <div className="flex items-center text-base leading-5">
          <div className="hidden sm:block mr-2">
            {headerNavLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="p-1 font-medium text-gray-900 sm:p-4 dark:text-gray-100"
              >
                {link.title}
              </Link>
            ))}
          </div>
          <div className="hidden sm:flex gap-1">
            <SocialIcon kind="github" href={siteMetadata.github} size="5" />
          </div>
          <ThemeSwitch />
          <MobileNav />
        </div>
      </header>
      <div className="flex flex-col justify-between h-screen w-full max-w-3xl px-4 mx-auto sm:px-6 xl:max-w-3xl xl:px-0">
        <main className="mb-auto">{children}</main>
        <Footer />
      </div>
    </SectionContainer>
  )
}

export default LayoutWrapper
