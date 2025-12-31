// Query to fetch published templates from Sanity, filtered by niche
export const getPublishedTemplatesByNicheQuery = `*[_type == "template" && isPublished == true && niche == $niche] | order(_createdAt desc) {
  _id,
  title,
  format,
  niche,
  concept,
  structure,
  _updatedAt,
  _createdAt
}`

// Query to fetch all published templates
export const getAllPublishedTemplatesQuery = `*[_type == "template" && isPublished == true] | order(_createdAt desc) {
  _id,
  title,
  format,
  niche,
  concept,
  structure,
  _updatedAt,
  _createdAt
}`

