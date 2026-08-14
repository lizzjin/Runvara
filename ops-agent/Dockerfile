# syntax=docker/dockerfile:1

ARG RUST_VERSION=1.96.0
ARG RUNVARA_VERSION=0.1.0
ARG RUNVARA_SOURCE_REVISION=unknown
ARG RUNVARA_SOURCE_STATE=unknown
ARG RUNVARA_BUILD_DATE=unknown
FROM rust:${RUST_VERSION}-bookworm AS builder

ARG RUNVARA_SOURCE_REVISION
ARG RUNVARA_SOURCE_STATE
ENV RUNVARA_BUILD_REVISION=${RUNVARA_SOURCE_REVISION}
ENV RUNVARA_BUILD_SOURCE_STATE=${RUNVARA_SOURCE_STATE}

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
COPY crates ./crates
COPY ops-agent ./ops-agent

RUN cargo build --release --locked -p runvara-ops-agent

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --system --home /nonexistent --shell /usr/sbin/nologin runvara-ops \
  && mkdir -p /var/lib/runvara-ops \
  && chown -R runvara-ops:runvara-ops /var/lib/runvara-ops

COPY --from=builder /app/target/release/runvara-ops-agent /usr/local/bin/runvara-ops-agent

ARG RUNVARA_SOURCE_REVISION
ARG RUNVARA_SOURCE_STATE
ARG RUNVARA_VERSION
ARG RUNVARA_BUILD_DATE
LABEL org.opencontainers.image.title="Runvara Operations Agent" \
      org.opencontainers.image.description="Deterministic read-only operations agent for Runvara" \
      org.opencontainers.image.source="https://github.com/tiammomo/Runvara" \
      org.opencontainers.image.revision="$RUNVARA_SOURCE_REVISION" \
      org.opencontainers.image.version="$RUNVARA_VERSION" \
      org.opencontainers.image.created="$RUNVARA_BUILD_DATE" \
      org.opencontainers.image.licenses="MIT" \
      io.runvara.source-state="$RUNVARA_SOURCE_STATE"

USER runvara-ops

ENV RUNVARA_OPS_BIND=0.0.0.0:38083
ENV RUNVARA_OPS_BASE_URL=http://runvara:38082
ENV RUNVARA_OPS_MODE=disabled
ENV RUNVARA_OPS_SPOOL_PATH=/var/lib/runvara-ops/spool.sqlite
ENV RUST_LOG=runvara_ops_agent=info

EXPOSE 38083
VOLUME ["/var/lib/runvara-ops"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:38083/readyz >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/runvara-ops-agent"]
