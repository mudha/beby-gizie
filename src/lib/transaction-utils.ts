import prisma from "@/lib/prisma";
import { formatDateForTrx } from "@/lib/format";

export async function generateTransactionNumber(): Promise<string> {
  const today = new Date();
  const dateStr = formatDateForTrx(today);
  const prefix = `TRX-${dateStr}`;

  const count = await prisma.transaction.count({
    where: {
      transactionNumber: {
        startsWith: prefix,
      },
    },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}
