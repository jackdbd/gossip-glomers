import defDebug from "debug";
// import { maelstrom_error } from "./schemas.js";

const debug = defDebug("maelstrom:errors");

// https://github.com/jepsen-io/maelstrom/blob/main/resources/protocol-intro.md#errors
// https://github.com/jepsen-io/maelstrom/blob/main/resources/errors.edn

// const errorOrThrow = (err) => {
//   const result = maelstrom_error.safeParse(err);
//   if (!result.success) {
//     throw result.error;
//   }
//   return result.data;
// };

// export const timeout = () => {
//   const err = {
//     code: 0,
//     name: "timeout",
//     doc: "Indicates that the requested operation could not be completed within a timeout.",
//   };
//   return errorOrThrow(err);
// };

// export const crash = () => {
//   const err = {
//     code: 13,
//     name: "crash",
//     doc: "Indicates that some kind of general, indefinite error occurred. Use this as a catch-all for errors you can't otherwise categorize, or as a starting point for your error handler: it's safe to return `crash` for every problem by default, then add special cases for more specific errors later.",
//   };
//   return errorOrThrow(err);
// };

export const notSupported = ({ in_reply_to, text }) => {
  const code = 11;
  debug(
    `NOT SUPPORTED [code: ${code}] ${text} (in reply to msg_id ${in_reply_to})`
  );
  return {
    code,
    in_reply_to,
    text,
    type: "error",
  };
};

export const nodeNotFound = ({ in_reply_to, text }) => {
  const code = 1;
  debug(
    `NODE NOT FOUND [code: ${code}] ${text} (in reply to msg_id ${in_reply_to})`
  );
  return {
    code,
    in_reply_to,
    text,
    type: "error",
  };
};

export const preconditionFailed = ({ in_reply_to, text }) => {
  const code = 22;
  debug(
    `PRECONDITION FAILED [code: ${code}] ${text} (in reply to msg_id ${in_reply_to})`
  );
  return {
    code,
    in_reply_to,
    text,
    type: "error",
  };
};
