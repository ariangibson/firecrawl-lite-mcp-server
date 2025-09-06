# Firecrawl Lite MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **privacy-first, standalone** MCP server that provides web scraping and data extraction tools using local browser automation and your own LLM API key. **No external dependencies or API keys required** - completely decoupled from Firecrawl's cloud service.

## � **What Makes Firecrawl Lite Special**

### **🔒 Privacy-First Architecture**
- **Local Processing** - All web scraping and data extraction happens on your machine
- **Your Data Stays Local** - Content is processed locally, not sent to third parties
- **No External Service Lock-in** - Doesn't require Firecrawl's cloud API
- **Complete Control** - You own your data and infrastructure

### **💰 Cost-Effective & Transparent**
- **Pay Only for LLM Usage** - No additional subscription or API fees
- **Your LLM Provider** - Compatible with OpenAI, xAI, Anthropic, Ollama, etc.
- **Predictable Costs** - Transparent pricing based on your chosen LLM rates

### **⚡ Performance & Simplicity**
- **Lightning-Fast Startup** - Lightweight design means quick initialization
- **Single Container** - Simple deployment with Docker support
- **Minimal Resource Usage** - Optimized for efficiency and low memory footprint

## 📊 **Feature Comparison**

| Feature | Firecrawl Lite ✅ | Original Firecrawl ❌ |
|---------|-------------------|----------------------|
| **🏠 Deployment** | **Standalone/Local** | Cloud Service |
| **🔑 API Keys Required** | **Your LLM key only** | Firecrawl API + LLM keys |
| **🔒 Data Privacy** | **100% local processing** | Cloud processing |
| **💰 Cost Model** | **LLM usage only** | Subscription + LLM costs |
| **⚙️ Setup Complexity** | **Single container** | Multi-service deployment |
| **📦 Bundle Size** | **~50MB lightweight** | Heavy multi-service |
| **🏠 Local LLM Support** | **✅ Ollama/Local LLMs** | Limited local options |
| **🎛️ Customization** | **Full control** | Limited customization |
| **🚀 Startup Time** | **< 5 seconds** | Variable (cloud dependent) |
| **🔧 Maintenance** | **Self-managed** | Managed service |

## �️ **Available Tools**

This standalone version provides local web scraping and data extraction using Puppeteer and your own LLM:

### ✅ **`scrape_page`** - Extract content from a single webpage
- **Implementation**: Local browser automation with Puppeteer
- **Use case**: Get webpage content for LLMs to read
- **Parameters**: `url`, `onlyMainContent`
- **Privacy**: All data processed locally

### ✅ **`batch_scrape`** - Scrape multiple URLs in a single request
- **Implementation**: Sequential local scraping with rate limiting
- **Use case**: Process multiple pages efficiently
- **Parameters**: `urls[]`, `onlyMainContent`
- **Privacy**: All data processed locally

### ✅ **`extract_data`** - Extract structured data using LLM
- **Implementation**: Local scraping + your LLM for data extraction
- **Use case**: Pull specific data from pages using natural language prompts
- **Parameters**: `urls[]`, `prompt`, `enableWebSearch`
- **Privacy**: Content scraped locally, sent to your LLM only

### ✅ **`extract_with_schema`** - Extract data using JSON schema
- **Implementation**: Local scraping + schema-guided LLM extraction
- **Use case**: Extract structured data with predefined schema
- **Parameters**: `urls[]`, `schema`, `prompt`, `enableWebSearch`
- **Privacy**: Content scraped locally, sent to your LLM only

## 🚀 **Quick Start**

### **1. Install the package:**
```bash
npm install -g @ariangibson/firecrawl-lite-mcp-server
```

Or use npx to run without global installation (recommended).

### **2. Configure your LLM:**
```bash
# Create a .env file or set environment variables
LLM_API_KEY=your_llm_api_key_here
LLM_PROVIDER_BASE_URL=https://api.x.ai/v1
LLM_MODEL=grok-code-fast-1
```

### **3. Configure your MCP client:**

#### **Claude Desktop**
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

**Option 1: Using npx (recommended)**
```json
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "npx",
      "args": ["-y", "@ariangibson/firecrawl-lite-mcp-server"],
      "env": {
        "LLM_API_KEY": "your_llm_api_key_here",
        "LLM_PROVIDER_BASE_URL": "https://api.x.ai/v1",
        "LLM_MODEL": "grok-code-fast-1"
      }
    }
  }
}
```

**Option 2: Using global installation (fallback for LM Studio)**
```json
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "firecrawl-lite-mcp-server",
      "env": {
        "LLM_API_KEY": "your_llm_api_key_here",
        "LLM_PROVIDER_BASE_URL": "https://api.x.ai/v1",
        "LLM_MODEL": "grok-code-fast-1"
      }
    }
  }
}
```

