import type { NextApiRequest, NextApiResponse } from 'next';

type BalanceResponse = {
  balance: string | null;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceResponse>
) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ balance: null, error: 'Invalid address parameter' });
  }

  try {
    // TODO: Update this URL to use the Mina Explorer API for the network you are using.
    const apiUrl = `https://devnet.api.minaexplorer.com/accounts/${address}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch balance from Mina Explorer API');
    }

    const data = await response.json();
    const balance = data.account.balance;

    res.status(200).json({ balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ balance: null, error: 'Failed to fetch balance' });
  }
}
