import evn from "./system/env.js";

import OpenAI from "openai";
import csv from "csv-parser";
import fs from "fs";
import { recall } from "./system/rag.js";
import { callGPT4 } from "./system/gpt.js";
import log from "./system/log.js";
import { green } from "kolorist";

const promptWithKnowledge = async (prompt) => {
  log("Received prompt: " + prompt);
  const knowledge = await recall(prompt, { limit: 20 });
  log("Gathering knowledge...");
  const augmentedPrompt = `You are a personal problem-solving assistant. You suggest solutions and ideas. Original question: ${prompt}\nRelevant knowledge from my notes and conversations: ${JSON.stringify(knowledge, null, 2)}\nAnswer the original question, taking into account the provided knowledge in json format {response: '...'}:`;
  console.log({ augmentedPrompt });

  log("Sending augmented prompt...");
  const gpt4Response = await callGPT4(augmentedPrompt, "gpt-4");
  log("Received response...");

  console.log(green(gpt4Response));
};

promptWithKnowledge(process.argv[2]);
