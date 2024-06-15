import { uuid } from "@thi.ng/random";
import defDebug from "debug";
import { preconditionFailed } from "../errors.js";
import { nextMessageId } from "../utils.js";

const debug = defDebug("maelstrom:handlers:generate");

export const handleGenerate = ({ message, state }) => {
  const in_reply_to = message.body.msg_id;

  if (!state.id) {
    return {
      error: preconditionFailed({
        in_reply_to,
        text: `node with no ID cannot handle \`generate\` messages. TIP: did you forget to initialize the node?`,
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
            type: "generate_ok",
            in_reply_to,
            msg_id: next_state.msg_id,
            id: uuid(),
          },
        },
      ],
      state: next_state,
    },
  };
};
