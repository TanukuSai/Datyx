export interface TopicExample {
  sql: string;
  explanation: string;
}

export interface TopicPractice {
  question: string;
  sql: string;
  explanation: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  levelsRange: string;
  levelIds: number[];
  learningResources: {
    theory: string;
    examples: TopicExample[];
    practice: TopicPractice;
  };
}

export const TOPICS: Topic[] = [
  {
    id: "topic_1",
    name: "SQL Basics & Filtering",
    description: "Learn how to query tables and filter rows based on specific conditions.",
    levelsRange: "Levels 1–5",
    levelIds: [1, 2, 3, 4, 5],
    learningResources: {
      theory: `### 1. Introduction to Relational Databases
Relational databases store information in structured tables. A **table** represents an entity (such as "users" or "products").
- **Columns (fields):** Define the attributes of the data (e.g., ID, name, price). Each column has a specific data type (INTEGER, TEXT, BOOLEAN, etc.).
- **Rows (records):** Represent individual data entries in the table.
- **Primary Key:** A unique column (or set of columns) that identifies each row (e.g., user_id).

### 2. The SELECT and FROM Clause
To retrieve data, you use the \`SELECT\` statement, which defines *which* columns to show. The \`FROM\` clause specifies *which* table to retrieve them from:
- \`SELECT * FROM users;\` retrieves **every column** and row.
- \`SELECT name, city FROM users;\` retrieves only the **name** and **city** columns, discarding all other attributes.

### 3. Filtering Rows with WHERE
The \`WHERE\` clause acts as a filter, retaining only the rows that satisfy a specific logical condition:
- **Comparison Operators:** You filter data using standard operators:
  - \`=\` (Equal to)
  - \`!=\` or \`<>\` (Not equal to)
  - \`>\`, \`<\` (Greater than, Less than)
  - \`>=\`, \`<=\` (Greater than or equal to, Less than or equal to)
- **Strings vs Numbers:** Numeric values are written directly (e.g., \`price > 1000\`), while string text values **must be enclosed in single quotes** (e.g., \`city = 'Mumbai'\`). Single quotes are a strict SQL standard.

### 4. Combining Conditions (Boolean Logic)
You can build complex filtering rules by combining conditions:
- \`AND\`: Evaluates to true only if **both** conditions are true (e.g., \`price > 100 AND price < 500\`).
- \`OR\`: Evaluates to true if **either** condition is true (e.g., \`city = 'Mumbai' OR city = 'Delhi'\`).
- \`NOT\`: Negates a condition (e.g., \`NOT city = 'Pune'\`).`,
      examples: [
        {
          sql: "SELECT * FROM users;",
          explanation: "Retrieves all columns and rows from the users table."
        },
        {
          sql: "SELECT name, city FROM users WHERE city = 'Delhi';",
          explanation: "Retrieves name and city for users residing in Delhi."
        }
      ],
      practice: {
        question: "How would you query names and cities of users who do NOT live in Mumbai?",
        sql: "SELECT name, city FROM users WHERE city != 'Mumbai';",
        explanation: "The `!=` (or `<>`) operator filters out users whose city is Mumbai."
      }
    }
  },
  {
    id: "topic_2",
    name: "Sorting, Duplicates & Ranges",
    description: "Sort records, limit output sizes, retrieve unique lists, and search ranges.",
    levelsRange: "Levels 6–8",
    levelIds: [6, 7, 8],
    learningResources: {
      theory: `### 1. Sorting Results with ORDER BY
By default, database query results are returned in an arbitrary order. To sort your output, use the \`ORDER BY\` clause followed by the column name:
- **Ascending (ASC):** Sorts smallest-to-largest or A-to-Z. This is the default setting (e.g., \`ORDER BY price;\` is same as \`ORDER BY price ASC;\`).
- **Descending (DESC):** Sorts largest-to-smallest or Z-to-A (e.g., \`ORDER BY price DESC;\`).
- **Multiple Columns:** You can sort by one column, and resolve ties using a second column (e.g., \`ORDER BY city ASC, name DESC;\`).

### 2. Restricting Output with LIMIT
The \`LIMIT\` clause is appended at the very end of a query to restrict the number of rows returned. It is extremely useful for optimization or fetching rankings (e.g., "Top 3 highest items"):
- \`SELECT * FROM products ORDER BY price DESC LIMIT 3;\` sorts products from highest to lowest price and returns only the first three rows.

### 3. Unique Records with DISTINCT
If a column contains duplicate values and you want to retrieve a clean, unique list of entries, prepend the column list with \`DISTINCT\`:
- \`SELECT DISTINCT city FROM users;\` returns each city represented in the users table exactly once, eliminating duplicate rows.

### 4. Range Filters with BETWEEN
The \`BETWEEN\` operator allows you to check if a value falls within a specific range (inclusive of both start and end values):
- \`WHERE price BETWEEN 100 AND 500;\` is equivalent to \`WHERE price >= 100 AND price <= 500;\`.

### 5. Pattern Matching with LIKE
The \`LIKE\` operator performs simple wildcard comparisons, usually on text columns:
- \`%\` (Percent wildcard): Represents **any number of characters** (including zero).
  - \`LIKE 'A%'\` matches anything starting with 'A' (e.g., 'Aditi', 'Aligarh').
  - \`LIKE '%gmail.com'\` matches text ending with '@gmail.com'.
  - \`LIKE '%sql%'\` matches text containing 'sql' anywhere.
- \`_\` (Underscore wildcard): Represents **exactly one character** (e.g., \`LIKE 'J_n'\` matches 'Jon' and 'Jan', but not 'John').`,
      examples: [
        {
          sql: "SELECT DISTINCT city FROM users;",
          explanation: "Finds all unique cities represented in the users table."
        },
        {
          sql: "SELECT * FROM products WHERE price BETWEEN 1000 AND 5000 ORDER BY price DESC LIMIT 3;",
          explanation: "Returns the 3 most expensive products priced between 1,000 and 5,000."
        }
      ],
      practice: {
        question: "How do you query users whose email addresses end with '@datyx.club'?",
        sql: "SELECT * FROM users WHERE email LIKE '%@datyx.club';",
        explanation: "The `%` wildcard matches any characters preceding the specified domain suffix."
      }
    }
  },
  {
    id: "topic_3",
    name: "Aggregates & Grouping",
    description: "Perform mathematical calculations across rows and group summaries.",
    levelsRange: "Levels 9–12",
    levelIds: [9, 10, 11, 12],
    learningResources: {
      theory: `### 1. Aggregate Functions
Aggregates process columns across multiple rows to return a single computed summary value:
- \`COUNT(column)\` / \`COUNT(*)\`: \`COUNT(*)\` counts every row, including null values. \`COUNT(column)\` counts only rows where that specific column is not NULL.
- \`SUM(column)\`: Calculates the mathematical sum of numeric values.
- \`AVG(column)\`: Calculates the arithmetic mean.
- \`MIN(column)\` and \`MAX(column)\`: Retrieves the smallest and largest values.
- **Column Aliasing:** Prepend result headers with \`AS\` to make them clean (e.g., \`SELECT COUNT(*) AS total_records\`).

### 2. Grouping Rows with GROUP BY
The \`GROUP BY\` clause splits your data table into buckets/groups based on matching column values, then applies aggregate functions to each group separately:
- If you run: \`SELECT city, COUNT(*) FROM users GROUP BY city;\`
  1. The database groups rows into matching city buckets.
  2. It runs the \`COUNT(*)\` calculation inside each city bucket separately.
- **Golden Rule:** Every non-aggregated column in your \`SELECT\` clause **must** be listed inside the \`GROUP BY\` clause (e.g., if you select \`city\`, you must group by \`city\`).

### 3. Filtering Summaries with HAVING
The \`WHERE\` clause filters individual source rows *before* they are grouped or aggregated. It cannot look at aggregate scores (e.g., \`WHERE COUNT(*) > 5\` is invalid).
- To filter groups *after* aggregation, you **must** use the \`HAVING\` clause:
  - \`SELECT city, COUNT(*) FROM users GROUP BY city HAVING COUNT(*) > 10;\` (returns only cities with more than 10 users).

### 4. Rounding and Casting decimals
Aggregate functions like \`AVG()\` can output decimal averages. You can clean these up using:
- \`ROUND(value, decimals)\`: Rounds a decimal to specified decimal digits (default is 0 digits).
- \`CAST(value AS type)\`: Converts one data type to another (e.g., \`CAST(AVG(age) AS INTEGER)\` truncates decimals into an integer).`,
      examples: [
        {
          sql: "SELECT COUNT(*) AS total_orders FROM orders;",
          explanation: "Returns the total count of order rows as a single column named total_orders."
        },
        {
          sql: "SELECT user_id, SUM(amount) FROM orders GROUP BY user_id HAVING SUM(amount) > 1000;",
          explanation: "Groups orders by user and filters for users who spent more than 1,000 in total."
        }
      ],
      practice: {
        question: "How do you calculate the average age of users grouped by city, showing only cities with an average age above 20?",
        sql: "SELECT city, AVG(age) FROM users GROUP BY city HAVING AVG(age) > 20;",
        explanation: "Use GROUP BY city to aggregate ages and HAVING to filter based on the average."
      }
    }
  },
  {
    id: "topic_4",
    name: "Multi-table Joins",
    description: "Combine information from multiple tables using primary and foreign keys.",
    levelsRange: "Levels 13–14",
    levelIds: [13, 14],
    learningResources: {
      theory: `### 1. Database Normalization & Keys
To prevent redundancy, databases split related concepts across multiple tables. For instance, user contact details are saved in \`users\`, while their purchases are saved in \`orders\`. 
- **Primary Key:** The main identifier in a table (e.g., \`users.id\`).
- **Foreign Key:** A column in a table that references the primary key of another table (e.g., \`orders.user_id\` references \`users.id\`).

### 2. Combine tables with INNER JOIN
An \`INNER JOIN\` combines records from two tables by looking for rows with matching values in both tables based on a specified key relationship (using the \`ON\` clause):
- \`SELECT users.name, orders.amount FROM users INNER JOIN orders ON orders.user_id = users.id;\`
- Rows that do not have a match in both tables are excluded from the output (e.g., users with no orders will not appear in the results).

### 3. Keep left records with LEFT JOIN
A \`LEFT JOIN\` (or \`LEFT OUTER JOIN\`) retrieves all records from the first ("left") table, and matches them with records from the second ("right") table if they exist:
- \`SELECT users.name, orders.amount FROM users LEFT JOIN orders ON orders.user_id = users.id;\`
- If a user has no orders, their name will still appear in the output, and the columns from the orders table will simply be shown as \`NULL\` (empty).

### 4. Table Aliasing for Clean Code
Typing full table names repeatedly is tedious. You can assign temporary short aliases to tables inside your query:
- \`SELECT u.name, o.amount FROM users u JOIN orders o ON o.user_id = u.id;\` (here \`u\` represents \`users\` and \`o\` represents \`orders\`).`,
      examples: [
        {
          sql: "SELECT u.name, o.amount FROM users u INNER JOIN orders o ON o.user_id = u.id;",
          explanation: "Combines users and orders, listing order amounts alongside the user's name."
        },
        {
          sql: "SELECT u.name, o.amount FROM users u LEFT JOIN orders o ON o.user_id = u.id;",
          explanation: "Lists every user, including users with no orders (whose amount will show as NULL)."
        }
      ],
      practice: {
        question: "How would you join products and categories tables to list product names alongside category names?",
        sql: "SELECT p.name, c.name FROM products p INNER JOIN categories c ON p.category_id = c.id;",
        explanation: "Joins products (p) to categories (c) using the category foreign key mapping."
      }
    }
  },
  {
    id: "topic_5",
    name: "Advanced & Window Functions",
    description: "Implement conditional branching, subqueries, CTEs, and row ranking.",
    levelsRange: "Levels 15–20",
    levelIds: [15, 16, 17, 18, 19, 20],
    learningResources: {
      theory: `### 1. Conditional logic with CASE
The \`CASE\` statement acts like an \`if-then-else\` statement inside your query columns:
\`\`\`sql
SELECT name,
  CASE
    WHEN score >= 90 THEN 'A'
    WHEN score >= 75 THEN 'B'
    ELSE 'C'
  END AS grade
FROM students;
\`\`\`

### 2. Nested Subqueries
A subquery is a query nested inside another query, typically enclosed in parentheses. They can be used inside \`SELECT\`, \`FROM\`, or \`WHERE\` clauses:
- **Scalar Subquery:** Returns a single value (e.g., comparing against average: \`WHERE price > (SELECT AVG(price) FROM products)\`).
- **Set Comparisons:** Returns a column of values to match against (e.g., using \`IN\`: \`WHERE user_id IN (SELECT user_id FROM VIP_users)\`).

### 3. Common Table Expressions (CTEs)
CTEs define temporary, named result sets that are valid only during the execution of that single query. They make highly complex queries much cleaner and readable:
- You declare a CTE using the \`WITH\` clause:
\`\`\`sql
WITH user_totals AS (
  SELECT user_id, SUM(amount) AS total_spent
  FROM orders GROUP BY user_id
)
SELECT u.name, ut.total_spent
FROM users u JOIN user_totals ut ON ut.user_id = u.id;
\`\`\`

### 4. Window Functions
Unlike aggregate functions which collapse multiple rows into a single summary row, **window functions** perform calculations across a set of table rows that are related to the current row, while still preserving individual rows in the output:
- **Syntax:** You define the window partition frame using the \`OVER()\` clause:
  - \`ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank\`
  - \`PARTITION BY\`: Divides rows into groups (similar to GROUP BY but keeps individual rows).
  - \`ORDER BY\`: Defines the evaluation sorting sequence inside each partition bucket.
- **Common window functions:** \`ROW_NUMBER()\` (increments by 1), \`RANK()\` (places tied values on the same rank and skips ranks), \`DENSE_RANK()\` (places tied values on same rank but does not skip), and \`SUM(amount) OVER (ORDER BY id)\` (creates running totals).`,
      examples: [
        {
          sql: "SELECT name, CASE WHEN score >= 50 THEN 'Pass' ELSE 'Fail' END AS result FROM exam_scores;",
          explanation: "Uses conditional logic to label results as Pass or Fail based on the score."
        },
        {
          sql: "SELECT name, salary, ROW_NUMBER() OVER(ORDER BY salary DESC) as rank FROM employees;",
          explanation: "Computes a numeric rank for each employee sorted by salary from highest to lowest."
        }
      ],
      practice: {
        question: "How do you define a Common Table Expression (CTE) to fetch orders above 500 first, and select from it?",
        sql: "WITH large_orders AS (SELECT * FROM orders WHERE amount > 500) SELECT * FROM large_orders;",
        explanation: "The WITH clause defines the CTE expression block, which is then queried directly in the main query."
      }
    }
  }
];

export function getTopicByLevelId(levelId: number): Topic | undefined {
  return TOPICS.find((t) => t.levelIds.includes(levelId));
}

export function isTopicUnlocked(topicId: string, maxActiveTopicId: string): boolean {
  const index = TOPICS.findIndex((t) => t.id === topicId);
  const activeIndex = TOPICS.findIndex((t) => t.id === maxActiveTopicId);
  if (index === -1) return false;
  if (activeIndex === -1) return topicId === "topic_1"; // Default fallback
  return index <= activeIndex;
}
