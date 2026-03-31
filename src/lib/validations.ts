import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const createSalesMethodSchema = z.object({
  name: z.string().min(1, "Nama metode penjualan wajib diisi"),
  code: z.string().min(1, "Kode wajib diisi").toUpperCase(),
  isActive: z.boolean().optional().default(true),
});

export const updateSalesMethodSchema = createSalesMethodSchema.partial();


export const createTransactionSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  salesMethod: z.string().min(1, "Metode penjualan wajib diisi"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produk tidak valid"),
        quantity: z.number().int().min(1, "Jumlah minimal 1"),
      })
    )
    .min(1, "Transaksi tidak boleh kosong"),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  isActive: z.boolean().optional().default(true),
  prices: z.array(z.object({
    salesMethodId: z.string().min(1, "Metode penjualan wajib diisi"),
    price: z.number().int().min(0, "Harga tidak valid"),
  })).min(1, "Minimal satu harga penjualan wajib diisi"),
});

export const updateProductSchema = createProductSchema.partial();

export const transactionFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branchId: z.string().optional(),
  salesMethod: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSalesMethodInput = z.infer<typeof createSalesMethodSchema>;
export type UpdateSalesMethodInput = z.infer<typeof updateSalesMethodSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
