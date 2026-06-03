-- CreateTable
CREATE TABLE `relatorios_consolidados` (
    `id` VARCHAR(191) NOT NULL,
    `mobileId` VARCHAR(191) NOT NULL,
    `lote` VARCHAR(191) NOT NULL,
    `planta` INTEGER NOT NULL,
    `centroCusto` VARCHAR(191) NOT NULL,
    `doencaOuPraga` VARCHAR(191) NOT NULL,
    `porcentagem` DOUBLE NOT NULL,
    `totalNotas` INTEGER NULL,
    `dataCalculo` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `relatorios_consolidados_lote_planta_doencaOuPraga_mobileId_key`(`lote`, `planta`, `doencaOuPraga`, `mobileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
