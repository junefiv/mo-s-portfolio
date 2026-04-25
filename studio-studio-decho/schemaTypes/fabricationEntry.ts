import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'fabricationEntry',
  title: 'Fabrication entry',
  type: 'document',
  fields: [
    defineField({
      name: 'sortNo',
      title: 'Sort number',
      type: 'number',
      description:
        '큰 숫자가 목록 위쪽(먼저)에 옵니다. /admin 등록 시 자동 부여, 아카이브에서 순서 변경 시 갱신됩니다. (구문서는 비어 있을 수 있음)',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subTitle',
      title: 'Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: '예: Workshop, Studio, Seminar',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 12,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Images',
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
  preview: {
    select: {title: 'title', year: 'year', subtitle: 'subTitle', media: 'images.0'},
    prepare({title, year, subtitle, media}) {
      return {
        title: title ?? 'Untitled',
        subtitle: [year, subtitle].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
