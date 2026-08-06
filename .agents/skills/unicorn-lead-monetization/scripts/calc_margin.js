#!/usr/bin/env node
const ppaPrice = parseFloat(process.argv[2]) || 150.00;
const cplCost = parseFloat(process.argv[3]) || 24.54;

const netProfit = ppaPrice - cplCost;
const marginPercent = ((netProfit / ppaPrice) * 100).toFixed(1);

console.log(`[Unicorn Margin Calculator]`);
console.log(`PPA Price: $${ppaPrice.toFixed(2)}`);
console.log(`CPL Cost: $${cplCost.toFixed(2)}`);
console.log(`Net Profit: $${netProfit.toFixed(2)} (${marginPercent}% margin)`);
