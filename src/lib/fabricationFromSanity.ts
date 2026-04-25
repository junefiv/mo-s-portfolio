import {sanityPublicClient} from './sanityPublicClient'

const fabricationQuery = `*[_type == "fabricationEntry"] | order(coalesce(sortNo, 0) desc) {
  _id,
  year,
  title,
  subTitle,
  category,
  body,
  "images": images[].asset->url
}`

export type SanityFabricationEntry = {
  _id: string
  year: string | null
  title: string | null
  subTitle: string | null
  category: string | null
  body: string | null
  images: (string | null)[] | null
}

export async function fetchFabricationEntries(): Promise<SanityFabricationEntry[]> {
  return sanityPublicClient.fetch<SanityFabricationEntry[]>(fabricationQuery)
}

export function fabricationBodyToParagraphs(body: string): string[] {
  const parts = body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : body.trim() ? [body.trim()] : []
}
