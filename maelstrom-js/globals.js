import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import defDebug from "debug";
import { Smush32 } from "@thi.ng/random";

const debug = defDebug("maelstrom:globals");

export const rl = readline.createInterface({ input: stdin, output: stdout });
debug(`created readline interface`);

export const rnd = new Smush32(0xdecafbad);
debug(`created pseudo-random number generator %O`, rnd);
