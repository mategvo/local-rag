import { cyan } from "kolorist";
import fs from "fs";

export default async (log = "Hello World!") => {
  let str;
  if (typeof log === "string" || typeof log === "number") str = log;
  else if (typeof log) str = JSON.stringify(log, null, 2);

  const terminalStr = cyan(new Date().toLocaleTimeString()) + " " + str;
  console.log(terminalStr);

  const logStr = new Date().toLocaleTimeString() + " " + str;
  await new Promise((resolve, reject) => {
    fs.appendFile(
      "./log/" + new Date().toDateString() + ".txt",
      `${logStr}\n`,
      (err) => {
        if (err) throw err;
        resolve();
      },
    );
  });
};
