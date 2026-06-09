import{r as e}from"./rolldown-runtime-XQCOJYun.js";import{t}from"./client-BVg2rPJj.js";import{m as n,t as r}from"./react-vendor-Cnt8i-ME.js";import{n as i,t as a}from"./exportData-Cjq0m1R_.js";var o=e(n(),1),s=r();function c(e){return e?new Date(e).toLocaleString():`N/A`}function l(e){return e?e.replace(`_`,` `):``}function u(e){return e.map(e=>({Date:c(e.created_at),Action:l(e.action),Item:e.item?.name||`N/A`,User:e.user?.name||`System`,Notes:e.notes||``}))}function d(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)}function f(){let[e,n]=(0,o.useState)([]),[r,f]=(0,o.useState)(!0),[p,m]=(0,o.useState)(!1),[h,g]=(0,o.useState)(``),[_,v]=(0,o.useState)(``),[y,b]=(0,o.useState)(``),[x,S]=(0,o.useState)(1),[C,w]=(0,o.useState)(1),T=(0,o.useMemo)(()=>[`created`,`updated`,`deleted`,`assigned`,`returned`,`stock_in`,`stock_out`],[]),E=(0,o.useMemo)(()=>({search:_||void 0,action:y||void 0}),[y,_]);async function D(e=x){try{f(!0),g(``);let r=await t.get(`/activity-logs`,{params:{per_page:20,page:e,...E}});n(r.data.data||[]),S(r.data.current_page||1),w(r.data.last_page||1)}catch(e){console.error(`Failed to load activity logs`,e),g(`Failed to load activity logs.`)}finally{f(!1)}}(0,o.useEffect)(()=>{D(1)},[_,y]);async function O(){return a(`/activity-logs`,E)}async function k(){try{m(!0),g(``),i(`activity-logs.csv`,u(await O()))}catch(e){console.error(`Failed to export activity logs`,e),g(`Failed to export activity logs.`)}finally{m(!1)}}async function A(){try{m(!0),g(``);let e=u(await O()),t=[_?`Search: ${_}`:`Search: All`,y?`Action: ${l(y)}`:`Action: All`].join(` | `),n=e.length?e.map(e=>`
                    <tr>
                        <td>${d(e.Date)}</td>
                        <td>${d(e.Action)}</td>
                        <td>${d(e.Item)}</td>
                        <td>${d(e.User)}</td>
                        <td>${d(e.Notes)}</td>
                    </tr>
                `).join(``):`<tr><td colspan="5">No activity logs found.</td></tr>`,r=window.open(``,`_blank`);if(!r){g(`Allow pop-ups to export the PDF.`);return}r.document.write(`
                <!doctype html>
                <html>
                    <head>
                        <title>Activity Logs</title>
                        <style>
                            body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
                            h1 { margin: 0 0 6px; font-size: 24px; }
                            p { margin: 0 0 18px; color: #475569; font-size: 12px; }
                            table { border-collapse: collapse; width: 100%; font-size: 11px; }
                            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
                            th { background: #f1f5f9; font-weight: 700; }
                        </style>
                    </head>
                    <body>
                        <h1>Activity Logs</h1>
                        <p>${d(t)}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Action</th>
                                    <th>Item</th>
                                    <th>User</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>${n}</tbody>
                        </table>
                    </body>
                </html>
            `),r.document.close(),r.focus(),r.print()}catch(e){console.error(`Failed to export activity logs PDF`,e),g(`Failed to export activity logs PDF.`)}finally{m(!1)}}return(0,s.jsxs)(`div`,{className:`space-y-6`,children:[(0,s.jsx)(`div`,{className:`flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between`,children:(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`h1`,{className:`text-3xl font-bold text-slate-900`,children:`Activity Logs`}),(0,s.jsx)(`p`,{className:`mt-1 text-sm text-slate-500`,children:`Audit trail of asset actions, stock operations, and assignment changes.`})]})}),h?(0,s.jsx)(`div`,{className:`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700`,children:h}):null,(0,s.jsxs)(`div`,{className:`grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4`,children:[(0,s.jsx)(`input`,{value:_,onChange:e=>v(e.target.value),placeholder:`Search by action, item, user, or notes`,className:`rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring`}),(0,s.jsxs)(`select`,{value:y,onChange:e=>b(e.target.value),className:`rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring`,children:[(0,s.jsx)(`option`,{value:``,children:`All actions`}),T.map(e=>(0,s.jsx)(`option`,{value:e,children:l(e)},e))]}),(0,s.jsx)(`button`,{type:`button`,onClick:()=>void D(1),className:`btn-secondary`,children:`Refresh`}),(0,s.jsxs)(`div`,{className:`grid grid-cols-2 gap-3`,children:[(0,s.jsx)(`button`,{type:`button`,onClick:k,disabled:p,className:`btn-secondary disabled:cursor-not-allowed disabled:opacity-60`,children:p?`Exporting...`:`CSV`}),(0,s.jsx)(`button`,{type:`button`,onClick:A,disabled:p,className:`btn-secondary disabled:cursor-not-allowed disabled:opacity-60`,children:`PDF`})]})]}),(0,s.jsx)(`div`,{className:`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`,children:r?(0,s.jsx)(`div`,{className:`px-6 py-10 text-center text-slate-500`,children:`Loading activity logs...`}):e.length===0?(0,s.jsx)(`div`,{className:`px-6 py-10 text-center text-slate-500`,children:`No activity logs found.`}):(0,s.jsx)(`div`,{className:`overflow-x-auto`,children:(0,s.jsxs)(`table`,{className:`min-w-full divide-y divide-slate-200 text-sm`,children:[(0,s.jsx)(`thead`,{className:`bg-slate-50`,children:(0,s.jsxs)(`tr`,{children:[(0,s.jsx)(`th`,{className:`px-4 py-3 text-left font-semibold text-slate-700`,children:`Date`}),(0,s.jsx)(`th`,{className:`px-4 py-3 text-left font-semibold text-slate-700`,children:`Action`}),(0,s.jsx)(`th`,{className:`px-4 py-3 text-left font-semibold text-slate-700`,children:`Item`}),(0,s.jsx)(`th`,{className:`px-4 py-3 text-left font-semibold text-slate-700`,children:`User`}),(0,s.jsx)(`th`,{className:`px-4 py-3 text-left font-semibold text-slate-700`,children:`Notes`})]})}),(0,s.jsx)(`tbody`,{className:`divide-y divide-slate-100`,children:e.map(e=>(0,s.jsxs)(`tr`,{className:`hover:bg-slate-50/70`,children:[(0,s.jsx)(`td`,{className:`px-4 py-3 text-slate-600`,children:c(e.created_at)}),(0,s.jsx)(`td`,{className:`px-4 py-3 font-medium text-slate-900`,children:e.action}),(0,s.jsx)(`td`,{className:`px-4 py-3 text-slate-700`,children:e.item?.name||`N/A`}),(0,s.jsx)(`td`,{className:`px-4 py-3 text-slate-700`,children:e.user?.name||`System`}),(0,s.jsx)(`td`,{className:`px-4 py-3 text-slate-600`,children:e.notes||`—`})]},e.id))})]})})}),(0,s.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,s.jsx)(`button`,{type:`button`,disabled:x<=1||r,onClick:()=>void D(x-1),className:`btn-secondary disabled:cursor-not-allowed disabled:opacity-50`,children:`Previous`}),(0,s.jsxs)(`span`,{className:`text-sm text-slate-600`,children:[`Page `,x,` of `,C]}),(0,s.jsx)(`button`,{type:`button`,disabled:x>=C||r,onClick:()=>void D(x+1),className:`btn-secondary disabled:cursor-not-allowed disabled:opacity-50`,children:`Next`})]})]})}export{f as default};