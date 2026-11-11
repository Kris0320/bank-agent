import { ProxyAgent, setGlobalDispatcher } from 'undici';
import Anthropic from '@anthropic-ai/sdk';

// 强制让当前脚本的所有请求走本地 7897 代理端口
setGlobalDispatcher(new ProxyAgent('http://127.0.0.1:7897'));

const client = new Anthropic(); // 自动读取 ANTHROPIC_API_KEY

const response = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 1000,
  messages: [{ role: "user", content: "用一句话打个招呼" }],
});

for (const block of response.content) {
  if (block.type === "text") console.log(block.text);
}
console.log("用量：", response.usage);
