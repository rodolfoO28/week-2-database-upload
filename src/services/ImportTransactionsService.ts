import fs from 'fs';
import parser from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const csvReadStream = fs.createReadStream(filePath);

    const csvParses = parser({
      delimiter: ',',
      trim: true,
      columns: true,
    });

    const csvParse = csvReadStream.pipe(csvParses);

    const categoriesCSV: string[] = [];
    const transactionsCSV: CSVTransaction[] = [];

    csvParse.on('data', async data => {
      const { title, type, value, category } = data;

      if (!title || !type || !value) return;

      categoriesCSV.push(category);

      transactionsCSV.push({ title, type, value, category });
    });

    await new Promise(resolve => csvParse.on('end', resolve));

    const categories = await categoriesRepository.find({
      where: {
        title: In(categoriesCSV),
      },
    });

    const categoriesToCreate = categoriesCSV
      .filter(
        categoryCSV =>
          !categories.map(category => category.title).includes(categoryCSV),
      )
      .filter((value, index, arr) => arr.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriesToCreate.map(category => ({
        title: category,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...categories, ...newCategories];

    const transactions = transactionsRepository.create(
      transactionsCSV.map(transaction => {
        const { title, value, type, category: category_name } = transaction;

        return {
          title,
          value,
          type,
          category: allCategories.find(
            category => category.title === category_name,
          ),
        };
      }),
    );

    await transactionsRepository.save(transactions);

    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
