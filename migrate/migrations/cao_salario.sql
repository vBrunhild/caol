CREATE TABLE IF NOT EXISTS cao_salario (
    co_usuario TEXT NOT NULL DEFAULT '',
    dt_alteracao DATE NOT NULL DEFAULT '0000-00-00',
    brut_salario DECIMAL(15, 2) NOT NULL DEFAULT 0,
    liq_salario DECIMAL(15, 2) NOT NULL DEFAULT 0,
    PRIMARY KEY (co_usuario, dt_alteracao)
);
