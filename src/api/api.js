import baseApi from "./baseApi";

export const getDepartments = () =>
  baseApi.get("/hrms/departments");

export const getShifts = () =>
  baseApi.get("/hrms/shifts");
