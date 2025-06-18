#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

// 1. 常量
const API_URL = "https://open.bigmodel.cn/api/paas/v4/web_search";
const API_KEY = process.env.BIGMODEL_API_KEY!;
if (!API_KEY) {
    console.error("❌ 请在 .env 中设置 BIGMODEL_API_KEY"); process.exit(1);
}

interface SearchResultItem {
    title?: string;
    content?: string;
    link: string;
    media?: string;
    icon?: string;
    refer?: string;
    publish_date?: string;
}

interface SearchIntent {
    query: string;
    intent: string;
    keywords: string;
}

interface SearchResponse {
    id: string;
    created: number;
    search_intent: SearchIntent[];
    search_result: SearchResultItem[];
}

// 2. 实例化 MCP 服务器
const server = new McpServer({
    name: "web_search",
    version: "1.0.0",
    capabilities: { resources: {}, tools: {} }
});

// 3. 注册工具
server.tool(
    "web-search",
    "使用智谱 Web Search API 进行网页检索",
    {
        // 搜索内容
        query: z
            .string()
            .max(70)
            .describe(`
需要进行搜索的内容, 建议搜索 query 不超过 70 个字符`),

        // 搜索引擎
        search_engine: z
            .enum(["search_std", "search_pro", "search_pro_sogou", "search_pro_quark", "search_pro_jina", "search_pro_bing"])
            .default("search_pro")
            .describe(`
要调用的搜索引擎编码。目前支持：
search_std (智谱基础版), 
search_pro (智谱高阶版), 
search_pro_sogou (搜狗), 
search_pro_quark (夸克搜索), 
search_pro_jina (jina.ai搜索), 
search_pro_bing (必应搜索)
`),

        // 返回结果的条数
        count: z
            .number()
            .int()
            .min(1)
            .max(50)
            .default(10)
            .describe(`
返回结果的条数, 范围 1-50, 默认10。
支持的搜索引擎：search_pro_sogou、search_std、search_pro。
对于 search_pro_sogou，可选值为 10, 20, 30, 40, 50。
            `),

        // 限定搜索结果的域名
        search_domain_filter: z
            .string()
            .optional()
            .describe(`
            限定搜索结果的域名 (例如 'www.example.com')。
            支持的搜索引擎：search_std、search_pro、search_pro_Jina。`),

        // 搜索指定时间范围内的网页
        search_recency_filter: z
            .enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"])
            .default("noLimit")
            .describe(`
搜索指定时间范围内的网页。默认为 'noLimit'。
可选值为 'oneDay'、'oneWeek'、'oneMonth'、'oneYear'、'noLimit'。
支持的搜索引擎：search_std、search_pro、search_pro_Sogou、search_pro_quark。
`),

        // 控制网页摘要的字数
        content_size: z
            .enum(["medium", "high"])
            .default("medium")
            .describe(`
控制网页摘要的字数。
medium (默认): 平衡模式, 约400-600字; 
high: 最大化上下文, 约2500字。
除非用户特别要求详细内容, 否则使用默认值即可
`),
    },
    async (params) => {
        // 发起 POST 请求
        const body = {
            search_query: params.query,
            search_engine: params.search_engine,
            search_intent: false,                   // 因为 LLM 已经决定要搜索
            count: params.count,
            search_domain_filter: params.search_domain_filter,
            search_recency_filter: params.search_recency_filter,
            content_size: params.content_size,
        };

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            return { content: [{ type: "text", text: `❌ 调用失败：${res.status} ${text}` }] };
        }

        const data = await res.json() as SearchResponse;

        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
        };
    }
);

// 4. 运行（STDIO 传输）
(async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ MCP Web-Search Server 已启动（STDIO）");
})();
