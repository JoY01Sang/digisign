import { useState } from "react";
import { supabase } from "../../services/supabase";

export default function CourseForm({ onCourseCreated }) {
    const [form, setForm] = useState({ name: "", code: "" });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Get lecturer_id from logged-in user
        const { data: lecturer, error: lecturerError } = await supabase
            .from("lecturers")
            .select("id")
            .eq("id", user.id)
            .single();


        if (lecturerError || !lecturer) {
            setErrorMsg("You are not registered as a lecturer.");
            setLoading(false);
            return;
        }


        const { error } = await supabase.from("courses").insert({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            lecturer_id: lecturer.id,
        });

        if (error) {
            setErrorMsg("Course creation failed. Code might already exist.");
        } else {
            setSuccessMsg("Course created successfully.");
            setForm({ name: "", code: "" });
            onCourseCreated?.();
        }

        setLoading(false);
    };

    return (
        <div className="bg-white border rounded-lg shadow-sm p-6">
            <h4 className="text-lg md:text-2xl font-bold mb-6 text-darkCoolGray-900">
                Add New Course
            </h4>

            {errorMsg && <p className="mb-4 text-red-600 text-sm">{errorMsg}</p>}
            {successMsg && <p className="mb-4 text-green-600 text-sm">{successMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 font-medium text-coolGray-800">
                            Course Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={form.name}
                            onChange={handleChange}
                            className="w-full py-3 px-4 border border-coolGray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none shadow-sm"
                            placeholder="e.g., Machine Learning"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 font-medium text-coolGray-800">
                            Course Code
                        </label>
                        <input
                            type="text"
                            name="code"
                            required
                            value={form.code}
                            onChange={handleChange}
                            className="w-full py-3 px-4 border border-coolGray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none shadow-sm"
                            placeholder="e.g., ML202"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="py-3 px-7 text-lg bg-green-500 text-white font-medium rounded-md hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Course"}
                    </button>
                </div>
            </form>
        </div>
    );
}
