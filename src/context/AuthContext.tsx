import { createContext, ReactNode, useState, useEffect, useContext } from "react";
import { loginApi, LoginRequest, refreshTokenApi, registerApi, RegisterRequest, User } from "../api";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login:(data: LoginRequest) => Promise<void>;
    register:(data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface Props {
    children: ReactNode;
}

export const AuthProvider = ({children}: Props) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const isAuthenticated = !!user;
    
    const saveAuth = (data: any) => {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiresAt", data.expiresAt);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    useEffect(() => {
        const restoreAuth = async () => {
            try {
                const accessToken = localStorage.getItem("accessToken");
                const refreshToken = localStorage.getItem("refreshToken");
                const storedUser = localStorage.getItem("user");

                if(accessToken && storedUser) {
                    setUser(JSON.parse(storedUser));
                    setLoading(false);
                    return;
                }

                if(refreshToken) {
                    const response = await refreshTokenApi(refreshToken);
                    if(response.success) {saveAuth(response.data);}
                }
            } catch (error) {
                console.error("Error restoring auth:", error);
                clearAuth();
            } finally {
                setLoading(false);
            }
        };
        restoreAuth();
    }, []);

    const login = async(data: LoginRequest) => {
        const response = await loginApi(data);
        if(!response.success) {
            throw new Error(response.message);
        }
        saveAuth(response.data);
    }

    const register = async(data: RegisterRequest) => {
        const response = await registerApi(data);
        if(!response.success) {
            throw new Error(response.message || "Registration failed");
        }
        saveAuth(response.data);
    }

    const clearAuth = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresAt");
        localStorage.removeItem("user");
        setUser(null);
    };

    const logout = async () => {
        try {
            await loginApi;
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            clearAuth();
        }
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}