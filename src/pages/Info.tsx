import elvinProfile from '@/assets/Elvin_profile.png'
import moProfile from '@/assets/Mo_profile.png'
import {SITE_TITLE} from '@/siteMeta'
import {useCallback, useEffect, useRef, useState, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
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

const STUDIO_EMAIL = 'info@studiodecho.com'

const GIT_IN_EMAIL = 'dasawafa@gmail.com'

const GIT_IN_GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(GIT_IN_EMAIL)}`

const COPY_EMAIL_TOAST_MESSAGE = "Studio DeCho's email address has been copied!"

const COPY_TOAST_VISIBLE_MS = 2800

const profileImageClass =
  'pointer-events-none h-auto w-full max-w-[11rem] object-contain xs:max-w-[12rem] sm:max-w-[13rem] md:max-w-[14rem]'

const bodyTextClass = 'text-justify text-sm leading-relaxed text-foreground/90 xs:text-base'

function CopyIcon({className}: {className?: string}) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M6 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

/** 프로필 행(이미지 + 본문)과 동일한 최대 너비 — 이미지(md 14rem) + gap(md 3rem) + 본문(max-w-xl) */
const infoColumnClass =
  'mx-auto w-full min-w-0 max-w-[min(100%,calc(14rem+3rem+36rem))]'

const introBoxClass = 'w-full min-w-0 space-y-4'

const profileSectionClass =
  'flex w-full min-w-0 flex-col items-center gap-6 xs:gap-8 sm:flex-row sm:items-center sm:gap-10 md:gap-12'

export default function Info() {
  const navigate = useNavigate()
  const [secretStep, setSecretStep] = useState(0)
  const [emailToastOpen, setEmailToastOpen] = useState(false)
  const emailToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (emailToastTimerRef.current) clearTimeout(emailToastTimerRef.current)
    }
  }, [])

  const showEmailCopiedToast = useCallback(() => {
    setEmailToastOpen(true)
    if (emailToastTimerRef.current) clearTimeout(emailToastTimerRef.current)
    emailToastTimerRef.current = setTimeout(() => {
      setEmailToastOpen(false)
      emailToastTimerRef.current = null
    }, COPY_TOAST_VISIBLE_MS)
  }, [])

  const copyStudioEmail = useCallback(async () => {
    const ok = await copyTextToClipboard(STUDIO_EMAIL)
    if (ok) showEmailCopiedToast()
  }, [showEmailCopiedToast])

  const openGitInGmail = useCallback(() => {
    window.open(GIT_IN_GMAIL_COMPOSE, '_blank', 'noopener,noreferrer')
  }, [])

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
      <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className={`${infoColumnClass} flex flex-col gap-12 xs:gap-12 md:gap-16`}>
            <section
              aria-label="Studio introduction"
              className={`${introBoxClass} pt-[2lh] leading-relaxed`}
            >
              {BIO_PARAGRAPHS.map((paragraph, index) => (
                <p key={index} className={bodyTextClass}>
                  {boldNames(paragraph)}
                </p>
              ))}
            </section>

            <section
              aria-labelledby="info-elvin"
              className={profileSectionClass}
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
              <p id="info-elvin" className={`min-w-0 flex-1 sm:max-w-xl ${bodyTextClass}`}>
                {boldNames(ELVIN_BIO)}
              </p>
            </section>

            <section aria-labelledby="info-mo" className={profileSectionClass}>
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
              <p id="info-mo" className={`min-w-0 flex-1 sm:max-w-xl ${bodyTextClass}`}>
                {boldNames(MO_BIO)}
              </p>
            </section>

            <section
              aria-label="Contact"
              className="w-full min-w-0 border-t border-border pt-8 xs:pt-10"
            >
              <p className={`${bodyTextClass} font-bold`}>{SITE_TITLE}</p>
              <p
                className={`${bodyTextClass} mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1`}
              >
                <span>{STUDIO_EMAIL}</span>
                <button
                  type="button"
                  onClick={() => void copyStudioEmail()}
                  aria-label="Copy email address"
                  className="inline-flex shrink-0 items-center justify-center rounded-sm p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <CopyIcon className="h-4 w-4 xs:h-[1.125rem] xs:w-[1.125rem]" />
                </button>
              </p>
            </section>
          </div>

          <footer
            className={`${infoColumnClass} mt-16 cursor-pointer border-t border-border pt-1 transition-opacity hover:opacity-80 xs:mt-1 md:mt-1 md:pt-1`}
            role="link"
            tabIndex={0}
            aria-label={`Email git_in at ${GIT_IN_EMAIL} via Gmail`}
            onClick={openGitInGmail}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openGitInGmail()
              }
            }}
          >
            <p className="text-right text-[0.8rem] leading-snug text-muted-foreground/45 xs:text-[0.6875rem]">
              Site by git_in means: 옷<strong className="font-semibold text-muted-foreground/70">깃</strong>만
              스쳐도 <strong className="font-semibold text-muted-foreground/70">인</strong>연 by{' '}
              <button
                type="button"
                className={`${secretTapClass} text-[0.8rem] xs:text-[0.8rem]`}
                onClick={(e) => {
                  e.stopPropagation()
                  advanceSecret('shimjunhyuk')
                }}
              >
                심준혁
              </button>
            </p>
          </footer>
        </div>
      </div>
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 left-1/2 z-[100] max-w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 px-3 sm:bottom-6"
        >
          <div
            aria-hidden={!emailToastOpen}
            className={`rounded-sm border border-border bg-background/95 px-4 py-2.5 text-center text-sm text-foreground shadow-md backdrop-blur-sm transition-all duration-300 ease-out ${
              emailToastOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0'
            }`}
          >
            {COPY_EMAIL_TOAST_MESSAGE}
          </div>
        </div>,
        document.body,
      )}
    </main>
  )
}
