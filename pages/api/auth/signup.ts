import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { hash } from 'bcryptjs';
import { Credentials, SignupResponse, Collections } from '../../../lib/types';
import options from '../../../lib/options';

const { MONGODB_URI } = process.env;

async function handler(
	req: NextApiRequest,
	res: NextApiResponse<SignupResponse>
) {
	if (req.method == 'POST') {
		const { email, password }: Credentials = req.body;

		if (!email || !email.includes('@') || !password) {
			res.status(422).json({ message: 'Invalid Data' });
			return;
		}

		if (!MONGODB_URI) {
			throw new Error('Please add your Mongo URI to .env.local');
		}

		const client = await MongoClient.connect(MONGODB_URI);
		const db = client.db();
		const isExistingUser = await db
			.collection(Collections.Users)
			.findOne({ email });

		if (isExistingUser) {
			res.status(422).json({ message: 'Email is already in use.' });
			client.close();
			return;
		}

		const status = await db
			.collection(Collections.Users)
			.insertOne({ email, password: hash(password, 12) });

		res.status(201).json({ message: 'User successfully created.', ...status });
		client.close();
	}

	res.status(500).json({ message: 'Invalid route' });
}

export default handler;
