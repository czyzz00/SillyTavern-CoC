import { randomInt } from 'crypto';

export async function onLoad({ registerSlashCommand }) {

  registerSlashCommand({
    name: "r",
    description: "roll dice",
    callback: async ({ args }) => {

      const roll = randomInt(1, 101);

      return `🎲 D100 = ${roll}`;
    }
  });

}
