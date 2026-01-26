import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ THIS IS THE FIX

  const client = await clientPromise;
  const db = client.db();

  const quiz = await db
    .collection("quiz")
    .findOne({ _id: new ObjectId(id) });

  if (!quiz) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(quiz);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ SAME FIX

  const body = await req.json();

  const client = await clientPromise;
  const db = client.db();

  await db.collection("quiz").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        title: body.title,
        questions: body.questions,
        published: body.published,
      },
    }
  );

  return NextResponse.json({ success: true });
}
