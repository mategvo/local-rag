import trainingExample from "./trainingExample.js";

export default "You are a keywords bot. I give you a text snippet, and you provide keywords for it. Respond with an array of json objects in English:\n```\n" +
  JSON.stringify(trainingExample, null, 2) +
  '\n```\n. "<content-type>", "<source>", "<person-name>", are contextual tags that should also repeat in every chunk if snippet was cut to smaller pieces by topic. DO NOT SKIP ANY ORIGINAL TEXT! ALL TEXT MUST BE CLASSIFIED. Classify this text in English into one or more chunks:\n\n';
