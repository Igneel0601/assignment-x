"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Quiz {
  _id: string;
  title: string;
  questions: any[];
  createdAt?: string | Date;
  published?: boolean;
}

export default function QuizTable({ initialQuizzes }: { initialQuizzes: Quiz[] }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes || []);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const publish = async (id: string) => {
    const quiz = quizzes.find((q) => q._id === id);
    const currentlyPublished = !!quiz?.published;
    if (!confirm(currentlyPublished ? "Unpublish this quiz?" : "Publish this quiz?")) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/quiz/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, publish: !currentlyPublished }),
      });

      if (!res.ok) throw new Error(await res.text());

      const body = await res.json();
      setQuizzes((prev) => prev.map((q) => (q._id === id ? { ...q, published: !!body.published } : q)));
      alert(body.published ? "Published" : "Unpublished");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert(currentlyPublished ? "Failed to unpublish" : "Failed to publish");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Title</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Questions</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Created</th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y">
          {quizzes.map((q) => (
            <tr key={q._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q.title}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Array.isArray(q.questions) ? q.questions.length : 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{q.createdAt ? new Date(q.createdAt).toLocaleString() : "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <div className="inline-flex items-center gap-2">
                  <Link href={`/admin/edit/${q._id}`} className="text-indigo-600 hover:text-indigo-800">
                    Edit
                  </Link>

                  <button
                    onClick={() => publish(q._id)}
                    disabled={loadingId === q._id}
                    className={`px-3 py-1 rounded-md text-sm ${q.published ? "bg-yellow-100 text-yellow-800" : "bg-blue-600 text-white hover:bg-blue-700"} disabled:opacity-50`}
                  >
                    {loadingId === q._id ? (q.published ? "Updating..." : "Publishing...") : q.published ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
