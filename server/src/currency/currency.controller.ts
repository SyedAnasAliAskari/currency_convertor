import { Controller, Get, Query } from '@nestjs/common';
import { ConvertQueryDto } from './convert-query.dto';
import { CurrencyService } from './currency.service';

@Controller()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('currencies')
  getCurrencies() {
    return this.currencyService.getCurrencies();
  }

  @Get('convert')
  convert(@Query() query: ConvertQueryDto) {
    return this.currencyService.convert(query);
  }
}
