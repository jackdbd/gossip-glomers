import { comp } from "@thi.ng/compose";
import defDebug from "debug";
import { rnd } from "./globals.js";

const debug = defDebug("maelstrom:utils");

export const defTap = (prefix = "TAP") => {
  return function tap(x) {
    debug(`${prefix} %O`, x);
    return x;
  };
};

export const writeToStdout = (str) => {
  console.log(str);
};

export const response = ({ src, dest, body }) => {
  return { src, dest, body };
};

export const jsonStringFromObj = (obj) => {
  return JSON.stringify(obj);
};

export const objFromJsonString = (str) => {
  // debug(`str => JSON`);
  return JSON.parse(str);
};

export const defLineListener = (handler) => {
  return (line) => handler(line);
};

export const nextMessageId = (n) => {
  return n ? n + 1 : 1;
};

export const sendResponseToStdout = comp(
  writeToStdout,
  // defTap("JSON string"),
  jsonStringFromObj,
  // defTap("response"),
  response
);

export const makeUniqueInteger = () => {
  const seen = new Set();
  return function uniqueInteger() {
    let n = rnd.int();
    while (seen.has(n)) {
      n = rnd.int();
    }
    return n;
  };
};
