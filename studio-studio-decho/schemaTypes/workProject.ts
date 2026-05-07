import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'workProject',
  title: 'Work project',
  type: 'document',
  fields: [
    defineField({
      name: 'projectNo',
      title: 'Project number (sort / display)',
      type: 'number',
      description: '큰 숫자가 목록에서 먼저 오도록 쓸 수 있습니다.',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subTitle1',
      title: 'Subtitle 1',
      type: 'string',
      description: '첫 번째 부제 (예: 연도 · 장소)',
    }),
    defineField({
      name: 'subTitle2',
      title: 'Subtitle 2',
      type: 'string',
      description: '두 번째 부제 (같은 스타일, 다음 줄에 표시)',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 12,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imagesLeft',
      title: '도면 이미지 (왼쪽 열)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'imagesRight',
      title: '작품 이미지 (오른쪽 열)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
  ],
  orderings: [
    {
      title: 'Project number, high → low',
      name: 'projectNoDesc',
      by: [{field: 'projectNo', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', no: 'projectNo', media: 'imagesLeft.0'},
    prepare({title, no, media}) {
      return {
        title: title ?? 'Untitled',
        subtitle: typeof no === 'number' ? `#${no}` : '',
        media,
      }
    },
  },
})
