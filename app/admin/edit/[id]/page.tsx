"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QuizCreator from "@/components/forms/QuizForm";

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/quiz/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (!quiz) return <p className="p-6">Quiz not found</p>;

  return (
    <QuizCreator
      quizId={id}
      initialData={{
        title: quiz.title,
        questions: quiz.questions ?? [],
      }}
    />
  );
}
