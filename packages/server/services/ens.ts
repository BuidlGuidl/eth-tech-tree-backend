import { http, createPublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ALCHEMY_API_URL)
});

export const getEnsAddress = async (name: string) => {
    const address = await client.getEnsAddress({ name });

    return address;
};

export const getEnsName = async (address: string) => {
    const name = await client.getEnsName({
        address: address as `0x${string}`,
    });
    return name;
};

export const getEnsResolver = async (name: string) => {
    const resolverAddress = await client.getEnsResolver({
        name: normalize(name),
    });
    return resolverAddress;
};


