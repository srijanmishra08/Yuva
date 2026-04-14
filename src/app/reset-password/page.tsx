'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPasswordPage() {

  const router = useRouter()

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const updatePassword = async () => {

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage("Password updated successfully!")
    setLoading(false)

    setTimeout(() => {
      router.push("/admin/login")
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1426] text-white">

      <div className="bg-[#1C2433] p-8 rounded-xl w-[400px]">

        <h1 className="text-2xl font-semibold mb-6 text-center">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 rounded bg-[#111827] mb-4"
        />

        <button
          onClick={updatePassword}
          disabled={loading}
          className="w-full bg-yellow-500 text-black py-3 rounded font-semibold"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm">
            {message}
          </p>
        )}

      </div>

    </div>
  )
}