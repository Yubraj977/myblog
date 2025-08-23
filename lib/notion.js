// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require('@notionhq/client')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { NotionToMarkdown } = require('notion-to-md')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// Initialize NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion })

async function getNotionPosts() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'published',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    })

    const posts = []

    for (const page of response.results) {
      const pageId = page.id

      // Get page content as markdown
      const mdblocks = await n2m.pageToMarkdown(pageId)
      const mdString = n2m.toMarkdownString(mdblocks)

      // Extract properties
      const title = page.properties.title?.title[0]?.plain_text || 'Untitled'
      const slug =
        page.properties.slug?.rich_text[0]?.plain_text || title.toLowerCase().replace(/\s+/g, '-')
      const date = page.properties.Date?.date?.start || new Date().toISOString().split('T')[0]
      const tags = page.properties.tags?.multi_select?.map((tag) => tag.name) || []
      const summary =
        page.properties.content?.rich_text[0]?.plain_text?.substring(0, 150) + '...' || ''

      // Extract first image from content for thumbnail
      const imageMatch = mdString.parent?.match(/!\[.*?\]\((.*?)\)/)
      const thumbnail = imageMatch ? imageMatch[1] : null

      posts.push({
        id: pageId,
        title,
        slug,
        date,
        tags,
        summary,
        content: mdString.parent,
        thumbnail,
      })
    }

    return posts
  } catch (error) {
    console.error('Error fetching Notion posts:', error)
    return []
  }
}

async function generateMarkdownFiles() {
  const posts = await getNotionPosts()
  const blogDir = path.join(process.cwd(), 'data', 'blog')

  // Ensure blog directory exists
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true })
  }

  // Get all existing Notion-generated files (exclude manual posts)
  const existingFiles = fs.readdirSync(blogDir).filter((file) => file.endsWith('.mdx'))
  const manualPosts = [
    'Hosting-locally-own-server.mdx',
    'why-software-reliablity-matters-in-critical-systems.mdx',
  ]
  const notionFiles = existingFiles.filter((file) => !manualPosts.includes(file))

  // Track current Notion post slugs
  const currentSlugs = posts.map((post) => `${post.slug}.mdx`)

  // Delete files that no longer exist in Notion
  for (const file of notionFiles) {
    if (!currentSlugs.includes(file)) {
      const filePath = path.join(blogDir, file)
      fs.unlinkSync(filePath)
      console.log(`🗑️  Deleted: ${file}`)
    }
  }

  // Create/Update posts from Notion
  for (const post of posts) {
    const frontmatter = `---
title: "${post.title}"
date: "${post.date}"
tags: [${post.tags.map((tag) => `"${tag}"`).join(', ')}]
draft: false
summary: "${post.summary}"${post.thumbnail ? `\nimages: ["${post.thumbnail}"]` : ''}
---

`

    const fileContent = frontmatter + post.content
    const fileName = `${post.slug}.mdx`
    const filePath = path.join(blogDir, fileName)

    const existed = fs.existsSync(filePath)
    fs.writeFileSync(filePath, fileContent, 'utf8')

    if (existed) {
      console.log(`📝 Updated: ${fileName}`)
    } else {
      console.log(`✨ Created: ${fileName}`)
    }
  }

  console.log(`✅ Synced ${posts.length} blog posts from Notion`)
}

module.exports = {
  getNotionPosts,
  generateMarkdownFiles,
}
