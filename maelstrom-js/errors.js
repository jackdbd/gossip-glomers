import { maelstrom_error } from "./schemas.js";

// https://github.com/jepsen-io/maelstrom/blob/main/resources/errors.edn

const errorOrThrow = (err) => {
  const result = maelstrom_error.safeParse(err);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
};

export const timeout = () => {
  const err = {
    code: 0,
    name: "timeout",
    doc: "Indicates that the requested operation could not be completed within a timeout.",
  };
  return errorOrThrow(err);
};

export const nodeNotFound = () => {
  const err = {
    code: 1,
    definite: true,
    name: "node-not-found",
    doc: "Thrown when a client sends an RPC request to a node which does not exist.",
  };
  return errorOrThrow(err);
};

export const crash = () => {
  const err = {
    code: 13,
    name: "crash",
    doc: "Indicates that some kind of general, indefinite error occurred. Use this as a catch-all for errors you can't otherwise categorize, or as a starting point for your error handler: it's safe to return `crash` for every problem by default, then add special cases for more specific errors later.",
  };
  return errorOrThrow(err);
};

export const preconditionFailed = () => {
  const err = {
    code: 22,
    definite: true,
    name: "precondition-failed",
    doc: "The requested operation expected some conditions to hold, and those conditions were not met. For instance, a compare-and-set operation might assert that the value of a key is currently 5; if the value is 3, the server would return `precondition-failed`.",
  };
  return errorOrThrow(err);
};
