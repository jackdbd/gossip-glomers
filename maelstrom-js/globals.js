import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import defDebug from "debug";
import { Smush32 } from "@thi.ng/random";

const debug = defDebug("maelstrom:globals");

debug(`create readline interface`);
export const rl = readline.createInterface({ input: stdin, output: stdout });

debug(`create pseudo-random number generator`);
export const rnd = new Smush32(0xdecafbad);
