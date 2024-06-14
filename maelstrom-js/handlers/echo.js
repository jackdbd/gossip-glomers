import defDebug from "debug";
import { nextMessageId, response } from "../utils.js";

const debug = defDebug("maelstrom:handlers:echo");

export const defHandlerEcho = (atom) => {
  return function responseToEcho(msg) {
    debug("node state before `echo` %O", atom.deref());
    const current = atom.swap((old) => {
      return {
        ...old,
        msg_id: nextMessageId(old.msg_id),
      };
    });

    const { id: src, msg_id } = current;
    debug("node state after `echo` %O", current);

    return response({
      src,
      dest: msg.src,
      body: {
        echo: msg.body.echo,
        in_reply_to: msg.body.msg_id,
        msg_id,
        type: "echo_ok",
      },
    });
  };
};
