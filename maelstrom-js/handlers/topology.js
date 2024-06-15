import { preconditionFailed } from "../errors.js";
import { nextMessageId } from "../utils.js";

export const handleTopology = ({ message, state }) => {
  const in_reply_to = message.body.msg_id;

  if (!state.id) {
    return {
      error: preconditionFailed({
        in_reply_to,
        text: `node with no ID cannot handle \`topology\` messages. TIP: did you forget to initialize the node?`,
      }),
    };
  }

  if (message.body.topology === undefined) {
    return {
      error: preconditionFailed({
        in_reply_to,
        text: `incoming message has no \`topology\` in its body`,
      }),
    };
  }

  const next_state = {
    ...state,
    msg_id: nextMessageId(state.msg_id),
    peers: message.body.topology[state.id] || [],
  };

  return {
    value: {
      messages: [
        {
          src: message.dest,
          dest: message.src,
          body: {
            type: "topology_ok",
            in_reply_to,
            msg_id: next_state.msg_id,
          },
        },
      ],
      state: next_state,
    },
  };
};
