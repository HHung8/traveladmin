import { createContext, ReactNode, useState, useEffect, useContext, useCallback } from "react";
import { loginApi, LoginRequest, refreshTokenApi, registerApi, RegisterRequest, User, AuthData } from "../api";
import { api } from "../api/client";

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
    
    const saveAuth = (data: AuthData) => {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiresAt", data.expiresAt);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const clearAuth = useCallback(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresAt");
        localStorage.removeItem("user");
        setUser(null);
    }, []);

    useEffect(() => {
        const restoreAuth = async () => {
            try {
                const accessToken = localStorage.getItem("accessToken");
                const refreshToken = localStorage.getItem("refreshToken");
                const storedUser = localStorage.getItem("user");
                const expiresAt = localStorage.getItem("expiresAt");

                if(accessToken && storedUser) {
                    const expirationTime = expiresAt ? Date.parse(expiresAt) : NaN;
                    if(Number.isFinite(expirationTime) && expirationTime > Date.now()) {
                        setUser(JSON.parse(storedUser));
                    } else {
                        clearAuth();
                    }
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
    }, [clearAuth]);

    useEffect(() => {
        const interceptorId = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if(error.response?.status === 401) {
                    clearAuth();
                }
                return Promise.reject(error);
            }
        );

        return () => api.interceptors.response.eject(interceptorId);
    }, [clearAuth]);

    useEffect(() => {
        if(!user) return;

        const expiresAt = localStorage.getItem("expiresAt");
        const expirationTime = expiresAt ? Date.parse(expiresAt) : NaN;
        const delay = Number.isFinite(expirationTime)
            ? Math.max(0, expirationTime - Date.now())
            : 0;
        const timeoutId = window.setTimeout(clearAuth, delay);
        return () => window.clearTimeout(timeoutId);
    }, [user, clearAuth]);

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