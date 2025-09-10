#!/usr/bin/env ts-node
import { parseArgs } from 'node:util';

type CommandHandler = () => Promise<void>;

export const commands: Record<string, CommandHandler> = {};

export async function run(command: string): Promise<void> {
  const handler = commands[command];
  if (!handler) {
    throw new Error(`Unknown command: ${command}`);
  }
  await handler();
}

async function main(): Promise<void> {
  const { positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
  });
  const cmd = positionals[0];
  if (!cmd) {
    console.error('No command provided');
    process.exit(1);
  }
  try {
    await run(cmd);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}

