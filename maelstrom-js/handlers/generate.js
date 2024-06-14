import { uuid } from "@thi.ng/random";
import defDebug from "debug";
import { nextMessageId, response } from "../utils.js";

const debug = defDebug("maelstrom:handlers:generate");

export const defHandlerGenerate = (atom) => {
  return function responseToGenerate(msg) {
    debug("node state before `generate` %O", atom.deref());
    const current = atom.swap((old) => {
      return {
        ...old,
        msg_id: nextMessageId(old.msg_id),
      };
    });

    const { id: src, msg_id } = current;
    debug("node state after `generate` %O", current);

    return response({
      src,
      dest: msg.src,
      body: {
        id: uuid(),
        in_reply_to: msg.body.msg_id,
        msg_id,
        type: "generate_ok",
      },
    });
  };
};
