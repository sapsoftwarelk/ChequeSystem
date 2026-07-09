import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChequeModel } from '../generated/prisma/models';
import { Prisma } from '../generated/prisma/client';
import { ChequeStatus } from '../generated/prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ChequesService {
  constructor(private prisma: PrismaService) {}

  // PRIVATE HELPER: Centralizes the instant realisation check logic
  private shouldBeInstantlyRealised(type: 'INWARD' | 'OUTWARD', status: ChequeStatus, chequeDate: Date): boolean {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Compare up to the very end of today

    // If the cheque date is in the future, don't auto-realise
    if (new Date(chequeDate) > today) return false;

    // Rule 1: Received (Inward) cheques realize instantly ONLY if they are being marked as DEPOSITED
    if (type === 'INWARD' && status === ChequeStatus.DEPOSITED) return true;

    // Rule 2: Issued (Outward) cheques realize instantly from PENDING or DEPOSITED
    if (type === 'OUTWARD' && (status === ChequeStatus.PENDING || status === ChequeStatus.DEPOSITED)) return true;

    return false;
  }

  // Save a new cheque record with live validation for back-dated entries
  async createCheque(data: any): Promise<ChequeModel> {
    let targetStatus = data.status || ChequeStatus.PENDING;
    let targetRealisingDate: Date | null = null; 
    let targetNotes: string | null = data.notes || null;

    const chqDate = new Date(data.chequeDate);

    if (this.shouldBeInstantlyRealised(data.chequeType, targetStatus, data.chequeDate)) {
      targetStatus = ChequeStatus.REALISED;
      targetRealisingDate = new Date();
      targetNotes = (targetNotes ? targetNotes + ' | ' : '') + 'Automatically realised on entry (Past maturity date).';
    }

    return this.prisma.cheque.create({
      data: {
        chequeType: data.chequeType,
        chequeNo: data.chequeNo,
        bankName: data.bankName,
        branchName: data.branchName || null,
        amount: parseFloat(data.amount),
        partyName: data.partyName,
        chequeDate: chqDate,
        status: targetStatus,
        realisingDate: targetRealisingDate,
        imageFrontPath: data.imageFrontPath || null,
        imageBackPath: data.imageBackPath || null,
        notes: targetNotes,
        ourAccount: data.ourAccount || null, // 👈 FIXED: Direct assignment to ensure payload fields write safely to PostgreSQL
      },
    });
  }

  // Fetch all cheques for the dashboard layout
  async getAllCheques(): Promise<ChequeModel[]> {
    return this.prisma.cheque.findMany({
      orderBy: {
        id: 'desc', // Sorts newest entries first on the UI table
      },
    });
  }

  // Dropdown status handler with live evaluation for instant realization
  async updateChequeStatus(id: number, status: ChequeStatus, realisingDate?: Date, notes?: string) {
    const currentCheque = await this.prisma.cheque.findUnique({ where: { id } });
    if (!currentCheque) throw new Error('Cheque record not found');

    let finalStatus = status;
    let finalRealisingDate = realisingDate || null;
    let finalNotes = notes || currentCheque.notes;

    if (this.shouldBeInstantlyRealised(currentCheque.chequeType as any, status, currentCheque.chequeDate)) {
      finalStatus = ChequeStatus.REALISED;
      finalRealisingDate = new Date();
      finalNotes = (finalNotes ? finalNotes + ' | ' : '') + 'Automatically realised on status update (Past maturity date).';
    } else if (status === ChequeStatus.REALISED && !finalRealisingDate) {
      finalRealisingDate = new Date();
    }

    return this.prisma.cheque.update({
      where: { id },
      data: {
        status: finalStatus,
        realisingDate: finalRealisingDate,
        notes: finalNotes,
      },
    });
  }

  // Update any text fields of a cheque
  async updateChequeDetails(id: number, data: any): Promise<any> {
    const targetStatus = data.status || ChequeStatus.PENDING;
    let finalStatus = targetStatus;
    let finalRealisingDate = data.realisingDate || null;
    let finalNotes = data.notes || null;

    if (this.shouldBeInstantlyRealised(data.chequeType, targetStatus, data.chequeDate)) {
      finalStatus = ChequeStatus.REALISED;
      finalRealisingDate = new Date();
      finalNotes = (finalNotes ? finalNotes + ' | ' : '') + 'Automatically realised during record modification (Past maturity date).';
    }

    return this.prisma.cheque.update({
      where: { id },
      data: {
        chequeType: data.chequeType,
        chequeNo: data.chequeNo,
        bankName: data.bankName,
        branchName: data.branchName || null,
        amount: parseFloat(data.amount),
        partyName: data.partyName,
        chequeDate: new Date(data.chequeDate),
        status: finalStatus,
        realisingDate: finalRealisingDate,
        notes: finalNotes,
        ourAccount: data.ourAccount !== undefined ? data.ourAccount : undefined, // 👈 CRITICAL FIX: Maps the incoming update structure safely to prevent resetting back to null during generic modifications
      },
    });
  }

  // Permanently delete a cheque record
  async deleteCheque(id: number): Promise<any> {
    return this.prisma.cheque.delete({
      where: { id },
    });
  }

  // BACKGROUND CRON: Runs every night at midnight for naturally maturing entries
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoRealiseMaturedCheques() {
    console.log('[Automation] Executing rule-based cheque maturity audit...');
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    try {
      const result = await this.prisma.cheque.updateMany({
        where: {
          chequeDate: {
            lte: today,
          },
          OR: [
            {
              chequeType: 'INWARD',
              status: ChequeStatus.DEPOSITED,
            },
            {
              chequeType: 'OUTWARD',
              status: {
                in: [ChequeStatus.PENDING, ChequeStatus.DEPOSITED],
              },
            },
          ],
        },
        data: {
          status: ChequeStatus.REALISED,
          realisingDate: new Date(),
          notes: 'Automatically realised by system compliance rules.',
        },
      });

      if (result.count > 0) {
        console.log(`[Automation] Successfully updated ${result.count} matured cheques based on accounting workflow rules.`);
      }
    } catch (error) {
      console.error('[Automation Error] Failed rule audit execution:', error);
    }
  }

  async getReportData(filter: any): Promise<ChequeModel[]> {
    return this.prisma.cheque.findMany({
      where: filter,
      orderBy: {
        chequeDate: 'asc',
      },
    });
  }
}