'use client';

import Link from "next/link";

export default function LoginButton() {
    return (
        <Link href="/admin/create"
            className="bg-gray-300 py-2 px-4 ml-2 rounded-md">
            Create Quiz
        </Link>
    );
}