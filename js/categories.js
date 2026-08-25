// Category taxonomy for the 50/30/20 rule.
// CATEGORY_BUCKET maps every expense category to the bucket it counts
// against; BUCKET_PCT holds the target percentage of income for each bucket.

const CATEGORY_BUCKET = {
  'Rent/Mortgage': 'Needs',
  'Utilities': 'Needs',
  'Groceries': 'Needs',
  'Insurance': 'Needs',
  'Transport': 'Needs',
  'Debt Payment': 'Needs',

  'Entertainment': 'Wants',
  'Dining Out': 'Wants',
  'Shopping': 'Wants',
  'Travel': 'Wants',
  'Subscriptions': 'Wants',
  'Hobbies': 'Wants',

  'Savings/Investments': 'Savings',
  'Emergency Fund': 'Savings',
  'Extra Debt Payoff': 'Savings',
};

const BUCKET_PCT = { Needs: 0.5, Wants: 0.3, Savings: 0.2 };
