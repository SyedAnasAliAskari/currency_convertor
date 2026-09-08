import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  const axiosRef = { get: jest.fn() };
  const service = new CurrencyService(
    { axiosRef } as unknown as HttpService,
    { get: jest.fn().mockReturnValue('test-key') } as unknown as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('maps and sorts currencies from the provider', async () => {
    axiosRef.get.mockResolvedValueOnce({ data: { data: {
      USD: { code: 'USD', name: 'US Dollar', symbol: '$', symbol_native: '$', decimal_digits: 2 },
      EUR: { code: 'EUR', name: 'Euro', symbol: '€', symbol_native: '€', decimal_digits: 2 },
    } } });

    await expect(service.getCurrencies()).resolves.toEqual([
      expect.objectContaining({ code: 'EUR' }),
      expect.objectContaining({ code: 'USD' }),
    ]);
  });

  it('calculates a latest conversion', async () => {
    axiosRef.get.mockResolvedValueOnce({ data: { data: { EUR: 0.92 } } });
    const result = await service.convert({ from: 'USD', to: 'EUR', amount: 10 });
    expect(result).toEqual(expect.objectContaining({
      from: 'USD', to: 'EUR', amount: 10, rate: 0.92, date: null,
    }));
    expect(result.result).toBeCloseTo(9.2);
  });

  it('rejects today as a historical date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await expect(service.convert({ from: 'USD', to: 'EUR', amount: 10, date: today }))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});

