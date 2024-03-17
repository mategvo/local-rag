import evn from "./system/env.js";

import fs from "fs";
import csv from "csv-parser";
import log from "./system/log.js";
import { callGPT4 } from "./system/gpt.js";
import hash from "./system/hash.js";
import { gray, green, red } from "kolorist";
import { record } from "./system/rag.js";
import trainingInstruction from "./prompts/trainingInstruction.js";
import openaiTokenCounter from "openai-gpt-token-counter";
import Confirm from "prompt-confirm";

let memorisedSnippets = [];

const loadHashes = async () => {
  log(gray("Loading hashes (to prevent duplicate entries)..."));
  let results = [];
  memorisedSnippets = await new Promise((resolve, reject) => {
    fs.createReadStream("./log/memory-log.csv")
      .pipe(csv(["hash"]))
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results.map((r) => r.hash));
      });
  });
};

const init = async () => {
  await loadHashes();

  log("Listing files to process...");

  const files = await new Promise((resolve, reject) => {
    fs.readdir("./data", (err, files) => {
      resolve(files.filter((filename) => !filename.startsWith(".")));
    });
  });

  if (!files.length) {
    log(gray("No files in data directory. Exiting..."));
  } else {
    log(gray(`Found ${files.length} files to process.`));
  }

  for (let index in files) {
    const filename = files[index];
    await new Promise(async (resolve, reject) => {
      fs.readFile("./data/" + filename, "utf8", async (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        await recordSnippet(filename, data);
        resolve();
      });
    });
  }
};

init();

const isMemorised = (str) => {
  log(gray("Checking for duplicates."));
  const hashedString = hash(str).toString();
  return memorisedSnippets.indexOf(hashedString) > -1;
};
const logMemorisation = async (str) => {
  const hashedString = hash(str);
  // add a line to the memory log
  await new Promise((resolve, reject) => {
    fs.appendFile("./log/memory-log.csv", `${hashedString},\n`, (err) => {
      if (err) throw err;
      log(gray("Snippet hash saved."));
      resolve();
    });
  });
};

const splitSnippet = (snippet) => {
  const limit = Number.parseInt(process.env.SNIPPET_LENGTH_LIMIT);
  const tokens = snippet.split("\n");
  const parts = [];
  let part = [];

  tokens.forEach((token) => {
    if ((part.join(" ") + " " + token).length <= limit) {
      part.push(token);
    } else {
      // If adding the next token exceeds the limit, push the part to the parts array
      // and start a new part with the current token
      parts.push(part.join(" "));
      part = [token];
    }
  });

  if (part.length > 0) {
    parts.push(part.join(" "));
  }

  return parts;
};

const recordSnippet = async (context, snippet) => {
  if (openaiTokenCounter.text(snippet, "gpt-3.5-turbo-0125") > 3000) {
    log(gray("Splitting text into smaller snippets..."));
    const parts = splitSnippet(snippet);
    for (const part of parts) {
      await recordSnippet(context, part);
    }
    return;
  }

  log("Recording snippet...");

  if (isMemorised(snippet)) {
    log("Snippet previously memorised...");
    if (process.argv.length > 2 && process.argv[2] === "--skip") {
      log(gray("Skipping..."));
      return;
    }
    if (
      !(await new Confirm(
        "Do you want to proceed anyway? You can add --skip flag and skip dupes automatically when calling memorise function. Ctr+C to exit program.",
      ).run())
    ) {
      log(gray("Skipping..."));
      return;
    }
  }

  log(gray("Categorising with GPT..."));
  let objects = await callGPT4(
    `${trainingInstruction}  "${context}: ${snippet}"`,
  );

  // if gpt returns a single object
  if (objects.chunk) {
    objects = [objects];
    // of wraps the array in an object
  } else if (objects.chunks) {
    objects = objects.chunks;
  }

  log(gray(`Creating ${objects.length} new memories...`));

  const uuid = hash(context + snippet).toString();

  for (const object of objects) {
    if (!validateGPTChunks(object)) {
      log(red("Invalid data structure returned from GPT"));
      return;
    }

    try {
      await record({
        class: "Memory",
        properties: {
          chunk: object.chunk,
          keywords: object.keywords,
          context,
          uuid,
        },
      }).then((x) => {
        if (x.error) {
          throw new Error(x.error[0].message);
        }
        log(green("Memory recorded!"));
      });
    } catch (e) {
      log(red("Error recording snippet:"));
      log(red(e.message));
      if (await new Confirm("Display debug data?").run()) {
        console.log(snippet);
        console.log(object);
      }
      process.exit(0);
    }
  }

  logMemorisation(snippet);
};

const validateGPTChunks = (data) => {
  if (typeof data.chunk !== "string") {
    log("Invalid data: chunk should be a string");
    return false;
  }

  if (
    !Array.isArray(data.keywords) ||
    !data.keywords.every((keyword) => typeof keyword === "string")
  ) {
    log("Invalid data: keywords should be an array of strings");
    return false;
  }

  return true;
};
