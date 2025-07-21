import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function CourseCard({ course, onTabChange }) {
    const [studentCount, setStudentCount] = useState(0);
    const [nextSession, setNextSession] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const [{ count: enrolledCount }, { data: sessions }] = await Promise.all([
            supabase
                .from("enrollments")
                .select("id", { count: "exact", head: true })
                .eq("course_id", course.id),

            supabase
                .from("class_sessions")
                .select("start_time")
                .eq("course_id", course.id)
                .gt("start_time", new Date().toISOString())
                .order("start_time", { ascending: true })
                .limit(1),
        ]);

        setStudentCount(enrolledCount || 0);
        setNextSession(sessions?.[0] || null);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{course.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{course.code}</p>

                <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">{studentCount}</span> enrolled students
                </div>

                {nextSession ? (
                    <div className="text-sm text-green-600">
                        Next session:{" "}
                        <span className="font-medium">
                            {new Date(nextSession.start_time).toLocaleString()}
                        </span>
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 italic">No upcoming sessions</div>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    onClick={() => onTabChange("enroll", course.id)}
                    className="text-sm bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    Enroll
                </button>
                <button
                    onClick={() => onTabChange("sessions", course.id)}
                    className="text-sm bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                    Sessions
                </button>
                <button
                    onClick={() => onTabChange("form", course.id)}
                    className="col-span-2 text-sm bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
                >
                    Edit Course
                </button>
            </div>
        </div>
    );
}
