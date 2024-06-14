#!/usr/bin/env node

// import path from "node:path";
// import { fileURLToPath } from "node:url";
import { defAtom } from "@thi.ng/atom";
import { pickRandom } from "@thi.ng/random";
import defDebug from "debug";
// import Piscina from "piscina";
import { rl } from "../../maelstrom-js/globals.js";
import {
  defHandlerBroadcast,
  defHandlerInit,
  defHandlerRead,
  defHandlerTopology,
} from "../../maelstrom-js/handlers/index.js";
import { defNode } from "../../maelstrom-js/node.js";
import { nextMessageId, makeUniqueInteger } from "../../maelstrom-js/utils.js";

const debug = defDebug("solution:broadcast");

// const __filename = fileURLToPath(import.meta.url);
// const repo_root = path.join(__filename, "..", "..", "..");
// const filename = path.join(repo_root, "maelstrom-js", "node.js");

// const piscina = new Piscina({ filename });

// https://github.com/jepsen-io/maelstrom/blob/main/demo/js/gossip.js

const main = async () => {
  const args = process.argv.slice(2);

  const state = defAtom({
    id: "",
    messages: new Set([]), // messages seen by this node
    msg_id: 0,
    peers: [],
  });

  const node = defNode({
    handlers: {
      init: defHandlerInit(state),
      broadcast: defHandlerBroadcast(state),
      read: defHandlerRead(state),
      topology: defHandlerTopology(state),
    },
  });

  if (args[0] === "demo") {
    const demo_loop_ms = 2000;
    const demo_total_ms = 30000;
    const stop_node_after_ms = demo_total_ms;

    const client_ids = ["c1", "c2", "c3", "c4", "c5"];
    const node_ids = ["n1", "n2", "n3"];
    const topology = {
      n1: ["n2", "n3"],
      n2: ["n1"],
      n3: ["n1"],
    };

    debug(`demo %O`, {
      client_ids,
      node_ids,
      topology,
      demo_loop_ms,
      demo_total_ms,
      stop_node_after_ms,
    });

    const uniqueInteger = makeUniqueInteger();

    // create and init each node in the network
    node_ids.forEach((node_id) => {
      node.start({ stop_after_ms: stop_node_after_ms });
      // piscina.run(node_stop_after_ms, { name: "runUntil" });

      const init_message = {
        src: pickRandom(client_ids),
        dest: node_id,
        body: { type: "init", node_id, msg_id: nextMessageId() },
      };
      debug(`${init_message.src} sends 'init' to ${init_message.dest}`);
      rl.emit("line", JSON.stringify(init_message));
    });

    // keep sending messages until the demo is over, even if one or more nodes have stopped
    const interval_id = setInterval(() => {
      const topology_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: { type: "topology", topology },
      };
      debug(
        `${topology_message.src} informs ${topology_message.dest} of topology %O`,
        topology_message.body.topology
      );
      rl.emit("line", JSON.stringify(topology_message));

      const broadcast_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: { type: "broadcast", message: uniqueInteger() },
      };
      debug(
        `${broadcast_message.src} broadcasts ${broadcast_message.body.message} to ${broadcast_message.dest}`
      );
      rl.emit("line", JSON.stringify(broadcast_message));

      const read_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: { type: "read" },
      };
      debug(
        `${read_message.src} asks ${read_message.dest} to read broadcasted messages`
      );
      rl.emit("line", JSON.stringify(read_message));
    }, demo_loop_ms);

    setTimeout(() => {
      clearInterval(interval_id);
      debug(`cleared interval ${interval_id}`);
      rl.close();
      debug(`closed readline interface`);
    }, demo_total_ms);
  } else {
    node.start();
  }
};

main();
