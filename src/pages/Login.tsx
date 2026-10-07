import { type FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login({ email, password });
            navigate("/dashboard");
        } catch (error: any) {
            setError(
                error?.response?.data?.message ||
                error?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        // position: fixed + inset: 0 -> phủ kín màn hình, không phụ thuộc body/#root
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                overflowY: "auto",
                background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                zIndex: 300,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 400,
                    margin: "auto",
                }}
                className="rounded-2xl bg-white px-8 py-9 shadow-2xl"
            >
                <div className="mb-7 text-center">
                    <h1 className="mb-1.5 text-2xl font-bold text-gray-900">
                        Welcome back
                    </h1>
                    <p className="text-sm text-gray-500">Đăng nhập vào trang quản trị</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                            Mật khẩu
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/20"
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 rounded-lg bg-indigo-500 py-3 text-[15px] font-semibold text-white transition hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500">
                    Chưa có tài khoản?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;