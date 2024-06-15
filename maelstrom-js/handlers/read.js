import defDebug from "debug";
import { preconditionFailed } from "../errors.js";
import { nextMessageId } from "../utils.js";

const debug = defDebug("maelstrom:handlers:read");

export const handleRead = ({ message, state }) => {
  const in_reply_to = message.body.msg_id;

  if (!state.id) {
    return {
      error: preconditionFailed({
        in_reply_to,
        text: `node with no ID cannot handle \`read\` messages. TIP: did you forget to initialize the node?`,
      }),
    };
  }

  if (state.messages === undefined) {
    return {
      error: preconditionFailed({
        in_reply_to,
        text: `node with no messages cannot handle \`read\` messages. TIP: did you forget to initialize the node?`,
      }),
    };
  }

  const next_state = {
    ...state,
    msg_id: nextMessageId(state.msg_id),
  };
  // debug(`${next_state.id} next state %O`, next_state);

  return {
    value: {
      messages: [
        {
          src: message.dest,
          dest: message.src,
          body: {
            type: "read_ok",
            in_reply_to,
            msg_id: next_state.msg_id,
            // I am not sure I need to sort the messages
            messages: [...next_state.messages].sort((a, b) => a - b),
          },
        },
      ],
      state: next_state,
    },
  };
};
