import baseApi from "./baseApi";

export const getPayrollPeriods = () =>
  baseApi.get("/payroll/periods");
