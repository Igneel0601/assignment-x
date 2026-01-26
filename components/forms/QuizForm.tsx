"use client";
import React, { JSX, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";

import { useRouter } from "next/navigation";


interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function QuizCreator({
  initialData,
  quizId,
}: {
  initialData?: {
    title: string;
    questions: Question[];
  };
  quizId?: string;
}): JSX.Element {

const [questions, setQuestions] = useState<Question[]>(
  initialData?.questions?.length
    ? initialData.questions
    : [
        {
          id: 1,
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ]
);

const router = useRouter();


const [title, setTitle] = useState(
  initialData?.title ?? "Quiz Creator"
);


  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
    setCurrentIndex(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    setCurrentIndex(Math.max(0, index - 1));
  };

  const updateQuestion = (
    field: keyof Question,
    value: string | number
  ) => {
    const updated = [...questions];
    updated[currentIndex] = {
      ...updated[currentIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const updateOption = (idx: number, value: string) => {
    const updated = [...questions];
    const options = [...updated[currentIndex].options];
    options[idx] = value;
    updated[currentIndex] = {
      ...updated[currentIndex],
      options,
    };
    setQuestions(updated);
  };

const saveQuiz = async () => {
  const quizData = { title, questions };

  try {
    const res = await fetch(
      quizId ? `/api/quiz/${quizId}` : "/api/quiz",
      {
        method: quizId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to save quiz");
    }

    alert(quizId ? "Quiz updated" : "Quiz created");

    router.push("/admin"); // ✅ redirect here
  } catch (err) {
    console.error(err);
    alert("Failed to save quiz");
  }
};


  return (
    <div className="min-h-screen from-blue-50 to-indigo-100 px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Main Editor */}
        <div className="bg-blue-100/30 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz Title"
              className="text-2xl font-bold text-gray-800 bg-transparent border-b px-2 py-1 focus:outline-none focus:ring-0"
            />
            <div className="flex gap-3">
              <button
                onClick={saveQuiz}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                <Save size={18} />
                Save Quiz
              </button>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
              >
                <Plus size={18} />
                Add Question
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              Question {currentIndex + 1} of {questions.length}
            </span>

            {questions.length > 1 && (
              <button
                onClick={() => removeQuestion(currentIndex)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
              >
                <Trash2 size={16} />
                Remove
              </button>
            )}
          </div>

          {/* Question */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                Question Text
              </label>
              <input
                value={currentQuestion.question}
                onChange={(e) =>
                  updateQuestion("question", e.target.value)
                }
                placeholder="Enter your question..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Answer Options
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={currentQuestion.correctAnswer === idx}
                      onChange={() =>
                        updateQuestion("correctAnswer", idx)
                      }
                    />
                    <input
                      value={opt}
                      onChange={(e) =>
                        updateOption(idx, e.target.value)
                      }
                      placeholder={`Option ${idx + 1}`}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select the correct answer
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 border-t pt-4">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className="flex gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-full text-sm ${
                    idx === currentIndex
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-100/30 rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold mb-2">Quiz Preview</h2>
          <p className="text-sm">
            Total Questions: <b>{questions.length}</b>
          </p>
          <p className="text-sm mt-1">
            Questions with content:{" "}
            <b>{questions.filter((q) => q.question.trim()).length}</b>
          </p>
        </div>
      </div>
    </div>
  );
}
