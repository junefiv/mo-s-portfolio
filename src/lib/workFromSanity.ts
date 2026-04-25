import {sanityPublicClient} from './sanityPublicClient'

const workProjectsQuery = `*[_type == "workProject"] | order(projectNo desc) {
  _id,
  projectNo,
  title,
  subTitle,
  body,
  "imagesLeft": imagesLeft[]{ "url": asset->url },
  "imagesRight": imagesRight[]{ "url": asset->url }
}`

export type SanityWorkProject = {
  _id: string
  projectNo: number | null
  title: string | null
  subTitle: string | null
  body: string | null
  imagesLeft: Array<{url: string | null} | null> | null
  imagesRight: Array<{url: string | null} | null> | null
}

export async function fetchWorkProjects(): Promise<SanityWorkProject[]> {
  return sanityPublicClient.fetch<SanityWorkProject[]>(workProjectsQuery)
}
