#!/usr/bin/env node

import { defAtom } from "@thi.ng/atom";
import { pickRandom } from "@thi.ng/random";
import defDebug from "debug";
import { rl } from "../../maelstrom-js/globals.js";
import { defNode } from "../../maelstrom-js/node.js";
import { nextMessageId } from "../../maelstrom-js/utils.js";
import {
  defHandlerGenerate,
  defHandlerInit,
} from "../../maelstrom-js/handlers/index.js";

const debug = defDebug("solution:unique-ids");

const main = async () => {
  const args = process.argv.slice(2);

  const state = defAtom({
    id: "",
    msg_id: 0,
  });

  const node = defNode({
    handlers: {
      init: defHandlerInit(state),
      generate: defHandlerGenerate(state),
    },
  });

  if (args[0] === "demo") {
    const demo_loop_ms = 500;
    const demo_total_ms = 5000;
    const stop_node_after_ms = demo_total_ms;

    const client_ids = ["c1", "c2", "c3", "c4", "c5"];
    const node_ids = ["n1", "n2", "n3"];

    debug(`demo %O`, {
      client_ids,
      node_ids,
      demo_loop_ms,
      demo_total_ms,
      stop_node_after_ms,
    });

    node.start({ stop_after_ms: stop_node_after_ms });

    const node_id = pickRandom(node_ids);
    const init_message = {
      src: pickRandom(client_ids),
      dest: node_id,
      body: { type: "init", node_id, msg_id: nextMessageId() },
    };
    debug(`${init_message.src} sends 'init' to ${init_message.dest}`);
    rl.emit("line", JSON.stringify(init_message));

    // keep sending messages until the demo is over, even if one or more nodes have stopped
    const interval_id = setInterval(() => {
      const generate_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: { type: "generate" },
      };
      debug(
        `${generate_message.src} asks ${generate_message.dest} to generate a unique ID`
      );
      rl.emit("line", JSON.stringify(generate_message));
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
