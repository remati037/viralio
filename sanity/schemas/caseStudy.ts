import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'caseStudy',
  title: 'Studija slučaja (Case Study)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Naslov',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'niche',
      title: 'Niša',
      type: 'string',
      options: {
        list: [
          { title: 'Marketing & Biznis', value: 'Marketing' },
          { title: 'Nekretnine', value: 'Nekretnine' },
          { title: 'Fitness & Zdravlje', value: 'Fitness' },
          { title: 'E-commerce', value: 'E-commerce' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'format',
      title: 'Format',
      type: 'string',
      options: {
        list: [
          { title: 'Kratka Forma', value: 'Kratka Forma' },
          { title: 'Duga Forma', value: 'Duga Forma' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hook',
      title: 'Hook',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'cta',
      title: 'CTA (Call to Action)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'analysis',
      title: 'Analiza',
      type: 'array',
      of: [
        {
          type: 'block',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImageUrl',
      title: 'URL naslovne slike',
      type: 'url',
    }),
    defineField({
      name: 'resultViews',
      title: 'Rezultat - Pregledi',
      type: 'string',
    }),
    defineField({
      name: 'resultEngagement',
      title: 'Rezultat - Engagement',
      type: 'string',
    }),
    defineField({
      name: 'resultConversions',
      title: 'Rezultat - Konverzije',
      type: 'string',
    }),
    defineField({
      name: 'originalTemplate',
      title: 'Originalni šablon',
      type: 'string',
    }),
    defineField({
      name: 'publishDate',
      title: 'Datum objave',
      type: 'datetime',
    }),
    defineField({
      name: 'categoryId',
      title: 'ID kategorije (opciono)',
      type: 'string',
      description: 'ID kategorije iz Supabase (task_categories)',
    }),
    defineField({
      name: 'sanityId',
      title: 'Sanity ID (za sync)',
      type: 'string',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      format: 'format',
      niche: 'niche',
      views: 'resultViews',
    },
    prepare({ title, format, niche, views }) {
      return {
        title: title || 'Bez naslova',
        subtitle: `${format} • ${niche} ${views ? `• ${views} pregleda` : ''}`,
      }
    },
  },
})

