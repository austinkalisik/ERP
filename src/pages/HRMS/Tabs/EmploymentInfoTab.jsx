import { useQuery } from "@tanstack/react-query";
import baseApi from "../../../api/baseApi";
import SearchableSelect from "../../../components/SearchableSelect";

const fetchDepartments = () =>
  baseApi.get("/api/hrms/departments").then((r) => r.data?.data || r.data || []);

export default function EmploymentInfoTab({
  formData,
  handleInputChange,
  handleNext,
  loading,
  shifts = [],
  classifications = [],
}) {
  const { data: departments = [] } = useQuery({
    queryKey:        ["hrms_departments"],
    queryFn:         fetchDepartments,
    staleTime:       0,             
    refetchOnMount:  true,          
    refetchOnWindowFocus: false,    
  });

  const departmentOptions     = departments.map((d) => ({ value: String(d.id), label: d.name }));
  const shiftOptions          = shifts.map((s) => ({ value: String(s.id), label: `${s.shift_name} (${s.start_time} - ${s.end_time})` }));
  const classificationOptions = classifications.map((c) => ({ value: String(c.id), label: c.name }));

  const baseInputStyle = { borderRadius: "8px", padding: "10px", fontSize: "14px", width: "100%" };

  return (
    <div className="tab-content" style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* Row 1: Name */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>First Name:</label>
          <input type="text" name="first_name" className="form-control" value={formData.first_name} onChange={handleInputChange} placeholder="First Name" style={baseInputStyle} />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Middle Name:</label>
          <input type="text" name="middle_name" className="form-control" value={formData.middle_name} onChange={handleInputChange} placeholder="Middle Name" style={baseInputStyle} />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Last Name:</label>
          <input type="text" name="last_name" className="form-control" value={formData.last_name} onChange={handleInputChange} placeholder="Last Name" style={baseInputStyle} />
        </div>
      </div>

      {/* Row 2 */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Department:</label>
          <SearchableSelect
            options={departmentOptions}
            value={formData.department_id || ""}
            onChange={(v) => handleInputChange({ target: { name: "department_id", value: v } })}
            placeholder={departments.length === 0 ? "Loading..." : "Search department..."}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Position:</label>
          <input type="text" name="position" className="form-control" value={formData.position} onChange={handleInputChange} placeholder="Position" style={baseInputStyle} />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Department Head:</label>
          <input type="text" name="department_head" className="form-control" value={formData.department_head || ""} onChange={handleInputChange} placeholder="Department Head" style={baseInputStyle} />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Supervisor:</label>
          <input type="text" name="supervisor" className="form-control" value={formData.supervisor || ""} onChange={handleInputChange} placeholder="Supervisor" style={baseInputStyle} />
        </div>
      </div>

      {/* Row 3 */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Job Location:</label>
          <input type="text" name="job_location" className="form-control" value={formData.job_location} onChange={handleInputChange} placeholder="Job Location" style={baseInputStyle} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>Company Email:</label>
          <input type="email" name="company_email" className="form-control" value={formData.company_email} onChange={handleInputChange} placeholder="Company Email" style={baseInputStyle} />
        </div>
      </div>

      {/* Row 4 */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold">Employee Type:</label>
          <select name="employee_type" className="form-select" value={formData.employee_type} onChange={handleInputChange} style={baseInputStyle}>
            <option value="">Select Type</option>
            <option value="Local">Local</option>
            <option value="Expat">Expat</option>
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold">Employment Status:</label>
          <select name="employment_status" className="form-select" value={formData.employment_status} onChange={handleInputChange} style={baseInputStyle}>
            <option value="">Select Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold">Employment Classification:</label>
          <SearchableSelect
            options={classificationOptions}
            value={formData.employment_classification || ""}
            onChange={(v) => handleInputChange({ target: { name: "employment_classification", value: v } })}
            placeholder={classifications.length === 0 ? "Loading..." : "Search classification..."}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold">Rate:</label>
          <input type="number" name="rate" className="form-control" value={formData.rate} onChange={handleInputChange} placeholder="Rate" style={baseInputStyle} />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label fw-semibold">Rate Type:</label>
          <select name="rate_type" className="form-select" value={formData.rate_type} onChange={handleInputChange} style={baseInputStyle}>
            <option value="">Select Type</option>
            <option value="Hourly">Hourly</option>
            <option value="Daily">Daily</option>
            <option value="Monthly">Monthly</option>
            <option value="Annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Row 5: Shift */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold">Shift:</label>
          <SearchableSelect
            options={shiftOptions}
            value={formData.shift_id || ""}
            onChange={(v) => handleInputChange({ target: { name: "shift_id", value: v } })}
            placeholder={shifts.length === 0 ? "Loading..." : "Search shift..."}
          />
        </div>
      </div>

      {/* Row 6: Dates */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold">Date Started:</label>
          <input type="date" name="date_started" className="form-control" value={formData.date_started} onChange={handleInputChange} style={baseInputStyle} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold">Date Ended:</label>
          <input type="date" name="date_ended" className="form-control" value={formData.date_ended} onChange={handleInputChange} style={baseInputStyle} />
        </div>
      </div>

      <div className="d-flex justify-content-end mt-4">
        <button type="button" className="btn btn-primary" onClick={handleNext} disabled={loading}
          style={{ padding: "10px 40px", borderRadius: "8px", fontSize: "15px", fontWeight: "500" }}>
          {loading ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
}