#### **Claude Code (CLI)**
```bash
claude config mcp add firecrawl-lite \
  --command "npx" \
  --args "-y" --args "@ariangibson/firecrawl-lite-mcp-server" \
  --env LLM_API_KEY=your_llm_api_key_here \
  --env LLM_PROVIDER_BASE_URL=https://api.x.ai/v1 \
  --env LLM_MODEL=grok-code-fast-1
```

### **4. Restart your MCP client and start scraping!**

## ⚙️ **Configuration Guide**

### **Required Environment Variables**
```bash
# Your LLM API key (xAI, OpenAI, Anthropic, etc.)
LLM_API_KEY=your_api_key_here

# LLM provider base URL
LLM_PROVIDER_BASE_URL=https://api.x.ai/v1

# LLM model name
LLM_MODEL=grok-code-fast-1
```

### **LLM Provider Examples**
```bash
# xAI (Grok)
LLM_PROVIDER_BASE_URL=https://api.x.ai/v1
LLM_API_KEY=xai-your-key-here
LLM_MODEL=grok-code-fast-1

# OpenAI
LLM_PROVIDER_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4o-mini

# Anthropic
LLM_PROVIDER_BASE_URL=https://api.anthropic.com
LLM_API_KEY=sk-ant-your-key-here
LLM_MODEL=claude-3-haiku-20240307

# Local LLM (Ollama)
LLM_PROVIDER_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=your-local-key
LLM_MODEL=llama2
```

### **Optional Configuration**
```bash
# Proxy configuration (for web scraping and LLM API calls)
PROXY_SERVER_URL=http://your-proxy.com:8080
PROXY_SERVER_USERNAME=your_proxy_username
PROXY_SERVER_PASSWORD=your_proxy_password

# Scraping configuration (anti-detection and rate limiting)
SCRAPE_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
SCRAPE_VIEWPORT_WIDTH=1920
SCRAPE_VIEWPORT_HEIGHT=1080
SCRAPE_DELAY_MIN=1000
SCRAPE_DELAY_MAX=3000
```

## 🛡️ **Anti-Detection Features**

Firecrawl Lite includes sophisticated anti-detection measures to handle modern websites with bot protection:

### ✅ **Built-in Anti-Detection**
- **Realistic Browser Fingerprinting**: Spoofs navigator properties, plugins, and browser APIs
- **Random Delays**: Adds human-like delays between requests (configurable)
- **Modern User Agent**: Uses up-to-date Chrome user agent strings
- **Viewport Simulation**: Sets realistic desktop viewport sizes
- **Headless Optimization**: Configured for maximum stealth in headless mode

### ✅ **Configurable Settings**
```bash
# Control delays (in milliseconds)
SCRAPE_DELAY_MIN=1000      # Minimum delay before navigation
SCRAPE_DELAY_MAX=3000      # Maximum delay before navigation
SCRAPE_BATCH_DELAY_MIN=2000 # Minimum delay between batch requests
SCRAPE_BATCH_DELAY_MAX=5000 # Maximum delay between batch requests
```

## � **Docker Deployment (Optional)**

If you prefer Docker deployment:

```bash
# Build and run with Docker
docker-compose up --build

# Run in background
docker-compose up -d --build
```

The server will be available at `http://localhost:3000` with a health endpoint at `http://localhost:3000/health`.

## 📊 **Usage Examples**

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

## ❓ **Important Notes**

### **🌐 Internet Requirements**
- **Requires Internet Access** - Still needs to access target websites
- **LLM API Access** - Requires connection to your chosen LLM provider
- **No Offline Operation** - Cannot work completely offline

### **� Intentionally Excluded Features**
By design, this lite version excludes advanced features to maintain simplicity:
- Web search functionality
- Website URL discovery/mapping
- Multi-page website crawling
- LLMs.txt file generation
- Advanced research capabilities
- Crawl job status checking

## 🙏 **Credits & Acknowledgments**

This project is inspired by and builds upon the excellent work of the original Firecrawl projects:

### 🔥 **[Firecrawl](https://firecrawl.com)**
The original Firecrawl project by **Mendable.ai** - a comprehensive web scraping and crawling platform with advanced features like website mapping, multi-page crawling, and deep research capabilities.

### 🔥 **[Firecrawl MCP Server](https://github.com/firecrawl/firecrawl-mcp-server)**
The official MCP server implementation by the Firecrawl team, providing MCP integration for their cloud-based scraping service.

**We give huge thanks to the Firecrawl team for their pioneering work in web scraping and MCP integration!** 🚀

> **💡 Looking for a very generous free tier and dead-simple cloud-hosted solution?**  
> Visit **[firecrawl.com](https://firecrawl.com)** and sign up for a Firecrawl account! Their cloud service offers enterprise-grade web scraping with zero setup complexity.

## �📝 **License**

MIT License - see [LICENSE](LICENSE) for details.
