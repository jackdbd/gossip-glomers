#!/usr/bin/env node

import { pickRandom } from "@thi.ng/random";
import defDebug from "debug";
import { runForever, runUntil } from "../../maelstrom-js/node.js";
import { rl } from "../../maelstrom-js/globals.js";
import { nextMessageId, makeUniqueInteger } from "../../maelstrom-js/utils.js";

const debug = defDebug("solution:broadcast");

const main = async () => {
  const args = process.argv.slice(2);

  if (args[0] === "demo") {
    const demo_loop_ms = 2000;
    const demo_total_ms = 15000;
    const node_stop_after_ms = 15000;

    debug(`demo %O`, { demo_loop_ms, demo_total_ms, node_stop_after_ms });
    runUntil(node_stop_after_ms);

    const init_message = {
      src: "c1",
      dest: "n1",
      body: { type: "init", node_id: "n1", msg_id: nextMessageId() },
    };
    debug(`emit init message`);
    rl.emit("line", JSON.stringify(init_message));

    const uniqueInteger = makeUniqueInteger();

    const interval_id = setInterval(() => {
      const broadcast_message = {
        src: pickRandom(["c1", "c2", "c3", "c4", "c5"]),
        dest: pickRandom(["n1", "n2", "n3"]),
        body: { type: "broadcast", message: uniqueInteger() },
      };
      debug(`emit broadcast message`);
      rl.emit("line", JSON.stringify(broadcast_message));

      const read_message = {
        src: pickRandom(["c1", "c2", "c3", "c4", "c5"]),
        dest: pickRandom(["n1", "n2", "n3"]),
        body: { type: "read" },
      };
      debug(`emit read message`);
      rl.emit("line", JSON.stringify(read_message));

      const topology = {
        n1: ["n2", "n3"],
        n2: ["n1"],
        n3: ["n1"],
      };
      const topology_message = {
        src: pickRandom(["c1", "c2", "c3", "c4", "c5"]),
        dest: pickRandom(["n1", "n2", "n3"]),
        body: { type: "topology", topology },
      };
      debug(`emit topology message`);
      rl.emit("line", JSON.stringify(topology_message));
    }, demo_loop_ms);

    setTimeout(() => {
      clearInterval(interval_id);
      debug(`cleared interval ${interval_id}`);
      rl.close();
      debug(`closed readline interface`);
    }, demo_total_ms);
  } else {
    debug(`run forever`);
    runForever();
  }
};

main();
