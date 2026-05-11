import { prisma } from "./prisma";

export async function logAudit(
  creatorId: string,
  action: string,
  details?: object
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        creatorId,
        action,
        details: details ?? undefined,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main flow
    console.error("Failed to write audit log:", error);
  }
}
