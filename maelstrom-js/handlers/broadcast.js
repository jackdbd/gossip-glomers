import defDebug from "debug";
import { nextMessageId, response, sendResponseToStdout } from "../utils.js";

const debug = defDebug("maelstrom:handlers:broadcast");

export const defHandlerBroadcast = (atom) => {
  return function responseToBroadcast(msg) {
    debug("node state before `broadcast` %O", atom.deref());

    const current = atom.swap((old) => {
      if (!old.messages.has(msg.body.message)) {
        old.messages.add(msg.body.message);
      }
      return {
        ...old,
        msg_id: nextMessageId(old.msg_id),
      };
    });

    const { id: src, msg_id, peers } = current;
    debug("node state after `broadcast` %O", current);

    // gossip protocol: propagate values from broadcast messages to the other
    // nodes in the cluster.
    // https://fly.io/dist-sys/3a/
    peers.forEach((dest) => {
      // don't broadcast back to the sender
      if (dest !== msg.src) {
        debug(`broadcast message ${src} => ${dest}`);
        sendResponseToStdout({
          src,
          dest,
          body: {
            in_reply_to: msg.body.msg_id, // TODO: undefined?
            msg_id,
            type: "broadcast",
            message: msg.body.message,
          },
        });
      }
    });

    return response({
      src,
      dest: msg.src,
      body: {
        in_reply_to: msg.body.msg_id, // TODO: undefined?
        msg_id,
        type: "broadcast_ok",
      },
    });
  };
};
