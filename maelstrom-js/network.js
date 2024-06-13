import { defAtom } from "@thi.ng/atom";
import defDebug from "debug";
import { crash, nodeNotFound } from "./errors.js";
import { defNode } from "./node.js";
import { message as message_schema } from "./schemas.js";

const debug = defDebug("maelstrom:network");

// const default_initial_state = {
//   node_id: "n3",
//   node_ids: ["n1", "n2", "n3"],
//   node_map: new Map(),
// };

// TODO: should msg_id be an atom?

// https://github.com/jepsen-io/maelstrom/blob/main/resources/protocol-intro.md#initialization
export const defNetwork = ({ id, node_id, node_ids }) => {
  debug(`trying to instantiate network ${id} %O`, { node_id, node_ids });
  const state = defAtom({ client_map: new Map(), id, node_map: new Map() });

  // const { node_id, node_ids } = state.deref();

  if (!node_ids.includes(node_id)) {
    // throw new Error(
    //   `node_id ${node_id} not found in network. The network has these node_ids: ${node_ids.join(
    //     ", "
    //   )}`
    // );
    return { error: crash() };
  }

  node_ids.forEach((id) => {
    const node = defNode({ id });

    const { error } = node.init({
      msg_id: 1,
      node_id: id,
      node_ids,
      type: "init",
    });

    if (error) {
      // throw new Error(`node ${id} failed to initialize`);
      debug(`init error %O`, error);
      return { error };
      // return;
    }

    state.swap((s) => {
      s.node_map.set(id, node);
      return s;
    });

    state.swap((s) => {
      s.client_map.set("c1", { name: "test client" });
      return s;
    });
  });
  debug(`initialized ${node_ids.length} nodes`);

  debug(`instantiated network ${state.deref().id}`);

  const route = (msg) => {
    debug(`trying to route message %O`, msg);
    const result_route = message_schema.safeParse(msg);
    if (!result_route.success) {
      // return { error: result_route.error };
      debug(`route error %O`, result_route.error);
      return;
    }

    // The Maelstrom protocol requires a body, but seems not to require a msg_id
    // const msg_id = msg.body.msg_id || "<msg_id>";

    const dest = state.deref().node_map.get(msg.dest);
    // const dest = state.deref().node_map.get("n99");
    if (!dest) {
      debug(`route error %O`, nodeNotFound());
      // return { error: nodeNotFound() };
      return;
    }

    const { error } = dest.handle(msg);
    if (error) {
      // return { error };
      debug(`route error %O`, error);
      return;
    }

    debug(`message routed successfully %O`, msg);

    // TODO: implement RPC requests
    const { error: rpc_error } = dest.rpc({ type: "aaa" });
    if (rpc_error) {
      debug(`RPC error %O`, rpc_error);
      return;
    }

    // debug(
    //   `message ID ${msg_id} from ${msg.src} routed successfully to ${msg.dest}`
    // );
    // return {
    //   value: `message ID ${msg_id} from ${msg.src} routed successfully to ${msg.dest}`,
    // };
  };

  const status = () => {
    console.log(`Network status:`);
    console.log(state.deref());
  };

  return { network: { route, status } };
};
