#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { Client } = require('@notionhq/client')

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

async function debugDatabase() {
  try {
    console.log('🔍 Checking database structure...')

    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 1, // Just get one page to see the structure
    })

    if (response.results.length > 0) {
      const page = response.results[0]
      console.log('\n📋 Available properties:')
      Object.keys(page.properties).forEach((prop) => {
        console.log(`- ${prop}: ${page.properties[prop].type}`)
      })

      console.log('\n📄 Sample page data:')
      console.log(JSON.stringify(page.properties, null, 2))
    } else {
      console.log('❌ No pages found in database')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugDatabase()
