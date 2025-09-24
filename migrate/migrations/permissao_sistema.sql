CREATE TABLE IF NOT EXISTS permissao_sistema (
    co_usuario TEXT NOT NULL DEFAULT '',
    co_tipo_usuario INTEGER NOT NULL DEFAULT 0,
    co_sistema INTEGER NOT NULL DEFAULT 0,
    in_ativo TEXT NOT NULL DEFAULT 'S',
    co_usuario_atualizacao TEXT DEFAULT NULL,
    dt_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (co_usuario, co_tipo_usuario, co_sistema)
);
