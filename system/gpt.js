import OpenAI from "openai";
import log from "./log.js";

let totalTokens = 0;

const openai = new OpenAI({
  apiKey: process.env.OAI_KEY, // This is the default and can be omitted
});

const usdPricePerMillionTokens = {
  "gpt-4": 30,
  "gpt-4-32k": 60,
  "gpt-3.5-turbo-0125": 0.5,
  "gpt-3.5-turbo-instruct": 1.5,
  "gpt-3.5-turbo": 8,
  "babbage-002": 0.4,
};

const tokenCountToPrice = (tokens, model) =>
  (tokens / 1000000) * usdPricePerMillionTokens[model];

export const callGPT4 = async (prompt, model = "gpt-3.5-turbo-0125") => {
  // console.log(prompt);
  // return;
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model,
    response_format:
      model === "gpt-3.5-turbo-0125" ? { type: "json_object" } : undefined,
  });

  let content = chatCompletion.choices[0].message.content;
  try {
    content = JSON.parse(content);
  } catch (e) {}

  const tokens = chatCompletion.usage.total_tokens;
  totalTokens += chatCompletion.usage.total_tokens;
  log(
    `Tokens ${tokens}. Price $${tokenCountToPrice(tokens, model)} Total tokens used in session: ${totalTokens}`,
  );

  return content;
};
