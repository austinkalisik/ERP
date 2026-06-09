import { useState, useEffect } from "react";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";

export default function GLAccounts() {

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
   const [parents, setParents] = useState([]);
    const [editingAccountId, setEditingAccountId] = useState(''); // Track editing

  const [formData, setFormData] = useState({
    gl_code: "",
    gl_name: "",
    gl_type: "",
    parent_gl: "",
    parent_gl_id: "",
    status: "ACTIVE",
    is_postable: false,
  });



  const accountTypes = [
    "Asset",
    "Liability",
    "Equity",
    "Revenue",
    "Expense"
  ];

  const statusOptions = [
    "ACTIVE",
    "INACTIVE"
  ];

    // Load parent accounts for dropdown
    useEffect(() => {
                baseApi.get("/api/aims/parents")
            .then(res => setParents(res.data))
            .catch(err => console.error(err));
    }, []);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await baseApi.get("/api/aims/gl-list");
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {


    if (editingAccountId) {
        // Update account
        await baseApi.put(`/api/aims/gl-accounts/${editingAccountId}`, formData);
        Swal.fire({
          icon: "success",
          title: "Account Updated",
          text: "GL Account successfully updated",
          timer: 2000,
          showConfirmButton: false
        });


            setShowModal(false);

      setFormData({
        gl_code: "",
        glname: "",
        gl_type: "", 
        parent_gl: "",
        status: "ACTIVE",
        is_postable: false,
      });
    

           fetchAccounts();

      } else {

      await baseApi.post("/api/aims/gl-accounts", formData);

      setShowModal(false);

      setFormData({
        gl_code: "",
        glname: "",
        gl_type: "", 
        parent_gl: "",
        status: "ACTIVE",
        is_postable: false,
      });
    

      fetchAccounts();

      Swal.fire({
        icon: "success",
        title: "Account Created",
        text: "GL Account successfully created",
        timer: 2000,
        showConfirmButton: false
      });
    }

    } catch (error) {

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to create account"
      });

    }
  };


    const handleEdit = (account) => {
    setEditingAccountId(account.id);
    setFormData({
      gl_code: account.gl_code,
      gl_name: account.gl_name,
      account_type: account.account_type,
      parent_gl_id: account.parent_gl_id || "",
      status: account.status,
      is_postable: account.is_postable,
    });
    setShowModal(true);
  };


  const handleDelete = async (id) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This GL Account will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, delete it!"
  });

  if (confirm.isConfirmed) {
    try {
      await baseApi.delete(`/api/aims/gl-accounts/${id}`);

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "GL Account deleted successfully",
        timer: 2000,
        showConfirmButton: false
      });

      fetchAccounts();

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to delete account"
      });
    }
  }
};

  return (
    <Layout>
      <div className="container-fluid px-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ fontWeight: "bold" }}>GL Accounts</h2>

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            Add Account
          </button>
        </div>

        {/* Table */}
        <div className="card shadow-sm">

          <div className="table-responsive">
            <table className="table table-hover mb-0">

              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th>Account Code</th>
                  <th>Account Name</th>
                  <th>Account Type</th>
                  <th>Parent</th>
                  <th>Status</th>
                   <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No GL Accounts found
                    </td>
                  </tr>
                ) : (

                  accounts.map((account) => (

                    <tr key={account.id}>

                      <td>{account.gl_code}</td>

                      <td>{account.gl_name}</td>

                      <td>{account.account_type}</td>

                      <td>
                      

                          {account.parent_gl_id
                            ? `${account.parent.gl_code} - ${account.parent.gl_name}`
                            : "-"}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            account.status === "Active"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {account.status}
                        </span>
                      </td>

                      <td>
                      <button className="btn btn-sm btn-warning me-2"
                                onClick={() => handleEdit(account)}
                            >
                                Edit
                            </button>

                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(account.id)}
                            >
                                Delete
                            </button>
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>
          </div>

        </div>
      </div>

    



 {/* Update Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setEditingAccountId(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingAccountId ? "Edit GL Account" : "Add GL Account"}</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Account Code *</Form.Label>
              <Form.Control
                name="gl_code"
                value={formData.gl_code}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Name *</Form.Label>
              <Form.Control
                name="gl_name"
                value={formData.gl_name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Type *</Form.Label>
              <Form.Select
                name="account_type"
                value={formData.account_type}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Type</option>
                {accountTypes.map(type => <option key={type}>{type}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Parent Account</Form.Label>
              <Form.Select
                name="parent_gl_id"
                value={formData.parent_gl_id}
                onChange={handleInputChange}
              >
                <option value="">-- None --</option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.gl_code} - {parent.gl_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map(status => <option key={status}>{status}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Is Postable"
                name="is_postable"
                checked={formData.is_postable}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingAccountId(null); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingAccountId ? "Update Account" : "Save Account"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </Layout>
  );
}