ALTER TABLE runvara_gateway_requests
    ADD COLUMN idempotency_key_hash TEXT,
    ADD COLUMN request_fingerprint TEXT NOT NULL DEFAULT repeat('0', 64),
    ADD COLUMN lease_owner TEXT NOT NULL DEFAULT 'migration',
    ADD COLUMN lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE runvara_gateway_requests
    ADD CONSTRAINT runvara_gateway_requests_idempotency_hash_check
        CHECK (idempotency_key_hash IS NULL OR length(idempotency_key_hash) = 64),
    ADD CONSTRAINT runvara_gateway_requests_fingerprint_check
        CHECK (length(request_fingerprint) = 64),
    ADD CONSTRAINT runvara_gateway_requests_lease_owner_check
        CHECK (length(lease_owner) BETWEEN 1 AND 128);

CREATE UNIQUE INDEX runvara_gateway_requests_idempotency_unique_idx
    ON runvara_gateway_requests (
        organization_id,
        project_id,
        environment_id,
        idempotency_key_hash
    )
    WHERE idempotency_key_hash IS NOT NULL;

CREATE INDEX runvara_gateway_requests_expired_lease_idx
    ON runvara_gateway_requests (lease_expires_at)
    WHERE state = 'started';

ALTER TABLE runvara_provider_attempts
    ADD COLUMN lease_owner TEXT NOT NULL DEFAULT 'migration',
    ADD COLUMN lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE runvara_provider_attempts
    ADD CONSTRAINT runvara_provider_attempts_lease_owner_check
        CHECK (length(lease_owner) BETWEEN 1 AND 128);

CREATE INDEX runvara_provider_attempts_expired_lease_idx
    ON runvara_provider_attempts (lease_expires_at)
    WHERE state = 'started';
