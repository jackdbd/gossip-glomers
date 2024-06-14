import defDebug from "debug";
import { rnd } from "./globals.js";

const debug = defDebug("maelstrom:utils");

export const sendToStdout = (str) => {
  // debug(`str => STDOUT`);
  console.log(str);
};

export const reply = ({ src, dest, body }) => {
  debug(`response %O`, { src, dest, body });
  return { src, dest, body };
};

export const renderAsJsonString = (obj) => {
  // debug(`JSON => str`);
  // return JSON.stringify(obj, null, 2);
  return JSON.stringify(obj);
};

export const parseJsonString = (str) => {
  // debug(`str => JSON`);
  return JSON.parse(str);
};

export const defLineListener = (handler) => {
  debug(`define 'line' event listener`);
  return (line) => handler(line);
};

export const nextMessageId = (n) => {
  return n ? n + 1 : 1;
};

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
