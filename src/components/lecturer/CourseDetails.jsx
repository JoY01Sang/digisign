export default function CourseDetails({ course, onBack }) {
    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{course.title}</h3>
                <button className="text-sm text-gray-500 hover:underline" onClick={onBack}>
                    ← Back to courses
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <EnrollStudents courseId={course.id} />
                <ManageSessions courseId={course.id} />
                <ViewEnrolledStudents courseId={course.id} />
            </div>
        </div>
    );
}