"use server"

import { ActionResult } from "@/components/form";
import client, { userCollection } from "@/lib/mongodb";
import { hash, verify } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidEmail } from "@/lib/utils";
import { lucia, validateRequest } from "@/lib/auth";

export async function register(_: unknown, formData: FormData): Promise<ActionResult> {
	"use server";
	const name = formData.get("name");
	if (typeof name !== "string" || name.length < 2 || name.length > 32) {
		return {
			error: "Please enter a valid name between 2 and 32."
		};
	}

	const username = formData.get("username");
	if (
		typeof username !== "string" ||
		username.length < 3 ||
		username.length > 24 ||
		!/^[a-z0-9_-]+$/.test(username)
	) {
		return {
			error: "Please enter a valid username between 3 and 24 characters."
		};
	}

	const email = formData.get("email");
	if (typeof email !== "string" || !isValidEmail(email.toString())) {
		return {
			error: "Please enter a valid email."
		};
	}

	await client.connect();

	const existing = await client.db().collection("users").findOne({ $or: [{ username }, { email }] });

	if (existing) {
		if (existing.username === username) {
			return {
				error: "Username already in use."
			};
		}
		if (existing.email === email) {
			return {
				error: "Email already in use."
			};
		} 
	}

	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 8 || password.length > 255) {
		return {
			error: "Please enter a valid password between 8 and 255 characters long."
		};
	}

	const passwordConfirm = formData.get("passwordConfirm");
	if (password !== passwordConfirm) {
		return {
			error: "Passwords do not match."
		};
	}

	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	const userId = generateIdFromEntropySize(10);

	await client.connect().catch(err => {
		console.error(err);
		return {
			error: "Failed to connect to database"
		};
	})

	userCollection.insertOne({
		_id: userId,
		name,
		username,
		email,
		email_verified: false,
		avatar: "",
		banner: "",
		password_hash: passwordHash,
		two_factor_secret: null
	});

	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	return redirect("/");
}

export async function login(_: unknown, formData: FormData): Promise<ActionResult> {
	"use server";
	const email = formData.get("email");

	if (!email || !isValidEmail(email.toString())) {
		return {
			error: "Invalid email"
		};
	}

	const password = formData.get("password");
	if (typeof password !== "string" || password.length < 6 || password.length > 255) {
		return {
			error: "Invalid password"
		};
	}

	await client.connect();

	const existing = await client.db().collection("users").findOne({ email: email });

	if (!existing) {
		return {
			error: "Incorrect email or password"
		};
	}

	const validPassword = await verify(existing.password_hash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	if (!validPassword) {
		return {
			error: "Incorrect email or password"
		};
	}

	const session = await lucia.createSession(existing._id.toString(), {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return redirect("/");
}

export async function logout(): Promise<ActionResult> {
	"use server";
	const { session } = await validateRequest();
	if (!session) {
		return {
			error: "Unauthorized"
		};
	}

	await lucia.invalidateSession(session.id);

	const sessionCookie = lucia.createBlankSessionCookie();
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return redirect("/");
}