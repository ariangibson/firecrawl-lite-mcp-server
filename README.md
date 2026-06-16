# Firecrawl Lite MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **privacy-first, standalone** MCP server that provides web scraping and data extraction tools using local browser automation and your own LLM API key. **No external dependencies or API keys required**

## 🎯 **What Makes Firecrawl Lite Special**

### **🔒 Privacy-First Architecture**
- **Local Processing** - All web scraping and data extraction happens on your machine
- **Your Data Stays Local** - Content is processed locally, not sent to third parties
- **No External Service Lock-in** - Doesn't require a cloud API
- **Complete Control** - You own your data and infrastructure

### **💰 Cost-Effective & Transparent**
- **Pay Only for LLM Usage** - No additional subscription or API fees
- **Your LLM Provider** - Compatible with OpenAI, xAI, Anthropic, Ollama, etc.
- **Predictable Costs** - Transparent pricing based on your chosen LLM rates

### **⚡ Performance & Simplicity**
- **Lightning-Fast Startup** - Lightweight design means quick initialization
- **Single Container** - Simple deployment with Docker support
- **Minimal Resource Usage** - Optimized for efficiency and low memory footprint

## 🛠️ **Available Tools**

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

### ✅ **`screenshot`** - Take a screenshot of a webpage
- **Use case**: Capture visual representation of pages
- **Parameters**: `url`, `width`, `height`, `fullPage`

## 🚀 **Quick Start (Recommended)**

### **Claude Desktop**
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
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

### **Claude Code (CLI)**
```bash
claude mcp add firecrawl-lite npx -- -y @ariangibson/firecrawl-lite-mcp-server --env LLM_API_KEY=your_key --env LLM_PROVIDER_BASE_URL=https://api.x.ai/v1 --env LLM_MODEL=grok-code-fast-1
```

### **Cursor**
Add to your Cursor MCP configuration:
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

## ⚙️ **Configuration**

### **Required Environment Variables**
```bash
# Your LLM API key (xAI, OpenAI, Anthropic, etc.)
LLM_API_KEY=your_api_key_here

# LLM provider base URL
LLM_PROVIDER_BASE_URL=https://api.x.ai/v1

# LLM model name
LLM_MODEL=grok-code-fast-1
```

### **Optional LLM Tuning**
These are passed straight through to the provider's `chat/completions` request. Leave any of them unset to use the default (or omit the parameter entirely):
```bash
LLM_REASONING_EFFORT=high   # Reasoning effort for reasoning models (omitted if unset)
LLM_MAX_TOKENS=2000         # Max tokens in the response (default: 2000)
LLM_TEMPERATURE=0.1         # Sampling temperature (default: 0.1)
LLM_TOP_P=0.95              # Nucleus sampling top_p (omitted if unset)
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

## 🌐 **Remote Deployment**

For remote servers or Docker deployments, be sure to enable at least one of the HTTP endpoints (depending on which transport protocol you are planning to use) - these are not enabled by default:

### **Docker**
```bash
docker run -d \
  -p 3000:3000 \
  -e ENABLE_HTTP_STREAMABLE_ENDPOINT=true \
  -e ENABLE_SSE_ENDPOINT=true \
  -e LLM_API_KEY=your_key_here \
  -e LLM_PROVIDER_BASE_URL=https://api.x.ai/v1 \
  -e LLM_MODEL=grok-code-fast-1 \
  ariangibson/firecrawl-lite-mcp-server:latest
```

### **Claude Code (Remote)**
```bash
claude mcp add firecrawl-lite-remote http://your-server:3000/mcp -t http
```

### **Claude Desktop (Remote)**

**Method 1: Connectors (Recommended - HTTPS only)**
The official Claude Desktop method for remote MCP servers:
- Go to Claude Desktop → Settings → Connectors
- Add connector: `https://your-server.com:3000/mcp`
- **Requires**: HTTPS server with valid SSL certificate

**Method 2: mcp-proxy (HTTP/HTTPS fallback)**
For servers without SSL certificates:
```bash
pip install mcp-proxy
```
Add to claude_desktop_config.json:
```json
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "mcp-proxy",
      "args": ["http://your-server:3000/sse"]
    }
  }
}
```

## 🛠️ **Advanced Configuration**

### **Proxy Support**
```bash
PROXY_SERVER_URL=http://your-proxy-server.com:1337
PROXY_SERVER_USERNAME=your-username
PROXY_SERVER_PASSWORD=your-password
```

### **Anti-Detection**
```bash
SCRAPE_USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.3"
SCRAPE_DELAY_MIN=1000
SCRAPE_DELAY_MAX=3000
```

### **Performance Tuning**
```bash
SCRAPE_VIEWPORT_WIDTH=1920
SCRAPE_VIEWPORT_HEIGHT=1080
SCRAPE_BATCH_DELAY_MIN=2000
SCRAPE_BATCH_DELAY_MAX=5000
```

## 🛠️ **Troubleshooting**

### **Chrome Issues**
Chrome is automatically installed on first use. If you encounter issues:
```bash
# Manual installation
npx puppeteer browsers install chrome

# Reset if corrupted
rm -rf ~/.cache/puppeteer && npx puppeteer browsers install chrome
```

### **Connection Issues**
- Verify internet connectivity
- Check LLM provider URL accessibility
- Ensure API keys are valid
- For corporate networks, configure proxy settings

### **Container keeps restarting / killed with `SIGTERM` (Docker Swarm)**
If the logs show the server start up (`listening on port 3000`) and then exit with
`npm error signal SIGTERM`, the container is being killed by a failing healthcheck —
not by the app itself. The published image is `node:20-alpine`, which does **not**
include `curl`, so a `curl`-based healthcheck always fails and Swarm restarts the
task in a loop. Use a `wget`-based check instead (busybox ships `wget`):
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```
The bundled `docker-compose.yml` already uses this form.

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

## 🐳 **Container Registries**

Pre-built images are available:

**Docker Hub**: `ariangibson/firecrawl-lite-mcp-server:latest`  
**GitHub Container Registry**: `ghcr.io/ariangibson/firecrawl-lite-mcp-server:latest`

Both support multi-architecture (`amd64`, `arm64`) with automatic updates.

## 🙏 **Credits & Acknowledgments**

This project is inspired by the excellent work of the original Firecrawl projects:

### 🔥 **[Firecrawl](https://firecrawl.com)**
The original Firecrawl project by **Mendable.ai** - a comprehensive web scraping platform with advanced features.

### 🔥 **[Firecrawl MCP Server](https://github.com/firecrawl/firecrawl-mcp-server)**
The official MCP server implementation by the Firecrawl team.

**We give huge thanks to the Firecrawl team for their pioneering work in web scraping and MCP integration!** 🚀

> **💡 Looking for enterprise-grade web scraping?**  
> Visit **[firecrawl.com](https://firecrawl.com)** for their cloud service with zero setup complexity.

## 📝 **License**

MIT License - see [LICENSE](LICENSE) for details.