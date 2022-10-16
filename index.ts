import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
import fetch from "node-fetch";
import slots from "./slots.json";

const possibleBidsAPI = [
  `https://boost-relay.flashbots.net/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://bloxroute.max-profit.blxrbdn.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://bloxroute.ethical.blxrbdn.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://bloxroute.regulated.blxrbdn.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://builder-relay-mainnet.blocknative.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  `https://relay.edennetwork.io/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
  // `https://mainnet-relay.securerpc.com/relay/v1/data/bidtraces/builder_blocks_received?slot=`,
];

const findMaxBid = <T extends { value: string }>(bids: T[]): T => {
  return bids.reduce((max, cur) => {
    if (BigNumber.from(cur.value).gt(BigNumber.from(max.value))) {
      return cur;
    }

    return max;
  });
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
  let totalReceivedValue = BigNumber.from(0);
  let totalPossibleValue = BigNumber.from(0);
  let totalLidoReceivedValue = BigNumber.from(0);
  let totalLidoPossibleValue = BigNumber.from(0);

  const result = [];

  for (let i = 0; i < slots.length; i++) {
    const { slot, deltaBalance, operator } = slots[i];
    const maxBid = await findMaxBidForSlot(slot);

    totalReceivedValue = BigNumber.from(deltaBalance).gt(0)
      ? totalReceivedValue.add(deltaBalance)
      : totalReceivedValue;

    totalPossibleValue = totalPossibleValue.add(maxBid.value);

    if (operator != null) {
      totalLidoReceivedValue = BigNumber.from(deltaBalance).gt(0)
        ? totalLidoReceivedValue.add(deltaBalance)
        : totalLidoReceivedValue;

      totalLidoPossibleValue = totalLidoPossibleValue.add(maxBid.value);
    }

    result.push({
      slot,
      operator,
      deltaBalance: formatEther(deltaBalance),
      maxBid: formatEther(maxBid.value),
      relayUrl: maxBid.hostname,
    });

    console.log(`slot ${slot} processed`);
  }

  const summary = {
    totalReceivedValue: formatEther(totalReceivedValue),
    totalPossibleValue: formatEther(totalPossibleValue),
    totalLidoReceivedValue: formatEther(totalLidoReceivedValue),
    totalLidoPossibleValue: formatEther(totalLidoPossibleValue),
  };

  console.table(result);
  console.table([summary]);
})();
