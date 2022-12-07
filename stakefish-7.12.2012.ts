import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
import fetch from "node-fetch";

const possibleBidsAPI = [
  `https://boost-relay.flashbots.net/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://bloxroute.max-profit.blxrbdn.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://bloxroute.ethical.blxrbdn.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://bloxroute.regulated.blxrbdn.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://builder-relay-mainnet.blocknative.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://relay.edennetwork.io/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://mainnet-relay.securerpc.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://relayooor.wtf/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://relay.ultrasound.money/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://agnostic-relay.net/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
];

const slots = [
  5298298, 5298055, 5298040, 5298037, 5297918, 5297695, 5297652, 5297602,
  5297584, 5297489, 5297488, 5297478, 5297455, 5297435, 5297413, 5297375,
  5297330, 5297326, 5297277, 5297274, 5297140, 5297034, 5296850, 5296815,
  5296772, 5296699, 5296653, 5296625, 5296531, 5296517, 5296493, 5296463,
  5296408, 5296330, 5296296, 5296245, 5296180, 5296171, 5296155, 5296141,
  5296001,
];

const findMaxBid = <T extends { value: string }>(bids: T[]): T => {
  return bids.reduce(
    (max, cur) => {
      if (BigNumber.from(cur.value).gt(BigNumber.from(max.value))) {
        return cur;
      }

      return max;
    },
    { value: "0" } as T
  );
};

const findMaxBidForSlot = async (slot: number) => {
  const bids = await Promise.all(
    possibleBidsAPI.map(async (url) => {
      const response = await fetch(url + slot);
      const result = await response.json();
      const hostname = new URL(url).hostname;

      return result.map((bid) => ({ ...bid, hostname }));
    })
  );

  const flatBids = bids.flat();

  return findMaxBid(flatBids);
};

(async () => {
  const result = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const maxBid = await findMaxBidForSlot(slot);

    result.push({
      slot,
      maxBid: formatEther(maxBid.value),
      relayUrl: maxBid.hostname,
    });

    console.log(`slot ${slot} processed`);
  }

  console.table(result);

  // fs.writeFileSync("./dump.json", JSON.stringify(result));
})();
