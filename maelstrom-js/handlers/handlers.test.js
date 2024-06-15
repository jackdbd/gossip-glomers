import assert from "node:assert";
import { describe, it } from "node:test";
import { handleBroadcast } from "./broadcast.js";
import { handleEcho } from "./echo.js";
import { handleGenerate } from "./generate.js";
import { handleInit } from "./init.js";
import { handleRead } from "./read.js";
import { handleTopology } from "./topology.js";
import { nextMessageId } from "../utils.js";

const echoMessage = ({ src, dest, echo, msg_id }) => {
  return {
    src,
    dest,
    body: { type: "echo", msg_id, echo },
  };
};

const initMessage = ({ src, dest, msg_id }) => {
  return {
    src,
    dest,
    body: { type: "init", msg_id, node_id: dest },
  };
};

const generateMessage = ({ src, dest, msg_id }) => {
  return {
    src,
    dest,
    body: { type: "generate", msg_id },
  };
};

const readMessage = ({ src, dest, msg_id }) => {
  return {
    src,
    dest,
    body: { type: "read", msg_id },
  };
};

const topologyMessage = ({ src, dest, msg_id, topology }) => {
  return {
    src,
    dest,
    body: { type: "topology", msg_id, topology },
  };
};

const broadcastMessage = ({ src, dest, msg_id, message }) => {
  return {
    src,
    dest,
    body: { type: "broadcast", msg_id, message },
  };
};

describe("echo handler", () => {
  it("replies with a NODE_NOT_FOUND error message, when the message source does not exist [error]", () => {
    const message = echoMessage({
      src: undefined,
      dest: "n1",
      echo: "Hello",
      msg_id: 42,
    });
    const prev_state = { id: "n1", msg_id: 42 };

    const { error } = handleEcho({ message, state: prev_state });

    assert.strictEqual(error.in_reply_to, message.body.msg_id);
  });

  it("replies with a NODE_NOT_FOUND error message, when the message destination does not exist [error]", () => {
    const message = echoMessage({
      src: "c1",
      dest: undefined,
      echo: "Hello",
      msg_id: 42,
    });
    const prev_state = { id: "n1", msg_id: 42 };

    const { error } = handleEcho({ message, state: prev_state });

    assert.strictEqual(error.in_reply_to, message.body.msg_id);
  });

  it("replies with a PRECONDITION FAILED error message, when the destination node has no id (e.g. the node is not `init`ed yet) [error]", () => {
    const message = echoMessage({
      src: "c1",
      dest: "n1",
      echo: "Hello",
      msg_id: 42,
    });
    const prev_state = { id: undefined, msg_id: 42 };

    const { error } = handleEcho({ message, state: prev_state });

    assert.strictEqual(error.in_reply_to, message.body.msg_id);
  });

  it("replies with a single message", () => {
    const prev_msg_id = 42;
    const message = echoMessage({
      src: "c1",
      dest: "n1",
      echo: "Hello",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { value } = handleEcho({ message, state: prev_state });

    assert.strictEqual(value.messages.length, 1);
  });

  it("replies with a `echo_ok` message to a valid `echo` message", () => {
    const prev_msg_id = 42;
    const message = echoMessage({
      src: "c1",
      dest: "n1",
      echo: "Hello",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { value } = handleEcho({ message, state: prev_state });

    const echo_ok = value.messages[0];
    assert.strictEqual(echo_ok.src, "n1");
    assert.strictEqual(echo_ok.dest, "c1");
    assert.strictEqual(echo_ok.body.type, "echo_ok");
  });

  it("updates msg_id (e.g. increments msg_id) [state]", () => {
    const prev_msg_id = 42;
    const message = echoMessage({
      src: "c1",
      dest: "n1",
      echo: "Hello",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { value } = handleEcho({ message, state: prev_state });

    assert.strictEqual(value.state.msg_id, nextMessageId(prev_msg_id));
  });
});

describe("init handler", () => {
  it("replies with a PRECONDITION FAILED error message, when the node has already an ID (e.g. the node has already been `init`ed) [error]", () => {
    const message = echoMessage({
      src: "c1",
      dest: "n1",
      echo: "Hello",
      msg_id: 42,
    });
    const prev_state = { id: "n1", msg_id: 42 };

    const { error } = handleInit({ message, state: prev_state });

    assert.strictEqual(error.in_reply_to, message.body.msg_id);
  });

  it("replies with a single message", () => {
    const prev_msg_id = 42;
    const message = initMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: undefined, msg_id: prev_msg_id };

    const { value } = handleInit({ message, state: prev_state });

    assert.strictEqual(value.messages.length, 1);
  });

  it("updates id [state]", () => {
    const prev_msg_id = 42;
    const message = initMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: undefined, msg_id: prev_msg_id };

    const { value } = handleInit({ message, state: prev_state });

    assert.strictEqual(value.state.id, message.dest);
  });
});

describe("generate handler", () => {
  it("replies with a PRECONDITION FAILED error message, when the destination node has no id (e.g. the node is not `init`ed yet) [error]", () => {
    const message = generateMessage({
      src: "c1",
      dest: "n1",
      id: "some-unique-id",
      msg_id: 42,
    });
    const prev_state = { id: undefined, msg_id: 42 };

    const { error } = handleGenerate({ message, state: prev_state });

    assert.strictEqual(error.in_reply_to, message.body.msg_id);
  });

  it("replies with a single message", () => {
    const prev_msg_id = 42;
    const message = generateMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { value } = handleGenerate({ message, state: prev_state });

    assert.strictEqual(value.messages.length, 1);
  });

  it("replies with a `generate_ok` message to a valid `generate` message", () => {
    const prev_msg_id = 42;
    const message = generateMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { error, value } = handleGenerate({ message, state: prev_state });

    const generate_ok = value.messages[0];
    assert.strictEqual(generate_ok.src, "n1");
    assert.strictEqual(generate_ok.dest, "c1");
    assert.strictEqual(generate_ok.body.type, "generate_ok");
    assert.notEqual(generate_ok.body.id, undefined);
  });
});

describe("read handler", () => {
  it("replies with a PRECONDITION FAILED error message, when the node has no `messages` field defined (e.g. the node is not `init`ed yet) [error]", () => {
    const prev_msg_id = 42;
    const message = readMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
    });
    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { error } = handleRead({ message, state: prev_state });

    assert.strictEqual(error.in_reply_to, message.body.msg_id);
  });

  it("replies with a `read_ok` message to a valid `read` message", () => {
    const prev_msg_id = 42;
    const message = readMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
    });

    const prev_state = { id: "n1", messages: [], msg_id: prev_msg_id };

    const { value } = handleRead({ message, state: prev_state });

    const read_ok = value.messages[0];
    assert.strictEqual(read_ok.src, "n1");
    assert.strictEqual(read_ok.dest, "c1");
    assert.strictEqual(read_ok.body.type, "read_ok");
    assert.notEqual(read_ok.body.messages, undefined);
    assert.equal(read_ok.body.messages.length, 0);
  });
});

