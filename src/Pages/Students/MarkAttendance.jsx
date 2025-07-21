import { useEffect, useRef, useState } from "react";

import { supabase } from "../../services/supabase";
import {
    CheckCircleIcon,
    Loader2Icon,
    AlertCircleIcon,
    ExternalLinkIcon,
    Undo2Icon,
    PenLineIcon,
} from "lucide-react";
const { SignatureCanvas } = require('react-signature-canvas');

export default function MarkAttendance() {
    const [studentId, setStudentId] = useState(null);
    const [session, setSession] = useState(null);
    const [isMarked, setIsMarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [hasVisitedLink, setHasVisitedLink] = useState(false);
    const [error, setError] = useState(null);
    const sigPadRef = useRef();


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
                    .eq("id", user.id)
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

    useEffect(() => {
        if (!studentId) return;

        const fetchSession = async () => {
            try {
                setLoading(true);
                setError(null);

                const now = new Date();
                const nowUtc = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();

                const { data: enrolledCourses, error: enrollErr } = await supabase
                    .from("enrollments")
                    .select("course_id")
                    .eq("student_id", studentId);

                if (enrollErr) throw new Error("Failed to fetch enrollments");

                const courseIds = enrolledCourses.map((e) => e.course_id);

                const { data: sessions, error: sessionErr } = await supabase
                    .from("class_sessions")
                    .select("*")
                    .lte("start_time", nowUtc)
                    .gte("end_time", nowUtc)
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

    const handleVisitLink = () => {
        if (session?.meeting_link) {
            window.open(session.meeting_link, "_blank");
            setHasVisitedLink(true);
        }
    };

    const handleMark = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessions = sessionData?.session;

        const token = sessions?.access_token;
        if (!token) throw new Error("User not logged in");
        if (!sessions || !studentId || !sigPadRef.current || sigPadRef.current.isEmpty()) {
            setError("Please provide a signature before submitting.");
            return;
        }

        try {
            setMarking(true);
            setError(null);

            const base64 = sigPadRef.current.getTrimmedCanvas().toDataURL("image/png");
            const base64Data = base64.split(",")[1];

            const binary = atob(base64Data);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([array], { type: "image/png" });

            const filePath = `student-${studentId}-${Date.now()}.png`;

            const { error: uploadErr } = await supabase.storage
                .from("signatures")
                .upload(filePath, blob, {
                    contentType: "image/png",
                });

            if (uploadErr) throw new Error("Signature upload failed");

            const { data: publicUrlData } = supabase.storage
                .from("signatures")
                .getPublicUrl(filePath);

            const signature_url = publicUrlData.publicUrl;

            const payload = {
                session_id: session.id,
                student_id: studentId,
                timestamp: new Date().toISOString(),
                signature_url,
            };

            const encoded = btoa(JSON.stringify(payload));

            const response = await fetch("https://ycsqswlldpzuspadjerc.supabase.co/functions/v1/mark-attendance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...payload,
                    signature: encoded
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to mark attendance.");
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
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-xl shadow space-y-5">
            <h2 className="text-2xl font-bold text-coolGray-800">Mark Attendance</h2>

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
                <>
                    <div className="space-y-2 text-coolGray-700">
                        <p><strong>Title:</strong> {session.session_title}</p>
                        <p><strong>Time:</strong> {new Date(session.start_time).toLocaleTimeString()} – {new Date(session.end_time).toLocaleTimeString()}</p>
                    </div>

                    <button
                        onClick={handleVisitLink}
                        className="flex items-center gap-2 text-sm px-4 py-2 text-lime-700 border border-lime-600 rounded hover:bg-lime-50"
                    >
                        <ExternalLinkIcon size={16} /> Join Class
                    </button>

                    <div>
                        <label className="block text-sm font-semibold mb-1 text-coolGray-700">Signature:</label>
                        <div className="border rounded-md shadow">
                            <SignatureCanvas
                                ref={sigPadRef}
                                penColor="black"
                                canvasProps={{ width: 500, height: 150, className: "rounded-md bg-white" }}
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => sigPadRef.current.clear()}
                                className="text-xs text-gray-600 flex items-center gap-1 hover:text-red-500"
                            >
                                <Undo2Icon size={14} /> Clear Signature
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={isMarked || marking || !hasVisitedLink}
                        onClick={handleMark}
                        className={`w-full px-4 py-2 text-white text-sm rounded-lg transition ${
                            isMarked
                                ? "bg-green-400 cursor-not-allowed"
                                : !hasVisitedLink
                                    ? "bg-coolGray-300 cursor-not-allowed"
                                    : "bg-lime-600 hover:bg-lime-700"
                        }`}
                    >
                        {marking ? (
                            <span className="flex items-center gap-2">
                <Loader2Icon className="animate-spin" size={16} /> Marking...
              </span>
                        ) : isMarked ? (
                            <span className="flex items-center gap-2">
                <CheckCircleIcon size={16} /> Attendance marked
              </span>
                        ) : (
                            <span className="flex items-center gap-2">
                <PenLineIcon size={16} /> Mark Attendance
              </span>
                        )}
                    </button>
                </>
            ) : (
                <p className="text-coolGray-500">No active class session right now.</p>
            )}
        </div>
    );
}
