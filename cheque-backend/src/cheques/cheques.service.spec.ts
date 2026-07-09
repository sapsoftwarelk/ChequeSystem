import { Test, TestingModule } from '@nestjs/testing';
import { ChequesService } from './cheques.service';

describe('ChequesService', () => {
  let service: ChequesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChequesService],
    }).compile();

    service = module.get<ChequesService>(ChequesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
