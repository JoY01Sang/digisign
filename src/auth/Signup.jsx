import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    const navigate = useNavigate();
    const [role, setRole] = useState("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [progressStage, setProgressStage] = useState("");

    const handleSignup = async (e) => {
        e.preventDefault();
        localStorage.clear();
        localStorage.removeItem("supabase.auth.token");
        setLoading(true);
        setError("");
        setSuccess("");
        setProgressStage("Creating account...");

        try {
            // Step 1: Sign up user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });
            if (signUpError) throw signUpError;

            // Step 2: Retry for session (wait for Supabase to create it)
            setProgressStage("Waiting for session...");
            let session = null, tries = 0;
            while (!session && tries < 10) {
                const { data: sessionData } = await supabase.auth.getSession();
                session = sessionData?.session;
                if (!session) {
                    await new Promise((res) => setTimeout(res, 500));
                    tries++;
                }
            }

            if (!session?.access_token || !session.user?.id) {
                throw new Error("Signup successful, but no session found. Check your email to confirm.");
            }

            const token = session.access_token;

            // Step 3: Call Edge Function with user details
            setProgressStage("Saving user data...");
            const res = await fetch("https://ycsqswlldpzuspadjerc.supabase.co/functions/v1/signup", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: fullName,
                    registration_number: regNumber,
                    department,
                    year: Number(year),
                    email,
                    role,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result?.error || "Signup failed on backend");

            setProgressStage("Signup complete!");
            setSuccess("Signup successful. Redirecting...");

            // Step 4: Navigate based on role
            setTimeout(() => {
                if (role === "student") {
                    navigate("/student");
                } else {
                    navigate("/lecturer");
                }
            }, 1000);

        } catch (err) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-md">
                <form onSubmit={handleSignup}>
                    <h1 className="text-3xl font-bold font-heading mb-4">Sign Up</h1>
                    <a className="inline-block text-gray-500 hover:underline transition duration-200 mb-6" href="/login">
                        <span>Already have an account? </span>
                        <span className="font-bold font-heading text-orange-500">Login</span>
                    </a>

                    {/* Role Selection */}
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="radio" value="student" checked={role === "student"} onChange={(e) => setRole(e.target.value)} />
                            Student
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="radio" value="lecturer" checked={role === "lecturer"} onChange={(e) => setRole(e.target.value)} />
                            Lecturer
                        </label>
                    </div>

                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                           type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                           type="email" placeholder="john@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="flex items-center gap-1 w-full rounded-full p-4 border border-gray-100 shadow mb-4">
                        <input
                            className="outline-none flex-1 placeholder-gray-500"
                            type="password" placeholder="Enter password"
                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path fill="#A3A3A3" d="M21.25 9.15C18.94 5.52 15.56 3.43 12 3.43C10.22 3.43 8.49 3.95 6.91 4.92C5.33 5.9 3.91 7.33 2.75 9.15C1.75 10.72 1.75 13.27 2.75 14.84C5.06 18.48 8.44 20.56 12 20.56C13.78 20.56 15.51 20.04 17.09 19.07C18.67 18.09 20.09 16.66 21.25 14.84C22.25 13.28 22.25 10.72 21.25 9.15ZM12 16.04C9.76 16.04 7.96 14.23 7.96 12C7.96 9.77 9.76 7.96 12 7.96C14.24 7.96 16.04 9.77 16.04 12C16.04 14.23 14.24 16.04 12 16.04Z" />
                            <path fill="#A3A3A3" d="M12.0004 9.14C10.4304 9.14 9.15039 10.42 9.15039 12C9.15039 13.57 10.4304 14.85 12.0004 14.85C13.5704 14.85 14.8604 13.57 14.8604 12C14.8604 10.43 13.5704 9.14 12.0004 9.14Z" />
                        </svg>
                    </div>

                    {/* Student-specific fields */}
                    {role === "student" && (
                        <>
                            <label className="block text-sm font-medium mb-2">Registration Number</label>
                            <input className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                                   type="text" placeholder="REG123" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required />

                            <label className="block text-sm font-medium mb-2">Department</label>
                            <input className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                                   type="text" placeholder="Computer Science" value={department} onChange={(e) => setDepartment(e.target.value)} required />

                            <label className="block text-sm font-medium mb-2">Year</label>
                            <input className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                                   type="number" placeholder="3" value={year} onChange={(e) => setYear(e.target.value)} required />
                        </>
                    )}

                    {/* Lecturer-specific fields */}
                    {role === "lecturer" && (
                        <>
                            <label className="block text-sm font-medium mb-2">Department</label>
                            <input className="w-full rounded-full p-4 border border-gray-100 shadow mb-4 placeholder-gray-500"
                                   type="text" placeholder="Information Systems" value={department} onChange={(e) => setDepartment(e.target.value)} required />
                        </>
                    )}
                    {loading && (
                        <div className="text-sm text-gray-600 my-2">
                            {progressStage}
                            <div className="h-2 mt-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full animate-pulse w-full"></div>
                            </div>
                        </div>
                    )}


                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {success && (
                        <p className="text-green-400 text-center mb-4">{success}</p>
                    )}

                    <button type="submit"
                            disabled={loading}
                            className="h-14 w-full py-4 px-6 text-white font-bold rounded-full bg-orange-500 text-center border border-orange-600 shadow hover:bg-orange-600 transition duration-200 mb-4">
                        {loading ? "Signing you up ..." : "Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
}
