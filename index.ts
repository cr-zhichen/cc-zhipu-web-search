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
        query: z.string().max(70).describe("搜索关键词，≤70字符"),
        search_engine: z
            .enum(["search_std", "search_pro", "search_pro_sogou", "search_pro_quark", "search_pro_jina", "search_pro_bing"])
            .default("search_std")
            .describe("要调用的搜索引擎编码。默认: search_std"),
        count: z.number().int().min(1).max(50).default(10).describe("返回条数 1~50，默认10"),
        search_domain_filter: z.string().optional().describe("限定搜索结果的域名(例如 'www.example.com')"),
        search_recency_filter: z
            .enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"])
            .default("noLimit")
            .describe("搜索指定时间范围内的网页。默认: noLimit"),
        content_size: z
            .enum(["medium", "high"])
            .default("medium")
            .describe("控制网页摘要的字数。默认: medium")
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

        // 把搜索结果格式化成易读文本
        const results = data.search_result;
        if (!results?.length) {
            return { content: [{ type: "text", text: "未找到任何结果。" }] };
        }

        const pretty = results.map((r, idx) => {
            const titleLine = [
                `${idx + 1}. **${r.title ?? "无标题"}**`,
                r.media ? `_(${r.media})_` : undefined,
                r.publish_date ? `[${r.publish_date}]` : undefined
            ].filter(Boolean).join(" ");

            return `${titleLine}\n${r.content?.slice(0, 200) || "..."}\n${r.link}`;
        }).join("\n\n");

        return {
            content: [
                { type: "text", text: `以下是「${params.query}」的前 ${results.length} 条结果：\n\n${pretty}` }
            ]
        };
    }
);

// 4. 运行（STDIO 传输）
(async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ MCP Web-Search Server 已启动（STDIO）");
})();
