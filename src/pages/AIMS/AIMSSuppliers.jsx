import Layout from "../../components/layouts/DashboardLayout";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";

export default function AIMSSuppliers() {
  const { permissions } = useAuth();
  const queryClient     = useQueryClient();

  const canCreate = can(permissions, "aims.suppliers.create");
  const canUpdate = can(permissions, "aims.suppliers.update");
  const canDelete = can(permissions, "aims.suppliers.delete");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", contact_person: "", email: "", phone: "", address: "" });

  // ── Suppliers — reuses aims_suppliers cache shared with AddItem + RequestOrderCreate ──
  const cacheKey = ["aims_suppliers"];
  const { data: suppliers = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/aims/suppliers").then((r) => r.data?.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await baseApi.put(`/api/aims/suppliers/${editingId}`, form);
        Swal.fire("Updated", "Supplier updated successfully", "success");
      } else {
        await baseApi.post("/api/aims/suppliers", form);
        Swal.fire("Created", "Supplier added successfully", "success");
      }
      setForm({ name: "", contact_person: "", email: "", phone: "", address: "" });
      setEditingId(null);
      refetch();
    } catch {
      Swal.fire("Error", "Failed to save supplier", "error");
    }
  };

  const handleEdit = (supplier) => {
    setForm({ name: supplier.name, contact_person: supplier.contact_person, email: supplier.email, phone: supplier.phone, address: supplier.address });
    setEditingId(supplier.id);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete supplier?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, delete", confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/aims/suppliers/${id}`);
      Swal.fire("Deleted", "Supplier removed", "success");
      refetch();
    } catch {
      Swal.fire("Error", "Failed to delete supplier", "error");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", contact_person: "", email: "", phone: "", address: "" });
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3">
          <div className="col">
            <h1 className="fw-bold">Suppliers</h1>
            <p className="text-muted mb-0">Manage suppliers for procurement</p>
          </div>
        </div>

        {(canCreate || (editingId && canUpdate)) && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold">
              {editingId ? "Edit Supplier" : "Add Supplier"}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Supplier Name</label>
                  <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Contact Person</label>
                  <input className="form-control" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Address</label>
                  <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    <MdAdd className="me-1" />{editingId ? "Update Supplier" : "Add Supplier"}
                  </button>
                  {editingId && (
                    <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-header bg-white fw-semibold">Supplier List</div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th><th>Contact</th><th>Email</th><th>Phone</th>
                  {(canUpdate || canDelete) && <th width="120"></th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">Loading...</td></tr>
                ) : suppliers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No suppliers found</td></tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="fw-semibold">{supplier.name}</td>
                      <td>{supplier.contact_person || "—"}</td>
                      <td>{supplier.email || "—"}</td>
                      <td>{supplier.phone || "—"}</td>
                      {(canUpdate || canDelete) && (
                        <td className="text-end">
                          {canUpdate && (
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(supplier)}>
                              <MdEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(supplier.id)}>
                              <MdDelete />
                            </button>
                          )}
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
    </Layout>
  );
}
