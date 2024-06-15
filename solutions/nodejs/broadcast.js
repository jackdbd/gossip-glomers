#!/usr/bin/env node

// import path from "node:path";
// import { fileURLToPath } from "node:url";
import { pickRandom } from "@thi.ng/random";
import defDebug from "debug";
// import Piscina from "piscina";
import { rl } from "../../maelstrom-js/globals.js";
import {
  handleInit,
  handleBroadcast,
  handleBroadcastOk,
  handleRead,
  handleTopology,
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

  const node = defNode({
    handlers: {
      broadcast: handleBroadcast,
      // broadcast_ok: handleBroadcastOk,
      init: handleInit,
      read: handleRead,
      topology: handleTopology,
    },
  });

  if (args[0] === "demo") {
    const loop_ms = 2000;
    const stop_after_ms = 11000;
    const stop_node_after_ms = stop_after_ms - 1000;

    const client_ids = ["c1", "c2", "c3"];

    const node_ids = ["n1", "n2", "n3"];
    const topology = {
      n1: ["n2", "n3"],
      n2: ["n1"],
      n3: ["n1"],
    };

    debug(`run demo with this config %O`, {
      client_ids,
      node_ids,
      topology,
      loop_ms,
      stop_after_ms,
      stop_node_after_ms,
    });
    node.start({ stop_after_ms: stop_node_after_ms });

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
      debug(`${init_message.src} => ${init_message.dest} 'init'`);
      rl.emit("line", JSON.stringify(init_message));
    });

    let msg_id = 1;
    // keep sending messages until the demo is over, even if one or more nodes have stopped
    const interval_id = setInterval(() => {
      msg_id++;
      const topology_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: { type: "topology", topology, msg_id: nextMessageId(msg_id) },
      };
      debug(
        `${topology_message.src} => ${topology_message.dest} 'topology' %O`,
        {
          msg_id: topology_message.body.msg_id,
          topology: topology_message.body.topology,
        }
      );
      rl.emit("line", JSON.stringify(topology_message));

      msg_id++;
      const broadcast_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: {
          type: "broadcast",
          message: uniqueInteger(),
          msg_id: nextMessageId(msg_id),
        },
      };
      debug(
        `${broadcast_message.src} => ${broadcast_message.dest} 'broadcast' (original) %O`,
        {
          msg_id: broadcast_message.body.msg_id,
          message: broadcast_message.body.message,
        }
      );
      rl.emit("line", JSON.stringify(broadcast_message));

      msg_id++;
      const g_src = pickRandom(node_ids);
      const g_dest = pickRandom(node_ids);
      const g_value = uniqueInteger();
      const gossip_message = {
        src: g_src,
        dest: g_dest,
        body: {
          type: "broadcast",
          message: g_value,
          msg_id: nextMessageId(msg_id),
          g_id: `${g_src}=>${g_dest}::${g_value}`,
        },
      };
      debug(
        `${gossip_message.src} => ${gossip_message.dest} 'broadcast' (gossip) %O`,
        {
          msg_id: gossip_message.body.msg_id,
          message: gossip_message.body.message,
          g_id: gossip_message.body.g_id,
        }
      );
      rl.emit("line", JSON.stringify(gossip_message));

      msg_id++;
      const broadcast_ok_message = {
        src: g_dest,
        dest: g_src,
        body: {
          type: "broadcast_ok",
          in_reply_to: gossip_message.body.msg_id,
          msg_id: nextMessageId(msg_id),
        },
      };
      debug(
        `${broadcast_ok_message.src} => ${broadcast_ok_message.dest} 'broadcast_ok' %O`,
        {
          msg_id: broadcast_ok_message.body.msg_id,
        }
      );
      rl.emit("line", JSON.stringify(broadcast_ok_message));

      msg_id++;
      const read_message = {
        src: pickRandom(client_ids),
        dest: pickRandom(node_ids),
        body: { type: "read", msg_id: nextMessageId(msg_id) },
      };
      debug(`${read_message.src} => ${read_message.dest} 'read'`, {
        msg: read_message.body.msg_id,
      });
      rl.emit("line", JSON.stringify(read_message));
    }, loop_ms);

    setTimeout(() => {
      clearInterval(interval_id);
      debug(`cleared interval ${interval_id}`);
      rl.close();
      debug(`closed readline interface`);
    }, stop_after_ms);
  } else {
    node.start();
  }
};

main();
