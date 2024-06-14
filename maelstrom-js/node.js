import { defAtom, defCursor } from "@thi.ng/atom";
import { comp } from "@thi.ng/compose";
import { uuid } from "@thi.ng/random";
import defDebug from "debug";
import { rl } from "./globals.js";
import {
  defLineListener,
  jsonStringFromObj,
  nextMessageId,
  objFromJsonString,
  response,
  sendResponseToStdout,
  writeToStdout,
} from "./utils.js";

const debug = defDebug("maelstrom:node");

// initial state of a Maelstrom node, before it receives any messages (including an init message)
const INITIAL_STATE = {
  id: "", //ID of this node
  messages: new Set([]), // messages seen by this node
  msg_id: 0,
  peers: [],
};

/**
 * Creates a Maelstrom node.
 *
 * A Maelstrom node has the following characteristics:
 * - receives messages on STDIN
 * - sends messages on STDOUT
 * - logs debugging output on STDERR
 * - must not print anything that is not a message to STDOUT
 */
const defNode = () => {
  debug(`create node with initial state %O`, INITIAL_STATE);
  const state = defAtom(INITIAL_STATE);
  const node_id = defCursor(state, ["id"]);
  const msg_id = defCursor(state, ["msg_id"]);
  const messages = defCursor(state, ["messages"]);
  const peers = defCursor(state, ["peers"]);
  // I find swapping cursors much more convenient than swapping the entire atom.
  // const new_state = state.swapIn(["msg_id"], nextMessageId);

  const responseFromMessage = (req) => {
    // debug(`state %O`, state.deref());

    const { body } = req;

    const res_body =
      body.msg_id === undefined
        ? {}
        : {
            in_reply_to: body.msg_id,
            // Each Maelstrom node takes care of creating unique message IDs for
            // the messages it sends. For example, each node can use a
            // monotonically increasing integer as their source of message IDs.
            msg_id: msg_id.swap(nextMessageId),
          };

    // I don't think there is any need to validate the incoming message (e.g.
    // using zod), since Maelstrom (or more precisely, Jepsen) already does it.
    switch (body.type) {
      case "broadcast": {
        messages.swap((s) => {
          if (!s.has(body.message)) {
            s.add(body.message);
          }
          return s;
        });

        // gossip protocol: propagate values from broadcast messages to the
        // other nodes in the cluster.
        // https://fly.io/dist-sys/3a/
        const src = node_id.deref();

        peers.deref().forEach((dest) => {
          // don't broadcast back to the sender
          if (dest !== req.src) {
            debug(`broadcast message ${src} => ${dest}`);
            sendResponseToStdout({
              src,
              dest,
              body: { ...res_body, type: "broadcast", message: body.message },
            });
          }
        });

        return response({
          src: node_id.deref(), // it's the same as src: state.deref().id
          dest: req.src,
          body: { ...res_body, type: "broadcast_ok" },
        });
      }

      case "echo": {
        return response({
          src: node_id.deref(),
          dest: req.src,
          body: { ...res_body, type: "echo_ok", echo: body.echo },
        });
      }

      case "generate": {
        return response({
          src: node_id.deref(),
          dest: req.src,
          body: { ...res_body, type: "generate_ok", id: uuid() },
        });
      }

      case "init": {
        // In response to the init message, each node must respond with a message
        // of type `init_ok`.
        // https://github.com/jepsen-io/maelstrom/blob/main/resources/protocol-intro.md#initialization
        node_id.reset(body.node_id); // it's the same as state.resetIn(["id"], body.node_id)
        return response({
          src: node_id.deref(),
          dest: req.src,
          body: { ...res_body, type: "init_ok" },
        });
      }

      case "read": {
        const sorted_messages = [...messages.deref()].sort((a, b) => a - b);
        return response({
          src: node_id.deref(),
          dest: req.src,
          body: { ...res_body, type: "read_ok", messages: sorted_messages },
        });
      }

      case "topology": {
        const src = node_id.deref();
        peers.reset(body.topology[src] || []);
        debug(`peers of node ${src}: ${peers.deref().join(",")}`);
        return response({
          src,
          dest: req.src,
          body: { ...res_body, type: "topology_ok" },
        });
      }

      default: {
        return { error: `message type ${body.type} not_implemented` };
      }
    }
  };

  // functional composition is right to left
  const handler = comp(
    // Maelstrom nodes send messages (JSON strings) to STDOUT
    writeToStdout,
    jsonStringFromObj,
    responseFromMessage,
    // Maelstrom nodes receive messages (JSON strings) on STDIN
    objFromJsonString
  );

  const listener = defLineListener(handler);
  debug(`defined 'line' event listener`);

  const start = () => {
    rl.addListener("line", listener);
    debug(`added 'line' event listener`);
  };

  const stop = () => {
    rl.removeListener("line", listener);
    debug(`removed 'line' event listener`);
  };

  return { start, stop };
};

export const runForever = () => {
  debug(`run forever`);
  const node = defNode();
  node.start();
};

export const runUntil = (ms) => {
  debug(`run for ${ms}ms`);
  const node = defNode();
  node.start();

  setTimeout(() => {
    node.stop();
  }, ms);
};
