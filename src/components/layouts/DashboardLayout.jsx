import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown, Modal, Button, Navbar, Container, Nav } from "react-bootstrap";

import Sidebar from "./Sidebar";
import Breadcrumb from "../Breadcrumb";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../../contexts/AuthContext";
import baseApi from "../../api/baseApi";

export default function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const [sidebarOpen,     setSidebarOpen]     = useState(false);
    const [isMobile,        setIsMobile]        = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setSidebarOpen(mobile);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!loading && !user) navigate("/login", { replace: true });
    }, [loading, user, navigate]);

    if (loading || !user) return null;

    const getInitials = (name = "") => {
        const parts = name.trim().split(" ").filter(Boolean);
        if (parts.length === 0) return "";
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const handleLogout = async () => {
        try { await baseApi.post("/logout"); }
        catch (e) { console.error("Logout error:", e); }
        finally { navigate("/login", { replace: true }); }
    };

    // FIXED: Show bell for ALL authenticated users — notifications now cover
    // HRMS (applications, new employees), AIMS (low stock, PRs),
    // MOMS (maintenance, assignments), and Payroll (payslips, cash advances).
    // Every role can receive at least one type of notification.
    const showBell = !!user;

    const sidebarCollapsedW = "72px";
    const sidebarExpandedW  = "240px";
    const marginLeft = isMobile
        ? sidebarCollapsedW
        : sidebarOpen ? sidebarCollapsedW : sidebarExpandedW;

    return (
        <div className="d-flex min-vh-100" style={{ backgroundColor: "#f4f6f9", overflow: "hidden" }}>

            {/* SIDEBAR */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} />

            {/* MAIN AREA */}
            <div
                className="d-flex flex-column flex-grow-1"
                style={{
                    marginLeft,
                    transition: "margin-left 0.3s ease",
                    minWidth: 0,
                    width: 0,
                    backgroundColor: "#f4f6f9",
                }}
            >
                {/* TOP NAVBAR */}
                <Navbar
                    className="border-bottom px-3 flex-shrink-0"
                    style={{ backgroundColor: "#ffffff", zIndex: 100 }}
                >
                    <Container fluid className="px-0">
                        <Nav className="ms-auto align-items-center gap-2">

                            {/* Bell icon — shown for all authenticated users */}
                            {showBell && <NotificationBell />}

                            {/* User dropdown */}
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    variant="light"
                                    className="d-flex align-items-center gap-2 border-0 shadow-none"
                                    style={{ backgroundColor: "transparent" }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        backgroundColor: "#0c2c55", color: "#fff",
                                        fontSize: 14, fontWeight: 600,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {getInitials(user.name)}
                                    </div>
                                    <span className="fw-medium d-none d-sm-inline">{user.name}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-sm">
                                    <Dropdown.Item onClick={() => navigate("/profile")}>Profile</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => setShowLogoutModal(true)}>Logout</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Container>
                </Navbar>

                {/* PAGE CONTENT */}
                <main
                    className="flex-grow-1"
                    style={{
                        overflowY: "auto",
                        overflowX: "hidden",
                        backgroundColor: "#f4f6f9",
                        padding: "16px 12px",
                    }}
                >
                    <Breadcrumb />
                    {children}
                </main>
            </div>

            {/* LOGOUT MODAL */}
            <Modal
                show={showLogoutModal}
                onHide={() => setShowLogoutModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="w-100 text-center fw-semibold">
                        Sign out of your account?
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center px-4">
                    <div
                        className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                        style={{
                            width: 52, height: 52, borderRadius: "50%",
                            backgroundColor: "#fdecea", color: "#b02a37",
                            fontWeight: 700, fontSize: 18,
                        }}
                    >
                        !
                    </div>
                    <p className="mb-1">You'll be signed out and need to log in again to continue.</p>
                    <p className="text-muted small mb-0">
                        Currently signed in as <strong>{user.name}</strong>
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center gap-2 pb-4">
                    <Button
                        onClick={() => setShowLogoutModal(false)}
                        style={{ backgroundColor: "#0c2c55", borderColor: "#0c2c55" }}
                    >
                        Stay Logged In
                    </Button>
                    <Button variant="danger" onClick={handleLogout}>Sign Out</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}