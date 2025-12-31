import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'template',
  title: 'Šablon (Template)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Naslov',
      type: 'string',
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
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'niche',
      title: 'Niša',
      type: 'string',
      options: {
        list: [
          { title: 'Marketing & Biznis', value: 'Marketing' },
          { title: 'Nekretnine & Real estate', value: 'Nekretnine' },
          { title: 'Fitness & Zdravlje', value: 'Fitness' },
          { title: 'E-commerce & Online prodaja', value: 'E-commerce' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'concept',
      title: 'Koncept',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'structure',
      title: 'Struktura',
      type: 'object',
      fields: [
        defineField({
          name: 'hook',
          title: 'Hook',
          type: 'text',
          rows: 3,
          hidden: ({ parent, document }) => {
            return document?.format === 'Duga Forma'
          },
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const format = (context.document as any)?.format
              if (format === 'Kratka Forma' && !value) {
                return 'Hook je obavezan za Kratka Forma'
              }
              return true
            }),
        }),
        defineField({
          name: 'body',
          title: 'Body',
          type: 'text',
          rows: 5,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cta',
          title: 'CTA (Call to Action)',
          type: 'text',
          rows: 2,
          hidden: ({ parent, document }) => {
            return document?.format === 'Duga Forma'
          },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const format = (context.document as any)?.format
          if (!value) {
            return 'Struktura je obavezna'
          }
          if (format === 'Kratka Forma') {
            if (!value.hook || !value.body) {
              return 'Za Kratka Forma, Hook i Body su obavezni'
            }
          } else if (format === 'Duga Forma') {
            if (!value.body) {
              return 'Za Duga Forma, Body je obavezan'
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'isPublished',
      title: 'Objavljeno',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      format: 'format',
      niche: 'niche',
      published: 'isPublished',
    },
    prepare({ title, format, niche, published }) {
      return {
        title: title || 'Bez naslova',
        subtitle: `${format} • ${niche} ${published ? '✓' : '✗'}`,
      }
    },
  },
})

