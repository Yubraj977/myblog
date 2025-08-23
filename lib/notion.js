const { Client } = require('@notionhq/client')
const { NotionToMarkdown } = require('notion-to-md')
const fs = require('fs')
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
      const title = page.properties.titile?.title[0]?.plain_text || 'Untitled'
      const slug = page.properties.slug?.rich_text[0]?.plain_text || title.toLowerCase().replace(/\s+/g, '-')
      const date = page.properties.Date?.date?.start || new Date().toISOString().split('T')[0]
      const tags = page.properties.tags?.multi_select?.map(tag => tag.name) || []
      const summary = page.properties.content?.rich_text[0]?.plain_text?.substring(0, 150) + '...' || ''

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

  for (const post of posts) {
    const frontmatter = `---
title: "${post.title}"
date: "${post.date}"
tags: [${post.tags.map(tag => `"${tag}"`).join(', ')}]
draft: false
summary: "${post.summary}"${post.thumbnail ? `\nimages: ["${post.thumbnail}"]` : ''}
---

`

    const fileContent = frontmatter + post.content
    const fileName = `${post.slug}.mdx`
    const filePath = path.join(blogDir, fileName)

    fs.writeFileSync(filePath, fileContent, 'utf8')
    console.log(`Generated: ${fileName}`)
  }

  console.log(`✅ Generated ${posts.length} blog posts from Notion`)
}

module.exports = {
  getNotionPosts,
  generateMarkdownFiles,
}