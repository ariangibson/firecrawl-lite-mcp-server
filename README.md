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

### **1. System Requirements**
- **Node.js** (version 18 or higher)
- **Chrome/Chromium browser** (automatically installed on first run)
- **Internet access** (for web scraping and LLM API calls)

### **2. No Installation Required!**
This MCP server runs via `npx` - no global installation needed. Chrome browser is automatically installed on first use.

### **3. Configure your MCP client:**

#### **Claude Desktop (Local)**
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

#### **Claude Desktop (Remote Server)**

**💡 Two Methods for Remote Server Connection:**

**Method 1: Use mcp-proxy (✅ Tested & Working)**
Works with both HTTP and HTTPS servers via SSE transport:

```bash
# Install mcp-proxy
pip install mcp-proxy
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "/Users/[username]/.local/bin/mcp-proxy",
      "args": ["http://[internal_server_ip_address]:3000/sse"]
    }
  }
}
```

**⚠️ Important:** 
- Replace `[username]` with your actual username
- Replace `[internal_server_ip_address]` with your server's IP
- Your server must have `ENABLE_SSE_ENDPOINT=true` configured
- Works with both `http://` and `https://` server URLs

**Method 2: Built-in Connectors (Should Work - Requires HTTPS)**
For HTTPS servers, use Claude Desktop's built-in Connectors:

1. Go to **Settings → Connectors**
2. Add connector with URL: `https://your-server.com:3000/mcp`
3. Configure environment variables in connector settings

**Requirements:**
- Server must have SSL certificate (HTTPS)
- Server must have `ENABLE_HTTP_STREAMABLE_ENDPOINT=true` configured
- Uses HTTP Streamable transport (same as Claude Code)

#### **LM Studio**
If npx doesn't work with LM Studio, you can globally install first:
```bash
npm install -g @ariangibson/firecrawl-lite-mcp-server
```
Then use `"command": "firecrawl-lite-mcp-server"` without npx.

#### **Claude Code (CLI)**

**Local Installation:**
```bash
claude config mcp add firecrawl-lite \
  --command "npx" \
  --args "-y" --args "@ariangibson/firecrawl-lite-mcp-server" \
  --env LLM_API_KEY=your_llm_api_key_here \
  --env LLM_PROVIDER_BASE_URL=https://api.x.ai/v1 \
  --env LLM_MODEL=grok-code-fast-1
```

**Remote Server (✅ Tested & Working):**
```bash
claude mcp add firecrawl-lite-remote http://your-server:3000/mcp -t http
```
- Uses HTTP Streamable transport  
- Works with both HTTP and HTTPS servers
- Server must have `ENABLE_HTTP_STREAMABLE_ENDPOINT=true` configured

### **4. Restart your MCP client and start scraping!**

## 🛠️ **Troubleshooting**

### **Puppeteer/Chrome Issues**
Chrome is automatically installed on first use. If you encounter issues:

```bash
# Manual Chrome installation (if auto-install fails)
npx puppeteer browsers install chrome

# Clear corrupted Puppeteer cache (if needed)
rm -rf ~/.cache/puppeteer && npx puppeteer browsers install chrome
```

**Common symptoms:**
- "Failed to launch the browser process"
- "Google Chrome for Testing.app" not found
- Path resolution errors

**Note:** First run may take longer due to Chrome download (~100MB)

### **Environment Variables**
Ensure these are set for data extraction features:
- `LLM_API_KEY` - Your LLM provider API key
- `LLM_PROVIDER_BASE_URL` - Your LLM provider URL  
- `LLM_MODEL` - Your LLM model name

### **Network Issues**
- Check internet connectivity for web scraping
- Verify LLM provider URL is accessible
- Consider proxy settings if behind corporate firewall

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
# Remote deployment configuration (⚠️ Required for remote access)
ENABLE_HTTP_STREAMABLE_ENDPOINT=true  # Enable /mcp endpoint for Claude Code/Connectors
ENABLE_SSE_ENDPOINT=true              # Enable /sse endpoint for Claude Desktop via mcp-proxy

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

## 🚀 **Deployment Modes**

### **🏠 Local Deployment (STDIO)**
For use with local MCP clients like Claude Desktop:

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

### **🌐 Remote Deployment (HTTP)**
For remote access and Claude Desktop via proxy:

#### **⚠️ Critical: Enable Remote Endpoints**
**Remote deployments require explicit endpoint configuration!** By default, all HTTP endpoints are disabled for security.

```bash
# Required environment variables for remote deployment
ENABLE_HTTP_STREAMABLE_ENDPOINT=true  # Enables /mcp endpoint for Claude Code/remote clients
ENABLE_SSE_ENDPOINT=true              # Enables /sse endpoint for Claude Desktop via mcp-proxy
```

