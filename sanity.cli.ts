import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7d9ft76t',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  },
  deployment: {
    appId: 'b5ov981nuqe4d6k2qfis28ge',
  },
})

