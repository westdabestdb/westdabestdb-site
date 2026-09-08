import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  reactStrictMode: true,
  images: {
    // Next 16 only honours a `quality` prop that is listed here.
    qualities: [75, 90],
  },
  async redirects() {
    return [
      { source: '/projects', destination: '/work', permanent: true },
      { source: '/archive', destination: '/writing', permanent: true },
      { source: '/about', destination: '/', permanent: true },
      // There is no /cv page any more — the CV is the PDF.
      { source: '/cv', destination: '/resume.pdf', permanent: true },
    ]
  },
}

export default nextConfig
