/*
  Warnings:

  - You are about to drop the column `centroCusto` on the `relatorios_consolidados` table. All the data in the column will be lost.
  - You are about to drop the column `dataCalculo` on the `relatorios_consolidados` table. All the data in the column will be lost.
  - You are about to drop the column `lote` on the `relatorios_consolidados` table. All the data in the column will be lost.
  - You are about to drop the column `mobileId` on the `relatorios_consolidados` table. All the data in the column will be lost.
  - You are about to drop the column `planta` on the `relatorios_consolidados` table. All the data in the column will be lost.
  - You are about to drop the `avaliacoes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `orgao` to the `relatorios_consolidados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessaoId` to the `relatorios_consolidados` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `relatorios_consolidados_lote_planta_doencaOuPraga_mobileId_key` ON `relatorios_consolidados`;

-- AlterTable
ALTER TABLE `relatorios_consolidados` DROP COLUMN `centroCusto`,
    DROP COLUMN `dataCalculo`,
    DROP COLUMN `lote`,
    DROP COLUMN `mobileId`,
    DROP COLUMN `planta`,
    ADD COLUMN `orgao` VARCHAR(191) NOT NULL,
    ADD COLUMN `sessaoId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `avaliacoes`;

-- CreateTable
CREATE TABLE `sessoes_avaliacao` (
    `id` VARCHAR(191) NOT NULL,
    `mobileSessaoId` VARCHAR(191) NOT NULL,
    `lote` VARCHAR(191) NOT NULL,
    `planta` INTEGER NOT NULL,
    `centroCusto` VARCHAR(191) NOT NULL,
    `nomeAvaliador` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL,
    `sincronizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessoes_avaliacao_mobileSessaoId_key`(`mobileSessaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacoes_detalhes` (
    `id` VARCHAR(191) NOT NULL,
    `sessaoId` VARCHAR(191) NOT NULL,
    `doencaOuPraga` VARCHAR(191) NOT NULL,
    `orgao` VARCHAR(191) NOT NULL,
    `quadrante` VARCHAR(191) NULL,
    `ramo` VARCHAR(191) NULL,
    `identificadorDeLocal` VARCHAR(191) NULL,
    `numeroLocal` INTEGER NULL,
    `nota` DOUBLE NOT NULL DEFAULT 0,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `accuracy` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `avaliacoes_detalhes` ADD CONSTRAINT `avaliacoes_detalhes_sessaoId_fkey` FOREIGN KEY (`sessaoId`) REFERENCES `sessoes_avaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorios_consolidados` ADD CONSTRAINT `relatorios_consolidados_sessaoId_fkey` FOREIGN KEY (`sessaoId`) REFERENCES `sessoes_avaliacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
