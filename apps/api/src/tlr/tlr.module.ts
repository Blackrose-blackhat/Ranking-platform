import { Module } from "@nestjs/common";
import { TlrController } from "./tlr.controller";
import { TlrService } from "./tlr.service";

@Module({
  controllers: [TlrController],
  providers: [TlrService],
  exports: [TlrService],
})
export class TlrModule {}
