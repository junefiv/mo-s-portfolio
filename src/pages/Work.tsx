import { useEffect, useRef, useState } from 'react'

export default function Work() {
  const [activeProject, setActiveProject] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const projectRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const projects = [
    {
      title: 'Urban Living Lab',
      location: 'Boston, MA',
      year: '2026',
      type: 'Architecture',
    },
    {
      title: 'Parametric Pavilion',
      location: 'New York, NY',
      year: '2025',
      type: 'Installation',
    },
    {
      title: 'Adaptive Facades',
      location: 'London, UK',
      year: '2025',
      type: 'Research',
    },
    {
      title: 'Modular Housing',
      location: 'Tokyo, JP',
      year: '2024',
      type: 'Architecture',
    },
    {
      title: 'Material Research Center',
      location: 'Zurich, CH',
      year: '2024',
      type: 'Architecture',
    },
    {
      title: 'Computational Design Lab',
      location: 'Berlin, DE',
      year: '2023',
      type: 'Research',
    },
    {
      title: 'Sustainable Tower',
      location: 'Singapore, SG',
      year: '2023',
      type: 'Architecture',
    },
    {
      title: 'Digital Fabrication Hub',
      location: 'Barcelona, ES',
      year: '2022',
      type: 'Architecture',
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true)

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 1000)

      const scrollPosition = window.scrollY + window.innerHeight / 2

      for (let i = projectRefs.current.length - 1; i >= 0; i--) {
        const element = projectRefs.current[i]
        if (element && element.offsetTop <= scrollPosition) {
          setActiveProject(i)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const scrollToProject = (index: number) => {
    projectRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <div className="pt-20 px-6">
      <div className="max-w-screen-2xl mx-auto py-20 relative">
        <h1 className="text-5xl md:text-7xl tracking-tight mb-16">WORK</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {projects.map((project, index) => (
            <div
              key={index}
              ref={(el) => {
                projectRefs.current[index] = el
              }}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] bg-gray-100 mb-4 group-hover:opacity-80 transition-opacity" />
              <h3 className="text-xl mb-2">{project.title}</h3>
              <div className="text-sm opacity-60">
                <p>{project.location}</p>
                <p>
                  {project.year} — {project.type}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`fixed right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 md:gap-2 z-40 transition-opacity duration-300 ${
            isScrolling ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {projects.map((project, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToProject(index)}
              className={`text-right transition-all ${
                activeProject === index
                  ? 'text-sm md:text-base opacity-100'
                  : 'text-xs opacity-30 hover:opacity-60'
              }`}
            >
              {project.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
