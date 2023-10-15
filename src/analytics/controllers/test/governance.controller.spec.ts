import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceService } from '../../services/governance.service';
import { GovernanceController } from '../governance.controller';

jest.mock('../../services/governance.service');

describe('Governance Controller', () => {
  let controller: GovernanceController;
  let service: GovernanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [GovernanceService],
    }).compile();

    controller = module.get<GovernanceController>(GovernanceController);
    service = module.get<GovernanceService>(GovernanceService);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe.each`
    ctrl_fn                            | service_fn                         | time_period
    ${'getNakamotoCoefficientMetrics'} | ${'getNakamotoCoefficientMetrics'} | ${'last-year'}
    ${'getDaoGovernanceMetrics'}       | ${'getDaoGovernanceMetrics'}       | ${'last-year'}
    ${'getCollaborationMetrics'}       | ${'getCollaborationMetrics'}       | ${'last-year'}
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
