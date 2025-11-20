let items = [];
let editing = null;

function updateItemsTable(){
  const tbody = document.querySelector("#itemsTable tbody");
  tbody.innerHTML = "";
  let total = 0;
  items.forEach((it, idx)=>{
    it.total = (Number(it.price)||0)*(Number(it.qty)||0);
    total += it.total;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input value="${it.name||''}" oninput="onItemChange(${idx},'name',this.value)"></td>
                    <td><input type='number' value='${it.price||0}' oninput="onItemChange(${idx},'price',this.value)"></td>
                    <td><input type='number' value='${it.qty||1}' oninput="onItemChange(${idx},'qty',this.value)"></td>
                    <td>${it.total}</td>
                    <td><button onclick="removeItem(${idx})" class="secondary">حذف</button></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("totalSum").innerText = total;
}

function onItemChange(idx,key,value){ items[idx][key]=key==='price'||key==='qty'?Number(value):value; updateItemsTable(); }
function addItem(){ items.push({name:'',price:0,qty:1,total:0}); updateItemsTable(); }
function removeItem(idx){ items.splice(idx,1); updateItemsTable(); }

function clearForm(){
  editing=null; items=[{name:'',price:0,qty:1,total:0}];
  document.getElementById("invoiceNumber").value="";
  document.getElementById("clientName").value="";
  document.getElementById("invoiceDate").value=new Date().toISOString().slice(0,10);
  document.getElementById("invoiceStatus").value="debt";
  updateItemsTable();
}

async function saveInvoice(){
  const number=document.getElementById("invoiceNumber").value.trim();
  if(!number){alert("ادخل رقم الفاتورة"); return;}
  const invoice={
    number,
    client:document.getElementById("clientName").value||"",
    date:document.getElementById("invoiceDate").value||new Date().toISOString().slice(0,10),
    status:document.getElementById("invoiceStatus").value||"debt",
    items,
    total: items.reduce((s,i)=>s+(Number(i.total)||0),0)
  };
  await fetch("/api/invoice",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(invoice)});
  clearForm(); fetchInvoices();
}

async function fetchInvoices(){
  const res = await fetch("/api/invoices");
  if(!res.ok){ console.error("failed to fetch"); return; }
  const data = await res.json();
  renderInvoices(data);
}

function renderInvoices(invoices){
  const container=document.getElementById("invoicesList"); container.innerHTML="";
  let debt=0, paid=0;
  invoices.sort((a,b)=>(a.number||"").localeCompare(b.number||""));
  invoices.forEach(inv=>{
    const card=document.createElement("div"); card.className="invoice-card "+(inv.status==="paid"?"paid":"debt");
    const meta=document.createElement("div"); meta.className="invoice-meta";
    meta.innerHTML=`<div><strong>#${inv.number}</strong> - ${inv.client}</div><div>${inv.date} - ${inv.status}</div>`;
    let itemsHtml="<table style='width:100%;border-collapse:collapse'><thead><tr><th>القطعة</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead><tbody>";
    (inv.items||[]).forEach(it=>{ itemsHtml+=`<tr><td>${it.name}</td><td>${it.price}</td><td>${it.qty}</td><td>${it.total}</td></tr>`; });
    itemsHtml+="</tbody></table>";
    const actions=document.createElement("div"); actions.className="invoice-actions";
    actions.innerHTML=`<button onclick='startEdit(${JSON.stringify(inv)})'>تعديل</button>
                       <button onclick='deleteInvoice("${inv.number}")' class='secondary'>حذف</button>`;
    card.appendChild(meta); card.innerHTML+=itemsHtml; card.appendChild(actions); container.appendChild(card);
    if(inv.status==="debt") debt+=Number(inv.total)||0; else paid+=Number(inv.total)||0;
  });
  document.getElementById("totalDebt").innerText=debt;
  document.getElementById("totalPaid").innerText=paid;
}

function startEdit(inv){
  editing=inv.number;
  document.getElementById("invoiceNumber").value=inv.number;
  document.getElementById("clientName").value=inv.client;
  document.getElementById("invoiceDate").value=inv.date;
  document.getElementById("invoiceStatus").value=inv.status;
  items=JSON.parse(JSON.stringify(inv.items||[]));
  updateItemsTable();
}

async function deleteInvoice(number){
  if(!confirm("هل تريد حذف الفاتورة؟")) return;
  await fetch("/api/invoice",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({number})});
  fetchInvoices();
}

document.getElementById("addItemBtn").addEventListener("click",addItem);
document.getElementById("saveInvoiceBtn").addEventListener("click",saveInvoice);
document.getElementById("clearFormBtn").addEventListener("click",clearForm);
document.getElementById("searchInput").addEventListener("input", function(){
  const term=this.value.toLowerCase();
  document.querySelectorAll("#invoicesList .invoice-card").forEach(card=>{card.style.display=card.innerText.toLowerCase().includes(term)?"":"none";});
});

clearForm(); fetchInvoices();
