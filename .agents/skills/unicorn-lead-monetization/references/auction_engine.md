# Unicorn Pro Auction Engine Reference

## Vickrey Second-Price Auction Model

The PPA Auction Engine uses a modified Vickrey 2nd-price auction model:
- Minimum Reserve Floor: $120.00 PPA
- Standard Target Price: $150.00 PPA
- Instant Buy-It-Now: $185.00 PPA

## Ping-Post Waterfall Sequence

1. **Tier 1 (Direct Contractor PPA)**: Local contractors in target ZIP. Price: $150 PPA.
2. **Tier 2 (QuinStreet API)**: Primary national aggregator. Price: $24.54 CPL.
3. **Tier 3 (Modernize / NetWorx)**: Secondary waterfall. Price: $18.50 CPL.
