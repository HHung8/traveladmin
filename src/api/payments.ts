import { api } from "./client";
import type { ApiResponse } from "./destinations";


// === Kiểu dữ liệu ===
export interface Payment {
    id: string;
    userId: string;
    bookingType: string; // tour | hotel | attraction
    bookingId: string;
    amount: number;
    method: string;
    status: string; // pending | success | failed | refunded
    transactionRef: string | null;
    paidAt: string | null; // ISO
    createdAt: string; // ISO
}

export interface PaymentDetail extends Payment {
    gatewayResponse: string | null;
}

export interface PagedPayments {
    items: Payment[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
    createdAt: string;
}

export type PaymentAction = "confirm" | "fail" | "refund";

// === Giao dịch ===
export const getPayments = async (params?: { page?: number; pageSize?: number }) => {
  const res = await api.get<ApiResponse<PagedPayments>>("/api/payments", {
    params: { Page: params?.page, PageSize: params?.pageSize },
  });
  return res.data;
};

export const getPayment = async (id: string) => {
  const res = await api.get<ApiResponse<PaymentDetail>>(`/api/payments/${id}`);
  return res.data;
};

export const runPaymentAction = async (id: string, action: PaymentAction) => {
    const res = await api.post<ApiResponse<unknown>>(`/api/payments/${id}/${action}`);
    return res.data;
};


// === Thẻ ===
export const getPaymentMethods = async () => {
  const res = await api.get<ApiResponse<PaymentMethod[]>>("/api/payment-methods");
  return res.data;
};

export const setDefaultPaymentMethod = async (id: string) => {
  const res = await api.put<ApiResponse<unknown>>(`/api/payment-methods/${id}/default`);
  return res.data;
};
 
export const deletePaymentMethod = async (id: string) => {
  const res = await api.delete<ApiResponse<unknown>>(`/api/payment-methods/${id}`);
  return res.data;
};