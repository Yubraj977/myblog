#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { generateMarkdownFiles } = require('../lib/notion')

async function main() {
  console.log('🔄 Syncing posts from Notion...')
  
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    console.error('❌ Missing NOTION_TOKEN or NOTION_DATABASE_ID in .env.local')
    process.exit(1)
  }

  try {
    await generateMarkdownFiles()
    console.log('✅ Notion sync completed!')
  } catch (error) {
    console.error('❌ Error syncing from Notion:', error)
    process.exit(1)
  }
}

main()