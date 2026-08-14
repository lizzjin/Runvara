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

RUN cargo build --release --locked -p runvara

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --system --home /nonexistent --shell /usr/sbin/nologin runvara
RUN mkdir -p /data /config \
  && chown -R runvara:runvara /data /config

COPY --from=builder /app/target/release/runvara /usr/local/bin/runvara

# Keep source metadata after dependency and binary layers so a new commit label
# does not invalidate the slow apt or Rust build cache.
ARG RUNVARA_SOURCE_REVISION
ARG RUNVARA_SOURCE_STATE
ARG RUNVARA_VERSION
ARG RUNVARA_BUILD_DATE
LABEL org.opencontainers.image.title="Runvara" \
      org.opencontainers.image.description="Self-hosted multi-protocol model gateway" \
      org.opencontainers.image.source="https://github.com/tiammomo/Runvara" \
      org.opencontainers.image.revision="$RUNVARA_SOURCE_REVISION" \
      org.opencontainers.image.version="$RUNVARA_VERSION" \
      org.opencontainers.image.created="$RUNVARA_BUILD_DATE" \
      org.opencontainers.image.licenses="MIT" \
      io.runvara.source-state="$RUNVARA_SOURCE_STATE"

USER runvara

ENV RUNVARA_BIND=0.0.0.0:38082
ENV RUNVARA_STATE_DIR=/data
ENV RUNVARA_CONFIG=/config/config.toml
ENV RUST_LOG=runvara=info,tower_http=info

EXPOSE 38082
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:38082/livez >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/runvara"]
