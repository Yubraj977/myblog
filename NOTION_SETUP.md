# Notion Blog Sync Setup

This document explains how to set up automatic synchronization between your Notion database and your blog.

## Prerequisites

1. A Notion account with a database for blog posts
2. GitHub repository with Actions enabled
3. Your blog hosted on GitHub Pages

## Notion Database Setup

Your Notion database must have these properties:

### Required Properties

- **title** (Title) - The blog post title
- **published** (Checkbox) - Whether the post should be published
- **Date** (Date) - Publication date
- **tags** (Multi-select) - Blog post tags
- **content** (Rich text) - Brief summary/description
- **slug** (Rich text) - URL slug (optional, auto-generated from title if not provided)

### Optional Properties

- Any images in the page content will be extracted as thumbnails

## GitHub Secrets Setup

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these repository secrets:

### 1. NOTION_TOKEN

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it (e.g., "Blog Sync")
4. Select your workspace
5. Copy the "Internal Integration Token"
6. Add it as `NOTION_TOKEN` in GitHub secrets

### 2. NOTION_DATABASE_ID

1. Open your Notion database
2. Click "Share" → "Copy link"
3. Extract the database ID from the URL:
   - URL: `https://notion.so/username/DATABASE_ID?v=VIEW_ID`
   - The DATABASE_ID is the 32-character string between slashes
4. Add it as `NOTION_DATABASE_ID` in GitHub secrets

## Notion Integration Permissions

1. In your Notion database, click "Share"
2. Invite your integration (the one you created above)
3. Give it "Can edit" permissions

## How It Works

### Automatic Sync

- Runs every 30 minutes via GitHub Actions
- Only syncs posts with `published` checkbox checked
- Creates/updates `.mdx` files in `data/blog/` directory
- Automatically triggers a rebuild of your site

### Manual Sync

- Go to GitHub → Actions → "Sync Notion to Blog"
- Click "Run workflow"

### Local Testing

```bash
# Create .env.local file with your secrets
NOTION_TOKEN=your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here

# Run sync locally
npm run notion:sync
```

## Troubleshooting

### Common Issues

1. **"No changes to commit"** - Check that:
   - Posts have `published` checkbox checked in Notion
   - Integration has access to your database
   - Database properties match required names

2. **"Missing NOTION_TOKEN"** - Verify:
   - Secret is added in GitHub with exact name `NOTION_TOKEN`
   - Integration token is valid and not expired

3. **"Properties undefined"** - Ensure:
   - Database has properties with exact names: `title`, `published`, `Date`, `tags`, `content`
   - Properties are the correct types (Title, Checkbox, Date, Multi-select, Rich text)

4. **Website not updating** - Check:
   - GitHub Actions completed successfully
   - GitHub Pages is enabled and deploying from Actions
   - No errors in the build process

### Debugging

Check the Actions tab in GitHub for detailed logs of the sync process.

## File Structure

The sync will create files like this:

```
data/blog/
├── your-post-slug.mdx
├── another-post.mdx
└── ...
```

Each file contains frontmatter and content:

```yaml
---
title: 'Your Post Title'
date: '2025-01-23'
tags: ['tag1', 'tag2']
draft: false
summary: 'Post summary from Notion'
images: ['https://image-url.com/image.jpg'] # if found in content
---
Your Notion page content converted to Markdown...
```
