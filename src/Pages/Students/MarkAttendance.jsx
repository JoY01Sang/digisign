import { useEffect, useState } from "react";
import {supabase} from "../../services/supabase";
import { CheckCircleIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";

export default function MarkAttendance() {
    const [studentId, setStudentId] = useState(null);
    const [session, setSession] = useState(null);
    const [isMarked, setIsMarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [error, setError] = useState(null);

    // Step 1: Fetch logged-in student ID
    useEffect(() => {
        const fetchStudentId = async () => {
            try {
                const {
                    data: { user },
                    error: userErr,
                } = await supabase.auth.getUser();

                if (userErr || !user) throw new Error("Authentication failed");

                const { data, error: studentErr } = await supabase
                    .from("students")
                    .select("id")
                    .eq("auth_id", user.id)
                    .single();

                if (studentErr || !data) throw new Error("Student record not found");

                setStudentId(data.id);
            } catch (err) {
                setError(err.message);
                console.error("Fetch student error:", err);
            }
        };

        fetchStudentId();
    }, []);

    // Step 2: Fetch current class session
    useEffect(() => {
        if (!studentId) return;

        const fetchSession = async () => {
            try {
                setLoading(true);
                setError(null);

                const now = new Date().toISOString();

                const { data: enrolledCourses, error: enrollErr } = await supabase
                    .from("enrollments")
                    .select("course_id")
                    .eq("student_id", studentId);

                if (enrollErr) throw new Error("Failed to fetch enrollments");

                const courseIds = enrolledCourses.map((e) => e.course_id);

                const { data: sessions, error: sessionErr } = await supabase
                    .from("class_sessions")
                    .select("*")
                    .in("course_id", courseIds)
                    .lte("start_time", now)
                    .gte("end_time", now)
                    .limit(1);

                if (sessionErr) throw new Error("Failed to fetch sessions");

                const active = sessions?.[0];
                if (!active) {
                    setSession(null);
                    setIsMarked(false);
                    setLoading(false);
                    return;
                }

                setSession(active);

                const { data: attendance, error: attendErr } = await supabase
                    .from("attendance")
                    .select("id")
                    .eq("student_id", studentId)
                    .eq("session_id", active.id)
                    .maybeSingle();

                if (attendErr) throw new Error("Failed to check attendance");

                setIsMarked(!!attendance);
            } catch (err) {
                setError(err.message);
                console.error("Session fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [studentId]);

    // Step 3: Handle button click
    const handleMark = async () => {
        if (!session || !studentId) return;

        try {
            setMarking(true);
            setError(null);

            const payload = {
                session_id: session.id,
                student_id: studentId,
                timestamp: new Date().toISOString(),
            };

            const signature = btoa(JSON.stringify(payload)); // Basic digital signature

            const { data, error } = await supabase.functions.invoke("mark-attendance", {
                body: { ...payload, signature },
            });

            if (error || !data?.success) {
                throw new Error(data?.message || error?.message || "Failed to mark attendance.");
            }

            setIsMarked(true);
        } catch (err) {
            setError(err.message);
            console.error("Mark attendance error:", err);
        } finally {
            setMarking(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4 text-coolGray-800">Mark Attendance</h2>

            {loading ? (
                <div className="text-coolGray-500 flex items-center gap-2">
                    <Loader2Icon className="animate-spin" size={18} /> Checking session...
                </div>
            ) : error ? (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md flex items-center gap-2">
                    <AlertCircleIcon size={16} />
                    <span>{error}</span>
                </div>
            ) : session ? (
                <div className="space-y-4">
                    <div className="text-coolGray-700">
                        <p><strong>Course ID:</strong> {session.course_id}</p>
                        <p>
                            <strong>Time:</strong>{" "}
                            {new Date(session.start_time).toLocaleTimeString()} –{" "}
                            {new Date(session.end_time).toLocaleTimeString()}
                        </p>
                    </div>

                    <button
                        disabled={isMarked || marking}
                        onClick={handleMark}
                        className={`px-4 py-2 text-white rounded-lg transition ${
                            isMarked
                                ? "bg-green-400 cursor-not-allowed"
                                : "bg-lime-600 hover:bg-lime-700"
                        }`}
                    >
                        {marking ? (
                            <span className="flex items-center gap-2">
                <Loader2Icon className="animate-spin" size={16} />
                Marking...
              </span>
                        ) : isMarked ? (
                            <span className="flex items-center gap-2">
                <CheckCircleIcon size={16} />
                Attendance marked
              </span>
                        ) : (
                            "Mark Attendance"
                        )}
                    </button>
                </div>
            ) : (
                <p className="text-coolGray-500">No active class session right now.</p>
            )}
        </div>
    );
}