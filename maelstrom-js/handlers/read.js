import defDebug from "debug";
import { nextMessageId, response } from "../utils.js";

const debug = defDebug("maelstrom:handlers:read");

export const defHandlerRead = (atom) => {
  return function responseToRead(msg) {
    debug("node state before `read` %O", atom.deref());
    const current = atom.swap((old) => {
      return {
        ...old,
        msg_id: nextMessageId(old.msg_id),
      };
    });

    const { id: src, messages, msg_id } = current;
    debug("node state after `read` %O", current);
    const sorted_messages = [...messages].sort((a, b) => a - b);

    return response({
      src,
      dest: msg.src,
      body: {
        in_reply_to: msg.body.msg_id,
        msg_id,
        type: "read_ok",
        messages: sorted_messages,
      },
    });
  };
};
