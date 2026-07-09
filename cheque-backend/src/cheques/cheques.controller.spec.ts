import { Test, TestingModule } from '@nestjs/testing';
import { ChequesController } from './cheques.controller';

describe('ChequesController', () => {
  let controller: ChequesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChequesController],
    }).compile();

    controller = module.get<ChequesController>(ChequesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
