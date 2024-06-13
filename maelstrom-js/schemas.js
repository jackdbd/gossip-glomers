import { z } from "zod";

// Node identifiers are represented as strings.
export const node_id = z.string();

export const message_id = z.number().min(1);

export const maelstrom_error = z.object({
  code: z.number().min(0).max(30),
  definite: z.boolean().optional(),
  doc: z.string().min(1),
  name: z.string().min(1),
});

export const maelstrom_error_message_body = z.object({
  code: z.number().min(0),
  in_reply_to: z.number().min(1),
  text: z.string().min(1),
  type: z.literal("error"),
});

// Messages always have a src, dest, and body.
// An `id` field is optional, and is assigned internally.
export const message = z.object({
  body: z.any(),
  dest: node_id,
  id: message_id.optional(),
  src: node_id,
});

// TODO: add all message types. I think they are all defined here:
// https://github.com/jepsen-io/maelstrom/tree/main/src/maelstrom/workload
export const message_type = z.enum([
  "broadcast",
  "echo",
  "echo_ok",
  "error",
  "init",
  "init_ok",
  "poll",
]);

export const init_message_body = z.object({
  node_id,
  node_ids: z.array(node_id).min(1),
  msg_id: message_id.optional(),
  type: message_type,
});

export const message_body = z.object({
  msg_id: message_id.optional(),
  type: message_type,
});
