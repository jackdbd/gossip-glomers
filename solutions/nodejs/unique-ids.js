#!/usr/bin/env node

import defDebug from "debug";
import { runForever } from "../../maelstrom-js/node.js";

const debug = defDebug("solution:unique-ids");

const main = async () => {
  debug(`run forever`);
  runForever();
};

main();
