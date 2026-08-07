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
        ourAccount: data.ourAccount || null,
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
  //
  // This loads the current record first so that:
  //   1. realisingDate is preserved instead of being silently wiped to null
  //      on every unrelated edit (previously reset every time unless the
  //      client explicitly sent one, which the edit form never did).
  //   2. imageFrontPath / imageBackPath are only overwritten when the
  //      caller actually provides a new value (i.e. a new file was
  //      uploaded); otherwise the existing stored image is preserved.
  //   3. ourAccount / notes fall back to the existing value rather than
  //      being nulled out if omitted.
  async updateChequeDetails(id: number, data: any): Promise<any> {
    const current = await this.prisma.cheque.findUnique({ where: { id } });
    if (!current) throw new Error('Cheque record not found');

    const targetStatus = data.status || current.status || ChequeStatus.PENDING;
    let finalStatus = targetStatus;
    let finalRealisingDate = data.realisingDate ? new Date(data.realisingDate) : current.realisingDate;
    let finalNotes = data.notes !== undefined ? data.notes : current.notes;

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
        ourAccount: data.ourAccount !== undefined ? data.ourAccount : current.ourAccount,
        imageFrontPath: data.imageFrontPath !== undefined ? data.imageFrontPath : current.imageFrontPath,
        imageBackPath: data.imageBackPath !== undefined ? data.imageBackPath : current.imageBackPath,
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

  // COMPREHENSIVE REPORT ENGINE: Handles multi-parameter filtering for frontend Audit Report
  async getChequeReport(query: {
    startDate?: string;
    endDate?: string;
    ourAccount?: string;
    bankName?: string;
    chequeType?: 'INWARD' | 'OUTWARD' | 'ALL' | string;
  }) {
    const { startDate, endDate, ourAccount, bankName, chequeType } = query;
    const where: any = {};

    // 1. Date range filter
    if (startDate || endDate) {
      where.chequeDate = {};
      if (startDate) {
        where.chequeDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.chequeDate.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // 2. Company account filter
    if (ourAccount) {
      where.ourAccount = ourAccount;
    }

    // 3. Cheque Type filter (INWARD / OUTWARD)
    if (chequeType && chequeType !== 'ALL') {
      where.chequeType = chequeType;
    }

    // 4. Bank or Party search query (case-insensitive partial match)
    if (bankName) {
      where.OR = [
        { bankName: { contains: bankName, mode: 'insensitive' } },
        { partyName: { contains: bankName, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.cheque.findMany({
      where,
      orderBy: { chequeDate: 'desc' },
    });

    return { records };
  }
}