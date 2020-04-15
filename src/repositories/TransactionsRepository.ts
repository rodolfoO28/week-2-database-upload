import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const { totalIncome } = await this.createQueryBuilder()
      .select('COALESCE(SUM(value),0)', 'totalIncome')
      .where('type = :type', { type: 'income' })
      .getRawOne();

    const { totalOutcome } = await this.createQueryBuilder()
      .select('COALESCE(SUM(value),0)', 'totalOutcome')
      .where('type = :type', { type: 'outcome' })
      .getRawOne();

    const balance: Balance = {
      income: Number(totalIncome),
      outcome: Number(totalOutcome),
      total: totalIncome - totalOutcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
