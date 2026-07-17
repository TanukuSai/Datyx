// SQL Quest — level catalog.
// Each level is fully self-contained: seed schema + rows, task, expected output.

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

export const LEVELS: Level[] = [
  {
    id: 1,
    tier: "beginner",
    title: "Meet your data",
    brief: "SELECT everything",
    task: `📚 THEORY:
To retrieve data from a database table, we use the SELECT statement.
The asterisk (*) is a wildcard character that represents "all columns".
The FROM clause specifies which table to query from.

SYNTAX:
SELECT * FROM table_name;

🎯 TASK:
Write a query to return all columns and all rows from the \`users\` table.`,
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
    brief: "Project columns",
    task: `📚 THEORY:
Instead of retrieving all columns with *, you can list the exact columns you need, separated by commas. This reduces network traffic and speeds up queries.

SYNTAX:
SELECT column1, column2 FROM table_name;

🎯 TASK:
Write a query to return only the \`name\` and \`city\` columns for all users in the \`users\` table.`,
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
    task: `📚 THEORY:
To select only specific rows that meet a condition, we use the WHERE clause.
Strings (text values) in SQL must be enclosed in single quotes ('...').

SYNTAX:
SELECT column1 FROM table_name WHERE column2 = 'value';

🎯 TASK:
Write a query to return the \`id\` and \`name\` of all users whose city is exactly 'Mumbai'.`,
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
    title: "Sorting rows",
    brief: "Order by price",
    task: `📚 THEORY:
By default, databases return rows in arbitrary order. Use ORDER BY to sort them.
Add DESC at the end to sort from highest to lowest (descending), or ASC (default) for lowest to highest (ascending).

SYNTAX:
SELECT columns FROM table_name ORDER BY column_name DESC;

🎯 TASK:
Write a query to return the \`name\` and \`price\` of all products from the \`products\` table, sorted by \`price\` from highest to lowest.`,
    xp: 15,
    setup: `
      CREATE TABLE products (id INTEGER, name TEXT, price INTEGER);
      INSERT INTO products VALUES (1,'Keyboard',2200),(2,'Mouse',900),(3,'Monitor',18500),(4,'Cable',150);
    `,
    solution: "SELECT name, price FROM products ORDER BY price DESC;",
    hints: ["Use `ORDER BY price DESC`."],
  },
  {
    id: 5,
    tier: "beginner",
    title: "Top results",
    brief: "LIMIT findings",
    task: `📚 THEORY:
To restrict the number of rows returned by a query, use the LIMIT clause.
This is extremely useful when combined with ORDER BY to find the "top N" or "highest N" records.

SYNTAX:
SELECT columns FROM table_name ORDER BY column_name DESC LIMIT count;

🎯 TASK:
Write a query to find the 3 most expensive products from the \`products\` table. Return their \`name\` and \`price\`.`,
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
    title: "Pattern matching",
    brief: "LIKE operator",
    task: `📚 THEORY:
To search for a pattern in text, use the LIKE operator with wildcards:
- % represents zero, one, or multiple characters.
- _ represents a single character.

SYNTAX:
SELECT columns FROM table_name WHERE column LIKE 'pattern%';

🎯 TASK:
Write a query to return the \`name\` of all users in the \`users\` table whose \`email\` ends with '@datyx.club'.`,
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
    id: 7,
    tier: "beginner",
    title: "Distinct values",
    brief: "Remove duplicates",
    task: `📚 THEORY:
If a column contains duplicate values, you can use the DISTINCT keyword immediately after SELECT to filter out the duplicates and return only unique values.

SYNTAX:
SELECT DISTINCT column_name FROM table_name;

🎯 TASK:
Write a query to return each unique (distinct) city from the \`users\` table.`,
    xp: 15,
    setup: `
      CREATE TABLE users (name TEXT, city TEXT);
      INSERT INTO users VALUES ('A','Delhi'),('B','Mumbai'),('C','Delhi'),('D','Pune'),('E','Mumbai');
    `,
    solution: "SELECT DISTINCT city FROM users;",
    hints: ["Use `SELECT DISTINCT city`."],
    orderMatters: false,
  },
  {
    id: 8,
    tier: "intermediate",
    title: "Count rows",
    brief: "Count aggregate",
    task: `📚 THEORY:
Aggregate functions perform calculations on multiple rows and return a single value.
COUNT(*) counts the total number of rows returned by the query.
Use AS to give the aggregate column a friendly alias name.

SYNTAX:
SELECT COUNT(*) AS alias_name FROM table_name;

🎯 TASK:
Write a query to count the total number of rows in the \`orders\` table. Name the output column \`total\`.`,
    xp: 20,
    setup: `
      CREATE TABLE orders (id INTEGER);
      INSERT INTO orders VALUES (1),(2),(3),(4),(5),(6),(7);
    `,
    solution: "SELECT COUNT(*) AS total FROM orders;",
    hints: ["`COUNT(*)` counts rows.", "Use `AS total` to alias the column."],
  },
  {
    id: 9,
    tier: "intermediate",
    title: "Grouping aggregates",
    brief: "GROUP BY sums",
    task: `📚 THEORY:
To calculate aggregates (like SUM, AVG, COUNT) for different categories, use the GROUP BY clause.
This groups rows that have the same values into summary rows.

SYNTAX:
SELECT category, SUM(value) FROM table_name GROUP BY category;

🎯 TASK:
For each \`user_id\` in the \`orders\` table, calculate the total spent (\`SUM\` of \`amount\`).
Return the \`user_id\` and the total sum as \`total_amount\`. Sort the result by \`user_id\` in ascending order.`,
    xp: 25,
    setup: `
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,1,500),(2,1,700),(3,2,1200),(4,3,300),(5,2,800),(6,3,1500);
    `,
    solution: "SELECT user_id, SUM(amount) AS total_amount FROM orders GROUP BY user_id ORDER BY user_id;",
    hints: ["Use `GROUP BY user_id` and `SUM(amount) AS total_amount`."],
  },
  {
    id: 10,
    tier: "intermediate",
    title: "Aggregate filtering",
    brief: "HAVING filters",
    task: `📚 THEORY:
The WHERE clause filters rows BEFORE they are grouped. To filter groups AFTER they are aggregated, use the HAVING clause.

SYNTAX:
SELECT category, SUM(value) FROM table_name GROUP BY category HAVING SUM(value) > threshold;

🎯 TASK:
Find the users who have spent more than 1000 in total.
Return \`user_id\` and the total sum as \`total_amount\`. Sort by \`total_amount\` descending.`,
    xp: 25,
    setup: `
      CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER);
      INSERT INTO orders VALUES (1,1,500),(2,1,700),(3,2,1200),(4,3,300),(5,2,800),(6,3,1500);
    `,
    solution: "SELECT user_id, SUM(amount) AS total_amount FROM orders GROUP BY user_id HAVING SUM(amount) > 1000 ORDER BY total_amount DESC;",
    hints: ["Filter aggregates with `HAVING`, not `WHERE`."],
  },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export const LEVEL_COUNT_TOTAL = 10;
