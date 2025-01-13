import { Injectable } from '@nestjs/common';
import {
  ActivityLog,
  ActivityStatus,
  ActivityStage,
} from '@prisma/client';
import * as fs from 'fs';
import { OrderData } from '../generatePdf.processor';
import { PrismaService } from '../../../src/prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createInitialActivityLog(
    orderData: OrderData,
    initiatedBy = 'SYSTEM',
  ): Promise<ActivityLog> {
    return this.prisma.activityLog.create({
      data: {
        orderId: orderData.order.id,
        status: ActivityStatus.IN_PROGRESS,
        stage: ActivityStage.QUEUE_INITIATED,
        initiatedBy,
        metadata: {
          originalOrderData: JSON.parse(
            JSON.stringify(orderData),
          ),
        },
      },
    });
  }

  async updateActivityLogStage(
    activityLogId: number,
    status: ActivityStatus,
    stage: ActivityStage,
    data: Partial<ActivityLog> = {},
  ): Promise<ActivityLog> {
    return this.prisma.activityLog.update({
      where: { id: activityLogId },
      data: {
        stage,
        status,
        ...data,
      },
    });
  }

  async markActivityLogComplete(
    activityLogId: number,
    filePath?: string,
  ): Promise<ActivityLog> {
    let fileSize: bigint | undefined;

    if (filePath) {
      try {
        const stats = await fs.promises.stat(
          filePath,
        );
        fileSize = BigInt(stats.size);
      } catch (error) {
        // Log the error or handle it appropriately
        console.error(
          'Error getting file size:',
          error,
        );
      }
    }

    return this.prisma.activityLog.update({
      where: { id: activityLogId },
      data: {
        status: ActivityStatus.COMPLETED,
        stage: ActivityStage.COMPLETED,
        completedAt: new Date(),
        filePath,
        fileSize,
      },
    });
  }

  async markActivityLogFailed(
    activityLogId: number,
    errorMessage: string,
    stage?: ActivityStage,
  ): Promise<ActivityLog> {
    return this.prisma.activityLog.update({
      where: { id: activityLogId },
      data: {
        status: ActivityStatus.FAILED,
        stage:
          stage || ActivityStage.QUEUE_INITIATED,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  // Additional query methods
  async getActivityLogById(
    id: number,
  ): Promise<ActivityLog | null> {
    return this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });
  }

  async getActivityLogsByOrder(
    orderId: number,
  ): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { orderId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getRecentFailedActivityLogs(
    limit = 10,
  ): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { status: ActivityStatus.FAILED },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        order: true,
      },
    });
  }
}
