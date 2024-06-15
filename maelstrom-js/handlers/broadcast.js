import defDebug from "debug";
import { nextMessageId } from "../utils.js";

const debug = defDebug("maelstrom:handlers:broadcast");

export const handleBroadcast = ({ message, state }) => {
  const { body } = message;
  const in_reply_to = body.msg_id;
  const value_to_broadcast = body.message;

  const gossips = { ...state.gossips };

  const g_dest = message.dest;
  if (body.g_id) {
    // debug(`delete gossip ${body.g_id} %O`, gossips[body.g_id]);
    debug(`delete gossip ${body.g_id} (msg_id: ${body.msg_id})`);
    delete gossips[body.g_id];
  }

  let msg_id = nextMessageId(state.msg_id);

  const broadcast_ok = {
    src: message.dest,
    dest: message.src,
    body: {
      type: "broadcast_ok",
      in_reply_to,
      msg_id,
    },
  };

  const messages = [broadcast_ok];
  debug(`${broadcast_ok.src} => ${broadcast_ok.dest} 'broadcast_ok' (ack) %O`, {
    msg_id,
    in_reply_to,
  });

  // gossip protocol: propagate the value from a 'broadcast' message, to all
  // the neighboring nodes in the cluster.
  // https://fly.io/dist-sys/3a/
  state.peers.forEach((dest, i) => {
    // don't broadcast to the node itself
    if (dest !== state.id && dest !== g_dest) {
      msg_id = nextMessageId(msg_id);
      // message ID to identify a 'broadcast' message of the gossip protocol
      const g_id = `${state.id}=>${dest}::${value_to_broadcast}::g${i}`;

      const g_msg = {
        src: state.id,
        dest,
        body: {
          type: "broadcast",
          message: value_to_broadcast,
          g_id,
          msg_id,
        },
      };

      messages.push(g_msg);
      // debug(`add gossip ${g_id} %O`, g_msg);
      debug(`add gossip ${g_id} (msg_id: ${g_msg.body.msg_id})`);
      gossips[g_id] = g_msg;
      debug(`${g_msg.src} => ${g_msg.dest} 'broadcast' (gossip) %O`, {
        g_id,
        message: value_to_broadcast,
        msg_id,
      });
    }
  });

  const next_state = {
    ...state,
    gossips,
    messages: state.messages.add(value_to_broadcast),
    msg_id,
  };

  return {
    value: {
      messages,
      state: next_state,
    },
  };
};
