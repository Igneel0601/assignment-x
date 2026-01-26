import clientPromise from "../../../lib/mongoClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		if (!body || !Array.isArray(body.questions)) {
			return new NextResponse("Invalid payload", { status: 400 });
		}

		const client = await clientPromise;
		const db = client.db();
		const collection = db.collection("quiz");

		const doc = {
			title: body.title || "Untitled Quiz",
			questions: body.questions,
			createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
		};

		const result = await collection.insertOne(doc);

		return NextResponse.json({ insertedId: result.insertedId.toString() }, { status: 201 });
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.error("/api/quiz error:", err);
		return new NextResponse(err?.message || "Internal Server Error", { status: 500 });
	}
}

