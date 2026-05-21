import elvinProfile from '@/assets/Elvin_profile.png'
import moProfile from '@/assets/Mo_profile.png'
import {useCallback, useState, type ReactNode} from 'react'
import {useNavigate} from 'react-router'

const BOLD_NAME_PARTS = new Set(['Elvin Demiri', 'Mo Cho', 'Elvin', 'Mo'])

const SECRET_STEPS = ['elvin', 'mo', 'shimjunhyuk'] as const
type SecretStep = (typeof SECRET_STEPS)[number]

const secretTapClass =
  'cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

function boldNames(text: string): ReactNode[] {
  return text.split(/(Elvin Demiri|Mo Cho|Elvin|Mo)/g).map((part, index) =>
    BOLD_NAME_PARTS.has(part) ? (
      <strong key={index} className="font-bold">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

const BIO_PARAGRAPHS = [
  'Elvin Demiri and Mo Cho are a Germany-based architectural duo of Albanian-Greek and Korean origin. Shaped by academic and professional experience across diverse cultural contexts, their work is informed by an international perspective on architecture, urban development, and societal transformation.',
  'Through collaborations with architectural practices in Germany, the United Kingdom, Greece, and South Korea, they have contributed to projects of various scales, ranging from urban developments to international architectural competitions. They understand architecture as an interdisciplinary process that benefits from exchange and collaboration across disciplines and cultural contexts.',
  'Their work explores the relationship between architecture, urban transformation, culture, and public impact. With a strong context-oriented approach, they seek solutions that combine architectural quality with cultural sensitivity and long-term social and ecological responsibility. A particular focus lies in how architecture and urban development can contribute to the creation of sustainable, inclusive, and identity-shaping environments.',
] as const

const ELVIN_BIO =
  'Elvin is an architect and urban designer whose work is driven by an interest in urban transformation, public space, and the cultural dimension of architecture. His experience across Europe has shaped a design approach that combines strategic thinking with sensitivity to context and social impact.'

const MO_BIO =
  'Mo is a Korean engineer and architect with a strong interest in materiality, spatial experience, and contemporary urban culture. His international background informs a thoughtful and detail-oriented approach to architecture across different cultural contexts.'

const profileImageClass =
  'pointer-events-none h-auto w-full max-w-[11rem] object-contain xs:max-w-[12rem] sm:max-w-[13rem] md:max-w-[14rem]'

const bodyTextClass = 'text-left text-sm leading-relaxed text-foreground/90 xs:text-base'

export default function Info() {
  const navigate = useNavigate()
  const [secretStep, setSecretStep] = useState(0)

  const advanceSecret = useCallback(
    (key: SecretStep) => {
      const expected = SECRET_STEPS[secretStep]
      if (key !== expected) {
        setSecretStep(0)
        return
      }
      const next = secretStep + 1
      if (next >= SECRET_STEPS.length) {
        setSecretStep(0)
        navigate('/admin')
        return
      }
      setSecretStep(next)
    },
    [navigate, secretStep],
  )

  return (
    <main className="px-6">
      <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-20">
        <div className="mx-auto w-full max-w-4xl text-left">
          <div className="max-w-3xl space-y-4">
            {BIO_PARAGRAPHS.map((paragraph, index) => (
              <p key={index} className={bodyTextClass}>
                {boldNames(paragraph)}
              </p>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-12 xs:mt-12 md:mt-14 md:gap-16">
            <section
              aria-labelledby="info-elvin"
              className="mx-auto flex w-fit max-w-full min-w-0 flex-col items-center gap-6 xs:gap-8 sm:flex-row sm:items-center sm:gap-10 md:gap-12"
            >
              <figure className="min-w-0 shrink-0">
                <button
                  type="button"
                  className={secretTapClass}
                  aria-label="Elvin Demiri portrait"
                  onClick={() => advanceSecret('elvin')}
                >
                  <img
                    src={elvinProfile}
                    alt=""
                    className={profileImageClass}
                    width={512}
                    height={512}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              </figure>
              <p id="info-elvin" className={`min-w-0 max-w-xl ${bodyTextClass}`}>
                {boldNames(ELVIN_BIO)}
              </p>
            </section>

            <section
              aria-labelledby="info-mo"
              className="mx-auto flex w-fit max-w-full min-w-0 flex-col items-center gap-6 xs:gap-8 sm:flex-row sm:items-center sm:gap-10 md:gap-12"
            >
              <figure className="min-w-0 shrink-0">
                <button
                  type="button"
                  className={secretTapClass}
                  aria-label="Mo Cho portrait"
                  onClick={() => advanceSecret('mo')}
                >
                  <img
                    src={moProfile}
                    alt=""
                    className={profileImageClass}
                    width={512}
                    height={512}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              </figure>
              <p id="info-mo" className={`min-w-0 max-w-xl ${bodyTextClass}`}>
                {boldNames(MO_BIO)}
              </p>
            </section>
          </div>

          <footer className="mt-16 w-full border-t border-border pt-8 xs:mt-20 md:mt-24 md:pt-10">
            <p className="max-w-xl text-left text-sm leading-relaxed text-muted-foreground/80">
              by git_in means: 옷<strong className="font-bold text-muted-foreground">깃</strong>만 스쳐도{' '}
              <strong className="font-bold text-muted-foreground">인</strong>연 by{' '}
              <button
                type="button"
                className={secretTapClass}
                onClick={() => advanceSecret('shimjunhyuk')}
              >
                심준혁
              </button>
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
