"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="mb-6 text-3xl font-bold">Admin Login</h1>

      <form onSubmit={handleLogin} className="space-y-4 border p-6 rounded-xl">
        <input
          className="w-full border px-4 py-3 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border px-4 py-3 rounded"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-black text-white py-3 rounded">
          Login
        </button>
      </form>
    </main>
  );
}
