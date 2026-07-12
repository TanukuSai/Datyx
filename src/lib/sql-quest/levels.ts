// SQL Quest — level catalog.
// Each level is fully self-contained: seed schema + rows, task, expected output.
// Add more entries to grow past 20; the engine handles up to 100.

export type Tier = "beginner" | "intermediate" | "advanced" | "expert";

export interface Level {
  id: number;
  tier: Tier;
  title: string;
  brief: string;
  task: string;
  xp: number;
  setup: string; // SQL executed before the user's query (schema + inserts).
  solution: string; // Reference SQL used to compute the expected output.
  hints: string[];
  starter?: string;
  orderMatters?: boolean; // default: true when the task specifies an order.
}

// Compact set covering the four tiers. Users can extend to 100 by appending.
export const LEVELS: Level[] = [
  {
    id: 1,
    tier: "beginner",
    title: "Meet your data",
    brief: "SELECT everything",
    task: "Return every column and every row from the `users` table.",
    xp: 10,
    setup: `
      CREATE TABLE users (id INTEGER, name TEXT, city TEXT);
      INSERT INTO users VALUES (1,'Aditi','Delhi'),(2,'Kabir','Mumbai'),(3,'Meera','Pune');
    `,
    solution: "SELECT * FROM users;",
    starter: "SELECT * FROM users;",
    hints: ["`SELECT *` returns every column.", "No WHERE clause needed."],
    orderMatters: false,
  },
  {
    id: 2,
    tier: "beginner",
    title: "Pick your columns",
    brief: "Project specific columns",
    task: "Return `name` and `city` for every user.",
    xp: 10,
    setup: `
      CREATE TABLE users (id INTEGER, name TEXT, city TEXT);
      INSERT INTO users VALUES (1,'Aditi','Delhi'),(2,'Kabir','Mumbai'),(3,'Meera','Pune');
    `,
    solution: "SELECT name, city FROM users;",
    hints: ["List column names comma-separated after SELECT."],
    orderMatters: false,
  },
  {
    id: 3,
    tier: "beginner",
    title: "Filter with WHERE",
    brief: "Only Mumbai users",
    task: "Return `id` and `name` of users whose city is `Mumbai`.",
    xp: 15,
    setup: `
      CREATE TABLE users (id INTEGER, name TEXT, city TEXT);
      INSERT INTO users VALUES (1,'Aditi','Delhi'),(2,'Kabir','Mumbai'),(3,'Meera','Pune'),(4,'Rohan','Mumbai');
    `,
    solution: "SELECT id, name FROM users WHERE city = 'Mumbai';",
    hints: ["Strings use single quotes in SQL.", "Use `WHERE city = 'Mumbai'`."],
    orderMatters: false,
  },
  {
    id: 4,
    tier: "beginner",
    title: "Order it",
    brief: "Sort by price descending",
    task: "Return `name` and `price` from `products` sorted by price from highest to lowest.",
    xp: 15,
    setup: `
      CREATE TABLE products (id INTEGER, name TEXT, price INTEGER);
      INSERT INTO products VALUES (1,'Keyboard',2200),(2,'Mouse',900),(3,'Monitor',18500),(4,'Cable',150);
    `,
    solution: "SELECT name, price FROM products ORDER BY price DESC;",
    hints: ["`ORDER BY price DESC`."],
  },
  {
    id: 5,
    tier: "beginner",
    title: "Top 3",
    brief: "LIMIT the results",
    task: "Return the 3 most expensive products (`name`, `price`).",
    xp: 15,
    setup: `
      CREATE TABLE products (id INTEGER, name TEXT, price INTEGER);
      INSERT INTO products VALUES (1,'Keyboard',2200),(2,'Mouse',900),(3,'Monitor',18500),(4,'Cable',150),(5,'Chair',9500);
    `,
    solution: "SELECT name, price FROM products ORDER BY price DESC LIMIT 3;",
    hints: ["Combine `ORDER BY` with `LIMIT`."],
  },
  {
    id: 6,
    tier: "beginner",
    title: "Between values",
    brief: "Range filter",
    task: "Return `id`, `user_id`, `amount` of orders with amount BETWEEN 3000 AND 7000, ordered by amount descending.",
    xp: 20,
    setup: `
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,7,500),(2,3,3200),(3,8,6800),(4,2,7200),(5,5,4400);
    `,
    solution: "SELECT id, user_id, amount FROM orders WHERE amount BETWEEN 3000 AND 7000 ORDER BY amount DESC;",
    hints: ["`WHERE amount BETWEEN a AND b` is inclusive."],
  },
  {
    id: 7,
    tier: "beginner",
    title: "Pattern match",
    brief: "LIKE operator",
    task: "Return names of users whose `email` ends with `@datyx.club`.",
    xp: 20,
    setup: `
      CREATE TABLE users (name TEXT, email TEXT);
      INSERT INTO users VALUES ('Aditi','aditi@datyx.club'),('Kabir','kabir@gmail.com'),('Meera','meera@datyx.club');
    `,
    solution: "SELECT name FROM users WHERE email LIKE '%@datyx.club';",
    hints: ["`LIKE '%pattern'` matches suffixes.", "`%` is a wildcard."],
    orderMatters: false,
  },
  {
    id: 8,
    tier: "beginner",
    title: "Distinct cities",
    brief: "Remove duplicates",
    task: "Return each distinct city from `users`.",
    xp: 15,
    setup: `
      CREATE TABLE users (name TEXT, city TEXT);
      INSERT INTO users VALUES ('A','Delhi'),('B','Mumbai'),('C','Delhi'),('D','Pune'),('E','Mumbai');
    `,
    solution: "SELECT DISTINCT city FROM users;",
    hints: ["`SELECT DISTINCT column ...`."],
    orderMatters: false,
  },
  {
    id: 9,
    tier: "intermediate",
    title: "Count rows",
    brief: "Simple aggregate",
    task: "Return a single column `total` with the number of rows in `orders`.",
    xp: 20,
    setup: `
      CREATE TABLE orders (id INTEGER);
      INSERT INTO orders VALUES (1),(2),(3),(4),(5),(6),(7);
    `,
    solution: "SELECT COUNT(*) AS total FROM orders;",
    hints: ["`COUNT(*)` counts rows.", "Use `AS total` to alias the column."],
  },
  {
    id: 10,
    tier: "intermediate",
    title: "Sum by group",
    brief: "GROUP BY",
    task: "For each `user_id`, return `user_id` and `total_amount` (sum of amounts). Sort by user_id ascending.",
    xp: 25,
    setup: `
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,1,500),(2,1,700),(3,2,1200),(4,3,300),(5,2,800),(6,3,1500);
    `,
    solution: "SELECT user_id, SUM(amount) AS total_amount FROM orders GROUP BY user_id ORDER BY user_id;",
    hints: ["`GROUP BY user_id`.", "`SUM(amount) AS total_amount`."],
  },
  {
    id: 11,
    tier: "intermediate",
    title: "Big spenders",
    brief: "HAVING clause",
    task: "Return `user_id` and `total_amount` where the total spent by a user is greater than 1000. Sort by total_amount descending.",
    xp: 25,
    setup: `
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,1,500),(2,1,700),(3,2,1200),(4,3,300),(5,2,800),(6,3,1500);
    `,
    solution: "SELECT user_id, SUM(amount) AS total_amount FROM orders GROUP BY user_id HAVING SUM(amount) > 1000 ORDER BY total_amount DESC;",
    hints: ["Filter aggregates with `HAVING`, not `WHERE`."],
  },
  {
    id: 12,
    tier: "intermediate",
    title: "Average by city",
    brief: "AVG aggregate",
    task: "For each `city`, return `city` and `avg_age` (rounded to nearest integer) of the users in that city. Sort by city ascending.",
    xp: 25,
    setup: `
      CREATE TABLE users (name TEXT, city TEXT, age INTEGER);
      INSERT INTO users VALUES ('A','Delhi',22),('B','Delhi',28),('C','Mumbai',35),('D','Mumbai',25),('E','Pune',30);
    `,
    solution: "SELECT city, CAST(ROUND(AVG(age)) AS INTEGER) AS avg_age FROM users GROUP BY city ORDER BY city;",
    hints: ["`AVG(age)` gives the mean.", "`ROUND(...)` rounds it."],
  },
  {
    id: 13,
    tier: "intermediate",
    title: "INNER JOIN",
    brief: "Combine two tables",
    task: "Return `users.name` and `orders.amount` for every order, sorted by amount descending.",
    xp: 30,
    setup: `
      CREATE TABLE users (id INTEGER, name TEXT);
      INSERT INTO users VALUES (1,'Aditi'),(2,'Kabir'),(3,'Meera');
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (10,1,900),(11,2,1400),(12,1,300),(13,3,700);
    `,
    solution: "SELECT u.name, o.amount FROM users u INNER JOIN orders o ON o.user_id = u.id ORDER BY o.amount DESC;",
    hints: ["`INNER JOIN ... ON o.user_id = u.id`."],
  },
  {
    id: 14,
    tier: "intermediate",
    title: "LEFT JOIN — every user",
    brief: "Preserve the left side",
    task: "Return `name` and `amount` for every user, including users with no orders (amount will be NULL). Sort by name ascending.",
    xp: 30,
    setup: `
      CREATE TABLE users (id INTEGER, name TEXT);
      INSERT INTO users VALUES (1,'Aditi'),(2,'Kabir'),(3,'Meera'),(4,'Rohan');
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (10,1,900),(11,2,1400),(12,1,300);
    `,
    solution: "SELECT u.name, o.amount FROM users u LEFT JOIN orders o ON o.user_id = u.id ORDER BY u.name, o.amount;",
    hints: ["`LEFT JOIN` keeps all rows from the left table."],
  },
  {
    id: 15,
    tier: "advanced",
    title: "Subquery in WHERE",
    brief: "Users who spent above average",
    task: "Return `id`, `name` of users whose total spend is strictly greater than the average total spend across all users. Sort by id ascending.",
    xp: 35,
    setup: `
      CREATE TABLE users (id INTEGER, name TEXT);
      INSERT INTO users VALUES (1,'A'),(2,'B'),(3,'C'),(4,'D');
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,1,100),(2,1,200),(3,2,1000),(4,3,50),(5,4,900),(6,4,900);
    `,
    solution: `
      SELECT id, name FROM users
      WHERE id IN (
        SELECT user_id FROM orders
        GROUP BY user_id
        HAVING SUM(amount) > (
          SELECT AVG(total) FROM (SELECT SUM(amount) AS total FROM orders GROUP BY user_id)
        )
      )
      ORDER BY id;
    `,
    hints: [
      "Compute each user's total, then compare against the average total.",
      "You can nest a subquery inside AVG().",
    ],
  },
  {
    id: 16,
    tier: "advanced",
    title: "CASE buckets",
    brief: "Conditional labels",
    task: "For each order return `id`, `amount`, and a `bucket` column: 'small' when amount<500, 'medium' when 500-1500, else 'large'. Sort by id ascending.",
    xp: 35,
    setup: `
      CREATE TABLE orders (id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,200),(2,800),(3,1500),(4,50),(5,4200);
    `,
    solution: `
      SELECT id, amount,
        CASE
          WHEN amount < 500 THEN 'small'
          WHEN amount BETWEEN 500 AND 1500 THEN 'medium'
          ELSE 'large'
        END AS bucket
      FROM orders ORDER BY id;
    `,
    hints: ["`CASE WHEN ... THEN ... ELSE ... END`.", "Alias with `AS bucket`."],
  },
  {
    id: 17,
    tier: "advanced",
    title: "Second highest",
    brief: "Distinct rank via subquery",
    task: "Return the second-highest DISTINCT `price` from `products` as a column named `second_price`.",
    xp: 40,
    setup: `
      CREATE TABLE products (id INTEGER, name TEXT, price INTEGER);
      INSERT INTO products VALUES (1,'A',100),(2,'B',300),(3,'C',300),(4,'D',250),(5,'E',450);
    `,
    solution: `
      SELECT MAX(price) AS second_price FROM products
      WHERE price < (SELECT MAX(price) FROM products);
    `,
    hints: ["Get MAX price below the overall MAX."],
  },
  {
    id: 18,
    tier: "expert",
    title: "Window: rank customers",
    brief: "ROW_NUMBER over PARTITION",
    task: "For each `user_id`, return `user_id`, `id` (order id), `amount`, and `rn` — the row_number ordering by amount DESC within each user. Sort by user_id, rn.",
    xp: 45,
    setup: `
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,1,300),(2,1,900),(3,1,500),(4,2,200),(5,2,700);
    `,
    solution: `
      SELECT user_id, id, amount,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn
      FROM orders
      ORDER BY user_id, rn;
    `,
    hints: ["`ROW_NUMBER() OVER (PARTITION BY x ORDER BY y DESC)`."],
  },
  {
    id: 19,
    tier: "expert",
    title: "CTE + running total",
    brief: "WITH + SUM window",
    task: "For each order (sorted by id ascending), return `id`, `amount`, and `running_total` — the cumulative sum of amount up to that id.",
    xp: 50,
    setup: `
      CREATE TABLE orders (id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,100),(2,250),(3,50),(4,400),(5,200);
    `,
    solution: `
      WITH o AS (SELECT id, amount FROM orders)
      SELECT id, amount, SUM(amount) OVER (ORDER BY id) AS running_total
      FROM o
      ORDER BY id;
    `,
    hints: ["`SUM(...) OVER (ORDER BY id)` is a running total."],
  },
  {
    id: 20,
    tier: "expert",
    title: "Top-N per group",
    brief: "Only the top-2 orders per user",
    task: "Return `user_id`, `id`, `amount` for the TOP 2 orders per user by amount. Sort by user_id ascending, amount descending.",
    xp: 55,
    setup: `
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,1,300),(2,1,900),(3,1,500),(4,2,200),(5,2,700),(6,2,650),(7,2,50);
    `,
    solution: `
      SELECT user_id, id, amount FROM (
        SELECT user_id, id, amount,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn
        FROM orders
      ) WHERE rn <= 2
      ORDER BY user_id, amount DESC;
    `,
    hints: ["Wrap `ROW_NUMBER()` in a subquery and filter `rn <= 2`."],
  },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export const LEVEL_COUNT_TOTAL = 100; // Roadmap target; seeded so far: LEVELS.length.
