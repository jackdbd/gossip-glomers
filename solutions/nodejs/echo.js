#!/usr/bin/env node

import { defAtom } from "@thi.ng/atom";
import { pickRandom } from "@thi.ng/random";
import defDebug from "debug";
import { rl, rnd } from "../../maelstrom-js/globals.js";
import { defNode } from "../../maelstrom-js/node.js";
import { nextMessageId } from "../../maelstrom-js/utils.js";
import {
  defHandlerEcho,
  defHandlerInit,
} from "../../maelstrom-js/handlers/index.js";

const debug = defDebug("solution:echo");

const main = async () => {
  const args = process.argv.slice(2);

  const state = defAtom({
    id: "",
    msg_id: 0,
  });

  const node = defNode({
    handlers: { init: defHandlerInit(state), echo: defHandlerEcho(state) },
  });

  if (args[0] === "demo") {
    const demo_loop_ms = 2000;
    const demo_total_ms = 11000;
    const stop_node_after_ms = demo_total_ms;

    const client_ids = ["c1", "c2", "c3", "c4", "c5"];
    const node_ids = ["n1", "n2", "n3"];

    debug(`demo %O`, { demo_loop_ms, demo_total_ms, stop_node_after_ms });
    node.start({ stop_after_ms: stop_node_after_ms });

    const init_message = {
      src: "c1",
      dest: "n1",
      body: { type: "init", node_id: "n1", msg_id: nextMessageId() },
    };
    debug(`${init_message.src} sends 'init' to ${init_message.dest}`);
    rl.emit("line", JSON.stringify(init_message));

    const interval_id = setInterval(() => {
      const echo = `hello ${pickRandom(["bob", "john", "paul"])}`;

      const echo_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: { msg_id: rnd.int(), type: "echo", echo },
      };
      debug(`${echo_message.src} asks ${echo_message.dest} to echo "${echo}"`);
      rl.emit("line", JSON.stringify(echo_message));
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
