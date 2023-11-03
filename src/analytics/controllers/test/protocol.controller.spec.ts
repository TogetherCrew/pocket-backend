import { Test, TestingModule } from '@nestjs/testing';
import { ProtocolService } from '../../services/protocol.service';
import { ProtocolController } from '../protocol.controller';

jest.mock('../../services/protocol.service');

describe('Protocol Controller', () => {
  let controller: ProtocolController;
  let service: ProtocolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtocolController],
      providers: [ProtocolService],
    }).compile();

    controller = module.get<ProtocolController>(ProtocolController);
    service = module.get<ProtocolService>(ProtocolService);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe.each`
    ctrl_fn                        | service_fn                     | time_period
    ${'getProtocolUpgradeMetrics'} | ${'getProtocolUpgradeMetrics'} | ${undefined}
    ${'getDemandMetrics'}          | ${'getDemandMetrics'}          | ${'last-year'}
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
