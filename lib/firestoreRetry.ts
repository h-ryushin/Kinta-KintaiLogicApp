// Firestoreの通信が固まって無限ローディングにならないよう、タイムアウトと1回だけの自動リトライを付与するヘルパー

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRY_DELAY_MS = 1000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestoreの応答がありません（${timeoutMs}ms タイムアウト）`));
    }, timeoutMs);

    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function fetchWithRetry<T>(
  task: () => Promise<T>,
  { timeoutMs = DEFAULT_TIMEOUT_MS, retryDelayMs = DEFAULT_RETRY_DELAY_MS } = {}
): Promise<T> {
  try {
    return await withTimeout(task(), timeoutMs);
  } catch (firstError) {
    console.warn("Firestore取得に失敗、1回だけリトライします:", firstError);
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    return await withTimeout(task(), timeoutMs);
  }
}
