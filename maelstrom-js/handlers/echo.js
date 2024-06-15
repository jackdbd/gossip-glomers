import defDebug from "debug";
import { nodeNotFound, preconditionFailed } from "../errors.js";
import { nextMessageId } from "../utils.js";

const debug = defDebug("maelstrom:handlers:echo");

export const handleEcho = ({ message, state }) => {
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

  if (!state.id) {
    return {
      error: preconditionFailed({
        in_reply_to,
        text: `node with no ID cannot handle \`echo\` messages. TIP: did you forget to initialize the node?`,
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
            type: "echo_ok",
            in_reply_to,
            msg_id: next_state.msg_id,
            echo: message.body.echo,
          },
        },
      ],
      state: next_state,
    },
  };
};
