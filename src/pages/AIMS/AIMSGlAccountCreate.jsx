import React, { useState, useEffect } from "react";
import axios from "axios";
import baseApi from "../../api/baseApi";

export default function AIMSGlAccountCreate() {
    const [form, setForm] = useState({
        gl_code: "",
        gl_name: "",
        account_type: "",
        parent_gl_id: "",
        currency_code: "",
        is_postable: true,
        status: "ACTIVE",
    });
    const [parents, setParents] = useState([]);
    const [message, setMessage] = useState("");



    // Load parent accounts for dropdown
    useEffect(() => {
               baseApi.get("/api/aims/parents")
            .then(res => setParents(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            
            const res = await baseApi.post("/api/aims/gl-accounts", form);
            
            setMessage(res.data.message);
            setForm({
                gl_code: "",
                gl_name: "",
                account_type: "",
                parent_gl_id: "",
                currency_code: "",
                is_postable: true,
                status: "ACTIVE",
            });
        } catch (err) {
            if (err.response?.data?.errors) {
                setMessage(Object.values(err.response.data.errors).join(", "));
            } else {
                setMessage("Error creating account");
            }
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial" }}>
            <h1>Create GL Account</h1>
            {message && <div style={{ marginBottom: "10px", color: "green" }}>{message}</div>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>GL Code:</label><br />
                    <input type="text" name="gl_code" value={form.gl_code} onChange={handleChange} required />
                </div>
                <div>
                    <label>GL Name:</label><br />
                    <input type="text" name="gl_name" value={form.gl_name} onChange={handleChange} required />
                </div>
                <div>
                    <label>Account Type:</label><br />
                    <select name="account_type" value={form.account_type} onChange={handleChange} required>
                        <option value="">Select Type</option>
                        <option value="Asset">Asset</option>
                        <option value="Liability">Liability</option>
                        <option value="Equity">Equity</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Expense">Expense</option>
                    </select>
                </div>
                <div>
                    <label>Parent Account:</label><br />
                    <select name="parent_gl_id" value={form.parent_gl_id} onChange={handleChange}>
                        <option value="">-- None --</option>
                        {parents.map(parent => (
                            <option key={parent.id} value={parent.id}>
                                {parent.gl_code} - {parent.gl_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Currency Code:</label><br />
                    <input type="text" name="currency_code" value={form.currency_code} onChange={handleChange} />
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="is_postable" checked={form.is_postable} onChange={handleChange} />
                        Is Postable
                    </label>
                </div>
                <div>
                    <label>Status:</label><br />
                    <select name="status" value={form.status} onChange={handleChange}>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                    </select>
                </div>
                <div style={{ marginTop: "10px" }}>
                    <button type="submit">Create Account</button>
                </div>
            </form>
        </div>
    );
}