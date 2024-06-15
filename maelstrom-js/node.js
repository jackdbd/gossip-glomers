import { defAtom, defCursor } from "@thi.ng/atom";
import { comp } from "@thi.ng/compose";
import defDebug from "debug";
import { rl } from "./globals.js";
import { notSupported } from "./errors.js";
import {
  defLineListener,
  jsonStringFromObj,
  objFromJsonString,
  stripKeys,
  writeToStdout,
} from "./utils.js";

const debug = defDebug("maelstrom:node");

const INITIAL_STATE = {
  id: "",
  gossips: {},
  gossip_interval_id: undefined,
  messages: new Set([]),
  msg_id: 0,
  peers: [],
};

// functional composition is right to left
const stringifyThenWrite = comp(writeToStdout, jsonStringFromObj);

/**
 * Creates a Maelstrom node.
 *
 * A Maelstrom node has the following characteristics:
 * - receives messages on STDIN
 * - sends messages on STDOUT
 * - logs debugging output on STDERR
 * - must not print anything that is not a message to STDOUT
 */
export const defNode = ({ handlers }) => {
  const state = defAtom(INITIAL_STATE);
  debug(`initialized state %O`, state.deref());
  debug(`will handle these messages: ${Object.keys(handlers).join(", ")}`);
  // define some cursor for convenience
  const gossips = defCursor(state, ["gossips"]);

  // state.addWatch("state", (id, prev, curr) => {
  //   const stripped_keys = ["gossip_interval_id"];
  //   const { obj: previous } = stripKeys({ input: prev, keys: stripped_keys });
  //   const { obj: current } = stripKeys({ input: curr, keys: stripped_keys });

  //   debug(`${id} %O`, { previous, current, stripped_keys });
  // });

  // TODO: process gossips in this watcher?
  // gossips.addWatch("gossips", (id, prev, curr) => {
  //   debug(`${id} %O`, { previous: prev, current: curr });
  // });

  const processGossips = () => {
    // const batch_size = 10;

    const hm = gossips.deref();
    debug(`gossip loop: ${Object.keys(hm).length} messages to process`);
    Object.entries(hm).forEach(([g_id, g_msg]) => {
      debug(`process gossip ${g_id} (msg_id: ${g_msg.body.msg_id})`);
      // writeToStdout(JSON.stringify(g_msg));
      rl.emit("line", JSON.stringify(g_msg));
      delete hm[g_id];
    });

    gossips.reset(hm);

    // const n_gossips = gossips.deref().length;
    // if (n_gossips === 0) {
    //   debug(`no gossips to propagate`);
    //   return;
    // }
    // const stop = Math.min(batch_size, n_gossips);

    // debug(`gossip loop %O`, { batch_size, stop, n_gossips });
    // let batch_index = 0;
    // while (batch_index < stop) {
    //   let g_msg;
    //   gossips.swap((arr) => {
    //     // debug(`=== before shift ${arr.length}`);
    //     g_msg = arr.shift();
    //     // debug(`=== after shift ${arr.length}`);
    //     return arr;
    //   });

    //   debug(`send 'broadcast' (gossip) message ID ${g_msg.body.g_id} %O`, {
    //     g_msg,
    //     batch_index,
    //     batch_size,
    //     stop,
    //     n_gossips,
    //   });
    //   rl.emit("line", JSON.stringify(g_msg));
    //   batch_index++;
    // }
  };

  const handleMessage = (message) => {
    const msg_type = message.body.type;

    const handler = handlers[msg_type];

    if (handler) {
      const { error, value } = handler({ message, state: state.deref() });
      if (error) {
        stringifyThenWrite(error);
      } else {
        value.messages
          // .filter((msg) => {
          //   if (msg.body.g_id) {
          //     debug(`skip gossip ${msg.body.g_id}`);
          //   }
          //   return msg.body.g_id === undefined;
          // })
          .forEach(stringifyThenWrite);
        state.reset(value.state);
      }
    } else {
      const node_id = state.deref().id;
      const who = node_id ? `node ${node_id}` : "this node";
      stringifyThenWrite(
        notSupported({
          in_reply_to: message.body.msg_id,
          text: `message of type '${msg_type}' not handled by ${who}`,
        })
      );
    }
  };

  const listener = defLineListener(comp(handleMessage, objFromJsonString));
  debug(`defined 'line' event listener`);

  const stop = () => {
    const { id: node_id, gossip_interval_id } = state.deref();
    // const { id: node_id } = state.deref();

    rl.removeListener("line", listener);
    debug(
      `removed 'line' event listener (node ${node_id} will no longer process messages)`
    );

    // TODO: why is this not stopping the gossip loop?
    clearInterval(gossip_interval_id);
    state.resetIn(["gossip_interval_id"], undefined);
    debug(
      `cleared interval ${gossip_interval_id} (node ${node_id} will no longer process gossips)`
    );
    process.exit(0); // FIXME: fix the gossip loop setInterval, don't exit manually
  };

  const start = (options = { stop_after_ms: undefined }) => {
    rl.addListener("line", listener);
    debug(`added 'line' event listener (this node can now process messages)`);

    state.resetIn(["gossip_interval_id"], setInterval(processGossips, 1000));
    debug(`set interval (this node can now process gossips)`);

    const { stop_after_ms } = options;

    if (stop_after_ms) {
      setTimeout(() => {
        stop();
      }, stop_after_ms);
    }
  };

  return { start, stop };
};
