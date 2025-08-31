# Firecrawl Lite MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **privacy-first, standalone** MCP server that provides web scraping and data extraction tools using local browser automation and your own LLM API key. **No external dependencies or API keys required** - completely decoupled from Firecrawl's cloud service.

## � **Credits & Acknowledgments**

This project is inspired by and builds upon the excellent work of the original Firecrawl projects:

### 🔥 **[Firecrawl](https://github.com/firecrawl/firecrawl)**
The original Firecrawl project by **Mendable.ai** - a comprehensive web scraping and crawling platform with advanced features like website mapping, multi-page crawling, and deep research capabilities.

### 🔥 **[Firecrawl MCP Server](https://github.com/firecrawl/firecrawl-mcp-server)**
The official MCP server implementation by the Firecrawl team, providing MCP integration for their cloud-based scraping service.

**We give huge thanks to the Firecrawl team for their pioneering work in web scraping and MCP integration!** 🚀

## 🎯 **How Firecrawl Lite is Different**

### **Philosophy: Simplicity & Privacy First**
Firecrawl Lite takes a **minimalist approach** - focusing on essential web scraping functionality while maintaining complete privacy and control over your data.

### **Key Differences:**

| Aspect | Firecrawl Lite ✅ | Original Firecrawl ❌ |
|--------|-------------------|----------------------|
| **Deployment** | **Standalone/Local** | Cloud Service |
| **API Keys** | **Your LLM key only** | Firecrawl API + LLM keys |
| **Data Privacy** | **100% local processing** | Cloud processing |
| **Cost Model** | **Pay for your LLM only** | Subscription + LLM costs |
| **Setup Complexity** | **Single container** | Multi-service deployment |
| **Bundle Size** | **Lightweight (~50MB)** | Heavy multi-service |
| **Offline Capability** | **Works offline** | Requires internet |
| **Customization** | **Full control** | Limited customization |

### **🚀 Benefits of Firecrawl Lite:**

#### **✅ Privacy & Security**
- **Zero data leakage** - Everything processed locally
- **Your API keys only** - No third-party service dependencies
- **Complete data control** - Your scraped content stays on your machine
- **Audit trail** - Full visibility into data processing

#### **✅ Cost Efficiency**
- **Pay only for LLM usage** - No additional subscription fees
- **Predictable costs** - Based on your LLM provider's pricing
- **No hidden charges** - Transparent cost model

#### **✅ Simplicity & Reliability**
- **Single container deployment** - Easy to deploy and manage
- **Minimal dependencies** - Fewer moving parts, fewer failure points
- **Fast startup** - Lightweight design means quick initialization
- **Offline capable** - Works without internet connectivity

#### **✅ Developer Experience**
- **Simple configuration** - Single environment file
- **Clear documentation** - Focused on essential use cases
- **TypeScript first** - Full type safety and IntelliSense
- **Docker ready** - One-command deployment

## �🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd firecrawl-lite-mcp-server
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

# LLM provider base URL (more flexible than provider names)
LLM_PROVIDER_BASE_URL=https://api.x.ai/v1

# LLM model
LLM_MODEL=grok-code-fast-1
```

### Optional Configuration
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
SCRAPE_BATCH_DELAY_MIN=2000
SCRAPE_BATCH_DELAY_MAX=5000

# Retry configuration
FIRECRAWL_RETRY_MAX_ATTEMPTS=3
FIRECRAWL_RETRY_INITIAL_DELAY=1000
FIRECRAWL_RETRY_MAX_DELAY=10000
```

## 🛠️ Available Tools (4 Essential Tools)

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

## ❌ **Intentionally Excluded Tools**

By design, this lite version excludes the following tools to maintain simplicity:

- **`search_web`** - Web search functionality
- **`map_website`** - Website URL discovery
- **`crawl_website`** - Multi-page website crawling
- **`generate_llms_txt`** - LLMs.txt file generation
- **`deep_research`** - Advanced research capabilities
- **`crawl_status`** - Crawl job status checking

## �️ **Anti-Detection Features**

