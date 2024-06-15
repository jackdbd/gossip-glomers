import defDebug from "debug";

const debug = defDebug("maelstrom:handlers:broadcast_ok");

export const handleBroadcastOk = ({ message, state }) => {
  const { src, dest, body } = message;
  const { in_reply_to, msg_id } = body;

  const { [in_reply_to]: gossip, ...gossips_to_ack } = Object.assign(
    {},
    state.gossips_to_ack
  );

  if (gossip) {
    debug(
      `${src} replies to 'broadcast' message ID ${in_reply_to} (sent by ${dest}) with 'broadcast_ok' message ID ${msg_id} %O`,
      gossip
    );
  }

  const next_state = { ...state, gossips_to_ack };

  return {
    value: {
      messages: [],
      state: next_state,
    },
  };
};
