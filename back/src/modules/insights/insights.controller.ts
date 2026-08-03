import { Controller, Get, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InsightsService } from "./insights.service";
import { PriceComparisonQueryDto } from "./dto/price-comparison-query.dto";

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@Controller("insights")
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get("waste")
  getWasteMetrics(@Request() req: RequestWithUser) {
    return this.insightsService.getWasteMetrics(req.user.id);
  }

  @Get("price-comparison")
  getPriceComparison(@Request() req: RequestWithUser, @Query() query: PriceComparisonQueryDto) {
    return this.insightsService.getPriceComparison(req.user.id, query.normalizedName);
  }
}
