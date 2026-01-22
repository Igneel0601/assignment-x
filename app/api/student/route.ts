import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions"; // your NextAuth config
import clientPromise from "@/lib/mongoClient";

export async function POST(req: Request) {
    console.log("🔥 /api/student HIT");
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const {
        name,
        rollNumber,
        university,
        program,
        currentYear,
        graduationYear,
    } = body;

    await db.collection("forms").updateOne(
        { email: session.user.email },
        {
            $set: {
                email: session.user.email,
                name,
                rollNumber,
                university,
                program,
                currentYear,
                graduationYear,
                updatedAt: new Date(),
            },
        },
        { upsert: true }
    );


    return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();

  const data = await db.collection("forms").findOne({
    email: session.user.email,
  });

  return NextResponse.json(data ?? null);
}