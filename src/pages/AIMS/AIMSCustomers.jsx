import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { MdSearch, MdAdd, MdEdit, MdDelete, MdPerson } from "react-icons/md";

export default function AIMSCustomers() {
  const navigate     = useNavigate();
  const { permissions } = useAuth();
  const queryClient  = useQueryClient();

  const canCreate = can(permissions, "aims.inventory.create");
  const canUpdate = can(permissions, "aims.inventory.update");
  const canDelete = can(permissions, "aims.inventory.delete");

  const [search,           setSearch]           = useState("");
  const [showModal,        setShowModal]        = useState(false);
  const [editMode,         setEditMode]         = useState(false);
  const [currentCustomer,  setCurrentCustomer]  = useState({ id: null, name: "", email: "", phone: "", address: "" });

  // ── Customers — cached 5 min ─────────────────────────────────────────────
  const cacheKey = ["aims_customers"];
  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/aims/customers").then((r) => r.data?.data || r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  // Client-side filter — no extra network requests on search
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const keyword = search.toLowerCase();
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(keyword) ||
      c.email?.toLowerCase().includes(keyword) ||
      c.phone?.toLowerCase().includes(keyword)
    );
  }, [search, customers]);

  const openAddModal  = () => { setEditMode(false); setCurrentCustomer({ id: null, name: "", email: "", phone: "", address: "" }); setShowModal(true); };
  const openEditModal = (customer) => { setEditMode(true); setCurrentCustomer(customer); setShowModal(true); };
  const closeModal    = () => { setShowModal(false); setCurrentCustomer({ id: null, name: "", email: "", phone: "", address: "" }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentCustomer.name.trim()) return Swal.fire("Error", "Customer name is required", "error");
    try {
      if (editMode) {
        await baseApi.put(`/api/aims/customers/${currentCustomer.id}`, currentCustomer);
        Swal.fire("Success", "Customer updated", "success");
      } else {
        await baseApi.post("/api/aims/customers", currentCustomer);
        Swal.fire("Success", "Customer added", "success");
      }
      closeModal();
      refetch();
    } catch { Swal.fire("Error", "Failed to save customer", "error"); }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Customer?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/aims/customers/${id}`);
      Swal.fire("Deleted", "Customer removed", "success");
      refetch();
    } catch { Swal.fire("Error", "Failed to delete customer", "error"); }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">Customers</h1>
            <p className="text-muted mb-0">Manage customer information for sales orders</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-danger" onClick={() => navigate("/aims")}>Close</button>
          </div>
        </div>

        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-white"><MdSearch /></span>
                  <input className="form-control" placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              {canCreate && (
                <div className="col-12 col-md-6 text-end">
                  <button className="btn btn-primary" onClick={openAddModal}>
                    <MdAdd className="me-1" /> Add Customer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Address</th>
                  {(canUpdate || canDelete) && <th className="text-center" style={{ width: "120px" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-4">Loading customers...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-muted py-4">No customers found</td></tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="fw-semibold"><MdPerson className="me-2 text-primary" />{customer.name}</td>
                      <td>{customer.email || "-"}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>{customer.address || "-"}</td>
                      {(canUpdate || canDelete) && (
                        <td className="text-center">
                          {canUpdate && <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditModal(customer)}><MdEdit /></button>}
                          {canDelete && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(customer.id)}><MdDelete /></button>}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <CustomerModal editMode={editMode} customer={currentCustomer} onChange={setCurrentCustomer} onSubmit={handleSubmit} onClose={closeModal} />
      )}
    </Layout>
  );
}

function CustomerModal({ editMode, customer, onChange, onSubmit, onClose }) {
  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">{editMode ? "Edit Customer" : "Add New Customer"}</h5>
            </div>
            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Customer Name <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" required value={customer.name} onChange={(e) => onChange({ ...customer, name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={customer.email} onChange={(e) => onChange({ ...customer, email: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={customer.phone} onChange={(e) => onChange({ ...customer, phone: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows="3" value={customer.address} onChange={(e) => onChange({ ...customer, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-danger" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editMode ? "Update" : "Add"} Customer</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}