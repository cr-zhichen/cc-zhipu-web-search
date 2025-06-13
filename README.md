# 智谱 Web Search MCP 工具

[![npm version](https://img.shields.io/npm/v/cc-zhipu-web-search.svg)](https://www.npmjs.com/package/cc-zhipu-web-search)

一个通过智谱 AI 开放平台（BigModel）的 [Web Search API](https://open.bigmodel.cn/dev/api/search-tool/web-search) 提供网页搜索能力的命令行工具，并符合 [Model-Code-Protocol (MCP)](https://modelcontextprotocol.io/introduction) 规范。

这允许任何支持 MCP 的客户端（例如 AI 智能体）调用此工具来获得网页搜索的能力。

## ✨ 功能

*   **调用智谱搜索 API**：将参数转换并调用智谱 Web Search API。
*   **结果格式化**：将返回的 JSON 结果格式化为对人类或模型易读的文本格式。
*   **MCP 服务**：作为一个 MCP 服务器运行，可以通过标准输入/输出（STDIO）与客户端通信。

## 📦 安装与使用

### ⚙️ 配置

在使用前，你需要一个智谱 AI 的 API Key。你可以在 [智谱 AI 开放平台](https://open.bigmodel.cn/usercenter/apikeys) 上获取。

### 与 MCP 客户端集成

对于支持 MCP 的客户端可使用 `npx` 直接运行，无需全局安装。客户端会根据需要自动拉取并执行包。

1.  找到你客户端的 `mcp.json` 配置文件（对于 Cursor，通常是 `~/.cursor/mcp.json`）。
2.  在该文件的 `mcpServers` 对象中，添加以下条目：

    ```json
    {
      "mcpServers": {
        "zhipu-web-search": {
          "command": "npx",
          "args": [
            "cc-zhipu-web-search"
          ],
          "env": {
            "BIGMODEL_API_KEY": "YOUR_BIGMODEL_API_KEY"
          }
        }
      }
    }
    ```
    *如果你已经有其他服务器，只需在 `mcpServers` 中添加 `"zhipu-web-search": { ... }` 即可。*

## 🛠️ 作为 MCP 工具使用

本工具提供了一个名为 `web-search` 的工具，可供 MCP 客户端调用。

**工具描述**: 使用智谱 Web Search API 进行网页检索

**参数**:

| 参数名                  | 类型     | 描述                                        | 默认值       |
| ----------------------- | -------- | ------------------------------------------- | ------------ |
| `query`                 | `string` | 搜索关键词，≤70字符                         | **必需**     |
| `search_engine`         | `enum`   | 要调用的搜索引擎编码。                      | `search_std` |
| `count`                 | `number` | 返回条数 1~50                               | `10`         |
| `search_domain_filter`  | `string` | 限定搜索结果的域名 (例如 'www.example.com') | (可选)       |
| `search_recency_filter` | `enum`   | 搜索指定时间范围内的网页。                  | `noLimit`    |
| `content_size`          | `enum`   | 控制网页摘要的字数。                        | `medium`     |
