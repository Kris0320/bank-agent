import { ProxyAgent, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(new ProxyAgent('http://127.0.0.1:7897'));

import Anthropic from "@anthropic-ai/sdk";

import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const client = new Anthropic(); // 自动读取 ANTHROPIC_API_KEY

// 模拟数据：只用来练习，不是真实的银行数据
const transactions: Record<string, { amount: number; payee: string; status: string; date: string }> = {
  T1001: { amount: 120.5, payee: "Tesco", status: "completed", date: "2026-11-08" },
  T1002: { amount: 2400, payee: "Landlord Ltd", status: "pending", date: "2026-11-10" },
  T1003: { amount: 59.99, payee: "Online Shop", status: "failed", date: "2026-11-09" },
};

// 第一个工具：按交易编号查状态
const getTransactionStatus = betaZodTool({
  name: "get_transaction_status",
  description:
    "Look up one bank transaction by its ID (for example T1001) and return its amount, payee, status and date. Use it whenever the user asks about a specific transaction.",
  inputSchema: z.object({
    id: z.string().describe("The transaction ID, e.g. T1001"),
  }),
  run: async ({ id }) => {
    console.log(`  [工具] get_transaction_status(${id})`); // 让你看到工具真的被调用了
    if (id === "T5000") throw new Error("Transaction service timed out"); // 模拟系统故障
    const tx = transactions[id];
    if (!tx) return JSON.stringify({ error: "not_found", id });
    return JSON.stringify({ id, ...tx });
  },
});

const question = process.argv[2] ?? "我的交易 T1002 现在是什么状态？";
console.log(`用户：${question}`);

const finalMessage = await client.beta.messages.toolRunner({
  model: "claude-haiku-5-5",
  max_tokens: 2000,
  max_iterations: 5, // 最多循环 5 轮，防止无限调用
  thread: false, // 不用服务器暂存对话：每次都把完整对话发过去
  system: "你是一家银行的客服助手。只根据工具返回的数据回答，查不到就如实告诉用户，不要编造。始终用中文回答问题。",
  tools: [getTransactionStatus],
  messages: [{ role: "user", content: question }],
});

for (const block of finalMessage.content) {
  if (block.type === "text") console.log(`助手：${block.text}`);
}
console.log("用量：", finalMessage.usage);