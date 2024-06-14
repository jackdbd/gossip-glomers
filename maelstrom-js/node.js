import { comp } from "@thi.ng/compose";
import defDebug from "debug";
import { rl } from "./globals.js";
import {
  defLineListener,
  jsonStringFromObj,
  objFromJsonString,
  writeToStdout,
} from "./utils.js";

const debug = defDebug("maelstrom:node");

/**
 * Creates a Maelstrom node.
 *
 * A Maelstrom node has the following characteristics:
 * - receives messages on STDIN
 * - sends messages on STDOUT
 * - logs debugging output on STDERR
 * - must not print anything that is not a message to STDOUT
 */
export const defNode = ({ handlers }) => {
  //
  const responseFromMessage = (msg) => {
    const messageHandler = handlers[msg.body.type];
    if (messageHandler) {
      return messageHandler(msg);
    } else {
      return {
        error: `message type ${msg.body.type} not handled by this node`,
      };
    }
  };

  // functional composition is right to left
  const handler = comp(
    // Maelstrom nodes send messages (JSON strings) to STDOUT
    writeToStdout,
    jsonStringFromObj,
    responseFromMessage,
    // Maelstrom nodes receive messages (JSON strings) on STDIN
    objFromJsonString
  );

  const listener = defLineListener(handler);
  debug(`defined 'line' event listener`);

  const stop = () => {
    rl.removeListener("line", listener);
    debug(`removed 'line' event listener`);
  };

  const start = (options = { stop_after_ms: undefined }) => {
    rl.addListener("line", listener);
    debug(`added 'line' event listener`);

    const { stop_after_ms } = options;

    if (stop_after_ms) {
      setTimeout(() => {
        stop();
      }, stop_after_ms);
    }
  };

  return { start, stop };
};
