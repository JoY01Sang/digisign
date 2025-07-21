import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            const user = session?.user;

            if (sessionError) {
                console.error("Session fetch error:", sessionError.message);
                setLoading(false);
                return;
            }

            if (!user) {
                // No session exists, user is not logged in
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("User role fetch error:", error.message);
                setUser(null);
                setRole(null);
            } else {
                setUser(user);
                setRole(data.role);
            }

            setLoading(false);
        };

        fetchSession();

        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            if (session?.user) {
                fetchSession(); // trigger full refresh with new session
            } else {
                setUser(null);
                setRole(null);
                setLoading(false);
            }
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
