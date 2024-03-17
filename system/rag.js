import { default as weaviate } from "weaviate-ts-client";

const RAG_SERVER = "http://localhost:8080"; // replace with your endpoint

export const rag = weaviate.client({
  scheme: "http",
  host: RAG_SERVER, // Replace with your endpoint
  headers: { "X-OpenAI-Api-Key": process.env.OAI_KEY }, // Replace with your API key
});

export const recall = async (prompt, conf) => {
  const defaultConf = {
    limit: 3,
    class: "Memory",
    fields: "chunk keywords _additional {certainty}",
    ...conf,
  };

  const response = await rag.graphql
    .get()
    .withClassName(defaultConf.class)
    .withFields(defaultConf.fields)
    .withNearText({ concepts: [prompt] })
    .withLimit(defaultConf.limit)
    .do();

  return response.data.Get.Memory;
};

export const record = async (data) =>
  fetch(RAG_SERVER + "/v1/objects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-OpenAI-Api-Key": process.env.OAI_KEY, // replace with your API key
    },
    body: JSON.stringify(data),
  }).then((response) => response.json());
