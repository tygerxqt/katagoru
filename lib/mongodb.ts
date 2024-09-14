import { Collection, MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.DATABASE_URI) {
	throw new Error('Invalid/Missing environment variable: "DATABASE_URI"');
}

const uri = process.env.DATABASE_URI;
const options: MongoClientOptions = {
	appName: "katarogu",
};

interface UserDoc {
	_id: string;
	name: string;
	username: string;
	email: string;
	email_verified: boolean;
	avatar: string;
	banner: string;
	password_hash: string;
	two_factor_secret: string | null;
}

interface SessionDoc {
	_id: string;
	expires_at: Date;
	user_id: string;
}

let client: MongoClient;
export let userCollection: Collection<UserDoc>;
export let sessionCollection: Collection<SessionDoc>;

if (process.env.NODE_ENV === "development") {
	// In development mode, use a global variable so that the value
	// is preserved across module reloads caused by HMR (Hot Module Replacement).
	const globalWithMongo = global as typeof globalThis & {
		_mongoClient?: MongoClient;
		_mongoUsersCollection: Collection<UserDoc>;
		_mongoSessionsCollection: Collection<SessionDoc>;
	};

	if (!globalWithMongo._mongoClient) {
		globalWithMongo._mongoClient = new MongoClient(uri, options);
	}

	client = globalWithMongo._mongoClient;
	await client.connect();

	if (!globalWithMongo._mongoUsersCollection) {
		globalWithMongo._mongoUsersCollection = client.db().collection("users");
	}

	userCollection = globalWithMongo._mongoUsersCollection;

	if (!globalWithMongo._mongoSessionsCollection) {
		globalWithMongo._mongoSessionsCollection = client.db().collection("sessions");
	}

	sessionCollection = globalWithMongo._mongoSessionsCollection;
} else {
	// In production mode, it's best to not use a global variable.
	client = new MongoClient(uri, options);
	await client.connect();
	userCollection = client.db().collection("users");
	sessionCollection = client.db().collection("sessions");
}

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client;