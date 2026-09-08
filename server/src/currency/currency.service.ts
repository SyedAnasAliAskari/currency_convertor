import { HttpService } from '@nestjs/axios';
import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { ConvertQueryDto } from './convert-query.dto';

interface ApiCurrency {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  code: string;
}

interface CurrencyResponse { data: Record<string, ApiCurrency> }
interface LatestResponse { data: Record<string, number> }
interface HistoricalResponse { data: Record<string, Record<string, number>> }

@Injectable()
export class CurrencyService {
  private readonly baseUrl = 'https://api.freecurrencyapi.com/v1';
  private currencyCache: { expiresAt: number; value: ReturnType<CurrencyService['mapCurrencies']> } | null = null;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getCurrencies() {
    if (this.currencyCache && this.currencyCache.expiresAt > Date.now()) {
      return this.currencyCache.value;
    }

    try {
      const response = await this.http.axiosRef.get<CurrencyResponse>(`${this.baseUrl}/currencies`, {
        headers: this.authHeaders(),
      });
      const value = this.mapCurrencies(response.data.data);
      this.currencyCache = { value, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
      return value;
    } catch (error) {
      this.throwApiError(error);
    }
  }

  async convert(query: ConvertQueryDto) {
    this.validateHistoricalDate(query.date);
    const endpoint = query.date ? 'historical' : 'latest';

    try {
      const response = await this.http.axiosRef.get<LatestResponse | HistoricalResponse>(
        `${this.baseUrl}/${endpoint}`,
        {
          headers: this.authHeaders(),
          params: {
            base_currency: query.from,
            currencies: query.to,
            ...(query.date ? { date: query.date } : {}),
          },
        },
      );

      const rates = query.date
        ? (response.data as HistoricalResponse).data[query.date]
        : (response.data as LatestResponse).data;
      const rate = rates?.[query.to];
      if (typeof rate !== 'number') {
        throw new BadGatewayException('The exchange-rate provider did not return the requested rate.');
      }

      return {
        from: query.from,
        to: query.to,
        amount: query.amount,
        rate,
        result: query.amount * rate,
        date: query.date ?? null,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      this.throwApiError(error);
    }
  }

  private mapCurrencies(data: Record<string, ApiCurrency>) {
    return Object.values(data)
      .map((currency) => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        symbolNative: currency.symbol_native,
        decimalDigits: currency.decimal_digits,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  private authHeaders() {
    const apiKey = this.config.get<string>('CURRENCY_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('Currency API key is not configured on the server.');
    }
    return { apikey: apiKey };
  }

  private validateHistoricalDate(date?: string) {
    if (!date) return;
    const parsed = new Date(`${date}T00:00:00Z`);
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException('Choose a valid historical date.');
    }
    if (parsed.getTime() < Date.UTC(1999, 0, 1) || parsed.getTime() >= todayUtc) {
      throw new BadRequestException('Historical dates must be between 1999-01-01 and yesterday.');
    }
  }

  private throwApiError(error: unknown): never {
    if (error instanceof ServiceUnavailableException) throw error;
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const upstreamMessage = (error.response?.data as { message?: string } | undefined)?.message;
      if (status === 422) throw new BadRequestException(upstreamMessage ?? 'The conversion request is invalid.');
      if (status === 401 || status === 403) throw new ServiceUnavailableException('The currency service credentials are unavailable.');
      if (status === 429) throw new ServiceUnavailableException('The currency service limit has been reached. Please try again later.');
    }
    throw new BadGatewayException('Unable to retrieve exchange rates right now. Please try again.');
  }
}
