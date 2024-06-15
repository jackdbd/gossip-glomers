/**
 * Handlers for the messages sent to Maelstrom nodes.
 *
 * JS objects are passed by reference, so an atom swap in a message handler
 * affects the state of the Maelstrom node we passed in.
 *
 * Each Maelstrom node takes care of creating unique message IDs for the
 * messages it sends. For example, each node can use a monotonically increasing
 * integer as their source of message IDs.
 *
 * I don't think there is any need to validate the incoming message (e.g. using
 * zod), since Maelstrom—or more precisely, Jepsen—already does it.
 */
export * from "./broadcast.js";
export * from "./broadcast_ok.js";
export * from "./echo.js";
export * from "./generate.js";
export * from "./init.js";
export * from "./read.js";
export * from "./topology.js";
