# Sales, returns and profit & loss charts

## What you'll get
A new **Reports** section in the admin panel, with a date filter at the top: last 7 days, 30 days, 90 days, 12 months, or a custom range.

1. **Summary cards:** total sales, number of orders, returns (count and money), cost of goods sold, and net profit or loss with its margin %.
2. **Sales & returns chart:** bars for sales and returns, shown day by day (or month by month for longer ranges).
3. **Profit & loss chart:** a line chart of sales, costs and profit over time. Days with a loss show in red.
4. **Product breakdown table:** each pack size with units sold, sales, cost, profit and margin, sortable by any column.

## How it works
- **Cost price:** each pack size gets a new "Cost price" box in the product editor's Pricing & stock tab. Profit is calculated as selling price minus cost price for each item sold.
- **Cost at time of sale:** each order saves the cost price at the moment of purchase, so changing a cost later doesn't rewrite past profit.
- **Returns:** orders get a new **Returned** status. When you mark an order Returned, its money moves from sales to returns, and it is no longer counted as profit.
- **Cancelled orders:** these are left out of all numbers.
- **Missing cost price:** pack sizes with no cost price are counted with ₹0 cost, and the report shows a warning listing which ones still need a cost price.
- **Dashboard:** the main dashboard also gets a small 30-day sales chart.

## Technical details
- Database: add a `cost_price` integer column to `product_variants` (default 0) and a `unit_cost` integer column to `order_items` (default 0). Add `returned` to the `order_status` enum.
- Checkout fills in `unit_cost` on the server from the variant's current cost.
- Admin data adds `cost_price` to variants and `unit_cost` and `created_at` to orders and their items. All totals are calculated in the browser from this data.
- A new `ReportsPanel` in `src/components/admin/` uses the existing charts component and recharts, and the admin menu gets a Reports entry.
- Status pickers for orders include "returned".
