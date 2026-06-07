# syntax=docker/dockerfile:1

FROM rust:1-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --system --home /nonexistent --shell /usr/sbin/nologin runvara

COPY --from=builder /app/target/release/runvara /usr/local/bin/runvara

USER runvara

ENV RUNVARA_BIND=0.0.0.0:17878
ENV RUST_LOG=runvara=info,tower_http=info

EXPOSE 17878

ENTRYPOINT ["/usr/local/bin/runvara"]
