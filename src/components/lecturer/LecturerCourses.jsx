import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase"; // adjust path as needed
import CourseForm from "./CourseForm";
import EnrollStudents from "./EnrollStudents";
import ManageSessions from "./ManageSessions";
import CourseCard from "./CourseCard";

export default function LecturerCourses() {
    const [activeTab, setActiveTab] = useState("list");
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [lecturerId, setLecturerId] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        const {
            data: { user },
            error: userErr,
        } = await supabase.auth.getUser();

        if (userErr || !user) {
            console.error("User not authenticated", userErr);
            return;
        }

        const { data: lecturer, error: lecErr } = await supabase
            .from("lecturers")
            .select("id")
            .eq("id", user.id) // matches `id` from auth to `lecturers.id`
            .single();

        if (lecErr || !lecturer) {
            console.error("Lecturer not found", lecErr);
            return;
        }

        setLecturerId(lecturer.id);

        const { data: coursesData, error: coursesErr } = await supabase
            .from("courses")
            .select("id, name, code")
            .eq("lecturer_id", lecturer.id);

        if (coursesErr) {
            console.error("Failed to fetch courses", coursesErr);
        } else {
            setCourses(coursesData || []);
        }
    };

    const tabClasses = (tab) =>
        `nav-tab py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === tab
                ? "border-green-500 text-green-600"
                : "border-transparent text-coolGray-500 hover:text-coolGray-700"
        }`;

    return (
        <div className="">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="mb-4 text-2xl md:text-4xl font-bold tracking-tighter text-darkCoolGray-900">
                        Lecturer Courses Management
                    </h2>
                    <p className="text-base text-coolGray-600">
                        Manage your courses, enroll students, and organize class sessions
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-8 border-b border-coolGray-200">
                    <nav className="flex flex-wrap gap-4 sm:gap-8">
                        <button className={tabClasses("list")} onClick={() => setActiveTab("list")}>
                            Course List
                        </button>
                        <button className={tabClasses("form")} onClick={() => setActiveTab("form")}>
                            Add/Edit Course
                        </button>
                        <button className={tabClasses("enroll")} onClick={() => setActiveTab("enroll")}>
                            Enroll Students
                        </button>
                        <button className={tabClasses("sessions")} onClick={() => setActiveTab("sessions")}>
                            Manage Sessions
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-2">
                    {activeTab === "list" && (
                        <div className="bg-white border rounded-lg shadow-sm p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <h4 className="text-lg md:text-2xl font-bold tracking-tighter text-darkCoolGray-900">
                                    My Courses
                                </h4>
                                <button
                                    onClick={() => setActiveTab("form")}
                                    className="py-3 px-6 text-lg bg-green-500 text-white hover:bg-green-600 rounded-md shadow-sm w-full sm:w-auto"
                                >
                                    Add New Course
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                                {courses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        onTabChange={(tab, courseId) => {
                                            setSelectedCourseId(courseId);
                                            setActiveTab(tab);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "form" && <CourseForm courseId={selectedCourseId} lecturerId={lecturerId} />}
                    {activeTab === "enroll" && <EnrollStudents courseId={selectedCourseId} />}
                    {activeTab === "sessions" && <ManageSessions courseId={selectedCourseId} />}
                </div>
            </div>
        </div>
    );
}
