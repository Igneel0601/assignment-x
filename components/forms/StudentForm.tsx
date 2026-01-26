"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";


export default function StudentForm() {
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    university: "",
    program: "",
    currentYear: "",
    graduationYear: "",
  });



  const [initialFormData, setInitialFormData] = useState(formData);

  const [isEditing, setIsEditing] = useState(true); // ✅ Start in editing mode

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      console.error("Failed to save");
      return;
    }

    setInitialFormData(formData);
    setIsEditing(false);
  };

  const { data: session, status } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;

    const loadData = async () => {
      const res = await fetch("/api/student");
      if (!res.ok) return;

      const data = await res.json();
      if (!data) return; // 👈 no existing data → keep form empty

      setFormData({
        name: data.name ?? "",
        rollNumber: data.rollNumber ?? "",
        university: data.university ?? "",
        program: data.program ?? "",
        currentYear: data.currentYear ?? "",
        graduationYear: data.graduationYear ?? "",
      });

      setInitialFormData({
        name: data.name ?? "",
        rollNumber: data.rollNumber ?? "",
        university: data.university ?? "",
        program: data.program ?? "",
        currentYear: data.currentYear ?? "",
        graduationYear: data.graduationYear ?? "",
      });

      setIsEditing(false); // 🔒 lock if data exists
    };

    loadData();
  }, [session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }
  if (!session?.user?.email) {
    return <div>Not authenticated</div>;
  }

  const startEditing = () => {
    setInitialFormData(formData);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFormData(initialFormData);
    setIsEditing(false);
  };



  return (
    <div className="max-w-md space-y-4 rounded-lg border p-6">
      <h2 className="text-xl font-semibold">Student Details</h2>

      <input
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full border p-2 rounded ${!isEditing ? "bg-gray-100" : "bg-white"
          }`}
      />

      <input
        type="email"
        name="email"
        value={session.user.email || ""}
        readOnly
        className="w-full border p-2 rounded bg-gray-100"
      />


      <input
        type="text"
        name="rollNumber"
        placeholder="Roll Number"
        value={formData.rollNumber}
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full border p-2 rounded ${!isEditing ? "bg-gray-100" : "bg-white"
          }`}
      />

      <input
        type="text"
        name="university"
        placeholder="University"
        value={formData.university}
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full border p-2 rounded ${!isEditing ? "bg-gray-100" : "bg-white"
          }`}
      />

      <input
        type="text"
        name="program"
        placeholder="Program (e.g. B.Tech CSE)"
        value={formData.program}
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full border p-2 rounded ${!isEditing ? "bg-gray-100" : "bg-white"
          }`}
      />

      <input
        type="number"
        name="currentYear"
        placeholder="Current Year"
        value={formData.currentYear}
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full border p-2 rounded ${!isEditing ? "bg-gray-100" : "bg-white"
          }`}
      />

      <input
        type="number"
        name="graduationYear"
        placeholder="Graduation Year"
        value={formData.graduationYear}
        onChange={handleChange}
        readOnly={!isEditing}
        className={`w-full border p-2 rounded ${!isEditing ? "bg-gray-100" : "bg-white"
          }`}
      />

      <div className="flex gap-4">
        {!isEditing ? (
          <button
            type="button"
            onClick={startEditing}
            className="w-full bg-gray-500 text-white py-2 rounded"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-blue-500 text-white py-2 rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="w-full bg-gray-200 text-gray-900 py-2 rounded"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}


