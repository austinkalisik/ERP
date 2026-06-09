import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { getRoleHomePath } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { MdPersonAddDisabled } from "react-icons/md";

export default function Login() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading,    setIsLoading]    = useState(false);

  const handleLogin = async (event) => {
  event.preventDefault();
  setErrorMessage("");
  setIsLoading(true);

  try {
    
    await baseApi.get("/sanctum/csrf-cookie");

    
    await baseApi.post("/api/login", { email, password });

    
    const userData = await fetchUser();

    navigate(getRoleHomePath(userData?.role), { replace: true });

  } catch (error) {
    if (error.response?.status === 422) {
      setErrorMessage("Invalid email or password.");
    } else if (error.response?.status === 419) {
      setErrorMessage("Session expired. Refresh and try again.");
    } else {
      setErrorMessage("Login failed.");
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div
      className="vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "#BDE8F5" }}
    >
      <div
        className="card shadow-lg border-0"
        style={{ maxWidth: "900px", width: "100%", borderRadius: "10px" }}
      >
        <div className="row g-0">
          {/* Left – Branding */}
          <div
            className="col-md-5 d-none d-md-flex align-items-center justify-content-center text-white rounded-start"
            style={{ backgroundColor: "#0F2854" }}
          >
            <div className="text-center px-4">
              <h2 className="fw-bold mb-3">ERP System</h2>
              <p className="opacity-75">
                Secure and centralized platform for managing your organization.
              </p>
            </div>
          </div>

          {/* Right – Login Form */}
          <div className="col-md-7">
            <div className="card-body p-5">
              <h4
                className="text-center fw-semibold mb-4"
                style={{ color: "#1C4D8D" }}
              >
                Sign In
              </h4>

              {errorMessage && (
                <div className="alert alert-danger py-2" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-medium">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-100"
                  disabled={isLoading}
                  style={{ backgroundColor: "#1C4D8D", color: "#fff" }}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="text-center mt-4 mb-0" style={{ fontSize: "0.9rem" }}>
                © {new Date().getFullYear()} ERP System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}