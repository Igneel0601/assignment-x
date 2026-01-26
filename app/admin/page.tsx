import LoginView from "@/components/views/LoginView"
import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import CreateButton from "@/components/CreateButton"
import clientPromise from "@/lib/mongoClient"
import QuizTable from "@/components/QuizTable"

export default async function Home() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return <LoginView />
    }

    if (session.user.role !== "admin") {
        return (
            <div className="p-8 flex items-center justify-center text-red-500 text-lg">
                You are not authorized
            </div>
        )
    }

    // Fetch quizzes from DB
    const client = await clientPromise
    const db = client.db()
    const quizzes = await db
        .collection("quiz")
        .find()
        .sort({ createdAt: -1 })
        .toArray()

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold mb-4">Quizzes</h1>

                <QuizTable initialQuizzes={quizzes.map((q: any) => ({
                    _id: q._id.toString(),
                    title: q.title,
                    questions: q.questions || [],
                    createdAt: q.createdAt,
                    published: q.published || false,
                }))} />

                <div className="mt-4 flex justify-end">
                    <CreateButton />
                </div>
            </div>
        </div>
    )
}
