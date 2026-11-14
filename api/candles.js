export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const candlesUrl =
    "https://neoxa.exchange/api/exchange/candles/BTCB2_USDC";

  const tickerUrl =
    "https://neoxa.exchange/api/exchange/ticker/BTCB2_USDC";

  try {
    const [candlesResponse, tickerResponse] = await Promise.all([
      fetch(candlesUrl, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      }),

      fetch(tickerUrl, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      })
    ]);

    const candlesBody = await candlesResponse.text();
    const tickerBody = await tickerResponse.text();

    if (!candlesResponse.ok) {
      return res.status(candlesResponse.status).json({
        error: "NeoxEX candles API error",
        upstreamStatus: candlesResponse.status,
        details: candlesBody.slice(0, 2000)
      });
    }

    if (!tickerResponse.ok) {
      return res.status(tickerResponse.status).json({
        error: "NeoxEX ticker API error",
        upstreamStatus: tickerResponse.status,
        details: tickerBody.slice(0, 2000)
      });
    }

    let candles;
    let ticker;

    try {
      candles = JSON.parse(candlesBody);
      ticker = JSON.parse(tickerBody);
    } catch (error) {
      return res.status(502).json({
        error: "Invalid JSON received from NeoxEX",
        details: error.message
      });
    }

    const quoteVolume24h = Number(
      ticker?.ticker?.quoteVolume24h
    );

    if (
      ticker?.success !== true ||
      !Number.isFinite(quoteVolume24h) ||
      quoteVolume24h < 0
    ) {
      return res.status(502).json({
        error: "Invalid USDC quote volume",
        details: ticker
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=30"
    );

    return res.status(200).json({
      success: true,
      candles,
      ticker: {
        quoteVolume24h,
        lastPrice: Number(ticker.ticker.lastPrice),
        trades24h: Number(ticker.ticker.trades24h),
        computedAt: Number(ticker.ticker.computedAt)
      }
    });

  } catch (error) {
    return res.status(502).json({
      error: "Could not connect to NeoxEX",
      details: error.message
    });
  }
}
