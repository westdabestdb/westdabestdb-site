import Link from '@/components/Link'

export default function ProjectsLayout({ ownProjects, contributedProjects, title }) {
  return (
    <>
      <div className="divide-y">
        <div className="pt-6 pb-8 space-y-2 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            {title}
          </h1>
          <div className="flex flex-col gap-16">
            <div>
              <h2 className="text-lg font-extrabold leading-9 tracking-tight text-gray-700 dark:text-gray-300 sm:text-xl sm:leading-10 md:text-2xl md:leading-9 mb-2">
                Products I built
                <span role="img" aria-label="arm" className="ml-2">
                  🦾
                </span>
              </h2>
              <div className="flex flex-col gap-4">
                {ownProjects.map((project) => (
                  <ProjectCard key={project.name} project={project} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-extrabold leading-9 tracking-tight text-gray-700 dark:text-gray-300 sm:text-xl sm:leading-10 md:text-2xl md:leading-9 mb-2">
                Products I helped launch
                <span role="img" aria-label="arm" className="ml-2">
                  🚀
                </span>
              </h2>
              <div className="flex flex-col gap-4">
                {contributedProjects.map((project) => (
                  <ProjectCard key={project.name} project={project} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ProjectCard({ project }) {
  return (
    <Link
      href={project.link}
      className="p-4 flex-col flex lg:flex-row gap-4 group hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent bg-opacity-20 rounded-xl transition duration-200"
    >
      <img
        src={project.image}
        alt={project.name}
        className="object-cover lg:h-24 lg:w-32 rounded-lg"
      />
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 dark:text-gray-100">
          {project.name}
        </h2>
        <p className="prose text-gray-500 max-w-none dark:text-gray-400 line-clamp-3 font-medium bitter text-md">
          {project.description}
        </p>
      </div>
    </Link>
  )
}
