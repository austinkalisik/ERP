import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";

export default function AIMSViewPurchaseRequest() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const queryClient = useQueryClient();

  const canCreate  = can(permissions, "aims.purchase_orders.create");
  const canApprove = can(permissions, "aims.purchase_orders.approve");

  // ── Single purchase request — cached 2 min per ID ────────────────────────
  const cacheKey = ["aims_purchase_request", id];
  const { data: pr, isLoading: loading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get(`/api/aims/purchase-requests/${id}`).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
    enabled:  !!id,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const approve = async () => {
    try {
      await baseApi.post(`/api/aims/purchase-requests/${id}/approve`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["aims_purchase_requests"] });
    } catch (err) {
      console.error("Approval failed", err);
    }
  };

  const reject = async () => {
    try {
      await baseApi.post(`/api/aims/purchase-requests/${id}/reject`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["aims_purchase_requests"] });
    } catch (err) {
      console.error("Rejection failed", err);
    }
  };

  if (loading) return <Layout><div className="container py-5 text-center">Loading...</div></Layout>;
  if (!pr)     return <Layout><div className="container py-5 text-center text-danger">Purchase Request not found</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold">{pr.pr_number}</h2>
            <p className="text-muted mb-0">Purchase Request Details</p>
          </div>
          <button className="btn btn-outline-danger" onClick={() => navigate("/aims/purchase-requests")}>Back</button>
        </div>

        <div className="card shadow-sm mb-3">
          <div className="card-body row g-3">
            <div className="col-md-4"><strong>Request Date</strong><div>{pr.request_date}</div></div>
            <div className="col-md-4"><strong>Requested By</strong><div>{pr.requester?.name ?? "—"}</div></div>
            <div className="col-md-4"><strong>Status</strong><div className="fw-semibold text-capitalize">{pr.status}</div></div>
          </div>
        </div>

        <div className="card shadow-sm mb-3">
          <div className="card-header fw-semibold">Requested Items</div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead className="table-light">
                <tr><th>Item</th><th>Quantity</th></tr>
              </thead>
              <tbody>
                {pr.items?.map((item) => (
                  <tr key={item.id}><td>{item.item?.name}</td><td>{item.quantity}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex gap-2 mb-4">
          {pr.status === "pending" && canApprove && (
            <>
              <button className="btn btn-success" onClick={approve}>Approve</button>
              <button className="btn btn-danger" onClick={reject}>Reject</button>
            </>
          )}
          {pr.status === "approved" && (!pr.request_orders || pr.request_orders.length === 0) && canCreate && (
            <button className="btn btn-primary" onClick={() => navigate(`/aims/request-orders/create?pr_id=${pr.id}`)}>
              Generate PO
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
