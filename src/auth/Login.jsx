import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [progress, setProgress] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        localStorage.clear();
        localStorage.removeItem("supabase.auth.token");
        setError("");
        setProgress("Logging in...");
        setLoading(true);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (loginError) throw loginError;

            // Wait for session token
            let session = null;
            let retries = 0;
            while (!session && retries < 5) {
                const { data: sessionData } = await supabase.auth.getSession();
                session = sessionData?.session;
                if (!session) {
                    await new Promise((r) => setTimeout(r, 500));
                    retries++;
                }
            }

            if (!session?.user?.id) throw new Error("Session not found.");

            setProgress("Fetching user role...");
            const { data: userRow, error: userFetchError } = await supabase
                .from("users")
                .select("role")
                .eq("id", session.user.id)
                .single();

            if (userFetchError || !userRow?.role) {
                throw new Error("User role not found. Please contact admin.");
            }

            const role = userRow.role;
            setProgress("Redirecting...");

            if (role === "student") {
                navigate("/student");
            } else if (role === "lecturer") {
                navigate("/lecturer");
            } else {
                throw new Error("Unknown role.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setProgress("");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-md">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Welcome back 👋</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {progress && <p className="text-sm text-orange-500">{progress}</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-14 w-full py-4 px-6 text-white font-bold rounded-full bg-orange-500 text-center border border-orange-600 shadow hover:bg-orange-600 transition duration-200 mb-4"
                    >
                        {loading ? "Please wait..." : "Log In"}
                    </button>
                </form>
                <p className="mt-4 text-sm text-slate-600">
                    Don’t have an account?{" "}
                    <a href="/signup" className="text-orange-500">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
