# Firecrawl Lite MCP Server - Development Roadmap

## High Priority Tasks

### 🌐 Remote Server Support
- [ ] **Test remote server deployment** - Verify it works beyond localhost/stdio mode
- [ ] **Connection stability** - Ensure robust remote connections

### 🔌 MCP Protocol Compliance  
- [ ] **Verify HTTP Streamable support** - Confirm `/mcp` endpoint is 100% MCP spec compliant
- [ ] **Test with multiple MCP clients** - Ensure compatibility across different clients

### 📡 SSE Endpoint Implementation
- [ ] **Implement `/sse` endpoint** - Server-Sent Events for real-time communication
- [ ] **Environment variable control** - `ENABLE_SSE_ENDPOINT=true/false`
- [ ] **Environment variable control** - `ENABLE_MCP_ENDPOINT=true/false` 

### 🔄 Proxy Server Rotation
- [ ] **Parse range syntax** - Support `PROXY_SERVER_URL=https://us.decodo.com:10001-10010`
- [ ] **Rotation logic** - Cycle through ports 10001-10010 on failures
- [ ] **Failover handling** - Gracefully handle proxy failures and retry with next
- [ ] **Health checking** - Test proxy availability before use

### 👤 User Agent Rotation  
- [ ] **Array support** - `SCRAPE_USER_AGENTS=["agent1", "agent2", "agent3"]`
- [ ] **Rotation logic** - Cycle through different user agents
- [ ] **Random selection** - Pick random agent per request vs sequential

### 🐳 Container Registry Publishing
- [ ] **Docker Hub workflow** - Ensure automated publishing works ✅ (already done)
- [ ] **GitHub Container Registry** - Add `ghcr.io` publishing workflow
- [ ] **Multi-arch builds** - Ensure both `amd64` and `arm64` support

### 📸 Screenshot Handling Redesign
- [ ] **Base64 return** - Return screenshots as base64 data instead of saving to disk
- [ ] **Memory management** - Handle large images without memory issues  
- [ ] **Size limits** - Add configurable max screenshot size
- [ ] **Temporary cleanup** - If we must save temporarily, auto-delete after return
- [ ] **Consider removal** - May need to remove screenshot tool entirely if unsolvable

## Nice to Have / Future Enhancements

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
- ⚠️ Remote server deployment needs testing
- ❌ SSE endpoint not implemented
- ❌ Proxy rotation not implemented  
- ❌ User agent rotation not implemented
- ❌ Screenshot handling problematic for remote deployment

---
*Last updated: 2025-01-09*