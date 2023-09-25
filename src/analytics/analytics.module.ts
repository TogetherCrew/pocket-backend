import { Module } from '@nestjs/common';
import { CommunityController } from './controllers/community.controller';
import { GovernanceController } from './controllers/governance.controller';
import { PoktController } from './controllers/pokt.controller';
import { ProtocolController } from './controllers/protocol.controller';
import { CommunityService } from './services/community.service';
import { GovernanceService } from './services/governance.service';
import { PoktService } from './services/pokt.service';
import { ProtocolService } from './services/protocol.service';
import { CommonService } from './services/common.service';

@Module({
  controllers: [
    CommunityController,
    GovernanceController,
    PoktController,
    ProtocolController,
  ],
  providers: [
    CommunityService,
    GovernanceService,
    PoktService,
    ProtocolService,
    CommonService,
  ],
})
export class AnalyticsModule {}
