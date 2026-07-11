#[tokio::main]
async fn main() -> Result<(), runvara::AppError> {
    runvara::run(std::env::args().skip(1).collect()).await
}
