import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseApi from "../../api/baseApi";
import { useAuth, getRoleHomePath } from "../../contexts/AuthContext";
import PngClock from "../../components/PngClock";

export default function Login() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="enterprise-login">
      <div className="enterprise-login-card">
        <div className="row g-0">
          <div className="col-md-5 d-none d-md-flex enterprise-login-brand">
            <div>
              <div className="enterprise-mark">NG</div>
              <h2>NextGen ERP</h2>
            </div>
          </div>

          <div className="col-md-7">
            <div className="enterprise-login-body">
              <div className="enterprise-login-top">
                <div>
                  <h4>Sign in</h4>
                </div>
                <PngClock compact />
              </div>

              {errorMessage && (
                <div className="alert alert-danger py-2" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-medium">Email address</label>
                  <input
                    type="email"
                    className="form-control enterprise-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Password</label>
                  <input
                    type="password"
                    className="form-control enterprise-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn w-100 enterprise-submit" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
