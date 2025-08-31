# Firecrawl Lite MCP Server

A lightweight, privacy-focused MCP server for essential Firecrawl tools using your own LLM API key.

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd firecrawl-mcp-server
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your LLM API key
   ```

3. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Configuration

### Required Environment Variables
```bash
# Your LLM API key (xAI, OpenAI, Anthropic, etc.)
LLM_API_KEY=your_api_key_here

# LLM provider
LLM_PROVIDER=xai

# LLM model
LLM_MODEL=grok-code-fast-1
```

### Optional (for cloud Firecrawl fallback)
```bash
# Use cloud Firecrawl instead of local LLM
FIRECRAWL_API_KEY=your_firecrawl_key
FIRECRAWL_API_URL=https://api.firecrawl.dev
```

## 🛠️ Available Tools (4 Essential Tools)

This lightweight version focuses on the most essential Firecrawl tools:

### ✅ **`scrape_page`** - Extract content from a single webpage
- **Use case**: Get webpage content for LLMs to read
- **Parameters**: `url`, `onlyMainContent`

### ✅ **`batch_scrape`** - Scrape multiple URLs in a single request
- **Use case**: Process multiple pages efficiently
- **Parameters**: `urls[]`, `onlyMainContent`

### ✅ **`extract_data`** - Extract structured data using LLM
- **Use case**: Pull specific data from pages using natural language prompts
- **Parameters**: `urls[]`, `prompt`, `enableWebSearch`

### ✅ **`extract_with_schema`** - Extract data using JSON schema
- **Use case**: Extract structured data with predefined schema
- **Parameters**: `urls[]`, `schema`, `prompt`, `enableWebSearch`

## ❌ **Intentionally Excluded Tools**

By design, this lite version excludes the following tools to maintain simplicity:

- **`search_web`** - Web search functionality
- **`map_website`** - Website URL discovery
- **`crawl_website`** - Multi-page website crawling
- **`generate_llms_txt`** - LLMs.txt file generation
- **`deep_research`** - Advanced research capabilities
- **`crawl_status`** - Crawl job status checking

## 🐳 Docker Usage

```bash
# Build and run with Docker
docker-compose up --build

# Run in background
docker-compose up -d --build
```

## 🎯 MCP Configuration

### For Cursor/VS Code:
```json
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "node",
      "args": ["/path/to/firecrawl-mcp-server/dist/index.js"],
      "env": {
        "LLM_API_KEY": "your_key_here",
        "LLM_PROVIDER": "xai",
        "LLM_MODEL": "grok-code-fast-1"
      }
    }
  }
}
```

### For Claude Desktop:
```json
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "LLM_API_KEY": "your_key_here"
      }
    }
  }
}
```

## 🔧 LLM Provider Support

### xAI (Grok)
```bash
LLM_PROVIDER=xai
LLM_MODEL=grok-code-fast-1
LLM_API_KEY=xai-your-key-here
```

### OpenAI
```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=sk-your-key-here
```

### Anthropic
```bash
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-haiku-20240307
LLM_API_KEY=sk-ant-your-key-here
```

## 📊 Tool Usage Examples

### Scrape a webpage
```json
{
  "name": "scrape_page",
  "arguments": {
    "url": "https://example.com"
  }
}
```

### Batch scrape multiple URLs
```json
{
  "name": "batch_scrape",
  "arguments": {
    "urls": ["https://example.com", "https://example.org"],
    "onlyMainContent": true
  }
}
```

### Extract data with prompt
```json
{
  "name": "extract_data",
  "arguments": {
    "urls": ["https://example.com"],
    "prompt": "Extract the main article title and summary"
  }
}
```

### Extract with schema
```json
{
  "name": "extract_with_schema",
  "arguments": {
    "urls": ["https://example.com"],
    "schema": {
      "type": "object",
      "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"}
      }
    }
  }
}
```

## 🎯 Why Firecrawl Lite?

- ✅ **Essential tools only** - Focused on core scraping and extraction
- ✅ **Your API key only** - No third-party LLM dependencies
- ✅ **Privacy focused** - Your data stays with your LLM provider
- ✅ **Cost control** - Pay only for your LLM usage
- ✅ **Simple setup** - Single container, minimal configuration
- ✅ **Lightweight** - Smaller footprint, faster startup

## 🆚 **Comparison: Lite vs Full Firecrawl**

| Feature | Firecrawl Lite ✅ | Full Firecrawl ❌ |
|---------|-------------------|-------------------|
| Single page scraping | ✅ | ✅ |
| Batch scraping | ✅ | ✅ |
| Data extraction | ✅ | ✅ |
| Schema-based extraction | ✅ | ✅ |
| Web search | ❌ (by design) | ✅ |
| Website mapping | ❌ (by design) | ✅ |
| Multi-page crawling | ❌ (by design) | ✅ |
| LLMs.txt generation | ❌ (by design) | ✅ |
| Deep research | ❌ (by design) | ✅ |
| **Bundle size** | **Lightweight** | **Heavy** |
| **Setup complexity** | **Simple** | **Complex** |

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.
