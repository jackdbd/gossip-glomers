import defDebug from "debug";
import { nodeNotFound, preconditionFailed } from "../errors.js";
import { nextMessageId } from "../utils.js";

const debug = defDebug("maelstrom:handlers:init");

/**
 * In response to a `init` message, a node must respond with a message of type
 * `init_ok`.
 * @see [Maelstrom protocol initialization](https://github.com/jepsen-io/maelstrom/blob/main/resources/protocol-intro.md#initialization)
 */

export const handleInit = ({ message, state }) => {
  const in_reply_to = message.body.msg_id;

  if (!message.src) {
    return {
      error: nodeNotFound({
        in_reply_to,
        text: `message ID ${in_reply_to} has no \`src\``,
      }),
    };
  }

  if (!message.dest) {
    return {
      error: nodeNotFound({
        in_reply_to,
        text: `message ID ${in_reply_to} has no \`dest\``,
      }),
    };
  }

  if (state.id) {
    return {
      error: preconditionFailed({
        in_reply_to,
        text: `node has already an ID, so cannot handle \`init\` messages. TIP: you probably already initialized this node`,
      }),
    };
  }

  const next_state = {
    ...state,
    id: message.body.node_id,
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
            type: "init_ok",
            in_reply_to,
            msg_id: next_state.msg_id,
          },
        },
      ],
      state: next_state,
    },
  };
};