describe("topology handler", () => {
  it("replies with a `topology_ok` message to a valid `topology` message", () => {
    const prev_msg_id = 42;
    const topology = {
      n1: ["n2", "n3"],
      n2: ["n1"],
      n3: ["n1"],
    };
    const message = topologyMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
      topology,
    });

    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { value } = handleTopology({ message, state: prev_state });

    const topology_ok = value.messages[0];
    assert.strictEqual(topology_ok.src, "n1");
    assert.strictEqual(topology_ok.dest, "c1");
    assert.strictEqual(topology_ok.body.type, "topology_ok");
  });

  it("updates peers [state]", () => {
    const prev_msg_id = 42;
    const topology = {
      n1: ["n2", "n3"],
      n2: ["n1"],
      n3: ["n1"],
    };
    const message = topologyMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
      topology,
    });

    const prev_state = { id: "n1", msg_id: prev_msg_id };

    const { value } = handleTopology({ message, state: prev_state });

    assert.deepStrictEqual(value.state.peers, ["n2", "n3"]);
  });
});

describe("broadcast handler", () => {
  it("replies with 3 messages to a valid `broadcast` message: 1 `broadcast_ok` (ack), 2 `broadcast` (gossip)", () => {
    const prev_msg_id = 42;
    const value_to_broadcast = 789;
    const message = broadcastMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
      message: value_to_broadcast,
    });

    const prev_state = {
      gossips: [],
      id: "n1",
      messages: new Set([123, 456]),
      msg_id: prev_msg_id,
      peers: ["n2", "n3"],
    };

    const { value } = handleBroadcast({ message, state: prev_state });

    assert.equal(value.messages.length, 3);
    const m0 = value.messages[0];
    const m1 = value.messages[1];
    const m2 = value.messages[2];
    assert.equal(m0.body.type, "broadcast_ok");
    assert.equal(m1.body.type, "broadcast");
    assert.equal(m2.body.type, "broadcast");
  });

  it("propagates the value to broadcast to its peers (gossip protocol)", () => {
    const prev_msg_id = 42;
    const value_to_broadcast = 789;
    const message = broadcastMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
      message: value_to_broadcast,
    });

    const peers = ["n2", "n3"];
    const prev_state = {
      gossips: [],
      id: "n1",
      messages: new Set([123, 456]),
      msg_id: prev_msg_id,
      peers,
    };

    const { value } = handleBroadcast({ message, state: prev_state });

    const m1 = value.messages[1];
    const m2 = value.messages[2];
    assert.equal(m1.dest, peers[0]);
    assert.equal(m2.dest, peers[1]);
    assert.equal(m1.body.message, value_to_broadcast);
    assert.equal(m2.body.message, value_to_broadcast);
  });

  it("gossip messages have `g_id` and no `in_reply_to` in their bodies", () => {
    const prev_msg_id = 42;
    const value_to_broadcast = 789;
    const message = broadcastMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
      message: value_to_broadcast,
    });

    const peers = ["n2", "n3"];
    const prev_state = {
      gossips: [],
      id: "n1",
      messages: new Set([123, 456]),
      msg_id: prev_msg_id,
      peers,
    };

    const { value } = handleBroadcast({ message, state: prev_state });

    const m1 = value.messages[1];
    const m2 = value.messages[2];
    assert.notEqual(m1.body.g_id, undefined);
    assert.equal(m1.body.in_reply_to, undefined);
    assert.notEqual(m2.body.g_id, undefined);
    assert.equal(m2.body.in_reply_to, undefined);
  });

  it("increments `msg_id` 3 times (1 for each message) [state]", () => {
    const prev_msg_id = 42;

    const message = broadcastMessage({
      src: "c1",
      dest: "n1",
      msg_id: prev_msg_id,
      message: 789,
    });

    const prev_state = {
      gossips: [],
      id: "n1",
      messages: new Set([123, 456]),
      msg_id: prev_msg_id,
      peers: ["n2", "n3"],
    };

    const { value } = handleBroadcast({ message, state: prev_state });

    assert.equal(value.state.msg_id, prev_msg_id + 3);
  });
});
