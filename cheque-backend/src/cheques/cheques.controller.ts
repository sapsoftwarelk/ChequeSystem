import { Controller, Post, Get, Body, UseInterceptors, UploadedFiles,Patch,Param,Put, Delete,Query, BadRequestException } from '@nestjs/common';
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

    // Convert date strings from frontend into proper JavaScript Date objects for PostgreSQL
    const formattedData = {
      chequeType: body.chequeType, // 'INWARD' or 'OUTWARD'
      chequeNo: body.chequeNo,
      bankName: body.bankName,
      branchName: body.branchName || null,
      amount: parseFloat(body.amount), // Convert text amount to number
      partyName: body.partyName,
      chequeDate: new Date(body.chequeDate),
      realisingDate: body.realisingDate ? new Date(body.realisingDate) : null,
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

    // 1. Edit details endpoint
  @Put(':id')
  async editCheque(@Param('id') id: string, @Body() body: any) {
    return this.chequesService.updateChequeDetails(parseInt(id), body);
  }

  // 2. Delete endpoint
  @Delete(':id')
  async removeCheque(@Param('id') id: string) {
    return this.chequesService.deleteCheque(parseInt(id));
  }

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