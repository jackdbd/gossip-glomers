import defDebug from "debug";
import { nextMessageId, response } from "../utils.js";

const debug = defDebug("maelstrom:handlers:init");

/**
 * In response to a `init` message, a node must respond with a message of type
 * `init_ok`.
 * @see [Maelstrom protocol initialization](https://github.com/jepsen-io/maelstrom/blob/main/resources/protocol-intro.md#initialization)
 */
export const defHandlerInit = (atom) => {
  return function responseToInit(msg) {
    debug("node state before `init` %O", atom.deref());

    const current = atom.swap((old) => {
      return {
        ...old,
        id: msg.body.node_id,
        msg_id: nextMessageId(old.msg_id),
      };
    });

    const { id: src, msg_id } = current;
    debug("node state after `init` %O", current);

    return response({
      src,
      dest: msg.src,
      body: {
        in_reply_to: msg.body.msg_id,
        msg_id,
        type: "init_ok",
      },
    });
  };
};
