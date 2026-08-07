import { Controller, Post, Get, Body, UseInterceptors, UploadedFiles, Patch, Param, Put, Delete, Query, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChequesService } from './cheques.service';

// Custom file renaming logic to prevent overwriting images
const localStorageConfig = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  },
});

@Controller('cheques')
export class ChequesController {
  constructor(private readonly chequesService: ChequesService) {}

  // 1. Endpoint to Save a Cheque with 2 Images
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imageFront', maxCount: 1 },
        { name: 'imageBack', maxCount: 1 },
      ],
      { storage: localStorageConfig }
    )
  )
  async uploadCheque(
    @Body() body: any,
    @UploadedFiles() files: { imageFront?: Express.Multer.File[]; imageBack?: Express.Multer.File[] }
  ) {
    // Extract saved file paths if they exist
    const frontPath = files?.imageFront?.[0] ? `/static-assets/${files.imageFront[0].filename}` : null;
    const backPath = files?.imageBack?.[0] ? `/static-assets/${files.imageBack[0].filename}` : null;

    // NOTE: The frontend (ChequeForm) sends the company account field as
    // `ourCompanyAccount`, while our domain/schema (Prisma) uses `ourAccount`.
    // We normalize that mismatch here, once, at the API boundary — the service
    // and DB layer should never need to know about frontend naming conventions.
    // We still fall back to `ourAccount` in case a caller sends that key directly
    // (e.g. scripts, Postman, future clients).
    const formattedData = {
      chequeType: body.chequeType, // 'INWARD' or 'OUTWARD'
      chequeNo: body.chequeNo,
      bankName: body.bankName,
      branchName: body.branchName || null,
      amount: parseFloat(body.amount), // Convert text amount to number
      partyName: body.partyName,
      chequeDate: new Date(body.chequeDate),
      realisingDate: body.realisingDate ? new Date(body.realisingDate) : null,
      ourAccount: body.ourCompanyAccount || body.ourAccount || null,
      notes: body.notes || null,
      imageFrontPath: frontPath,
      imageBackPath: backPath,
    };

    return this.chequesService.createCheque(formattedData);
  }

  // 2. Endpoint to Fetch All Cheques for your Frontend Dashboard
  @Get()
  async getAll() {
    return this.chequesService.getAllCheques();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: any; realisingDate?: string; notes?: string }) {
    const rDate = body.realisingDate ? new Date(body.realisingDate) : undefined;
    return this.chequesService.updateChequeStatus(parseInt(id), body.status, rDate, body.notes);
  }

  // 3. Edit details endpoint
  //
  // IMPORTANT: this now accepts multipart/form-data (via FileFieldsInterceptor),
  // NOT plain JSON. The frontend edit form sends FormData so it can attach
  // replacement images in the same request that updates the other fields.
  //
  // Without this interceptor, NestJS's built-in body parser (which only
  // understands application/json and application/x-www-form-urlencoded)
  // cannot parse a multipart request at all, and @Body() resolves to
  // `undefined` — which is exactly why this previously crashed with
  // "Cannot read properties of undefined (reading 'ourCompanyAccount')".
  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imageFront', maxCount: 1 },
        { name: 'imageBack', maxCount: 1 },
      ],
      { storage: localStorageConfig }
    )
  )
  async editCheque(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: { imageFront?: Express.Multer.File[]; imageBack?: Express.Multer.File[] }
  ) {
    const formattedData: any = {
      ...body,
      ourAccount: body.ourCompanyAccount || body.ourAccount || null,
    };

    // Only include an image path in the payload if a NEW file was actually
    // uploaded during this edit. If the key is omitted entirely, the service
    // knows to keep whatever image is already stored for this record instead
    // of wiping it out.
    if (files?.imageFront?.[0]) {
      formattedData.imageFrontPath = `/static-assets/${files.imageFront[0].filename}`;
    }
    if (files?.imageBack?.[0]) {
      formattedData.imageBackPath = `/static-assets/${files.imageBack[0].filename}`;
    }

    return this.chequesService.updateChequeDetails(parseInt(id), formattedData);
  }

  // 4. Delete endpoint
  @Delete(':id')
  async removeCheque(@Param('id') id: string) {
    return this.chequesService.deleteCheque(parseInt(id));
  }

  // 5. Comprehensive Audit Report Endpoint (Matches frontend search fetch URL: /cheques/report)
  @Get('report')
  async getAuditReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('ourAccount') ourAccount?: string,
    @Query('bankName') bankName?: string,
    @Query('chequeType') chequeType?: 'INWARD' | 'OUTWARD' | 'ALL' | string,
  ) {
    return this.chequesService.getChequeReport({
      startDate,
      endDate,
      ourAccount,
      bankName,
      chequeType,
    });
  }

  // 6. Legacy filter endpoint (kept for backward compatibility)
  @Get('report/filter')
  async getReportData(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: string, // Comma-separated or single value
  ) {
    const filter: any = {
      chequeDate: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'), // Catch the full final day
      },
    };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    return this.chequesService.getReportData(filter);
  }
}