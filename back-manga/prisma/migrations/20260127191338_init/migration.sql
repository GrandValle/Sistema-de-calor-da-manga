-- CreateTable
CREATE TABLE `avaliacoes` (
    `id` VARCHAR(191) NOT NULL,
    `mobileId` BIGINT NOT NULL,
    `lote` VARCHAR(191) NOT NULL,
    `fazenda` VARCHAR(191) NULL,
    `centroCusto` VARCHAR(191) NOT NULL,
    `planta` INTEGER NOT NULL,
    `doencaOuPraga` VARCHAR(191) NOT NULL,
    `orgao` VARCHAR(191) NOT NULL,
    `quadrante` VARCHAR(191) NULL,
    `ramo` VARCHAR(191) NULL,
    `identificadorDeLocal` VARCHAR(191) NULL,
    `numeroLocal` INTEGER NULL,
    `nota` DOUBLE NULL DEFAULT 0,
    `nomeAvaliador` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `accuracy` DOUBLE NULL,
    `criadoEmMobile` DATETIME(3) NOT NULL,
    `sincronizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `avaliacoes_mobileId_key`(`mobileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
