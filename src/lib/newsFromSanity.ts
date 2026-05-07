import {sanityPublicClient} from './sanityPublicClient'

const newsPostsQuery = `*[_type == "newsPost"] | order(publishedAt desc) {
  _id,
  title,
  "date": publishedAt,
  body,
  "imageUrls": images[].asset->url
}`

export type SanityNewsPost = {
  _id: string
  title: string | null
  date: string | null
  body: string | null
  imageUrls: (string | null)[] | null
}

export async function fetchNewsPosts(): Promise<SanityNewsPost[]> {
  return sanityPublicClient.fetch<SanityNewsPost[]>(newsPostsQuery)
}
