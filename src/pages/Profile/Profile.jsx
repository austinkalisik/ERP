import { useState, useEffect } from "react";
import Layout from "../../components/layouts/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import baseApi from "../../api/baseApi";
import { Form, Button, Card } from "react-bootstrap";

export default function Profile() {
  const { user, role, refreshUser } = useAuth();
  const [loading,        setLoading]        = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage,   setErrorMessage]   = useState("");

  // Only system_admin can edit name/email
  const isAdmin = role === "system_admin";

  // ── Profile form — pre-filled from AuthContext (already in memory, no fetch) ──
  const [profileData, setProfileData] = useState({ name: "", email: "" });

  useEffect(() => {
    if (user) setProfileData({ name: user.name || "", email: user.email || "" });
  }, [user]);

  // ── Password form — pure local state, no reads involved ──────────────────
  const [passwordData, setPasswordData] = useState({
    current_password: "", new_password: "", confirm_password: "",
  });

  const flash = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(""), 3000);
  };

  const handleProfileChange  = (e) => setProfileData((p)  => ({ ...p,  [e.target.name]: e.target.value }));
  const handlePasswordChange = (e) => setPasswordData((p) => ({ ...p,  [e.target.name]: e.target.value }));

  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setSuccessMessage(""); setErrorMessage("");
    try {
      await baseApi.put("/api/profile", profileData);
      if (typeof refreshUser === "function") await refreshUser();
      flash(setSuccessMessage, "Profile updated successfully!");
    } catch (error) {
      flash(setErrorMessage, error.response?.data?.message || "Failed to update profile. Please try again.");
    } finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      flash(setErrorMessage, "New password and confirm password do not match."); return;
    }
    if (passwordData.new_password.length < 8) {
      flash(setErrorMessage, "New password must be at least 8 characters long."); return;
    }
    setLoading(true); setSuccessMessage(""); setErrorMessage("");
    try {
      await baseApi.put("/api/profile/password", {
        current_password: passwordData.current_password,
        new_password:     passwordData.new_password,
      });
      flash(setSuccessMessage, "Password updated successfully!");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      flash(setErrorMessage,
        error.response?.data?.message ||
        error.response?.data?.errors?.current_password?.[0] ||
        "Failed to update password. Please try again."
      );
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: "900px" }}>
        <h1 className="mb-4" style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>
          Profile Settings
        </h1>

        {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}
        {errorMessage   && <div className="alert alert-danger"  role="alert">{errorMessage}</div>}

        {/* Profile Information */}
        <Card className="shadow-sm mb-4" style={{ borderRadius: "12px" }}>
          <Card.Body className="p-4">
            <h5 className="mb-2" style={{ fontWeight: "600" }}>Profile Information</h5>
            <p className="text-muted mb-4" style={{ fontSize: "14px" }}>
              {isAdmin
                ? "Update your account's profile information and email address."
                : "View your account information. Contact your administrator to make changes."}
            </p>
            <Form onSubmit={handleProfileSubmit}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>Name</Form.Label>
                <Form.Control
                  type="text" name="name" value={profileData.name} onChange={handleProfileChange}
                  disabled={!isAdmin} readOnly={!isAdmin} required
                  style={{ borderRadius: "8px", backgroundColor: !isAdmin ? "#f8f9fa" : "white", cursor: !isAdmin ? "not-allowed" : "text" }}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label style={{ fontWeight: "500" }}>Email</Form.Label>
                <Form.Control
                  type="email" name="email" value={profileData.email} onChange={handleProfileChange}
                  disabled={!isAdmin} readOnly={!isAdmin} required
                  style={{ borderRadius: "8px", backgroundColor: !isAdmin ? "#f8f9fa" : "white", cursor: !isAdmin ? "not-allowed" : "text" }}
                />
              </Form.Group>
              {isAdmin && (
                <Button variant="primary" type="submit" disabled={loading} style={{ borderRadius: "8px" }}>
                  {loading ? "Saving..." : "SAVE"}
                </Button>
              )}
              {!isAdmin && (
                <div className="alert alert-info mb-0" style={{ fontSize: "14px" }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Only system administrators can update name and email. Please contact your admin to make changes.
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>

        {/* Update Password */}
        <Card className="shadow-sm" style={{ borderRadius: "12px" }}>
          <Card.Body className="p-4">
            <h5 className="mb-2" style={{ fontWeight: "600" }}>Update Password</h5>
            <p className="text-muted mb-4" style={{ fontSize: "14px" }}>
              Ensure your account is using a long, random password to stay secure.
            </p>
            <Form onSubmit={handlePasswordSubmit}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>Current Password</Form.Label>
                <Form.Control type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required style={{ borderRadius: "8px" }} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>New Password</Form.Label>
                <Form.Control type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required style={{ borderRadius: "8px" }} />
                <Form.Text className="text-muted">Password must be at least 8 characters long</Form.Text>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label style={{ fontWeight: "500" }}>Confirm Password</Form.Label>
                <Form.Control type="password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required style={{ borderRadius: "8px" }} />
              </Form.Group>
              <Button variant="primary" type="submit" disabled={loading} style={{ borderRadius: "8px" }}>
                {loading ? "Updating..." : "SAVE"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}