import { Test, TestingModule } from '@nestjs/testing';
import { PoktService } from '../../services/pokt.service';
import { PoktController } from '../pokt.controller';

jest.mock('../../services/pokt.service');

describe('Pokt Controller', () => {
  let controller: PoktController;
  let service: PoktService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoktController],
      providers: [PoktService],
    }).compile();

    controller = module.get<PoktController>(PoktController);
    service = module.get<PoktService>(PoktService);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe.each`
    ctrl_fn                       | service_fn                    | time_period
    ${'getLiquidityMetric'}       | ${'getLiquidityMetric'}       | ${'last-year'}
    ${'getCoverageRatioMetric'}   | ${'getCoverageRatioMetric'}   | ${'last-year'}
    ${'getAnnualizedYieldMetric'} | ${'getAnnualizedYieldMetric'} | ${'last-year'}
  `('When $ctrl_fn method called', ({ ctrl_fn, service_fn, time_period }) => {
    let returnValue;

    beforeEach(() => {
      returnValue = controller[ctrl_fn](time_period);
    });

    test('Should be defined', () => {
      expect(controller[ctrl_fn]).toBeDefined();
    });

    test(`Should be called ${service_fn} method of service`, () => {
      expect(service[service_fn]).toBeCalledWith(time_period);
    });

    test('Should return metrics values', () => {
      expect(returnValue).toEqual({});
    });
  });
});