Firecrawl Lite includes sophisticated anti-detection measures to handle modern websites with bot protection:

### ✅ **Built-in Anti-Detection**
- **Realistic Browser Fingerprinting**: Spoofs navigator properties, plugins, and browser APIs
- **Random Delays**: Adds human-like delays between requests (configurable)
- **Modern User Agent**: Uses up-to-date Chrome user agent strings
- **Viewport Simulation**: Sets realistic desktop viewport sizes
- **Headless Optimization**: Configured for maximum stealth in headless mode

### ✅ **Configurable Settings**
```bash
# Customize user agent
SCRAPE_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...

# Adjust viewport size
SCRAPE_VIEWPORT_WIDTH=1920
SCRAPE_VIEWPORT_HEIGHT=1080

# Control delays (in milliseconds)
SCRAPE_DELAY_MIN=1000      # Minimum delay before navigation
SCRAPE_DELAY_MAX=3000      # Maximum delay before navigation
SCRAPE_BATCH_DELAY_MIN=2000 # Minimum delay between batch requests
SCRAPE_BATCH_DELAY_MAX=5000 # Maximum delay between batch requests
```

### ✅ **Proxy Integration**
- **Full Proxy Support**: HTTP/HTTPS proxies with authentication
- **LLM API Proxying**: LLM requests also respect proxy settings
- **Docker Ready**: Proxy configuration works in containerized deployments

## �🐳 Docker Usage (Optional)

If you prefer Docker deployment:

```bash
# Build and run with Docker
docker-compose up --build

# Run in background
docker-compose up -d --build
```

The server will be available at `http://localhost:3000` with a health endpoint at `http://localhost:3000/health`.

## 🎯 MCP Configuration

### **📦 Installation Options**

#### **Option 1: Install from npm (Recommended)**
```bash
npm install -g firecrawl-lite-mcp-server
```

#### **Option 2: Install from source**
```bash
git clone https://github.com/ariangibson/firecrawl-lite-mcp-server.git
cd firecrawl-lite-mcp-server
npm install
npm run build
```

### **🖥️ Application-Specific Setup**

#### **Claude Desktop**
1. **Install the package:**
   ```bash
   npm install -g firecrawl-lite-mcp-server
   ```

2. **Locate your Claude Desktop config file:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

3. **Add the server configuration:**
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

4. **Restart Claude Desktop**

#### **Claude Code (CLI)**
```bash
# Install globally
npm install -g firecrawl-lite-mcp-server

# Configure Claude Code
claude config mcp add firecrawl-lite \
  --command "firecrawl-lite-mcp-server" \
  --env LLM_API_KEY=your_llm_api_key_here \
  --env LLM_PROVIDER_BASE_URL=https://api.x.ai/v1 \
  --env LLM_MODEL=grok-code-fast-1
```

#### **Gemini CLI**
```bash
# Install globally
npm install -g firecrawl-lite-mcp-server

# Configure Gemini CLI
gemini config mcp add firecrawl-lite \
  --command "firecrawl-lite-mcp-server" \
  --env LLM_API_KEY=your_llm_api_key_here \
  --env LLM_PROVIDER_BASE_URL=https://api.x.ai/v1 \
  --env LLM_MODEL=grok-code-fast-1
```

#### **Cursor/VS Code**
1. **Install the package:**
   ```bash
   npm install -g firecrawl-lite-mcp-server
   ```

2. **Open Cursor/VS Code settings and add to MCP configuration:**
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

#### **Other MCP-Compatible Applications**
For any MCP-compatible application, use this configuration:
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

### **🔧 Advanced Configuration**
For full configuration options, copy `.env.example` to `.env` and customize:
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

Then use the local installation:
```json
{
  "mcpServers": {
    "firecrawl-lite": {
      "command": "node",
      "args": ["/path/to/firecrawl-lite-mcp-server/dist/index.js"],
      "envFile": "/path/to/firecrawl-lite-mcp-server/.env"
    }
  }
}
```

## 🔧 LLM Provider Support

