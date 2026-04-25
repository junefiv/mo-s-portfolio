import {sanityPublicClient} from './sanityPublicClient'

const newsPostsQuery = `*[_type == "newsPost"] | order(publishedAt desc) {
  _id,
  title,
  "date": publishedAt,
  body,
  "coverUrl": images[0].asset->url
}`

export type SanityNewsPost = {
  _id: string
  title: string | null
  date: string | null
  body: string | null
  coverUrl: string | null
}

export async function fetchNewsPosts(): Promise<SanityNewsPost[]> {
  return sanityPublicClient.fetch<SanityNewsPost[]>(newsPostsQuery)
}
