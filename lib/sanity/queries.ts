import { groq } from 'next-sanity'

export const templateQuery = groq`
  *[_type == "template" && defined(_id)] {
    _id,
    title,
    format,
    niche,
    concept,
    structure,
    isPublished,
    _updatedAt,
    _createdAt
  }
`

export const caseStudyQuery = groq`
  *[_type == "caseStudy" && defined(_id)] {
    _id,
    title,
    niche,
    format,
    hook,
    body,
    cta,
    analysis,
    coverImageUrl,
    resultViews,
    resultEngagement,
    resultConversions,
    originalTemplate,
    publishDate,
    categoryId,
    sanityId,
    _updatedAt,
    _createdAt
  }
`