### xAI (Grok)
```bash
LLM_PROVIDER_BASE_URL=https://api.x.ai/v1
LLM_API_KEY=xai-your-key-here
LLM_MODEL=grok-code-fast-1
```

### OpenAI
```bash
LLM_PROVIDER_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4o-mini
```

### Anthropic
```bash
LLM_PROVIDER_BASE_URL=https://api.anthropic.com
LLM_API_KEY=sk-ant-your-key-here
LLM_MODEL=claude-3-haiku-20240307
```

### Custom/Local LLM
```bash
LLM_PROVIDER_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=your-local-key
LLM_MODEL=llama2
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

### **The Privacy-First Alternative to Cloud Scraping**

Firecrawl Lite was created for developers who value **privacy, control, and simplicity** over feature complexity. Here's why you should choose Firecrawl Lite:

#### **🔒 Privacy & Data Sovereignty**
- **Your data stays yours** - All scraping and processing happens locally
- **Zero third-party dependencies** - No external APIs or cloud services
- **Complete audit trail** - Full visibility into what data is processed
- **GDPR/CCPA compliant** - No data leaves your infrastructure

#### **💰 Cost-Effective & Predictable**
- **Pay only for LLM usage** - No additional subscription or API fees
- **Transparent pricing** - Costs based on your LLM provider's rates only
- **No surprise bills** - Fixed cost model you can predict and control

#### **⚡ Performance & Reliability**
- **Lightning-fast startup** - Lightweight design means quick initialization
- **Offline capable** - Works without internet connectivity for scraping
- **Minimal resource usage** - Optimized for efficiency and low memory footprint
- **Single container deployment** - Fewer moving parts, fewer failure points

#### **🛠️ Developer Experience**
- **Simple setup** - Single environment file, one-command deployment
- **Full TypeScript support** - Type safety and excellent IntelliSense
- **Comprehensive documentation** - Clear examples and configuration guides
- **Docker ready** - Production-ready containerization included

#### **🎯 Perfect For:**
- **Privacy-conscious developers** who want full control over their data
- **Cost-sensitive projects** that need predictable expenses
- **Offline-first applications** that require local processing
- **Enterprise environments** with strict data governance requirements
- **Developers who prefer simplicity** over feature bloat

### **Real-World Use Cases:**
- **Content analysis** for AI applications (local processing)
- **Data extraction** for research projects (privacy-focused)
- **Web monitoring** tools (offline capable)
- **Competitive intelligence** gathering (secure and local)
- **Academic research** (cost-effective and private)

## 🆚 **Firecrawl Lite vs Original Firecrawl: Feature Comparison**

| Feature | Firecrawl Lite ✅ | Original Firecrawl ❌ |
|---------|-------------------|----------------------|
| **🏠 Deployment** | **Standalone/Local** | Cloud Service |
| **🔑 API Keys Required** | **Your LLM key only** | Firecrawl API + LLM keys |
| **🔒 Data Privacy** | **100% local processing** | Cloud processing |
| **💰 Cost Model** | **LLM usage only** | Subscription + LLM costs |
| **⚙️ Setup Complexity** | **Single container** | Multi-service deployment |
| **📦 Bundle Size** | **~50MB lightweight** | Heavy multi-service |
| **📴 Offline Capability** | **Works offline** | Requires internet |
| **🎛️ Customization** | **Full control** | Limited customization |
| **🚀 Startup Time** | **< 5 seconds** | Variable (cloud dependent) |
| **🔧 Maintenance** | **Self-managed** | Managed service |

### **🎯 When to Choose Firecrawl Lite:**

#### **✅ Choose Firecrawl Lite if you need:**
- **Complete data privacy** and local processing
- **Predictable, low costs** (LLM usage only)
- **Simple deployment** and maintenance
- **Offline capability** for scraping
- **Full control** over your infrastructure
- **Enterprise-grade security** requirements

#### **✅ Original Firecrawl is better if you need:**
- **Advanced crawling** of entire websites
- **Built-in web search** capabilities
- **Website mapping** and discovery
- **Multi-page deep crawling**
- **LLMs.txt generation**
- **Managed service** with SLA guarantees

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.
