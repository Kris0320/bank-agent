import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // 自动读取 ANTHROPIC_API_KEY

const response = await client.messages.create({
  model: "claude-haiku-5-5",
  max_tokens: 1000,
  messages: [{ role: "user", content: "用一句话打个招呼" }],
});

for (const block of response.content) {
  if (block.type === "text") console.log(block.text);
}
console.log("用量：", response.usage);