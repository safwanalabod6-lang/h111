export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {status: 204, headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,PUT,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }});
    }

    // GET all invoices
    if (path === "/api/invoices" && request.method === "GET") {
      const list = await env.FACTURES.list({ prefix: "invoice:" });
      const invoices = [];
      for (const k of list.keys) {
        const v = await env.FACTURES.get(k.name);
        if(v) invoices.push(JSON.parse(v));
      }
      return new Response(JSON.stringify(invoices), { status: 200, headers: { "Content-Type": "application/json","Access-Control-Allow-Origin":"*" } });
    }

    // GET single invoice by ?number=xxx
    if (path === "/api/invoice" && request.method === "GET") {
      const num = url.searchParams.get("number");
      if (!num) return new Response(JSON.stringify({ error: "missing number" }), { status: 400, headers: { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }});
      const v = await env.FACTURES.get(`invoice:${num}`);
      if (!v) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }});
      return new Response(v, { status: 200, headers: { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }});
    }

    // POST create or update invoice
    if (path === "/api/invoice" && request.method === "POST") {
      let data = await request.json().catch(()=>null);
      if(!data || !data.number) return new Response(JSON.stringify({error:"missing number"}),{status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
      await env.FACTURES.put(`invoice:${data.number}`, JSON.stringify(data));
      return new Response(JSON.stringify({ok:true}),{status:200, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    }

    // DELETE invoice
    if(path==="/api/invoice" && request.method==="DELETE"){
      let data = await request.json().catch(()=>null);
      if(!data || !data.number) return new Response(JSON.stringify({error:"missing number"}),{status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
      await env.FACTURES.delete(`invoice:${data.number}`);
      return new Response(JSON.stringify({ok:true}),{status:200, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    }

    return new Response("Not found",{status:404});
  }
};