#### **🔧 Remote Deployment Examples**

**Docker with HTTP endpoints enabled:**
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

**Claude Desktop with remote server (requires mcp-proxy):**
```bash
# Install mcp-proxy first
npm install -g mcp-proxy

# Configure Claude Desktop
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "mcp-proxy",
      "args": ["http://your-server:3000/sse"]
    }
  }
}
```

**Claude Code with remote server:**
```bash
claude config mcp add firecrawl-lite-remote \
  --server-url "http://your-server:3000/mcp"
```

### **📡 Available Endpoints**

| Endpoint | Purpose | Required For | Environment Variable | Status |
|----------|---------|--------------|---------------------|--------|
| `/mcp` | HTTP Streamable MCP | Claude Code, Claude Desktop Connectors (HTTPS) | `ENABLE_HTTP_STREAMABLE_ENDPOINT=true` | ✅ Tested with Claude Code |
| `/sse` | Server-Sent Events | Claude Desktop via mcp-proxy | `ENABLE_SSE_ENDPOINT=true` | ✅ Tested & Working |
| `/health` | Health check | Monitoring, load balancers | Always enabled | ✅ Always Available |

### **🔒 Security Notice**

**Endpoints are disabled by default for security.** This prevents accidental exposure when deploying containers. You must explicitly enable the endpoints you need:

- **Local STDIO mode**: No endpoints needed (default behavior)
- **Claude Desktop via mcp-proxy**: Enable `ENABLE_SSE_ENDPOINT=true`
- **Claude Desktop Connectors (HTTPS)**: Enable `ENABLE_HTTP_STREAMABLE_ENDPOINT=true`
- **Claude Code remote**: Enable `ENABLE_HTTP_STREAMABLE_ENDPOINT=true`

### **🔌 Client Support**

| Client | Method | Transport | Protocol | Requirements |
|--------|--------|-----------|----------|--------------|
| Claude Desktop | mcp-proxy | SSE | HTTP/HTTPS | `ENABLE_SSE_ENDPOINT=true` + mcp-proxy |
| Claude Desktop | Connectors | HTTP Streamable | HTTPS only | `ENABLE_HTTP_STREAMABLE_ENDPOINT=true` + SSL certificate |
| Claude Code | Remote server | HTTP Streamable | HTTP/HTTPS | `ENABLE_HTTP_STREAMABLE_ENDPOINT=true` |

## 🐳 **Docker Deployment**

```bash
# Pull and run the latest image with endpoints enabled
docker-compose up -d

# Or run directly with Docker (endpoints enabled)
docker run -d \
  -p 3000:3000 \
  -e ENABLE_HTTP_STREAMABLE_ENDPOINT=true \
  -e ENABLE_SSE_ENDPOINT=true \
  -e LLM_API_KEY=your_key_here \
  -e LLM_PROVIDER_BASE_URL=https://api.x.ai/v1 \
  -e LLM_MODEL=grok-code-fast-1 \
  ariangibson/firecrawl-lite-mcp-server:latest
```

### **Option 2: Build from Source**
For development or customization:

```bash
# Edit docker-compose.yml to uncomment the build section
# Then build and run
docker-compose up --build -d
```

### **Container Registries**
Pre-built images are automatically published to both registries:

**🐳 Docker Hub**: **[ariangibson/firecrawl-lite-mcp-server](https://hub.docker.com/r/ariangibson/firecrawl-lite-mcp-server)**
```bash
docker pull ariangibson/firecrawl-lite-mcp-server:latest
```

**📦 GitHub Container Registry**: **[ghcr.io/ariangibson/firecrawl-lite-mcp-server](https://github.com/ariangibson/firecrawl-lite-mcp-server/pkgs/container/firecrawl-lite-mcp-server)**
```bash
docker pull ghcr.io/ariangibson/firecrawl-lite-mcp-server:latest  
```

- **Multi-architecture support**: `linux/amd64`, `linux/arm64`
- **Automatic updates**: Built on every release and main branch push
- **Tagged versions**: `latest`, `v1.1.2`, etc.
- **Same image, multiple sources**: Choose your preferred registry

The server will be available at `http://localhost:3000` with:
- **Health endpoint**: `http://localhost:3000/health` (always enabled)
- **MCP endpoint**: `http://localhost:3000/mcp` (if `ENABLE_HTTP_STREAMABLE_ENDPOINT=true`)
- **SSE endpoint**: `http://localhost:3000/sse` (if `ENABLE_SSE_ENDPOINT=true`)

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
