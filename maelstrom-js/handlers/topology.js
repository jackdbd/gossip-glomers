import defDebug from "debug";
import { nextMessageId, response } from "../utils.js";

const debug = defDebug("maelstrom:handlers:topology");

export const defHandlerTopology = (atom) => {
  return function responseToTopology(msg) {
    debug("node state before `topology` %O", atom.deref());
    const current = atom.swap((old) => {
      return {
        ...old,
        msg_id: nextMessageId(old.msg_id),
        peers: msg.body.topology[old.id] || [],
      };
    });

    const { id: src, msg_id } = current;
    debug("node state after `topology` %O", current);

    return response({
      src,
      dest: msg.src,
      body: {
        in_reply_to: msg.body.msg_id,
        msg_id,
        type: "topology_ok",
      },
    });
  };
};
