import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function StudentOverview() {
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error("❌ Failed to get user", userError);
                setError("User not found");
                return;
            }

            const { data: student, error: studentError } = await supabase
                .from("students")
                .select("id, full_name, registration_number")
                .eq("id", user.id)
                .single();

            if (studentError || !student) {
                console.error("❌ Error fetching student:", studentError);
                setError("Student not found");
                return;
            }

            const studentId = student.id;

            const [{ data: enrollments }, { data: attendance }] = await Promise.all([
                supabase.from("enrollments").select("course_id").eq("student_id", studentId),
                supabase.from("attendance").select("id, verified").eq("student_id", studentId),
            ]);

            const courseIds = enrollments.map((e) => e.course_id);
            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("id, name")
                .in("id", courseIds);

            if (courseError) {
                console.error("❌ Error fetching courses:", courseError);
            }

            const totalSessions = attendance.length;
            const verifiedCount = attendance.filter((a) => a.verified).length;
            const attendanceRate =
                totalSessions === 0 ? 0 : Math.round((verifiedCount / totalSessions) * 100);

            setStats({
                fullName: student.full_name,
                regNo: student.registration_number,
                courseCount: courseIds.length,
                attendanceCount: verifiedCount,
                totalSessions,
                attendanceRate,
            });

            setCourses(courseData || []);
            setLoading(false);
        };

        fetchData();
    }, []);

    return (
        <section className="max-w-6xl mx-auto px-4 py-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                🎓 Student Dashboard
            </h2>

            {loading ? (
                <p className="text-gray-500">Loading data...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-blue-100 rounded-md shadow">
                            <p className="text-sm text-gray-600">Full Name</p>
                            <p className="text-lg font-semibold text-gray-800">{stats.fullName}</p>
                        </div>
                        <div className="p-4 bg-green-100 rounded-md shadow">
                            <p className="text-sm text-gray-600">Registration No.</p>
                            <p className="text-lg font-semibold text-gray-800">{stats.regNo}</p>
                        </div>
                        <div className="p-4 bg-yellow-100 rounded-md shadow">
                            <p className="text-sm text-gray-600">Courses Enrolled</p>
                            <p className="text-lg font-semibold text-gray-800">{stats.courseCount}</p>
                        </div>
                        <div className="p-4 bg-purple-100 rounded-md shadow">
                            <p className="text-sm text-gray-600">Attendance Rate</p>
                            <p className="text-lg font-semibold text-gray-800">
                                {stats.attendanceRate}%
                            </p>
                        </div>
                    </div>

                    {/* Course List */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            📚 Your Enrolled Courses
                        </h3>

                        {courses.length === 0 ? (
                            <p className="text-gray-500">
                                You are not enrolled in any courses yet.
                            </p>
                        ) : (
                            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {courses.map((course) => (
                                    <li
                                        key={course.id}
                                        className="p-4 border border-gray-200 rounded-md bg-gray-50 text-gray-800"
                                    >
                                        {course.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
