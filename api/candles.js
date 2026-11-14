
export default async function handler(req,res) {
  if(req.method!=="GET") {
    return res.status(405).json({error:"Method not allowed"});
  }

  const apiUrl="https://neoxa.exchange/api/exchange/candles/BTCB2_USDC";

  try {
    const response=await fetch(apiUrl,{
      method:"GET",
      headers:{Accept:"application/json"},
      cache:"no-store"
    });

    const body=await response.text();

    res.setHeader("Content-Type","application/json");
    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=30");

    if(!response.ok) {
      return res.status(response.status).json({
        error:"NeoxEX API error",
        upstreamStatus:response.status,
        details:body.slice(0,2000)
      });
    }

    return res.status(200).send(body);

  } catch(error) {
    return res.status(502).json({
      error:"Could not connect to NeoxEX",
      details:error.message
    });
  }
}
