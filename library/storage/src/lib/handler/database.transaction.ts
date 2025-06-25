// import { logger } from '@leadsend/logging';
// import { Injectable } from '@nestjs/common';
// import { DataSource, EntityManager } from 'typeorm';
// import ErrorHandler from './error.handler';

// /** A helper class to handle database transaction */
// @Injectable()
// export class DatabaseTransactionHandler {
//   constructor(private readonly dataSource: DataSource) {}

//   async runInTransaction<T>(
//     callback: (entityManager: EntityManager) => Promise<T>
//   ): Promise<T | null> {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       const result = await callback(queryRunner.manager);
//       await queryRunner.commitTransaction();
//       return result;
//     } catch (err) {
//       logger.error('----------------TRANSACTION-ERROR---------------------');
//       logger.error(err);
//       logger.error('-------------TRANSACTION-ERROR------------------------');
//       await queryRunner.rollbackTransaction();
//       ErrorHandler.handleError(err);
//       return null;
//     } finally {
//       await queryRunner.release();
//     }
//   }
// }
