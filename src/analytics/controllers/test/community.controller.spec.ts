import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from '../../services/community.service';
import { CommunityController } from '../community.controller';

jest.mock('../../services/community.service');

describe('Community Controller', () => {
  let controller: CommunityController;
  let service: CommunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityController],
      providers: [CommunityService],
    }).compile();

    controller = module.get<CommunityController>(CommunityController);
    service = module.get<CommunityService>(CommunityService);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe.each`
    ctrl_fn                               | service_fn                            | time_period
    ${'getCommunityCollaborationMetrics'} | ${'getCommunityCollaborationMetrics'} | ${'last-year'}
    ${'getAwarenessMetrics'}              | ${'getAwarenessMetrics'}              | ${'last-year'}
    ${'getTransparencyMetrics'}           | ${'getTransparencyMetrics'}           | ${'last-year'}
    ${'getAdaptabilityMetrics'}           | ${'getAdaptabilityMetrics'}           | ${'last-year'}
    ${'getQuarterlyERAAllocationMetrics'} | ${'getQuarterlyERAAllocationMetrics'} | ${undefined}
  `('When $ctrl_fn method called', ({ ctrl_fn, service_fn, time_period }) => {
    let returnValue;

    beforeEach(() => {
      returnValue = controller[ctrl_fn](time_period);
    });

    test('Should be defined', () => {
      expect(controller[ctrl_fn]).toBeDefined();
    });

    test(`Should be called ${service_fn} method of service`, () => {
      if (time_period === undefined) {
        expect(service[service_fn]).toBeCalled();
      } else {
        expect(service[service_fn]).toBeCalledWith(time_period);
      }
    });

    test('Should return metrics values', () => {
      expect(returnValue).toEqual({});
    });
  });
});
