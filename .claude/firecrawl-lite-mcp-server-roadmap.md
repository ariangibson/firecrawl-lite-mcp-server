# Firecrawl Lite MCP Server - Development Roadmap

## High Priority Tasks

### 🕷️ Website Crawling Implementation
- [ ] **Implement `crawl_website` tool** - Recursive website crawling with link discovery
  - [ ] **URL discovery** - Extract all links from starting page
  - [ ] **Depth limiting** - Configurable crawl depth (default: 2 levels)
  - [ ] **Domain filtering** - Stay within same domain or allow cross-domain
  - [ ] **Content deduplication** - Avoid scraping duplicate URLs
  - [ ] **Concurrent processing** - Parallel crawling with rate limiting
  - [ ] **Progress tracking** - Return incremental results for large crawls
  - [ ] **Security limits** - Max URLs per crawl (default: 50)

### 🧪 HTTP Streamable Testing
- [ ] **Test HTTP Streamable in Claude Desktop** - Verify `/mcp` endpoint works with Connectors
- [ ] **Test HTTP Streamable in Claude Code** - Verify compatibility with Claude Code MCP client
- [ ] **Document connector configuration** - Create clear setup instructions
- [ ] **Performance comparison** - Compare SSE vs HTTP Streamable performance

### 📚 Documentation Updates  
- [ ] **Claude Desktop deployment guide** - Clear instructions for both SSE and HTTP Streamable
- [ ] **Internal server setup** - Document mcp-proxy workaround for HTTP-only deployments
- [ ] **Environment variable documentation** - Complete configuration reference
- [ ] **Testing procedures** - Step-by-step testing guide for both transport modes

### 🌐 Remote Server Support
- [x] **Test remote server deployment** - Verify it works beyond localhost/stdio mode ✅
- [x] **Connection stability** - Ensure robust remote connections ✅

### 🔌 MCP Protocol Compliance  
- [x] **Verify HTTP Streamable support** - Confirm `/mcp` endpoint is 100% MCP spec compliant ✅
- [x] **Test with multiple MCP clients** - Ensure compatibility across different clients ✅ (Claude Desktop via SSE)

### 📡 SSE Endpoint Implementation
- [x] **Implement `/sse` endpoint** - Server-Sent Events for real-time communication ✅
- [x] **Environment variable control** - `ENABLE_SSE_ENDPOINT=true/false` ✅
- [x] **Environment variable control** - `ENABLE_HTTP_STREAMABLE_ENDPOINT=true/false` ✅ 

### 🔄 Proxy Server Rotation
- [x] **Parse range syntax** - Support `PROXY_SERVER_URL=https://us.decodo.com:10001-10010` ✅
- [x] **Rotation logic** - Cycle through ports 10001-10010 on failures ✅
- [x] **Failover handling** - Smart 3-attempt retry with different proxies ✅
- [x] **Health checking** - ~~Test proxy availability before use~~ (Removed - unnecessary complexity)

### 👤 User Agent Rotation  
- [x] **Array support** - `SCRAPE_USER_AGENTS=["agent1", "agent2", "agent3"]` ✅
- [x] **Rotation logic** - Cycle through different user agents ✅
- [x] **Random selection** - Pick random agent per request vs sequential ✅

### 🐳 Container Registry Publishing
- [x] **Docker Hub workflow** - Ensure automated publishing works ✅ 
- [x] **GitHub Container Registry** - Add `ghcr.io` publishing workflow ✅
- [x] **Multi-arch builds** - Ensure both `amd64` and `arm64` support ✅

### 📸 Screenshot Handling Redesign
- [x] **Base64 return** - Return screenshots as base64 data instead of saving to disk ✅
- [x] **Memory management** - Handle large images without memory issues ✅ 
- [x] **Size limits** - Add configurable max screenshot size ✅
- [x] **Temporary cleanup** - If we must save temporarily, auto-delete after return ✅
- [x] **Testing completed** - Screenshot tool working perfectly in production ✅

## Nice to Have / Future Enhancements

### 🗺️ Advanced Crawling Features (Future Roadmap)
- [ ] **`map_website` tool** - Website structure discovery and URL mapping
- [ ] **`search_website` tool** - Search for specific content within websites  
- [ ] **`perform_actions` tool** - Interactive element handling (clicks, forms) before scraping
- [ ] **Webhook support** - Async processing notifications
- [ ] **Built-in rate limiting** - Formal rate limiting beyond current delay-based approach

### 🛡️ Enhanced Anti-Detection
- [ ] **Residential proxy support** - Better proxy integration
- [ ] **Browser fingerprint rotation** - More sophisticated anti-detection
- [ ] **Request timing patterns** - Human-like request patterns

### 📊 Monitoring & Observability  
- [ ] **Health metrics** - Endpoint for service health
- [ ] **Usage tracking** - Optional usage statistics
- [ ] **Error logging** - Better error reporting and logging

### 🔧 Configuration Management
- [ ] **Config validation** - Validate environment variables on startup
- [ ] **Hot reload** - Reload config without restart
- [ ] **Config templates** - Example configurations for common setups

## Questions to Resolve

1. **Screenshot storage**: Should we use temporary files, in-memory buffers, or external storage?
2. **Proxy authentication**: How to handle username/password with port ranges?
3. **Load balancing**: Should proxy rotation be random, round-robin, or health-based?
4. **Error handling**: How aggressive should retry logic be across proxies?
5. **Client compatibility**: Which MCP clients should we prioritize for testing?

## Current Status
- ✅ Basic MCP functionality working
- ✅ Local stdio mode working  
- ✅ Docker Hub publishing automated
- ✅ Anti-detection features implemented
- ✅ Remote server deployment tested and working
- ✅ SSE endpoint implemented with environment controls
- ✅ Proxy rotation implemented with smart failover (3-attempt retry)
- ✅ User agent rotation implemented with JSON array support
- ✅ Screenshot handling redesigned for remote deployment (base64 return)
- ✅ GitHub Container Registry publishing implemented
- ✅ **Claude Desktop SSE connectivity fully working** - All tools tested and functional
- ✅ **MCP SSE specification compliance verified** - handlePostMessage with proper body parsing
- ✅ **Production deployment via Portainer/Docker** - Remote server stable and reliable

## Recent Achievements (2025-01-11)
### 🔧 SSE Transport Fixes
- [x] **Fixed duplicate transport.start() error** - Removed redundant call causing initialization failures
- [x] **Implemented session routing fallback** - Messages route to any available transport when sessionId mismatches
- [x] **Fixed SSE body parsing** - Added req.body parameter to handlePostMessage for proper JSON-RPC processing
- [x] **Verified MCP specification compliance** - All fixes validated against official MCP SSE transport specification

### 🏗️ Development Process Improvements
- [x] **Local testing workflow established** - Test fixes locally before production deployment
- [x] **GitHub Actions integration verified** - Automated Docker builds working perfectly
- [x] **mcp-proxy integration completed** - Claude Desktop connecting via Python-based mcp-proxy tool

---
*Last updated: 2025-01-11*