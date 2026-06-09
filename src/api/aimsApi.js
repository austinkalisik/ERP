import baseApi from "./baseApi";

export const getInventory = () =>
  baseApi.get("/aims/inventory");

export const getSuppliers = () =>
  baseApi.get("/aims/suppliers");
